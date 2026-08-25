import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'

import { loadVerificationStatus } from '../../server/business-rules/display-verification-status.ts'

BusinessRule({
    $id: Now.ID['display_verification_status_incident'],
    name: 'IDV - Display Verification Status - Incident',
    table: 'incident',
    when: 'display',
    order: 100,
    active: true,
    script: loadVerificationStatus,
})

BusinessRule({
    $id: Now.ID['display_verification_status_hr_case'],
    name: 'IDV - Display Verification Status - HR Case',
    table: 'sn_hr_core_case',
    when: 'display',
    order: 100,
    active: true,
    script: loadVerificationStatus,
})