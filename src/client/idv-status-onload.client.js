/* eslint-disable */

var IDV_STATUS_FIELD =
    'x_entru_entrustidv_verification_status';

var IDV_POLL_INTERVAL_MS = 5000;
var IDV_MAX_POLL_DURATION_MS = 10 * 60 * 1000;
var IDV_MAX_CONSECUTIVE_ERRORS = 3;

var idvPollingTimer = null;
var idvPollingStartedAt = 0;
var idvPollingErrors = 0;
var idvPollingWorkflowRunId = null;

function onLoad() {
    var sourceTable = g_form.getTableName();
    var sourceSysId = g_form.getUniqueValue();

    if (!sourceSysId) {
        return;
    }

    g_form.setReadOnly(
        IDV_STATUS_FIELD,
        true
    );

    loadInitialIdvStatus(
        sourceTable,
        sourceSysId
    );
}

function loadInitialIdvStatus(
    sourceTable,
    sourceSysId
) {
    var ga = new GlideAjax(
        'x_entru_entrustidv.IdvStatusAjax'
    );

   ga.addParam(
        'sysparm_name',
        'getLatestStatus'
    );

    ga.addParam(
        'sysparm_table',
        sourceTable
    );

    ga.addParam(
        'sysparm_sys_id',
        sourceSysId
    );

    ga.getXMLAnswer(function (answer) {
        var result = parseIdvStatusResponse(
            answer
        );

        if (!result) {
            return;
        }

        applyIdvStatus(
            result.displayStatus ||
            formatIdvStatus(result.status)
        );

        if (
            result.shouldPoll &&
            result.workflowRunId
        ) {
            startIdvStatusPolling(
                result.workflowRunId
            );
        }
    });
}

/*
 * Shared function.
 *
 * Called by:
 * 1. onLoad when an active verification already exists
 * 2. Verify Identity after a new workflow is created
 */
function startIdvStatusPolling(
    workflowRunId
) {
    if (!workflowRunId) {
        return;
    }

    /*
     * Stop any previous polling loop.
     * Important when another verification attempt
     * is started from the same form.
     */
    if (idvPollingTimer) {
        clearTimeout(idvPollingTimer);
        idvPollingTimer = null;
    }

    idvPollingWorkflowRunId =
        workflowRunId;

    idvPollingStartedAt =
        new Date().getTime();

    idvPollingErrors = 0;

    scheduleNextIdvPoll();
}

function pollIdvWorkflowRun() {
    if (!idvPollingWorkflowRunId) {
        return;
    }

    var ga = new GlideAjax(
        'x_entru_entrustidv.IdvStatusAjax'
    );

    ga.addParam(
        'sysparm_name',
        'getStatusByWorkflowRunId'
    );

    ga.addParam(
        'sysparm_workflow_run_id',
        idvPollingWorkflowRunId
    );

    ga.getXMLAnswer(function (answer) {
        var result = parseIdvStatusResponse(
            answer
        );

        if (!result) {
            handleIdvPollingError();
            return;
        }

        idvPollingErrors = 0;

        applyIdvStatus(
            result.displayStatus ||
            formatIdvStatus(result.status)
        );

        if (!result.shouldPoll) {
            stopIdvStatusPolling();
            return;
        }

        scheduleNextIdvPoll();
    });
}

function scheduleNextIdvPoll() {
    var elapsed =
        new Date().getTime() -
        idvPollingStartedAt;

    if (
        elapsed >=
        IDV_MAX_POLL_DURATION_MS
    ) {
        stopIdvStatusPolling();
        return;
    }

    idvPollingTimer = setTimeout(
        pollIdvWorkflowRun,
        IDV_POLL_INTERVAL_MS
    );
}

function handleIdvPollingError() {
    idvPollingErrors++;

    if (
        idvPollingErrors >=
        IDV_MAX_CONSECUTIVE_ERRORS
    ) {
        stopIdvStatusPolling();
        return;
    }

    scheduleNextIdvPoll();
}

function stopIdvStatusPolling() {
    if (idvPollingTimer) {
        clearTimeout(idvPollingTimer);
    }

    idvPollingTimer = null;
    idvPollingWorkflowRunId = null;
    idvPollingStartedAt = 0;
    idvPollingErrors = 0;
}

function applyIdvStatus(displayStatus) {
    if (!displayStatus) {
        return;
    }

    g_form.setValue(
        IDV_STATUS_FIELD,
        displayStatus
    );
}

function parseIdvStatusResponse(answer) {
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
    } catch (e) {
        return null;
    }
}

function formatIdvStatus(status) {
    var normalized =
        String(status || '')
            .toLowerCase()
            .replace(/[\s-]+/g, '_');

    var labels = {
        not_started: 'Not Started',
        awaiting: 'Pending',
        pending: 'Pending',
        awaiting_input: 'Awaiting Input',
        awaiting_client_input: 'Awaiting Input',
        processing: 'In Process',
        review: 'Review Required',
        approved: 'Approved',
        declined: 'Declined',
        abandoned: 'Abandoned',
        error: 'Error',
    };

    return labels[normalized] || status;
}