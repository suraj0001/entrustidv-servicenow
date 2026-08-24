import "@servicenow/sdk/global";
import { Role } from "@servicenow/sdk/core";

export const adminRole = Role({
  name: "x_entru_entrustidv.admin",
  description: "Allows administrators to configure and manage Entrust Identity Verification.",
  canDelegate: false,
  federatedId: "lYyjwxTImeEx4J+vqg2Q/vZ4rNejM3wRH8n5JrJRccI=",
});

export const agentRole = Role({
  name: "x_entru_entrustidv.agent",
  description: "Allows agents to initiate and view identity verification.",
  canDelegate: false,
  federatedId: "sYRb6aOUambzeE3qOBASZ8E0BRnDDLG6skoJw36EEew=",
});
