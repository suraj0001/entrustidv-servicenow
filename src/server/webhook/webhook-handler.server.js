/* eslint-disable */

(function process(
  /* RESTAPIRequest */ request,
  /* RESTAPIResponse */ response
) {
  var rawBody = request.body.dataString;
  var signatureHex = request.getHeader("X-SHA2-Signature");

  if (!signatureHex) {
    gs.warn(
      "[EntrustWebhook] Missing X-SHA2-Signature header"
    );

    response.setStatus(401);
    response.setBody({
      error: "Missing signature",
    });

    return;
  }

  if (!rawBody) {
    gs.warn(
      "[EntrustWebhook] Empty request body"
    );

    response.setStatus(400);
    response.setBody({
      error: "Empty body",
    });

    return;
  }

  try {
    // ---------------------------------------------------------------
    // Load configured webhook secret
    // ---------------------------------------------------------------

    var configurationRepository = require(
      "./src/server/repositories/configuration-settings-repository.ts"
    );

    var webhookSecret =
      configurationRepository.getWebhookSecret();

    if (!webhookSecret) {
      gs.error(
        "[EntrustWebhook] Webhook secret is not configured"
      );

      response.setStatus(500);
      response.setBody({
        error: "Webhook is not configured",
      });

      return;
    }

    // ---------------------------------------------------------------
    // Verify HMAC signature before parsing JSON
    // ---------------------------------------------------------------

    var webhookValidator = require(
      "./src/server/webhook/webhook-validator.ts"
    );

    var validSignature =
      webhookValidator.verifyWebhookSignature(
        rawBody,
        signatureHex,
        webhookSecret
      );

    if (!validSignature) {
      gs.warn(
        "[EntrustWebhook] Invalid webhook signature"
      );

      response.setStatus(401);
      response.setBody({
        error: "Invalid signature",
      });

      return;
    }

    // ---------------------------------------------------------------
    // Parse verified payload
    // ---------------------------------------------------------------

    var body;

    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      gs.warn(
        "[EntrustWebhook] Invalid JSON payload"
      );

      response.setStatus(400);
      response.setBody({
        error: "Invalid JSON",
      });

      return;
    }

    // ---------------------------------------------------------------
    // Only handle supported Entrust events
    // ---------------------------------------------------------------

    var payload = body && body.payload;
    var action = payload && payload.action;

    var supportedActions = {
      "workflow_run.completed": true,
      "workflow_task.completed": true,
      "workflow_task.started": true,
    };

    if (!action || !supportedActions[action]) {
      gs.info(
        "[EntrustWebhook] Ignoring unsupported action=" +
          String(action)
      );

      response.setStatus(200);
      response.setBody({
        received: true,
        processed: false,
      });

      return;
    }

    // ---------------------------------------------------------------
    // Delegate verified event to business logic
    // ---------------------------------------------------------------

    var webhookService = require(
      "./src/server/services/webhook-service.ts"
    );

    var result =
      webhookService.processWebhook(body);

    // ---------------------------------------------------------------
    // Map service result to HTTP response
    // ---------------------------------------------------------------

    if (result.status === "ignored") {
      response.setStatus(200);

      response.setBody({
        received: true,
        processed: false,
      });

      return;
    }

    if (result.status === "not_found") {
      response.setStatus(200);

      response.setBody({
        received: true,
        processed: false,
        reason: "verification_request_not_found",
      });

      return;
    }

    if (result.status === "error") {
      response.setStatus(400);

      response.setBody({
        received: true,
        processed: false,
        error:
          result.message ||
          "Invalid webhook payload",
      });

      return;
    }

    response.setStatus(200);

    response.setBody({
      received: true,
      processed: true,
    });
  } catch (error) {
    gs.error(
      "[EntrustWebhook] Processing failed. message=" +
        (
          error && error.message
            ? error.message
            : String(error)
        ) +
        " | stack=" +
        (
          error && error.stack
            ? error.stack
            : "n/a"
        )
    );

    response.setStatus(500);

    response.setBody({
      error: "Webhook processing failed",
    });
  }
})(request, response);