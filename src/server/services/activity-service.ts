import { gs } from "@servicenow/glide";
import { addWorkNote as addSourceWorkNote } from "../repositories/source-record-repository.ts";

export function addWorkNote(
  tableName: string,
  recordId: string,
  message: string,
): void {
  gs.info(
    `[ActivityService] addWorkNote table=${tableName}, recordId=${recordId}, message=${message}`,
  );
  const success = addSourceWorkNote(tableName, recordId, message);

  gs.info(
    `[ActivityService] addWorkNote success=${success}`,
  );

  if (!success) {
    gs.warn(
      `[ActivityService] Unable to add work note. Record not found or unsupported: ${tableName}/${recordId}`,
    );
  }
}

export function getVerificationCreatedActivityMessage(existingRequestCount: number): string {
  if (existingRequestCount <= 0) {
    return (
      "Identity verification requested.\n" +
      "Verification link sent to the user."
    );
  }

  if (existingRequestCount === 1) {
    return (
      "Identity reverification requested.\n" +
      "Verification link sent to the user."
    );
  }

  return (
    "Identity reverification requested again.\n" +
    "Verification link sent to the user."
  );
}

export function getCompletionActivityMessage(status: string): string {
  switch (status.trim().toLowerCase()) {
    case "approved":
      return "Identity verification completed.\nOutcome: Approved";

    case "review":
      return "Identity verification completed.\nOutcome: Manual review required";

    case "declined":
      return "Identity verification completed.\nOutcome: Declined";

    case "abandoned":
      return "Identity verification ended.\nOutcome: Abandoned";

    case "error":
      return "Identity verification could not be completed.\nOutcome: Error";

    default:
      return "Identity verification completed.";
  }
}