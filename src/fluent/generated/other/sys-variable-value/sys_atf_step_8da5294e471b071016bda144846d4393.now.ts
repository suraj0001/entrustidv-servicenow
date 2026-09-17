import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['5a89956024bf45d98c6e8519c5288f3c'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '8da5294e471b071016bda144846d4393',
        order: 200,
        value: `/**\r
 * ATF Test Suite: Verification Workflow & Applicant Reuse Tests\r
 * \r
 * Test Scenarios:\r
 *   - Initial active verification request record creation\r
 *   - Applicant ID reuse for existing subject user (findApplicantIdBySubjectUser)\r
 *   - Active verification request status resolution (findLatestVerificationStatus)\r
 *   - Deactivation of superseded requests (deactivateActiveVerificationRequests)\r
 *   - Verification request creation, lookup, and status-sync bookkeeping\r
 *     (createVerificationRequest, findVerificationRequestById, countVerificationRequests,\r
 *     findVerificationStatusByWorkflowRunId, updateLastStatusSyncByWorkflowRunId)\r
 *\r
 * COVERS: verification-request-repository.ts's GlideRecord read/write functions used above.\r
 * No real Entrust API call is made anywhere in this flow — the repository is a pure\r
 * database layer (GlideRecord only, no RESTMessageV2/outbound HTTP calls).\r
 *\r
 * DOES NOT COVER (already exercised indirectly via tc_webhook_processor_tests.js, which\r
 * calls webhook-service.ts): findVerificationRequestByWorkflowRunId(), updateStatusByWorkflowRunId(),\r
 * updateEvidenceFolderHrefByWorkflowRunId().\r
 */\r
(function(outputs, steps, params, stepResult, assertEqual) {\r
    gs.info("[ATF TEST] Starting Verification Workflow & Applicant Reuse Tests...");\r
\r
    function check(name, actual, expected) {\r
        assertEqual({\r
            name: name,\r
            value: actual,\r
            shouldbe: expected\r
        });\r
    }\r
\r
    var repo = require("./src/server/repositories/verification-request-repository.ts");\r
    var TABLE_NAME = "x_entru_entrustidv_verification_request";\r
\r
    // -------------------------------------------------------------------------\r
    // Test Setup: Insert mock records in database\r
    // -------------------------------------------------------------------------\r
    var mockSourceTable = "incident";\r
    var mockSourceSysId = "mock_inc_sys_id_" + gs.generateGUID();\r
    var mockSubjectUserSysId = "mock_user_sys_id_" + gs.generateGUID();\r
    var mockApplicantId = "app_test_applicant_9999";\r
\r
    gs.info("[ATF TEST 3.1] Creating initial active verification request record...");\r
    var gr1 = new GlideRecord(TABLE_NAME);\r
    gr1.initialize();\r
    gr1.setValue("source_table", mockSourceTable);\r
    gr1.setValue("source_record", mockSourceSysId);\r
    gr1.setValue("subject_user", mockSubjectUserSysId);\r
    gr1.setValue("applicant_id", mockApplicantId);\r
    gr1.setValue("workflow_run_id", "wfr_initial_" + gs.generateGUID());\r
    gr1.setValue("status", "In Progress");\r
    gr1.setValue("active", true);\r
    var req1SysId = gr1.insert();\r
    \r
    check("First mock verification request should be created successfully", !req1SysId, false);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.2: Applicant ID Reuse for Subject User\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.2] Testing findApplicantIdBySubjectUser()...");\r
    var foundApplicantId = repo.findApplicantIdBySubjectUser(mockSubjectUserSysId);\r
    check("Should retrieve existing applicant ID for subject user", foundApplicantId, mockApplicantId);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.3: Status Resolution for Active Request\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.3] Testing findLatestVerificationStatus()...");\r
    var statusRecord = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);\r
    check("Status record should be found for active request", !statusRecord, false);\r
    check("Status should be 'In Progress'", statusRecord.status, "In Progress");\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.4: Deactivation of Previous Request\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.4] Testing deactivateActiveVerificationRequests()...");\r
    repo.deactivateActiveVerificationRequests(mockSourceTable, mockSourceSysId);\r
\r
    // Verify first record is now active = false\r
    var grVerify1 = new GlideRecord(TABLE_NAME);\r
    if (grVerify1.get(req1SysId)) {\r
        var rawActive = grVerify1.getValue("active");\r
        var isActive = (rawActive === "1" || rawActive === "true" || rawActive === true);\r
        check("First verification request should now be deactivated (active=false)", isActive, false);\r
    } else {\r
        check("Could not reload first verification request record", false, true);\r
    }\r
\r
    // Verify findLatestVerificationStatus returns null after deactivation\r
    var statusRecordAfterDeactivate = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);\r
    check("findLatestVerificationStatus should return null when no active=true record exists", statusRecordAfterDeactivate, null);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.5: createVerificationRequest() / findVerificationRequestById()\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.5] Testing createVerificationRequest() and findVerificationRequestById()...");\r
    var createdWorkflowRunId = "wfr_repo_created_" + gs.generateGUID();\r
    var createdSysId = repo.createVerificationRequest({\r
        sourceTable: mockSourceTable,\r
        sourceRecordId: mockSourceSysId,\r
        subjectUserId: mockSubjectUserSysId,\r
        applicantId: mockApplicantId,\r
        workflowId: "wf_repo_test",\r
        workflowVersionId: "1",\r
        workflowRunId: createdWorkflowRunId,\r
        status: "awaiting"\r
    });\r
    check("createVerificationRequest should return a sys_id", !!createdSysId, true);\r
\r
    var foundById = repo.findVerificationRequestById(createdSysId);\r
    check("findVerificationRequestById should locate the created record", !foundById, false);\r
    if (foundById) {\r
        check("Found record should have the expected workflow_run_id", foundById.getValue("workflow_run_id"), createdWorkflowRunId);\r
    }\r
\r
    check("findVerificationRequestById should return null for a non-existent sys_id", repo.findVerificationRequestById("non_existent_sys_id_9999"), null);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.6: countVerificationRequests()\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.6] Testing countVerificationRequests()...");\r
    // mockSourceSysId now has 2 requests: the original (3.1, now deactivated) + the one created in 3.5\r
    check("countVerificationRequests should count all requests regardless of active state", repo.countVerificationRequests(mockSourceTable, mockSourceSysId), 2);\r
    check("countVerificationRequests should return 0 for a source record with no requests", repo.countVerificationRequests(mockSourceTable, "no_such_source_record"), 0);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.7: findVerificationStatusByWorkflowRunId()\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.7] Testing findVerificationStatusByWorkflowRunId()...");\r
    var statusByWfr = repo.findVerificationStatusByWorkflowRunId(createdWorkflowRunId);\r
    check("findVerificationStatusByWorkflowRunId should locate the created record", !statusByWfr, false);\r
    if (statusByWfr) {\r
        check("Status by workflow run ID should match", statusByWfr.status, "awaiting");\r
        check("Source table should match", statusByWfr.sourceTable, mockSourceTable);\r
    }\r
    check("findVerificationStatusByWorkflowRunId should return null for an unknown workflow run ID", repo.findVerificationStatusByWorkflowRunId("no_such_wfr_id"), null);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 3.8: updateLastStatusSyncByWorkflowRunId()\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 3.8] Testing updateLastStatusSyncByWorkflowRunId()...");\r
    var syncTimestamp = new GlideDateTime().getValue();\r
    repo.updateLastStatusSyncByWorkflowRunId(createdWorkflowRunId, syncTimestamp);\r
\r
    var grVerifySync = new GlideRecord(TABLE_NAME);\r
    if (grVerifySync.get(createdSysId)) {\r
        check("last_status_sync should be updated to the given timestamp", grVerifySync.getValue("last_status_sync"), syncTimestamp);\r
    } else {\r
        check("Could not reload record to verify last_status_sync update", false, true);\r
    }\r
\r
    stepResult.setOutputMessage("Verification Workflow & Applicant Reuse Tests completed successfully.");\r
    return true;\r
})(outputs, steps, params, stepResult, assertEqual);\r`,
        variable: '989d9e235324220002c6435723dc3484',
    },
})
Record({
    $id: Now.ID['7e2daf6a9e7842119dca957d985dce56'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '8da5294e471b071016bda144846d4393',
        order: 100,
        value: '3.1',
        variable: '42f2564b73031300440211d8faf6a777',
    },
})
