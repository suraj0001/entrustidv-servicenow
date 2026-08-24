import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['cfa4b028cd38b92161c4f4819c5d0ed4'],
    table: 'sys_pd_lane',
    data: {
        active: 'true',
        label: 'Configure Entrust IDV Credentials and Workflow Settings',
        name: 'new_stage',
        order: '1',
        permission: '{}',
        process_definition: '2cdd2a9f47f20b1016bda144846d43c6',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'immediate',
        description: 'Configure Entrust IDV credentials and workflow settings for the identity verification',
    },
})
