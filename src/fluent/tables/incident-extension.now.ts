import { StringColumn, Table } from "@servicenow/sdk/core";

export const incident = Table({
  augments: "incident",

  schema: {
    x_entru_entrustidv_verification_status: StringColumn({
      label: "Identity Verification Status",
      mandatory: false,
      maxLength: 40,
      readOnly: true,
      readOnlyOption: "display_read_only",
    }),
  },
});
