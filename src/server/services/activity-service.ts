import { gs } from '@servicenow/glide';
import { ACTIVITY_MESSAGES } from '../constants.ts';
import { addWorkNote as addSourceWorkNote } from '../repositories/source-record-repository.ts';

export function addWorkNote(tableName: string, recordId: string, message: string): void {
  const success = addSourceWorkNote(tableName, recordId, message);

  if (!success) {
    gs.warn(
      `[ActivityService] Unable to add work note. Record not found or unsupported: ${tableName}/${recordId}`
    );
  }
}

export function getVerificationCreatedActivityMessage(
  existingRequestCount: number,
  workflowRunId: string
): string {
  let baseMessage: string;

  if (existingRequestCount <= 0) {
    baseMessage = ACTIVITY_MESSAGES.VERIFICATION_REQUESTED;
  } else if (existingRequestCount === 1) {
    baseMessage = ACTIVITY_MESSAGES.REVERIFICATION_REQUESTED;
  } else {
    baseMessage = ACTIVITY_MESSAGES.REVERIFICATION_REQUESTED_AGAIN;
  }

  return `${baseMessage}\nWorkflow Run ID: ${workflowRunId}`;
}

export function getCompletionActivityMessage(status: string): string {
  switch (status.trim().toLowerCase()) {
    case 'approved':
      return ACTIVITY_MESSAGES.OUTCOME_APPROVED;

    case 'review':
      return ACTIVITY_MESSAGES.OUTCOME_REVIEW;

    case 'declined':
      return ACTIVITY_MESSAGES.OUTCOME_DECLINED;

    case 'abandoned':
      return ACTIVITY_MESSAGES.OUTCOME_ABANDONED;

    case 'error':
      return ACTIVITY_MESSAGES.OUTCOME_ERROR;

    default:
      return ACTIVITY_MESSAGES.OUTCOME_DEFAULT;
  }
}
