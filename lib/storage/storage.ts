/**
 * IndexedDB Storage Layer
 * Uses localforage for IndexedDB abstraction with localStorage fallback
 */

import localforage from "localforage";
import type { StorageSchema, MonthRecord } from "../types";
import { StorageSchema as StorageSchemaZod } from "../validation/schemas";
import { migrateData } from "./migrations";
import { StorageError, ValidationError, logError } from "../utils/errors";
import { getBestStorageType } from "../utils/browser";

const STORAGE_KEY = "finance-dashboard-data";
const CURRENT_VERSION = 3;

// Configure localforage
localforage.config({
  name: "finance-dashboard",
  storeName: "finance_data",
  description: "Finance dashboard data storage",
});

/**
 * Initialize storage and return the configured instance
 */
function getStorage() {
  const storageType = getBestStorageType();
  
  if (storageType === "indexeddb") {
    return localforage.createInstance({
      driver: localforage.INDEXEDDB,
    });
  } else if (storageType === "localstorage") {
    return localforage.createInstance({
      driver: localforage.LOCALSTORAGE,
    });
  } else {
    throw new StorageError("No storage mechanism available");
  }
}

/**
 * Load all records from storage
 */
export async function loadRecords(): Promise<MonthRecord[]> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "storage.ts:loadRecords:entry",
      message: "loadRecords (storage) called",
      data: { key: STORAGE_KEY },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H2,H5",
    }),
  }).catch(() => {});
  // #endregion
  try {
    const storage = getStorage();
    const data = await storage.getItem<StorageSchema>(STORAGE_KEY);

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "storage.ts:loadRecords:afterGetItem",
        message: "getItem returned",
        data: {
          hasData: !!data,
          dataLength: data?.data?.length ?? -1,
          returningEmpty: !data,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion

    if (!data) {
      return [];
    }

    // Migrate if older version, then use migrated data
    const migrated = migrateData(data);
    return migrated.data;
  } catch (error) {
    logError(error, "loadRecords");
    if (error instanceof StorageError || error instanceof ValidationError) {
      throw error;
    }
    throw new StorageError("Failed to load records", error);
  }
}

/**
 * Save all records to storage
 */
export async function saveRecords(records: MonthRecord[]): Promise<void> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "storage.ts:saveRecords:entry",
      message: "saveRecords called (e.g. import)",
      data: { recordsLength: records?.length ?? -1, key: STORAGE_KEY },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H2,H5",
    }),
  }).catch(() => {});
  // #endregion
  try {
    const storage = getStorage();
    const schema: StorageSchema = {
      version: CURRENT_VERSION,
      data: records,
    };

    const validationResult = StorageSchemaZod.safeParse(schema);
    if (!validationResult.success) {
      logError(validationResult.error, "Save validation failed");
      throw new ValidationError("Invalid data format");
    }
    await storage.setItem(STORAGE_KEY, schema);
  } catch (error) {
    logError(error, "saveRecords");
    if (error instanceof StorageError || error instanceof ValidationError) {
      throw error;
    }
    throw new StorageError("Failed to save records", error);
  }
}

/**
 * Clear all data from storage
 */
export async function clearStorage(): Promise<void> {
  try {
    const storage = getStorage();
    await storage.removeItem(STORAGE_KEY);
  } catch (error) {
    logError(error, "clearStorage");
    throw new StorageError("Failed to clear storage", error);
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  return getBestStorageType() !== "none";
}

/**
 * Create a Zustand persist-compatible storage backed by localforage (IndexedDB).
 * Use this for the finance store so upcomingPayments, theme, settings, etc. persist across reloads.
 */
export function createPersistStorage(): {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
} {
  try {
    const storage = getStorage();
    return {
      getItem: async (name: string) => {
        const value = await storage.getItem<string>(name);
        return value ?? null;
      },
      setItem: async (name: string, value: string) => {
        await storage.setItem(name, value);
      },
      removeItem: async (name: string) => {
        await storage.removeItem(name);
      },
    };
  } catch {
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
}

/**
 * Export all data as StorageSchema for backup (e.g. JSON download).
 * Loads from storage and returns the full schema.
 */
export async function exportData(): Promise<StorageSchema> {
  const records = await loadRecords();
  return {
    version: CURRENT_VERSION,
    data: records,
  };
}
