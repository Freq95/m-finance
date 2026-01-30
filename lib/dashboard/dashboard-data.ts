/**
 * Pure functions for dashboard chart and summary data derivation
 */

import type {
  MonthRecord,
  MonthString,
  CategoryAmounts,
  PersonView,
} from "../types";
import {
  calculateIncomeTotal,
  calculateBillsTotal,
  calculateExpensesTotal,
  calculateNetCashflow,
  calculateInvestmentsTotal,
  sumCategoryAmounts,
} from "../calculations/calculations";
import { formatMonthShort, getMonthsForYear } from "../utils/date";
import type { DateLocale } from "../utils/date";
import { CATEGORY_BAR_GROUPS, EXPENSE_PIE_GROUPS } from "../constants";
import type { ChartDataPoint, CurrentDataPoint } from "./chart-types";

export function buildRecordByMonth(
  records: MonthRecord[]
): Map<string, MonthRecord> {
  const map = new Map<string, MonthRecord>();
  for (const r of records) map.set(r.month, r);
  return map;
}

export function getDataForPerson(
  record: MonthRecord,
  selectedPerson: PersonView,
  getCombinedData: (month: MonthString) => CategoryAmounts | null
): CategoryAmounts | null {
  if (selectedPerson === "combined") return getCombinedData(record.month);
  return record.people[selectedPerson] ?? null;
}

export function buildChartData(
  recordByMonth: Map<string, MonthRecord>,
  selectedYear: number,
  selectedPerson: PersonView,
  getCombinedData: (month: MonthString) => CategoryAmounts | null,
  includeInvestmentsInNetCashflow: boolean,
  dateLocale: DateLocale = "ro"
): ChartDataPoint[] {
  const monthList = getMonthsForYear(selectedYear);
  return monthList.map((monthStr) => {
    const record = recordByMonth.get(monthStr);
    const d = record
      ? getDataForPerson(record, selectedPerson, getCombinedData)
      : null;
    const income = d ? calculateIncomeTotal(d) : 0;
    const expenses = d ? calculateExpensesTotal(d) : 0;
    const economii = d ? (d.economii ?? 0) : 0;
    const investitii = d ? (d.investitii ?? 0) : 0;
    const investmentsTotal = economii + investitii;
    const bills = d ? calculateBillsTotal(d) : 0;
    const cashflow = d
      ? calculateNetCashflow(d, includeInvestmentsInNetCashflow)
      : 0;
    const short = formatMonthShort(monthStr, dateLocale);
    return {
      month: short.split(" ")[0],
      full: short,
      monthStr,
      income,
      expenses,
      economii,
      investitii,
      investments: investmentsTotal,
      bills,
      restExpenses: expenses - (d ? calculateBillsTotal(d) : 0),
      cashflow,
      total: income + expenses + economii + investitii,
      savingsRate:
        income > 0 ? Math.round((investmentsTotal / income) * 100) : 0,
    };
  });
}

export function buildCurrentData(
  recordByMonth: Map<string, MonthRecord>,
  selectedYear: number,
  selectedPerson: PersonView,
  getCombinedData: (month: MonthString) => CategoryAmounts | null,
  includeInvestmentsInNetCashflow: boolean
): CurrentDataPoint | null {
  const yearMonths = getMonthsForYear(selectedYear);
  const datas: CategoryAmounts[] = [];
  for (const monthStr of yearMonths) {
    const record = recordByMonth.get(monthStr);
    const d = record
      ? getDataForPerson(record, selectedPerson, getCombinedData)
      : null;
    if (d) datas.push(d);
  }
  if (datas.length === 0) return null;
  const aggregated = sumCategoryAmounts(datas);
  return {
    income: calculateIncomeTotal(aggregated),
    bills: calculateBillsTotal(aggregated),
    expenses: calculateExpensesTotal(aggregated),
    cashflow: calculateNetCashflow(
      aggregated,
      includeInvestmentsInNetCashflow
    ),
  };
}

