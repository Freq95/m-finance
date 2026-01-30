/**
 * Helpers for record list operations (find index, upsert).
 */

import type { MonthRecord, MonthString } from "../types";

export function findRecordIndex(
  records: MonthRecord[],
  month: MonthString
): number {
  return records.findIndex((r) => r.month === month);
}

/**
 * Returns a new records array with the record inserted or replaced by month.
 */
export function upsertRecord(
  records: MonthRecord[],
  record: MonthRecord
): MonthRecord[] {
  const next = [...records];
  const index = findRecordIndex(next, record.month);
  if (index >= 0) {
    next[index] = record;
  } else {
    next.push(record);
  }
  return next;
}
