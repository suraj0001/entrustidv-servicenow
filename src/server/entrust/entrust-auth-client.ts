import { RESTMessageV2 } from "@servicenow/glide/sn_ws";
import { API_VERSION, BASE_URLS, type EntrustRegion } from "../constants.ts";

export type { EntrustRegion };

export interface EntrustConnectionTestResult {
  success: boolean;
  message: string;
}

const TOKEN_URLS: Record<EntrustRegion, string> = {
  eu: BASE_URLS.eu + "/" + API_VERSION + "/oauth/token",
  us: BASE_URLS.us + "/" + API_VERSION + "/oauth/token",
  ca: BASE_URLS.ca + "/" + API_VERSION + "/oauth/token",
};

function fail(message: string): EntrustConnectionTestResult {
  return { success: false, message };
}

function buildTokenRequest(tokenUrl: string, clientId: string, clientSecret: string): RESTMessageV2 {
  const req = new RESTMessageV2();
  req.setEndpoint(tokenUrl);
  req.setHttpMethod("post");
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Accept", "application/json");
  req.setRequestBody(
    "client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret),
  );
  return req;
}

export function testEntrustConnection(
  region: EntrustRegion,
  clientId: string,
  clientSecret: string,
): EntrustConnectionTestResult {
  const url = TOKEN_URLS[region];
  if (!url) return fail("Unsupported Entrust region.");

  try {
    const response = buildTokenRequest(url, clientId, clientSecret).execute();
    const status = response.getStatusCode();

    if (status >= 200 && status < 300) {
      let body: { access_token?: string } = {};
      try {
        body = JSON.parse(response.getBody() || "{}");
      } catch (_) {}
      if (body.access_token) return { success: true, message: "Connection successful." };
      return fail("Reached Entrust but no access token was returned. Re-check credentials.");
    }
    return fail("Connection failed (HTTP " + status + "). Please check your credentials and try again.");
  } catch (error) {
    return fail("Unable to connect to Entrust.");
  }
}
