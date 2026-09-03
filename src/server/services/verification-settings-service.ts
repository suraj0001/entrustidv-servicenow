import {
  type VerificationSettingsInput,
  validateVerificationSettings,
} from "../admin-setup-pages/verification-settings-validator.ts";

import {
  getVerificationSettings,
  saveWebhookSecret as saveWebhookSecretValue,
  saveVerificationSettingsConfig,
  type VerificationSettingsConfig,
  type VerificationSettingsReadResult,
} from "../repositories/configuration-repository.ts";

export type GetVerificationSettingsResult = {
  success: boolean;
  message?: string;
  settings?: Omit<VerificationSettingsReadResult, "webhookSecret">;
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
  const settings = getVerificationSettings();

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
  const settings = getVerificationSettings();

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
  var settings: VerificationSettingsConfig = {
    workflowId: input.workflowId.trim(),
    linkExpiry: Number(input.linkExpiry),
    linkDeliveryChannel: "email",
    redirectUrl: input.redirectUrl ? input.redirectUrl.trim() : "",
  };

  // 3. Persistence
  saveVerificationSettingsConfig(settings);

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

  if (normalizedSecret.length > 255) {
    throw new Error("Webhook token must not exceed 255 characters.");
  }

  saveWebhookSecretValue(normalizedSecret);

  return {
    success: true,
    message: "Webhook token saved.",
  };
}
