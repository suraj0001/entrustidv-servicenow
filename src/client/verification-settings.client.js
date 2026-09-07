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

function showFieldError(fieldId, message) {
  var field = _el(fieldId);
  var error = _el(fieldId + "_error");

  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", error.id);
  error.textContent = message;
  error.style.display = "block";
}

function clearFieldError(fieldId) {
  var field = _el(fieldId);
  var error = _el(fieldId + "_error");

  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  error.textContent = "";
  error.style.display = "none";
}

function clearFieldErrors() {
  ["workflow_id", "link_expiry", "delivery_channel", "redirect_url"].forEach(clearFieldError);
}

function focusFirstInvalidField() {
  var field = document.querySelector('[aria-invalid="true"]');

  if (field) field.focus();
}

function showServerValidationError(message) {
  var fieldId = null;

  if (message === "Workflow ID is required.") fieldId = "workflow_id";
  else if (
    message === "Link expiry is required." ||
    message === "Link expiry must be a positive whole number."
  )
    fieldId = "link_expiry";
  else if (
    message === "Delivery channel is required." ||
    message === "Email is currently the only supported delivery channel."
  )
    fieldId = "delivery_channel";
  else if (message === "Enter a valid redirect URL.") fieldId = "redirect_url";

  if (!fieldId) return false;

  showFieldError(fieldId, message);
  return true;
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

document.addEventListener("DOMContentLoaded", function () {
  ["workflow_id", "link_expiry", "redirect_url"].forEach(function (fieldId) {
    _el(fieldId).addEventListener("input", function () {
      clearFieldError(fieldId);
      clearMessages();
    });
  });

  ajax("getConfig", {}, function (result) {
    if (!result || !result.success || !result.settings) {
      return;
    }

    var s = result.settings;

    if (s.workflowId) _el("workflow_id").value = s.workflowId;
    if (s.linkExpiry) _el("link_expiry").value = s.linkExpiry;
    if (s.redirectUrl) _el("redirect_url").value = s.redirectUrl;
  });
});

function validateWorkflowId() {
  if (!_value("workflow_id")) {
    showFieldError("workflow_id", "Workflow ID is required.");
    return false;
  }

  return true;
}

function validateLinkExpiry() {
  var value = _value("link_expiry");

  if (!value) {
    showFieldError("link_expiry", "Link expiry is required.");
    return false;
  }

  var expiry = Number(value);

  if (!Number.isInteger(expiry) || expiry <= 0) {
    showFieldError("link_expiry", "Link expiry must be a positive whole number.");
    return false;
  }

  return true;
}

function validateDeliveryChannel() {
  if (_value("delivery_channel").toLowerCase() !== "email") {
    showFieldError("delivery_channel", "Delivery channel must be Email.");
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
      showFieldError("redirect_url", "Redirect URL must use http or https.");
      return false;
    }

    return true;
  } catch (e) {
    showFieldError("redirect_url", "Enter a valid redirect URL.");
    return false;
  }
}

function validateForm() {
  var workflowIdValid = validateWorkflowId();
  var linkExpiryValid = validateLinkExpiry();
  var deliveryChannelValid = validateDeliveryChannel();
  var redirectUrlValid = validateRedirectUrl();

  return workflowIdValid && linkExpiryValid && deliveryChannelValid && redirectUrlValid;
}

_el("btn_save").addEventListener("click", function () {
  var button = this;

  clearMessages();
  clearFieldErrors();

  if (!validateForm()) {
    focusFirstInvalidField();
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  ajax(
    "saveConfig",
    {
      sysparm_workflow_id: _value("workflow_id"),
      sysparm_link_expiry: _value("link_expiry"),
      sysparm_delivery_channel: "email",
      sysparm_redirect_url: _value("redirect_url"),
    },
    function (result) {
      button.disabled = false;
      button.textContent = "Save";

      if (result && result.success) {
        showSuccess(result.message || "Verification settings saved successfully.");
        return;
      }

      var message = (result && result.message) || "Failed to save verification settings.";
      if (showServerValidationError(message)) {
        focusFirstInvalidField();
        return;
      }

      showError(message);
    },
  );
});
