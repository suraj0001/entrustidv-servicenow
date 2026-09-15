export type VerificationSettingsInput = {
  workflowId: string;
  linkExpiry: string;
  deliveryChannel: string;
  redirectUrl: string;
};

// Must match workflow_id.maxLength in idv-configuration.now.ts
var WORKFLOW_ID_MAX_LEN = 100;

export function validateVerificationSettings(
  input: VerificationSettingsInput,
): void {
  var workflowId = clean(input.workflowId);
  var linkExpiry = clean(input.linkExpiry);
  var deliveryChannel = clean(input.deliveryChannel).toLowerCase();
  var redirectUrl = clean(input.redirectUrl);

  if (!workflowId) {
    throw new Error("Workflow ID is required.");
  }

  if (workflowId.length > WORKFLOW_ID_MAX_LEN) {
    throw new Error("Workflow ID must be " + WORKFLOW_ID_MAX_LEN + " characters or fewer.");
  }

  if (!linkExpiry) {
    throw new Error("Link expiry is required.");
  }

  if (!/^[1-9]\d*$/.test(linkExpiry)) {
    throw new Error("Link expiry must be a positive whole number.");
  }

  if (!deliveryChannel) {
    throw new Error("Delivery channel is required.");
  }

  if (deliveryChannel !== "email") {
    throw new Error("Email is currently the only supported delivery channel.");
  }

  if (redirectUrl && !isValidHttpUrl(redirectUrl)) {
    throw new Error("Enter a valid redirect URL.");
  }
}

function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value);
}

function clean(value: string | null | undefined): string {
  return value ? String(value).trim() : "";
}
