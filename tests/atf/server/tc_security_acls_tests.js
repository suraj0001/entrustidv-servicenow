/**
 * ATF Test Suite: Admin - Security, Roles & ACL Tests
 *
 * Test Scenarios:
 *   - Application roles existence check (x_entru_entrustidv.admin, x_entru_entrustidv.agent)
 *   - Table ACL operation restrictions (manual create, write, delete blocked on requests)
 *   - Configuration table ACL delete restriction
 *   - Scoped UI Page ACL rules existence check
 */
(function (outputs, steps, params, stepResult, assertEqual) {
  gs.info('[ATF TEST] Starting Admin - Security, Roles & ACL Tests...');

  function check(name, actual, expected) {
    assertEqual({
      name: name,
      value: actual,
      shouldbe: expected,
    });
  }

  var CONFIG_TABLE = 'x_entru_entrustidv_configuration';
  var REQ_TABLE = 'x_entru_entrustidv_verification_request';

  // -------------------------------------------------------------------------
  // Test Case 8.1: Verify Application Role Existence
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 8.1] Verifying application roles exist in instance...');

  var grRoleAdmin = new GlideRecord('sys_user_role');
  grRoleAdmin.addQuery('name', 'x_entru_entrustidv.admin');
  grRoleAdmin.query();
  check('Role x_entru_entrustidv.admin should exist in instance', grRoleAdmin.next(), true);

  var grRoleAgent = new GlideRecord('sys_user_role');
  grRoleAgent.addQuery('name', 'x_entru_entrustidv.agent');
  grRoleAgent.query();
  check('Role x_entru_entrustidv.agent should exist in instance', grRoleAgent.next(), true);

  // -------------------------------------------------------------------------
  // Test Case 8.2: Verification Request Table ACL Operations
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 8.2] Testing table operation permissions on verification requests...');
  var grReq = new GlideRecord(REQ_TABLE);
  grReq.initialize();

  // Verify manual user modifications (write/delete) are restricted by ACL scripts
  // (In application table ACLs: manual create, write, delete scripts evaluate to 'answer = false')
  check(
    'Manual creation of verification requests should be restricted by ACL',
    grReq.canCreate(),
    false
  );
  check(
    'Manual updating of verification requests should be restricted by ACL',
    grReq.canWrite(),
    false
  );
  check('Deletion of verification requests should be restricted by ACL', grReq.canDelete(), false);

  // -------------------------------------------------------------------------
  // Test Case 8.3: Configuration Table ACL Operations
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 8.3] Testing table operation permissions on IDV configuration...');
  var grConfig = new GlideRecord(CONFIG_TABLE);
  grConfig.initialize();

  check(
    'Deletion of configuration records should be restricted by ACL',
    grConfig.canDelete(),
    false
  );

  // -------------------------------------------------------------------------
  // Test Case 8.4: UI Page Security ACLs Configuration
  // -------------------------------------------------------------------------
  gs.info('[ATF TEST 8.4] Verifying UI page ACL rules exist for admin setup pages...');

  var grAcl = new GlideRecord('sys_security_acl');
  grAcl.addQuery('type', 'ui_page');
  grAcl.addQuery('name', 'CONTAINS', 'x_entru_entrustidv');
  grAcl.query();

  var aclCount = 0;
  while (grAcl.next()) {
    aclCount++;
  }
  check('UI page ACL rules should be configured for the scoped application', aclCount > 0, true);

  stepResult.setOutputMessage('Admin - Security, Roles & ACL Tests completed successfully.');
  return true;
})(outputs, steps, params, stepResult, assertEqual);
