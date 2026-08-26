import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['05c5cb434712c31016bda144846d4319'],
    table: 'help_guidance',
    data: {
        active: 'true',
        checklist:
            '<p>Before you begin<br />Have the following available:</p><ul><li>Entrust Identity Verification API credentials</li><li>IDV API region</li><li>IDV Workflow ID</li><li>ServiceNow administrator access</li><li>Webhook Token</li></ul>',
        description: 'Configure the Entrust Identity Verification',
        interaction_status: 'COMPLETE',
        name: 'Entrust Identity Verification Setup',
        process_definition: '2cdd2a9f47f20b1016bda144846d43c6',
        product_name: 'Entrust Identity Verification Setup',
        roles: 'x_entru_entrustidv.admin',
        setup_execution_type: 'single',
        setup_layout: 'vertical_focused',
        skip_execution_page: 'false',
        snc_created: 'false',
        status: 'published',
        sys_domain: 'global',
        sys_domain_path: '/',
        type: 'global_setup',
        version: 'australia',
    },
})
