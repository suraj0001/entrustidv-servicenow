/* eslint-disable */
var VerifyIdentityAjax = Class.create();

VerifyIdentityAjax.prototype = Object.extendsObject(
    global.AbstractAjaxProcessor,
    {
        startVerification: function () {
            try {
                var sourceTable =
                    this.getParameter('sysparm_source_table');

                var sourceRecordId =
                    this.getParameter('sysparm_source_record_id');

                if (!sourceTable || !sourceRecordId) {
                    return JSON.stringify({
                        success: false,
                        message: 'Source record information is missing.',
                    });
                }

                var verificationService =
                    require("./src/server/services/verification-service.ts");

                var result =
                    verificationService.startVerification(
                        sourceTable,
                        sourceRecordId
                    );

                var verificationStatusService =
                    require("./src/server/services/verification-status-service.ts");

                var statusResult =
                    verificationStatusService.getLatestVerificationStatus(
                        sourceTable,
                        sourceRecordId
                    );

                return JSON.stringify({
                    success: true,
                    status: result.status,
                    displayStatus: statusResult
                        ? statusResult.displayStatus
                        : result.status,
                    workflowRunId: result.workflowRunId,
                });
            } catch (e) {
                var errorMessage =
                    e && e.message ? e.message : '' + e;

                gs.error(
                    '[VerifyIdentityAjax] Failed to start verification: ' +
                        errorMessage
                );

                return JSON.stringify({
                    success: false,
                    message:
                        errorMessage ||
                        'Failed to start identity verification.',
                });
            }
        },

        type: 'VerifyIdentityAjax',
    }
);