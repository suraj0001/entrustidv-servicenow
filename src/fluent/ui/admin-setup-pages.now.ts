import "@servicenow/sdk/global";
import { UiPage } from "@servicenow/sdk/core";

UiPage({
  $id: Now.ID["entrust_idv_connection-setup-page"],
  endpoint: "x_entru_entrustidv_entrust_api_connection_setup.do",
  description: "Configure the Entrust Identity Verification API connection.",
  category: "general",
  html: Now.include("../../client/api-connection.html"),
  clientScript: Now.include("../../client/api-connection.client.js"),
  direct: false,
});

UiPage({
  $id: Now.ID["verification-settings-setup-page"],
  endpoint: "x_entru_entrustidv_verification_settings_setup.do",
  description: "Configure the Entrust Identity Verification settings.",
  category: "general",
  html: Now.include("../../client/verification-settings.html"),
  clientScript: Now.include("../../client/verification-settings.client.js"),
  direct: false,
});

UiPage({
  $id: Now.ID["setup-information-page"],
  endpoint: "x_entru_entrustidv_setup_information.do",
  description: "Configure the Entrust Identity Verification API connection.",
  category: "general",
  html: Now.include("../../client/setup-information.html"),
  clientScript: Now.include("../../client/setup-information.client.js"),
  direct: false,
});
