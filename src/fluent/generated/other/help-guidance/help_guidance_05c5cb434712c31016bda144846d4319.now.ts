import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['05c5cb434712c31016bda144846d4319'],
    table: 'help_guidance',
    data: {
        active: 'true',
        checklist:
            '<p>Before you begin, have the following available:</p><ul><li>Entrust IDV API Client ID, Client Secret &amp; Region</li><li>Entrust IDV Workflow ID</li><li>ServiceNow Scoped Application Admin Access</li></ul>',
        description: 'Configure API credentials and workflow parameters for identity Verification',
        interaction_status: 'COMPLETE',
        name: 'Set up Entrust Identity Verification',
        process_definition: '90ff15da4713c71016bda144846d43a0',
        product_name: 'Set up Entrust Identity Verification',
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
