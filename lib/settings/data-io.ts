/**
 * Settings data export/import (backup download and restore from file).
 */

import type { MonthRecord, Profile } from "@/lib/types";
import { CURRENT_VERSION, saveRecords } from "@/lib/storage/storage";
import { validateSchema } from "@/lib/storage/migrations";
import { useFinanceStore } from "@/lib/store/finance-store";

const BACKUP_FILENAME_PREFIX = "finance-dashboard-backup";

export type ExportFormat = "full" | "data_only";

export type FullBackupPayload = {
  version: number;
  data: import("@/lib/types").MonthRecord[];
  profiles?: Profile[];
};

export type ImportMode = "replace" | "merge";

export type ImportOptions = {
  mode?: ImportMode;
  existingRecords?: MonthRecord[];
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
  const { records, profiles: storeProfiles } = useFinanceStore.getState();
  const payload: FullBackupPayload =
    format === "data_only"
      ? { version: CURRENT_VERSION, data: records }
      : { version: CURRENT_VERSION, data: records, profiles: profiles ?? storeProfiles };
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
function mergeRecordsByUpdatedAt(
  existing: MonthRecord[],
  incoming: MonthRecord[]
): MonthRecord[] {
  const map = new Map(existing.map((r) => [r.month, r]));
  for (const record of incoming) {
    const current = map.get(record.month);
    if (!current) {
      map.set(record.month, record);
      continue;
    }
    const currentUpdated = current.meta?.updatedAt ?? "";
    const incomingUpdated = record.meta?.updatedAt ?? "";
    if (incomingUpdated >= currentUpdated) {
      map.set(record.month, record);
    }
  }
  return Array.from(map.values());
}

async function readBlobAsText(blob: Blob): Promise<string> {
  const maybeText = (blob as unknown as { text?: () => Promise<string> }).text;
  if (typeof maybeText === "function") {
    return await maybeText.call(blob);
  }

  // Fallback for older/incomplete jsdom File implementations.
  if (typeof FileReader !== "undefined") {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsText(blob);
    });
  }

  // Last-resort Node fallback.
  const maybeArrayBuffer = (blob as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
  if (typeof maybeArrayBuffer === "function") {
    const buf = await maybeArrayBuffer.call(blob);
    return Buffer.from(buf).toString("utf8");
  }

  throw new Error("Unable to read backup file as text");
}

export async function importBackup(
  file: File,
  options: ImportOptions = {}
): Promise<FullBackupPayload> {
  const text = await readBlobAsText(file);
  const parsed = JSON.parse(text) as unknown;
  const schema = validateSchema(parsed);
  const mode = options.mode ?? "replace";
  const data =
    mode === "merge" && options.existingRecords
      ? mergeRecordsByUpdatedAt(options.existingRecords, schema.data)
      : schema.data;
  await saveRecords(data);
  const full = parsed as FullBackupPayload;
  return {
    version: schema.version,
    data,
    profiles: Array.isArray(full.profiles) ? full.profiles : undefined,
  };
}
