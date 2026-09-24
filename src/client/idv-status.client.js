var STATUS_FIELD = 'x_entru_entrustidv_verification_status';
var LOADING_STATUS_TEXT = 'Fetching status...';
var LOADING_SPINNER_ID = 'idv-status-loading-spinner';

var INITIAL_POLL_DELAY_ONLOAD_MS = 60 * 1000; // 1 minute on page load
var INITIAL_POLL_DELAY_ONCLICK_MS = 5 * 60 * 1000; // 5 minutes on button click
var MAX_POLL_DURATION_MS = 60 * 60 * 1000; // 60 minutes total duration
var SHORT_TIER_LIMIT_MS = 10 * 60 * 1000; // First 10 minutes
var SHORT_TIER_INTERVAL_MS = 60 * 1000; // Poll every 1 minute (up to 10 mins)
var LONG_TIER_INTERVAL_MS = 5 * 60 * 1000; // Poll every 5 minutes (10 to 60 mins)
var MAX_CONSECUTIVE_ERRORS = 3;
var MESSAGE_AUTO_DISMISS_MS = 10000;

var workflowRunId = null;
var pollingStartedAt = 0;
var consecutiveErrors = 0;
var pollingTimer = null;
var messageDismissTimer = null;

// onLoad and the Verify Identity UI Action each Now.include() this file into a
// SEPARATE, isolated script scope, so a plain module-level var doesn't survive
// between them. Persist on g_form instead, since it's the one object shared
// across both contexts.
function getLastKnownDisplayStatus() {
  return (g_form && g_form.__idvLastKnownDisplayStatus) || 'Not Started';
}

function setLastKnownDisplayStatus(status) {
  if (g_form) {
    g_form.__idvLastKnownDisplayStatus = status;
  }
}

function onLoad() {
  var sourceTable = g_form.getTableName();
  var sourceSysId = g_form.getUniqueValue();

  if (!sourceSysId) {
    return;
  }

  g_form.setReadOnly(STATUS_FIELD, true);

  setLastKnownDisplayStatus(g_form.getValue(STATUS_FIELD) || 'Not Started');

  beginInitialStatusLoad();
  loadInitialStatus(sourceTable, sourceSysId);
}

function loadInitialStatus(sourceTable, sourceSysId) {
  var ga = new GlideAjax('x_entru_entrustidv.IdvStatusAjax');
  ga.addParam('sysparm_name', 'getLatestStatus');
  ga.addParam('sysparm_table', sourceTable);
  ga.addParam('sysparm_sys_id', sourceSysId);

  ga.getXMLAnswer(function (answer) {
    var result = parseResponse(answer);

    hideLoadingSpinner();

    if (!result.success) {
      applyStatus(getLastKnownDisplayStatus());
      showFormMessage(
        'error',
        result.message || 'Unable to retrieve identity verification status.'
      );
      return;
    }

    applyStatus(result.displayStatus || formatStatus(result.status));

    if (result.shouldPoll && result.workflowRunId) {
      startPolling(result.workflowRunId, INITIAL_POLL_DELAY_ONLOAD_MS);
    } else if (result.workflowRunId) {
      stopPolling();
    }
  });
}

function beginInitialStatusLoad() {
  g_form.setValue(STATUS_FIELD, LOADING_STATUS_TEXT);
  showLoadingSpinner();
}

function showLoadingSpinner() {
  try {
    var control = g_form.getControl(STATUS_FIELD);
    if (!control || !control.parentNode) {
      return;
    }
    removeLoadingSpinner();
    insertSpinnerInsideField(control);
  } catch (e) {
    // Spinner is a visual enhancement only; ignore on platforms without a real field control (e.g. Service Portal).
  }
}

function hideLoadingSpinner() {
  try {
    removeLoadingSpinner();
  } catch (e) {
    // no-op
  }
}

function removeLoadingSpinner() {
  var control = g_form.getControl(STATUS_FIELD);
  var container = control && control.parentNode;
  if (!container || typeof container.querySelector !== 'function') {
    return;
  }
  var existing = container.querySelector('#' + LOADING_SPINNER_ID);
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
}

