import { migrateData, validateSchema } from "../migrations";
import { createDefaultCategoryAmounts } from "../../validation/schemas";

const validRecordV2 = {
  month: "2024-01" as const,
  people: {
    me: createDefaultCategoryAmounts(),
    wife: createDefaultCategoryAmounts(),
  },
  meta: {
    updatedAt: "2024-01-15T12:00:00.000Z",
    isSaved: true,
  },
};

const validRecordV3 = {
  month: "2024-01" as const,
  people: {
    me: createDefaultCategoryAmounts(),
    wife: createDefaultCategoryAmounts(),
  } as Record<string, ReturnType<typeof createDefaultCategoryAmounts>>,
  meta: {
    updatedAt: "2024-01-15T12:00:00.000Z",
    isSaved: true,
  },
};

describe("migrateData", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("migrates v2 (people me/wife) to v3 (people record)", () => {
    const v2 = { version: 2, data: [validRecordV2] };
    const result = migrateData(v2);
    expect(result.version).toBe(3);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].month).toBe("2024-01");
    expect(result.data[0].people).toHaveProperty("me");
    expect(result.data[0].people).toHaveProperty("wife");
  });

  it("returns valid v3 data as-is", () => {
    const v3 = { version: 3, data: [validRecordV3] };
    const result = migrateData(v3);
    expect(result.version).toBe(3);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].month).toBe("2024-01");
  });

  it("migrates v1 (economii_investitii) to v3 via v2", () => {
    const defaults = createDefaultCategoryAmounts();
    const { economii: _e, investitii: _i, ...rest } = defaults;
    const v1Record = {
      month: "2024-01",
      people: {
        me: { ...rest, economii_investitii: 500 },
        wife: { ...rest, economii_investitii: 200 },
      } as unknown,
      meta: { updatedAt: "2024-01-15T12:00:00.000Z", isSaved: true },
    };
    const v1 = { version: 1, data: [v1Record] };
    const result = migrateData(v1);
    expect(result.version).toBe(3);
    expect(result.data).toHaveLength(1);
    const me = result.data[0].people.me;
    expect(me.economii).toBe(500);
    expect(me.investitii).toBe(0);
  });

  it("migrates v0 (legacy data array) to v3", () => {
    const legacy = { data: [validRecordV2] };
    const result = migrateData(legacy);
    expect(result.version).toBe(3);
    expect(result.data.length).toBeGreaterThanOrEqual(0);
  });

  it("returns empty schema for unknown format", () => {
    const result = migrateData({ foo: "bar" });
    expect(result.version).toBe(3);
    expect(result.data).toEqual([]);
  });

  it("returns empty schema for null", () => {
    const result = migrateData(null);
    expect(result.version).toBe(3);
    expect(result.data).toEqual([]);
  });
});

describe("validateSchema", () => {
  it("migrates v2 then returns v3", () => {
    const v2 = { version: 2, data: [validRecordV2] };
    const result = validateSchema(v2);
    expect(result.version).toBe(3);
    expect(result.data).toHaveLength(1);
  });

  it("returns valid v3 data unchanged", () => {
    const v3 = { version: 3, data: [validRecordV3] };
    const result = validateSchema(v3);
    expect(result.version).toBe(3);
    expect(result.data).toHaveLength(1);
  });

  it("migrates v1 then returns v3", () => {
    const defaults = createDefaultCategoryAmounts();
    const { economii: _e, investitii: _i, ...rest } = defaults;
    const v1Record = {
      month: "2024-01",
      people: {
        me: { ...rest, economii_investitii: 100 },
        wife: { ...rest, economii_investitii: 0 },
      } as unknown,
      meta: { updatedAt: "2024-01-15T12:00:00.000Z", isSaved: true },
    };
    const v1 = { version: 1, data: [v1Record] };
    const result = validateSchema(v1);
    expect(result.version).toBe(3);
    expect(result.data).toHaveLength(1);
  });
});
