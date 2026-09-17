/**
 * ATF Test: Admin - Security, Roles & ACL Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Admin - Security, Roles & ACL Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Application Roles Verification (Case 8.1)
 *   - Step 2: Table ACL Operational Security Restrictions (Cases 8.2 - 8.3)
 *   - Step 3: UI Page ACL Security Configuration (Case 8.4)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Application Roles Existence Verification
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Verifying application roles exist in instance...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var grRoleAdmin = new GlideRecord("sys_user_role");
    grRoleAdmin.addQuery("name", "x_entru_entrustidv.admin");
    grRoleAdmin.query();
    check("Role x_entru_entrustidv.admin should exist in instance", grRoleAdmin.next(), true);

    var grRoleAgent = new GlideRecord("sys_user_role");
    grRoleAgent.addQuery("name", "x_entru_entrustidv.agent");
    grRoleAgent.query();
    check("Role x_entru_entrustidv.agent should exist in instance", grRoleAgent.next(), true);

    stepResult.setOutputMessage("Step 1 Passed: Application roles verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Table ACL Operation Permissions & Security Restrictions
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Testing table operation permissions on verification requests & config...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var CONFIG_TABLE = "x_entru_entrustidv_configuration";
    var REQ_TABLE = "x_entru_entrustidv_verification_request";

    // Test Case 8.2: Verification Request Table ACL Operations
    var grReq = new GlideRecord(REQ_TABLE);
    grReq.initialize();

    check("Manual creation of verification requests should be restricted by ACL", grReq.canCreate(), false);
    check("Manual updating of verification requests should be restricted by ACL", grReq.canWrite(), false);
    check("Deletion of verification requests should be restricted by ACL", grReq.canDelete(), false);

    // Test Case 8.3: Configuration Table ACL Operations
    var grConfig = new GlideRecord(CONFIG_TABLE);
    grConfig.initialize();

    check("Deletion of configuration records should be restricted by ACL", grConfig.canDelete(), false);

    stepResult.setOutputMessage("Step 2 Passed: Table ACL security restrictions verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: UI Page Security ACLs Configuration
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Verifying UI page ACL rules exist for admin setup pages...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var grAcl = new GlideRecord("sys_security_acl");
    grAcl.addQuery("type", "ui_page");
    grAcl.addQuery("name", "CONTAINS", "x_entru_entrustidv");
    grAcl.query();
    
    var aclCount = 0;
    while (grAcl.next()) {
        aclCount++;
    }
    check("UI page ACL rules should be configured for the scoped application", aclCount > 0, true);

    stepResult.setOutputMessage("Step 3 Passed: UI page ACL rules verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

