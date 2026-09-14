import { GlideRecord } from "@servicenow/glide";
import { CONFIG_TABLE } from "../constants.ts";

export type ConfigSettings = {
  workflowId: string;
  linkExpiry: number;
  linkExpiryUnit: "minutes" | "hours";
  linkDeliveryChannel: string;
  redirectUrl: string;
};

export type IdvConfiguration = {
  workflowId: string;
  linkExpiryMinutes: number;
  redirectUrl: string;
};

export type ConfigSettingsRecord = {
  workflowId: string;
  linkExpiry: number;
  linkExpiryUnit: "minutes" | "hours";
  deliveryChannel: string;
  webhookSecret: string;
  redirectUrl: string;
};

export function getConfigSettings(): ConfigSettingsRecord | null {
  const configGr = getExistingConfigurationRecord();

  if (!configGr) {
    return null;
  }

  const workflowId = ((configGr.getValue("workflow_id") as string) || "").trim();
  const linkExpiryValue = (configGr.getValue("link_expiry_minutes") as string) || "";
  const storedLinkExpiryUnit = ((configGr.getValue("link_expiry_unit") as string) || "")
    .trim()
    .toLowerCase();
  const linkExpiryUnit = storedLinkExpiryUnit === "hours" ? "hours" : "minutes";
  const deliveryChannel = ((configGr.getValue("link_delivery_channel") as string) || "").trim();
  const webhookSecret = ((configGr.getValue("webhook_signing_secret") as string) || "").trim();
  const redirectUrl = ((configGr.getValue("redirect_url") as string) || "").trim();
  const linkExpiry = parseInt(linkExpiryValue, 10);

  return {
    workflowId,
    linkExpiry: Number.isNaN(linkExpiry) ? 0 : linkExpiry,
    linkExpiryUnit,
    deliveryChannel,
    webhookSecret: webhookSecret,
    redirectUrl,
  };
}

export function getIdvConfiguration(): IdvConfiguration | null {
  const configGr = getExistingConfigurationRecord();

  if (!configGr) {
    return null;
  }

  const workflowId = ((configGr.getValue("workflow_id") as string) || "").trim();

  const linkExpiryValue = (configGr.getValue("link_expiry_minutes") as string) || "";

  const redirectUrl = (configGr.getValue("redirect_url") as string) || "";

  const linkExpiryMinutes = parseInt(linkExpiryValue, 10);

  if (!workflowId || Number.isNaN(linkExpiryMinutes) || linkExpiryMinutes <= 0) {
    return null;
  }

  return {
    workflowId,
    linkExpiryMinutes,
    redirectUrl,
  };
}

export function saveConfigSettings(settings: ConfigSettings): void {
  const configGr = getUpsertConfigurationRecord();

  configGr.setValue("workflow_id", settings.workflowId);
  configGr.setValue("link_expiry_minutes", settings.linkExpiry);
  configGr.setValue("link_expiry_unit", settings.linkExpiryUnit);
  configGr.setValue("link_delivery_channel", settings.linkDeliveryChannel);
  configGr.setValue("redirect_url", settings.redirectUrl);

  if (configGr.isNewRecord()) {
    const sysId = configGr.insert();

    if (!sysId) {
      throw new Error("Failed to create configuration settings.");
    }

    return;
  }

  const sysId = configGr.update();

  if (!sysId) {
    throw new Error("Failed to update configuration settings.");
  }
}

export function saveWebhookSecret(webhookSecret: string): void {
  const configGr = getUpsertConfigurationRecord();

  configGr.setValue("webhook_signing_secret", webhookSecret);

  const sysId = configGr.isNewRecord() ? configGr.insert() : configGr.update();

  if (!sysId) {
    throw new Error("Failed to save webhook token.");
  }
}

function getExistingConfigurationRecord(): GlideRecord | null {
  const configGr = new GlideRecord(CONFIG_TABLE);
  configGr.query();

  if (configGr.next()) {
    return configGr;
  }

  return null;
}

function getUpsertConfigurationRecord(): GlideRecord {
  const existing = getExistingConfigurationRecord();

  if (existing) {
    return existing;
  }

  const configGr = new GlideRecord(CONFIG_TABLE);
  configGr.initialize();
  return configGr;
}