// Overlays the spinner directly on top of the (readonly) field, just after the
// "Fetching status..." text, since a native input/label can't host HTML children.
function insertSpinnerInsideField(control) {
  var doc = control.ownerDocument;
  var container = control.parentNode;
  if (!doc || !container) {
    return;
  }

  var win = doc.defaultView;
  if (win && win.getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  var wrapper = doc.createElement('span');
  wrapper.id = LOADING_SPINNER_ID;
  wrapper.setAttribute(
    'style',
    'position:absolute; top:50%; left:' +
      getSpinnerLeftOffset(control) +
      'px; ' +
      'transform:translateY(-50%); pointer-events:none;'
  );
  wrapper.innerHTML = getSpinnerMarkup();

  container.appendChild(wrapper);
}

// Measures the rendered width of the loading text (via a scratch canvas using
// the field's own font) so the spinner lands right beside it rather than a
// fixed/guessed distance away.
function getSpinnerLeftOffset(control) {
  var fallbackOffset = 118;

  try {
    var doc = control.ownerDocument;
    var win = doc.defaultView;
    var computed = win.getComputedStyle(control);
    var canvas = doc.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = computed.fontWeight + ' ' + computed.fontSize + ' ' + computed.fontFamily;

    var textWidth = ctx.measureText(LOADING_STATUS_TEXT).width;
    var leftPadding = parseFloat(computed.paddingLeft) || 6;

    return Math.round(leftPadding + textWidth + 8);
  } catch (e) {
    return fallbackOffset;
  }
}

// Reuses ServiceNow's own "now-icon icon-loading" spinner classes for visual
// consistency with the rest of the platform.
function getSpinnerMarkup() {
  return '<span class="now-icon icon-loading" style="color: #4F52BD; margin-left: 8px; margin-top: 2px;"></span>';
}

function executeVerifyIdentity() {
  var sourceTable = g_form.getTableName();
  var sourceRecordId = g_form.getUniqueValue();

  if (!sourceRecordId) {
    return;
  }

  var currentDisplayStatus = getLastKnownDisplayStatus();
  if (currentDisplayStatus && currentDisplayStatus !== 'Not Started') {
    confirmReverification(sourceTable, sourceRecordId);
    return;
  }

  startVerificationRequest(sourceTable, sourceRecordId);
}

function confirmReverification(sourceTable, sourceRecordId) {
  // "window" is nulled by the client-script sandbox, so the Yes/No links use
  // globalThis (a separate reference to the true global object) instead.
  globalThis.__idvConfirmYes = function () {
    g_form.clearMessages();
    startVerificationRequest(sourceTable, sourceRecordId);
  };

  globalThis.__idvConfirmNo = function () {
    g_form.clearMessages();
  };

  var message =
    'A request has already been made and its status is ' +
    getLastKnownDisplayStatus() +
    '. Do you want to request identity verification again? ' +
    '<a href="javascript:void(0);" style="text-decoration: none !important;" class="btn btn-default" onclick="globalThis.__idvConfirmYes();">Yes</a>' +
    ' ' +
    '<a href="javascript:void(0);" style="text-decoration: none !important;" class="btn btn-default" onclick="globalThis.__idvConfirmNo();">No</a>';

  g_form.addFormMessage(message, 'info');
}

function startVerificationRequest(sourceTable, sourceRecordId) {
  showFormMessage('info', 'Starting identity verification...');

  var ga = new GlideAjax('x_entru_entrustidv.VerifyIdentityAjax');
  ga.addParam('sysparm_name', 'startVerification');
  ga.addParam('sysparm_source_table', sourceTable);
  ga.addParam('sysparm_source_record_id', sourceRecordId);

  ga.getXMLAnswer(function (answer) {
    g_form.clearMessages();

    var result = parseResponse(answer);

    if (!result.success) {
      showFormMessage('error', result.message || 'Unable to start identity verification.');
      return;
    }

    applyStatus(result.displayStatus || formatStatus(result.status));
    showFormMessage('info', result.message || 'Identity verification started.');

    if (result.workflowRunId) {
      startPolling(result.workflowRunId, INITIAL_POLL_DELAY_ONCLICK_MS);
    }
  });
}

function startPolling(newWorkflowRunId, initialDelayMs) {
  stopPolling();

  workflowRunId = newWorkflowRunId;
  pollingStartedAt = new Date().getTime();
  consecutiveErrors = 0;

  var delay = typeof initialDelayMs === 'number' ? initialDelayMs : SHORT_TIER_INTERVAL_MS;

  pollingTimer = setTimeout(pollWorkflowRun, delay);
}

function pollWorkflowRun() {
  if (!workflowRunId) {
    return;
  }

  var requestedWorkflowRunId = workflowRunId;

  var ga = new GlideAjax('x_entru_entrustidv.IdvStatusAjax');

  ga.addParam('sysparm_name', 'getStatusByWorkflowRunId');
  ga.addParam('sysparm_workflow_run_id', requestedWorkflowRunId);

  ga.getXMLAnswer(function (answer) {
    if (requestedWorkflowRunId !== workflowRunId) {
      return;
    }

    var result = parseResponse(answer);

    if (!result.success) {
      handlePollingError();
      return;
    }

    consecutiveErrors = 0;

    applyStatus(result.displayStatus || formatStatus(result.status));

    if (!result.shouldPoll) {
      stopPolling();
      return;
    }

    scheduleNextPoll();
  });
}

function scheduleNextPoll() {
  var elapsed = new Date().getTime() - pollingStartedAt;

  if (elapsed >= MAX_POLL_DURATION_MS) {
    stopPolling();
    return;
  }

  var nextInterval = elapsed < SHORT_TIER_LIMIT_MS ? SHORT_TIER_INTERVAL_MS : LONG_TIER_INTERVAL_MS;

  pollingTimer = setTimeout(pollWorkflowRun, nextInterval);
}

function handlePollingError() {
  consecutiveErrors++;

  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    stopPolling();
    return;
  }

  scheduleNextPoll();
}

