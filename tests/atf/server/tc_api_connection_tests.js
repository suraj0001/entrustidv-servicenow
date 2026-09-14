/**
 * ATF Test Suite: Admin - API Connection Server Tests
 * 
 * Test Scenarios:
 *   - Missing required inputs validation (region, client_id, client_secret)
 *   - Unsupported region error handling
 *   - Invalid credentials connection test against Entrust API
 *   - Configuration load via getConfig()
 *   - Save configuration input validation
 */
(function(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Starting Admin - API Connection Server Tests...");
    
    function check(name, actual, expected) {
        assertEqual({
            name: name,
            value: actual,
            shouldbe: expected
        });
    }

    var apiSvc = require("./src/server/services/api-connection-service.ts");

    // -------------------------------------------------------------------------
    // Test Case 1.1: Input Validation - Missing Parameters
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 1.1] Testing missing input parameters...");
    var resMissing = apiSvc.testConnection("", "", "");
    check("Should fail when region, client_id, and client_secret are empty", resMissing.success, false);
    check("ErrorMessage match for missing fields", resMissing.message, "Region, Client ID and Client Secret are all required.");

    var resMissingSecret = apiSvc.testConnection("us", "client_123", "");
    check("Should fail when client secret is missing", resMissingSecret.success, false);

    // -------------------------------------------------------------------------
    // Test Case 1.2: Input Validation - Unsupported Region
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 1.2] Testing unsupported region...");
    var resBadRegion = apiSvc.testConnection("invalid_region", "client_123", "secret_456");
    check("Should fail for unsupported region", resBadRegion.success, false);
    check("ErrorMessage match for invalid region", resBadRegion.message, "Unsupported region: invalid_region");

    // -------------------------------------------------------------------------
    // Test Case 1.3: Credential Verification - Invalid Credentials
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 1.3] Testing connection with invalid credentials against Entrust...");
    var resInvalidCreds = apiSvc.testConnection("us", "invalid_client_id_atf_test", "invalid_secret_atf_test");
    check("Should return success: false for invalid credentials", resInvalidCreds.success, false);
    
    var isFailureMessage = resInvalidCreds.message.indexOf("Connection failed") !== -1 || 
                          resInvalidCreds.message.indexOf("Unable to connect") !== -1;
    check("Response message should report connection failure", isFailureMessage, true);

    // -------------------------------------------------------------------------
    // Test Case 1.4: Configuration Read - getConfig()
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 1.4] Testing getConfig()...");
    var configRes = apiSvc.getConfig();
    check("getConfig() should return success: true", configRes.success, true);

    // -------------------------------------------------------------------------
    // Test Case 1.5: Save Configuration Validation
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 1.5] Testing saveConfig() validation...");
    var saveMissing = apiSvc.saveConfig({ region: "", clientId: "", clientSecret: "" });
    check("saveConfig should fail with empty input", saveMissing.success, false);

    stepResult.setOutputMessage("Admin - API Connection Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
