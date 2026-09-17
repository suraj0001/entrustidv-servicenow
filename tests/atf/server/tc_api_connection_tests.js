/**
 * ATF Test: Admin - API Connection Server Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Admin - API Connection Server Tests"), create 3 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Input Validation & Unsupported Region Rejection (Cases 1.1 - 1.3)
 *   - Step 2: Configuration Read & Save Validation (Cases 1.4 - 1.5)
 *   - Step 3: Save Configuration Success & Alias Resolution (Cases 1.6 - 1.7)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Input Validation & Entrust Auth Failure Checks
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Input Validation & Entrust Auth Failure Checks...");
    
    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var apiSvc = require("./src/server/services/api-connection-service.ts");

    // Test Case 1.1: Missing input parameters
    var resMissing = apiSvc.testConnection("", "", "");
    check("Should fail when region, client_id, and client_secret are empty", resMissing.success, false);
    check("ErrorMessage match for missing fields", resMissing.message, "Region, Client ID and Client Secret are all required.");

    var resMissingSecret = apiSvc.testConnection("us", "client_123", "");
    check("Should fail when client secret is missing", resMissingSecret.success, false);

    // Test Case 1.2: Unsupported region
    var resBadRegion = apiSvc.testConnection("invalid_region", "client_123", "secret_456");
    check("Should fail for unsupported region", resBadRegion.success, false);
    check("ErrorMessage match for invalid region", resBadRegion.message, "Unsupported region: invalid_region");

    // Test Case 1.3: Invalid credentials
    var resInvalidCreds = apiSvc.testConnection("us", "invalid_client_id_atf_test", "invalid_secret_atf_test");
    check("Should return success: false for invalid credentials", resInvalidCreds.success, false);
    var isFailureMessage = resInvalidCreds.message.indexOf("Connection failed") !== -1 || 
                          resInvalidCreds.message.indexOf("Unable to connect") !== -1;
    check("Response message should report connection failure", isFailureMessage, true);

    stepResult.setOutputMessage("Step 1 Passed: Input validation and auth failure checks verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: Configuration Read & Save Validation Bounds
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: Configuration Read & Save Validation Bounds...");
    
    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var apiSvc = require("./src/server/services/api-connection-service.ts");

    // Test Case 1.4: Configuration read
    var configRes = apiSvc.getConfig();
    check("getConfig() should return success: true", configRes.success, true);

    // Test Case 1.5: Save configuration validation bounds
    var saveMissing = apiSvc.saveConfig({ region: "", clientId: "", clientSecret: "" });
    check("saveConfig should fail with empty input", saveMissing.success, false);

    var saveAsymmetric = apiSvc.saveConfig({ region: "us", clientId: "client_only_no_secret", clientSecret: "" });
    check("saveConfig should fail when only Client ID is provided", saveAsymmetric.success, false);
    check("ErrorMessage match for asymmetric fields", saveAsymmetric.message, "Provide both Client ID and Client Secret, or neither.");

    var saveTooShort = apiSvc.saveConfig({ region: "us", clientId: "abc", clientSecret: "abc" });
    check("saveConfig should fail when Client ID/Secret are shorter than minimum length", saveTooShort.success, false);

    var saveTooLong = apiSvc.saveConfig({ region: "us", clientId: new Array(257).join("a"), clientSecret: "atf_test_client_secret" });
    check("saveConfig should fail when Client ID exceeds maximum length", saveTooLong.success, false);

    stepResult.setOutputMessage("Step 2 Passed: Configuration read and input bounds verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 3: Save Configuration Persistence & Alias Information Lookup
// (Copy & paste into Test Step 3: "Run Server-Side Script")
// =============================================================================
(function step3(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 3: Save Configuration Persistence & Alias Information Lookup...");
    
    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var apiSvc = require("./src/server/services/api-connection-service.ts");

    // Test Case 1.6: Save configuration success
    var saveValid = apiSvc.saveConfig({
        region: "us",
        clientId: "atf_test_client_id",
        clientSecret: "atf_test_client_secret"
    });
    check("saveConfig should succeed with valid region and credentials", saveValid.success, true);
    check("saveConfig success message match", saveValid.message, "Configuration saved.");

    var configAfterSave = apiSvc.getConfig();
    check("getConfig() after save should return success: true", configAfterSave.success, true);
    check("getConfig() after save should reflect saved region", configAfterSave.region, "us");

    var saveMixedCaseRegion = apiSvc.saveConfig({
        region: "US",
        clientId: "atf_test_client_id",
        clientSecret: "atf_test_client_secret"
    });
    check("saveConfig should succeed with mixed-case region", saveMixedCaseRegion.success, true);

    // Test Case 1.7: Alias lookup
    var aliasInfo = apiSvc.getAliasInfo();
    check("getAliasInfo() should return success: true", aliasInfo.success, true);
    check("getAliasInfo() should report an existing HTTP connection", aliasInfo.hasConnection, true);

    stepResult.setOutputMessage("Step 3 Passed: Configuration persistence and alias lookup verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

