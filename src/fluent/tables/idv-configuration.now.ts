import "@servicenow/sdk/global";
import { IntegerColumn, Password2Column, StringColumn, Table, UrlColumn } from "@servicenow/sdk/core";

export const x_entru_entrustidv_configuration = Table({
  name: "x_entru_entrustidv_configuration",
  label: "Entrust IDV Configuration",

  schema: {
    region: StringColumn({
      label: "Region",
      mandatory: true,
      maxLength: 10,
    }),

    workflow_id: StringColumn({
      label: "Workflow ID",
      mandatory: true,
      maxLength: 100,
    }),

    link_expiry_minutes: IntegerColumn({
      label: "Smart Link Expiry Minutes",
      mandatory: true,
    }),

    link_delivery_channel: StringColumn({
      label: "Smart Link Delivery Channel",
      mandatory: true,
      maxLength: 10,
    }),

    redirect_url: UrlColumn({
      label: "Redirect URL",
      mandatory: false,
      maxLength: 1000,
    }),

    webhook_signing_secret: Password2Column({
      label: "Webhook Signing Secret",
      mandatory: true,
    }),
  },
  audit: true,
});
