import {
  buildRecordByMonth,
  getDataForPerson,
  buildChartData,
  buildCurrentData,
  buildDataForPeriod,
  buildSpendingByCategoryData,
  buildCategoryBarData,
  buildTopSpendingCategoriesData,
  buildPaulVsCodruData,
  getChartDomainMax,
} from "../dashboard-data";
import { createDefaultCategoryAmounts } from "@/lib/validation/schemas";
import type { MonthRecord, CategoryAmounts } from "@/lib/types";

function makeRecord(
  month: MonthRecord["month"],
  me?: Partial<CategoryAmounts>,
  wife?: Partial<CategoryAmounts>
): MonthRecord {
  const base = createDefaultCategoryAmounts();
  return {
    month,
    people: {
      me: { ...base, ...me },
      wife: { ...base, ...wife },
    },
    meta: { updatedAt: new Date().toISOString(), isSaved: false },
  };
}

describe("buildRecordByMonth", () => {
  it("returns empty map for empty records", () => {
    expect(buildRecordByMonth([]).size).toBe(0);
  });

  it("maps month to record", () => {
    const records = [
      makeRecord("2026-01"),
      makeRecord("2026-02"),
    ];
    const map = buildRecordByMonth(records);
    expect(map.get("2026-01")).toEqual(records[0]);
    expect(map.get("2026-02")).toEqual(records[1]);
  });
});

describe("getDataForPerson", () => {
  const record = makeRecord("2026-01", { venit: 100 }, { venit: 200 });
  const getCombined = (month: string): CategoryAmounts | null =>
    month === "2026-01"
      ? { ...createDefaultCategoryAmounts(), venit: 300 }
      : null;

  it("returns me data when selectedPerson is me", () => {
    const result = getDataForPerson(record, "me", getCombined);
    expect(result?.venit).toBe(100);
  });

  it("returns wife data when selectedPerson is wife", () => {
    const result = getDataForPerson(record, "wife", getCombined);
    expect(result?.venit).toBe(200);
  });

  it("returns getCombinedData(record.month) when selectedPerson is combined", () => {
    const result = getDataForPerson(record, "combined", getCombined);
    expect(result?.venit).toBe(300);
  });
});

describe("buildChartData", () => {
  it("returns 12 points for a year with zeros when no data", () => {
    const map = buildRecordByMonth([]);
    const getCombined = () => null;
    const data = buildChartData(map, 2026, "me", getCombined, true);
    expect(data).toHaveLength(12);
    expect(data[0].monthStr).toBe("2026-01");
    expect(data[0].income).toBe(0);
    expect(data[0].total).toBe(0);
  });

  it("fills income and total for month with data", () => {
    const records = [makeRecord("2026-03", { venit: 5000 }, { venit: 3000 })];
    const map = buildRecordByMonth(records);
    const getCombined = (m: string): CategoryAmounts | null =>
      m === "2026-03"
        ? { ...createDefaultCategoryAmounts(), venit: 8000 }
        : null;
    const data = buildChartData(map, 2026, "combined", getCombined, true);
    const mar = data.find((d) => d.monthStr === "2026-03");
    expect(mar?.income).toBe(8000);
    expect(mar?.total).toBe(8000);
  });
});

describe("buildCurrentData", () => {
  it("returns null when no data for year", () => {
    const map = buildRecordByMonth([]);
    const getCombined = () => null;
    expect(
      buildCurrentData(map, 2026, "me", getCombined, true)
    ).toBeNull();
  });

  it("returns aggregated income, bills, expenses, cashflow when data exists", () => {
    const records = [
      makeRecord("2026-01", { venit: 1000 }),
      makeRecord("2026-02", { venit: 2000 }),
    ];
    const map = buildRecordByMonth(records);
    const getCombined = () => null;
    const result = buildCurrentData(map, 2026, "me", getCombined, true);
    expect(result).not.toBeNull();
    expect(result?.income).toBe(3000);
  });
});

describe("buildDataForPeriod", () => {
  it("returns null when no data", () => {
    const map = buildRecordByMonth([]);
    const getCombined = () => null;
    expect(buildDataForPeriod(map, 2026, "me", getCombined)).toBeNull();
  });

  it("returns summed CategoryAmounts when data exists", () => {
    const records = [
      makeRecord("2026-01", { venit: 100, alimente: 50 }),
      makeRecord("2026-02", { venit: 200, alimente: 80 }),
    ];
    const map = buildRecordByMonth(records);
    const getCombined = () => null;
    const result = buildDataForPeriod(map, 2026, "me", getCombined);
    expect(result?.venit).toBe(300);
    expect(result?.alimente).toBe(130);
  });
});

describe("buildSpendingByCategoryData", () => {
  it("returns empty array when dataForPeriod is null", () => {
    expect(buildSpendingByCategoryData(null)).toEqual([]);
  });

  it("returns name/value pairs filtered and sorted by value desc", () => {
    const period = createDefaultCategoryAmounts();
    period.alimente = 500;
    period.transport = 200;
    const result = buildSpendingByCategoryData(period);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].value).toBeGreaterThanOrEqual(result[1]?.value ?? 0);
    result.forEach((r) => {
      expect(r.name).toBeDefined();
      expect(typeof r.value).toBe("number");
      expect(r.value).toBeGreaterThan(0);
    });
  });
});

describe("buildCategoryBarData", () => {
  it("returns empty array when dataForPeriod is null", () => {
    expect(buildCategoryBarData(null)).toEqual([]);
  });

  it("returns bars with positive value", () => {
    const period = createDefaultCategoryAmounts();
    period.venit = 1000;
    const result = buildCategoryBarData(period);
    expect(result.some((r) => r.name === "Venit" && r.value === 1000)).toBe(
      true
    );
  });
});

describe("buildTopSpendingCategoriesData", () => {
  it("returns at most 8 items", () => {
    const input = Array.from({ length: 12 }, (_, i) => ({
      name: `Cat${i}`,
      value: 100 - i,
    }));
    const result = buildTopSpendingCategoriesData(input);
    expect(result).toHaveLength(8);
  });
});

describe("buildPaulVsCodruData", () => {
  it("returns empty array when no records for year", () => {
    const map = buildRecordByMonth([]);
    expect(buildPaulVsCodruData(map, 2026, true)).toEqual([]);
  });

  it("returns 4 rows with Paul and Codru when data exists", () => {
    const records = [
      makeRecord("2026-01", { venit: 1000 }, { venit: 800 }),
      makeRecord("2026-02", { venit: 1100 }, { venit: 900 }),
    ];
    const map = buildRecordByMonth(records);
    const result = buildPaulVsCodruData(map, 2026, true);
    expect(result).toHaveLength(4);
    expect(result[0].metric).toBe("Venit");
    expect(result[0].Paul).toBe(2100);
    expect(result[0].Codru).toBe(1700);
  });
});

describe("getChartDomainMax", () => {
  it("returns 1.15 for empty or zero totals (max 1, 15% headroom)", () => {
    const data = [{ total: 0 }] as Parameters<typeof getChartDomainMax>[0];
    expect(getChartDomainMax(data)).toBe(1.15);
  });

  it("returns 15% headroom and caps at 10M", () => {
    const data = [{ total: 1000 }, { total: 2000 }] as Parameters<
      typeof getChartDomainMax
    >[0];
    expect(getChartDomainMax(data)).toBe(2000 * 1.15);
    const big = [
      { total: 9_000_000 },
    ] as Parameters<typeof getChartDomainMax>[0];
    expect(getChartDomainMax(big)).toBe(10_000_000);
  });
});
