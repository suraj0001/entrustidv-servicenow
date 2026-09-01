import { StringColumn, Table } from "@servicenow/sdk/core";

export const sn_hr_core_case = Table({
  augments: "sn_hr_core_case",

  schema: {
    x_entru_entrustidv_verification_status: StringColumn({
      label: 'IDV Status',
      mandatory: false,
      maxLength: 100,
      readOnly: true,
      readOnlyOption: 'display_read_only',
    }),
  },
});
