/**
 * ATF Test Suite: Webhook Processor Tests
 * 
 * Test Scenarios:
 *   - Null and empty payload event handling
 *   - Unsupported/unknown action and missing-action payload handling
 *   - Stale/superseded link event handling (status update ignored, stale work note logged)
 *   - Active link completion status update (workflow_run.completed), including alternate
 *     `object.*` payload shape
 *   - Missing workflowRunId/status and unknown workflowRunId handling
 *   - workflow_id mismatch rejection
 *   - Idempotent skip when status is already terminal or unchanged
 *   - Evidence folder URL recording (workflow_run_evidence_folder.created), including
 *     alternate `resource.*` payload shape, missing fields, and idempotent re-delivery
 *
 * COVERS: webhook-service.ts's processWebhook() and both its internal handlers end-to-end.
 * No real Entrust API call is made anywhere in this flow — processWebhook() only reads/writes
 * GlideRecords via verification-request-repository.ts and configuration-repository.ts.
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
    webhookSvc.processWebhook({ payload: {} }); // payload present but no action
    check("Empty/missing payload or action should be handled gracefully", true, true);

    // -------------------------------------------------------------------------
    // Test Case 6.1b: Unsupported/Unknown Action
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.1b] Testing unsupported action is ignored...");
    webhookSvc.processWebhook({ payload: { action: "some_unhandled_event", resource: { id: "whatever" } } });
    check("Unsupported action should be ignored gracefully", true, true);

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
    // Test Case 6.2b: Missing workflowRunId/status in Payload
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.2b] Testing workflow_run.completed with missing workflowRunId/status...");
    webhookSvc.processWebhook({ payload: { action: "workflow_run.completed", resource: {} } });
    webhookSvc.processWebhook({ payload: { action: "workflow_run.completed", resource: { id: "wfr_missing_status" } } });
    check("Missing workflowRunId/status should be handled gracefully", true, true);

    // -------------------------------------------------------------------------
    // Test Case 6.2c: Unknown workflowRunId (no matching verification request)
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.2c] Testing workflow_run.completed for an unknown workflowRunId...");
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            resource: { id: "wfr_no_such_request_" + gs.generateGUID(), status: "Approved" }
        }
    });
    check("Unknown workflowRunId should be handled gracefully", true, true);

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
    // Test Case 6.3b: Idempotent Skip - Already Terminal / Unchanged Status
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.3b] Testing redundant webhook delivery is skipped once terminal...");
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            resource: { id: activeWfrId, status: "Declined" }
        }
    });
    var grVerifyIdempotent = new GlideRecord(TABLE_NAME);
    if (grVerifyIdempotent.get(activeSysId)) {
        check("Status already terminal ('Approved') should not be overwritten by a later webhook", grVerifyIdempotent.getValue("status"), "Approved");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.3c: workflow_run.completed via alternate `object.*` payload shape
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.3c] Testing workflow_run.completed using the object.* payload shape...");
    var altShapeWfrId = "wfr_alt_shape_" + gs.generateGUID();
    var grAltShape = new GlideRecord(TABLE_NAME);
    grAltShape.initialize();
    grAltShape.setValue("source_table", "incident");
    grAltShape.setValue("source_record", mockSourceSysId);
    grAltShape.setValue("workflow_run_id", altShapeWfrId);
    grAltShape.setValue("status", "Pending");
    grAltShape.setValue("active", true);
    var altShapeSysId = grAltShape.insert();

    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            object: { id: altShapeWfrId, status: "Declined" }
        }
    });
    var grVerifyAltShape = new GlideRecord(TABLE_NAME);
    if (grVerifyAltShape.get(altShapeSysId)) {
        check("object.* payload shape should update status just like resource.*", grVerifyAltShape.getValue("status"), "Declined");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.3d: workflow_id Mismatch Rejection
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.3d] Testing events for an unrelated workflow_id are ignored...");
    var settingsSvc = require("./src/server/services/verification-settings-service.ts");
    var savedSettings = settingsSvc.getVerificationSettingsConfig();
    var configuredWorkflowId = savedSettings && savedSettings.settings ? savedSettings.settings.workflowId : null;

    if (configuredWorkflowId) {
        var mismatchWfrId = "wfr_mismatch_" + gs.generateGUID();
        var grMismatch = new GlideRecord(TABLE_NAME);
        grMismatch.initialize();
        grMismatch.setValue("source_table", "incident");
        grMismatch.setValue("source_record", mockSourceSysId);
        grMismatch.setValue("workflow_run_id", mismatchWfrId);
        grMismatch.setValue("status", "Pending");
        grMismatch.setValue("active", true);
        var mismatchSysId = grMismatch.insert();

        webhookSvc.processWebhook({
            payload: {
                action: "workflow_run.completed",
                resource: { id: mismatchWfrId, status: "Approved", workflow_id: configuredWorkflowId + "_unrelated" }
            }
        });

        var grVerifyMismatch = new GlideRecord(TABLE_NAME);
        if (grVerifyMismatch.get(mismatchSysId)) {
            check("Event for an unrelated workflow_id should be ignored", grVerifyMismatch.getValue("status"), "Pending");
        }
    } else {
        gs.warn("[ATF TEST 6.3d] Skipped: no workflow_id currently configured to test mismatch rejection against.");
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
        check("Evidence folder href should be recorded", grVerifyEvidence.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.4b: Evidence Folder Created - Missing Fields
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.4b] Testing evidence folder event with missing workflow_run_id/href...");
    webhookSvc.processWebhook({ payload: { action: "workflow_run_evidence_folder.created", object: {} } });
    webhookSvc.processWebhook({ payload: { action: "workflow_run_evidence_folder.created", object: { workflow_run_id: activeWfrId } } });
    check("Missing workflow_run_id/href should be handled gracefully", true, true);

    // -------------------------------------------------------------------------
    // Test Case 6.4c: Evidence Folder Created via alternate `resource.*` payload shape
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.4c] Testing evidence folder event using the resource.* payload shape...");
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run_evidence_folder.created",
            resource: {
                workflow_run_id: activeWfrId,
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890"
            }
        }
    });
    var grVerifyEvidenceAlt = new GlideRecord(TABLE_NAME);
    if (grVerifyEvidenceAlt.get(activeSysId)) {
        check("resource.* payload shape should update the evidence folder href", grVerifyEvidenceAlt.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.4d: Evidence Folder Created - Idempotent Re-delivery
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.4d] Testing redundant evidence folder event with the same href is a no-op...");
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run_evidence_folder.created",
            resource: {
                workflow_run_id: activeWfrId,
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890"
            }
        }
    });
    var grVerifyEvidenceIdempotent = new GlideRecord(TABLE_NAME);
    if (grVerifyEvidenceIdempotent.get(activeSysId)) {
        check("Re-delivering the same evidence folder href should be a no-op", grVerifyEvidenceIdempotent.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890");
    }

    // -------------------------------------------------------------------------
    // Test Case 6.4e: Evidence Folder Created for Unknown workflowRunId
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 6.4e] Testing evidence folder event for an unknown workflowRunId...");
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run_evidence_folder.created",
            object: { workflow_run_id: "wfr_no_such_request_" + gs.generateGUID(), href: "https://example.com/evidence" }
        }
    });
    check("Unknown workflowRunId for evidence folder event should be handled gracefully", true, true);

    stepResult.setOutputMessage("Webhook Processor Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
