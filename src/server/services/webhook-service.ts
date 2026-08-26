import { gs } from '@servicenow/glide'
import * as verificationRequestRepository
    from '../repositories/verification-request-repository.ts'

interface EntrustWebhookEvent {
    payload?: EntrustWebhookPayload
}

interface EntrustWebhookPayload {
    resource_type?: string
    action?: string
    object?: {
        id?: string
        task_def_id?: string
        workflow_run_id?: string
        status?: string
        href?: string
    }
    resource?: {
        id?: string
        workflow_run_id?: string
        status?: string
    }
}

const STATUS_IN_PROGRESS = 'in_progress'

const TERMINAL_STATUSES = [
    'approved',
    'declined',
    'review',
    'abandoned',
    'error',
]

export function processWebhook(event: EntrustWebhookEvent): void {
    const payload = event.payload

    if (!payload) {
        throw new Error('Webhook payload is missing')
    }

    if (!payload.action) {
        throw new Error('Webhook action is missing')
    }

    gs.info(
        `[EntrustWebhook] Event received action=${payload.action}, ` +
            `resource_type=${payload.resource_type || ''}`
    )

    switch (payload.action) {
        case 'workflow_task.started':
        case 'workflow_task.completed':
            processWorkflowTaskEvent(payload)
            break

        case 'workflow_run.completed':
            processWorkflowRunCompleted(payload)
            break

        case 'workflow_run_evidence_folder.created':
            processEvidenceFolderCreated(payload)
            break

        default:
            gs.info(
                `[EntrustWebhook] Ignoring unsupported event action=${payload.action}`
            )
    }
}

function processWorkflowTaskEvent(
    payload: EntrustWebhookPayload
): void {
    const workflowRunId = payload.object?.workflow_run_id

    if (!workflowRunId) {
        throw new Error(
            `workflow_run_id missing for ${payload.action}`
        )
    }

    const verificationRequest =
    verificationRequestRepository.findVerificationRequestByWorkflowRunId(
      workflowRunId,
    )
  
    if (!verificationRequest) {
        gs.warn(
        `[ENTRUST_WEBHOOK] No verification request found for workflow_run_id=${workflowRunId}`,
        )
        return
    }

    const currentStatus = String(
        verificationRequest.status || ''
    ).toLowerCase()

    if (TERMINAL_STATUSES.includes(currentStatus)) {
        return
    }

    if (currentStatus !== STATUS_IN_PROGRESS) {
        verificationRequestRepository.updateStatusByWorkflowRunId(
            workflowRunId,
            STATUS_IN_PROGRESS
        )
    }
}

function processWorkflowRunCompleted(
    payload: EntrustWebhookPayload
): void {
    const workflowRunId =
        payload.resource?.id ||
        payload.object?.id

    const status =
        payload.resource?.status ||
        payload.object?.status

    if (!workflowRunId || !status) {
        throw new Error(
            'workflow_run.completed payload is missing required data'
        )
    }

    verificationRequestRepository.updateStatusByWorkflowRunId(
        workflowRunId,
        status
    )
}

function processEvidenceFolderCreated(
    payload: EntrustWebhookPayload
): void {
    const workflowRunId =
        payload.object?.workflow_run_id ||
        payload.resource?.workflow_run_id

    const evidenceFolderHref =
        payload.object?.href

    if (!workflowRunId || !evidenceFolderHref) {
        throw new Error(
            'workflow_run_evidence_folder.created payload is missing required data'
        )
    }

    verificationRequestRepository.updateEvidenceFolderHrefByWorkflowRunId(
        workflowRunId,
        evidenceFolderHref
    )
}