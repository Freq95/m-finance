/**
 * Settings data export/import (backup download and restore from file).
 */

import type { Profile } from "@/lib/types";
import { exportData, saveRecords } from "@/lib/storage/storage";
import { validateSchema } from "@/lib/storage/migrations";

const BACKUP_FILENAME_PREFIX = "finance-dashboard-backup";

export type ExportFormat = "full" | "data_only";

export type FullBackupPayload = {
  version: number;
  data: import("@/lib/types").MonthRecord[];
  profiles?: Profile[];
};

/**
 * Export all data and trigger a JSON file download.
 * @param format - "full" (records + version + profiles) or "data_only" (records + version only)
 * @param profiles - When format is "full", include these in the backup (e.g. from store).
 * @throws on storage or download failure
 */
export async function exportBackup(
  format: ExportFormat = "full",
  profiles?: Profile[]
): Promise<void> {
  const data = await exportData();
  const payload: FullBackupPayload =
    format === "data_only"
      ? { version: data.version, data: data.data }
      : { ...data, profiles };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = format === "data_only" ? "-data" : "";
  a.download = `${BACKUP_FILENAME_PREFIX}${suffix}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read file, validate schema, save records. Caller should then setProfiles(profiles) if returned, and loadRecords().
 * @returns Backup payload with optional profiles so caller can restore them into the store.
 * @throws on read, parse, validation or save failure
 */
export async function importBackup(file: File): Promise<FullBackupPayload> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const schema = validateSchema(parsed);
  await saveRecords(schema.data);
  const full = parsed as FullBackupPayload;
  return {
    version: schema.version,
    data: schema.data,
    profiles: Array.isArray(full.profiles) ? full.profiles : undefined,
  };
}
