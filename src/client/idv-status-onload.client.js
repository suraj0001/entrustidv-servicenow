/* eslint-disable */

var IDV_STATUS_FIELD =
    'x_entru_entrustidv_verification_status';

var IDV_POLL_INTERVAL_MS = 5000;
var IDV_MAX_POLL_DURATION_MS = 10 * 60 * 1000;
var IDV_MAX_CONSECUTIVE_ERRORS = 3;

window.EntrustIdv =
    window.EntrustIdv ||
    (function () {
        var timer = null;
        var startedAt = 0;
        var errorCount = 0;
        var workflowRunId = null;

        function startPolling(runId) {
            if (!runId) {
                return;
            }

            if (timer) {
                clearTimeout(timer);
                timer = null;
            }

            workflowRunId = runId;
            startedAt = new Date().getTime();
            errorCount = 0;

            console.log(
                '[idv-status-onload.client.js] Polling started: workflowRunId=' +
                    runId
            );

            scheduleNextPoll();
        }

        function pollWorkflowRun() {
            if (!workflowRunId) {
                return;
            }

            /*
             * Remember which workflow this request
             * belongs to.
             *
             * If another verification starts while
             * this request is in progress, we can
             * safely ignore this old response.
             */
            var requestedWorkflowRunId =
                workflowRunId;

            var ga = new GlideAjax(
                'x_entru_entrustidv.IdvStatusAjax'
            );

            ga.addParam(
                'sysparm_name',
                'getStatusByWorkflowRunId'
            );

            ga.addParam(
                'sysparm_workflow_run_id',
                requestedWorkflowRunId
            );

            ga.getXMLAnswer(function (answer) {
                /*
                 * Ignore a response belonging to an
                 * older verification attempt.
                 */
                if (
                    requestedWorkflowRunId !==
                    workflowRunId
                ) {
                    return;
                }

                var result =
                    parseIdvStatusResponse(answer);

                if (!result) {
                    handlePollingError();
                    return;
                }

                errorCount = 0;

                applyIdvStatus(
                    result.displayStatus ||
                    formatIdvStatus(result.status)
                );

                if (!result.shouldPoll) {
                    console.log(
                        '[idv-status-onload.client.js] Polling completed (terminal status): workflowRunId=' +
                            requestedWorkflowRunId +
                            ', status=' +
                            result.status +
                            ', displayStatus=' +
                            (result.displayStatus ||
                                formatIdvStatus(result.status))
                    );
                    stopPolling();
                    return;
                }

                console.log(
                    '[idv-status-onload.client.js] Polling in progress: workflowRunId=' +
                        requestedWorkflowRunId +
                        ', status=' +
                        result.status +
                        ', displayStatus=' +
                        (result.displayStatus ||
                            formatIdvStatus(result.status))
                );

                scheduleNextPoll();
            });
        }

        function scheduleNextPoll() {
            var elapsed =
                new Date().getTime() -
                startedAt;

            if (
                elapsed >=
                IDV_MAX_POLL_DURATION_MS
            ) {
                console.log(
                    '[idv-status-onload.client.js] Polling ended (max duration ' +
                        IDV_MAX_POLL_DURATION_MS / 1000 +
                        's reached): workflowRunId=' +
                        workflowRunId
                );
                stopPolling();
                return;
            }

            timer = setTimeout(
                pollWorkflowRun,
                IDV_POLL_INTERVAL_MS
            );
        }

        function handlePollingError() {
            errorCount++;

            if (
                errorCount >=
                IDV_MAX_CONSECUTIVE_ERRORS
            ) {
                console.log(
                    '[idv-status-onload.client.js] Polling ended (max consecutive errors ' +
                        IDV_MAX_CONSECUTIVE_ERRORS +
                        ' reached): workflowRunId=' +
                        workflowRunId
                );
                stopPolling();
                return;
            }

            scheduleNextPoll();
        }

        function stopPolling() {
            if (timer) {
                clearTimeout(timer);
            }

            timer = null;
            workflowRunId = null;
            startedAt = 0;
            errorCount = 0;
        }

        function isPolling() {
            return !!workflowRunId;
        }

        return {
            startPolling: startPolling,
            isPolling: isPolling
        };
    })();

function onLoad() {
    var sourceTable =
        g_form.getTableName();

    var sourceSysId =
        g_form.getUniqueValue();

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
        /*
         * Verify Identity may have been clicked while
         * this initial request was still in progress.
         *
         * If polling has already started for the new
         * workflow, ignore this old initial response.
         */
        if (
            window.EntrustIdv.isPolling()
        ) {
            return;
        }

        var result =
            parseIdvStatusResponse(answer);

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
            console.log(
                '[idv-status-onload.client.js] Initial status requires polling: workflowRunId=' +
                    result.workflowRunId +
                    ', status=' +
                    result.status +
                    ', displayStatus=' +
                    (result.displayStatus ||
                        formatIdvStatus(result.status))
            );
            window.EntrustIdv.startPolling(
                result.workflowRunId
            );
        } else {
            console.log(
                '[idv-status-onload.client.js] Initial status loaded, polling not required: workflowRunId=' +
                    (result.workflowRunId || 'none') +
                    ', status=' +
                    result.status +
                    ', displayStatus=' +
                    (result.displayStatus ||
                        formatIdvStatus(result.status))
            );
        }
    });
}

function applyIdvStatus(
    displayStatus
) {
    if (!displayStatus) {
        return;
    }

    g_form.setValue(
        IDV_STATUS_FIELD,
        displayStatus
    );
}

function parseIdvStatusResponse(
    answer
) {
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

function formatIdvStatus(
    status
) {
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
        error: 'Error'
    };

    return labels[normalized] || status;
}