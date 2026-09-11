import "@servicenow/sdk/global";
import { Record } from "@servicenow/sdk/core";
import { entrustIdvIntegrationUser } from "../security/entrust-idv-integration-user.now.ts";

// run_as references the actual exported Record() object (not a re-typed
// Now.ID string, which didn't resolve correctly when tested) - the SDK's
// reference-field type for sysauto_script.run_as explicitly accepts a
// Record<"sys_user"> value, confirmed via the compiler's own type error
// message. This job runs as the real "Entrust IDV" user with no
// per-instance manual setup needed.
export const entrustIdvCompletionWorkNoteJob = Record({
  $id: Now.ID["entrust_idv_completion_worknote_job"],
  table: "sysauto_script",
  data: {
    name: "Entrust IDV - Post completion work notes",
    active: true,
    run_as: entrustIdvIntegrationUser,
    run_type: "periodically",
    run_period: "1970-01-01 00:01:00",
    run_start: "2024-01-01 00:00:00",
    script: Now.include(
      "../../server/jobs/completion-worknote-job.server.js",
    ),
  },
});

