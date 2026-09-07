// @ts-nocheck
/* eslint-disable */

var WEBHOOK_PATH = "/api/x_entru_entrustidv/entrustidv/webhook/events";

function _el(id) {
  return document.getElementById(id);
}

document.addEventListener("DOMContentLoaded", function () {
  var webhookUrl = window.location.origin + WEBHOOK_PATH;

  _el("webhook_url").value = webhookUrl;

  _el("btn_copy_webhook_url").addEventListener("click", function () {
    copyWebhookUrl(webhookUrl);
  });

  _el("btn_save_webhook_token").addEventListener("click", function () {
    saveWebhookToken();
  });

  _el("webhook_token").addEventListener("input", function () {
    clearTokenFieldError();
    clearTokenMessage();
  });

  getWebhookTokenStatus();
});

function getWebhookTokenStatus() {
  var ajax = new GlideAjax("x_entru_entrustidv.VerificationSettingsAjax");
  ajax.addParam("sysparm_name", "getWebhookSecretStatus");
  ajax.getXMLAnswer(function (answer) {
    var result;

    try {
      result = JSON.parse(answer);
    } catch (error) {
      result = null;
    }

    if (result && result.success && result.configured) {
      _el("webhook_token").placeholder = "Configured - enter a new token to replace";
      _el("webhook_token_configured").style.display = "block";
    }
  });
}

var COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
var CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

function copyWebhookUrl(webhookUrl) {
  var copyPromise;

  if (navigator.clipboard) {
    copyPromise = navigator.clipboard.writeText(webhookUrl);
  } else {
    _el("webhook_url").select();
    document.execCommand("copy");
    copyPromise = Promise.resolve();
  }

  copyPromise.then(function () {
    var button = _el("btn_copy_webhook_url");

    button.innerHTML = CHECK_ICON;
    button.title = "Copied";

    setTimeout(function () {
      button.innerHTML = COPY_ICON;
      button.title = "Copy";
    }, 1500);
  });
}

function showTokenMessage(type, message) {
  var box = _el("webhook_token_message");

  box.className = "status-message " + type;
  box.querySelector(".status-icon").textContent = type === "success" ? "\u2713" : "!";
  box.querySelector(".status-text").textContent = message;
  box.style.display = "flex";
}

function clearTokenMessage() {
  var box = _el("webhook_token_message");

  box.style.display = "none";
  box.querySelector(".status-icon").textContent = "";
  box.querySelector(".status-text").textContent = "";
}

function showTokenFieldError(message) {
  var input = _el("webhook_token");
  var error = _el("webhook_token_error");

  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", error.id);
  error.textContent = message;
  error.style.display = "block";
}

function clearTokenFieldError() {
  var input = _el("webhook_token");
  var error = _el("webhook_token_error");

  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  error.textContent = "";
  error.style.display = "none";
}

function showServerTokenValidationError(message) {
  if (
    message === "Webhook token is required." ||
    message === "Webhook token must not exceed 255 characters."
  ) {
    showTokenFieldError(message);
    return true;
  }

  return false;
}

function saveWebhookToken() {
  var token = _el("webhook_token").value.trim();
  var button = _el("btn_save_webhook_token");

  clearTokenFieldError();
  clearTokenMessage();

  if (!token) {
    showTokenFieldError("Webhook token is required.");
    _el("webhook_token").focus();
    return;
  }

  if (token.length > 255) {
    showTokenFieldError("Webhook token must not exceed 255 characters.");
    _el("webhook_token").focus();
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  var ajax = new GlideAjax("x_entru_entrustidv.VerificationSettingsAjax");
  ajax.addParam("sysparm_name", "saveWebhookSecret");
  ajax.addParam("sysparm_webhook_secret", token);
  ajax.getXMLAnswer(function (answer) {
    var result;

    try {
      result = JSON.parse(answer);
    } catch (error) {
      result = null;
    }

    button.disabled = false;
    button.textContent = "Save Webhook Token";

    if (result && result.success) {
      _el("webhook_token").value = "";
      _el("webhook_token").placeholder = "Configured - enter a new token to replace";
      _el("webhook_token_configured").style.display = "block";
      showTokenMessage("success", result.message || "Webhook token saved.");
      return;
    }

    var message = (result && result.message) || "Unable to save webhook token.";
    if (showServerTokenValidationError(message)) {
      _el("webhook_token").focus();
      return;
    }

    showTokenMessage("error", message);
  });
}
