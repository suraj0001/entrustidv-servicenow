import { gs } from '@servicenow/glide'
import * as verificationRequestRepository
    from '../repositories/verification-request-repository.ts'
import * as configurationRepository
    from '../repositories/configuration-repository.ts'
    import { addWorkNote, getCompletionActivityMessage } from './activity-service.ts'

interface EntrustWebhookEvent {
    payload?: EntrustWebhookPayload
}

interface EntrustWebhookPayload {
    resource_type?: string
    action?: string
    object?: {
        id?: string
        workflow_run_id?: string
        status?: string
        href?: string
        [key: string]: any
    }
    resource?: {
        id?: string
        workflow_id?: string
        workflow_run_id?: string
        status?: string
        reasons?: string[]
        href?: string
        [key: string]: any
    }
    [key: string]: any
}

export function processWebhook(event: EntrustWebhookEvent): void {
    const payload = event.payload

    if (!payload || !payload.action) {
        return
    }

    switch (payload.action) {
        case 'workflow_run.completed':
            processWorkflowRunCompleted(payload)
            break

        case 'workflow_run_evidence_folder.created':
            processEvidenceFolderCreated(payload)
            break

        default:
            // Ignore unsupported event actions
            break
    }
}

function processWorkflowRunCompleted(
    payload: EntrustWebhookPayload
): void {
    const workflowRunId =
        payload.resource?.id ||
        payload.object?.id ||
        payload.object?.workflow_run_id ||
        payload.resource?.workflow_run_id

    const status =
        payload.resource?.status ||
        payload.object?.status

    const eventWorkflowId =
        payload.resource?.workflow_id ||
        payload.object?.workflow_id

    if (!workflowRunId || !status) {
        return
    }

    // Reject events from other workflows if workflow_id is configured
    const config = configurationRepository.getVerificationSettings()
    if (
        eventWorkflowId &&
        config?.workflowId &&
        eventWorkflowId !== config.workflowId
    ) {
        gs.info(
            `[EntrustWebhook] Ignoring event for unrelated workflow_id=${eventWorkflowId}`
        )
        return
    }

    const verificationRequest =
        verificationRequestRepository.findVerificationRequestByWorkflowRunId(
            workflowRunId
        )

    if (!verificationRequest) {
        return
    }

    verificationRequestRepository.updateStatusByWorkflowRunId(
        workflowRunId,
        status
    )

    addWorkNote(
        verificationRequest.sourceTable, 
        verificationRequest.sourceRecordId,
        getCompletionActivityMessage(status)
    );
}

function processEvidenceFolderCreated(
    payload: EntrustWebhookPayload
): void {
    const workflowRunId =
        payload.object?.workflow_run_id ||
        payload.resource?.workflow_run_id ||
        payload.object?.id ||
        payload.resource?.id

    const evidenceFolderHref =
        payload.object?.href ||
        payload.resource?.href

    if (!workflowRunId || !evidenceFolderHref) {
        return
    }

    const verificationRequest =
        verificationRequestRepository.findVerificationRequestByWorkflowRunId(
            workflowRunId
        )

    if (!verificationRequest) {
        return
    }

    verificationRequestRepository.updateEvidenceFolderHrefByWorkflowRunId(
        workflowRunId,
        evidenceFolderHref
    )
}