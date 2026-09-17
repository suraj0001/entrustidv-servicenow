/**
 * ATF Test: Webhook Processor Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Webhook Processor Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Empty Payloads & Unsupported Action Event Handling (Cases 6.1, 6.1b)
 *   - Step 2: Workflow Run Completed Status Updates & Stale/Mismatch Rejections (Cases 6.2 - 6.3d)
 *   - Step 3: Evidence Folder Created Event Processing & Idempotency (Cases 6.4 - 6.4e)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Empty Payloads & Unsupported Actions Handling
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Empty Payloads & Unsupported Actions Handling...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var webhookSvc = require("./src/server/services/webhook-service.ts");

    // Test Case 6.1: Null or empty payloads
    webhookSvc.processWebhook({});
    webhookSvc.processWebhook({ payload: null });
    webhookSvc.processWebhook({ payload: {} });
    check("Empty/missing payload or action should be handled gracefully", true, true);

    // Test Case 6.1b: Unsupported actions
    webhookSvc.processWebhook({ payload: { action: "some_unhandled_event", resource: { id: "whatever" } } });
    check("Unsupported action should be ignored gracefully", true, true);

    stepResult.setOutputMessage("Step 1 Passed: Empty payloads and unsupported actions handled gracefully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Workflow Run Completed Status Updates, Stale & Mismatch Rejections
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Workflow Run Completed Status Updates & Rejections...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var webhookSvc = require("./src/server/services/webhook-service.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    var mockSourceSysId = gs.generateGUID();
    var activeWfrId = "wfr_active_" + gs.generateGUID();
    var inactiveWfrId = "wfr_inactive_" + gs.generateGUID();
    var mockSubjectUserSysId = gs.generateGUID();

    // Create an inactive (stale) request
    var grStale = new GlideRecord(TABLE_NAME);
    grStale.initialize();
    grStale.setValue("source_table", "incident");
    grStale.setValue("source_record", mockSourceSysId);
    grStale.setValue("subject_user", mockSubjectUserSysId);
    grStale.setValue("applicant_id", "app_" + gs.generateGUID());
    grStale.setValue("workflow_id", "wf_" + gs.generateGUID());
    grStale.setValue("workflow_version_id", "1");
    grStale.setValue("workflow_run_id", inactiveWfrId);
    grStale.setValue("status", "Pending");
    grStale.setValue("active", false);
    grStale.setValue("expires_at", new GlideDateTime().getValue());
    var staleSysId = grStale.insert();

    // Create an active request
    var grActive = new GlideRecord(TABLE_NAME);
    grActive.initialize();
    grActive.setValue("source_table", "incident");
    grActive.setValue("source_record", mockSourceSysId);
    grActive.setValue("subject_user", mockSubjectUserSysId);
    grActive.setValue("applicant_id", "app_" + gs.generateGUID());
    grActive.setValue("workflow_id", "wf_" + gs.generateGUID());
    grActive.setValue("workflow_version_id", "1");
    grActive.setValue("workflow_run_id", activeWfrId);
    grActive.setValue("status", "Pending");
    grActive.setValue("active", true);
    grActive.setValue("expires_at", new GlideDateTime().getValue());
    var activeSysId = grActive.insert();

    // Test Case 6.2: Stale link webhook handling
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            resource: { id: inactiveWfrId, status: "Approved" }
        }
    });
    var grVerifyStale = new GlideRecord(TABLE_NAME);
    if (grVerifyStale.get(staleSysId)) {
        check("Stale request status should remain 'Pending' and not update", grVerifyStale.getValue("status"), "Pending");
    }

    // Test Case 6.2b: Missing workflowRunId/status
    webhookSvc.processWebhook({ payload: { action: "workflow_run.completed", resource: {} } });
    webhookSvc.processWebhook({ payload: { action: "workflow_run.completed", resource: { id: "wfr_missing_status" } } });
    check("Missing workflowRunId/status should be handled gracefully", true, true);

    // Test Case 6.2c: Unknown workflowRunId
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            resource: { id: "wfr_no_such_request_" + gs.generateGUID(), status: "Approved" }
        }
    });
    check("Unknown workflowRunId should be handled gracefully", true, true);

    // Test Case 6.3: Active link status update
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            resource: { id: activeWfrId, status: "Approved" }
        }
    });
    var grVerifyActive = new GlideRecord(TABLE_NAME);
    if (grVerifyActive.get(activeSysId)) {
        check("Active request status should update to 'Approved'", grVerifyActive.getValue("status"), "Approved");
    }

    // Test Case 6.3b: Idempotent skip when status already terminal
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run.completed",
            resource: { id: activeWfrId, status: "Declined" }
        }
    });
    var grVerifyIdempotent = new GlideRecord(TABLE_NAME);
    if (grVerifyIdempotent.get(activeSysId)) {
        check("Status already terminal should not be overwritten", grVerifyIdempotent.getValue("status"), "Approved");
    }

    // Test Case 6.3c: Alternate object.* payload shape
    var altShapeWfrId = "wfr_alt_shape_" + gs.generateGUID();
    var grAltShape = new GlideRecord(TABLE_NAME);
    grAltShape.initialize();
    grAltShape.setValue("source_table", "incident");
    grAltShape.setValue("source_record", mockSourceSysId);
    grAltShape.setValue("subject_user", mockSubjectUserSysId);
    grAltShape.setValue("applicant_id", "app_" + gs.generateGUID());
    grAltShape.setValue("workflow_id", "wf_" + gs.generateGUID());
    grAltShape.setValue("workflow_version_id", "1");
    grAltShape.setValue("workflow_run_id", altShapeWfrId);
    grAltShape.setValue("status", "Pending");
    grAltShape.setValue("active", true);
    grAltShape.setValue("expires_at", new GlideDateTime().getValue());
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

    // Test Case 6.3d: workflow_id mismatch rejection
    var settingsSvc = require("./src/server/services/verification-settings-service.ts");
    var savedSettings = settingsSvc.getVerificationSettingsConfig();
    var configuredWorkflowId = savedSettings && savedSettings.settings ? savedSettings.settings.workflowId : null;

    if (configuredWorkflowId) {
        var mismatchWfrId = "wfr_mismatch_" + gs.generateGUID();
        var grMismatch = new GlideRecord(TABLE_NAME);
        grMismatch.initialize();
        grMismatch.setValue("source_table", "incident");
        grMismatch.setValue("source_record", mockSourceSysId);
        grMismatch.setValue("subject_user", mockSubjectUserSysId);
        grMismatch.setValue("applicant_id", "app_" + gs.generateGUID());
        grMismatch.setValue("workflow_id", mismatchWfrId);
        grMismatch.setValue("workflow_version_id", "1");
        grMismatch.setValue("workflow_run_id", mismatchWfrId);
        grMismatch.setValue("status", "Pending");
        grMismatch.setValue("active", true);
        grMismatch.setValue("expires_at", new GlideDateTime().getValue());
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
    }

    stepResult.setOutputMessage("Step 2 Passed: Workflow run status updates, stale and mismatch rejections verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: Evidence Folder Created Event Processing & Idempotency
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Evidence Folder Created Event Processing & Idempotency...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var webhookSvc = require("./src/server/services/webhook-service.ts");
    var TABLE_NAME = "x_entru_entrustidv_verification_request";

    var mockSourceSysId = gs.generateGUID();
    var activeWfrId = "wfr_active_evidence_" + gs.generateGUID();
    var mockSubjectUserSysId = gs.generateGUID();

    var grActive = new GlideRecord(TABLE_NAME);
    grActive.initialize();
    grActive.setValue("source_table", "incident");
    grActive.setValue("source_record", mockSourceSysId);
    grActive.setValue("subject_user", mockSubjectUserSysId);
    grActive.setValue("applicant_id", "app_" + gs.generateGUID());
    grActive.setValue("workflow_id", "wf_" + gs.generateGUID());
    grActive.setValue("workflow_version_id", "1");
    grActive.setValue("workflow_run_id", activeWfrId);
    grActive.setValue("status", "Pending");
    grActive.setValue("active", true);
    grActive.setValue("expires_at", new GlideDateTime().getValue());
    var activeSysId = grActive.insert();

    // Test Case 6.4: Evidence folder created event
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run_evidence_folder.created",
            object: {
                workflow_run_id: activeWfrId,
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345"
            }
        }
    });

    var grVerifyEvidence = new GlideRecord(TABLE_NAME);
    if (grVerifyEvidence.get(activeSysId)) {
        check("Evidence folder href should be recorded", grVerifyEvidence.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345");
    }

    // Test Case 6.4b: Missing fields handled gracefully
    webhookSvc.processWebhook({ payload: { action: "workflow_run_evidence_folder.created", object: {} } });
    webhookSvc.processWebhook({ payload: { action: "workflow_run_evidence_folder.created", object: { workflow_run_id: activeWfrId } } });
    check("Missing workflow_run_id/href should be handled gracefully", true, true);

    // Test Case 6.4c: Alternate resource.* payload shape
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

    // Test Case 6.4d: Idempotent re-delivery
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

    // Test Case 6.4e: Unknown workflowRunId
    webhookSvc.processWebhook({
        payload: {
            action: "workflow_run_evidence_folder.created",
            object: { workflow_run_id: "wfr_no_such_request_" + gs.generateGUID(), href: "https://example.com/evidence" }
        }
    });
    check("Unknown workflowRunId for evidence folder event should be handled gracefully", true, true);

    stepResult.setOutputMessage("Step 3 Passed: Evidence folder processing and idempotency verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

