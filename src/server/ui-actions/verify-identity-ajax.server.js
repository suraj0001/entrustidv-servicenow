// @ts-nocheck
var VerifyIdentityAjax = Class.create();

// eslint-disable-next-line no-unsupported-node-builtins -- `global` refers to the ServiceNow global scope object here, not Node's global
VerifyIdentityAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
  startVerification: function () {
    try {
      var sourceTable = this.getParameter('sysparm_source_table');

      var sourceRecordId = this.getParameter('sysparm_source_record_id');

      if (!sourceTable || !sourceRecordId) {
        return JSON.stringify({
          success: false,
          message: 'Source record information is missing.',
        });
      }

      var verificationService = require('./src/server/services/verification-service.ts');

      var result = verificationService.startVerification(sourceTable, sourceRecordId);

      return JSON.stringify({
        success: true,
        message: 'Identity verification started.',
        status: result.status,
        displayStatus: result.displayStatus,
        workflowRunId: result.workflowRunId,
      });
    } catch (e) {
      var errorMessage = (e && e.message ? e.message : String(e)).replace(/^Error:\s*/i, '');

      gs.error('[VerifyIdentityAjax] Failed to start verification: ' + errorMessage);

      return JSON.stringify({
        success: false,
        message: errorMessage || 'Failed to start identity verification.',
      });
    }
  },

  type: 'VerifyIdentityAjax',
});
