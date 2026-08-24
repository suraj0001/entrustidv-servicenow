import "@servicenow/sdk/global";

import { RestApi } from "@servicenow/sdk/core";

RestApi({
  $id: Now.ID["entrust-idv-webhook-api"],

  name: "Identity Verification Webhook",

  serviceId: "entrustidv",

  active: true,

  shortDescription:
    "Receives identity verification webhook events from Entrust Identity Verification.",

  consumes: "application/json",

  enforceAcl: [],

  routes: [
    {
      $id: Now.ID["idv-webhook-public-route"],

      name: "Identity Verification Webhook",

      path: "/webhook/events",

      method: "POST",

      script: Now.include(
        "../../server/webhook/webhook-handler.server.js",
      ),

      authorization: false,

      authentication: false,

      internalRole: false,

      enforceAcl: [],
    },
  ],
});