/**
 * ATF Test: Admin - Verification Settings Server Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Admin - Verification Settings Server Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Workflow ID & Redirect URL Validation (Cases 2.1, 2.1b, 2.3, 2.3b)
 *   - Step 2: Link Expiry Duration Bounds & Unit Conversion (Cases 2.2, 2.2b, 2.2c, 2.4, 2.4b)
 *   - Step 3: Webhook Signing Secret Validation & Status Check (Case 2.5)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Workflow ID & Redirect URL Format/Optionality Validation
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Workflow ID & Redirect URL Validation...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var settingsSvc = require("./src/server/services/verification-settings-service.ts");
    var validWorkflowId = "wf_test_suite_123";

    // Test Case 2.1: Missing workflow ID
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: "",
            linkExpiry: "24",
            linkExpiryUnit: "minutes",
            deliveryChannel: "email",
            redirectUrl: "https://example.com"
        });
        check("Should have thrown error for missing workflow ID", false, true);
    } catch (e) {
        check("Expected missing workflow ID message", e.message, "Workflow ID is required.");
    }

    // Test Case 2.1b: Workflow ID exceeding max length (100 chars)
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: new Array(102).join("a"), // 101 chars (> 100 max)
            linkExpiry: "24",
            linkExpiryUnit: "minutes",
            deliveryChannel: "email",
            redirectUrl: "https://example.com"
        });
        check("Should have thrown error for workflow ID exceeding max length", false, true);
    } catch (e) {
        check("Expected max length validation message", e.message, "Workflow ID must be 100 characters or fewer.");
    }

    // Test Case 2.3: Invalid redirect URL
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: validWorkflowId,
            linkExpiry: "24",
            linkExpiryUnit: "minutes",
            deliveryChannel: "email",
            redirectUrl: "not_a_valid_url"
        });
        check("Should have thrown error for invalid redirect URL", false, true);
    } catch (e) {
        check("Expected invalid redirect URL message", e.message, "Enter a valid redirect URL.");
    }

    // Test Case 2.3b: Redirect URL is optional (omitted, http, https)
    var saveNoRedirect = settingsSvc.saveVerificationSettings({
        workflowId: validWorkflowId,
        linkExpiry: "24",
        linkExpiryUnit: "minutes",
        deliveryChannel: "email",
        redirectUrl: ""
    });
    check("saveVerificationSettings should succeed with omitted redirect URL", saveNoRedirect.success, true);

    var saveHttpRedirect = settingsSvc.saveVerificationSettings({
        workflowId: validWorkflowId,
        linkExpiry: "24",
        linkExpiryUnit: "minutes",
        deliveryChannel: "email",
        redirectUrl: "http://example.com/idv-return"
    });
    check("saveVerificationSettings should succeed with a valid http redirect URL", saveHttpRedirect.success, true);

    stepResult.setOutputMessage("Step 1 Passed: Workflow ID and Redirect URL validation verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Link Expiry Duration Bounds & Unit Round-Trip Conversion
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Link Expiry Duration Bounds & Unit Conversion...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var settingsSvc = require("./src/server/services/verification-settings-service.ts");
    var validWorkflowId = "wf_test_suite_123";

    // Test Case 2.2: Negative link expiry
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: validWorkflowId,
            linkExpiry: "-5",
            linkExpiryUnit: "minutes",
            deliveryChannel: "email",
            redirectUrl: ""
        });
        check("Should have thrown error for negative link expiry", false, true);
    } catch (e) {
        check("Expected positive number validation message", e.message, "Link expiry must be a positive whole number.");
    }

    // Test Case 2.2b: Link expiry unit validation
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: validWorkflowId,
            linkExpiry: "24",
            linkExpiryUnit: "",
            deliveryChannel: "email",
            redirectUrl: ""
        });
        check("Should have thrown error for missing link expiry unit", false, true);
    } catch (e) {
        check("Expected missing link expiry unit message", e.message, "Link expiry unit is required.");
    }

    try {
        settingsSvc.saveVerificationSettings({
            workflowId: validWorkflowId,
            linkExpiry: "24",
            linkExpiryUnit: "days",
            deliveryChannel: "email",
            redirectUrl: ""
        });
        check("Should have thrown error for invalid link expiry unit", false, true);
    } catch (e) {
        check("Expected invalid link expiry unit message", e.message, "Link expiry unit must be minutes or hours.");
    }

    // Test Case 2.2c: Link expiry max duration (48 hours / 2880 minutes)
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: validWorkflowId,
            linkExpiry: "49",
            linkExpiryUnit: "hours",
            deliveryChannel: "email",
            redirectUrl: ""
        });
        check("Should have thrown error for link expiry exceeding 48 hours", false, true);
    } catch (e) {
        check("Expected max hours validation message", e.message, "Link expiry cannot exceed 48 hours.");
    }

    try {
        settingsSvc.saveVerificationSettings({
            workflowId: validWorkflowId,
            linkExpiry: "2881",
            linkExpiryUnit: "minutes",
            deliveryChannel: "email",
            redirectUrl: ""
        });
        check("Should have thrown error for link expiry exceeding 2880 minutes", false, true);
    } catch (e) {
        check("Expected max minutes validation message", e.message, "Link expiry cannot exceed 2880 minutes.");
    }

    // Test Case 2.4: Save & Retrieve valid settings (minutes unit)
    var saveRes = settingsSvc.saveVerificationSettings({
        workflowId: validWorkflowId,
        linkExpiry: "48",
        linkExpiryUnit: "minutes",
        deliveryChannel: "email",
        redirectUrl: "https://example.com/idv-return"
    });
    check("saveVerificationSettings should succeed", saveRes.success, true);

    var getRes = settingsSvc.getVerificationSettingsConfig();
    check("getVerificationSettingsConfig should succeed", getRes.success, true);
    check("Retrieved workflow ID should match", getRes.settings.workflowId, validWorkflowId);
    check("Retrieved link expiry should be numeric 48", getRes.settings.linkExpiry, 48);
    check("Retrieved link expiry unit should be 'minutes'", getRes.settings.linkExpiryUnit, "minutes");

    // Test Case 2.4b: Save & Retrieve with Hours Unit (round-trip conversion)
    var saveHoursRes = settingsSvc.saveVerificationSettings({
        workflowId: validWorkflowId,
        linkExpiry: "2",
        linkExpiryUnit: "hours",
        deliveryChannel: "email",
        redirectUrl: ""
    });
    check("saveVerificationSettings should succeed with hours unit", saveHoursRes.success, true);

    var getHoursRes = settingsSvc.getVerificationSettingsConfig();
    check("Retrieved link expiry unit should be 'hours'", getHoursRes.settings.linkExpiryUnit, "hours");
    check("Retrieved link expiry should convert back to 2 hours", getHoursRes.settings.linkExpiry, 2);

    stepResult.setOutputMessage("Step 2 Passed: Link expiry bounds and unit conversions verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: Webhook Signing Secret Length Bounds & Status Check
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Webhook Signing Secret Validation & Status Check...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var settingsSvc = require("./src/server/services/verification-settings-service.ts");

    // Test Case 2.5: Webhook token secret length bounds & save
    try {
        settingsSvc.saveWebhookSecret("123"); // Too short (< 5 chars)
        check("Should have thrown error for short secret", false, true);
    } catch (e) {
        check("Expected length validation error", e.message, "Webhook token must be between 5 and 100 characters.");
    }

    var saveTooLongSecret = new Array(102).join("a"); // 101 chars (> 100 max)
    try {
        settingsSvc.saveWebhookSecret(saveTooLongSecret);
        check("Should have thrown error for secret exceeding max length", false, true);
    } catch (e) {
        check("Expected max length validation error", e.message, "Webhook token must be between 5 and 100 characters.");
    }

    var secretRes = settingsSvc.saveWebhookSecret("RJh4kjRgc-GfxESqNIkRNzU2Ffnz0MMY");
    check("saveWebhookSecret should succeed with valid length", secretRes.success, true);

    var secretStatus = settingsSvc.getWebhookSecretStatus();
    check("Webhook secret status should report configured = true", secretStatus.configured, true);

    stepResult.setOutputMessage("Step 3 Passed: Webhook secret bounds and status check verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

