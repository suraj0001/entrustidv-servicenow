(function executeVerifyIdentity() {
  try {
    var verificationService = require("./src/server/services/verification-service.ts");

    verificationService.startVerification(
      current.getTableName(),
      current.getUniqueValue(),
    );

    gs.addInfoMessage("Identity verification started successfully.");
  } catch (error) {
    gs.error(
      "[IdentityVerification] Failed to start verification. " + String(error),
    );

    gs.addErrorMessage("Unable to start identity verification.");
  }

  action.setRedirectURL(current);
})();
