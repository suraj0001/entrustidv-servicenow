import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['ca7f0a5be6cddc2ae2635d929331d8aa'],
    table: 'sys_pd_activity',
    data: {
        active: 'true',
        activity_definition: 'fcbbb246eb7331107626211f1a522853',
        ai_agent_execution_mode: 'off',
        ai_agent_run_as: 'playbook_user',
        description: 'Provide Entrust API connection details for identity verification',
        enable_ai_agent: 'false',
        label: 'Entrust API Connection',
        lane: 'cfa4b028cd38b92161c4f4819c5d0ed4',
        name: 'iframe',
        order: '1',
        process_definition: '2cdd2a9f47f20b1016bda144846d43c6',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'immediate',
    },
})
Record({
    $id: Now.ID['08b1ae947b39c2659ff0f7742a76ff78'],
    table: 'sys_pd_activity',
    data: {
        active: 'true',
        activity_definition: 'fcbbb246eb7331107626211f1a522853',
        ai_agent_execution_mode: 'off',
        ai_agent_run_as: 'playbook_user',
        description: 'Configure how Entrust identity verification requests are created and delivered.',
        enable_ai_agent: 'false',
        label: 'Verification Behaviour',
        lane: 'cfa4b028cd38b92161c4f4819c5d0ed4',
        name: 'iframe_1',
        order: '2',
        process_definition: '2cdd2a9f47f20b1016bda144846d43c6',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'after_items',
        starts_after_activities: 'ca7f0a5be6cddc2ae2635d929331d8aa',
    },
})
Record({
    $id: Now.ID['c4693daa490f45a869ee2a4b224193c5'],
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
        lane: 'cfa4b028cd38b92161c4f4819c5d0ed4',
        name: 'iframe_2',
        order: '3',
        process_definition: '2cdd2a9f47f20b1016bda144846d43c6',
        restart_rule: 'RUN_ONLY_ONCE',
        start_rule_name: 'after_items',
        starts_after_activities: '08b1ae947b39c2659ff0f7742a76ff78',
    },
})
