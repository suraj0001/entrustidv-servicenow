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

export const ALIAS_NAME = "entrust_idv_api_alias";
export const ALIAS_ID = "x_entru_entrustidv.entrust_idv_api_alias";
export const CONFIG_TABLE = "x_entru_entrustidv_configuration";
export const VERIFICATION_REQUEST_TABLE = "x_entru_entrustidv_verification_request";

export const DEFAULT_WORKFLOW_ID = "4aa50569-b226-4785-b5e1-ee9e30eee7e6";
export const DEFAULT_LINK_EXPIRY_MINUTES = 60;

export const VERIFICATION_REQUEST_CREATED_EVENT = "x_entru_entrustidv.verification.created";

export const IDV_STATUS_FIELD = "x_entru_entrustidv_verification_status";
export const DEFAULT_IDV_STATUS = "Not Started";
