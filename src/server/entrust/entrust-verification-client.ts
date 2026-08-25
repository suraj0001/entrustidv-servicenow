import { RESTMessageV2 } from "@servicenow/glide/sn_ws";
import { API_VERSION } from "../constants.ts";

export interface EntrustConnection {
  baseUrl: string;
  oauthProfileId: string;
  requestorContext: string;
  requestorId: string;
}

export interface CreateApplicantRequest {
  firstName: string;
  lastName: string;
}

export interface CreateApplicantResult {
  applicantId: string;
}

export interface CreateWorkflowRunRequest {
  applicantId: string;
  workflowId: string;
  expiresAt?: string;
  redirectUrl?: string;
}

export interface CreateWorkflowRunResult {
  workflowRunId: string;
  workflowVersionId: number;
  status: string;
  smartCaptureUrl: string;
}

export function createApplicant(connection: EntrustConnection, input: CreateApplicantRequest): CreateApplicantResult {
  const request = createRequest(connection, "/applicants/");

  request.setRequestBody(
    JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
    }),
  );

  const response = request.execute();
  const statusCode = response.getStatusCode();

  if (statusCode !== 201) {
    throw new Error("Entrust applicant creation failed. HTTP status: " + statusCode);
  }

  const body = JSON.parse(response.getBody());

  if (!body.id) {
    throw new Error("Entrust applicant response did not contain an applicant ID.");
  }

  return {
    applicantId: body.id,
  };
}

export function createWorkflowRun(
  connection: EntrustConnection,
  input: CreateWorkflowRunRequest,
): CreateWorkflowRunResult {
  const request = createRequest(connection, "/workflow_runs/");

  const payload: any = {
    workflow_id: input.workflowId,
    applicant_id: input.applicantId,
  };

  /*
   * Link configuration is optional.
   * Add it only when we actually have values to send.
   */
  if (input.expiresAt || input.redirectUrl) {
    payload.link = {};
    if (input.expiresAt) {
      payload.link.expires_at = input.expiresAt;
    }
    if (input.redirectUrl) {
      payload.link.completed_redirect_url = input.redirectUrl;
      payload.link.expired_redirect_url = input.redirectUrl;
    }
  }

  request.setRequestBody(JSON.stringify(payload));

  const response = request.execute();
  const statusCode = response.getStatusCode();

  if (statusCode !== 201) {
    throw new Error("Entrust workflow run creation failed. HTTP status: " + statusCode);
  }

  const body = JSON.parse(response.getBody());

  if (!body.id || !body.link || !body.link.url) {
    throw new Error("Entrust workflow run response is incomplete.");
  }

  return {
    workflowRunId: body.id,
    workflowVersionId: body.workflow_version_id,
    status: body.status,
    smartCaptureUrl: body.link.url,
  };
}

function createRequest(connection: EntrustConnection, path: string): RESTMessageV2 {
  const request = new RESTMessageV2();
  request.setEndpoint(connection.baseUrl.replace(/\/$/, "") + "/" + API_VERSION + path);
  request.setHttpMethod("post");
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Accept", "application/json");
  request.setAuthenticationProfile("oauth2", connection.oauthProfileId);
  request.setRequestorProfile(connection.requestorContext, connection.requestorId);
  return request;
}
