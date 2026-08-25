// @ts-nocheck
/* eslint-disable */
var VerificationSettingsAjax = Class.create();

VerificationSettingsAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
  getConfig: () => {
    var svc;
    try {
      svc = require("./src/server/services/verification-settings-service.ts");

      return JSON.stringify(svc.getVerificationSettingsConfig());
    } catch (e) {
      gs.error("[Entrust IDV] Failed to load verification settings: " + e.message);

      return JSON.stringify({
        success: false,
        message: e.message || "Unable to load verification settings.",
      });
    }
  },

  saveConfig: function () {
    var verificationSettingsService;
    var input;
    var result;
    try {
      verificationSettingsService = require("./src/server/services/verification-settings-service.ts");

      input = {
        workflowId: this.getParameter("sysparm_workflow_id"),
        linkExpiry: this.getParameter("sysparm_link_expiry"),
        deliveryChannel: this.getParameter("sysparm_delivery_channel"),
        webhookSecret: this.getParameter("sysparm_webhook_secret"),
        redirectUrl: this.getParameter("sysparm_redirect_url"),
        hasStoredSecret: this.getParameter("sysparm_has_stored_secret") === "true",
      };

      result = verificationSettingsService.saveVerificationSettings(input);

      return JSON.stringify(result);
    } catch (e) {
      gs.error("[Entrust IDV] Failed to save verification settings: " + e.message);

      return JSON.stringify({
        success: false,
        message: e.message || "Unable to save verification settings.",
      });
    }
  },

  type: "VerificationSettingsAjax",
});
