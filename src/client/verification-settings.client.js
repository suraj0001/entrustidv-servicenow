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
  ["workflow_id", "link_expiry", "delivery_channel", "redirect_url"].forEach(
    clearFieldError,
  );
}

function focusFirstInvalidField() {
  var field = document.querySelector('[aria-invalid="true"]');

  if (field) field.focus();
}

function showServerValidationError(message) {
  var fieldId = null;

  if (
    message === "Workflow ID is required." ||
    message === "Workflow ID must be 100 characters or fewer."
  )
    fieldId = "workflow_id";
  else if (
    message === "Link expiry is required." ||
    message === "Decimal values are not allowed for link expiry in minutes." ||
    message === "Link expiry must be at least 15 minutes." ||
    message === "Link expiry cannot exceed 2880 minutes." ||
    message === "Decimal values are not allowed for link expiry in hours." ||
    message ===
      "When Hours is selected, the minimum link expiry is 1 hour. For a shorter duration, select Minutes." ||
    message === "Link expiry cannot exceed 48 hours." ||
    message === "Link expiry unit is required." ||
    message === "Link expiry unit must be minutes or hours."
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

  _el("link_expiry_unit").addEventListener("change", function () {
    setLinkExpiryInputConstraints(this.value);
    clearFieldError("link_expiry");
    clearMessages();
  });

  ajax("getConfig", {}, function (result) {
    if (!result || !result.success || !result.settings) {
      return;
    }

    var s = result.settings;
    var linkExpiryUnit = s.linkExpiryUnit === "hours" ? "hours" : "minutes";

    if (s.workflowId) _el("workflow_id").value = s.workflowId;
    _el("link_expiry_unit").value = linkExpiryUnit;
    setLinkExpiryInputConstraints(linkExpiryUnit);
    if (s.linkExpiry) _el("link_expiry").value = s.linkExpiry;
    if (s.redirectUrl) _el("redirect_url").value = s.redirectUrl;
  });
});

// Must match WORKFLOW_ID_MAX_LEN in verification-settings-validator.ts
var WORKFLOW_ID_MAX_LEN = 100;
var LINK_EXPIRY_MINUTES_MIN = 15;
var LINK_EXPIRY_MINUTES_MAX = 2880;
var LINK_EXPIRY_HOURS_MIN = 1;
var LINK_EXPIRY_HOURS_MAX = 48;

function setLinkExpiryInputConstraints(unit) {
  var input = _el("link_expiry");
  var isHours = unit === "hours";

  input.min = isHours
    ? String(LINK_EXPIRY_HOURS_MIN)
    : String(LINK_EXPIRY_MINUTES_MIN);
  input.max = isHours
    ? String(LINK_EXPIRY_HOURS_MAX)
    : String(LINK_EXPIRY_MINUTES_MAX);
  input.step = "1";
}

function validateWorkflowId() {
  var value = _value("workflow_id");

  if (!value) {
    showFieldError("workflow_id", "Workflow ID is required.");
    return false;
  }

  if (value.length > WORKFLOW_ID_MAX_LEN) {
    showFieldError(
      "workflow_id",
      "Workflow ID must be " + WORKFLOW_ID_MAX_LEN + " characters or fewer.",
    );
    return false;
  }

  return true;
}

function validateLinkExpiry() {
  var value = _value("link_expiry");
  var unit = _value("link_expiry_unit");

  if (!value) {
    showFieldError("link_expiry", "Link expiry is required.");
    return false;
  }

  var expiry = Number(value);

  if (unit !== "minutes" && unit !== "hours") {
    showFieldError("link_expiry", "Select minutes or hours for link expiry.");
    return false;
  }

  if (unit === "minutes") {
    if (expiry < LINK_EXPIRY_MINUTES_MIN) {
      showFieldError("link_expiry", "Link expiry must be at least 15 minutes.");
      return false;
    }

    if (expiry > LINK_EXPIRY_MINUTES_MAX) {
      showFieldError("link_expiry", "Link expiry cannot exceed 2880 minutes.");
      return false;
    }

    if (!Number.isInteger(expiry)) {
      showFieldError(
        "link_expiry",
        "Decimal values are not allowed for link expiry in minutes.",
      );
      return false;
    }
  }

  if (unit === "hours") {
    if (expiry < LINK_EXPIRY_HOURS_MIN) {
      showFieldError(
        "link_expiry",
        "When Hours is selected, the minimum link expiry is 1 hour. For a shorter duration, select Minutes.",
      );
      return false;
    }

    if (expiry > LINK_EXPIRY_HOURS_MAX) {
      showFieldError("link_expiry", "Link expiry cannot exceed 48 hours.");
      return false;
    }

    if (!Number.isInteger(expiry)) {
      showFieldError(
        "link_expiry",
        "Decimal values are not allowed for link expiry in hours.",
      );
      return false;
    }
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

  return (
    workflowIdValid &&
    linkExpiryValid &&
    deliveryChannelValid &&
    redirectUrlValid
  );
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
      sysparm_link_expiry_unit: _value("link_expiry_unit"),
      sysparm_delivery_channel: "email",
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

      var message =
        (result && result.message) || "Failed to save verification settings.";
      if (showServerValidationError(message)) {
        focusFirstInvalidField();
        return;
      }

      showError(message);
    },
  );
});
