/**
 * Settings data export/import (backup download and restore from file).
 */

import { exportData, saveRecords } from "@/lib/storage/storage";
import { validateSchema } from "@/lib/storage/migrations";

const BACKUP_FILENAME_PREFIX = "finance-dashboard-backup";

/**
 * Export all data and trigger a JSON file download.
 * @throws on storage or download failure
 */
export async function exportBackup(): Promise<void> {
  const data = await exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${BACKUP_FILENAME_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read file, validate schema, and save records. Caller should then loadRecords().
 * @throws on read, parse, validation or save failure
 */
export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const schema = validateSchema(parsed);
  await saveRecords(schema.data);
}
