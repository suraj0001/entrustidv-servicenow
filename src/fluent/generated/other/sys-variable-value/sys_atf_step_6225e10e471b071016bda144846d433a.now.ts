import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['8c25b2ac7c584b0d93074f4562a6de2c'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '6225e10e471b071016bda144846d433a',
        order: 100,
        value: '3.1',
        variable: '42f2564b73031300440211d8faf6a777',
    },
})
Record({
    $id: Now.ID['b2432110de7f4e2dbeff693a2cb7fae4'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '6225e10e471b071016bda144846d433a',
        order: 200,
        value: `/**\r
 * ATF Test Suite: Verification Status Service Mappings Tests\r
 * \r
 * Test Scenarios:\r
 *   - Default status lookup when no request exists (not_started)\r
 *   - Active polling status mappings (awaiting, pending, processing, awaiting_input -> shouldPoll: true)\r
 *   - Terminal status mappings (review, approved, declined, abandoned, error -> shouldPoll: false)\r
 *\r
 * COVERS: getLatestVerificationStatus()'s STATUS_CONFIG mapping only, using freshly-inserted\r
 * records (so the Entrust fallback-sync branch never fires — records aren't old enough to\r
 * cross the configured link expiry/grace period).\r
 *\r
 * DOES NOT COVER: getVerificationStatusByWorkflowRunId(), the active=false early-return path,\r
 * the Entrust fallback-sync/reconciliation logic (syncWithEntrustIfDoubtful), or unmapped/unknown\r
 * raw status values.\r
 */\r
(function(outputs, steps, params, stepResult, assertEqual) {\r
    gs.info("[ATF TEST] Starting Verification Status Service Mappings Tests...");\r
\r
    function check(name, actual, expected) {\r
        assertEqual({\r
            name: name,\r
            value: actual,\r
            shouldbe: expected\r
        });\r
    }\r
\r
    var statusSvc = require("./src/server/services/verification-status-service.ts");\r
    var TABLE_NAME = "x_entru_entrustidv_verification_request";\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 7.1: No Verification Request Exists (Default Response)\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 7.1] Testing status lookup for record with no verification requests...");\r
    var defaultRes = statusSvc.getLatestVerificationStatus("incident", "non_existent_sys_id");\r
    check("Status should default to 'not_started'", defaultRes.status, "not_started");\r
    check("Display status should default to 'Not Started'", defaultRes.displayStatus, "Not Started");\r
    check("shouldPoll should be false for unstarted verifications", defaultRes.shouldPoll, false);\r
    check("workflowRunId should be null", defaultRes.workflowRunId, null);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Setup: Helper function to insert request and query status\r
    // -------------------------------------------------------------------------\r
    function testStatusMapping(rawStatus, expectedDisplay, expectedShouldPoll) {\r
        var mockSourceSysId = "mock_inc_sys_id_" + gs.generateGUID();\r
        \r
        var gr = new GlideRecord(TABLE_NAME);\r
        gr.initialize();\r
        gr.setValue("source_table", "incident");\r
        gr.setValue("source_record", mockSourceSysId);\r
        gr.setValue("workflow_run_id", "wfr_" + gs.generateGUID());\r
        gr.setValue("status", rawStatus);\r
        gr.setValue("active", true);\r
        gr.insert();\r
\r
        var res = statusSvc.getLatestVerificationStatus("incident", mockSourceSysId);\r
        check("Raw status '" + rawStatus + "' should map to displayStatus '" + expectedDisplay + "'", res.displayStatus, expectedDisplay);\r
        check("Raw status '" + rawStatus + "' should map shouldPoll to " + expectedShouldPoll, res.shouldPoll, expectedShouldPoll);\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 7.2: Active Polling Statuses (shouldPoll = true)\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 7.2] Testing active polling status mappings...");\r
    testStatusMapping("awaiting", "Pending", true);\r
    testStatusMapping("pending", "Pending", true);\r
    testStatusMapping("processing", "In Process", true);\r
    testStatusMapping("awaiting_input", "In Progress", true);\r
    testStatusMapping("awaiting_client_input", "In Progress", true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 7.3: Terminal Statuses (shouldPoll = false)\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 7.3] Testing terminal status mappings...");\r
    testStatusMapping("review", "Review Required", false);\r
    testStatusMapping("approved", "Approved", false);\r
    testStatusMapping("declined", "Declined", false);\r
    testStatusMapping("abandoned", "Abandoned", false);\r
    testStatusMapping("error", "Error", false);\r
\r
    stepResult.setOutputMessage("Verification Status Mappings Tests completed successfully.");\r
    return true;\r
})(outputs, steps, params, stepResult, assertEqual);\r`,
        variable: '989d9e235324220002c6435723dc3484',
    },
})
