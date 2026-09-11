/* eslint-disable */

(function process() {
  try {
    var completionWorkNoteService = require(
      "./src/server/services/completion-worknote-service.ts"
    );

    completionWorkNoteService.processPendingCompletionNotes();
  } catch (e) {
    gs.error("[CompletionWorkNoteJob] Unexpected error: " + e);
  }
})();
