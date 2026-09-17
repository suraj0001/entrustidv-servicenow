import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['9d23e9564753c71016bda144846d430d'],
    table: 'sys_pd_snapshot',
    data: {
        access: 'public',
        derivatives:
            '{"table":"sys_pd_snapshot","id":"9d23e9564753c71016bda144846d430d","name":"derivatives","type":"com.snc.pd.model.serialization.DerivativeFetcher"}',
        name: 'set_up_entrust_identity_verification',
        process_definition:
            '{"table":"sys_pd_snapshot","id":"9d23e9564753c71016bda144846d430d","name":"process_definition","type":"com.snc.pd.model.ProcessDefinition"}',
        process_dependencies:
            '{"table":"sys_pd_snapshot","id":"9d23e9564753c71016bda144846d430d","name":"process_dependencies","type":"com.snc.pd.model.dependency.InstructionBasedProcessDependenciesCollection"}',
        process_plan:
            '{"table":"sys_pd_snapshot","id":"9d23e9564753c71016bda144846d430d","name":"process_plan","type":"com.snc.process_flow.engine.ProcessPlan"}',
        source: '90ff15da4713c71016bda144846d43a0',
    },
})
