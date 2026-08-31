import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'

const styles = Now.include('../../client/setup.css')

const apiConnectionHtml = Now.include('../../client/api-connection.html')
const verificationSettingsHtml = Now.include(
    '../../client/verification-settings.html',
)
const setupInformationHtml = Now.include('../../client/setup-information.html')

function applyStyles(html: string): string {
    return html.replace(
        '<style id="entrust-setup-styles"></style>',
        `<style>${styles}</style>`,
    )
}

UiPage({
    $id: Now.ID['entrust_idv_connection-setup-page'],
    endpoint: 'x_entru_entrustidv_entrust_api_connection_setup.do',
    description: 'Configure the Entrust Identity Verification API connection.',
    category: 'general',
    html: applyStyles(apiConnectionHtml),
    clientScript: Now.include('../../client/api-connection.client.js'),
    direct: false,
})

UiPage({
    $id: Now.ID['verification-settings-setup-page'],
    endpoint: 'x_entru_entrustidv_verification_settings_setup.do',
    description: 'Configure the Entrust Identity Verification settings.',
    category: 'general',
    html: applyStyles(verificationSettingsHtml),
    clientScript: Now.include('../../client/verification-settings.client.js'),
    direct: false,
})

UiPage({
    $id: Now.ID['setup-information-page'],
    endpoint: 'x_entru_entrustidv_setup_information.do',
    description: 'Review the Entrust Identity Verification setup information.',
    category: 'general',
    html: applyStyles(setupInformationHtml),
    clientScript: Now.include('../../client/setup-information.client.js'),
    direct: false,
})
