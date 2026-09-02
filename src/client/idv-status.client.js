/* eslint-disable */

var STATUS_FIELD = 'x_entru_entrustidv_verification_status';

var POLL_INTERVAL_MS = 5000;
var INITIAL_POLL_DELAY_ONLOAD_MS = 5000;
var INITIAL_POLL_DELAY_ONCLICK_MS = 20000;
var MAX_POLL_DURATION_MS = 30 * 60 * 1000;
var MAX_CONSECUTIVE_ERRORS = 3;
var MESSAGE_AUTO_DISMISS_MS = 10000;

var workflowRunId = null;
var pollingStartedAt = 0;
var consecutiveErrors = 0;
var pollingTimer = null;
var messageDismissTimer = null;

function onLoad() {
    var sourceTable = g_form.getTableName();
    var sourceSysId = g_form.getUniqueValue();

    if (!sourceSysId) {
        return;
    }

    g_form.setReadOnly(STATUS_FIELD, true);

    loadInitialStatus(sourceTable, sourceSysId);
}

function loadInitialStatus(sourceTable, sourceSysId) {
    var ga = new GlideAjax('x_entru_entrustidv.IdvStatusAjax');
    ga.addParam('sysparm_name', 'getLatestStatus');
    ga.addParam('sysparm_table', sourceTable);
    ga.addParam('sysparm_sys_id', sourceSysId);

    ga.getXMLAnswer(function (answer) {
        var result = parseResponse(answer);

        if (!result.success) {
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

function executeVerifyIdentity() {
    var sourceTable = g_form.getTableName();
    var sourceRecordId = g_form.getUniqueValue();

    if (!sourceRecordId) {
        return;
    }

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

    var delay =
        typeof initialDelayMs === 'number'
            ? initialDelayMs
            : POLL_INTERVAL_MS;

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
        console.log(
            '[idv-status.client.js] Polling ended (max duration ' +
                MAX_POLL_DURATION_MS / 1000 +
                's reached): workflowRunId=' +
                workflowRunId
        );
        stopPolling();
        return;
    }

    pollingTimer = setTimeout(pollWorkflowRun, POLL_INTERVAL_MS);
}

function handlePollingError() {
    consecutiveErrors++;

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(
            '[idv-status.client.js] Polling ended (max consecutive errors ' +
                MAX_CONSECUTIVE_ERRORS +
                ' reached): workflowRunId=' +
                workflowRunId
        );
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
        return { success: false, message: String(answer).trim() || 'Unable to process server response.' };
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
