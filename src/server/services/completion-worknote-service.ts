import { gs } from "@servicenow/glide";
import * as verificationRequestRepository from "../repositories/verification-request-repository.ts";
import { addWorkNote, getCompletionActivityMessage } from "./activity-service.ts";

// Called by a Scheduled Job running as "Entrust IDV" (via the job's run_as field), so posted work notes are authored by that user.
export function processPendingCompletionNotes(): void {
  const pending = verificationRequestRepository.findPendingCompletionNotifications();

  if (pending.length === 0) {
    return;
  }

  gs.info(`[CompletionWorkNoteService] Found ${pending.length} pending completion note(s). Running as userName=${gs.getUserName()}`);

  for (const item of pending) {
    addWorkNote(item.sourceTable, item.sourceRecordId, getCompletionActivityMessage(item.status));
    verificationRequestRepository.markCompletionNotePosted(item.sysId);
  }
}
