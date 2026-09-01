import { GlideRecord } from "@servicenow/glide";

export type SupportedSourceTable = "incident" | "sn_hr_core_case";

export interface SourceRecordContext {
  sourceTable: SupportedSourceTable;
  sourceRecordId: string;
  sourceRecordNumber: string;
  subjectUserId: string;
}

const SUBJECT_USER_FIELD: Record<SupportedSourceTable, string> = {
  incident: "caller_id",
  sn_hr_core_case: "subject_person",
};

export function findSourceRecordContext(sourceTable: string, sourceRecordId: string): SourceRecordContext | null {
  if (!isSupportedSourceTable(sourceTable) || !sourceRecordId) {
    return null;
  }

  const sourceRecord = new GlideRecord(sourceTable);

  sourceRecord.get(sourceRecordId);

  if (!sourceRecord.isValidRecord()) {
    return null;
  }

  const subjectUserId = (sourceRecord.getValue(SUBJECT_USER_FIELD[sourceTable]) as string) || "";

  if (!subjectUserId) {
    return null;
  }

  return {
    sourceTable,
    sourceRecordId,

    sourceRecordNumber: (sourceRecord.getValue("number") as string) || "",

    subjectUserId,
  };
}

function isSupportedSourceTable(sourceTable: string): sourceTable is SupportedSourceTable {
  return sourceTable === "incident" || sourceTable === "sn_hr_core_case";
}

export function addWorkNote(sourceTable: string, sourceRecordId: string, note: string): boolean {
  if (!isSupportedSourceTable(sourceTable) || !sourceRecordId || !note) {
    return false;
  }

  const sourceRecord = new GlideRecord(sourceTable);
  sourceRecord.get(sourceRecordId);

  if (!sourceRecord.isValidRecord()) {
    return false;
  }

  sourceRecord.setValue("work_notes", note);
  sourceRecord.update();
  return true;
}