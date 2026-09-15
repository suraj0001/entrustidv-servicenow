import { gs, GlideDateTime } from "@servicenow/glide";
import {
  findVerificationStatusByWorkflowRunId,
  findLatestVerificationStatus,
  updateStatusByWorkflowRunId,
  updateLastStatusSyncByWorkflowRunId,
  type VerificationStatusRecord,
} from "../repositories/verification-request-repository.ts";
import { ApiConnectionRepository } from "../repositories/connection-credential-repository.ts";
import { getWorkflowRun } from "../entrust/entrust-verification-client.ts";
import { addWorkNote, getCompletionActivityMessage } from "./activity-service.ts";

// Minimum grace period (in minutes) before fallback polling starts doubting the webhook.
const GRACE_PERIOD_MINUTES = 60;
// Throttle period (in minutes) to prevent redundant outbound calls on repeated checks.
const THROTTLE_MINUTES = 5;

type StatusConfig = {
  displayStatus: string;
  shouldPoll: boolean;
};

export type VerificationStatusResult = {
  workflowRunId: string | null;
  status: string;
  displayStatus: string;
  shouldPoll: boolean;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  not_started: {
    displayStatus: "Not Started",
    shouldPoll: false,
  },

  awaiting: {
    displayStatus: "Pending",
    shouldPoll: true,
  },

  pending: {
    displayStatus: "Pending",
    shouldPoll: true,
  },

  processing: {
    displayStatus: "In Process",
    shouldPoll: true,
  },

  awaiting_input: {
    displayStatus: "In Progress",
    shouldPoll: true,
  },

  awaiting_client_input: {
    displayStatus: "In Progress",
    shouldPoll: true,
  },

  review: {
    displayStatus: "Review Required",
    shouldPoll: false,
  },

  approved: {
    displayStatus: "Approved",
    shouldPoll: false,
  },

  declined: {
    displayStatus: "Declined",
    shouldPoll: false,
  },

  abandoned: {
    displayStatus: "Abandoned",
    shouldPoll: false,
  },

  error: {
    displayStatus: "Error",
    shouldPoll: false,
  },
};

export function getLatestVerificationStatus(
  sourceTable: string,
  sourceSysId: string,
): VerificationStatusResult {
  const verification = findLatestVerificationStatus(sourceTable, sourceSysId);

  if (!verification) {
    return {
      workflowRunId: null,
      status: "not_started",
      displayStatus: "Not Started",
      shouldPoll: false,
    };
  }

  // Check if fallback reconciliation with Entrust is warranted
  const currentStatus = syncWithEntrustIfDoubtful(verification);

  const result = buildStatusResult(currentStatus);

  return {
    workflowRunId: verification.workflowRunId || null,

    status: result.status,
    displayStatus: result.displayStatus,

    // We cannot poll a specific verification
    // without its workflow run id.
    shouldPoll: Boolean(verification.workflowRunId) && result.shouldPoll,
  };
}

export function getVerificationStatusByWorkflowRunId(
  workflowRunId: string,
): VerificationStatusResult | null {
  const storedRecord = findVerificationStatusByWorkflowRunId(workflowRunId);

  if (storedRecord === null) {
    return null;
  }

  // If the record was deactivated (e.g. by reverification), stop polling immediately
  if (storedRecord.active === false) {
    const result = buildStatusResult(storedRecord.status);
    return {
      workflowRunId,
      status: result.status,
      displayStatus: result.displayStatus,
      shouldPoll: false,
    };
  }

  // Check if fallback reconciliation with Entrust is warranted
  const currentStatus = syncWithEntrustIfDoubtful(storedRecord);

  const result = buildStatusResult(currentStatus);

  return {
    workflowRunId,
    status: result.status,
    displayStatus: result.displayStatus,
    shouldPoll: result.shouldPoll,
  };
}

/**
 * Smart Fallback Check:
 * If the record is still in a non-terminal state and past the grace period (or link expiry),
 * queries Entrust directly via outbound REST to reconcile status in case webhooks were blocked/missed.
 *
 * NOTE: Status update and completion work notes are applied ONLY when Entrust returns a terminal status.
 */
