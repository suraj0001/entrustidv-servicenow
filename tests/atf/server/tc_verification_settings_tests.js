/**
 * ATF Test Suite: Admin - Verification Settings Server Tests
 * 
 * Test Scenarios:
 *   - Missing Workflow ID validation
 *   - Workflow ID max length validation
 *   - Invalid (negative) Link Expiry validation
 *   - Link expiry unit validation (required, must be minutes/hours) and max duration (48h/2880min)
 *   - Malformed Redirect URL validation
 *   - Redirect URL is optional (omitted / valid http & https)
 *   - Save & retrieve valid verification settings, incl. hours↔minutes round-trip conversion
 *   - Webhook token secret length validation (5-100 chars) & status check
 */
(function(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Starting Admin - Verification Settings Server Tests...");

    function check(name, actual, expected) {
        assertEqual({
            name: name,
            value: actual,
            shouldbe: expected
        });
    }

    var settingsSvc = require("./src/server/services/verification-settings-service.ts");

    // -------------------------------------------------------------------------
    // Test Case 2.1: Input Validation - Missing Required Fields
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.1] Testing missing workflow ID...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.1b: Input Validation - Workflow ID Exceeds Max Length
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.1b] Testing workflow ID exceeding max length...");
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

    var validWorkflowId = "wf_test_suite_123";

    // -------------------------------------------------------------------------
    // Test Case 2.2: Input Validation - Invalid Link Expiry
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.2] Testing invalid link expiry...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.2b: Link Expiry Unit Validation
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.2b] Testing missing/invalid link expiry unit...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.2c: Link Expiry Max Duration (48 hours / 2880 minutes)
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.2c] Testing link expiry exceeding the 48-hour maximum...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.3: Input Validation - Invalid Redirect URL
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.3] Testing invalid redirect URL format...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.3b: Redirect URL is Optional
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.3b] Testing redirect URL is optional (omitted, http, https)...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.4: Save & Retrieve Valid Verification Settings
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.4] Testing saving valid verification settings...");
    var saveRes = settingsSvc.saveVerificationSettings({
        workflowId: "wf_test_suite_123",
        linkExpiry: "48",
        linkExpiryUnit: "minutes",
        deliveryChannel: "email",
        redirectUrl: "https://example.com/idv-return"
    });
    check("saveVerificationSettings should succeed", saveRes.success, true);

    var getRes = settingsSvc.getVerificationSettingsConfig();
    check("getVerificationSettingsConfig should succeed", getRes.success, true);
    check("Retrieved workflow ID should match", getRes.settings.workflowId, "wf_test_suite_123");
    check("Retrieved link expiry should be numeric 48", getRes.settings.linkExpiry, 48);
    check("Retrieved link expiry unit should be 'minutes'", getRes.settings.linkExpiryUnit, "minutes");

    // -------------------------------------------------------------------------
    // Test Case 2.4b: Save & Retrieve with Hours Unit (round-trip conversion)
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.4b] Testing hours\u2194minutes round-trip conversion...");
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

    // -------------------------------------------------------------------------
    // Test Case 2.5: Webhook Token Secret Validation & Save
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.5] Testing webhook token secret validation...");
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

    stepResult.setOutputMessage("Admin - Verification Settings Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
