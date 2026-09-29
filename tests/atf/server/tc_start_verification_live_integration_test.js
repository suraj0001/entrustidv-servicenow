/**
 * ATF Test Suite: Agent - Start Verification LIVE Entrust Integration Test
 *
 * ⚠ REQUIRES REAL, WORKING VALUES ⚠
 * This test does NOT mock anything. It calls verification-service.startVerification()
 * exactly as production code does, which means it makes REAL outbound HTTP calls
 * to the Entrust API using whatever API Connection (region/client_id/client_secret)
 * and Verification Settings (workflow_id/link_expiry) are CURRENTLY SAVED on this
 * instance (Admin - API Connection / Admin - Verification Settings setup pages).
 *
 * Before enabling/running this test, an administrator must have already:
 *   1. Saved a valid, working Entrust API connection (region + client_id + client_secret)
 *      via the "Admin - API Connection" setup page, AND confirmed "Test Connection" succeeds.
 *   2. Saved a real Entrust workflow_id (that exists in that Entrust tenant) via the
 *      "Admin - Verification Settings" setup page.
 *
 * ⚠ SIDE EFFECTS ⚠
 * On success this test creates a REAL applicant + REAL workflow run in the connected
 * Entrust tenant, plus a real x_entru_entrustidv_verification_request record and a
 * temporary incident/sys_user in THIS ServiceNow instance (both are cleaned up at the
 * end of this script, but the Entrust-side applicant/workflow run cannot be deleted
 * from here). Do NOT run this against a production Entrust tenant or production
 * ServiceNow instance — only run it in a sandbox/dev environment with Entrust
 * sandbox/test credentials.
 *
 * If the connection/workflow are not yet configured, this test logs a warning and
 * skips its assertions rather than failing the suite, so it's safe to leave in the
 * Test Suite for environments where live credentials aren't set up yet.
 */
(function (outputs, steps, params, stepResult, assertEqual) {
  gs.info('[ATF TEST] Starting Agent - Start Verification LIVE Entrust Integration Test...');

  function check(name, actual, expected) {
    assertEqual({
      name: name,
      value: actual,
      shouldbe: expected,
    });
  }

  var apiConnectionSvc = require('./src/server/services/api-connection-service.ts');
  var verificationSettingsSvc = require('./src/server/services/verification-settings-service.ts');
  var verificationSvc = require('./src/server/services/verification-service.ts');

  var REQUEST_TABLE = 'x_entru_entrustidv_verification_request';

  // -------------------------------------------------------------------------
  // Pre-flight: only proceed if a real connection AND real workflow settings
  // are already configured on this instance.
  // -------------------------------------------------------------------------
  var connectionConfig = apiConnectionSvc.getConfig();
  var settingsConfig = verificationSettingsSvc.getVerificationSettingsConfig();

  var connectionReady = !!(
    connectionConfig &&
    connectionConfig.success &&
    connectionConfig.connectionTested
  );
  var workflowReady = !!(
    settingsConfig &&
    settingsConfig.success &&
    settingsConfig.settings &&
    settingsConfig.settings.workflowId
  );

  if (!connectionReady || !workflowReady) {
    gs.warn(
      '[ATF TEST] Skipping LIVE Entrust integration test: ' +
        (!connectionReady ? 'API connection is not configured/tested. ' : '') +
        (!workflowReady ? 'Verification settings (workflow ID) are not configured.' : '')
    );
    stepResult.setOutputMessage(
      'Skipped: real Entrust API connection and/or workflow ID are not configured on this instance.'
    );
    return true;
  }

  // -------------------------------------------------------------------------
  // Test Case 6.1: Real startVerification() call against the configured
  // Entrust tenant, using a temporary incident/caller created for this run.
  // -------------------------------------------------------------------------
  gs.info(
    '[ATF TEST 6.1] Calling startVerification() against the real, configured Entrust connection...'
  );

  var userGr = new GlideRecord('sys_user');
  userGr.initialize();
  userGr.setValue('first_name', 'ATF_Live');
  userGr.setValue('last_name', 'IntegrationTestUser');
  userGr.setValue('user_name', 'atf_live_integration_user_' + gs.generateGUID());
  userGr.setValue('email', 'atf_live_integration_test@example.com');
  var liveUserSysId = userGr.insert();

  var incGr = new GlideRecord('incident');
  incGr.initialize();
  incGr.setValue('caller_id', liveUserSysId);
  incGr.setValue('short_description', 'ATF LIVE Integration Test - Start Verification');
  var liveIncSysId = incGr.insert();

  var verificationRequestId = null;

  try {
    var result = verificationSvc.startVerification('incident', liveIncSysId);

    check('startVerification should return a workflow run ID', !!result.workflowRunId, true);
    check('startVerification should return a smart capture URL', !!result.smartCaptureUrl, true);
    check(
      'startVerification should return a display status of In Progress',
      result.displayStatus,
      'In Progress'
    );

    verificationRequestId = result.verificationRequestId;

    var persistedGr = new GlideRecord(REQUEST_TABLE);
    var persistedFound = persistedGr.get(verificationRequestId);
    check('Verification request record should be persisted', persistedFound, true);
    if (persistedFound) {
      check(
        'Persisted record should reference the returned workflow run ID',
        persistedGr.getValue('workflow_run_id'),
        result.workflowRunId
      );
    }

    stepResult.setOutputMessage(
      'LIVE Entrust integration test completed successfully. workflowRunId=' + result.workflowRunId
    );
  } finally {
    // Clean up the ServiceNow-side records created for this run.
    // NOTE: the corresponding Entrust applicant/workflow run cannot be deleted from here.
    if (verificationRequestId) {
      var cleanupGr = new GlideRecord(REQUEST_TABLE);
      if (cleanupGr.get(verificationRequestId)) {
        cleanupGr.deleteRecord();
      }
    }

    var cleanupInc = new GlideRecord('incident');
    if (cleanupInc.get(liveIncSysId)) {
      cleanupInc.deleteRecord();
    }

    var cleanupUser = new GlideRecord('sys_user');
    if (cleanupUser.get(liveUserSysId)) {
      cleanupUser.deleteRecord();
    }
  }

  return true;
})(outputs, steps, params, stepResult, assertEqual);
