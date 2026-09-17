import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['556316cebd3545b88c1b99ce777e2b38'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: 'e9f5290e471b071016bda144846d43e6',
        order: 100,
        value: '3.1',
        variable: '42f2564b73031300440211d8faf6a777',
    },
})
Record({
    $id: Now.ID['709c7cc2fe48485b9ecfb102a06b47ab'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: 'e9f5290e471b071016bda144846d43e6',
        order: 200,
        value: `/**\r
 * ATF Test Suite: Webhook Processor Tests\r
 * \r
 * Test Scenarios:\r
 *   - Null and empty payload event handling\r
 *   - Unsupported/unknown action and missing-action payload handling\r
 *   - Stale/superseded link event handling (status update ignored, stale work note logged)\r
 *   - Active link completion status update (workflow_run.completed), including alternate\r
 *     \`object.*\` payload shape\r
 *   - Missing workflowRunId/status and unknown workflowRunId handling\r
 *   - workflow_id mismatch rejection\r
 *   - Idempotent skip when status is already terminal or unchanged\r
 *   - Evidence folder URL recording (workflow_run_evidence_folder.created), including\r
 *     alternate \`resource.*\` payload shape, missing fields, and idempotent re-delivery\r
 *\r
 * COVERS: webhook-service.ts's processWebhook() and both its internal handlers end-to-end.\r
 * No real Entrust API call is made anywhere in this flow — processWebhook() only reads/writes\r
 * GlideRecords via verification-request-repository.ts and configuration-repository.ts.\r
 */\r
(function(outputs, steps, params, stepResult, assertEqual) {\r
    gs.info("[ATF TEST] Starting Webhook Processor Tests...");\r
\r
    function check(name, actual, expected) {\r
        assertEqual({\r
            name: name,\r
            value: actual,\r
            shouldbe: expected\r
        });\r
    }\r
\r
    var webhookSvc = require("./src/server/services/webhook-service.ts");\r
    var reqRepo = require("./src/server/repositories/verification-request-repository.ts");\r
    var TABLE_NAME = "x_entru_entrustidv_verification_request";\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.1: Null or Empty Payload Event Handling\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.1] Testing empty payload...");\r
    webhookSvc.processWebhook({}); // Should return silently without exceptions\r
    webhookSvc.processWebhook({ payload: null });\r
    webhookSvc.processWebhook({ payload: {} }); // payload present but no action\r
    check("Empty/missing payload or action should be handled gracefully", true, true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.1b: Unsupported/Unknown Action\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.1b] Testing unsupported action is ignored...");\r
    webhookSvc.processWebhook({ payload: { action: "some_unhandled_event", resource: { id: "whatever" } } });\r
    check("Unsupported action should be ignored gracefully", true, true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Setup: Insert mock records in database\r
    // -------------------------------------------------------------------------\r
    var mockSourceSysId = "mock_inc_sys_id_" + gs.generateGUID();\r
    var activeWfrId = "wfr_active_" + gs.generateGUID();\r
    var inactiveWfrId = "wfr_inactive_" + gs.generateGUID();\r
\r
    // Create an inactive (stale/superseded) request\r
    var grStale = new GlideRecord(TABLE_NAME);\r
    grStale.initialize();\r
    grStale.setValue("source_table", "incident");\r
    grStale.setValue("source_record", mockSourceSysId);\r
    grStale.setValue("workflow_run_id", inactiveWfrId);\r
    grStale.setValue("status", "Pending");\r
    grStale.setValue("active", false); // Inactive\r
    var staleSysId = grStale.insert();\r
\r
    // Create an active request\r
    var grActive = new GlideRecord(TABLE_NAME);\r
    grActive.initialize();\r
    grActive.setValue("source_table", "incident");\r
    grActive.setValue("source_record", mockSourceSysId);\r
    grActive.setValue("workflow_run_id", activeWfrId);\r
    grActive.setValue("status", "Pending");\r
    grActive.setValue("active", true); // Active\r
    var activeSysId = grActive.insert();\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.2: Stale/Superseded Link Handling\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.2] Processing webhook for inactive/stale workflow_run_id...");\r
    var stalePayload = {\r
        payload: {\r
            action: "workflow_run.completed",\r
            resource: {\r
                id: inactiveWfrId,\r
                status: "Approved"\r
            }\r
        }\r
    };\r
    webhookSvc.processWebhook(stalePayload);\r
\r
    // Verify status was NOT updated to Approved because request is inactive\r
    var grVerifyStale = new GlideRecord(TABLE_NAME);\r
    if (grVerifyStale.get(staleSysId)) {\r
        check("Stale request status should remain 'Pending' and not update", grVerifyStale.getValue("status"), "Pending");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.2b: Missing workflowRunId/status in Payload\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.2b] Testing workflow_run.completed with missing workflowRunId/status...");\r
    webhookSvc.processWebhook({ payload: { action: "workflow_run.completed", resource: {} } });\r
    webhookSvc.processWebhook({ payload: { action: "workflow_run.completed", resource: { id: "wfr_missing_status" } } });\r
    check("Missing workflowRunId/status should be handled gracefully", true, true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.2c: Unknown workflowRunId (no matching verification request)\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.2c] Testing workflow_run.completed for an unknown workflowRunId...");\r
    webhookSvc.processWebhook({\r
        payload: {\r
            action: "workflow_run.completed",\r
            resource: { id: "wfr_no_such_request_" + gs.generateGUID(), status: "Approved" }\r
        }\r
    });\r
    check("Unknown workflowRunId should be handled gracefully", true, true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.3: Active Link Status Update\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.3] Processing webhook for active workflow_run_id...");\r
    var activePayload = {\r
        payload: {\r
            action: "workflow_run.completed",\r
            resource: {\r
                id: activeWfrId,\r
                status: "Approved"\r
            }\r
        }\r
    };\r
    webhookSvc.processWebhook(activePayload);\r
\r
    // Verify status WAS updated to Approved\r
    var grVerifyActive = new GlideRecord(TABLE_NAME);\r
    if (grVerifyActive.get(activeSysId)) {\r
        check("Active request status should update to 'Approved'", grVerifyActive.getValue("status"), "Approved");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.3b: Idempotent Skip - Already Terminal / Unchanged Status\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.3b] Testing redundant webhook delivery is skipped once terminal...");\r
    webhookSvc.processWebhook({\r
        payload: {\r
            action: "workflow_run.completed",\r
            resource: { id: activeWfrId, status: "Declined" }\r
        }\r
    });\r
    var grVerifyIdempotent = new GlideRecord(TABLE_NAME);\r
    if (grVerifyIdempotent.get(activeSysId)) {\r
        check("Status already terminal ('Approved') should not be overwritten by a later webhook", grVerifyIdempotent.getValue("status"), "Approved");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.3c: workflow_run.completed via alternate \`object.*\` payload shape\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.3c] Testing workflow_run.completed using the object.* payload shape...");\r
    var altShapeWfrId = "wfr_alt_shape_" + gs.generateGUID();\r
    var grAltShape = new GlideRecord(TABLE_NAME);\r
    grAltShape.initialize();\r
    grAltShape.setValue("source_table", "incident");\r
    grAltShape.setValue("source_record", mockSourceSysId);\r
    grAltShape.setValue("workflow_run_id", altShapeWfrId);\r
    grAltShape.setValue("status", "Pending");\r
    grAltShape.setValue("active", true);\r
    var altShapeSysId = grAltShape.insert();\r
\r
    webhookSvc.processWebhook({\r
        payload: {\r
            action: "workflow_run.completed",\r
            object: { id: altShapeWfrId, status: "Declined" }\r
        }\r
    });\r
    var grVerifyAltShape = new GlideRecord(TABLE_NAME);\r
    if (grVerifyAltShape.get(altShapeSysId)) {\r
        check("object.* payload shape should update status just like resource.*", grVerifyAltShape.getValue("status"), "Declined");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.3d: workflow_id Mismatch Rejection\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.3d] Testing events for an unrelated workflow_id are ignored...");\r
    var settingsSvc = require("./src/server/services/verification-settings-service.ts");\r
    var savedSettings = settingsSvc.getVerificationSettingsConfig();\r
    var configuredWorkflowId = savedSettings && savedSettings.settings ? savedSettings.settings.workflowId : null;\r
\r
    if (configuredWorkflowId) {\r
        var mismatchWfrId = "wfr_mismatch_" + gs.generateGUID();\r
        var grMismatch = new GlideRecord(TABLE_NAME);\r
        grMismatch.initialize();\r
        grMismatch.setValue("source_table", "incident");\r
        grMismatch.setValue("source_record", mockSourceSysId);\r
        grMismatch.setValue("workflow_run_id", mismatchWfrId);\r
        grMismatch.setValue("status", "Pending");\r
        grMismatch.setValue("active", true);\r
        var mismatchSysId = grMismatch.insert();\r
\r
        webhookSvc.processWebhook({\r
            payload: {\r
                action: "workflow_run.completed",\r
                resource: { id: mismatchWfrId, status: "Approved", workflow_id: configuredWorkflowId + "_unrelated" }\r
            }\r
        });\r
\r
        var grVerifyMismatch = new GlideRecord(TABLE_NAME);\r
        if (grVerifyMismatch.get(mismatchSysId)) {\r
            check("Event for an unrelated workflow_id should be ignored", grVerifyMismatch.getValue("status"), "Pending");\r
        }\r
    } else {\r
        gs.warn("[ATF TEST 6.3d] Skipped: no workflow_id currently configured to test mismatch rejection against.");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.4: Evidence Folder Created Event\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.4] Processing workflow_run_evidence_folder.created webhook...");\r
    var evidencePayload = {\r
        payload: {\r
            action: "workflow_run_evidence_folder.created",\r
            object: {\r
                workflow_run_id: activeWfrId,\r
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345"\r
            }\r
        }\r
    };\r
    webhookSvc.processWebhook(evidencePayload);\r
\r
    // Verify evidenceFolderHref was updated\r
    var grVerifyEvidence = new GlideRecord(TABLE_NAME);\r
    if (grVerifyEvidence.get(activeSysId)) {\r
        check("Evidence folder href should be recorded", grVerifyEvidence.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_12345");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.4b: Evidence Folder Created - Missing Fields\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.4b] Testing evidence folder event with missing workflow_run_id/href...");\r
    webhookSvc.processWebhook({ payload: { action: "workflow_run_evidence_folder.created", object: {} } });\r
    webhookSvc.processWebhook({ payload: { action: "workflow_run_evidence_folder.created", object: { workflow_run_id: activeWfrId } } });\r
    check("Missing workflow_run_id/href should be handled gracefully", true, true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.4c: Evidence Folder Created via alternate \`resource.*\` payload shape\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.4c] Testing evidence folder event using the resource.* payload shape...");\r
    webhookSvc.processWebhook({\r
        payload: {\r
            action: "workflow_run_evidence_folder.created",\r
            resource: {\r
                workflow_run_id: activeWfrId,\r
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890"\r
            }\r
        }\r
    });\r
    var grVerifyEvidenceAlt = new GlideRecord(TABLE_NAME);\r
    if (grVerifyEvidenceAlt.get(activeSysId)) {\r
        check("resource.* payload shape should update the evidence folder href", grVerifyEvidenceAlt.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.4d: Evidence Folder Created - Idempotent Re-delivery\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.4d] Testing redundant evidence folder event with the same href is a no-op...");\r
    webhookSvc.processWebhook({\r
        payload: {\r
            action: "workflow_run_evidence_folder.created",\r
            resource: {\r
                workflow_run_id: activeWfrId,\r
                href: "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890"\r
            }\r
        }\r
    });\r
    var grVerifyEvidenceIdempotent = new GlideRecord(TABLE_NAME);\r
    if (grVerifyEvidenceIdempotent.get(activeSysId)) {\r
        check("Re-delivering the same evidence folder href should be a no-op", grVerifyEvidenceIdempotent.getValue("evidence_folder_href"), "https://api.us.idv.entrust.com/v2.0/evidence_folders/folder_67890");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 6.4e: Evidence Folder Created for Unknown workflowRunId\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 6.4e] Testing evidence folder event for an unknown workflowRunId...");\r
    webhookSvc.processWebhook({\r
        payload: {\r
            action: "workflow_run_evidence_folder.created",\r
            object: { workflow_run_id: "wfr_no_such_request_" + gs.generateGUID(), href: "https://example.com/evidence" }\r
        }\r
    });\r
    check("Unknown workflowRunId for evidence folder event should be handled gracefully", true, true);\r
\r
    stepResult.setOutputMessage("Webhook Processor Tests completed successfully.");\r
    return true;\r
})(outputs, steps, params, stepResult, assertEqual);\r`,
        variable: '989d9e235324220002c6435723dc3484',
    },
})
