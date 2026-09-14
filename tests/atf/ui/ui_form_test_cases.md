# ATF Form & UI Test Cases Guide

In addition to backend Server-Side Script Tests, ServiceNow App Store Certification reviewers recommend including **ATF Form & UI Test Steps**. These test end-to-end user interactions directly in the browser (e.g., opening Incident/HR Case forms, clicking the "Verify Identity" UI Action, and validating form messages).

---

## 🎯 UI Test Case 1: Incident Form - Trigger Identity Verification (`TC-UI-01`)

### Objective
Verify that an Incident agent can open an Incident form, click the **Verify Identity** button, trigger a verification request, and observe form messages/updates.

### ATF Test Configuration
1. Navigate to **Automated Test Framework > Tests** $\rightarrow$ Click **New**.
2. **Name**: `TC-UI-01: Incident Form - Verify Identity UI Action`
3. Add the following sequential **Test Steps**:

| Step # | Category | Test Step Type | Step Configuration / Parameters |
| :---: | :--- | :--- | :--- |
| **1** | **User** | Impersonate | **User**: Select an agent user with `x_entru_entrustidv.agent` role (or ITIL user) |
| **2** | **Form** | Open a New Form | **Table**: `Incident` (`incident`) |
| **3** | **Form** | Set Field Values | **Caller**: `Abel Tuter` (or any user with first, last name & email)<br>**Short description**: `ATF E2E Verification Test` |
| **4** | **Form** | Submit Form | Submits the new Incident record. |
| **5** | **Form** | Open an Existing Record | **Table**: `Incident`<br>**Record**: Step 4 $\rightarrow$ Record |
| **6** | **Form** | Click a Form Button | **Button**: `Verify Identity` |
| **7** | **Form** | Field Values Validation | **Table**: `Incident`<br>**Work notes**: Contains `Identity verification request initiated` |
| **8** | **Server** | Record Validation | **Table**: `x_1350849_entrust_idv_verification_request`<br>**Conditions**: `Source Record = Step 4 Record` AND `Active = true` AND `Status = Pending` (or `In Progress`) |

---

## 🎯 UI Test Case 2: HR Case Form - Trigger Identity Verification (`TC-UI-02`)

### Objective
Verify that an HR Case agent can trigger identity verification for a Subject Person from an HR Case form.

### ATF Test Configuration
1. Navigate to **Automated Test Framework > Tests** $\rightarrow$ Click **New**.
2. **Name**: `TC-UI-02: HR Case Form - Verify Identity UI Action`
3. Add the following sequential **Test Steps**:

| Step # | Category | Test Step Type | Step Configuration / Parameters |
| :---: | :--- | :--- | :--- |
| **1** | **User** | Impersonate | **User**: Select an HR agent user with `x_entru_entrustidv.agent` role |
| **2** | **Form** | Open a New Form | **Table**: `HR Service Delivery Case` (`sn_hr_core_case`) |
| **3** | **Form** | Set Field Values | **Subject person**: `Abel Tuter`<br>**Short description**: `ATF HR Case Verification Test` |
| **4** | **Form** | Submit Form | Submits the HR Case record. |
| **5** | **Form** | Open an Existing Record | **Table**: `sn_hr_core_case`<br>**Record**: Step 4 $\rightarrow$ Record |
| **6** | **Form** | Click a Form Button | **Button**: `Verify Identity` |
| **7** | **Server** | Record Validation | **Table**: `x_1350849_entrust_idv_verification_request`<br>**Conditions**: `Source Record = Step 4 Record` AND `Active = true` |

---

## 🎯 UI Test Case 3: Admin Custom UI Page Access (`TC-UI-03`)

### Objective
Verify that an administrator with `x_entru_entrustidv.admin` role can navigate to the API Connection custom UI page.

### ATF Test Configuration
1. Navigate to **Automated Test Framework > Tests** $\rightarrow$ Click **New**.
2. **Name**: `TC-UI-03: Admin Setup - UI Page Security Access`
3. Add the following sequential **Test Steps**:

| Step # | Category | Test Step Type | Step Configuration / Parameters |
| :---: | :--- | :--- | :--- |
| **1** | **User** | Impersonate | **User**: Administrator with `x_entru_entrustidv.admin` role |
| **2** | **Custom UI** | Open Custom UI Page | **Page**: `x_entru_entrustidv_entrust_api_connection_setup.do` |
| **3** | **Custom UI** | Assert Custom UI Element | **Element**: `#btn_test` (Test Connection button exists) |
