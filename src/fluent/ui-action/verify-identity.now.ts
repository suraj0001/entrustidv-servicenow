import "@servicenow/sdk/global";
import { UiAction } from "@servicenow/sdk/core";

UiAction({
  $id: Now.ID["verify-identity-ui-action"],
  table: "task",
  name: "Verify Identity",
  actionName: "executeVerifyIdentity",
  active: true,
  order: 100,
  form: {
    showButton: true,
    style: "unstyled",
  },
  showInsert: false,
  showUpdate: true,
  condition:
    "current.getTableName() == 'incident' || current.getTableName() == 'sn_hr_core_case'",
  script: Now.include("../../server/ui-actions/verify-identity.server.js"),
  roles: ["x_entru_entrustidv.agent"],
  comments: "Starts an Entrust identity verification for the incident.",
});
