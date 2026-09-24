import { Acl } from '@servicenow/sdk/core';
import { adminRole, agentRole } from './roles.now';

export const connectionSetupPageAcl = Acl({
  $id: Now.ID['entrust_idv_connection-setup-page-acl'],
  type: 'ui_page',
  operation: 'read',
  name: 'x_entru_entrustidv_entrust_api_connection_setup',
  roles: [adminRole],
  active: true,
  adminOverrides: true,
});

export const verificationSetupPageAcl = Acl({
  $id: Now.ID['verification-settings-setup-page-acl'],
  type: 'ui_page',
  operation: 'read',
  name: 'x_entru_entrustidv_verification_settings_setup',
  roles: [adminRole],
  active: true,
  adminOverrides: true,
});

export const setupInformationPageAcl = Acl({
  $id: Now.ID['setup-information-page-acl'],
  type: 'ui_page',
  operation: 'read',
  name: 'x_entru_entrustidv_setup_information',
  roles: [adminRole],
  active: true,
  adminOverrides: true,
});

export const verificationSettingsAjaxAcl = Acl({
  $id: Now.ID['verification-settings-ajax-acl'],
  type: 'client_callable_script_include',
  operation: 'execute',
  name: 'x_entru_entrustidv.VerificationSettingsAjax',
  roles: [adminRole],
  active: true,
  adminOverrides: true,
  description: 'Restricts execution of VerificationSettingsAjax to IDV administrators.',
});

export const apiConnectionAjaxAcl = Acl({
  $id: Now.ID['api-connection-ajax-acl'],
  type: 'client_callable_script_include',
  operation: 'execute',
  name: 'x_entru_entrustidv.ApiConnectionAjax',
  roles: [adminRole],
  active: true,
  adminOverrides: true,
  description: 'Restricts execution of ApiConnectionAjax to IDV administrators.',
});

export const verifyIdentityAjaxAcl = Acl({
  $id: Now.ID['verify-identity-ajax-acl'],
  type: 'client_callable_script_include',
  operation: 'execute',
  name: 'x_entru_entrustidv.VerifyIdentityAjax',
  roles: [adminRole, agentRole],
  active: true,
  adminOverrides: true,
  description: 'Restricts execution of VerifyIdentityAjax to IDV agents and administrators.',
});

export const idvStatusAjaxAcl = Acl({
  $id: Now.ID['idv-status-ajax-acl'],
  type: 'client_callable_script_include',
  operation: 'execute',
  name: 'x_entru_entrustidv.IdvStatusAjax',
  roles: [adminRole, agentRole],
  active: true,
  adminOverrides: true,
  description: 'Restricts execution of IdvStatusAjax to IDV agents and administrators.',
});