/**
 * ATF Test Suite: Verification Workflow & Applicant Reuse Tests
 *
 * Test Scenarios:
 *   - Initial active verification request record creation
 *   - Applicant ID reuse for existing subject user (findApplicantIdBySubjectUser)
 *   - Active verification request status resolution (findLatestVerificationStatus)
 *   - Deactivation of superseded requests (deactivateActiveVerificationRequests)
 *   - Verification request creation, lookup, and status-sync bookkeeping
 *     (createVerificationRequest, findVerificationRequestById, countVerificationRequests,
 *     findVerificationStatusByWorkflowRunId, updateLastStatusSyncByWorkflowRunId)
 *   - createVerificationRequest() rejects an invalid expiresAt value
 *
 * COVERS: verification-request-repository.ts's GlideRecord read/write functions used above.
 * No real Entrust API call is made anywhere in this flow — the repository is a pure
 * database layer (GlideRecord only, no RESTMessageV2/outbound HTTP calls).
 *
 * DOES NOT COVER (already exercised indirectly via tc_webhook_processor_tests.js, which
 * calls webhook-service.ts): findVerificationRequestByWorkflowRunId(), updateStatusByWorkflowRunId(),
 * updateEvidenceFolderHrefByWorkflowRunId().
 */
(function (outputs, steps, params, stepResult, assertEqual) {
  gs.info('[ATF TEST] Starting Verification Workflow & Applicant Reuse Tests...');

  function check(name, actual, expected) {
    assertEqual({
      name: name,
      value: actual,
      shouldbe: expected,
    });
  }

  var repo = require('./src/server/repositories/verification-request-repository.ts');
  var TABLE_NAME = 'x_entru_entrustidv_verification_request';

  // -------------------------------------------------------------------------
  // Test Setup: Insert mock records in database
  // -------------------------------------------------------------------------
  var mockSourceTable = 'incident';
  var mockSourceSysId = 'mock_inc_sys_id_' + gs.generateGUID();
  var mockSubjectUserSysId = 'mock_user_sys_id_' + gs.generateGUID();
  var mockApplicantId = 'app_test_applicant_9999';

  gs.info('[ATF TEST 3.1] Creating initial active verification request record...');
  var gr1 = new GlideRecord(TABLE_NAME);
  gr1.initialize();
  gr1.setValue('source_table', mockSourceTable);
  gr1.setValue('source_record', mockSourceSysId);
  gr1.setValue('subject_user', mockSubjectUserSysId);
  gr1.setValue('applicant_id', mockApplicantId);
  gr1.setValue('workflow_run_id', 'wfr_initial_' + gs.generateGUID());
  gr1.setValue('status', 'In Progress');
  gr1.setValue('active', true);
  gr1.setValue('expires_at', new GlideDateTime().getValue());
  var req1SysId = gr1.insert();

  check('First mock verification request should be created successfully', !req1SysId, false);

  // -------------------------------------------------------------------------
  // Test Case 3.2: Applicant ID Reuse for Subject User
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.2] Testing findApplicantIdBySubjectUser()...');
  var foundApplicantId = repo.findApplicantIdBySubjectUser(mockSubjectUserSysId);
  check(
    'Should retrieve existing applicant ID for subject user',
    foundApplicantId,
    mockApplicantId
  );

  // -------------------------------------------------------------------------
  // Test Case 3.3: Status Resolution for Active Request
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.3] Testing findLatestVerificationStatus()...');
  var statusRecord = repo.findLatestVerificationStatus(mockSourceTable, mockSourceSysId);
  check('Status record should be found for active request', !statusRecord, false);
  check("Status should be 'In Progress'", statusRecord.status, 'In Progress');

  // -------------------------------------------------------------------------
  // Test Case 3.4: Deactivation of Previous Request
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.4] Testing deactivateActiveVerificationRequests()...');
  repo.deactivateActiveVerificationRequests(mockSourceTable, mockSourceSysId);

  // Verify first record is now active = false
  var grVerify1 = new GlideRecord(TABLE_NAME);
  if (grVerify1.get(req1SysId)) {
    var rawActive = grVerify1.getValue('active');
    var isActive = rawActive === '1' || rawActive === 'true' || rawActive === true;
    check('First verification request should now be deactivated (active=false)', isActive, false);
  } else {
    check('Could not reload first verification request record', false, true);
  }

  // Verify findLatestVerificationStatus returns null after deactivation
  var statusRecordAfterDeactivate = repo.findLatestVerificationStatus(
    mockSourceTable,
    mockSourceSysId
  );
  check(
    'findLatestVerificationStatus should return null when no active=true record exists',
    statusRecordAfterDeactivate,
    null
  );

  // -------------------------------------------------------------------------
  // Test Case 3.5: createVerificationRequest() / findVerificationRequestById()
  // -------------------------------------------------------------------------
  gs.info(
    '[ATF TEST 3.5] Testing createVerificationRequest() and findVerificationRequestById()...'
  );
  var createdWorkflowRunId = 'wfr_repo_created_' + gs.generateGUID();
  var createdExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  var createdSysId = repo.createVerificationRequest({
    sourceTable: mockSourceTable,
    sourceRecordId: mockSourceSysId,
    subjectUserId: mockSubjectUserSysId,
    applicantId: mockApplicantId,
    workflowId: 'wf_repo_test',
    workflowVersionId: '1',
    workflowRunId: createdWorkflowRunId,
    status: 'awaiting',
    expiresAt: createdExpiresAt,
  });
  check('createVerificationRequest should return a sys_id', !!createdSysId, true);

  var foundById = repo.findVerificationRequestById(createdSysId);
  check('findVerificationRequestById should locate the created record', !foundById, false);
  if (foundById) {
    check(
      'Found record should have the expected workflow_run_id',
      foundById.getValue('workflow_run_id'),
      createdWorkflowRunId
    );
  }

  check(
    'findVerificationRequestById should return null for a non-existent sys_id',
    repo.findVerificationRequestById('non_existent_sys_id_9999'),
    null
  );

  // -------------------------------------------------------------------------
  // Test Case 3.5b: createVerificationRequest() rejects an invalid expiresAt
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.5b] Testing createVerificationRequest() with an invalid expiresAt...');
  try {
    repo.createVerificationRequest({
      sourceTable: mockSourceTable,
      sourceRecordId: mockSourceSysId,
      subjectUserId: mockSubjectUserSysId,
      applicantId: mockApplicantId,
      workflowId: 'wf_repo_test',
      workflowVersionId: '1',
      workflowRunId: 'wfr_repo_invalid_expiry_' + gs.generateGUID(),
      status: 'awaiting',
      expiresAt: 'not_a_valid_date',
    });
    check('Should have thrown error for invalid expiresAt', false, true);
  } catch (e) {
    check(
      'Expected invalid expiry message',
      e.message,
      'Unable to persist an invalid verification link expiry.'
    );
  }

  // -------------------------------------------------------------------------
  // Test Case 3.6: countVerificationRequests()
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.6] Testing countVerificationRequests()...');
  // mockSourceSysId now has 2 requests: the original (3.1, now deactivated) + the one created in 3.5
  check(
    'countVerificationRequests should count all requests regardless of active state',
    repo.countVerificationRequests(mockSourceTable, mockSourceSysId),
    2
  );
  check(
    'countVerificationRequests should return 0 for a source record with no requests',
    repo.countVerificationRequests(mockSourceTable, 'no_such_source_record'),
    0
  );

  // -------------------------------------------------------------------------
  // Test Case 3.7: findVerificationStatusByWorkflowRunId()
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.7] Testing findVerificationStatusByWorkflowRunId()...');
  var statusByWfr = repo.findVerificationStatusByWorkflowRunId(createdWorkflowRunId);
  check(
    'findVerificationStatusByWorkflowRunId should locate the created record',
    !statusByWfr,
    false
  );
  if (statusByWfr) {
    check('Status by workflow run ID should match', statusByWfr.status, 'awaiting');
    check('Source table should match', statusByWfr.sourceTable, mockSourceTable);
  }
  check(
    'findVerificationStatusByWorkflowRunId should return null for an unknown workflow run ID',
    repo.findVerificationStatusByWorkflowRunId('no_such_wfr_id'),
    null
  );

  // -------------------------------------------------------------------------
  // Test Case 3.8: updateLastStatusSyncByWorkflowRunId()
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 3.8] Testing updateLastStatusSyncByWorkflowRunId()...');
  var syncTimestamp = new GlideDateTime().getValue();
  repo.updateLastStatusSyncByWorkflowRunId(createdWorkflowRunId, syncTimestamp);

  var grVerifySync = new GlideRecord(TABLE_NAME);
  if (grVerifySync.get(createdSysId)) {
    check(
      'last_status_sync should be updated to the given timestamp',
      grVerifySync.getValue('last_status_sync'),
      syncTimestamp
    );
  } else {
    check('Could not reload record to verify last_status_sync update', false, true);
  }

  stepResult.setOutputMessage(
    'Verification Workflow & Applicant Reuse Tests completed successfully.'
  );
  return true;
})(outputs, steps, params, stepResult, assertEqual);
