"use client";

/**
 * Hook that derives all dashboard chart and summary data from the finance store.
 */

import { useEffect, useMemo } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  buildRecordByMonth,
  buildChartData,
  buildCurrentData,
  buildDataForPeriod,
  buildSpendingByCategoryData,
  buildCategoryBarData,
  buildTopSpendingCategoriesData,
  buildPaulVsCodruData,
  getChartDomainMax,
} from "./dashboard-data";
import type { ChartDataPoint, CurrentDataPoint } from "./chart-types";
import type { CategoryAmounts } from "@/lib/types";

export type DashboardData = {
  recordByMonth: Map<string, import("@/lib/types").MonthRecord>;
  chartData: ChartDataPoint[];
  currentData: CurrentDataPoint | null;
  dataForPeriod: CategoryAmounts | null;
  spendingByCategoryData: { name: string; value: number }[];
  topSpendingCategoriesData: { name: string; value: number }[];
  categoryBarData: { name: string; value: number }[];
  paulVsCodruData: import("./dashboard-data").PaulVsCodruRow[];
  last6: import("@/lib/types").MonthRecord[];
  selectedYear: number;
  periodLabel: string;
  domainMax: number;
};

export function useDashboardData(): DashboardData {
  const records = useFinanceStore((s) => s.records);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const includeInvestmentsInNetCashflow = useFinanceStore(
    (s) => s.settings.includeInvestmentsInNetCashflow
  );
  const getLast6Months = useFinanceStore((s) => s.getLast6Months);

  const selectedYear = useMemo(() => {
    const match = selectedMonth.match(/^(\d{4})-/);
    return match ? parseInt(match[1], 10) : new Date().getFullYear();
  }, [selectedMonth]);

  const recordByMonth = useMemo(() => buildRecordByMonth(records), [records]);

  const chartData = useMemo(
    () =>
      buildChartData(
        recordByMonth,
        selectedYear,
        selectedPerson,
        getCombinedData,
        includeInvestmentsInNetCashflow
      ),
    [
      recordByMonth,
      selectedYear,
      selectedPerson,
      getCombinedData,
      includeInvestmentsInNetCashflow,
    ]
  );

  const currentData = useMemo(
    () =>
      buildCurrentData(
        recordByMonth,
        selectedYear,
        selectedPerson,
        getCombinedData,
        includeInvestmentsInNetCashflow
      ),
    [
      recordByMonth,
      selectedYear,
      selectedPerson,
      getCombinedData,
      includeInvestmentsInNetCashflow,
    ]
  );

  const dataForPeriod = useMemo(
    () =>
      buildDataForPeriod(
        recordByMonth,
        selectedYear,
        selectedPerson,
        getCombinedData
      ),
    [recordByMonth, selectedYear, selectedPerson, getCombinedData]
  );

  const spendingByCategoryData = useMemo(
    () => buildSpendingByCategoryData(dataForPeriod),
    [dataForPeriod]
  );

  const topSpendingCategoriesData = useMemo(
    () => buildTopSpendingCategoriesData(spendingByCategoryData),
    [spendingByCategoryData]
  );

  const categoryBarData = useMemo(
    () => buildCategoryBarData(dataForPeriod),
    [dataForPeriod]
  );

  const paulVsCodruData = useMemo(
    () =>
      buildPaulVsCodruData(
        recordByMonth,
        selectedYear,
        includeInvestmentsInNetCashflow
      ),
    [recordByMonth, selectedYear, includeInvestmentsInNetCashflow]
  );

  const last6 = getLast6Months();
  const periodLabel = `An ${selectedYear}`;
  const domainMax = useMemo(() => getChartDomainMax(chartData), [chartData]);

  return {
    recordByMonth,
    chartData,
    currentData,
    dataForPeriod,
    spendingByCategoryData,
    topSpendingCategoriesData,
    categoryBarData,
    paulVsCodruData,
    last6,
    selectedYear,
    periodLabel,
    domainMax,
  };
}

export function useDashboardLoad(): void {
  const loadRecords = useFinanceStore((s) => s.loadRecords);
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);
}
