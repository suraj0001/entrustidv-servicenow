import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['2cdd2a9f47f20b1016bda144846d43c6'],
    table: 'sys_pd_process_definition',
    data: {
        access: 'public',
        active: 'true',
        allow_as_nested: 'false',
        description: 'Set up API credentials and workflow parameters for identity Verification',
        execution_type: 'record_driven',
        label: 'Set up Entrust Identity Verification',
        launcher_show_record_form: 'false',
        name: 'entrust_identity_verification_setup',
        permission: '{}',
        public_access: 'false',
        restartable: 'RESTARTABLE_FALSE',
        run_on_pad_engine: 'false',
        run_strategy: 'run_once',
        run_strategy_on_process_definition: 'true',
        schema_version: '3',
        snapshot: '5e51ed311b4703105fdb2f05604bcba0',
        start_non_blocking: 'true',
        status: 'published',
        sync_state: 'COMPLETE',
        view_type: 'DIAGRAM',
    },
})
