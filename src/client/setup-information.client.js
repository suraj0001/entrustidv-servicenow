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
      _el("webhook_token").placeholder =
        "Configured - enter a new token to replace";
      _el("webhook_token_configured").style.display = "block";
    }
  });
}

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

    button.textContent = "Copied";

    setTimeout(function () {
      button.textContent = "Copy";
    }, 1500);
  });
}

function showTokenMessage(type, message) {
  var box = _el("webhook_token_message");

  box.className = "status-message " + type;
  box.querySelector(".status-icon").textContent =
    type === "success" ? "\u2713" : "!";
  box.querySelector(".status-text").textContent = message;
  box.style.display = "flex";
}

function saveWebhookToken() {
  var token = _el("webhook_token").value.trim();
  var button = _el("btn_save_webhook_token");

  if (!token) {
    showTokenMessage("error", "Webhook token is required.");
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
      _el("webhook_token").placeholder =
        "Configured - enter a new token to replace";
      _el("webhook_token_configured").style.display = "block";
      showTokenMessage("success", result.message || "Webhook token saved.");
      return;
    }

    showTokenMessage(
      "error",
      (result && result.message) || "Unable to save webhook token.",
    );
  });
}
