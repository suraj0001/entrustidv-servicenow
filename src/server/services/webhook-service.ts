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

    gs.info('[IDV_WEBHOOK] action=' + (payload.action || 'unknown'))

    if (payload.action === 'workflow_run_evidence_folder.created') {
        const workflowRunId =
            payload.resource?.workflow_run_id ||
            payload.object?.workflow_run_id ||
            payload.object?.id ||
            ''

        const evidenceFolderHref = payload.object?.href || ''

        if (!workflowRunId || !evidenceFolderHref) {
            gs.error(
                '[IDV_WEBHOOK] Evidence folder event missing workflow_run_id or href',
            )

            return {
                status: 'error',
                message: 'Missing workflow run id or evidence folder href',
            }
        }

        const updated = updateEvidenceFolderByWorkflowRunId(
            workflowRunId,
            evidenceFolderHref,
        )

        if (!updated) {
            gs.warn(
                '[IDV_WEBHOOK] No verification request found for evidence folder workflow_run_id=' +
                    workflowRunId,
            )

            return { status: 'not_found' }
        }

        gs.info(
            '[IDV_WEBHOOK] Evidence folder reference saved workflow_run_id=' +
                workflowRunId,
        )

        return { status: 'success' }
    }

    // For all workflow status events, update the verification status
    const workflowRunId =
        payload.resource?.workflow_run_id ||
        payload.resource?.id ||
        payload.object?.workflow_run_id ||
        payload.object?.id ||
        ''

    const workflowStatus =
        payload.resource?.status || payload.object?.status || ''

    if (!workflowRunId || !workflowStatus) {
        gs.error(
            '[IDV_WEBHOOK] Missing workflow_run_id or status for action=' +
                payload.action,
        )

        return {
            status: 'error',
            message: 'Missing workflow run id or status',
        }
    }

    const updated = updateVerificationStatusByWorkflowRunId(
        workflowRunId,
        workflowStatus,
    )

    if (!updated) {
        gs.warn(
            '[IDV_WEBHOOK] No verification request found for workflow_run_id=' +
                workflowRunId,
        )

        return { status: 'not_found' }
    }

    gs.info(
        '[IDV_WEBHOOK] Verification status updated workflow_run_id=' +
            workflowRunId +
            ' status=' +
            workflowStatus,
    )

    return { status: 'success' }
}