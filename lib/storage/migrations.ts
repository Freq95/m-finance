/**
 * Data Migration Utilities
 * Handle schema versioning and data migrations
 */

import type { StorageSchema, MonthRecord } from "../types";
import { StorageSchema as StorageSchemaZod } from "../validation/schemas";
import { logError } from "../utils/errors";

const CURRENT_VERSION = 3;

function normalizeUpdatedAt(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return new Date().toISOString();
}

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

      // Version 3 (current) — validate only
      if (versioned.version === 3) {
        return migrateV3ToV3(versioned);
      }

      // Version 2 (people: { me, wife }) -> v3 (people: Record<ProfileId, CategoryAmounts>)
      if (versioned.version === 2) {
        return migrateV2ToV3(versioned);
      }

      // Version 1 (economii_investitii) -> v2 -> v3
      if (versioned.version === 1) {
        return migrateV2ToV3(migrateV1ToV2(versioned));
      }

      // Legacy format (no version) - treat as v0, then v1->v2->v3
      if (!versioned.version) {
        return migrateV2ToV3(migrateV1ToV2(migrateV0ToV1(versioned)));
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
/** Returns v1-shaped schema (version: 1) for feeding into migrateV1ToV2 */
function migrateV0ToV1(data: { [key: string]: unknown }): { version: number; data: unknown[] } {
  if (Array.isArray(data.data)) {
    return { version: 1, data: data.data };
  }
  if (Array.isArray(data)) {
    return { version: 1, data: data as unknown[] };
  }
  return { version: 1, data: [] };
}

/**
 * Migrate from v1 (economii_investitii) to v2 (economii + investitii)
 */
function migrateV1ToV2(data: { version?: number; data?: unknown }): StorageSchema {
  if (!Array.isArray(data.data)) {
    return { version: CURRENT_VERSION, data: [] };
  }
  const validRecords: MonthRecord[] = [];
  for (const record of data.data as unknown[]) {
    const r = record as {
      month: string;
      people: { me: Record<string, unknown>; wife: Record<string, unknown> };
      meta: { updatedAt: string; isSaved: boolean };
    };
    if (!r?.people?.me || !r?.people?.wife) continue;
    const oldVal = (key: string) => (person: Record<string, unknown>) =>
      (typeof (person[key] as number) === "number" ? (person[key] as number) : 0) as number;
    const migratePerson = (p: Record<string, unknown>) => {
      const old = oldVal("economii_investitii")(p);
      const { economii_investitii: _removed, ...rest } = p as Record<string, unknown> & { economii_investitii?: number };
      return {
        ...rest,
        economii: (rest.economii as number) ?? old,
        investitii: (rest.investitii as number) ?? 0,
      };
    };
    const me = migratePerson(r.people.me) as import("../types").CategoryAmounts;
    const wife = migratePerson(r.people.wife) as import("../types").CategoryAmounts;
    const result = StorageSchemaZod.shape.data.element.safeParse({
      month: r.month,
      people: { me, wife },
      meta: {
        updatedAt: normalizeUpdatedAt(r.meta?.updatedAt),
        isSaved: Boolean(r.meta?.isSaved),
      },
    });
    if (result.success) validRecords.push(result.data);
    else logError(`Invalid record after migration: ${r.month}`, "migrateV1ToV2");
  }
  return { version: 2, data: validRecords };
}

/**
 * Migrate from v2 (people: { me, wife }) to v3 (people: Record<ProfileId, CategoryAmounts>)
 */
function migrateV2ToV3(data: { version?: number; data?: unknown }): StorageSchema {
  if (!Array.isArray(data.data)) {
    return { version: CURRENT_VERSION, data: [] };
  }
  const validRecords: MonthRecord[] = [];
  for (const record of data.data as unknown[]) {
    const r = record as {
      month: string;
      people: { me?: Record<string, unknown>; wife?: Record<string, unknown> };
      meta: { updatedAt: string; isSaved: boolean };
    };
    if (!r?.people) continue;
    const peopleRecord: Record<string, import("../types").CategoryAmounts> = {};
    if (r.people.me) peopleRecord["me"] = r.people.me as import("../types").CategoryAmounts;
    if (r.people.wife) peopleRecord["wife"] = r.people.wife as import("../types").CategoryAmounts;
    const result = StorageSchemaZod.shape.data.element.safeParse({
      month: r.month,
      people: peopleRecord,
      meta: {
        updatedAt: normalizeUpdatedAt(r.meta?.updatedAt),
        isSaved: Boolean(r.meta?.isSaved),
      },
    });
    if (result.success) validRecords.push(result.data);
    else logError(`Invalid record after v2→v3 migration: ${r.month}`, "migrateV2ToV3");
  }
  return { version: CURRENT_VERSION, data: validRecords };
}

/**
 * Validate v3 schema (cleanup)
 */
function migrateV3ToV3(data: { version?: number; data?: unknown }): StorageSchema {
  if (Array.isArray(data.data)) {
    const validRecords: MonthRecord[] = [];
    for (const record of data.data) {
      const raw = record as {
        meta?: { updatedAt?: unknown; isSaved?: unknown };
      };
      const normalized = {
        ...record,
        meta: {
          updatedAt: normalizeUpdatedAt(raw.meta?.updatedAt),
          isSaved: Boolean(raw.meta?.isSaved),
        },
      };
      const result = StorageSchemaZod.shape.data.element.safeParse(normalized);
      if (result.success) {
        validRecords.push(result.data);
      } else {
        logError(`Invalid record skipped: ${JSON.stringify(record)}`, "migrateV3ToV3");
      }
    }
    return {
      version: CURRENT_VERSION,
      data: validRecords,
    };
  }
  return { version: CURRENT_VERSION, data: [] };
}

/**
 * Validate schema and return cleaned data
 */
export function validateSchema(data: unknown): StorageSchema {
  const result = StorageSchemaZod.safeParse(data);
  if (result.success) {
    if (result.data.version === CURRENT_VERSION) {
      return result.data;
    }
    return migrateData(result.data);
  }

  // Try to migrate
  return migrateData(data);
}
