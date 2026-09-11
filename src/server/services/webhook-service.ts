import { gs } from '@servicenow/glide'
import * as verificationRequestRepository
    from '../repositories/verification-request-repository.ts'
import * as configurationRepository
    from '../repositories/configuration-repository.ts'
import { addWorkNote, getCompletionActivityMessage } from './activity-service.ts'
import { ACTIVITY_MESSAGES } from '../constants.ts'

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
        gs.warn('[EntrustWebhook] Missing workflowRunId or status in workflow_run.completed payload.')
        return
    }

    gs.info(
        `[EntrustWebhook] Received workflow_run.completed: workflowRunId=${workflowRunId}, status=${status}`
    )

    // Reject events from other workflows if workflow_id is configured
    const config = configurationRepository.getConfigSettings()
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
        gs.warn(
            `[EntrustWebhook] No verification request found for workflowRunId=${workflowRunId}`
        )
        return
    }

    const currentNormalized = (verificationRequest.status || '').trim().toLowerCase()
    const newNormalized = status.trim().toLowerCase()
    const isAlreadyTerminal = ['approved', 'declined', 'review', 'abandoned', 'error'].includes(currentNormalized)

    // If already updated to a terminal status (e.g. by fallback polling or previous webhook), skip redundant update
    if (isAlreadyTerminal || currentNormalized === newNormalized) {
        gs.info(
            `[EntrustWebhook] Verification request for workflowRunId=${workflowRunId} is already in state '${verificationRequest.status}' (likely resolved by fallback polling). Skipping redundant update and work note.`
        )
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

    gs.info(
        `[EntrustWebhook] Successfully updated status to '${status}' via webhook for workflowRunId=${workflowRunId}`
    )
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

    if (verificationRequest.evidenceFolderHref === evidenceFolderHref) {
        gs.info(
            `[EntrustWebhook] Evidence folder already recorded for workflowRunId=${workflowRunId}. Skipping.`
        )
        return
    }

    verificationRequestRepository.updateEvidenceFolderHrefByWorkflowRunId(
        workflowRunId,
        evidenceFolderHref
    )

    addWorkNote(
        verificationRequest.sourceTable,
        verificationRequest.sourceRecordId,
        ACTIVITY_MESSAGES.EVIDENCE_FOLDER_CREATED
    );

    gs.info(
        `[EntrustWebhook] Evidence folder recorded for workflowRunId=${workflowRunId}`
    )
}