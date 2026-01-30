import {
  CategoryAmountsSchema,
  MonthRecordSchema,
  StorageSchema,
  createDefaultCategoryAmounts,
} from "../schemas";

describe("createDefaultCategoryAmounts", () => {
  it("returns object with all category keys set to 0", () => {
    const def = createDefaultCategoryAmounts();
    expect(def.venit).toBe(0);
    expect(def.economii).toBe(0);
    expect(def.investitii).toBe(0);
    expect(def.alimente).toBe(0);
  });

  it("matches CategoryAmountsSchema", () => {
    const def = createDefaultCategoryAmounts();
    const result = CategoryAmountsSchema.safeParse(def);
    expect(result.success).toBe(true);
  });

  it("has no extra keys", () => {
    const def = createDefaultCategoryAmounts();
    const keys = Object.keys(def) as (keyof typeof def)[];
    expect(keys).toContain("venit");
    expect(keys).toContain("economii");
    expect(keys).toContain("investitii");
    expect(keys.length).toBeGreaterThanOrEqual(24);
  });
});

describe("CategoryAmountsSchema", () => {
  it("accepts valid category amounts", () => {
    const def = createDefaultCategoryAmounts();
    expect(CategoryAmountsSchema.safeParse(def).success).toBe(true);
  });

  it("rejects negative values", () => {
    const def = createDefaultCategoryAmounts();
    def.venit = -1;
    expect(CategoryAmountsSchema.safeParse(def).success).toBe(false);
  });

  it("accepts zero and positive", () => {
    const def = createDefaultCategoryAmounts();
    def.venit = 100;
    expect(CategoryAmountsSchema.safeParse(def).success).toBe(true);
  });
});

describe("MonthRecordSchema", () => {
  const validRecord = {
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

  it("accepts valid month record", () => {
    expect(MonthRecordSchema.safeParse(validRecord).success).toBe(true);
  });

  it("rejects invalid month format", () => {
    expect(
      MonthRecordSchema.safeParse({ ...validRecord, month: "01-2024" }).success
    ).toBe(false);
    expect(
      MonthRecordSchema.safeParse({ ...validRecord, month: "2024-13" }).success
    ).toBe(false);
  });

  it("rejects invalid meta.updatedAt", () => {
    expect(
      MonthRecordSchema.safeParse({
        ...validRecord,
        meta: { ...validRecord.meta, updatedAt: "not-a-datetime" },
      }).success
    ).toBe(false);
  });
});

describe("StorageSchema", () => {
  it("accepts valid storage with version and data array", () => {
    const valid = {
      version: 2,
      data: [],
    };
    expect(StorageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects wrong version type", () => {
    expect(StorageSchema.safeParse({ version: "2", data: [] }).success).toBe(
      false
    );
  });

  it("rejects when data is not array", () => {
    expect(StorageSchema.safeParse({ version: 2, data: {} }).success).toBe(
      false
    );
  });
});
