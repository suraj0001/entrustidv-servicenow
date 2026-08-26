import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['verify-identity-ajax'],
    name: 'VerifyIdentityAjax',
    apiName: 'x_entru_entrustidv.VerifyIdentityAjax',
    script: Now.include('../../server/ui-actions/verify-identity-ajax.server.js'),
    clientCallable: true,
    accessibleFrom: 'package_private',
    active: true,
    description: 'Starts identity verification from a client UI action.',
})