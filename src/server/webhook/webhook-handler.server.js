/* eslint-disable */

(function process(request, response) {
  try {
      var signature = request.getHeader('X-SHA2-Signature');
      var rawBody = request.body.dataString;

      if (!signature) {
          gs.warn('[EntrustWebhook] Missing X-SHA2-Signature');

          response.setStatus(401);
          response.setBody({
              success: false,
              message: 'Missing webhook signature'
          });
          return;
      }

      if (!rawBody) {
          gs.warn('[EntrustWebhook] Empty webhook body');

          response.setStatus(400);
          response.setBody({
              success: false,
              message: 'Empty request body'
          });
          return;
      }

      var webhookValidator = require(
          './webhook-signature-validator.ts'
      );

      var isValid = webhookValidator.validate(rawBody, signature);

      if (!isValid) {
          gs.warn('[EntrustWebhook] Invalid webhook signature');

          response.setStatus(401);
          response.setBody({
              success: false,
              message: 'Invalid webhook signature'
          });
          return;
      }

      var event;

      try {
          event = JSON.parse(rawBody);
      } catch (e) {
          gs.warn('[EntrustWebhook] Invalid JSON payload');

          response.setStatus(400);
          response.setBody({
              success: false,
              message: 'Invalid JSON payload'
          });
          return;
      }

      var webhookService = require(
          '../services/webhook-service.ts'
      );

      webhookService.processWebhook(event);

      response.setStatus(200);
      response.setBody({
          success: true
      });
  } catch (e) {
      gs.error(
          '[EntrustWebhook] Unexpected webhook processing error: ' +
              e
      );

      response.setStatus(500);
      response.setBody({
          success: false,
          message: 'Webhook processing failed'
      });
  }
})(request, response);