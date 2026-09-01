import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['entrust-webhook-signature-validator'],
    name: 'EntrustWebhookSignatureValidator',
    description: 'Validates Entrust webhook HMAC signatures',
    accessibleFrom: 'package_private',

    script: Now.include(
        '../../server/webhook/webhook-signature-validator.server.js'
    ),
})