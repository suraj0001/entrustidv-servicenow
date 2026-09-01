import { gs } from '@servicenow/glide'
import * as verificationRequestRepository
    from '../repositories/verification-request-repository.ts'
import * as configurationRepository
    from '../repositories/configuration-repository.ts'
import * as sourceRecordRepository
    from '../repositories/source-record-repository.ts'

interface EntrustWebhookEvent {
    payload?: EntrustWebhookPayload
}

interface EntrustWebhookPayload {
    resource_type?: string
    action?: string
    object?: {
        id?: string
        task_spec_id?: string
        task_def_id?: string
        workflow_run_id?: string
        status?: string
        href?: string
        started_at_iso8601?: string
        completed_at_iso8601?: string
        created_at_iso8601?: string
        [key: string]: any
    }
    resource?: {
        id?: string
        task_def_id?: string
        task_def_version?: string | number | null
        workflow_id?: string
        workflow_run_id?: string
        status?: string
        reasons?: string[]
        href?: string
        input?: Record<string, any>
        output?: Record<string, any> | null
        created_at?: string
        updated_at?: string
        [key: string]: any
    }
    [key: string]: any
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

    if (!payload || !payload.action) {
        return
    }

    const action = payload.action

    switch (action) {
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
            // Ignore unsupported event actions
            break
    }
}

function processWorkflowTaskEvent(
    payload: EntrustWebhookPayload
): void {
    const taskDefId = extractTaskDefId(payload)
    const action = payload.action || ''

    // 1. Fast in-memory check to filter out internal pipeline machinery and noisy check.started events
    if (!isMeaningfulTask(taskDefId, action)) {
        return
    }

    const workflowRunId =
        payload.object?.workflow_run_id ||
        payload.resource?.workflow_run_id

    if (!workflowRunId) {
        return
    }

    // 2. Reject events that do not belong to our ServiceNow verification requests
    const verificationRequest =
        verificationRequestRepository.findVerificationRequestByWorkflowRunId(
            workflowRunId
        )

    if (!verificationRequest) {
        return
    }

    const currentStatus = String(
        verificationRequest.status || ''
    ).toLowerCase()

    if (TERMINAL_STATUSES.includes(currentStatus)) {
        return
    }

    // 3. Update status to in_progress if not already
    if (currentStatus !== STATUS_IN_PROGRESS) {
        verificationRequestRepository.updateStatusByWorkflowRunId(
            workflowRunId,
            STATUS_IN_PROGRESS
        )
    }

    // 4. Post clean, meaningful Work Note to source record (Incident / HR Case)
    const workNoteMessage = formatTaskWorkNote(taskDefId, action)
    if (workNoteMessage) {
        sourceRecordRepository.addWorkNote(
            verificationRequest.sourceTable,
            verificationRequest.sourceRecordId,
            workNoteMessage
        )
    }
}

function isMeaningfulTask(taskDefId: string, action: string): boolean {
    if (!taskDefId) {
        return false
    }

    // Drop internal routing & storage nodes
    if (
        taskDefId === 'condition' ||
        taskDefId.startsWith('pass_') ||
        taskDefId.startsWith('biometric_')
    ) {
        return false
    }

    // Drop .started for backend checks EXCEPT document_check.started
    if (
        action === 'workflow_task.started' &&
        taskDefId !== 'document_check' &&
        (taskDefId.includes('_check') || taskDefId.endsWith('_check'))
    ) {
        return false
    }

    // Keep start, document_check, upload_*, profile_*, and completed checks
    return (
        taskDefId === 'start' ||
        taskDefId === 'document_check' ||
        taskDefId.startsWith('upload_') ||
        taskDefId.startsWith('profile_') ||
        taskDefId.includes('_check')
    )
}

function formatTaskWorkNote(taskDefId: string, action: string): string | null {
    if (taskDefId === 'start') {
        if (action === 'workflow_task.started') {
            return 'Applicant opened the verification link and started verification.'
        }
        return null
    }

    if (taskDefId === 'document_check' && action === 'workflow_task.started') {
        return 'Document check is in progress.'
    }

    const readable = taskDefId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

    if (action === 'workflow_task.started') {
        return `Applicant started: ${readable}.`
    }

    if (action === 'workflow_task.completed') {
        return `Completed: ${readable}.`
    }

    return null
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

    const reasons =
        payload.resource?.reasons && payload.resource.reasons.length > 0
            ? ` Reasons: ${payload.resource.reasons.join(', ')}`
            : ''

    sourceRecordRepository.addWorkNote(
        verificationRequest.sourceTable,
        verificationRequest.sourceRecordId,
        `Verification finished with outcome: ${status.toUpperCase()}.${reasons}`
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

    verificationRequestRepository.updateEvidenceFolderHrefByWorkflowRunId(
        workflowRunId,
        evidenceFolderHref
    )
}

function extractTaskDefId(payload: EntrustWebhookPayload): string {
    return (
        payload.object?.task_def_id ||
        payload.resource?.task_def_id ||
        ''
    )
}