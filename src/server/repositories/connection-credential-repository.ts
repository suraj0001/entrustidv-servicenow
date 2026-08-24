import { GlideRecord, gs } from "@servicenow/glide";
import { ConnectionProvider } from "@servicenow/glide/sn_cc";

import { ALIAS_ID, BASE_URLS, CONFIG_TABLE, type EntrustRegion } from "../constants.ts";

export interface ConfigRecord {
  sysId: string;
  region: string;
}

export interface AliasRecord {
  sysId: string;
}

export interface HttpConnectionRecord {
  sysId: string;
  credentialSysId: string;
  connectionUrl: string;
}

export interface OAuthCredentialRecord {
  sysId: string;
}

export interface OAuthEntityRecord {
  sysId: string;
  profileSysId: string;
}

export interface RuntimeConnectionInfo {
  baseUrl: string;
  credentialSysId: string;
}

export interface EntrustRuntimeConnection {
  baseUrl: string;
  oauthProfileId: string;
  requestorContext: string;
  requestorId: string;
}

/**
 * Gets a record by sys_id.
 */
function getRecord(table: string, sysId: string): GlideRecord | null {
  if (!sysId) {
    return null;
  }

  const gr = new GlideRecord(table);

  gr.get(sysId);

  return gr.isValidRecord() ? gr : null;
}

export class ApiConnectionRepository {
  // ---------------------------------------------------------------------
  // Application configuration
  // ---------------------------------------------------------------------

  findConfiguration(): ConfigRecord | null {
    const gr = new GlideRecord(CONFIG_TABLE);

    gr.setLimit(1);
    gr.query();

    if (!gr.next()) {
      return null;
    }

    return {
      sysId: gr.getUniqueValue(),

      region: (gr.getValue("region") as string) || "",
    };
  }

  saveRegion(region: string): void {
    const gr = new GlideRecord(CONFIG_TABLE);

    gr.setLimit(1);
    gr.query();

    if (gr.next()) {
      const currentRegion = (gr.getValue("region") as string) || "";

      if (currentRegion !== region) {
        gr.setValue("region", region);

        gr.update();
      }

      return;
    }

    gr.initialize();

    gr.setValue("region", region);

    gr.insert();
  }

  // ---------------------------------------------------------------------
  // Alias
  // ---------------------------------------------------------------------

  findAlias(): AliasRecord | null {
    const gr = new GlideRecord("sys_alias");

    gr.addQuery("id", ALIAS_ID);

    gr.setLimit(1);
    gr.query();

    if (!gr.next()) {
      return null;
    }

    return {
      sysId: gr.getUniqueValue(),
    };
  }

  // ---------------------------------------------------------------------
  // HTTP Connection
  // ---------------------------------------------------------------------

  /**
   * The HTTP connection is application infrastructure.
   *
   * It is created by the configuration template / application installation.
   * Runtime code only reads it.
   *
   * IMPORTANT:
   * http_connection uses "connection_alias", not "credential_alias".
   */
  findHttpConnection(aliasSysId: string): HttpConnectionRecord | null {
    const gr = new GlideRecord("http_connection");

    gr.addQuery("connection_alias", aliasSysId);

    gr.setLimit(1);
    gr.query();

    if (!gr.next()) {
      return null;
    }

    return {
      sysId: gr.getUniqueValue(),

      credentialSysId: (gr.getValue("credential") as string) || "",

      connectionUrl: (gr.getValue("connection_url") as string) || "",
    };
  }

  // ---------------------------------------------------------------------
  // OAuth Credential
  // ---------------------------------------------------------------------

  findOAuthCredentialByAlias(aliasSysId: string): OAuthCredentialRecord | null {
    const gr = new GlideRecord("oauth_2_0_credentials");

    gr.addQuery("credential_alias", aliasSysId);

    gr.setLimit(1);
    gr.query();

    if (!gr.next()) {
      return null;
    }

    return {
      sysId: gr.getUniqueValue(),
    };
  }

  findOAuthCredentialById(credentialSysId: string): OAuthCredentialRecord | null {
    const gr = getRecord("oauth_2_0_credentials", credentialSysId);

    if (!gr) {
      return null;
    }

    return {
      sysId: gr.getUniqueValue(),
    };
  }

  // ---------------------------------------------------------------------
  // OAuth Entity / Profile
  // ---------------------------------------------------------------------

  /**
   * Traverses:
   *
   * oauth_2_0_credentials
   *          ↓ oauth_entity_profile
   *
   * oauth_entity_profile
   *          ↓ oauth_entity
   *
   * oauth_entity
   */
  findOAuthEntity(credentialSysId: string): OAuthEntityRecord | null {
    const credentialGr = getRecord("oauth_2_0_credentials", credentialSysId);

    if (!credentialGr) {
      return null;
    }

    const profileSysId = (credentialGr.getValue("oauth_entity_profile") as string) || "";

    if (!profileSysId) {
      return null;
    }

    const profileGr = getRecord("oauth_entity_profile", profileSysId);

    if (!profileGr) {
      return null;
    }

    const entitySysId = (profileGr.getValue("oauth_entity") as string) || "";

    if (!entitySysId) {
      return null;
    }

    const entityGr = getRecord("oauth_entity", entitySysId);

    if (!entityGr) {
      return null;
    }

    return {
      sysId: entitySysId,

      profileSysId,
    };
  }

