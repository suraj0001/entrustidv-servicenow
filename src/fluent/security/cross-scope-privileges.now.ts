import { CrossScopePrivilege } from '@servicenow/sdk/core'

CrossScopePrivilege({
    $id: Now.ID['incident_write'],
    operation: 'write',
    status: 'allowed',
    targetName: 'incident',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['hr_case_write'],
    operation: 'write',
    status: 'allowed',
    targetName: 'sn_hr_core_case',
    targetScope: 'sn_hr_core',
    targetType: 'sys_db_object',
})