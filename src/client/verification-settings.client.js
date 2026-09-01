// @ts-nocheck
/* eslint-disable */

function _el(id) {
  return document.getElementById(id);
}

function _value(id) {
  var element = _el(id);
  return element ? String(element.value || "").trim() : "";
}

function clearMessages() {
  var success = _el("idv_success_message");
  var error = _el("idv_error_message");

  if (success) {
    success.textContent = "";
    success.style.display = "none";
  }

  if (error) {
    error.textContent = "";
    error.style.display = "none";
  }
}

function showError(message) {
  var error = _el("idv_error_message");

  if (!error) {
    return;
  }

  error.textContent = message;
  error.style.display = "block";
}

function showSuccess(message) {
  var success = _el("idv_success_message");

  if (!success) {
    return;
  }

  success.textContent = message;
  success.style.display = "block";
}

function ajax(method, params, callback) {
  var ga = new GlideAjax("x_entru_entrustidv.VerificationSettingsAjax");

  ga.addParam("sysparm_name", method);

  Object.keys(params || {}).forEach(function (key) {
    if (params[key] !== undefined) {
      ga.addParam(key, params[key]);
    }
  });

  ga.getXMLAnswer(function (answer) {
    var result = null;

    try {
      result = JSON.parse(answer);
    } catch (e) {
      result = {
        success: false,
        message: "Received an invalid server response.",
      };
    }

    callback(result);
  });
}

function focusField(id) {
  var element = _el(id);

  if (element) {
    element.focus();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  ajax("getConfig", {}, function (result) {
    if (!result || !result.success || !result.settings) {
      return;
    }

    var s = result.settings;

    if (s.workflowId) _el("workflow_id").value = s.workflowId;
    if (s.linkExpiry) _el("link_expiry").value = s.linkExpiry;
    if (s.deliveryChannel) _el("delivery_channel").value = s.deliveryChannel;
    if (s.redirectUrl) _el("redirect_url").value = s.redirectUrl;
  });
});

function validateWorkflowId() {
  if (!_value("workflow_id")) {
    showError("Workflow ID is required.");
    focusField("workflow_id");
    return false;
  }

  return true;
}

function validateLinkExpiry() {
  var value = _value("link_expiry");

  if (!value) {
    showError("Link expiry is required.");
    focusField("link_expiry");
    return false;
  }

  var expiry = Number(value);

  if (!Number.isInteger(expiry) || expiry <= 0) {
    showError("Link expiry must be a positive whole number.");
    focusField("link_expiry");
    return false;
  }

  return true;
}

function validateDeliveryChannel() {
  if (!_value("delivery_channel")) {
    showError("Delivery channel is required.");
    focusField("delivery_channel");
    return false;
  }

  return true;
}

function validateRedirectUrl() {
  var value = _value("redirect_url");

  if (!value) {
    return true;
  }

  try {
    var url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      showError("Redirect URL must use http or https.");
      focusField("redirect_url");
      return false;
    }

    return true;
  } catch (e) {
    showError("Enter a valid redirect URL.");
    focusField("redirect_url");
    return false;
  }
}

function validateForm() {
  return (
    validateWorkflowId() &&
    validateLinkExpiry() &&
    validateDeliveryChannel() &&
    validateRedirectUrl()
  );
}

_el("btn_save").addEventListener("click", function () {
  var button = this;

  clearMessages();

  if (!validateForm()) {
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  ajax(
    "saveConfig",
    {
      sysparm_workflow_id: _value("workflow_id"),
      sysparm_link_expiry: _value("link_expiry"),
      sysparm_delivery_channel: _value("delivery_channel"),
      sysparm_redirect_url: _value("redirect_url"),
    },
    function (result) {
      button.disabled = false;
      button.textContent = "Save";

      if (result && result.success) {
        showSuccess(
          result.message || "Verification settings saved successfully.",
        );
        return;
      }

      showError(
        (result && result.message) || "Failed to save verification settings.",
      );
    },
  );
});
