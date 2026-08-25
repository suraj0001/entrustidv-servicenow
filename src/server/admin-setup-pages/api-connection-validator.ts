import { type EntrustRegion, MAX_LEN, MIN_LEN, SUPPORTED_REGIONS } from "../constants.ts";

type Region = EntrustRegion;

export interface SaveConfigInput {
  region: string;
  clientId?: string;
  clientSecret?: string;
}

function validateLength(value: string, name: string): string | null {
  if (value.length < MIN_LEN || value.length > MAX_LEN)
    return name + " must be between " + MIN_LEN + " and " + MAX_LEN + " characters.";
  return null;
}

export function validateSaveInput(input: SaveConfigInput): string | null {
  if (!input.region) return "Region is required.";
  if (!isSupportedRegion(input.region)) return "Unsupported region: " + input.region;

  const hasId = !!(input.clientId && input.clientId.length > 0);
  const hasSecret = !!(input.clientSecret && input.clientSecret.length > 0);
  if (hasId !== hasSecret) return "Provide both Client ID and Client Secret, or neither.";

  if (hasId) {
    return validateLength(input.clientId!, "Client ID") ?? validateLength(input.clientSecret!, "Client Secret");
  }
  return null;
}

export function isSupportedRegion(region: string): region is Region {
  return (SUPPORTED_REGIONS as readonly string[]).includes(region.toLowerCase());
}
