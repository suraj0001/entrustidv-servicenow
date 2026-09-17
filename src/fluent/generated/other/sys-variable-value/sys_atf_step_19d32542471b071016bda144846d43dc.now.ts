import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['44afafe6195f4d778461cecf7098f5f4'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '19d32542471b071016bda144846d43dc',
        order: 200,
        value: `/**\r
 * ATF Test Suite: Admin - Security, Roles & ACL Tests\r
 * \r
 * Test Scenarios:\r
 *   - Application roles existence check (x_entru_entrustidv.admin, x_entru_entrustidv.agent)\r
 *   - Table ACL operation restrictions (manual create, write, delete blocked on requests)\r
 *   - Configuration table ACL delete restriction\r
 *   - Scoped UI Page ACL rules existence check\r
 */\r
(function(outputs, steps, params, stepResult, assertEqual) {\r
    gs.info("[ATF TEST] Starting Admin - Security, Roles & ACL Tests...");\r
\r
    function check(name, actual, expected) {\r
        assertEqual({\r
            name: name,\r
            value: actual,\r
            shouldbe: expected\r
        });\r
    }\r
\r
    var CONFIG_TABLE = "x_entru_entrustidv_configuration";\r
    var REQ_TABLE = "x_entru_entrustidv_verification_request";\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 8.1: Verify Application Role Existence\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 8.1] Verifying application roles exist in instance...");\r
    \r
    var grRoleAdmin = new GlideRecord("sys_user_role");\r
    grRoleAdmin.addQuery("name", "x_entru_entrustidv.admin");\r
    grRoleAdmin.query();\r
    check("Role x_entru_entrustidv.admin should exist in instance", grRoleAdmin.next(), true);\r
\r
    var grRoleAgent = new GlideRecord("sys_user_role");\r
    grRoleAgent.addQuery("name", "x_entru_entrustidv.agent");\r
    grRoleAgent.query();\r
    check("Role x_entru_entrustidv.agent should exist in instance", grRoleAgent.next(), true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 8.2: Verification Request Table ACL Operations\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 8.2] Testing table operation permissions on verification requests...");\r
    var grReq = new GlideRecord(REQ_TABLE);\r
    grReq.initialize();\r
\r
    // Verify manual user modifications (write/delete) are restricted by ACL scripts\r
    // (In application table ACLs: manual create, write, delete scripts evaluate to 'answer = false')\r
    check("Manual creation of verification requests should be restricted by ACL", grReq.canCreate(), false);\r
    check("Manual updating of verification requests should be restricted by ACL", grReq.canWrite(), false);\r
    check("Deletion of verification requests should be restricted by ACL", grReq.canDelete(), false);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 8.3: Configuration Table ACL Operations\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 8.3] Testing table operation permissions on IDV configuration...");\r
    var grConfig = new GlideRecord(CONFIG_TABLE);\r
    grConfig.initialize();\r
\r
    check("Deletion of configuration records should be restricted by ACL", grConfig.canDelete(), false);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 8.4: UI Page Security ACLs Configuration\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 8.4] Verifying UI page ACL rules exist for admin setup pages...");\r
    \r
    var grAcl = new GlideRecord("sys_security_acl");\r
    grAcl.addQuery("type", "ui_page");\r
    grAcl.addQuery("name", "CONTAINS", "x_entru_entrustidv");\r
    grAcl.query();\r
    \r
    var aclCount = 0;\r
    while (grAcl.next()) {\r
        aclCount++;\r
    }\r
    check("UI page ACL rules should be configured for the scoped application", aclCount > 0, true);\r
\r
    stepResult.setOutputMessage("Admin - Security, Roles & ACL Tests completed successfully.");\r
    return true;\r
})(outputs, steps, params, stepResult, assertEqual);\r`,
        variable: '989d9e235324220002c6435723dc3484',
    },
})
Record({
    $id: Now.ID['6fad1fc8baf046c5b28451807a14f6fd'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '19d32542471b071016bda144846d43dc',
        order: 100,
        value: '3.1',
        variable: '42f2564b73031300440211d8faf6a777',
    },
})
