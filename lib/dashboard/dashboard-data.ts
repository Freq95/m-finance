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
  includeInvestmentsInNetCashflow: boolean
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
    return {
      month: formatMonthShort(monthStr).split(" ")[0],
      full: formatMonthShort(monthStr),
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

export type PaulVsCodruRow = {
  metric: string;
  Paul: number;
  Codru: number;
};

export function buildPaulVsCodruData(
  recordByMonth: Map<string, MonthRecord>,
  selectedYear: number,
  includeInvestmentsInNetCashflow: boolean
): PaulVsCodruRow[] {
  const yearMonths = getMonthsForYear(selectedYear);
  const meDatas: CategoryAmounts[] = [];
  const wifeDatas: CategoryAmounts[] = [];
  for (const monthStr of yearMonths) {
    const record = recordByMonth.get(monthStr);
    if (record) {
      meDatas.push(record.people.me);
      wifeDatas.push(record.people.wife);
    }
  }
  if (meDatas.length === 0) return [];
  const meAgg = sumCategoryAmounts(meDatas);
  const wifeAgg = sumCategoryAmounts(wifeDatas);
  return [
    {
      metric: "Venit",
      Paul: calculateIncomeTotal(meAgg),
      Codru: calculateIncomeTotal(wifeAgg),
    },
    {
      metric: "Cheltuieli",
      Paul: calculateExpensesTotal(meAgg),
      Codru: calculateExpensesTotal(wifeAgg),
    },
    {
      metric: "Investiții",
      Paul: calculateInvestmentsTotal(meAgg),
      Codru: calculateInvestmentsTotal(wifeAgg),
    },
    {
      metric: "Cashflow net",
      Paul: calculateNetCashflow(meAgg, includeInvestmentsInNetCashflow),
      Codru: calculateNetCashflow(wifeAgg, includeInvestmentsInNetCashflow),
    },
  ];
}

/** Domain max for Y axis: 15% headroom, capped at 10M to avoid huge scales. */
export function getChartDomainMax(chartData: ChartDataPoint[]): number {
  const chartTotals = chartData
    .map((d) => d.total)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const maxChartValue = Math.max(...chartTotals, 1);
  return Math.min(maxChartValue * 1.15, 10_000_000);
}
