import { getStackedBarRadius, cellRadius } from "../chart-helpers";
import { STACK_KEYS_MAIN } from "../chart-types";
import type { ChartDataPoint } from "../chart-types";

function makePayload(overrides: Partial<ChartDataPoint> = {}): ChartDataPoint {
  const base: ChartDataPoint = {
    month: "Jan",
    full: "Ian 2026",
    monthStr: "2026-01",
    income: 0,
    expenses: 0,
    economii: 0,
    investitii: 0,
    investments: 0,
    bills: 0,
    restExpenses: 0,
    cashflow: 0,
    total: 0,
    savingsRate: 0,
  };
  return { ...base, ...overrides };
}

describe("getStackedBarRadius", () => {
  const barRadius = 4;

  it("returns [0,0,0,0] when dataKey not in visible segments", () => {
    const payload = makePayload({ income: 100, expenses: 50 });
    expect(
      getStackedBarRadius(STACK_KEYS_MAIN, "economii", payload, barRadius)
    ).toEqual([0, 0, 0, 0]);
  });

  it("returns top and bottom radius for single visible segment", () => {
    const payload = makePayload({ income: 100 });
    expect(
      getStackedBarRadius(STACK_KEYS_MAIN, "income", payload, barRadius)
    ).toEqual([4, 4, 4, 4]);
  });

  it("returns only bottom radius for bottommost segment", () => {
    const payload = makePayload({ income: 100, expenses: 50 });
    expect(
      getStackedBarRadius(STACK_KEYS_MAIN, "income", payload, barRadius)
    ).toEqual([0, 0, 4, 4]);
  });

  it("returns only top radius for topmost segment", () => {
    const payload = makePayload({ income: 100, expenses: 50 });
    expect(
      getStackedBarRadius(STACK_KEYS_MAIN, "expenses", payload, barRadius)
    ).toEqual([4, 4, 0, 0]);
  });

  it("returns no radius for middle segment", () => {
    const payload = makePayload({
      income: 100,
      expenses: 50,
      economii: 25,
    });
    expect(
      getStackedBarRadius(STACK_KEYS_MAIN, "expenses", payload, barRadius)
    ).toEqual([0, 0, 0, 0]);
  });
});

describe("cellRadius", () => {
  it("returns the same tuple", () => {
    const r: [number, number, number, number] = [4, 4, 0, 0];
    expect(cellRadius(r)).toBe(r);
  });
});
