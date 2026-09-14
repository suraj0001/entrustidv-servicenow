(function(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Starting Webhook Signature Validator Tests...");

    function check(name, actual, expected) {
        assertEqual({
            name: name,
            value: actual,
            shouldbe: expected
        });
    }

    var validator = new x_1350849_entrust.EntrustWebhookSignatureValidator();

    var sampleSecret = "my_secret_webhook_token_123";
    var samplePayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Approved"}';

    // -------------------------------------------------------------------------
    // Test Case 4.1: Missing Input Handling
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 4.1] Testing missing inputs...");
    check("Should fail when rawBody is empty", validator.validate("", "sig", sampleSecret), false);
    check("Should fail when signature header is empty", validator.validate(samplePayload, "", sampleSecret), false);
    check("Should fail when webhookSecret is empty", validator.validate(samplePayload, "sig", ""), false);

    // -------------------------------------------------------------------------
    // Test Case 4.2: Malformed Signature Format
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 4.2] Testing malformed signature headers...");
    check("Should fail when signature length is not 64 chars", validator.validate(samplePayload, "short_invalid_sig", sampleSecret), false);
    
    var nonHexSig = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"; // 64 non-hex chars
    check("Should fail when signature is non-hex", validator.validate(samplePayload, nonHexSig, sampleSecret), false);

    // -------------------------------------------------------------------------
    // Test Case 4.3: Valid HMAC-SHA256 Signature Generation & Verification
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 4.3] Generating valid HMAC-SHA256 signature for test payload...");
    
    // Calculate expected HMAC SHA256 using platform CertificateEncryption
    var encodedSecret = gs.base64Encode(sampleSecret);
    var mac = new CertificateEncryption();
    var sigBase64 = mac.generateMac(encodedSecret, 'HmacSHA256', samplePayload);
    
    // Convert Base64 to Hex to match expected Entrust signature format
    function base64ToHex(str) {
        for (var i = 0, bin = atob(str.replace(/[\r\n\t]/g, "")), hex = []; i < bin.length; ++i) {
            var tmp = bin.charCodeAt(i).toString(16);
            if (tmp.length === 1) tmp = "0" + tmp;
            hex.push(tmp);
        }
        return hex.join("");
    }

    var validHexSignature = base64ToHex(sigBase64);
    gs.info("[ATF TEST 4.3] Valid Hex Signature generated: " + validHexSignature);

    // Verify valid signature passes
    var isValid = validator.validate(samplePayload, validHexSignature, sampleSecret);
    check("Valid HMAC-SHA256 signature should pass validation", isValid, true);

    // -------------------------------------------------------------------------
    // Test Case 4.4: Tampered Payload Failure
    // -------------------------------------------------------------------------
    gs.info("[ATF TEST 4.4] Testing tampered payload failure...");
    var tamperedPayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Declined"}';
    var isTamperedValid = validator.validate(tamperedPayload, validHexSignature, sampleSecret);
    check("Signature validation should fail when payload is tampered", isTamperedValid, false);

    stepResult.setOutputMessage("Webhook Signature Validator Tests completed successfully.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);
