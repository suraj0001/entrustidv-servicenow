/* eslint-disable */

var STATUS_FIELD = 'x_entru_entrustidv_verification_status';

var POLL_INTERVAL_MS = 5000;
var INITIAL_POLL_DELAY_ONLOAD_MS = 5000;
var INITIAL_POLL_DELAY_ONCLICK_MS = 20000;
var MAX_POLL_DURATION_MS = 30 * 60 * 1000;
var MAX_CONSECUTIVE_ERRORS = 3;

var workflowRunId = null;
var pollingStartedAt = 0;
var consecutiveErrors = 0;
var pollingTimer = null;

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

        if (!result) {
            return;
        }

        applyStatus(
            result.displayStatus || formatStatus(result.status)
        );

        if (result.shouldPoll && result.workflowRunId) {
            console.log(
                '[idv-status.client.js] Initial status loaded, polling will start in ' +
                    INITIAL_POLL_DELAY_ONLOAD_MS / 1000 +
                    's: workflowRunId=' +
                    result.workflowRunId +
                    ', status=' +
                    result.status
            );
            startPolling(
                result.workflowRunId,
                INITIAL_POLL_DELAY_ONLOAD_MS
            );
        } else if (result.workflowRunId) {
            console.log(
                '[idv-status.client.js] Initial status loaded, terminal state: workflowRunId=' +
                    result.workflowRunId +
                    ', status=' +
                    result.status
            );
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

    g_form.clearMessages();
    g_form.addInfoMessage('Starting identity verification...');

    var ga = new GlideAjax('x_entru_entrustidv.VerifyIdentityAjax');

    ga.addParam('sysparm_name', 'startVerification');
    ga.addParam('sysparm_source_table', sourceTable);
    ga.addParam('sysparm_source_record_id', sourceRecordId);

    ga.getXMLAnswer(function (answer) {
        g_form.clearMessages();

        if (!answer) {
            g_form.addErrorMessage(
                'Unable to start identity verification. No response from server.'
            );
            return;
        }

        var result = parseResponse(answer);

        if (!result) {
            g_form.addErrorMessage(
                'Unable to process identity verification response.'
            );
            return;
        }

        if (!result.success) {
            g_form.addErrorMessage(
                result.message || 'Unable to start identity verification.'
            );
            return;
        }

        applyStatus(
            result.displayStatus || formatStatus(result.status)
        );

        g_form.addInfoMessage('Identity verification started.');

        if (result.workflowRunId) {
            console.log(
                '[idv-status.client.js] Identity verification started, polling will begin in ' +
                    INITIAL_POLL_DELAY_ONCLICK_MS / 1000 +
                    's: workflowRunId=' +
                    result.workflowRunId
            );
            startPolling(
                result.workflowRunId,
                INITIAL_POLL_DELAY_ONCLICK_MS
            );
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

        if (!result) {
            handlePollingError();
            return;
        }

        consecutiveErrors = 0;

        applyStatus(
            result.displayStatus || formatStatus(result.status)
        );

        if (!result.shouldPoll) {
            console.log(
                '[idv-status.client.js] Polling completed (terminal status): workflowRunId=' +
                    requestedWorkflowRunId +
                    ', status=' +
                    result.status +
                    ', displayStatus=' +
                    (result.displayStatus || formatStatus(result.status))
            );
            stopPolling();
            return;
        }

        console.log(
            '[idv-status.client.js] Polling in progress: workflowRunId=' +
                requestedWorkflowRunId +
                ', status=' +
                result.status +
                ', displayStatus=' +
                (result.displayStatus || formatStatus(result.status))
        );

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

function parseResponse(answer) {
    if (!answer) {
        return null;
    }

    try {
        var result = JSON.parse(answer);

        if (!result || !result.success) {
            return null;
        }

        return result;
    } catch (e) {
        return null;
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
