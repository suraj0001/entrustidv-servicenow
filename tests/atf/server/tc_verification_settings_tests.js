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
            deliveryChannel: "email",
            redirectUrl: "https://example.com"
        });
        check("Should have thrown error for missing workflow ID", false, true);
    } catch (e) {
        check("Expected missing workflow ID message", e.message, "Workflow ID is required.");
    }

    // -------------------------------------------------------------------------
    // Test Case 2.2: Input Validation - Invalid Link Expiry
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.2] Testing invalid link expiry...");
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: "wf_12345",
            linkExpiry: "-5",
            deliveryChannel: "email",
            redirectUrl: ""
        });
        check("Should have thrown error for negative link expiry", false, true);
    } catch (e) {
        check("Expected positive number validation message", e.message, "Link expiry must be a positive whole number.");
    }

    // -------------------------------------------------------------------------
    // Test Case 2.3: Input Validation - Invalid Redirect URL
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.3] Testing invalid redirect URL format...");
    try {
        settingsSvc.saveVerificationSettings({
            workflowId: "wf_12345",
            linkExpiry: "24",
            deliveryChannel: "email",
            redirectUrl: "not_a_valid_url"
        });
        check("Should have thrown error for invalid redirect URL", false, true);
    } catch (e) {
        check("Expected invalid redirect URL message", e.message, "Enter a valid redirect URL.");
    }

    // -------------------------------------------------------------------------
    // Test Case 2.4: Save & Retrieve Valid Verification Settings
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 2.4] Testing saving valid verification settings...");
    var saveRes = settingsSvc.saveVerificationSettings({
        workflowId: "wf_test_suite_123",
        linkExpiry: "48",
        deliveryChannel: "email",
        redirectUrl: "https://example.com/idv-return"
    });
    check("saveVerificationSettings should succeed", saveRes.success, true);

    var getRes = settingsSvc.getVerificationSettingsConfig();
    check("getVerificationSettingsConfig should succeed", getRes.success, true);
    check("Retrieved workflow ID should match", getRes.settings.workflowId, "wf_test_suite_123");
    check("Retrieved link expiry should be numeric 48", getRes.settings.linkExpiry, 48);

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

    var secretRes = settingsSvc.saveWebhookSecret("valid_webhook_secret_token_12345");
    check("saveWebhookSecret should succeed with valid length", secretRes.success, true);

    var secretStatus = settingsSvc.getWebhookSecretStatus();
    check("Webhook secret status should report configured = true", secretStatus.configured, true);

    stepResult.setOutputMessage("Admin - Verification Settings Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
