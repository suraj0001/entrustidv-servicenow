import { GlideRecord, gs } from '@servicenow/glide';

export type SupportedSourceTable = 'incident' | 'sn_hr_core_case';

export interface SourceRecordContext {
  sourceTable: SupportedSourceTable;
  sourceRecordId: string;
  sourceRecordNumber: string;
  subjectUserId: string;
}

const SUBJECT_USER_FIELD: Record<SupportedSourceTable, string> = {
  incident: 'caller_id',
  sn_hr_core_case: 'subject_person',
};

export function findSourceRecordContext(
  sourceTable: string,
  sourceRecordId: string
): SourceRecordContext | null {
  if (!isSupportedSourceTable(sourceTable) || !sourceRecordId) {
    return null;
  }

  const sourceRecord = new GlideRecord(sourceTable);

  sourceRecord.get(sourceRecordId);

  if (!sourceRecord.isValidRecord()) {
    return null;
  }

  const subjectUserId = (sourceRecord.getValue(SUBJECT_USER_FIELD[sourceTable]) as string) || '';

  if (!subjectUserId) {
    return null;
  }

  return {
    sourceTable,
    sourceRecordId,

    sourceRecordNumber: (sourceRecord.getValue('number') as string) || '',

    subjectUserId,
  };
}

function isSupportedSourceTable(sourceTable: string): sourceTable is SupportedSourceTable {
  return sourceTable === 'incident' || sourceTable === 'sn_hr_core_case';
}

export function addWorkNote(sourceTable: string, sourceRecordId: string, note: string): boolean {
  try {
    if (!isSupportedSourceTable(sourceTable)) {
      gs.error(`[IDV WorkNote] Unsupported source table: ${sourceTable}`);
      return false;
    }
    if (!sourceRecordId) {
      gs.error('[IDV WorkNote] sourceRecordId is empty');
      return false;
    }
    if (!note) {
      gs.error('[IDV WorkNote] note is empty');
      return false;
    }
    const sourceRecord = new GlideRecord(sourceTable);
    sourceRecord.get(sourceRecordId);
    if (!sourceRecord.isValidRecord()) {
      gs.error(
        `[IDV WorkNote] Record not found. ` + `table=${sourceTable}, sys_id=${sourceRecordId}`
      );
      return false;
    }
    if (!sourceRecord.isValidField('work_notes')) {
      gs.error(`[IDV WorkNote] work_notes field does not exist on ${sourceTable}`);
      return false;
    }
    const workNotes = sourceRecord.getElement('work_notes');
    if (!workNotes.canWrite()) {
      gs.warn(`[IDV WorkNote] work_notes is not writable on ${sourceTable}`);
      return false;
    }
    /*
     * Journal fields cannot use setValue().
     * setJournalEntry() is also not allowed in scoped applications.
     *
     * Direct field assignment is the supported approach.
     */
    (sourceRecord as any).work_notes = note;
    const updatedId = sourceRecord.update();
    if (!updatedId) {
      gs.error(
        `[IDV WorkNote] Update returned no sys_id. ` +
          `table=${sourceTable}, sys_id=${sourceRecordId}`
      );
      return false;
    }
    return true;
  } catch (error) {
    gs.error(
      `[IDV WorkNote] Failed to add work note. ` +
        `table=${sourceTable}, sys_id=${sourceRecordId}, ` +
        `error=${error}`
    );
    return false;
  }
}
