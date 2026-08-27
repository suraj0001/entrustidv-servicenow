/* eslint-disable */

var IdvStatusAjax = Class.create();

IdvStatusAjax.prototype = Object.extendsObject(
  global.AbstractAjaxProcessor,
  {
    getLatestStatus: function () {
      try {
        var sourceTable =
          this.getParameter(
            "sysparm_table"
          );

        var sourceSysId =
          this.getParameter(
            "sysparm_sys_id"
          );

        if (
          sourceTable !== "incident" &&
          sourceTable !== "sn_hr_core_case"
        ) {
          return JSON.stringify({
            success: false,
            message:
              "Unsupported source table",
          });
        }

        if (!sourceSysId) {
          return JSON.stringify({
            success: false,
            message:
              "Source sys_id is required",
          });
        }

        var verificationStatusService =
          require(
            "./src/server/services/verification-status-service.ts"
          );

        var result =
          verificationStatusService
            .getLatestVerificationStatus(
              sourceTable,
              sourceSysId
            );

        return JSON.stringify({
          success: true,

          workflowRunId:
            result.workflowRunId,

          status:
            result.status,

          displayStatus:
            result.displayStatus,

          shouldPoll:
            result.shouldPoll,
        });
      } catch (error) {
        return handleError(error);
      }
    },

    getStatusByWorkflowRunId:
      function () {
        try {
          var workflowRunId =
            this.getParameter(
              "sysparm_workflow_run_id"
            );

          if (!workflowRunId) {
            return JSON.stringify({
              success: false,
              message:
                "Workflow run id is required",
            });
          }

          var verificationStatusService =
            require(
              "./src/server/services/verification-status-service.ts"
            );

          var result =
            verificationStatusService
              .getVerificationStatusByWorkflowRunId(
                workflowRunId
              );

          if (!result) {
            return JSON.stringify({
              success: false,
              message:
                "Verification request not found",
            });
          }

          return JSON.stringify({
            success: true,

            workflowRunId:
              result.workflowRunId,

            status:
              result.status,

            displayStatus:
              result.displayStatus,

            shouldPoll:
              result.shouldPoll,
          });
        } catch (error) {
          return handleError(error);
        }
      },

    type: "IdvStatusAjax",
  }
);

function handleError(error) {
  gs.error(
    "[IDV Status Ajax] Failed to load status. message=" +
      (
        error && error.message
          ? error.message
          : String(error)
      )
  );

  return JSON.stringify({
    success: false,
    message:
      "Unable to retrieve identity verification status",
  });
}