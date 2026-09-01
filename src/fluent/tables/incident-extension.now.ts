import { StringColumn, Table } from "@servicenow/sdk/core";

export const incident = Table({
  augments: 'incident',

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