function stopPolling() {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
  }

  pollingTimer = null;
  workflowRunId = null;
  pollingStartedAt = 0;
  consecutiveErrors = 0;
}

function applyStatus(displayStatus) {
  if (!displayStatus) {
    return;
  }

  setLastKnownDisplayStatus(displayStatus);
  g_form.setValue(STATUS_FIELD, displayStatus);
}

function showFormMessage(type, message) {
  clearDismissTimer();
  if (type === 'error') {
    g_form.addErrorMessage(message);
  } else {
    g_form.addInfoMessage(message);
  }
  scheduleMessageDismiss();
}

function clearDismissTimer() {
  if (messageDismissTimer) {
    clearTimeout(messageDismissTimer);
    messageDismissTimer = null;
  }
}

function scheduleMessageDismiss() {
  clearDismissTimer();
  messageDismissTimer = setTimeout(function () {
    g_form.clearMessages();
    messageDismissTimer = null;
  }, MESSAGE_AUTO_DISMISS_MS);
}

function parseResponse(answer) {
  if (!answer) {
    return { success: false, message: 'No response from server.' };
  }

  if (typeof answer === 'object') {
    return answer;
  }

  try {
    var parsed = JSON.parse(answer);
    return typeof parsed === 'object' && parsed !== null
      ? parsed
      : { success: false, message: String(parsed) };
  } catch (e) {
    return {
      success: false,
      message: String(answer).trim() || 'Unable to process server response.',
    };
  }
}

function formatStatus(status) {
  var normalized = String(status || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  var labels = {
    not_started: 'Not Started',
    awaiting: 'Pending',
    pending: 'Pending',
    awaiting_input: 'In Progress',
    awaiting_client_input: 'In Progress',
    processing: 'In Process',
    review: 'Review Required',
    approved: 'Approved',
    declined: 'Declined',
    abandoned: 'Abandoned',
    error: 'Error',
  };

  return labels[normalized] || status;
}