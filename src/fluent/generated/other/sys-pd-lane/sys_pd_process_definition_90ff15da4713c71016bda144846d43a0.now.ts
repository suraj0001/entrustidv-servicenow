import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['ff6aa17c60cbcce0ed47c9ae6c35e9b0'],
    table: 'sys_pd_lane',
    data: {
        active: 'true',
        description: 'Complete each task below to enable identity verification requests in ServiceNow.',
        label: 'Entrust IDV Integration and Workflow Settings',
        name: 'new_stage',
        order: '1',
        permission: '{}',
        process_definition: '90ff15da4713c71016bda144846d43a0',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'immediate',
    },
})
