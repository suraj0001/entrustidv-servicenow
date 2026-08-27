/* eslint-disable */

function onLoad() {
  var STATUS_FIELD =
    "x_entru_entrustidv_verification_status";

  var POLL_INTERVAL_MS = 5000;

  var MAX_POLL_DURATION_MS =
    10 * 60 * 1000;

  var MAX_CONSECUTIVE_ERRORS = 3;

  var sourceTable =
    g_form.getTableName();

  var sourceSysId =
    g_form.getUniqueValue();

  var workflowRunId = null;

  var pollingStartedAt =
    new Date().getTime();

  var consecutiveErrors = 0;

  if (!sourceSysId) {
    return;
  }

  g_form.setReadOnly(
    STATUS_FIELD,
    true
  );

  loadInitialStatus();

  /*
   * First request:
   *
   * Find the latest verification attempt
   * using source table + source record.
   */
  function loadInitialStatus() {
    var ga = new GlideAjax(
      "x_entru_entrustidv.IdvStatusAjax"
    );

    ga.addParam(
      "sysparm_name",
      "getLatestStatus"
    );

    ga.addParam(
      "sysparm_table",
      sourceTable
    );

    ga.addParam(
      "sysparm_sys_id",
      sourceSysId
    );

    ga.getXMLAnswer(
      function (answer) {
        var result =
          parseResult(answer);

        if (!result) {
          handlePollingError(
            loadInitialStatus
          );
          return;
        }

        consecutiveErrors = 0;

        applyStatus(
          result.displayStatus
        );

        workflowRunId =
          result.workflowRunId;

        if (
          result.shouldPoll &&
          workflowRunId
        ) {
          console.log(
            "[Entrust IDV] Polling started: workflowRunId=" +
              workflowRunId +
              ", status=" +
              result.status +
              ", displayStatus=" +
              result.displayStatus +
              ", table=" +
              sourceTable +
              ", recordId=" +
              sourceSysId
          );

          scheduleNextPoll(
            pollWorkflowRun
          );
        } else {
          console.log(
            "[Entrust IDV] Polling not required: workflowRunId=" +
              workflowRunId +
              ", status=" +
              result.status +
              ", displayStatus=" +
              result.displayStatus
          );
        }
      }
    );
  }

  /*
   * Subsequent requests:
   *
   * Poll the exact verification attempt
   * using workflow_run_id.
   */
  function pollWorkflowRun() {
    if (!workflowRunId) {
      return;
    }

    var ga = new GlideAjax(
      "x_entru_entrustidv.IdvStatusAjax"
    );

    ga.addParam(
      "sysparm_name",
      "getStatusByWorkflowRunId"
    );

    ga.addParam(
      "sysparm_workflow_run_id",
      workflowRunId
    );

    ga.getXMLAnswer(
      function (answer) {
        var result =
          parseResult(answer);

        if (!result) {
          handlePollingError(
            pollWorkflowRun
          );
          return;
        }

        consecutiveErrors = 0;

        applyStatus(
          result.displayStatus
        );

        if (result.shouldPoll) {
          console.log(
            "[Entrust IDV] Polling in progress: workflowRunId=" +
              workflowRunId +
              ", status=" +
              result.status +
              ", displayStatus=" +
              result.displayStatus
          );

          scheduleNextPoll(
            pollWorkflowRun
          );
        } else {
          console.log(
            "[Entrust IDV] Polling completed: workflowRunId=" +
              workflowRunId +
              ", finalStatus=" +
              result.status +
              ", displayStatus=" +
              result.displayStatus
          );
        }
      }
    );
  }

  function parseResult(answer) {
    if (!answer) {
      return null;
    }

    try {
      var result =
        JSON.parse(answer);

      if (
        !result ||
        !result.success
      ) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  function applyStatus(
    displayStatus
  ) {
    if (!displayStatus) {
      return;
    }

    g_form.setValue(
      STATUS_FIELD,
      displayStatus
    );
  }

  function scheduleNextPoll(
    callback
  ) {
    var elapsed =
      new Date().getTime() -
      pollingStartedAt;

    if (
      elapsed >=
      MAX_POLL_DURATION_MS
    ) {
      console.log(
        "[Entrust IDV] Polling stopped: maximum duration of " +
          MAX_POLL_DURATION_MS / 1000 +
          "s reached, workflowRunId=" +
          workflowRunId
      );
      return;
    }

    setTimeout(
      callback,
      POLL_INTERVAL_MS
    );
  }

  function handlePollingError(
    retryFunction
  ) {
    consecutiveErrors++;

    if (
      consecutiveErrors >=
      MAX_CONSECUTIVE_ERRORS
    ) {
      console.log(
        "[Entrust IDV] Polling stopped: maximum consecutive errors (" +
          MAX_CONSECUTIVE_ERRORS +
          ") reached, workflowRunId=" +
          workflowRunId
      );
      return;
    }

    scheduleNextPoll(
      retryFunction
    );
  }
}