(function(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Starting Verification Workflow & Applicant Reuse Tests...");

    function check(name, actual, expected) {
        assertEqual({
            name: name,
            value: actual,
            shouldbe: expected
        });
    }

    var repo = require("./src/server/repositories/verification-request-repository.ts");
    var TABLE_NAME = "x_1350849_entrust_idv_verification_request";

    // -------------------------------------------------------------------------
    // Test Setup: Insert mock records in database
    // -------------------------------------------------------------------------
    var mockSourceTable = "incident";
    var mockSourceSysId = "mock_inc_sys_id_" + gs.generateGUID();
    var mockSubjectUserSysId = "mock_user_sys_id_" + gs.generateGUID();
    var mockApplicantId = "app_test_applicant_9999";

    gs.info("[ATF TEST 3.1] Creating initial active verification request record...");
    var gr1 = new GlideRecord(TABLE_NAME);
    gr1.initialize();
    gr1.setValue("source_table", mockSourceTable);
    gr1.setValue("source_record", mockSourceSysId);
    gr1.setValue("subject_user", mockSubjectUserSysId);
    gr1.setValue("applicant_id", mockApplicantId);
    gr1.setValue("workflow_run_id", "wfr_initial_" + gs.generateGUID());
    gr1.setValue("status", "In Progress");
    gr1.setValue("active", true);
    var req1SysId = gr1.insert();
    
    check("First mock verification request should be created successfully", !req1SysId, false);

    // -------------------------------------------------------------------------
    // Test Case 3.2: Applicant ID Reuse for Subject User
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 3.2] Testing findApplicantIdBySubjectUser()...");
    var foundApplicantId = repo.findApplicantIdBySubjectUser(mockSubjectUserSysId);
    check("Should retrieve existing applicant ID for subject user", foundApplicantId, mockApplicantId);

    // -------------------------------------------------------------------------
    // Test Case 3.3: Status Resolution for Active Request
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 3.3] Testing findLatestVerificationStatus()...");
    var statusRecord = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);
    check("Status record should be found for active request", !statusRecord, false);
    check("Status should be 'In Progress'", statusRecord.status, "In Progress");

    // -------------------------------------------------------------------------
    // Test Case 3.4: Deactivation of Previous Request
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 3.4] Testing deactivateActiveVerificationRequests()...");
    repo.deactivateActiveVerificationRequests(mockSourceTable, mockSourceSysId);

    // Verify first record is now active = false
    var grVerify1 = new GlideRecord(TABLE_NAME);
    if (grVerify1.get(req1SysId)) {
        var rawActive = grVerify1.getValue("active");
        var isActive = (rawActive === "1" || rawActive === "true" || rawActive === true);
        check("First verification request should now be deactivated (active=false)", isActive, false);
    } else {
        check("Could not reload first verification request record", false, true);
    }

    // Verify findLatestVerificationStatus returns null after deactivation
    var statusRecordAfterDeactivate = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);
    check("findLatestVerificationStatus should return null when no active=true record exists", statusRecordAfterDeactivate, null);

    stepResult.setOutputMessage("Verification Workflow & Applicant Reuse Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
