import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['1923e9564753c71016bda144846d430d'],
    table: 'sys_trigger_runner_mapping',
    data: {
        active: 'true',
        data: '{"trigger_on_unique_change":"false","parent_record":{"elementMapping":"{{triggerRecord}}","variableValue":"{{triggerRecord}}","elementMappingOrVariableValue":"{{triggerRecord}}"},"run_trigger":"run_once"}',
        identifier: 'd4ff15da4713c71016bda144846d43a0',
        identifier_type: 'playbook',
        runner: 'PDTriggerRunner',
        trigger: '1d23e9564753c71016bda144846d430c',
    },
})
Record({
    $id: Now.ID['1d23e9564753c71016bda144846d430c'],
    table: 'sys_flow_record_trigger',
    data: {
        active: 'true',
        condition: 'guidance.process_definition=90ff15da4713c71016bda144846d43a0',
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
