export const API_VERSION = "v3.6";

export const SUPPORTED_REGIONS = ["us", "eu", "ca"] as const;
export type EntrustRegion = (typeof SUPPORTED_REGIONS)[number];

export const BASE_URLS: Record<EntrustRegion, string> = {
  eu: "https://api.eu.onfido.com",
  us: "https://api.us.onfido.com",
  ca: "https://api.ca.onfido.com",
};

export const MIN_LEN = 5;
export const MAX_LEN = 255;

// Must match webhook_signing_secret.maxLength in idv-configuration.now.ts
export const WEBHOOK_TOKEN_MIN_LEN = 5;
export const WEBHOOK_TOKEN_MAX_LEN = 100;

export const ALIAS_NAME = "entrust_idv_api_alias";
export const ALIAS_ID = "x_entru_entrustidv.entrust_idv_api_alias";
export const CONFIG_TABLE = "x_entru_entrustidv_configuration";
export const VERIFICATION_REQUEST_TABLE = "x_entru_entrustidv_verification_request";

export const DEFAULT_LINK_EXPIRY_MINUTES = 60;

export const VERIFICATION_REQUEST_CREATED_EVENT = "x_entru_entrustidv.verification.created";

export const IDV_STATUS_FIELD = "x_entru_entrustidv_verification_status";
export const DEFAULT_IDV_STATUS = "Not Started";
export const MAX_VERIFICATION_REQUESTS = 3;

// Activity Messages
export const ACTIVITY_MESSAGES = {
  VERIFICATION_REQUESTED: "Identity verification requested. Verification link sent to the user.",
  REVERIFICATION_REQUESTED: "Identity reverification requested. Verification link sent to the user.",
  REVERIFICATION_REQUESTED_AGAIN: "Identity reverification requested again. Verification link sent to the user.",
  EVIDENCE_FOLDER_CREATED: "Identity verification evidence folder created.",
  OUTCOME_APPROVED: "Identity verification completed.\nOutcome: Approved",
  OUTCOME_REVIEW: "Identity verification completed.\nOutcome: Manual review required",
  OUTCOME_DECLINED: "Identity verification completed.\nOutcome: Declined",
  OUTCOME_ABANDONED: "Identity verification ended.\nOutcome: Abandoned",
  OUTCOME_ERROR: "Identity verification could not be completed.\nOutcome: Error",
  OUTCOME_DEFAULT: "Identity verification completed.",
  STALE_WORKFLOW_RUN: "⚠ A previous verification link was used. Please ask the user to use the latest verification link.",
} as const;

// Common User Facing / Response Messages
export const RESPONSE_MESSAGES = {
  VERIFICATION_STARTED: "Identity verification started.",
  VERIFICATION_START_FAILED: "Failed to start identity verification.",
  SOURCE_RECORD_MISSING: "Source record information is missing.",
  CONFIG_INCOMPLETE: "Verification configuration is not complete. Please contact your administrator.",
  CONNECTION_NOT_CONFIGURED: "Entrust API connection is not configured.",
  MAX_REQUESTS_REACHED: (max: number) => `Maximum number of identity verification requests (${max}) has been reached for this record.`,
} as const;
