(function executeVerifyIdentity() {
  var verificationService = require("./src/server/services/verification-service.ts");

  try {
    verificationService.startVerification(
      current.getTableName(),
      current.getUniqueValue(),
    );

    gs.addInfoMessage("Identity verification started successfully.");
  } catch (error) {
    gs.error(
      `[IdentityVerification] Failed to start verification. message=${error && error.message ? error.message : String(error)} | stack=${error && error.stack ? error.stack : "n/a"}`,
    );

    gs.addErrorMessage("Unable to start identity verification.");
  }

  action.setRedirectURL(current);
})();
