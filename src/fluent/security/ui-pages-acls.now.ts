import { Acl } from "@servicenow/sdk/core";
import { adminRole } from "./roles.now";

export const connectionSetupPageAcl = Acl({
    $id: Now.ID["entrust_idv_connection-setup-page-acl"],
    type: "ui_page",
    operation: "read",
    name: "x_entru_entrustidv_entrust_api_connection_setup",
    roles: [adminRole],
    active: true,
    adminOverrides: true,
});

export const verificationSetupPageAcl = Acl({
    $id: Now.ID["verification-settings-setup-page-acl"],
    type: "ui_page",
    operation: "read",
    name: "x_entru_entrustidv_verification_settings_setup.do",
    roles: [adminRole],
    active: true,
    adminOverrides: true,
});

export const setupInformationPageAcl = Acl({
    $id: Now.ID["setup-information-page-acl"],
    type: "ui_page",
    operation: "read",
    name: "x_entru_entrustidv_setup_information",
    roles: [adminRole],
    active: true,
    adminOverrides: true,
});