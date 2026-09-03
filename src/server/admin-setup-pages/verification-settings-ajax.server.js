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

  getWebhookSecretStatus: function () {
    var verificationSettingsService;
    try {
      verificationSettingsService = require("./src/server/services/verification-settings-service.ts");

      return JSON.stringify(verificationSettingsService.getWebhookSecretStatus());
    } catch (e) {
      gs.error("[Entrust IDV] Failed to load webhook token status: " + e.message);

      return JSON.stringify({
        success: false,
        configured: false,
        message: e.message || "Unable to load webhook token status.",
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
        deliveryChannel: "email",
        redirectUrl: this.getParameter("sysparm_redirect_url"),
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

  saveWebhookSecret: function () {
    var verificationSettingsService;
    try {
      verificationSettingsService = require("./src/server/services/verification-settings-service.ts");

      return JSON.stringify(
        verificationSettingsService.saveWebhookSecret(this.getParameter("sysparm_webhook_secret")),
      );
    } catch (e) {
      gs.error("[Entrust IDV] Failed to save webhook token: " + e.message);

      return JSON.stringify({
        success: false,
        message: e.message || "Unable to save webhook token.",
      });
    }
  },

  type: "VerificationSettingsAjax",
});
