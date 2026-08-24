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

  _el("btn_finish").addEventListener("click", function () {
    finishSetup();
  });
});

function copyWebhookUrl(webhookUrl) {
  navigator.clipboard.writeText(webhookUrl).then(function () {
    var button = _el("btn_copy_webhook_url");

    button.textContent = "Copied";

    setTimeout(function () {
      button.textContent = "Copy";
    }, 1500);
  });
}

function finishSetup() {
  // We can decide the Guided Setup completion behaviour next.
}
