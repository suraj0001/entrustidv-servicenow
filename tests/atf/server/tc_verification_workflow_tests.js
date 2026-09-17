/**
 * ATF Test: Verification Workflow & Applicant Reuse Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Verification Workflow & Applicant Reuse Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Record Creation, Applicant ID Reuse & Status Resolution (Cases 3.1 - 3.3)
 *   - Step 2: Request Deactivation & Active State Querying (Case 3.4)
 *   - Step 3: Repository CRUD, Count, Expiry & Status Sync Bookkeeping (Cases 3.5 - 3.8)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Verification Request Record Creation, Applicant Reuse & Status Resolution
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Record Creation, Applicant Reuse & Status Resolution...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var repo = require("./src/server/repositories/verification-request-repository.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    var mockSourceTable = "incident";
    var mockSourceSysId = gs.generateGUID();
    var mockSubjectUserSysId = gs.generateGUID();
    var mockApplicantId = "app_test_applicant_9999";

    // Test Case 3.1: Create initial active request
    var gr1 = new GlideRecord(TABLE_NAME);
    gr1.initialize();
    gr1.setValue("source_table", mockSourceTable);
    gr1.setValue("source_record", mockSourceSysId);
    gr1.setValue("subject_user", mockSubjectUserSysId);
    gr1.setValue("applicant_id", mockApplicantId);
    gr1.setValue("workflow_id", "wf_" + gs.generateGUID());
    gr1.setValue("workflow_version_id", "1");
    gr1.setValue("workflow_run_id", "wfr_initial_" + gs.generateGUID());
    gr1.setValue("status", "In Progress");
    gr1.setValue("active", true);
    gr1.setValue("expires_at", new GlideDateTime().getValue());
    var req1SysId = gr1.insert();
    check("First mock verification request should be created successfully", !req1SysId, false);

    // Test Case 3.2: Applicant ID reuse
    var foundApplicantId = repo.findApplicantIdBySubjectUser(mockSubjectUserSysId);
    check("Should retrieve existing applicant ID for subject user", foundApplicantId, mockApplicantId);

    // Test Case 3.3: Active status resolution
    var statusRecord = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);
    check("Status record should be found for active request", !statusRecord, false);
    if (statusRecord) {
        check("Status should be 'In Progress'", statusRecord.status, "In Progress");
    }

    stepResult.setOutputMessage("Step 1 Passed: Request creation, applicant reuse, and status resolution verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Deactivation of Previous/Superseded Requests
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Deactivation of Previous/Superseded Requests...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var repo = require("./src/server/repositories/verification-request-repository.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    var mockSourceTable = "incident";
    var mockSourceSysId = gs.generateGUID();
    var mockSubjectUserSysId = gs.generateGUID();

    // Insert an active record
    var gr = new GlideRecord(TABLE_NAME);
    gr.initialize();
    gr.setValue("source_table", mockSourceTable);
    gr.setValue("source_record", mockSourceSysId);
    gr.setValue("subject_user", mockSubjectUserSysId);
    gr.setValue("applicant_id", "app_" + gs.generateGUID());
    gr.setValue("workflow_id", "wf_" + gs.generateGUID());
    gr.setValue("workflow_version_id", "1");
    gr.setValue("workflow_run_id", "wfr_" + gs.generateGUID());
    gr.setValue("status", "In Progress");
    gr.setValue("active", true);
    gr.setValue("expires_at", new GlideDateTime().getValue());
    var reqSysId = gr.insert();

    // Test Case 3.4: Deactivate requests for this source record
    repo.deactivateActiveVerificationRequests(mockSourceTable, mockSourceSysId);

    var grVerify = new GlideRecord(TABLE_NAME);
    if (grVerify.get(reqSysId)) {
        var rawActive = grVerify.getValue("active");
        var isActive = (rawActive === "1" || rawActive === "true" || rawActive === true);
        check("Verification request should now be deactivated (active=false)", isActive, false);
    } else {
        check("Could not reload verification request record", false, true);
    }

    var statusAfterDeactivate = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);
    check("findLatestVerificationStatus should return null when no active=true record exists", statusAfterDeactivate, null);

    stepResult.setOutputMessage("Step 2 Passed: Request deactivation verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: Repository CRUD, Count, Expiry & Status Sync Bookkeeping
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Repository CRUD, Count, Expiry & Status Sync Bookkeeping...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var repo = require("./src/server/repositories/verification-request-repository.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    var mockSourceTable = "incident";
    var mockSourceSysId = gs.generateGUID();
    var mockSubjectUserSysId = gs.generateGUID();
    var createdWorkflowRunId = "wfr_repo_created_" + gs.generateGUID();
    var createdExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Test Case 3.5: createVerificationRequest() and findVerificationRequestById()
    var createdSysId = repo.createVerificationRequest({
        sourceTable: mockSourceTable,
        sourceRecordId: mockSourceSysId,
        subjectUserId: mockSubjectUserSysId,
        applicantId: "app_test_123",
        workflowId: "wf_repo_test",
        workflowVersionId: "1",
        workflowRunId: createdWorkflowRunId,
        status: "awaiting",
        expiresAt: createdExpiresAt
    });
    check("createVerificationRequest should return a sys_id", !!createdSysId, true);

    var foundById = repo.findVerificationRequestById(createdSysId);
    check("findVerificationRequestById should locate the created record", !foundById, false);
    if (foundById) {
        check("Found record should have the expected workflow_run_id", foundById.getValue("workflow_run_id"), createdWorkflowRunId);
    }
    check("findVerificationRequestById should return null for a non-existent sys_id", repo.findVerificationRequestById("non_existent_sys_id_9999"), null);

    // Test Case 3.5b: Invalid expiresAt rejection
    try {
        repo.createVerificationRequest({
            sourceTable: mockSourceTable,
            sourceRecordId: mockSourceSysId,
            subjectUserId: mockSubjectUserSysId,
            applicantId: "app_test_123",
            workflowId: "wf_repo_test",
            workflowVersionId: "1",
            workflowRunId: "wfr_repo_invalid_expiry_" + gs.generateGUID(),
            status: "awaiting",
            expiresAt: "not_a_valid_date"
        });
        check("Should have thrown error for invalid expiresAt", false, true);
    } catch (e) {
        check("Expected invalid expiry message", e.message, "Unable to persist an invalid verification link expiry.");
    }

    // Test Case 3.6: countVerificationRequests()
    check("countVerificationRequests should return 1 for newly inserted source record", repo.countVerificationRequests(mockSourceTable, mockSourceSysId), 1);
    check("countVerificationRequests should return 0 for non-existent source record", repo.countVerificationRequests(mockSourceTable, "no_such_source_record"), 0);

    // Test Case 3.7: findVerificationStatusByWorkflowRunId()
    var statusByWfr = repo.findVerificationStatusByWorkflowRunId(createdWorkflowRunId);
    check("findVerificationStatusByWorkflowRunId should locate the created record", !statusByWfr, false);
    if (statusByWfr) {
        check("Status by workflow run ID should match", statusByWfr.status, "awaiting");
        check("Source table should match", statusByWfr.sourceTable, mockSourceTable);
    }
    check("findVerificationStatusByWorkflowRunId should return null for unknown workflow run ID", repo.findVerificationStatusByWorkflowRunId("no_such_wfr_id"), null);

    // Test Case 3.8: updateLastStatusSyncByWorkflowRunId()
    var syncTimestamp = new GlideDateTime().getValue();
    repo.updateLastStatusSyncByWorkflowRunId(createdWorkflowRunId, syncTimestamp);

    var grVerifySync = new GlideRecord(TABLE_NAME);
    if (grVerifySync.get(createdSysId)) {
        check("last_status_sync should be updated to given timestamp", grVerifySync.getValue("last_status_sync"), syncTimestamp);
    }

    stepResult.setOutputMessage("Step 3 Passed: Repository CRUD, counts, and sync updates verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

