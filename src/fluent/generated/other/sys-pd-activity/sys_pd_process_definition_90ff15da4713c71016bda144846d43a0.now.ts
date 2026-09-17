import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['dbca8bfb43956d002f84a1502bc4d352'],
    table: 'sys_pd_activity',
    data: {
        active: 'true',
        activity_definition: 'fcbbb246eb7331107626211f1a522853',
        ai_agent_execution_mode: 'off',
        ai_agent_run_as: 'playbook_user',
        description: 'Provide Entrust API connection details for identity verification',
        enable_ai_agent: 'false',
        label: 'Entrust API Connection',
        lane: 'ff6aa17c60cbcce0ed47c9ae6c35e9b0',
        name: 'iframe',
        order: '1',
        process_definition: '90ff15da4713c71016bda144846d43a0',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'immediate',
    },
})
Record({
    $id: Now.ID['46b269ee79e50a94b451d3d95a808dec'],
    table: 'sys_pd_activity',
    data: {
        active: 'true',
        activity_definition: 'fcbbb246eb7331107626211f1a522853',
        ai_agent_execution_mode: 'off',
        ai_agent_run_as: 'playbook_user',
        description: 'Configure how Entrust identity verification requests are created and delivered.',
        enable_ai_agent: 'false',
        label: 'Verification Behaviour',
        lane: 'ff6aa17c60cbcce0ed47c9ae6c35e9b0',
        name: 'iframe_1',
        order: '2',
        process_definition: '90ff15da4713c71016bda144846d43a0',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'after_items',
        starts_after_activities: 'dbca8bfb43956d002f84a1502bc4d352',
    },
})
Record({
    $id: Now.ID['53e09f572c982d77500db1857f079de9'],
    table: 'sys_pd_activity',
    data: {
        active: 'true',
        activity_definition: 'fcbbb246eb7331107626211f1a522853',
        ai_agent_execution_mode: 'off',
        ai_agent_run_as: 'playbook_user',
        description:
            'Complete the Entrust webhook configuration and verify that the ServiceNow instance is ready to send identity verification requests.',
        enable_ai_agent: 'false',
        label: 'Webhook, Delivery and Access',
        lane: 'ff6aa17c60cbcce0ed47c9ae6c35e9b0',
        name: 'iframe_2',
        order: '3',
        process_definition: '90ff15da4713c71016bda144846d43a0',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'after_items',
        starts_after_activities: '46b269ee79e50a94b451d3d95a808dec',
    },
})