  // ---------------------------------------------------------------------
  // Runtime OAuth update
  // ---------------------------------------------------------------------

  /**
   * Only customer/runtime values are updated.
   *
   * Structural OAuth values such as:
   *
   * - grant_type
   * - default_grant_type
   * - type
   * - default
   * - send_client_credentials_as
   *
   * remain application/template metadata.
   */
  updateOAuthCredentials(entitySysId: string, clientId: string, clientSecret: string, tokenUrl: string): boolean {
    const entityGr = getRecord("oauth_entity", entitySysId);

    if (!entityGr) {
      gs.error("[ApiConnection] " + "updateOAuthCredentials: " + "oauth_entity not found: " + entitySysId);

      return false;
    }

    entityGr.setValue("client_id", clientId);

    entityGr.setValue("client_secret", clientSecret);

    entityGr.setValue("token_url", tokenUrl);

    const updateResult = String(entityGr.update() || "");

    if (!updateResult) {
      gs.error("[ApiConnection] " + "updateOAuthCredentials: " + "oauth_entity update returned no sys_id");

      return false;
    }

    /*
     * Re-read non-secret fields.
     *
     * This avoids the false-positive problem we saw with
     * http_connection where cross-scope security blocked
     * setValue(), but our code still returned true.
     *
     * We intentionally do not read/compare client_secret.
     */
    const verifyGr = getRecord("oauth_entity", entitySysId);

    if (!verifyGr) {
      gs.error("[ApiConnection] " + "updateOAuthCredentials: " + "unable to verify updated oauth_entity");

      return false;
    }

    const savedClientId = (verifyGr.getValue("client_id") as string) || "";

    const savedTokenUrl = (verifyGr.getValue("token_url") as string) || "";

    if (savedClientId !== clientId || savedTokenUrl !== tokenUrl) {
      gs.error("[ApiConnection] " + "updateOAuthCredentials: " + "OAuth values were not persisted");

      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------
  // Runtime connection resolution
  // ---------------------------------------------------------------------

  /**
   * Retained for callers that only need the credential resolved
   * through ConnectionInfoProvider.
   *
   * The API URL is NOT taken from http_connection anymore.
   */
  getConnectionInfo(aliasSysId: string): RuntimeConnectionInfo | null {
    const provider = new ConnectionProvider();
    const connectionInfo = provider.getConnectionInfo(aliasSysId);

    if (!connectionInfo) {
      return null;
    }

    const credentialSysId = String(connectionInfo.getCredentialAttribute("sys_id") || "");

    if (!credentialSysId) {
      return null;
    }

    const config = this.findConfiguration();

    if (!config || !config.region) {
      return null;
    }

    const region = config.region.toLowerCase() as EntrustRegion;

    const baseUrl = BASE_URLS[region];

    if (!baseUrl) {
      return null;
    }

    return {
      baseUrl,
      credentialSysId,
    };
  }

  /**
   * Runtime Entrust connection information.
   *
   * IMPORTANT:
   *
   * API URL comes from our saved Region + BASE_URLS.
   * It does NOT come from http_connection.connection_url.
   *
   * The platform HTTP connection remains structural metadata.
   */
  getRuntimeConnection(): EntrustRuntimeConnection | null {
    const alias = this.findAlias();

    if (!alias) {
      gs.error("[ApiConnection] " + "getRuntimeConnection: alias not found");

      return null;
    }

    const provider = new ConnectionProvider();
    const connectionInfo = provider.getConnectionInfo(alias.sysId);

    if (!connectionInfo) {
      gs.error("[ApiConnection] " + "getRuntimeConnection: " + "ConnectionInfoProvider returned null");

      return null;
    }

    const credentialSysId = String(connectionInfo.getCredentialAttribute("sys_id") || "");

    if (!credentialSysId) {
      gs.error("[ApiConnection] " + "getRuntimeConnection: " + "credential sys_id not resolved");

      return null;
    }

    const oauthEntity = this.findOAuthEntity(credentialSysId);

    if (!oauthEntity) {
      gs.error("[ApiConnection] " + "getRuntimeConnection: " + "OAuth Entity/Profile not found");

      return null;
    }

    const config = this.findConfiguration();

    if (!config || !config.region) {
      gs.error("[ApiConnection] " + "getRuntimeConnection: " + "region configuration not found");

      return null;
    }

    const region = config.region.toLowerCase() as EntrustRegion;

    const baseUrl = BASE_URLS[region];

    if (!baseUrl) {
      gs.error("[ApiConnection] " + "getRuntimeConnection: " + "unsupported saved region=" + config.region);

      return null;
    }

    return {
      baseUrl,

      oauthProfileId: oauthEntity.profileSysId,

      requestorContext: "oauth_2_0_credentials",

      requestorId: credentialSysId,
    };
  }
}
