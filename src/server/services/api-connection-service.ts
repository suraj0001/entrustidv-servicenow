import { gs } from "@servicenow/glide";
import {
  isSupportedRegion,
  type SaveConfigInput,
  validateSaveInput,
} from "../admin-setup-pages/api-connection-validator.ts";
import { API_VERSION, BASE_URLS, type EntrustRegion } from "../constants.ts";
import { type EntrustConnectionTestResult, testEntrustConnection } from "../entrust/entrust-auth-client.ts";
import {
  type AliasRecord,
  ApiConnectionRepository,
  type HttpConnectionRecord,
  type OAuthCredentialRecord,
  type OAuthEntityRecord,
} from "../repositories/connection-credential-repository.ts";

export interface GetConfigResult {
  success: boolean;
  region?: string;
  baseUrl?: string;
  tokenUrl?: string;
  connectionTested?: boolean;
  message?: string;
}

export interface AliasInfoResult {
  success: boolean;
  aliasSysId?: string;
  hasConnection?: boolean;
  message?: string;
}

export interface SaveConfigResult {
  success: boolean;
  message: string;
}

interface ConnectionSetupState {
  alias: AliasRecord;

  connection: HttpConnectionRecord | null;

  credential: OAuthCredentialRecord | null;

  oauthEntity: OAuthEntityRecord | null;
}

const repo = new ApiConnectionRepository();

// -------------------------------------------------------------------------
// URL helpers
// -------------------------------------------------------------------------

function tokenUrl(region: EntrustRegion): string {
  const base = BASE_URLS[region].replace(/\/+$/, "");

  return base + "/" + API_VERSION + "/oauth/token";
}

// -------------------------------------------------------------------------
// Setup-state resolution
// -------------------------------------------------------------------------

/**
 * Loads the complete structural Connection & Credential chain.
 *
 * This function NEVER creates or updates records.
 */
function loadConnectionSetupState(): ConnectionSetupState | null {
  const alias = repo.findAlias();

  if (!alias) {
    gs.warn("[ApiConnection] " + "loadConnectionSetupState: " + "alias not found");

    return null;
  }

  const connection = repo.findHttpConnection(alias.sysId);

  /*
   * The credential actually attached to the HTTP connection
   * is authoritative for runtime resolution.
   */
  let credential: OAuthCredentialRecord | null = null;

  if (connection && connection.credentialSysId) {
    credential = repo.findOAuthCredentialById(connection.credentialSysId);
  }

  /*
   * Fallback for configuration/template variations where
   * credential_alias exists but the HTTP connection lookup
   * didn't provide the credential reference.
   *
   * saveConnectionDetails() will still require the credential
   * to actually be attached to the HTTP connection.
   */
  if (!credential) {
    credential = repo.findOAuthCredentialByAlias(alias.sysId);
  }

  const oauthEntity = credential ? repo.findOAuthEntity(credential.sysId) : null;

  return {
    alias,
    connection,
    credential,
    oauthEntity,
  };
}

// -------------------------------------------------------------------------
// Structural validation
// -------------------------------------------------------------------------

function isConnectionStructureReady(): boolean {
  const state = loadConnectionSetupState();

  if (!state) {
    return false;
  }

  return !!(state.connection && state.connection.credentialSysId && state.credential && state.oauthEntity);
}

// -------------------------------------------------------------------------
// Save runtime configuration
// -------------------------------------------------------------------------

/**
 * Updates CUSTOMER/RUNTIME OAuth values only.
 *
 * No Connection/Credential/OAuth records are created here.
 *
 * Application installation/configuration-template provisioning is
 * responsible for creating the complete structural chain.
 */
