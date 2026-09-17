/**
 * ATF Test: Agent - Start Verification Server Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Agent - Start Verification Server Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Source Record & Subject User Validation (Cases 5.1 - 5.3)
 *   - Step 2: Maximum Verification Requests Limit Boundary Check (Case 5.4)
 *   - Step 3: Incomplete Configuration & Missing Connection Checks (Cases 5.5 - 5.6)
 * -----------------------------------------------------------------------------
 *
 * NOTE: Real Entrust API calls are NOT exercised here. See
 * tc_start_verification_live_integration_test.js for a real, opt-in
 * end-to-end test against the currently configured Entrust connection.
 */

// =============================================================================
// STEP 1: Source Record & Subject User Pre-flight Validation
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Source Record & Subject User Validation...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var verificationSvc = require("./src/server/services/verification-service.ts");

    // Test Case 5.1: Non-existent source record
    try {
        verificationSvc.startVerification("incident", "non_existent_sys_id_9999");
        check("Should have thrown error for non-existent source record", false, true);
    } catch (e) {
        check("Expected unresolved source record message", e.message, "Unable to resolve the source record or subject user.");
    }

    // Test Case 5.2: Subject user missing email
    var userGr = new GlideRecord("sys_user");
    userGr.initialize();
    userGr.setValue("first_name", "ATF_NoEmail");
    userGr.setValue("last_name", "TestUser");
    userGr.setValue("user_name", "atf_no_email_user_" + gs.generateGUID());
    userGr.setValue("email", "");
    var noEmailUserSysId = userGr.insert();

    var incGr = new GlideRecord("incident");
    incGr.initialize();
    incGr.setValue("caller_id", noEmailUserSysId);
    incGr.setValue("short_description", "ATF Test Incident - Missing Email");
    var incSysId1 = incGr.insert();

    try {
        verificationSvc.startVerification("incident", incSysId1);
        check("Should have thrown error for missing user email", false, true);
    } catch (e) {
        check("Expected missing user email error message", e.message, "The subject user must have an email address.");
    }

    // Test Case 5.3: Subject user missing first/last name
    var userGr2 = new GlideRecord("sys_user");
    userGr2.initialize();
    userGr2.setValue("first_name", "");
    userGr2.setValue("last_name", "");
    userGr2.setValue("user_name", "atf_no_name_user_" + gs.generateGUID());
    userGr2.setValue("email", "atf_test@example.com");
    var noNameUserSysId = userGr2.insert();

    var incGr2 = new GlideRecord("incident");
    incGr2.initialize();
    incGr2.setValue("caller_id", noNameUserSysId);
    incGr2.setValue("short_description", "ATF Test Incident - Missing Name");
    var incSysId2 = incGr2.insert();

    try {
        verificationSvc.startVerification("incident", incSysId2);
        check("Should have thrown error for missing user names", false, true);
    } catch (e) {
        check("Expected missing name error message", e.message, "The subject user must have a first name and last name.");
    }

    stepResult.setOutputMessage("Step 1 Passed: Source record and subject user pre-flight checks verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Maximum Verification Requests Limit Boundary Check
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Maximum Verification Requests Limit Boundary Check...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var verificationSvc = require("./src/server/services/verification-service.ts");
    var MAX_REQUESTS = require("./src/server/constants.ts").MAX_VERIFICATION_REQUESTS;
    var REQUEST_TABLE = "x_entru_entrustidv_verification_request";

    var userGr = new GlideRecord("sys_user");
    userGr.initialize();
    userGr.setValue("first_name", "ATF_Valid");
    userGr.setValue("last_name", "TestUser");
    userGr.setValue("user_name", "atf_valid_user_" + gs.generateGUID());
    userGr.setValue("email", "atf_valid_test@example.com");
    var validUserSysId = userGr.insert();

    var incGrMax = new GlideRecord("incident");
    incGrMax.initialize();
    incGrMax.setValue("caller_id", validUserSysId);
    incGrMax.setValue("short_description", "ATF Test Incident - Max Limit");
    var incSysIdMax = incGrMax.insert();

    // Create MAX_REQUESTS existing requests
    for (var i = 0; i < MAX_REQUESTS; i++) {
        var reqGr = new GlideRecord(REQUEST_TABLE);
        reqGr.initialize();
        reqGr.setValue("source_table", "incident");
        reqGr.setValue("source_record", incSysIdMax);
        reqGr.setValue("subject_user", validUserSysId);
        reqGr.setValue("applicant_id", "app_max_limit_test");
        reqGr.setValue("workflow_id", "wf_test");
        reqGr.setValue("workflow_version_id", "1");
        reqGr.setValue("workflow_run_id", "wfr_max_limit_" + i);
        reqGr.setValue("status", "Declined");
        reqGr.setValue("active", false);
        reqGr.setValue("expires_at", new GlideDateTime().getValue());
        reqGr.insert();
    }

    // Test Case 5.4: Attempting another request beyond max triggers limit error
    try {
        verificationSvc.startVerification("incident", incSysIdMax);
        check("Should have thrown error when max request limit reached", false, true);
    } catch (e) {
        check("Expected max verification requests limit error message", e.message, "Maximum number of identity verification requests (" + MAX_REQUESTS + ") has been reached for this record.");
    }

    stepResult.setOutputMessage("Step 2 Passed: Maximum verification requests limit boundary verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: Configuration & Connection Incomplete Error Handling
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Configuration & Connection Incomplete Error Handling...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var verificationSvc = require("./src/server/services/verification-service.ts");
    var CONFIG_TABLE = "x_entru_entrustidv_configuration";

    function getConfigRecord() {
        var gr = new GlideRecord(CONFIG_TABLE);
        gr.query();
        if (gr.next()) return gr;
        return null;
    }

    var userGr = new GlideRecord("sys_user");
    userGr.initialize();
    userGr.setValue("first_name", "ATF_Config");
    userGr.setValue("last_name", "TestUser");
    userGr.setValue("user_name", "atf_config_user_" + gs.generateGUID());
    userGr.setValue("email", "atf_config_test@example.com");
    var validUserSysId = userGr.insert();

    // Test Case 5.5: Incomplete IDV Configuration (blank workflow ID)
    var incGrNoConfig = new GlideRecord("incident");
    incGrNoConfig.initialize();
    incGrNoConfig.setValue("caller_id", validUserSysId);
    incGrNoConfig.setValue("short_description", "ATF Test Incident - No Config");
    var incSysIdNoConfig = incGrNoConfig.insert();

    var configGr = getConfigRecord();
    var originalWorkflowId = configGr ? configGr.getValue("workflow_id") : null;
    if (configGr) {
        configGr.setValue("workflow_id", "");
        configGr.update();
    }

    try {
        verificationSvc.startVerification("incident", incSysIdNoConfig);
        check("Should have thrown error when configuration is incomplete", false, true);
    } catch (e) {
        check("Expected configuration incomplete message", e.message, "Verification configuration is not complete. Please contact your administrator.");
    } finally {
        if (configGr) {
            configGr.setValue("workflow_id", originalWorkflowId);
            configGr.update();
        }
    }

    // Test Case 5.6: Entrust API Connection Not Configured (blank region)
    var incGrNoConn = new GlideRecord("incident");
    incGrNoConn.initialize();
    incGrNoConn.setValue("caller_id", validUserSysId);
    incGrNoConn.setValue("short_description", "ATF Test Incident - No Connection");
    var incSysIdNoConn = incGrNoConn.insert();

    var configGr2 = getConfigRecord();
    var originalRegion = configGr2 ? configGr2.getValue("region") : null;
    if (configGr2) {
        configGr2.setValue("region", "");
        configGr2.update();
    }

    try {
        verificationSvc.startVerification("incident", incSysIdNoConn);
        check("Should have thrown error when Entrust connection is not configured", false, true);
    } catch (e) {
        check("Expected connection not configured message", e.message, "Entrust API connection is not configured.");
    } finally {
        if (configGr2) {
            configGr2.setValue("region", originalRegion);
            configGr2.update();
        }
    }

    stepResult.setOutputMessage("Step 3 Passed: Configuration and connection error handling verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

