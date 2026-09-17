import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['43448046a3c74e68aa9b6afd257a51f4'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: 'f650a102471b071016bda144846d43a1',
        order: 200,
        value: `/**\r
 * ATF Test Suite: Agent - Start Verification Server Tests\r
 * \r
 * Test Scenarios:\r
 *   - Invalid/non-existent source record error handling\r
 *   - Subject user missing email address validation\r
 *   - Subject user missing first/last name validation\r
 *   - Maximum verification requests limit check (MAX_VERIFICATION_REQUESTS)\r
 *   - Incomplete IDV configuration error handling (missing workflow ID)\r
 *   - Entrust API connection not configured error handling (missing region)\r
 *\r
 * NOTE: Real Entrust API calls (applicant/workflow run creation, including\r
 * success and failure responses) are NOT exercised here. See\r
 * tc_start_verification_live_integration_test.js for a real, opt-in\r
 * end-to-end test against the currently configured Entrust connection.\r
 */\r
(function(outputs, steps, params, stepResult, assertEqual) {\r
    gs.info("[ATF TEST] Starting Agent - Start Verification Server Tests...");\r
\r
    function check(name, actual, expected) {\r
        assertEqual({\r
            name: name,\r
            value: actual,\r
            shouldbe: expected\r
        });\r
    }\r
\r
    var verificationSvc = require("./src/server/services/verification-service.ts");\r
    var reqRepo = require("./src/server/repositories/verification-request-repository.ts");\r
    var MAX_REQUESTS = require("./src/server/constants.ts").MAX_VERIFICATION_REQUESTS;\r
\r
    var CONFIG_TABLE = "x_entru_entrustidv_configuration";\r
    var REQUEST_TABLE = "x_entru_entrustidv_verification_request";\r
\r
    function getConfigRecord() {\r
        var gr = new GlideRecord(CONFIG_TABLE);\r
        gr.query();\r
        if (gr.next()) return gr;\r
        return null;\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 5.1: Invalid Source Record / Unresolved Record\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 5.1] Testing startVerification with non-existent source record...");\r
    try {\r
        verificationSvc.startVerification("incident", "non_existent_sys_id_9999");\r
        check("Should have thrown error for non-existent source record", false, true);\r
    } catch (e) {\r
        check("Expected unresolved source record message", e.message, "Unable to resolve the source record or subject user.");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 5.2: Subject User Missing Email Address Validation\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 5.2] Creating temporary test user without email...");\r
    var userGr = new GlideRecord("sys_user");\r
    userGr.initialize();\r
    userGr.setValue("first_name", "ATF_NoEmail");\r
    userGr.setValue("last_name", "TestUser");\r
    userGr.setValue("user_name", "atf_no_email_user_" + gs.generateGUID());\r
    userGr.setValue("email", ""); // Missing email\r
    var noEmailUserSysId = userGr.insert();\r
\r
    var incGr = new GlideRecord("incident");\r
    incGr.initialize();\r
    incGr.setValue("caller_id", noEmailUserSysId);\r
    incGr.setValue("short_description", "ATF Test Incident - Missing Email");\r
    var incSysId1 = incGr.insert();\r
\r
    try {\r
        verificationSvc.startVerification("incident", incSysId1);\r
        check("Should have thrown error for missing user email", false, true);\r
    } catch (e) {\r
        check("Expected missing user email error message", e.message, "The subject user must have an email address.");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 5.3: Subject User Missing Name Validation\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 5.3] Creating temporary test user without names...");\r
    var userGr2 = new GlideRecord("sys_user");\r
    userGr2.initialize();\r
    userGr2.setValue("first_name", ""); // Missing first name\r
    userGr2.setValue("last_name", "");\r
    userGr2.setValue("user_name", "atf_no_name_user_" + gs.generateGUID());\r
    userGr2.setValue("email", "atf_test@example.com");\r
    var noNameUserSysId = userGr2.insert();\r
\r
    var incGr2 = new GlideRecord("incident");\r
    incGr2.initialize();\r
    incGr2.setValue("caller_id", noNameUserSysId);\r
    incGr2.setValue("short_description", "ATF Test Incident - Missing Name");\r
    var incSysId2 = incGr2.insert();\r
\r
    try {\r
        verificationSvc.startVerification("incident", incSysId2);\r
        check("Should have thrown error for missing user names", false, true);\r
    } catch (e) {\r
        check("Expected missing name error message", e.message, "The subject user must have a first name and last name.");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Valid test user/incident reused by the remaining test cases\r
    // -------------------------------------------------------------------------\r
    var userGr3 = new GlideRecord("sys_user");\r
    userGr3.initialize();\r
    userGr3.setValue("first_name", "ATF_Valid");\r
    userGr3.setValue("last_name", "TestUser");\r
    userGr3.setValue("user_name", "atf_valid_user_" + gs.generateGUID());\r
    userGr3.setValue("email", "atf_valid_test@example.com");\r
    var validUserSysId = userGr3.insert();\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 5.4: Maximum Verification Requests Limit Bound - Server Test\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 5.4] Testing max verification requests limit (" + MAX_REQUESTS + ")...");\r
    var incGrMax = new GlideRecord("incident");\r
    incGrMax.initialize();\r
    incGrMax.setValue("caller_id", validUserSysId);\r
    incGrMax.setValue("short_description", "ATF Test Incident - Max Limit");\r
    var incSysIdMax = incGrMax.insert();\r
\r
    // Create MAX_REQUESTS existing mock requests for this incident\r
    for (var i = 0; i < MAX_REQUESTS; i++) {\r
        var reqGr = new GlideRecord(REQUEST_TABLE);\r
        reqGr.initialize();\r
        reqGr.setValue("source_table", "incident");\r
        reqGr.setValue("source_record", incSysIdMax);\r
        reqGr.setValue("subject_user", validUserSysId);\r
        reqGr.setValue("applicant_id", "app_max_limit_test");\r
        reqGr.setValue("workflow_run_id", "wfr_max_limit_" + i);\r
        reqGr.setValue("status", "Declined");\r
        reqGr.setValue("active", false);\r
        reqGr.setValue("expires_at", new GlideDateTime().getValue());\r
        reqGr.insert();\r
    }\r
\r
    // Attempting one more request beyond the limit should trigger the limit error\r
    try {\r
        verificationSvc.startVerification("incident", incSysIdMax);\r
        check("Should have thrown error when max request limit reached", false, true);\r
    } catch (e) {\r
        check("Expected max verification requests limit error message", e.message, "Maximum number of identity verification requests (" + MAX_REQUESTS + ") has been reached for this record.");\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 5.5: Incomplete IDV Configuration (missing Workflow ID)\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 5.5] Testing incomplete IDV configuration (missing workflow ID)...");\r
    var incGrNoConfig = new GlideRecord("incident");\r
    incGrNoConfig.initialize();\r
    incGrNoConfig.setValue("caller_id", validUserSysId);\r
    incGrNoConfig.setValue("short_description", "ATF Test Incident - No Config");\r
    var incSysIdNoConfig = incGrNoConfig.insert();\r
\r
    var configGr = getConfigRecord();\r
    var originalWorkflowId = configGr ? configGr.getValue("workflow_id") : null;\r
\r
    if (configGr) {\r
        configGr.setValue("workflow_id", "");\r
        configGr.update();\r
    }\r
\r
    try {\r
        verificationSvc.startVerification("incident", incSysIdNoConfig);\r
        check("Should have thrown error when configuration is incomplete", false, true);\r
    } catch (e) {\r
        check("Expected configuration incomplete message", e.message, "Verification configuration is not complete. Please contact your administrator.");\r
    } finally {\r
        if (configGr) {\r
            configGr.setValue("workflow_id", originalWorkflowId);\r
            configGr.update();\r
        }\r
    }\r
\r
    // -------------------------------------------------------------------------\r
    // Test Case 5.6: Entrust API Connection Not Configured (missing region)\r
    // -------------------------------------------------------------------------\r
    gs.info("[ATF TEST 5.6] Testing Entrust API connection not configured (missing region)...");\r
    var incGrNoConn = new GlideRecord("incident");\r
    incGrNoConn.initialize();\r
    incGrNoConn.setValue("caller_id", validUserSysId);\r
    incGrNoConn.setValue("short_description", "ATF Test Incident - No Connection");\r
    var incSysIdNoConn = incGrNoConn.insert();\r
\r
    var configGr2 = getConfigRecord();\r
    var originalRegion = configGr2 ? configGr2.getValue("region") : null;\r
\r
    if (configGr2) {\r
        configGr2.setValue("region", "");\r
        configGr2.update();\r
    }\r
\r
    try {\r
        verificationSvc.startVerification("incident", incSysIdNoConn);\r
        check("Should have thrown error when Entrust connection is not configured", false, true);\r
    } catch (e) {\r
        check("Expected connection not configured message", e.message, "Entrust API connection is not configured.");\r
    } finally {\r
        if (configGr2) {\r
            configGr2.setValue("region", originalRegion);\r
            configGr2.update();\r
        }\r
    }\r
\r
    stepResult.setOutputMessage("Agent - Start Verification Server Tests completed successfully.");\r
    return true;\r
})(outputs, steps, params, stepResult, assertEqual);\r`,
        variable: '989d9e235324220002c6435723dc3484',
    },
})
Record({
    $id: Now.ID['a3bf18bffdcf4e598084d407472accd4'],
    table: 'sys_variable_value',
    data: {
        document: 'sys_atf_step',
        document_key: 'f650a102471b071016bda144846d43a1',
        order: 100,
        value: '3.1',
        variable: '42f2564b73031300440211d8faf6a777',
    },
})
