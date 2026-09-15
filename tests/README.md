# ServiceNow App Store Certification Test Suite & Execution Guide

This repository folder contains the complete, automated test suite required for **ServiceNow App Store Certification** for the **Entrust Identity Verification** scoped application (`x_entru_entrustidv`).

---

## 📁 Complete Test Suite Structure

```
tests/
  ├── README.md                              <-- Execution Guide & Manifest (this file)
  └── atf/
      ├── server/
      │   ├── tc_api_connection_tests.js      <-- Admin - API Connection Tests
      │   ├── tc_verification_settings_tests.js <-- Admin - Verification Settings Tests
      │   ├── tc_verification_workflow_tests.js <-- Verification Workflow & Applicant Reuse Tests
      │   ├── tc_start_verification_tests.js   <-- Agent - Start Verification Server Tests
      │   ├── tc_webhook_signature_tests.js   <-- Webhook Signature Validator Tests
      │   ├── tc_webhook_processor_tests.js   <-- Webhook Processor Tests
      │   ├── tc_status_service_tests.js     <-- Verification Status Mappings Tests
      │   └── tc_security_acls_tests.js       <-- Admin - Security, Roles & ACL Tests
      └── ui/
          └── ui_form_test_cases.md           <-- ATF Form & Custom UI Test Configurations (TC-UI-01, TC-UI-02, TC-UI-03)
```

---

## 📋 Comprehensive Test Coverage Matrix

### 1. Server-Side Automated Script Tests (`tests/atf/server/`)

| Test Script | Logged Output Title | Scope / Scenarios Covered |
| :--- | :--- | :--- |
| `tc_api_connection_tests.js` | **Admin - API Connection Tests** | - Missing parameter validation<br>- Unsupported region rejection (`invalid_region`)<br>- Invalid credential auth failure against Entrust API<br>- `getConfig()` retrieval<br>- `saveConfig()` validation (empty/asymmetric fields, length bounds)<br>- `saveConfig()` success with valid region/credentials (incl. mixed-case region)<br>- `getAliasInfo()` structural lookup |
| `tc_verification_settings_tests.js` | **Admin - Verification Settings Tests** | - Missing Workflow ID error<br>- Workflow ID max length rejection (100 chars)<br>- Positive integer Link Expiry validation<br>- Valid HTTP/HTTPS Redirect URL check (optional field)<br>- Save & retrieve valid verification settings<br>- Webhook Token secret length validation (5-100 chars, used by `setup-information.html`) |
| `tc_verification_workflow_tests.js` | **Verification Workflow & Applicant Reuse Tests** | - Record creation & database query resolution<br>- `findApplicantIdBySubjectUser` applicant ID reuse<br>- Active status resolution<br>- Previous request deactivation (`active=false`) |
| `tc_start_verification_tests.js` | **Agent - Start Verification Server Tests** | - Unresolved source record/user validation<br>- Missing user email validation<br>- Missing user first/last name validation<br>- Max verification requests boundary check (`MAX = 10`) |
| `tc_webhook_signature_tests.js` | **Webhook Signature Validator Tests** | - Null/missing header validation<br>- Non-hex / malformed signature header rejection<br>- HMAC-SHA256 signature calculation & pass verification<br>- Tampered payload detection |
| `tc_webhook_processor_tests.js` | **Webhook Processor Tests** | - Empty/null payload handling<br>- Inactive/stale link event handling (status update ignored, stale work note created)<br>- Active link status updates (`workflow_run.completed`)<br>- Evidence folder URL recording (`workflow_run_evidence_folder.created`) |
| `tc_status_service_tests.js` | **Verification Status Mappings Tests** | - Default `not_started` status when no request exists<br>- Active polling status mappings (`awaiting` $\rightarrow$ `Pending`, `processing` $\rightarrow$ `In Process`, etc. with `shouldPoll: true`)<br>- Terminal status mappings (`approved`, `declined`, `review`, `error`, `abandoned` with `shouldPoll: false`) |
| `tc_security_acls_tests.js` | **Admin - Security, Roles & ACL Tests** | - Application roles verification (`x_entru_entrustidv.admin`, `x_entru_entrustidv.agent`)<br>- Table ACL operation restrictions (manual create, write, delete blocked on verification requests & config)<br>- UI Page ACL rules existence for setup pages |

---

### 2. Client & UI Form Test Cases (`tests/atf/ui/ui_form_test_cases.md`)

| Test ID | Title | Scope / Scenarios Covered |
| :--- | :--- | :--- |
| **TC-UI-01** | **Incident Form - Verify Identity UI Action** | - Open Incident form as agent<br>- Click **Verify Identity** button<br>- Verify work note creation and database record insertion |
| **TC-UI-02** | **HR Case Form - Verify Identity UI Action** | - Open HR Case (`sn_hr_core_case`) form<br>- Trigger verification for Subject Person<br>- Assert request creation |
| **TC-UI-03** | **Admin Setup - UI Page Security Access** | - Impersonate Admin user<br>- Open custom setup UI page<br>- Assert custom UI element visibility (`#btn_test`) |

---

## 🚀 How to Implement & Run Tests in ServiceNow Dev Instance

### Step 1: Open Automated Test Framework (ATF)
1. Log into your ServiceNow Developer Instance as an Administrator.
2. In the Filter Navigator, navigate to **Automated Test Framework > Tests**.

---

### Step 2: Create Server-Side Test Cases

For each component test script in `tests/atf/server/`:

1. Click **New**.
2. Fill in the **Test Name** (matching the Output Title above, e.g. `Admin - API Connection Tests`).
3. Click **Save**.
4. Scroll down to the **Test Steps** related list and click **Add Test Step**.
5. Select Category **Server** $\rightarrow$ Step **Run Server-Side Script** $\rightarrow$ Click **Next**.
6. Copy the corresponding JavaScript code from the file in `tests/atf/server/` and paste it into the **Script** field.
7. Click **Submit**.

---

### Step 3: Create UI Form Test Cases (Optional / Recommended)

Follow the step-by-step instructions in [tests/atf/ui/ui_form_test_cases.md](tests/atf/ui/ui_form_test_cases.md) to create UI tests for Incident and HR Case forms using native ATF Form steps.

---

### Step 4: Create & Run the Full Test Suite

1. In ServiceNow, navigate to **Automated Test Framework > Test Suites**.
2. Click **New** and set the Name to: `Entrust IDV Store Certification Suite`.
3. In the **Tests** related list, click **Edit...** and add all tests created above.
4. Click **Execute Test Suite**.
5. When complete, open the **Test Suite Result** record.

---

## 📑 Store Certification Submission Checklist

When submitting your application version on the **ServiceNow Publisher Portal**:

1. **Test Plan Document**: Upload the Test Plan table listing test objectives and pass criteria.
2. **ATF Execution Report**: Export the **Test Suite Result** page as a PDF (shows all tests passing with zero errors).
3. **Evidence Screenshots**: Include screenshots of:
   - Successful **Test Connection** execution on the API Connection page.
   - Successful **Verification Settings** save.
   - Verification status update work note on an Incident or HR Case form.
