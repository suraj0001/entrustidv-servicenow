import "@servicenow/sdk/global";
import { Record } from "@servicenow/sdk/core";
import { ENTRUST_IDV_INTEGRATION_USER_NAME } from "../../server/constants.ts";

/**
 * Dedicated integration user that the completion work note scheduled job
 * runs as (see entrust-idv-completion-worknote-job.now.ts), so that work
 * notes posted for completed verifications are genuinely authored by
 * "Entrust IDV" instead of Guest. ServiceNow does not allow forging journal
 * authorship after the fact - the running session's real user is always
 * used - so the job's "Run As" must reference this real user.
 *
 * This record only creates/reuses the account itself. It intentionally does
 * NOT set a password (secrets must never live in source) - Scheduled Jobs
 * authenticate as their "Run As" user internally, so no password is needed
 * for this user at all.
 */
export const entrustIdvIntegrationUser = Record({
  $id: Now.ID["entrust_idv_integration_user"],
  table: "sys_user",
  data: {
    user_name: ENTRUST_IDV_INTEGRATION_USER_NAME,
    first_name: "Entrust",
    last_name: "IDV",
    active: true,
    web_service_access_only: true,
    locked_out: false,
  },
});
