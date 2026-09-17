/**
 * ATF Test: Verification Status Service Mappings Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Verification Status Service Mappings Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Default Status for Unstarted Records (Case 7.1)
 *   - Step 2: Active Polling Status Mappings with shouldPoll = true (Case 7.2)
 *   - Step 3: Terminal Status Mappings with shouldPoll = false (Case 7.3)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Default Status for Unstarted Records
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Default status lookup for unstarted records...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var statusSvc = require("./src/server/services/verification-status-service.ts");

    // Test Case 7.1: No request exists
    var defaultRes = statusSvc.getLatestVerificationStatus("incident", "non_existent_sys_id");
    check("Status should default to 'not_started'", defaultRes.status, "not_started");
    check("Display status should default to 'Not Started'", defaultRes.displayStatus, "Not Started");
    check("shouldPoll should be false for unstarted verifications", defaultRes.shouldPoll, false);
    check("workflowRunId should be null", defaultRes.workflowRunId, null);

    stepResult.setOutputMessage("Step 1 Passed: Default unstarted status verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Active Polling Status Mappings (shouldPoll = true)
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Active polling status mappings...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var statusSvc = require("./src/server/services/verification-status-service.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    function testStatusMapping(rawStatus, expectedDisplay, expectedShouldPoll) {
        var mockSourceSysId = gs.generateGUID();
        
        var gr = new GlideRecord(TABLE_NAME);
        gr.initialize();
        gr.setValue("source_table", "incident");
        gr.setValue("source_record", mockSourceSysId);
        gr.setValue("subject_user", gs.generateGUID());
        gr.setValue("applicant_id", "app_" + gs.generateGUID());
        gr.setValue("workflow_id", "wf_" + gs.generateGUID());
        gr.setValue("workflow_version_id", "1");
        gr.setValue("workflow_run_id", "wfr_" + gs.generateGUID());
        gr.setValue("status", rawStatus);
        gr.setValue("active", true);
        gr.setValue("expires_at", new GlideDateTime().getValue());
        var insertedSysId = gr.insert();
        check("Mock verification request should be inserted successfully", !insertedSysId, false);

        var res = statusSvc.getLatestVerificationStatus("incident", mockSourceSysId);
        check("Raw status '" + rawStatus + "' should map to displayStatus '" + expectedDisplay + "'", res.displayStatus, expectedDisplay);
        check("Raw status '" + rawStatus + "' should map shouldPoll to " + expectedShouldPoll, res.shouldPoll, expectedShouldPoll);
    }

    // Test Case 7.2: Active polling statuses
    testStatusMapping("awaiting", "Pending", true);
    testStatusMapping("pending", "Pending", true);
    testStatusMapping("processing", "In Process", true);
    testStatusMapping("awaiting_input", "In Progress", true);
    testStatusMapping("awaiting_client_input", "In Progress", true);

    stepResult.setOutputMessage("Step 2 Passed: Active polling status mappings verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: Terminal Status Mappings (shouldPoll = false)
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Terminal status mappings...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var statusSvc = require("./src/server/services/verification-status-service.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    function testStatusMapping(rawStatus, expectedDisplay, expectedShouldPoll) {
        var mockSourceSysId = gs.generateGUID();
        
        var gr = new GlideRecord(TABLE_NAME);
        gr.initialize();
        gr.setValue("source_table", "incident");
        gr.setValue("source_record", mockSourceSysId);
        gr.setValue("subject_user", gs.generateGUID());
        gr.setValue("applicant_id", "app_" + gs.generateGUID());
        gr.setValue("workflow_id", "wf_" + gs.generateGUID());
        gr.setValue("workflow_version_id", "1");
        gr.setValue("workflow_run_id", "wfr_" + gs.generateGUID());
        gr.setValue("status", rawStatus);
        gr.setValue("active", true);
        gr.setValue("expires_at", new GlideDateTime().getValue());
        var insertedSysId = gr.insert();
        check("Mock verification request should be inserted successfully", !insertedSysId, false);

        var res = statusSvc.getLatestVerificationStatus("incident", mockSourceSysId);
        check("Raw status '" + rawStatus + "' should map to displayStatus '" + expectedDisplay + "'", res.displayStatus, expectedDisplay);
        check("Raw status '" + rawStatus + "' should map shouldPoll to " + expectedShouldPoll, res.shouldPoll, expectedShouldPoll);
    }

    // Test Case 7.3: Terminal statuses
    testStatusMapping("review", "Review Required", false);
    testStatusMapping("approved", "Approved", false);
    testStatusMapping("declined", "Declined", false);
    testStatusMapping("abandoned", "Abandoned", false);
    testStatusMapping("error", "Error", false);

    stepResult.setOutputMessage("Step 3 Passed: Terminal status mappings verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

