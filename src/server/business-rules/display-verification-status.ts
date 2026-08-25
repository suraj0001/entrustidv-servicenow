import type { GlideRecord } from '@servicenow/glide'
import { findVerificationStatus } from '../repositories/verification-request-repository'
import { DEFAULT_IDV_STATUS, IDV_STATUS_FIELD } from '../constants'

export function loadVerificationStatus(current: GlideRecord): void {
    const sourceTable = current.getTableName()
    const sourceRecordId = current.getUniqueValue()

    if (!sourceRecordId) {
        return
    }

    const status = findVerificationStatus(
        sourceTable,
        sourceRecordId,
    )

    current.setValue(
        IDV_STATUS_FIELD,
        status || DEFAULT_IDV_STATUS,
    )
}