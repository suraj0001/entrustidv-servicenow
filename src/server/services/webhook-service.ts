import { gs } from '@servicenow/glide'

import {
    updateEvidenceFolderByWorkflowRunId,
    updateVerificationStatusByWorkflowRunId,
} from '../repositories/verification-request-repository.ts'

export interface WebhookHandleResult {
    status: 'success' | 'ignored' | 'not_found' | 'error'
    message?: string
}

interface WorkflowWebhookPayload {
    payload?: {
        action?: string
        resource_type?: string

        object?: {
            id?: string
            workflow_run_id?: string
            status?: string
            task_spec_id?: string
            task_def_id?: string
            href?: string
            started_at_iso8601?: string
            completed_at_iso8601?: string
        }

        resource?: {
            id?: string
            workflow_run_id?: string
            status?: string
            applicant_id?: string
            workflow_id?: string
            task_def_id?: string

            output?: {
                workflow_output?: string
            }
        }
    }
}

export function processWebhook(
    body: WorkflowWebhookPayload,
): WebhookHandleResult {
    const payload = body?.payload

    if (!payload) {
        gs.error('[IDV_WEBHOOK] Invalid or missing payload')

        return {
            status: 'error',
            message: 'Invalid payload structure',
        }
    }

    switch (payload.action) {
        case 'workflow_task.started':
            return processWorkflowTaskStarted(payload)

        case 'workflow_task.completed':
            return processWorkflowTaskCompleted(payload)

        case 'workflow_run.completed':
            return processWorkflowRunCompleted(payload)

        case 'workflow_run_evidence_folder.created':
            return processEvidenceFolderCreated(payload)    

        default:
            return {
                status: 'ignored',
            }
    }
}

function processWorkflowTaskStarted(
    payload: NonNullable<WorkflowWebhookPayload['payload']>,
): WebhookHandleResult {
    if (payload.resource_type !== 'workflow_task') {
        return {
            status: 'error',
            message: 'Invalid resource type for workflow_task.started',
        }
    }

    const workflowRunId =
        payload.resource?.workflow_run_id ||
        payload.object?.workflow_run_id ||
        ''

    if (!workflowRunId) {
        gs.error(
            '[IDV_WEBHOOK] workflow_task.started missing workflow_run_id',
        )

        return {
            status: 'error',
            message: 'Missing workflow run id',
        }
    }

    gs.info(
        '[IDV_WEBHOOK] workflow_task.started' +
            ' workflow_run_id=' +
            workflowRunId +
            ' task_id=' +
            (payload.object?.id || ''),
    )

    return updateStatus(
        workflowRunId,
        payload.resource.status,
    )
}

function processWorkflowTaskCompleted(
    payload: NonNullable<WorkflowWebhookPayload['payload']>,
): WebhookHandleResult {
    if (payload.resource_type !== 'workflow_task') {
        return {
            status: 'error',
            message: 'Invalid resource type for workflow_task.completed',
        }
    }

    const workflowRunId =
        payload.resource?.workflow_run_id ||
        payload.object?.workflow_run_id ||
        ''

    if (!workflowRunId) {
        gs.error(
            '[IDV_WEBHOOK] workflow_task.completed missing workflow_run_id',
        )

        return {
            status: 'error',
            message: 'Missing workflow run id',
        }
    }

    gs.info(
        '[IDV_WEBHOOK] workflow_task.completed' +
            ' workflow_run_id=' +
            workflowRunId +
            ' task_id=' +
            (payload.object?.id || '') +
            ' task_status=' +
            (payload.object?.status || ''),
    )

    /*
     * A completed task does NOT mean the workflow run is complete.
     *
     * Keep the overall verification in "processing".
     */
    return updateStatus(
        workflowRunId,
        'processing',
    )
}

function processWorkflowRunCompleted(
    payload: NonNullable<WorkflowWebhookPayload['payload']>,
): WebhookHandleResult {
    if (payload.resource_type !== 'workflow_run') {
        return {
            status: 'error',
            message: 'Invalid resource type for workflow_run.completed',
        }
    }

    const workflowRunId =
        payload.resource?.id ||
        payload.object?.id ||
        ''

    const workflowStatus =
        payload.resource?.status ||
        payload.object?.status ||
        ''

    if (!workflowRunId || !workflowStatus) {
        gs.error(
            '[IDV_WEBHOOK] workflow_run.completed missing workflow_run_id or status',
        )

        return {
            status: 'error',
            message: 'Missing workflow run id or status',
        }
    }

    gs.info(
        '[IDV_WEBHOOK] workflow_run.completed' +
            ' workflow_run_id=' +
            workflowRunId +
            ' status=' +
            workflowStatus,
    )

    return updateStatus(
        workflowRunId,
        workflowStatus,
    )
}

function updateStatus(
    workflowRunId: string,
    status: string,
): WebhookHandleResult {
    const source =
        updateVerificationStatusByWorkflowRunId(
            workflowRunId,
            status,
        )

    if (!source) {
        gs.warn(
            '[IDV_WEBHOOK] No verification request found for workflow_run_id=' +
                workflowRunId,
        )

        return {
            status: 'not_found',
        }
    }

    gs.info(
        '[IDV_WEBHOOK] Verification status updated' +
            ' workflow_run_id=' +
            workflowRunId +
            ' status=' +
            status,
    )

    return {
        status: 'success',
    }
}

function processEvidenceFolderCreated(
    payload: NonNullable<WorkflowWebhookPayload['payload']>,
): WebhookHandleResult {
    if (
        payload.resource_type !==
        'workflow_run_evidence_folder'
    ) {
        return {
            status: 'error',
            message:
                'Invalid resource type for workflow_run_evidence_folder.created',
        }
    }

    const workflowRunId =
        payload.resource?.workflow_run_id ||
        payload.object?.workflow_run_id ||
        payload.object?.id ||
        ''

    const evidenceFolderHref =
        payload.object?.href || ''

    if (!workflowRunId || !evidenceFolderHref) {
        gs.error(
            '[IDV_WEBHOOK] Evidence folder event missing workflow_run_id or href',
        )

        return {
            status: 'error',
            message:
                'Missing workflow run id or evidence folder href',
        }
    }

    const updated =
        updateEvidenceFolderByWorkflowRunId(
            workflowRunId,
            evidenceFolderHref,
        )

    if (!updated) {
        gs.warn(
            '[IDV_WEBHOOK] No verification request found for evidence folder workflow_run_id=' +
                workflowRunId,
        )

        return {
            status: 'not_found',
        }
    }

    gs.info(
        '[IDV_WEBHOOK] Evidence folder reference saved' +
            ' workflow_run_id=' +
            workflowRunId,
    )

    return {
        status: 'success',
    }
}