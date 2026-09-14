(function(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Starting Agent - Start Verification Server Tests...");

    function check(name, actual, expected) {
        assertEqual({
            name: name,
            value: actual,
            shouldbe: expected
        });
    }

    var verificationSvc = require("./src/server/services/verification-service.ts");
    var reqRepo = require("./src/server/repositories/verification-request-repository.ts");

    // -------------------------------------------------------------------------
    // Test Case 5.1: Invalid Source Record / Unresolved Record
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 5.1] Testing startVerification with non-existent source record...");
    try {
        verificationSvc.startVerification("incident", "non_existent_sys_id_9999");
        check("Should have thrown error for non-existent source record", false, true);
    } catch (e) {
        check("Expected unresolved source record message", e.message, "Unable to resolve the source record or subject user.");
    }

    // -------------------------------------------------------------------------
    // Test Case 5.2: Subject User Missing Email Address Validation
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 5.2] Creating temporary test user without email...");
    var userGr = new GlideRecord("sys_user");
    userGr.initialize();
    userGr.setValue("first_name", "ATF_NoEmail");
    userGr.setValue("last_name", "TestUser");
    userGr.setValue("user_name", "atf_no_email_user_" + gs.generateGUID());
    userGr.setValue("email", ""); // Missing email
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

    // -------------------------------------------------------------------------
    // Test Case 5.3: Subject User Missing Name Validation
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 5.3] Creating temporary test user without names...");
    var userGr2 = new GlideRecord("sys_user");
    userGr2.initialize();
    userGr2.setValue("first_name", ""); // Missing first name
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

    // -------------------------------------------------------------------------
    // Test Case 5.4: Maximum Verification Requests Limit Bound (MAX = 10) - Server Test
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 5.4] Testing max verification requests limit (10)...");
    var incGrMax = new GlideRecord("incident");
    incGrMax.initialize();
    incGrMax.setValue("caller_id", noEmailUserSysId);
    incGrMax.setValue("short_description", "ATF Test Incident - Max Limit");
    var incSysIdMax = incGrMax.insert();

    // Create 10 existing mock requests for this incident
    var TABLE_NAME = "x_1350849_entrust_idv_verification_request";
    for (var i = 0; i < 10; i++) {
        var reqGr = new GlideRecord(TABLE_NAME);
        reqGr.initialize();
        reqGr.setValue("source_table", "incident");
        reqGr.setValue("source_record", incSysIdMax);
        reqGr.setValue("subject_user", noEmailUserSysId);
        reqGr.setValue("applicant_id", "app_max_limit_test");
        reqGr.setValue("workflow_run_id", "wfr_max_limit_" + i);
        reqGr.setValue("status", "Declined");
        reqGr.setValue("active", false);
        reqGr.insert();
    }

    // Attempting 11th request should trigger limit error
    try {
        verificationSvc.startVerification("incident", incSysIdMax);
        check("Should have thrown error when max request limit reached", false, true);
    } catch (e) {
        var isMaxMsg = e.message.indexOf("Maximum verification requests") !== -1 || e.message.indexOf("limit") !== -1;
        check("Expected max verification requests limit error message", isMaxMsg, true);
    }

    stepResult.setOutputMessage("Agent - Start Verification Server Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
