import { AliasTemplate } from '@servicenow/sdk/core'

AliasTemplate({
    $id: Now.ID['fe1a266d47320f1016bda144846d43de'],
    name: 'Entrust IDV OAuth Authorization',
    dynamicDataSchema: {
        connectionFields: [
            {
                name: 'connection.connection_url',
                label: 'Connection URL',
                type: 'text',
                defaultValue: 'NOT_CONFIGURED',
                hint: '',
                mandatory: true,
            },
        ],
        credentialFields: [
            {
                name: 'credential.oauth_entity.client_id',
                label: 'Client ID',
                type: 'text',
                hint: '',
                mandatory: true,
                defaultValue: 'NOT_CONFIGURED',
            },
            {
                name: 'credential.oauth_entity.client_secret',
                label: 'Client Secret',
                type: 'password',
                hint: '',
                mandatory: true,
            },
            {
                name: 'credential.oauth_entity.token_url',
                label: 'Token URL',
                type: 'text',
                defaultValue: 'NOT_CONFIGURED',
                hint: '',
                mandatory: true,
            },
        ],
    },
    defaultDataTemplate: {
        credential: {
            oauth_entity: {
                oauth_entity_profile: [
                    {
                        grant_type: 'client_credentials',
                        name: 'Entrust IDV Profile',
                        default: true,
                        oauth_entity_profile_scope: [],
                    },
                ],
                code_challenge_method: '',
                type: 'consumer',
                oauth_entity_scope: [],
                client_id: 'NOT_CONFIGURED',
                client_secret: 'NOT_CONFIGURED',
                use_mutual_auth: false,
                default_grant_type: 'client_credentials',
                public_client: false,
                oauth_api_script: '',
                name: 'Entrust IDV OAuth Authorization',
                token_url: 'NOT_CONFIGURED',
                refresh_token_url: '',
                send_client_credentials_as: 'request_body_parameter',
            },
            name: 'Entrust IDV Credential',
            table: 'oauth_2_0_credentials',
        },
        connection: {
            connectionUrl: 'NOT_CONFIGURED',
            name: 'Entrust IDV Connection',
            table: 'http_connection',
        },
    },
})
