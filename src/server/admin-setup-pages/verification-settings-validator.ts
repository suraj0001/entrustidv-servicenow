export type VerificationSettingsInput = {
  workflowId: string;
  linkExpiry: string;
  linkExpiryUnit: string;
  deliveryChannel: string;
  redirectUrl: string;
};

// Must match workflow_id.maxLength in idv-configuration.now.ts
var WORKFLOW_ID_MAX_LEN = 100;
var LINK_EXPIRY_MINUTES_MIN = 15;
var LINK_EXPIRY_MINUTES_MAX = 2880;
var LINK_EXPIRY_HOURS_MIN = 1;
var LINK_EXPIRY_HOURS_MAX = 48;

export function validateVerificationSettings(input: VerificationSettingsInput): void {
  var workflowId = clean(input.workflowId);
  var linkExpiry = clean(input.linkExpiry);
  var linkExpiryUnit = clean(input.linkExpiryUnit).toLowerCase();
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

  if (!linkExpiryUnit) {
    throw new Error("Link expiry unit is required.");
  }

  if (linkExpiryUnit !== "minutes" && linkExpiryUnit !== "hours") {
    throw new Error("Link expiry unit must be minutes or hours.");
  }

  var expiry = Number(linkExpiry);

  if (linkExpiryUnit === "minutes") {
    if (!Number.isInteger(expiry)) {
      throw new Error("Decimal minutes are not allowed for link expiry.");
    }

    if (expiry < LINK_EXPIRY_MINUTES_MIN) {
      throw new Error("Link expiry must be at least 15 minutes.");
    }

    if (expiry > LINK_EXPIRY_MINUTES_MAX) {
      throw new Error("Link expiry cannot exceed 2880 minutes.");
    }
  }

  if (linkExpiryUnit === "hours") {
    if (!Number.isInteger(expiry)) {
      throw new Error("Decimal hours are not allowed for link expiry.");
    }

    if (expiry < LINK_EXPIRY_HOURS_MIN) {
      throw new Error(
        "When Hours is selected, the minimum link expiry is 1 hour. For a shorter duration, select Minutes.",
      );
    }

    if (expiry > LINK_EXPIRY_HOURS_MAX) {
      throw new Error("Link expiry cannot exceed 48 hours.");
    }
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
