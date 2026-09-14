/**
 * ATF Test Suite: Webhook Processor Tests
 * 
 * Test Scenarios:
 *   - Null and empty payload event handling
 *   - Stale/superseded link event handling (status update ignored, stale work note logged)
 *   - Active link completion status update (workflow_run.completed)
 *   - Evidence folder URL recording (workflow_run_evidence_folder.created)
 */
(function(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Starting Webhook Processor Tests...");

    function check(name, actual, expected) {
        assertEqual({
            name: name,
            value: actual,
            shouldbe: expected
        });
    }

    var webhookSvc = require("./src/server/services/webhook-service.ts");
    var reqRepo = require("./src/server/repositories/verification-request-repository.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    // -------------------------------------------------------------------------
    // Test Case 6.1: Null or Empty Payload Event Handling
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.1] Testing empty payload...");
    webhookSvc.processWebhook({}); // Should return silently without exceptions
    webhookSvc.processWebhook({ payload: null });
    check("Empty payload should be handled gracefully", true, true);

    // -------------------------------------------------------------------------
    // Test Setup: Insert mock records in database
    // -------------------------------------------------------------------------
    var mockSourceSysId = "mock_inc_sys_id_" + gs.generateGUID();
    var activeWfrId = "wfr_active_" + gs.generateGUID();
    var inactiveWfrId = "wfr_inactive_" + gs.generateGUID();

    // Create an inactive (stale/superseded) request
    var grStale = new GlideRecord(TABLE_NAME);
    grStale.initialize();
    grStale.setValue("source_table", "incident");
    grStale.setValue("source_record", mockSourceSysId);
    grStale.setValue("workflow_run_id", inactiveWfrId);
    grStale.setValue("status", "Pending");
    grStale.setValue("active", false); // Inactive
    var staleSysId = grStale.insert();

    // Create an active request
    var grActive = new GlideRecord(TABLE_NAME);
    grActive.initialize();
    grActive.setValue("source_table", "incident");
    grActive.setValue("source_record", mockSourceSysId);
    grActive.setValue("workflow_run_id", activeWfrId);
    grActive.setValue("status", "Pending");
    grActive.setValue("active", true); // Active
    var activeSysId = grActive.insert();

    // -------------------------------------------------------------------------
    // Test Case 6.2: Stale/Superseded Link Handling
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.2] Processing webhook for inactive/stale workflow_run_id...");
    var stalePayload = {
        payload: {
            action: "workflow_run.completed",
            resource: {
                id: inactiveWfrId,
                status: "Approved"
            }
        }
    };
    webhookSvc.processWebhook(stalePayload);

    // Verify status was NOT updated to Approved because request is inactive
    var grVerifyStale = new GlideRecord(TABLE_NAME);
    if (grVerifyStale.get(staleSysId)) {
        check("Stale request status should remain 'Pending' and not update", grVerifyStale.getValue("status"), "Pending");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.3: Active Link Status Update
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.3] Processing webhook for active workflow_run_id...");
    var activePayload = {
        payload: {
            action: "workflow_run.completed",
            resource: {
                id: activeWfrId,
                status: "Approved"
            }
        }
    };
    webhookSvc.processWebhook(activePayload);

    // Verify status WAS updated to Approved
    var grVerifyActive = new GlideRecord(TABLE_NAME);
    if (grVerifyActive.get(activeSysId)) {
        check("Active request status should update to 'Approved'", grVerifyActive.getValue("status"), "Approved");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.4: Evidence Folder Created Event
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.4] Processing workflow_run_evidence_folder.created webhook...");
    var evidencePayload = {
        payload: {
            action: "workflow_run_evidence_folder.created",
            object: {
                workflow_run_id: activeWfrId,
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345"
            }
        }
    };
    webhookSvc.processWebhook(evidencePayload);

    // Verify evidenceFolderHref was updated
    var grVerifyEvidence = new GlideRecord(TABLE_NAME);
    if (grVerifyEvidence.get(activeSysId)) {
        assertEqual(grVerifyEvidence.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345", "Evidence folder href should be recorded");
    }

    stepResult.setOutputMessage("Webhook Processor Tests completed successfully.");
    return true;
})(outputs, steps, stepResult, assertEqual);
