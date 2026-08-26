import { getVerificationSettings } from "../repositories/configuration-repository.ts";

export function getWebhookSecret(): string | null {
  const settings = getVerificationSettings();
  return settings ? settings.webhookSecret : null;
}
