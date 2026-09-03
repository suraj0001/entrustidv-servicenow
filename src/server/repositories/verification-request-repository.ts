import { GlideRecord, gs } from "@servicenow/glide";
import { VERIFICATION_REQUEST_TABLE } from "../constants.ts";

export interface CreateVerificationRequest {
  sourceTable: string;
  sourceRecordId: string;
  subjectUserId: string;
  applicantId: string;
  workflowId: string;
  workflowVersionId: string;
  workflowRunId: string;
  status: string;
}

export interface VerificationRequest {
  sysId: string
  workflowRunId: string
  workflowVersionId: string
  applicantId: string
  status: string
  sourceTable: string
  sourceRecordId: string
  evidenceFolderHref: string
}

export type VerificationStatusRecord = {
  workflowRunId: string
  status: string
  updatedAt?: string
}

export function createVerificationRequest(input: CreateVerificationRequest): string {
  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);
  gr.initialize();
  gr.setValue("source_table", input.sourceTable);
  gr.setValue("source_record", input.sourceRecordId);
  gr.setValue("subject_user", input.subjectUserId);
  gr.setValue("applicant_id", input.applicantId);
  gr.setValue("workflow_id", input.workflowId);
  gr.setValue("workflow_version_id", input.workflowVersionId);
  gr.setValue("workflow_run_id", input.workflowRunId);
  gr.setValue("status", input.status);
  gr.setValue("active", true);

  const sysId = gr.insert();
  if (!sysId) {
    throw new Error("Unable to create verification request.");
  }
  gs.info("[VerificationRequestRepository] Verification request created: sysId=" + sysId);
  return sysId.toString();
}

export function deactivateActiveVerificationRequests(sourceTable: string, sourceRecordId: string): void {
  if (!sourceTable || !sourceRecordId) {
    return;
  }

  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);
  gr.addQuery("source_table", sourceTable);
  gr.addQuery("source_record", sourceRecordId);
  gr.addQuery("active", true);
  gr.query();

  gr.setValue("active", false);
  gr.updateMultiple();

  gs.info(
    "[VerificationRequestRepository] Deactivated previous verification requests: sourceTable=" +
      sourceTable +
      ", sourceRecordId=" +
      sourceRecordId,
  );
}

export function findVerificationRequestById(sysId: string): GlideRecord | null {
  if (!sysId) {
    return null;
  }
  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);

  gr.get(sysId);

  if (!gr.isValidRecord()) {
    return null;
  }

  return gr;
}

export function findVerificationRequestByWorkflowRunId(
  workflowRunId: string,
): VerificationRequest | null {
  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);

  gr.addQuery('workflow_run_id', workflowRunId)
  gr.setLimit(1)
  gr.query()

  if (!gr.next()) {
    return null
  }

  return {
    sysId: gr.getUniqueValue(),
    workflowRunId: gr.getValue('workflow_run_id') ?? '',
    workflowVersionId: gr.getValue('workflow_version_id') ?? '',
    applicantId: gr.getValue('applicant_id') ?? '',
    status: gr.getValue('status') ?? '',
    sourceTable: gr.getValue('source_table') ?? '',
    sourceRecordId: gr.getValue('source_record') ?? '',
    evidenceFolderHref: gr.getValue('evidence_folder_href') ?? '',
  }
}

export function findLatestVerificationStatus(sourceTable: string, sourceRecordId: string): VerificationStatusRecord | null {
  if (!sourceTable || !sourceRecordId) {
    return null;
  }

  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);
  gr.addQuery("source_table", sourceTable);
  gr.addQuery("source_record", sourceRecordId);
  gr.addQuery("active", true);
  gr.orderByDesc('sys_created_on');
  gr.setLimit(1)

  gr.query();

  if (gr.next()) {
    const status = (gr.getValue("status") as string) || "";
    const updatedAt =
      (gr.getValue("sys_updated_on") as string) ||
      (gr.getValue("sys_created_on") as string) ||
      "";
    gs.info(
      "[VerificationRequestRepository] findLatestVerificationStatus: sourceTable=" +
        sourceTable +
        ", sourceRecordId=" +
        sourceRecordId +
        ", foundStatus=" +
        status +
        ", updatedAt=" +
        updatedAt,
    );
    return {
      workflowRunId: gr.getValue('workflow_run_id') || '',
      status: gr.getValue('status') || '',
      updatedAt,
    }
  }

  gs.info(
    "[VerificationRequestRepository] findLatestVerificationStatus: no verification request found for sourceTable=" +
      sourceTable +
      ", sourceRecordId=" +
      sourceRecordId,
  );
  return null;
}

export function findVerificationStatusByWorkflowRunId(
  workflowRunId: string,
): VerificationStatusRecord | null {
  const verificationRequest = new GlideRecord(
    VERIFICATION_REQUEST_TABLE,
  )

  verificationRequest.addQuery(
    'workflow_run_id',
    workflowRunId,
  )

  verificationRequest.query()

  if (!verificationRequest.next()) {
    return null
  }

  const updatedAt =
    (verificationRequest.getValue('sys_updated_on') as string) ||
    (verificationRequest.getValue('sys_created_on') as string) ||
    ''

  return {
    workflowRunId: verificationRequest.getValue('workflow_run_id') || '',
    status: verificationRequest.getValue('status') || '',
    updatedAt,
  }
}

export function updateStatusByWorkflowRunId(
  workflowRunId: string,
  status: string,
): void {
  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE)

    gr.addQuery('workflow_run_id', workflowRunId)
    gr.setLimit(1)
    gr.query()

    if (!gr.next()) {
        gs.warn(
            `[VerificationRequestRepository] No verification request found ` +
                `for workflow_run_id=${workflowRunId}`
        )
        return
    }

    gr.setValue('status', status)
    gr.update()

    gs.info(
        `[VerificationRequestRepository] Status updated ` +
            `workflow_run_id=${workflowRunId}, status=${status}`
    )
}

export function updateEvidenceFolderHrefByWorkflowRunId(
  workflowRunId: string,
  evidenceFolderHref: string,
): void {
  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE)

    gr.addQuery('workflow_run_id', workflowRunId)
    gr.setLimit(1)
    gr.query()

    if (!gr.next()) {
        gs.warn(
            `[VerificationRequestRepository] No verification request found ` +
                `for workflow_run_id=${workflowRunId}`
        )
        return
    }

    gr.setValue(
        'evidence_folder_href',
        evidenceFolderHref
    )

    gr.update()

    gs.info(
        `[VerificationRequestRepository] Evidence folder href updated ` +
            `workflow_run_id=${workflowRunId}`
    )
}