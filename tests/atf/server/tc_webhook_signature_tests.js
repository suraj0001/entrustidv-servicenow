/**
 * ATF Test: Webhook Signature Validator Tests
 * 
 * Instructions for ServiceNow ATF:
 * -----------------------------------------------------------------------------
 * Under this single Test ("Webhook Signature Validator Tests"), create 2 Test Steps
 * of type "Run Server-Side Script". Paste the corresponding STEP block into each step:
 *
 *   - Step 1: Missing Inputs & Malformed Signature Rejection (Cases 4.1 - 4.2)
 *   - Step 2: Valid HMAC-SHA256 Generation, Verification, Casing & Tamper Checks (Cases 4.3 - 4.5)
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// STEP 1: Missing Inputs & Malformed Header Validation
// (Copy & paste into Test Step 1: "Run Server-Side Script")
// =============================================================================
(function step1(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 1: Missing Inputs & Malformed Header Validation...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var validator = typeof EntrustWebhookSignatureValidator !== "undefined" ? 
        new EntrustWebhookSignatureValidator() : 
        new x_entru_entrustidv.EntrustWebhookSignatureValidator();

    var sampleSecret = "my_secret_webhook_token_123";
    var samplePayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Approved"}';

    // Test Case 4.1: Missing input handling
    check("Should fail when rawBody is empty", validator.validate("", "sig", sampleSecret), false);
    check("Should fail when signature header is empty", validator.validate(samplePayload, "", sampleSecret), false);
    check("Should fail when webhookSecret is empty", validator.validate(samplePayload, "sig", ""), false);

    // Test Case 4.2: Malformed signature format
    check("Should fail when signature length is not 64 chars", validator.validate(samplePayload, "short_invalid_sig", sampleSecret), false);
    
    var nonHexSig = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
    check("Should fail when signature is non-hex", validator.validate(samplePayload, nonHexSig, sampleSecret), false);

    stepResult.setOutputMessage("Step 1 Passed: Missing inputs and malformed signatures rejected.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);


// =============================================================================
// STEP 2: HMAC-SHA256 Signature Verification, Casing & Tamper Rejection
// (Copy & paste into Test Step 2: "Run Server-Side Script")
// =============================================================================
(function step2(outputs, steps, params, stepResult, assertEqual) {
    gs.info("[ATF TEST] Step 2: HMAC-SHA256 Signature Verification, Casing & Tamper Rejection...");

    function check(name, actual, expected) {
        assertEqual({ name: name, value: actual, shouldbe: expected });
    }

    var validator = typeof EntrustWebhookSignatureValidator !== "undefined" ? 
        new EntrustWebhookSignatureValidator() : 
        new x_entru_entrustidv.EntrustWebhookSignatureValidator();

    var sampleSecret = "my_secret_webhook_token_123";
    var samplePayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Approved"}';

    // Calculate expected HMAC SHA256 using platform CertificateEncryption
    var encodedSecret = gs.base64Encode(sampleSecret);
    var mac = new CertificateEncryption();
    var sigBase64 = mac.generateMac(encodedSecret, 'HmacSHA256', samplePayload);
    
    // Convert Base64 to Hex without relying on browser-only atob
    function base64ToHex(base64) {
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var input = String(base64).replace(/\s/g, '');
        var hex = '';

        for (var i = 0; i < input.length; i += 4) {
            var enc1 = alphabet.indexOf(input.charAt(i));
            var enc2 = alphabet.indexOf(input.charAt(i + 1));
            var enc3 = input.charAt(i + 2) === '=' ? 0 : alphabet.indexOf(input.charAt(i + 2));
            var enc4 = input.charAt(i + 3) === '=' ? 0 : alphabet.indexOf(input.charAt(i + 3));

            var byte1 = (enc1 << 2) | (enc2 >> 4);
            hex += (byte1 < 16 ? '0' : '') + byte1.toString(16);

            if (input.charAt(i + 2) !== '=') {
                var byte2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                hex += (byte2 < 16 ? '0' : '') + byte2.toString(16);
            }

            if (input.charAt(i + 3) !== '=') {
                var byte3 = ((enc3 & 3) << 6) | enc4;
                hex += (byte3 < 16 ? '0' : '') + byte3.toString(16);
            }
        }
        return hex;
    }

    var validHexSignature = base64ToHex(sigBase64);

    // Test Case 4.3: Valid signature passes
    var isValid = validator.validate(samplePayload, validHexSignature, sampleSecret);
    check("Valid HMAC-SHA256 signature should pass validation", isValid, true);

    var isValidUppercase = validator.validate(samplePayload, validHexSignature.toUpperCase(), sampleSecret);
    check("Uppercase hex signature should still pass validation", isValidUppercase, true);

    // Test Case 4.4: Tampered payload failure
    var tamperedPayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Declined"}';
    var isTamperedValid = validator.validate(tamperedPayload, validHexSignature, sampleSecret);
    check("Signature validation should fail when payload is tampered", isTamperedValid, false);

    // Test Case 4.5: Wrong secret failure
    var isWrongSecretValid = validator.validate(samplePayload, validHexSignature, "a_completely_different_secret");
    check("Signature validation should fail when the secret does not match", isWrongSecretValid, false);

    stepResult.setOutputMessage("Step 2 Passed: HMAC-SHA256 verification and tamper resistance verified.");
    return true;
})(outputs, steps, params, stepResult, assertEqual);

