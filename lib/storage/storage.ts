/**
 * IndexedDB Storage Layer
 * Uses localforage for IndexedDB abstraction with localStorage fallback
 */

import localforage from "localforage";
import type { StorageSchema, MonthRecord } from "../types";
import { StorageSchema as StorageSchemaZod } from "../validation/schemas";
import { StorageError, ValidationError, logError } from "../utils/errors";
import { getBestStorageType } from "../utils/browser";

const STORAGE_KEY = "finance-dashboard-data";
const CURRENT_VERSION = 1;

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
  try {
    const storage = getStorage();
    const data = await storage.getItem<StorageSchema>(STORAGE_KEY);

    if (!data) {
      return [];
    }

    // Validate schema
    const validationResult = StorageSchemaZod.safeParse(data);
    if (!validationResult.success) {
      logError(validationResult.error, "Storage validation failed");
      throw new ValidationError("Invalid data format in storage");
    }

    return validationResult.data.data;
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
  try {
    const storage = getStorage();
    const schema: StorageSchema = {
      version: CURRENT_VERSION,
      data: records,
    };

    // Validate before saving
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
