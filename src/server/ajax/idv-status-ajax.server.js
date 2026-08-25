/* eslint-disable */

var IdvStatusAjax = Class.create();

IdvStatusAjax.prototype = Object.extendsObject(
  global.AbstractAjaxProcessor,
  {
    getStatus: function () {
      try {
        var sourceTable =
          this.getParameter("sysparm_table");

        var sourceSysId =
          this.getParameter("sysparm_sys_id");

        if (
          sourceTable !== "incident" &&
          sourceTable !== "sn_hr_core_case"
        ) {
          return JSON.stringify({
            success: false,
            message: "Unsupported source table",
          });
        }

        if (!sourceSysId) {
          return JSON.stringify({
            success: false,
            message: "Source sys_id is required",
          });
        }

        var verificationRepository = require(
          "./src/server/repositories/verification-request-repository.ts"
        );

        var status =
          verificationRepository.findVerificationStatus(
            sourceTable,
            sourceSysId
          );

        return JSON.stringify({
          success: true,
          status: status || "not_started",
        });
      } catch (error) {
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
    },

    type: "IdvStatusAjax",
  }
);