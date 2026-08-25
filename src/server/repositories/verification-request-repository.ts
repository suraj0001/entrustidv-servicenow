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

export function findVerificationStatus(sourceTable: string, sourceRecordId: string): string {
  if (!sourceTable || !sourceRecordId) {
    return "";
  }

  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);
  gr.addQuery("source_table", sourceTable);
  gr.addQuery("source_record", sourceRecordId);
  gr.query();

  if (gr.next()) {
    const status = (gr.getValue("status") as string) || "";
    gs.info(
      "[VerificationRequestRepository] findVerificationStatus: sourceTable=" +
        sourceTable +
        ", sourceRecordId=" +
        sourceRecordId +
        ", foundStatus=" +
        status,
    );
    return status;
  }

  gs.info(
    "[VerificationRequestRepository] findVerificationStatus: no verification request found for sourceTable=" +
      sourceTable +
      ", sourceRecordId=" +
      sourceRecordId,
  );
  return "";
}

export function updateVerificationStatusByWorkflowRunId(
  workflowRunId: string,
  status: string,
): boolean {
  if (!workflowRunId || !status) {
    return false;
  }

  const gr = new GlideRecord(VERIFICATION_REQUEST_TABLE);

  gr.addQuery("workflow_run_id", workflowRunId);
  gr.query();

  if (!gr.next()) {
    return false;
  }

  gr.setValue("status", status);

  return Boolean(gr.update());
}