function saveConnectionDetails(input: SaveConfigInput): boolean {
  const state = loadConnectionSetupState();

  if (!state) {
    gs.error("[ApiConnection] " + "saveConnectionDetails: " + "Connection & Credential Alias is missing");

    return false;
  }

  if (!state.connection) {
    gs.error("[ApiConnection] " + "saveConnectionDetails: " + "Entrust IDV HTTP connection is missing");

    return false;
  }

  if (!state.connection.credentialSysId) {
    gs.error(
      "[ApiConnection] " + "saveConnectionDetails: " + "OAuth credential is not attached " + "to the HTTP connection",
    );

    return false;
  }

  if (!state.credential) {
    gs.error("[ApiConnection] " + "saveConnectionDetails: " + "Entrust IDV OAuth credential is missing");

    return false;
  }

  if (!state.oauthEntity) {
    gs.error("[ApiConnection] " + "saveConnectionDetails: " + "OAuth Entity/Profile configuration is missing");

    return false;
  }

  /*
   * Ensure the credential we resolved is the credential
   * actually attached to the HTTP connection.
   *
   * We cannot repair http_connection at runtime because
   * that table is protected from scoped writes.
   */
  if (state.connection.credentialSysId !== state.credential.sysId) {
    gs.error(
      "[ApiConnection] " + "saveConnectionDetails: " + "HTTP connection is attached to an unexpected credential",
    );

    return false;
  }

  const normalisedRegion = input.region.toLowerCase();

  if (!isSupportedRegion(normalisedRegion)) {
    gs.error("[ApiConnection] " + "saveConnectionDetails: " + "unsupported region=" + input.region);

    return false;
  }

  const region = normalisedRegion as EntrustRegion;

  const oauthTokenUrl = tokenUrl(region);

  gs.info(
    "[ApiConnection] " + "saveConnectionDetails: " + "updating existing OAuth entity sysId=" + state.oauthEntity.sysId,
  );

  /*
   * Only runtime/customer-owned values are changed.
   *
   * We intentionally DO NOT write http_connection.
   */
  const updated = repo.updateOAuthCredentials(
    state.oauthEntity.sysId,
    input.clientId,
    input.clientSecret,
    oauthTokenUrl,
  );

  if (!updated) {
    gs.error("[ApiConnection] " + "saveConnectionDetails: " + "OAuth credentials were not updated");

    return false;
  }

  gs.info("[ApiConnection] " + "saveConnectionDetails: " + "OAuth credentials updated successfully");

  return true;
}

// -------------------------------------------------------------------------
// Read configuration
// -------------------------------------------------------------------------

export function getConfig(): GetConfigResult {
  try {
    const config = repo.findConfiguration();

    /*
     * Structural records existing alone does NOT mean
     * the customer has configured the integration.
     *
     * Region is written only after our custom setup page
     * successfully saves the runtime OAuth values.
     */
    const configured = !!config && !!config.region && isConnectionStructureReady();

    if (!config) {
      return {
        success: true,

        connectionTested: false,
      };
    }

    const region = config.region.toLowerCase();

    const supported = isSupportedRegion(region);

    const base = supported ? BASE_URLS[region as EntrustRegion] : "";

    return {
      success: true,

      region: config.region,

      baseUrl: base,

      tokenUrl: supported ? tokenUrl(region as EntrustRegion) : "",

      connectionTested: configured,
    };
  } catch (err) {
    gs.error("[ApiConnection] " + "getConfig: " + String(err));

    return {
      success: false,

      message: "Failed to load configuration: " + String(err),
    };
  }
}

// -------------------------------------------------------------------------
// Alias / structural setup information
// -------------------------------------------------------------------------

export function getAliasInfo(): AliasInfoResult {
  try {
    const alias = repo.findAlias();

    if (!alias) {
      return {
        success: false,

        message: "Connection alias not found.",
      };
    }

    const connection = repo.findHttpConnection(alias.sysId);

    return {
      success: true,

      aliasSysId: alias.sysId,

      hasConnection: !!connection,
    };
  } catch (err) {
    gs.error("[ApiConnection] " + "getAliasInfo: " + String(err));

    return {
      success: false,

      message: "Failed to look up connection alias: " + String(err),
    };
  }
}

// -------------------------------------------------------------------------
// Save
// -------------------------------------------------------------------------

export function saveConfig(input: SaveConfigInput): SaveConfigResult {
  const validationError = validateSaveInput(input);

  if (validationError) {
    return {
      success: false,

      message: validationError,
    };
  }

  gs.info(
    "[ApiConnection] " +
      "saveConfig: region=" +
      input.region +
      " hasClientId=" +
      !!input.clientId +
      " hasClientSecret=" +
      !!input.clientSecret,
  );

  try {
    const saved = saveConnectionDetails(input);

    if (!saved) {
      return {
        success: false,

        message: "Failed to save connection configuration.",
      };
    }

    /*
     * Region is our runtime source of truth for the
     * Entrust API endpoint.
     *
     * http_connection.connection_url remains untouched.
     */
    repo.saveRegion(input.region);

    gs.info("[ApiConnection] " + "saveConfig: configuration saved successfully");

    return {
      success: true,

      message: "Configuration saved.",
    };
  } catch (err) {
    gs.error("[ApiConnection] " + "saveConfig: unexpected error: " + String(err));

    return {
      success: false,

      message: "Failed to save configuration: " + String(err),
    };
  }
}

// -------------------------------------------------------------------------
// Test connection
// -------------------------------------------------------------------------

export function testConnection(region: string, clientId: string, clientSecret: string): EntrustConnectionTestResult {
  if (!region || !clientId || !clientSecret) {
    return {
      success: false,

      message: "Region, Client ID and Client Secret are all required.",
    };
  }

  const normalised = region.toLowerCase();

  if (!isSupportedRegion(normalised)) {
    return {
      success: false,

      message: "Unsupported region: " + region,
    };
  }

  return testEntrustConnection(normalised as EntrustRegion, clientId, clientSecret);
}
