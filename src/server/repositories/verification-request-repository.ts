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

  const sysId = gr.insert();
  if (!sysId) {
    throw new Error("Unable to create verification request.");
  }
  gs.info("[VerificationRequestRepository] Verification request created: sysId=" + sysId);
  return sysId.toString();
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
  gr.orderByDesc('sys_created_on');
  gr.setLimit(1)

  gr.query();

  if (gr.next()) {
    const status = (gr.getValue("status") as string) || "";
    gs.info(
      "[VerificationRequestRepository] findLatestVerificationStatus: sourceTable=" +
        sourceTable +
        ", sourceRecordId=" +
        sourceRecordId +
        ", foundStatus=" +
        status,
    );
    return {
      workflowRunId: gr.getValue('workflow_run_id',) || '',
      status: gr.getValue('status') || '',
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
): string | null {
  const verificationRequest = new GlideRecord(
    'x_entru_entrustidv_verification_request',
  )

  verificationRequest.addQuery(
    'workflow_run_id',
    workflowRunId,
  )

  verificationRequest.query()

  if (!verificationRequest.next()) {
    return null
  }

  return (
    verificationRequest.getValue(
      'status',
    ) || null
  )
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