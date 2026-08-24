import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['e90faa1b473a0b1016bda144846d43c0'],
    table: 'sys_trigger_runner_mapping',
    data: {
        active: 'true',
        data: '{"trigger_on_unique_change":"false","parent_record":{"elementMapping":"{{triggerRecord}}","variableValue":"{{triggerRecord}}","elementMappingOrVariableValue":"{{triggerRecord}}"},"run_trigger":"run_once"}',
        identifier: '60dd2a9f47f20b1016bda144846d43c7',
        identifier_type: 'playbook',
        runner: 'PDTriggerRunner',
        trigger: 'ed0faa1b473a0b1016bda144846d43bf',
    },
})
Record({
    $id: Now.ID['ed0faa1b473a0b1016bda144846d43bf'],
    table: 'sys_flow_record_trigger',
    data: {
        active: 'true',
        condition: 'guidance.process_definition=2cdd2a9f47f20b1016bda144846d43c6',
        on_delete: 'false',
        on_insert: 'true',
        on_update: 'true',
        run_flow_in: 'background',
        run_on_extended: 'false',
        run_when_setting: 'both',
        run_when_user_setting: 'any',
        sys_domain: 'global',
        sys_domain_path: '/',
        table: 'help_user_interaction',
    },
})
Record({
    $id: Now.ID['842ae4e7477e4b1016bda144846d43a4'],
    table: 'sys_trigger_runner_mapping',
    data: {
        active: 'true',
        data: '{"trigger_on_unique_change":"false","parent_record":{"elementMapping":"{{triggerRecord}}","variableValue":"{{triggerRecord}}","elementMappingOrVariableValue":"{{triggerRecord}}"},"run_trigger":"run_once"}',
        identifier: '60dd2a9f47f20b1016bda144846d43c7',
        identifier_type: 'playbook',
        runner: 'PDTriggerRunner',
        trigger: '882ae4e7477e4b1016bda144846d43a3',
    },
})
Record({
    $id: Now.ID['882ae4e7477e4b1016bda144846d43a3'],
    table: 'sys_flow_record_trigger',
    data: {
        active: 'true',
        condition: 'guidance.process_definition=2cdd2a9f47f20b1016bda144846d43c6',
        on_delete: 'false',
        on_insert: 'true',
        on_update: 'true',
        run_flow_in: 'background',
        run_on_extended: 'false',
        run_when_setting: 'both',
        run_when_user_setting: 'any',
        sys_domain: 'global',
        sys_domain_path: '/',
        table: 'help_user_interaction',
    },
})
