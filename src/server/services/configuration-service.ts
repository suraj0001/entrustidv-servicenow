import { GlideRecord } from "@servicenow/glide";
import { CONFIG_TABLE } from "../constants.ts";

export function getWebhookSecret(): string | null {
  const configGr = new GlideRecord(CONFIG_TABLE);
  configGr.query();

  if (!configGr.next()) {
    return null;
  }

  const secret = ((configGr.getValue("webhook_signing_secret") as string) || "").trim();

  return secret.length > 0 ? secret : null;
}
