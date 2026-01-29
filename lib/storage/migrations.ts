/**
 * Data Migration Utilities
 * Handle schema versioning and data migrations
 */

import type { StorageSchema, MonthRecord } from "../types";
import { StorageSchema as StorageSchemaZod } from "../validation/schemas";
import { logError } from "../utils/errors";

const CURRENT_VERSION = 1;

/**
 * Migrate data from an older version to the current version
 */
export function migrateData(data: unknown): StorageSchema {
  try {
    // If it's already the current version and valid, return as-is
    if (isValidCurrentSchema(data)) {
      return data as StorageSchema;
    }

    // Handle different versions
    if (typeof data === "object" && data !== null) {
      const versioned = data as { version?: number; [key: string]: unknown };

      // Version 1 (current)
      if (versioned.version === 1) {
        return migrateV1ToV1(versioned);
      }

      // Legacy format (no version) - treat as v0
      if (!versioned.version) {
        return migrateV0ToV1(versioned);
      }
    }

    // If we can't migrate, return empty schema
    logError("Unknown data format, returning empty schema", "migrateData");
    return {
      version: CURRENT_VERSION,
      data: [],
    };
  } catch (error) {
    logError(error, "migrateData");
    return {
      version: CURRENT_VERSION,
      data: [],
    };
  }
}

/**
 * Check if data matches current schema
 */
function isValidCurrentSchema(data: unknown): boolean {
  const result = StorageSchemaZod.safeParse(data);
  return result.success && result.data.version === CURRENT_VERSION;
}

/**
 * Migrate from v0 (legacy) to v1
 */
function migrateV0ToV1(data: { [key: string]: unknown }): StorageSchema {
  // If data has a 'data' array, try to use it
  if (Array.isArray(data.data)) {
    return {
      version: CURRENT_VERSION,
      data: data.data as MonthRecord[],
    };
  }

  // If data is directly an array, wrap it
  if (Array.isArray(data)) {
    return {
      version: CURRENT_VERSION,
      data: data as MonthRecord[],
    };
  }

  // Otherwise, return empty
  return {
    version: CURRENT_VERSION,
    data: [],
  };
}

/**
 * Migrate from v1 to v1 (validation/cleanup)
 */
function migrateV1ToV1(data: { version?: number; data?: unknown }): StorageSchema {
  if (Array.isArray(data.data)) {
    // Validate each record
    const validRecords: MonthRecord[] = [];
    for (const record of data.data) {
      const result = StorageSchemaZod.shape.data.element.safeParse(record);
      if (result.success) {
        validRecords.push(result.data);
      } else {
        logError(`Invalid record skipped: ${JSON.stringify(record)}`, "migrateV1ToV1");
      }
    }
    return {
      version: CURRENT_VERSION,
      data: validRecords,
    };
  }

  return {
    version: CURRENT_VERSION,
    data: [],
  };
}

/**
 * Validate schema and return cleaned data
 */
export function validateSchema(data: unknown): StorageSchema {
  const result = StorageSchemaZod.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Try to migrate
  return migrateData(data);
}
