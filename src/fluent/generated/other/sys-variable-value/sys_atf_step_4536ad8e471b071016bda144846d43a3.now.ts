import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['064dca8166cd4efa8588ab951f7d751b'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '4536ad8e471b071016bda144846d43a3',
        order: 200,
        value: `/**\r
 * ATF Test Suite: Webhook Signature Validator Tests\r
 * \r
 * Test Scenarios:\r
 *   - Missing payload, signature header, or secret handling\r
 *   - Malformed / non-hex signature format rejection\r
 *   - Valid HMAC-SHA256 signature generation & verification (incl. uppercase-hex signatures)\r
 *   - Tampered payload signature failure\r
 *   - Wrong secret signature failure\r
 *\r
 * COVERS: EntrustWebhookSignatureValidator.validate() end-to-end, including the private\r
 * _base64ToHex/_constantTimeEquals helpers exercised indirectly via a real HMAC-SHA256\r
 * round-trip. No Entrust API call is involved — signature validation is local crypto only.\r
 */\r
(function(outputs, steps, params, stepResult, assertEqual) {\r
    gs.info("[ATF TEST] Starting Webhook Signature Validator Tests...");\r
\r
    function check(name, actual, expected) {\r
        assertEqual({\r
            name: name,\r
            value: actual,\r
            shouldbe: expected\r
        });\r
    }\r
\r
    var validator = typeof EntrustWebhookSignatureValidator !== "undefined" ? \r
        new EntrustWebhookSignatureValidator() : \r
        new x_entru_entrustidv.EntrustWebhookSignatureValidator();\r
\r
    var sampleSecret = "my_secret_webhook_token_123";\r
    var samplePayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Approved"}';\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 4.1: Missing Input Handling\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 4.1] Testing missing inputs...");\r
    check("Should fail when rawBody is empty", validator.validate("", "sig", sampleSecret), false);\r
    check("Should fail when signature header is empty", validator.validate(samplePayload, "", sampleSecret), false);\r
    check("Should fail when webhookSecret is empty", validator.validate(samplePayload, "sig", ""), false);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 4.2: Malformed Signature Format\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 4.2] Testing malformed signature headers...");\r
    check("Should fail when signature length is not 64 chars", validator.validate(samplePayload, "short_invalid_sig", sampleSecret), false);\r
    \r
    var nonHexSig = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"; // 64 non-hex chars\r
    check("Should fail when signature is non-hex", validator.validate(samplePayload, nonHexSig, sampleSecret), false);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 4.3: Valid HMAC-SHA256 Signature Generation & Verification\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 4.3] Generating valid HMAC-SHA256 signature for test payload...");\r
    \r
    // Calculate expected HMAC SHA256 using platform CertificateEncryption\r
    var encodedSecret = gs.base64Encode(sampleSecret);\r
    var mac = new CertificateEncryption();\r
    var sigBase64 = mac.generateMac(encodedSecret, 'HmacSHA256', samplePayload);\r
    \r
    // Convert Base64 to Hex to match expected Entrust signature format\r
    function base64ToHex(str) {\r
        for (var i = 0, bin = atob(str.replace(/[\\r\\n\\t]/g, "")), hex = []; i < bin.length; ++i) {\r
            var tmp = bin.charCodeAt(i).toString(16);\r
            if (tmp.length === 1) tmp = "0" + tmp;\r
            hex.push(tmp);\r
        }\r
        return hex.join("");\r
    }\r
\r
    var validHexSignature = base64ToHex(sigBase64);\r
    gs.info("[ATF TEST 4.3] Valid Hex Signature generated: " + validHexSignature);\r
\r
    // Verify valid signature passes\r
    var isValid = validator.validate(samplePayload, validHexSignature, sampleSecret);\r
    check("Valid HMAC-SHA256 signature should pass validation", isValid, true);\r
\r
    // Signature comparison is case-insensitive (validator lowercases before comparing)\r
    var isValidUppercase = validator.validate(samplePayload, validHexSignature.toUpperCase(), sampleSecret);\r
    check("Uppercase hex signature should still pass validation", isValidUppercase, true);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 4.4: Tampered Payload Failure\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 4.4] Testing tampered payload failure...");\r
    var tamperedPayload = '{"event":"workflow_run.completed","workflow_run_id":"wfr_test_123","status":"Declined"}';\r
    var isTamperedValid = validator.validate(tamperedPayload, validHexSignature, sampleSecret);\r
    check("Signature validation should fail when payload is tampered", isTamperedValid, false);\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 4.5: Wrong Secret Failure\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 4.5] Testing validation fails when a different secret is used...");\r
    var isWrongSecretValid = validator.validate(samplePayload, validHexSignature, "a_completely_different_secret");\r
    check("Signature validation should fail when the secret does not match", isWrongSecretValid, false);\r
\r
    stepResult.setOutputMessage("Webhook Signature Validator Tests completed successfully.");\r
    return true;\r
})(outputs, steps, params, stepResult, assertEqual);\r`,
        variable: '989d9e235324220002c6435723dc3484',
    },
})
Record({
    $id: Now.ID['af57d753a98d4edfb417fdc47ed342ff'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: '4536ad8e471b071016bda144846d43a3',
        order: 100,
        value: '3.1',
        variable: '42f2564b73031300440211d8faf6a777',
    },
})
