import {
  type VerificationSettingsInput,
  validateVerificationSettings,
} from "../admin-setup-pages/verification-settings-validator.ts";

import {
  getConfigSettings,
  saveWebhookSecret as saveWebhookSecretValue,
  saveConfigSettings,
  type ConfigSettings,
  type ConfigSettingsRecord,
} from "../repositories/configuration-repository.ts";

export type GetVerificationSettingsResult = {
  success: boolean;
  message?: string;
  settings?: Omit<ConfigSettingsRecord, "webhookSecret">;
};

export type SaveVerificationSettingsResult = {
  success: boolean;
  message: string;
};

export type WebhookSecretStatusResult = {
  success: boolean;
  configured: boolean;
};

export function getVerificationSettingsConfig(): GetVerificationSettingsResult {
  const settings = getConfigSettings();

  return {
    success: true,
    settings: settings
      ? {
          workflowId: settings.workflowId,
          linkExpiry: settings.linkExpiry,
          deliveryChannel: "email",
          redirectUrl: settings.redirectUrl,
        }
      : undefined,
  };
}

export function getWebhookSecretStatus(): WebhookSecretStatusResult {
  const settings = getConfigSettings();

  return {
    success: true,
    configured: !!(settings && settings.webhookSecret),
  };
}

export function saveVerificationSettings(
  input: VerificationSettingsInput,
): SaveVerificationSettingsResult {
  // 1. Server-side validation
  validateVerificationSettings(input);

  // 2. Business logic / normalization
  var settings: ConfigSettings = {
    workflowId: input.workflowId.trim(),
    linkExpiry: Number(input.linkExpiry),
    linkDeliveryChannel: "email",
    redirectUrl: input.redirectUrl ? input.redirectUrl.trim() : "",
  };

  // 3. Persistence
  saveConfigSettings(settings);

  return {
    success: true,
    message: "Verification settings saved successfully.",
  };
}

export function saveWebhookSecret(webhookSecret: string): SaveVerificationSettingsResult {
  const normalizedSecret = webhookSecret ? webhookSecret.trim() : "";

  if (!normalizedSecret) {
    throw new Error("Webhook token is required.");
  }

  if (normalizedSecret.length < 5 || normalizedSecret.length > 100) {
    throw new Error("Webhook token must be between 5 and 100 characters.");
  }

  saveWebhookSecretValue(normalizedSecret);

  return {
    success: true,
    message: "Webhook token saved successfully.",
  };
}
