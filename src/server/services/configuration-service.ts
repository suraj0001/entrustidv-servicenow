import { getConfigSettings } from "../repositories/configuration-repository.ts";

export function getWebhookSecret(): string | null {
  const settings = getConfigSettings();
  return settings ? settings.webhookSecret : null;
}
