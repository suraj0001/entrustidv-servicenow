import { StringColumn, Table } from "@servicenow/sdk/core";

export const sn_hr_core_case = Table({
  augments: "sn_hr_core_case",

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
