import { DocumentIdColumn, ReferenceColumn, StringColumn, Table, TableNameColumn } from "@servicenow/sdk/core";

export const x_entru_entrustidv_verification_request = Table({
  name: "x_entru_entrustidv_verification_request",
  label: "IDV Verification Request",

  schema: {
    source_table: TableNameColumn({
      label: "Source Table",
      mandatory: true,
    }),

    source_record: DocumentIdColumn({
      label: "Source Record",
      dependent: "source_table",
      mandatory: true,
    }),

    subject_user: ReferenceColumn({
      label: "Subject User",
      referenceTable: "sys_user",
      mandatory: true,
      cascadeRule: "none",
    }),

    applicant_id: StringColumn({
      label: "Applicant ID",
      mandatory: true,
      maxLength: 100,
    }),

    workflow_id: StringColumn({
      label: "Workflow ID",
      mandatory: true,
      maxLength: 100,
    }),

    workflow_version_id: StringColumn({
      label: "Workflow Version ID",
      mandatory: true,
      maxLength: 10,
    }),

    workflow_run_id: StringColumn({
      label: "Workflow Run ID",
      mandatory: true,
      maxLength: 100,
      unique: true,
    }),

    status: StringColumn({
      label: "Status",
      mandatory: true,
      maxLength: 50,
    }),
  },

  audit: true,
});
