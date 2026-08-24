import "@servicenow/sdk/global";
import { Acl } from "@servicenow/sdk/core";
import { adminRole, agentRole } from "./roles.now";

//
// IDV Configuration
//
Acl({
  $id: Now.ID["idv_configuration_read_acl"],
  type: "record",
  table: "x_entru_entrustidv_configuration",
  operation: "read",
  roles: [adminRole],
  description: "Allows IDV administrators to read IDV configuration.",
  active: false,
});

Acl({
  $id: Now.ID["idv_configuration_create_acl"],
  type: "record",
  table: "x_entru_entrustidv_configuration",
  operation: "create",
  roles: [adminRole],
  description: "Allows IDV administrators to create IDV configuration.",
  active: false,
});

Acl({
  $id: Now.ID["idv_configuration_write_acl"],
  type: "record",
  table: "x_entru_entrustidv_configuration",
  operation: "write",
  roles: [adminRole],
  description: "Allows IDV administrators to update IDV configuration.",
  active: false,
});

Acl({
  $id: Now.ID["idv_configuration_delete_acl"],
  type: "record",
  table: "x_entru_entrustidv_configuration",
  operation: "delete",
  script: "answer = false;",
  description: "Prevents application users from deleting IDV configuration.",
  active: false,
});

//
// IDV Verification Request
//
Acl({
  $id: Now.ID["idv_verification_request_read_acl"],
  type: "record",
  table: "x_entru_entrustidv_verification_request",
  operation: "read",
  roles: [adminRole, agentRole],
  description: "Allows IDV administrators and agents to read verification requests.",
  active: false,
});

Acl({
  $id: Now.ID["idv_verification_request_create_acl"],
  type: "record",
  table: "x_entru_entrustidv_verification_request",
  operation: "create",
  script: "answer = false;",
  description: "Prevents application users from manually creating verification requests.",
  active: false,
});

Acl({
  $id: Now.ID["idv_verification_request_write_acl"],
  type: "record",
  table: "x_entru_entrustidv_verification_request",
  operation: "write",
  script: "answer = false;",
  description: "Prevents application users from manually updating verification requests.",
  active: false,
});

Acl({
  $id: Now.ID["idv_verification_request_delete_acl"],
  type: "record",
  table: "x_entru_entrustidv_verification_request",
  operation: "delete",
  script: "answer = false;",
  description: "Prevents application users from deleting verification requests.",
  active: false,
});