export function buildDataForPeriod(
  recordByMonth: Map<string, MonthRecord>,
  selectedYear: number,
  selectedPerson: PersonView,
  getCombinedData: (month: MonthString) => CategoryAmounts | null
): CategoryAmounts | null {
  const yearMonths = getMonthsForYear(selectedYear);
  const datas: CategoryAmounts[] = [];
  for (const monthStr of yearMonths) {
    const record = recordByMonth.get(monthStr);
    const d = record
      ? getDataForPerson(record, selectedPerson, getCombinedData)
      : null;
    if (d) datas.push(d);
  }
  return datas.length > 0 ? sumCategoryAmounts(datas) : null;
}

export function buildSpendingByCategoryData(
  dataForPeriod: CategoryAmounts | null
): { name: string; value: number }[] {
  if (!dataForPeriod) return [];
  return EXPENSE_PIE_GROUPS.map((group) => ({
    name: group.label,
    value: group.keys.reduce(
      (sum, key) => sum + ((dataForPeriod[key] as number) ?? 0),
      0
    ),
  }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function buildCategoryBarData(
  dataForPeriod: CategoryAmounts | null
): { name: string; value: number }[] {
  if (!dataForPeriod) return [];
  return CATEGORY_BAR_GROUPS.map((group) => ({
    name: group.label,
    value: group.keys.reduce(
      (sum, key) => sum + ((dataForPeriod[key] as number) ?? 0),
      0
    ),
  })).filter((d) => d.value > 0);
}

export function buildTopSpendingCategoriesData(
  spendingByCategoryData: { name: string; value: number }[]
): { name: string; value: number }[] {
  return spendingByCategoryData.slice(0, 8);
}

export type ProfileComparisonRow = {
  metric: string;
  [profileName: string]: string | number;
};

/**
 * Build comparison table data for multiple profiles (columns = profile names).
 */
export function buildProfileComparisonData(
  recordByMonth: Map<string, MonthRecord>,
  selectedYear: number,
  profileIds: string[],
  profileNames: string[],
  includeInvestmentsInNetCashflow: boolean
): ProfileComparisonRow[] {
  const yearMonths = getMonthsForYear(selectedYear);
  const datasByProfile: CategoryAmounts[][] = profileIds.map(() => []);
  for (const monthStr of yearMonths) {
    const record = recordByMonth.get(monthStr);
    if (record) {
      profileIds.forEach((id, i) => {
        const d = record.people[id];
        if (d) datasByProfile[i].push(d);
      });
    }
  }
  if (datasByProfile.every((arr) => arr.length === 0)) return [];
  const aggByProfile = datasByProfile.map((arr) =>
    arr.length > 0 ? sumCategoryAmounts(arr) : null
  );
  const get = (i: number, fn: (d: CategoryAmounts) => number) =>
    aggByProfile[i] != null ? fn(aggByProfile[i]!) : 0;
  return [
    {
      metric: "Venit",
      ...Object.fromEntries(
        profileNames.map((name, i) => [name, get(i, calculateIncomeTotal)])
      ),
    },
    {
      metric: "Cheltuieli",
      ...Object.fromEntries(
        profileNames.map((name, i) => [name, get(i, calculateExpensesTotal)])
      ),
    },
    {
      metric: "Investiții",
      ...Object.fromEntries(
        profileNames.map((name, i) => [name, get(i, calculateInvestmentsTotal)])
      ),
    },
    {
      metric: "Cashflow net",
      ...Object.fromEntries(
        profileNames.map((name, i) => [
          name,
          aggByProfile[i] != null
            ? calculateNetCashflow(
                aggByProfile[i]!,
                includeInvestmentsInNetCashflow
              )
            : 0,
        ])
      ),
    },
  ];
}

/** @deprecated Use buildProfileComparisonData with profiles from store. */
export function buildPaulVsCodruData(
  recordByMonth: Map<string, MonthRecord>,
  selectedYear: number,
  includeInvestmentsInNetCashflow: boolean
): ProfileComparisonRow[] {
  return buildProfileComparisonData(
    recordByMonth,
    selectedYear,
    ["me", "wife"],
    ["Paul", "Codru"],
    includeInvestmentsInNetCashflow
  );
}

/** Domain max for Y axis: 15% headroom, capped at 10M to avoid huge scales. */
export function getChartDomainMax(chartData: ChartDataPoint[]): number {
  const chartTotals = chartData
    .map((d) => d.total)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const maxChartValue = Math.max(...chartTotals, 1);
  return Math.min(maxChartValue * 1.15, 10_000_000);
}
