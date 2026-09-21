/**
 * ATF Test Suite: Verification Status Service Mappings Tests
 *
 * Test Scenarios:
 *   - Default status lookup when no request exists (not_started)
 *   - Active polling status mappings (awaiting, pending, processing, awaiting_input -> shouldPoll: true)
 *   - Terminal status mappings (review, approved, declined, abandoned, error -> shouldPoll: false)
 *
 * COVERS: getLatestVerificationStatus()'s STATUS_CONFIG mapping only, using freshly-inserted
 * records (so the Entrust fallback-sync branch never fires — records aren't old enough to
 * cross the configured link expiry/grace period).
 *
 * DOES NOT COVER: getVerificationStatusByWorkflowRunId(), the active=false early-return path,
 * the Entrust fallback-sync/reconciliation logic (syncWithEntrustIfDoubtful), or unmapped/unknown
 * raw status values.
 */
(function (outputs, steps, params, stepResult, assertEqual) {
  gs.info('[ATF TEST] Starting Verification Status Service Mappings Tests...');

  function check(name, actual, expected) {
    assertEqual({
      name: name,
      value: actual,
      shouldbe: expected,
    });
  }

  var statusSvc = require('./src/server/services/verification-status-service.ts');
  var TABLE_NAME = 'x_entru_entrustidv_verification_request';

  // -------------------------------------------------------------------------
  // Test Case 7.1: No Verification Request Exists (Default Response)
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 7.1] Testing status lookup for record with no verification requests...');
  var defaultRes = statusSvc.getLatestVerificationStatus('incident', 'non_existent_sys_id');
  check("Status should default to 'not_started'", defaultRes.status, 'not_started');
  check("Display status should default to 'Not Started'", defaultRes.displayStatus, 'Not Started');
  check('shouldPoll should be false for unstarted verifications', defaultRes.shouldPoll, false);
  check('workflowRunId should be null', defaultRes.workflowRunId, null);

  // -------------------------------------------------------------------------
  // Test Setup: Helper function to insert request and query status
  // -------------------------------------------------------------------------
  function testStatusMapping(rawStatus, expectedDisplay, expectedShouldPoll) {
    var mockSourceSysId = 'mock_inc_sys_id_' + gs.generateGUID();

    var gr = new GlideRecord(TABLE_NAME);
    gr.initialize();
    gr.setValue('source_table', 'incident');
    gr.setValue('source_record', mockSourceSysId);
    gr.setValue('workflow_run_id', 'wfr_' + gs.generateGUID());
    gr.setValue('status', rawStatus);
    gr.setValue('active', true);
    gr.setValue('expires_at', new GlideDateTime().getValue());
    gr.insert();

    var res = statusSvc.getLatestVerificationStatus('incident', mockSourceSysId);
    check(
      "Raw status '" + rawStatus + "' should map to displayStatus '" + expectedDisplay + "'",
      res.displayStatus,
      expectedDisplay
    );
    check(
      "Raw status '" + rawStatus + "' should map shouldPoll to " + expectedShouldPoll,
      res.shouldPoll,
      expectedShouldPoll
    );
  }

  // -------------------------------------------------------------------------
  // Test Case 7.2: Active Polling Statuses (shouldPoll = true)
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 7.2] Testing active polling status mappings...');
  testStatusMapping('awaiting', 'Pending', true);
  testStatusMapping('pending', 'Pending', true);
  testStatusMapping('processing', 'In Process', true);
  testStatusMapping('awaiting_input', 'In Progress', true);
  testStatusMapping('awaiting_client_input', 'In Progress', true);

  // -------------------------------------------------------------------------
  // Test Case 7.3: Terminal Statuses (shouldPoll = false)
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 7.3] Testing terminal status mappings...');
  testStatusMapping('review', 'Review Required', false);
  testStatusMapping('approved', 'Approved', false);
  testStatusMapping('declined', 'Declined', false);
  testStatusMapping('abandoned', 'Abandoned', false);
  testStatusMapping('error', 'Error', false);

  stepResult.setOutputMessage('Verification Status Mappings Tests completed successfully.');
  return true;
})(outputs, steps, params, stepResult, assertEqual);
