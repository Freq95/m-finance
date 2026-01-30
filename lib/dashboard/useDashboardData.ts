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
  buildProfileComparisonData,
  getChartDomainMax,
} from "./dashboard-data";
import type { ChartDataPoint, CurrentDataPoint } from "./chart-types";
import type { CategoryAmounts } from "@/lib/types";
import type { ProfileComparisonRow } from "./dashboard-data";

export type DashboardData = {
  recordByMonth: Map<string, import("@/lib/types").MonthRecord>;
  chartData: ChartDataPoint[];
  currentData: CurrentDataPoint | null;
  dataForPeriod: CategoryAmounts | null;
  spendingByCategoryData: { name: string; value: number }[];
  topSpendingCategoriesData: { name: string; value: number }[];
  categoryBarData: { name: string; value: number }[];
  paulVsCodruData: ProfileComparisonRow[];
  last6: import("@/lib/types").MonthRecord[];
  selectedYear: number;
  periodLabel: string;
  domainMax: number;
};

export function useDashboardData(): DashboardData {
  const records = useFinanceStore((s) => s.records);
  const profiles = useFinanceStore((s) => s.profiles);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const includeInvestmentsInNetCashflow = useFinanceStore(
    (s) => s.settings.includeInvestmentsInNetCashflow
  );
  const dateLocale = useFinanceStore((s) => s.settings.dateLocale);
  const getLast6Months = useFinanceStore((s) => s.getLast6Months);

  // #region agent log
  if (typeof fetch !== "undefined") {
    const recLen = records?.length ?? -1;
    fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "useDashboardData.ts:useDashboardData",
        message: "useDashboardData run",
        data: { recordsLength: recLen, selectedMonth },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H3,H4",
      }),
    }).catch(() => {});
  }
  // #endregion

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
        includeInvestmentsInNetCashflow,
        dateLocale
      ),
    [
      recordByMonth,
      selectedYear,
      selectedPerson,
      getCombinedData,
      includeInvestmentsInNetCashflow,
      dateLocale,
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
      buildProfileComparisonData(
        recordByMonth,
        selectedYear,
        profiles.map((p) => p.id),
        profiles.map((p) => p.name),
        includeInvestmentsInNetCashflow
      ),
    [
      recordByMonth,
      selectedYear,
      profiles,
      includeInvestmentsInNetCashflow,
    ]
  );

  const last6 = getLast6Months();
  const periodLabel = `An ${selectedYear}`;
  const domainMax = useMemo(() => getChartDomainMax(chartData), [chartData]);

  // #region agent log
  if (typeof fetch !== "undefined") {
    fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "useDashboardData.ts:useDashboardData:return",
        message: "useDashboardData derived values",
        data: {
          recordsLength: records?.length ?? -1,
          selectedYear,
          chartDataLength: chartData?.length ?? -1,
          hasCurrentData: !!currentData,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H3,H4",
      }),
    }).catch(() => {});
  }
  // #endregion

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
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "useDashboardData.ts:useDashboardLoad:effect",
        message: "Dashboard loadRecords effect ran",
        data: {},
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
    loadRecords();
  }, [loadRecords]);
}
