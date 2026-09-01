import { gs } from '@servicenow/glide'
import { VERIFICATION_REQUEST_CREATED_EVENT } from '../constants.ts'
import {
    createApplicant,
    createWorkflowRun,
} from '../entrust/entrust-verification-client.ts'
import { getVerificationConfiguration } from '../repositories/configuration-repository.ts'
import { ApiConnectionRepository } from '../repositories/connection-credential-repository.ts'
import { findSourceRecordContext } from '../repositories/source-record-repository.ts'
import { findSubjectUser } from '../repositories/subject-user-repository.ts'
import {
    createVerificationRequest,
    findLatestVerificationStatus,
    findVerificationRequestById,
} from '../repositories/verification-request-repository.ts'

export interface StartVerificationResult {
    verificationRequestId: string
    workflowRunId: string
    smartCaptureUrl: string
    status: string
    displayStatus: string
}

export function startVerification(
    sourceTable: string,
    sourceRecordId: string,
): StartVerificationResult {
    gs.info(`[VerificationService] startVerification: sourceTable=${sourceTable}, sourceRecordId=${sourceRecordId}`)

    // Resolve source record and determine the subject user (incident → caller_id, HR case → subject_person)
    const sourceContext = findSourceRecordContext(sourceTable, sourceRecordId)
    if (!sourceContext) {
        throw new Error('Unable to resolve the source record or subject user.')
    }
    gs.info(`[VerificationService] sourceContext resolved: sourceTable=${sourceContext.sourceTable}, sourceRecordId=${sourceContext.sourceRecordId}, subjectUserId=${sourceContext.subjectUserId}`)

    if (
        findLatestVerificationStatus(
            sourceContext.sourceTable,
            sourceContext.sourceRecordId,
        )
    ) {
        throw new Error(
            'Identity verification has already been started for this record.',
        )
    }

    // Load the ServiceNow user record
    const subjectUser = findSubjectUser(sourceContext.subjectUserId)
    if (!subjectUser) {
        throw new Error('Unable to resolve the subject user.')
    }

    // Validate required fields before making any Entrust API calls
    if (!subjectUser.firstName || !subjectUser.lastName) {
        throw new Error(
            'The subject user must have a first name and last name.',
        )
    }

    if (!subjectUser.email) {
        throw new Error('The subject user must have an email address.')
    }

    // Load verification configuration (workflow ID, link expiry, redirect URL)
    const configuration = getVerificationConfiguration()
    if (!configuration) {
        throw new Error(
            'Verification configuration is not complete. Please contact your administrator.',
        )
    }

    // Resolve the Entrust API connection and OAuth credentials
    const connection = new ApiConnectionRepository().getRuntimeConnection()
    if (!connection) {
        throw new Error('Entrust API connection is not configured.')
    }

    const applicant = createApplicant(connection, {
        firstName: subjectUser.firstName,
        lastName: subjectUser.lastName,
    })
    const applicantId = applicant.applicantId
    gs.info(`[VerificationService] Entrust applicant created: applicantId=${applicantId}`)

    // create a fresh workflow run
    const workflowRun = createWorkflowRun(connection, {
        applicantId,
        workflowId: configuration.workflowId,
        expiresAt: calculateExpiry(configuration.linkExpiryMinutes),
        redirectUrl: configuration.redirectUrl || undefined,
    })

    gs.info(`[VerificationService] Workflow run created: workflowRunId=${workflowRun.workflowRunId}, status=${workflowRun.status}, workflowVersionId=${workflowRun.workflowVersionId}`)

    // Persist only after Entrust confirms the workflow run was created
    const verificationRequestId = createVerificationRequest({
        sourceTable: sourceContext.sourceTable,
        sourceRecordId: sourceContext.sourceRecordId,
        subjectUserId: sourceContext.subjectUserId,
        applicantId,
        workflowId: configuration.workflowId,
        workflowVersionId: String(workflowRun.workflowVersionId),
        workflowRunId: workflowRun.workflowRunId,
        status: workflowRun.status,
    })

    const verificationRequest = findVerificationRequestById(
        verificationRequestId,
    )

    if (!verificationRequest) {
        throw new Error('Unable to resolve the created verification request.')
    }

    gs.info(`[VerificationService] Verification request persisted: verificationRequestId=${verificationRequestId}`)

    gs.eventQueue(
        VERIFICATION_REQUEST_CREATED_EVENT,
        verificationRequest,
        workflowRun.smartCaptureUrl,
        sourceContext.sourceRecordNumber,
    )
    gs.info(`[VerificationService] Event queued: ${VERIFICATION_REQUEST_CREATED_EVENT}, returning status=${workflowRun.status}`)

    // Timestamp the request was inserted, used to build the initial display status
    const createdAt = verificationRequest.getValue('sys_created_on') as string

    return {
        verificationRequestId,
        workflowRunId: workflowRun.workflowRunId,
        smartCaptureUrl: workflowRun.smartCaptureUrl,
        status: workflowRun.status,
        displayStatus: `In Progress - ${createdAt}`,
    }
}

function calculateExpiry(linkExpiryMinutes: number): string {
    return new Date(Date.now() + linkExpiryMinutes * 60 * 1000).toISOString()
}