function syncWithEntrustIfDoubtful(record: VerificationStatusRecord): string {
  if (!record.workflowRunId || record.active === false) {
    return record.status;
  }

  const normalized = normalizeStatus(record.status);
  const config = STATUS_CONFIG[normalized];

  // If local record is already terminal, no fallback check is needed.
  if (config && !config.shouldPoll) {
    return record.status;
  }

  if (!shouldTriggerFallbackSync(record)) {
    return record.status;
  }

  try {
    const connection = new ApiConnectionRepository().getRuntimeConnection();
    if (!connection) {
      gs.warn(
        `[VerificationStatusService] Fallback polling skipped: runtime connection not configured for workflowRunId=${record.workflowRunId}`,
      );
      return record.status;
    }

    gs.info(
      `[VerificationStatusService] Calling Entrust API (GET /workflow_runs/${record.workflowRunId}) to fetch latest status`,
    );

    const remoteRun = getWorkflowRun(connection, record.workflowRunId);
    if (!remoteRun || !remoteRun.status) {
      gs.warn(
        `[VerificationStatusService] Fallback polling received empty response for workflowRunId=${record.workflowRunId}`,
      );
      return record.status;
    }

    const remoteNormalized = normalizeStatus(remoteRun.status);
    const remoteConfig = STATUS_CONFIG[remoteNormalized];
    const isRemoteTerminal = remoteConfig ? !remoteConfig.shouldPoll : false;

    gs.info(
      `[VerificationStatusService] Entrust API returned status='${remoteRun.status}' (isTerminal=${isRemoteTerminal}) for workflowRunId=${record.workflowRunId}`,
    );

    // Always update last_status_sync to current timestamp to guarantee throttle window
    updateLastStatusSyncByWorkflowRunId(record.workflowRunId, new GlideDateTime().getValue());

    // Update database and log completion activity work notes ONLY when status is terminal
    if (isRemoteTerminal) {
      updateStatusByWorkflowRunId(record.workflowRunId, remoteRun.status);

      if (record.sourceTable && record.sourceRecordId) {
        addWorkNote(
          record.sourceTable,
          record.sourceRecordId,
          getCompletionActivityMessage(remoteRun.status),
        );
      }

      gs.info(
        `[VerificationStatusService] Fallback polling updated record to terminal status='${remoteRun.status}' and added work note for workflowRunId=${record.workflowRunId}`,
      );
    } else {
      gs.info(
        `[VerificationStatusService] Workflow run is still in-progress ('${remoteRun.status}') in Entrust. Throttling next check for ${THROTTLE_MINUTES} minutes for workflowRunId=${record.workflowRunId}`,
      );
    }

    return remoteRun.status;
  } catch (error: any) {
    gs.error(
      `[VerificationStatusService] Fallback polling error for workflowRunId=${record.workflowRunId}: ${error?.message || error}`,
    );
    return record.status;
  }
}

function shouldTriggerFallbackSync(record: VerificationStatusRecord): boolean {
  const createdGdt = record.sysCreatedOn ? new GlideDateTime(record.sysCreatedOn) : null;
  const lastSyncGdt = record.lastSyncFromEntrust
    ? new GlideDateTime(record.lastSyncFromEntrust)
    : record.sysUpdatedOn
      ? new GlideDateTime(record.sysUpdatedOn)
      : createdGdt;

  if (!createdGdt) {
    return false;
  }

  const nowGdt = new GlideDateTime();
  const minutesSinceCreated =
    (nowGdt.getNumericValue() - createdGdt.getNumericValue()) / (60 * 1000);
  const minutesSinceLastSync = lastSyncGdt
    ? (nowGdt.getNumericValue() - lastSyncGdt.getNumericValue()) / (60 * 1000)
    : minutesSinceCreated;

  const expiresAtGdt = new GlideDateTime(record.expiresAt);
  const linkHasExpired = nowGdt.getNumericValue() >= expiresAtGdt.getNumericValue();

  // 1. If link has expired, doubt is absolute -> synchronize immediately (unless throttled)
  if (linkHasExpired) {
    if (record.lastSyncFromEntrust && minutesSinceLastSync < THROTTLE_MINUTES) {
      gs.info(
        `[VerificationStatusService] Link expired (expiresAt=${record.expiresAt}) for workflowRunId=${record.workflowRunId}, but throttled (${minutesSinceLastSync.toFixed(1)} mins < ${THROTTLE_MINUTES} mins since last check).`,
      );
      return false;
    }

    gs.info(
      `[VerificationStatusService] Fallback polling triggered due to Link Expiry: workflowRunId=${record.workflowRunId}, expiresAt=${record.expiresAt}`,
    );
    return true;
  }

  // 2. If within the 20-minute user grace period, trust the webhook -> do not call Entrust
  if (minutesSinceCreated < GRACE_PERIOD_MINUTES) {
    gs.info(
      `[VerificationStatusService] Within grace period (${minutesSinceCreated.toFixed(1)} mins < ${GRACE_PERIOD_MINUTES} mins) for workflowRunId=${record.workflowRunId}. Relying on webhook.`,
    );
    return false;
  }

  // 3. Past 20 minutes: webhook is doubted -> check Entrust if not synced within the last 5 minutes
  if (record.lastSyncFromEntrust && minutesSinceLastSync < THROTTLE_MINUTES) {
    gs.info(
      `[VerificationStatusService] Past grace period (${minutesSinceCreated.toFixed(1)} mins) for workflowRunId=${record.workflowRunId}, but throttled (${minutesSinceLastSync.toFixed(1)} mins < ${THROTTLE_MINUTES} mins since last check).`,
    );
    return false;
  }

  gs.info(
    `[VerificationStatusService] Fallback polling triggered after grace period: workflowRunId=${record.workflowRunId}, minutesSinceCreated=${minutesSinceCreated.toFixed(1)}, minutesSinceLastCheck=${minutesSinceLastSync.toFixed(1)}`,
  );
  return true;
}

function buildStatusResult(storedStatus: string | null | undefined): {
  status: string;
  displayStatus: string;
  shouldPoll: boolean;
} {
  const status = normalizeStatus(storedStatus);

  const config = STATUS_CONFIG[status];

  const displayStatus = config ? config.displayStatus : toDisplayStatus(status);

  const shouldPoll = config ? config.shouldPoll : true;

  if (config) {
    return {
      status,
      displayStatus,
      shouldPoll,
    };
  }

  /*
   * Unknown Entrust status:
   * assume non-terminal and continue polling.
   *
   * The client-side polling timeout prevents
   * polling forever.
   */
  return {
    status,
    displayStatus,
    shouldPoll: true,
  };
}

function normalizeStatus(status: string | null | undefined): string {
  if (!status) {
    return "not_started";
  }

  return String(status).trim().toLowerCase();
}

function toDisplayStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, function (character) {
    return character.toUpperCase();
  });
}
