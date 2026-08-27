function executeVerifyIdentity() {
    var STATUS_FIELD = 'x_entru_entrustidv_verification_status';

    var sourceTable = g_form.getTableName();
    var sourceRecordId = g_form.getUniqueValue();

    g_form.clearMessages();
    g_form.addInfoMessage('Starting identity verification...');

    var ga = new GlideAjax('VerifyIdentityAjax');

    ga.addParam('sysparm_name', 'startVerification');
    ga.addParam('sysparm_source_table', sourceTable);
    ga.addParam('sysparm_source_record_id', sourceRecordId);

    ga.getXMLAnswer(function (answer) {
        if (!answer) {
            g_form.addErrorMessage(
                'Unable to start identity verification.'
            );
            return;
        }

        var result;

        try {
            result = JSON.parse(answer);
        } catch (e) {
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

        if (result.status) {
            g_form.setValue(
                STATUS_FIELD,
                formatVerificationStatus(result.status)
            );
        }

        g_form.clearMessages();
        g_form.addInfoMessage('Identity verification started.');

       if (result.workflowRunId && window.EntrustIdv && typeof window.EntrustIdv.startPolling === 'function') {
            window.EntrustIdv.startPolling(result.workflowRunId);
        }
    });
}

function formatVerificationStatus(status) {
    var normalized = String(status || '')
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