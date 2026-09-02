import '@servicenow/sdk/global'
import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['verify-identity-ui-action'],
    table: 'task',
    name: 'Verify Identity',
    actionName: 'executeVerifyIdentity',
    active: true,
    order: 100,
    showInsert: false,
    showUpdate: true,
    form: {
        showButton: true,
        showLink: false,
        showContextMenu: false,
    },
    condition: "current.getTableName() == 'incident' || current.getTableName() == 'sn_hr_core_case'",
    roles: ['x_entru_entrustidv.agent'],
    client: {
        isClient: true,
        isUi11Compatible: true,
        isUi16Compatible: true,
        onClick: 'executeVerifyIdentity()',
    },
    script: Now.include('../../client/idv-status.client.js'),
    comments: 'Starts Entrust identity verification for the current record.',
    messages: [],
    isolateScript: false,
})
