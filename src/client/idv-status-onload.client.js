/* eslint-disable */

function onLoad() {
  var STATUS_FIELD = "x_entru_entrustidv_verification_status";

  var POLL_INTERVAL_MS = 5000;
  var MAX_POLL_DURATION_MS = 10 * 60 * 1000;

  var TERMINAL_STATUSES = {
    approved: true,
    declined: true,
    abandoned: true,
    error: true,
  };

  var STATUS_LABELS = {
    awaiting: "Pending",
    pending: "Pending",
    processing: "In Process",
    review: "Review Required",
    awaiting_input: "Awaiting Input",
    approved: "Approved",
    declined: "Declined",
    abandoned: "Abandoned",
    error: "Error",
    not_started: "Not Started",
};

  var sourceTable = g_form.getTableName();
  var sourceSysId = g_form.getUniqueValue();
  var pollingStartedAt = new Date().getTime();

  if (!sourceSysId) {
    return;
  }

  g_form.setReadOnly(STATUS_FIELD, true);

  g_form.setValue(STATUS_FIELD, "Not Started");

  loadStatus();

  function loadStatus() {
    var ga = new GlideAjax(
      "x_entru_entrustidv.IdvStatusAjax"
    );

    ga.addParam(
      "sysparm_name",
      "getStatus"
    );

    ga.addParam(
      "sysparm_table",
      sourceTable
    );

    ga.addParam(
      "sysparm_sys_id",
      sourceSysId
    );

    ga.getXMLAnswer(function (answer) {
      if (!answer) {
        return;
      }

      var result;

      try {
        result = JSON.parse(answer);
      } catch (e) {
        return;
      }

      if (!result.success) {
        return;
      }

      applyStatus(result.status);

      if (shouldContinuePolling(result.status)) {
        setTimeout(
          loadStatus,
          POLL_INTERVAL_MS
        );
      }
    });
  }

  function applyStatus(status) {
    var label =
      STATUS_LABELS[status] ||
      status ||
      "Not Started";

    g_form.setValue(
      STATUS_FIELD,
      label
    );
  }

  function shouldContinuePolling(status) {
    if (!status || status === "not_started") {
      return false;
    }

    if (TERMINAL_STATUSES[status]) {
      return false;
    }

    var elapsed =
      new Date().getTime() -
      pollingStartedAt;

    return elapsed < MAX_POLL_DURATION_MS;
  }
}