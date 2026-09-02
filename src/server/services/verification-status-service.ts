import {
  findVerificationStatusByWorkflowRunId,
  findLatestVerificationStatus,
} from '../repositories/verification-request-repository.ts'

type StatusConfig = {
  displayStatus: string
  shouldPoll: boolean
}

export type VerificationStatusResult = {
  workflowRunId: string | null
  status: string
  displayStatus: string
  shouldPoll: boolean
}

const STATUS_CONFIG: Record<
  string,
  StatusConfig
> = {
  not_started: {
    displayStatus: 'Not Started',
    shouldPoll: false,
  },

  awaiting: {
    displayStatus: 'Pending',
    shouldPoll: true,
  },

  pending: {
    displayStatus: 'Pending',
    shouldPoll: true,
  },

  processing: {
    displayStatus: 'In Process',
    shouldPoll: true,
  },

  awaiting_input: {
    displayStatus: 'In Progress',
    shouldPoll: true,
  },

  review: {
    displayStatus: 'Review Required',
    shouldPoll: false,
  },

  approved: {
    displayStatus: 'Approved',
    shouldPoll: false,
  },

  declined: {
    displayStatus: 'Declined',
    shouldPoll: false,
  },

  abandoned: {
    displayStatus: 'Abandoned',
    shouldPoll: false,
  },

  error: {
    displayStatus: 'Error',
    shouldPoll: false,
  },
}

export function getLatestVerificationStatus(
  sourceTable: string,
  sourceSysId: string,
): VerificationStatusResult {
  const verification =
    findLatestVerificationStatus(
      sourceTable,
      sourceSysId,
    )

  if (!verification) {
    return {
      workflowRunId: null,
      status: 'not_started',
      displayStatus: 'Not Started',
      shouldPoll: false,
    }
  }

  const result = buildStatusResult(
    verification.status,
  )

  return {
    workflowRunId:
      verification.workflowRunId || null,

    status: result.status,
    displayStatus: result.displayStatus,

    // We cannot poll a specific verification
    // without its workflow run id.
    shouldPoll:
      Boolean(verification.workflowRunId) &&
      result.shouldPoll,
  }
}

export function getVerificationStatusByWorkflowRunId(
  workflowRunId: string,
): VerificationStatusResult | null {
  const storedRecord =
    findVerificationStatusByWorkflowRunId(
      workflowRunId,
    )

  if (storedRecord === null) {
    return null
  }

  const result =
    buildStatusResult(
      storedRecord.status,
    )

  return {
    workflowRunId,
    status: result.status,
    displayStatus: result.displayStatus,
    shouldPoll: result.shouldPoll,
  }
}

function buildStatusResult(
  storedStatus: string | null | undefined,
): {
  status: string
  displayStatus: string
  shouldPoll: boolean
} {
  const status =
    normalizeStatus(storedStatus)

  const config =
    STATUS_CONFIG[status]

  const displayStatus = config
    ? config.displayStatus
    : toDisplayStatus(status)

  const shouldPoll = config
    ? config.shouldPoll
    : true

  if (config) {
    return {
      status,
      displayStatus,
      shouldPoll,
    }
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
  }
}

function normalizeStatus(
  status: string | null | undefined,
): string {
  if (!status) {
    return 'not_started'
  }

  return String(status)
    .trim()
    .toLowerCase()
}

function toDisplayStatus(
  status: string,
): string {
  return status
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      function (character) {
        return character.toUpperCase()
      },
    )
}