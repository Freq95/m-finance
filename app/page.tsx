"use client";

import { useEffect, useMemo } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  calculateIncomeTotal,
  calculateBillsTotal,
  calculateExpensesTotal,
  calculateNetCashflow,
  calculateInvestmentsTotal,
  sumCategoryAmounts,
} from "@/lib/calculations/calculations";
import { formatRON } from "@/lib/utils/currency";
import {
  formatMonthShort,
  getMonthsForYear,
  getPreviousMonth,
  getNextMonth,
  get12MonthsEndingIn,
  monthStringForYear,
  getCurrentMonth,
} from "@/lib/utils/date";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Receipt,
  Wallet,
  PiggyBank,
  MoreVertical,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import { colors } from "@/lib/design-tokens";
import { CATEGORY_BAR_GROUPS, EXPENSE_PIE_GROUPS, PERSON_LABELS } from "@/lib/constants";
import type { CategoryAmounts } from "@/lib/types";

const metricCards = [
  {
    key: "income",
    label: "Venit total",
    icon: TrendingUp,
    color: "text-accentPositive",
    getValue: (d: { income: number }) => d.income,
  },
  {
    key: "bills",
    label: "Total facturi",
    icon: Receipt,
    color: "text-textPrimary",
    getValue: (d: { bills: number }) => d.bills,
  },
  {
    key: "expenses",
    label: "Cheltuieli totale",
    icon: Wallet,
    color: "text-textPrimary",
    getValue: (d: { expenses: number }) => d.expenses,
  },
  {
    key: "cashflow",
    label: "Cashflow net",
    icon: PiggyBank,
    color: (d: { cashflow: number }) =>
      d.cashflow >= 0 ? "text-accentPositive" : "text-accentNegative",
    getValue: (d: { cashflow: number }) => d.cashflow,
  },
];

function getDataForPerson(
  record: { month: string; people: { me: import("@/lib/types").CategoryAmounts; wife: import("@/lib/types").CategoryAmounts } },
  selectedPerson: import("@/lib/types").PersonView,
  getCombinedData: (month: string) => import("@/lib/types").CategoryAmounts | null
): import("@/lib/types").CategoryAmounts | null {
  if (selectedPerson === "combined") return getCombinedData(record.month);
  return record.people[selectedPerson] ?? null;
}

export default function Home() {
  const loadRecords = useFinanceStore((s) => s.loadRecords);
  const clearError = useFinanceStore((s) => s.clearError);
  const error = useFinanceStore((s) => s.error);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const setSelectedMonth = useFinanceStore((s) => s.setSelectedMonth);
  const dashboardView = useFinanceStore((s) => s.dashboardView);
  const setDashboardView = useFinanceStore((s) => s.setDashboardView);
  const records = useFinanceStore((s) => s.records);
  const getLast12Months = useFinanceStore((s) => s.getLast12Months);
  const getLast6Months = useFinanceStore((s) => s.getLast6Months);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const includeInv = useFinanceStore((s) => s.settings.includeInvestmentsInNetCashflow);

  const selectedYear = useMemo(() => {
    const match = selectedMonth.match(/^(\d{4})-/);
    return match ? parseInt(match[1], 10) : new Date().getFullYear();
  }, [selectedMonth]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const last12FromData = getLast12Months();
  const last6 = getLast6Months();

  const recordByMonth = useMemo(() => {
    const map = new Map<string, (typeof records)[0]>();
    for (const r of records) map.set(r.month, r);
    return map;
  }, [records]);

  const currentData = useMemo(() => {
    if (dashboardView === "month") {
      const recordForMonth =
        recordByMonth.get(selectedMonth) ?? last12FromData[0];
      if (!recordForMonth) return null;
      const data = getDataForPerson(
        recordForMonth,
        selectedPerson,
        getCombinedData
      );
      if (!data) return null;
      return {
        income: calculateIncomeTotal(data),
        bills: calculateBillsTotal(data),
        expenses: calculateExpensesTotal(data),
        cashflow: calculateNetCashflow(data, includeInv),
      };
    }
    // Annual view: aggregate all months of selected year
    const yearMonths = getMonthsForYear(selectedYear);
    const datas: import("@/lib/types").CategoryAmounts[] = [];
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
      cashflow: calculateNetCashflow(aggregated, includeInv),
    };
  }, [
    dashboardView,
    selectedMonth,
    selectedYear,
    recordByMonth,
    last12FromData,
    selectedPerson,
    getCombinedData,
    includeInv,
  ]);

  const chartData = useMemo(() => {
    const monthList =
      dashboardView === "annual"
        ? getMonthsForYear(selectedYear)
        : get12MonthsEndingIn(selectedMonth);
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
        ? calculateNetCashflow(d, includeInv)
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
  }, [dashboardView, selectedMonth, selectedYear, recordByMonth, selectedPerson, getCombinedData, includeInv]);

  const maxChartValue = Math.max(
    ...chartData.map((d) => d.total),
    1
  );

  const recordForSelectedMonth =
    recordByMonth.get(selectedMonth) ?? last12FromData[0];

  // Data for the current period (single month or full year) for pie & top categories
  const dataForPeriod = useMemo(() => {
    if (dashboardView === "month") {
      return recordForSelectedMonth
        ? getDataForPerson(
            recordForSelectedMonth,
            selectedPerson,
            getCombinedData
          )
        : null;
    }
    const yearMonths = getMonthsForYear(selectedYear);
    const datas: import("@/lib/types").CategoryAmounts[] = [];
    for (const monthStr of yearMonths) {
      const record = recordByMonth.get(monthStr);
      const d = record
        ? getDataForPerson(record, selectedPerson, getCombinedData)
        : null;
      if (d) datas.push(d);
    }
    return datas.length > 0 ? sumCategoryAmounts(datas) : null;
  }, [
    dashboardView,
    selectedYear,
    recordForSelectedMonth,
    recordByMonth,
    selectedPerson,
    getCombinedData,
  ]);

  const spendingByCategoryData = useMemo(() => {
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
  }, [dataForPeriod]);

  const topSpendingCategoriesData = useMemo(
    () => spendingByCategoryData.slice(0, 8),
    [spendingByCategoryData]
  );

  const categoryBarData = useMemo(() => {
    if (!dataForPeriod) return [];
    return CATEGORY_BAR_GROUPS.map((group) => ({
      name: group.label,
      value: group.keys.reduce(
        (sum, key) => sum + ((dataForPeriod[key] as number) ?? 0),
        0
      ),
    })).filter((d) => d.value > 0);
  }, [dataForPeriod]);

  // Paul vs Codru: single month or aggregated year
  const paulVsCodruData = useMemo(() => {
    if (dashboardView === "month") {
      if (!recordForSelectedMonth) return [];
      const meData = recordForSelectedMonth.people.me;
      const wifeData = recordForSelectedMonth.people.wife;
      const meIncome = calculateIncomeTotal(meData);
      const wifeIncome = calculateIncomeTotal(wifeData);
      const meExpenses = calculateExpensesTotal(meData);
      const wifeExpenses = calculateExpensesTotal(wifeData);
      const meInv = calculateInvestmentsTotal(meData);
      const wifeInv = calculateInvestmentsTotal(wifeData);
      const meCf = calculateNetCashflow(meData, includeInv);
      const wifeCf = calculateNetCashflow(wifeData, includeInv);
      return [
        { metric: "Venit", Paul: meIncome, Codru: wifeIncome },
        { metric: "Cheltuieli", Paul: meExpenses, Codru: wifeExpenses },
        { metric: "Investiții", Paul: meInv, Codru: wifeInv },
        { metric: "Cashflow net", Paul: meCf, Codru: wifeCf },
      ];
    }
    const yearMonths = getMonthsForYear(selectedYear);
    const meDatas: import("@/lib/types").CategoryAmounts[] = [];
    const wifeDatas: import("@/lib/types").CategoryAmounts[] = [];
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
      { metric: "Venit", Paul: calculateIncomeTotal(meAgg), Codru: calculateIncomeTotal(wifeAgg) },
      { metric: "Cheltuieli", Paul: calculateExpensesTotal(meAgg), Codru: calculateExpensesTotal(wifeAgg) },
      { metric: "Investiții", Paul: calculateInvestmentsTotal(meAgg), Codru: calculateInvestmentsTotal(wifeAgg) },
      { metric: "Cashflow net", Paul: calculateNetCashflow(meAgg, includeInv), Codru: calculateNetCashflow(wifeAgg, includeInv) },
    ];
  }, [dashboardView, selectedYear, recordForSelectedMonth, recordByMonth, includeInv]);

  const periodLabel =
    dashboardView === "month"
      ? formatMonthShort(selectedMonth)
      : `An ${selectedYear}`;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-black/[0.08]" />
                <div className="h-6 w-6 rounded-lg bg-black/[0.06]" />
              </div>
              <div className="h-4 w-20 rounded bg-black/[0.08] mb-2" />
              <div className="h-7 w-24 rounded bg-black/[0.1]" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] overflow-hidden animate-pulse">
          <div className="px-6 pt-6 pb-1">
            <div className="h-5 w-20 bg-black/[0.08] rounded mb-1" />
            <div className="h-8 w-32 bg-black/[0.1] rounded" />
          </div>
          <div className="px-6 pt-2 pb-6">
            <div className="h-64 w-full rounded-2xl bg-black/[0.04]" />
          </div>
        </div>
        <section>
          <div className="h-6 w-24 bg-black/[0.08] rounded mb-1" />
          <div className="h-4 w-48 bg-black/[0.06] rounded mb-4" />
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.06] last:border-0"
              >
                <div className="h-10 w-10 rounded-xl bg-black/[0.08] shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-28 bg-black/[0.08] rounded" />
                  <div className="h-3 w-20 bg-black/[0.06] rounded" />
                </div>
                <div className="h-4 w-16 bg-black/[0.08] rounded" />
                <div className="h-6 w-14 rounded-xl bg-black/[0.06]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <ErrorBanner
          message={error}
          onRetry={loadRecords}
          onDismiss={clearError}
          retryLabel="Reîncarcă"
        />
      )}
      {/* Period selector: Lună / An + navigate */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-textSecondary">Perioadă</span>
            <div
              role="group"
              aria-label="Vizualizare lună sau an"
              className="inline-flex rounded-xl border border-black/[0.08] bg-black/[0.03] p-1"
            >
              <button
                type="button"
                onClick={() => setDashboardView("month")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  dashboardView === "month"
                    ? "bg-white text-textPrimary shadow-sm border border-black/[0.06]"
                    : "text-textSecondary hover:text-textPrimary"
                )}
              >
                Lună
              </button>
              <button
                type="button"
                onClick={() => setDashboardView("annual")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  dashboardView === "annual"
                    ? "bg-white text-textPrimary shadow-sm border border-black/[0.06]"
                    : "text-textSecondary hover:text-textPrimary"
                )}
              >
                An
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(
                  dashboardView === "month"
                    ? getPreviousMonth(selectedMonth)
                    : monthStringForYear(selectedYear - 1)
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white/80 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-colors"
              aria-label={dashboardView === "month" ? "Luna anterioară" : "Anul anterior"}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[120px] text-center">
              <span className="text-base font-semibold text-textPrimary">
                {dashboardView === "month"
                  ? formatMonthShort(selectedMonth)
                  : selectedYear}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(
                  dashboardView === "month"
                    ? getNextMonth(selectedMonth)
                    : monthStringForYear(selectedYear + 1)
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white/80 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-colors"
              aria-label={dashboardView === "month" ? "Luna următoare" : "Anul următor"}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {(dashboardView === "month" && selectedMonth !== getCurrentMonth()) ||
          (dashboardView === "annual" && selectedYear !== new Date().getFullYear()) ? (
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(
                  dashboardView === "month"
                    ? getCurrentMonth()
                    : monthStringForYear(new Date().getFullYear())
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-black/[0.03] px-3 py-1.5 text-sm text-textSecondary hover:bg-black/[0.06] hover:text-textPrimary transition-colors"
            >
              <Calendar className="h-4 w-4" />
              {dashboardView === "month" ? "Luna curentă" : "Anul curent"}
            </button>
          ) : null}
        </div>
      </div>
      {/* Frosted metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => {
          const val = currentData ? m.getValue(currentData as never) : 0;
          const colorClass =
            typeof m.color === "function"
              ? currentData
                ? (m.color as (d: { cashflow: number }) => string)(
                    currentData as { cashflow: number }
                  )
                : "text-textPrimary"
              : m.color;
          return (
            <div
              key={m.key}
              className="group relative rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] hover:bg-white/80 transition-all duration-300 ease-out"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="rounded-xl bg-black/[0.05] p-2.5">
                    <m.icon className={`h-5 w-5 ${colorClass}`} />
                  </div>
                  <button
                    type="button"
                    className="rounded-xl p-1.5 text-textMuted hover:bg-black/[0.05] hover:text-textPrimary -mr-1 -mt-1 transition-colors duration-200"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-textSecondary mb-1">{m.label}</p>
                <p className={`text-xl font-bold ${colorClass}`}>
                  {formatRON(val)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance + Chart — frosted */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 pt-6 pb-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-textPrimary">
                Cashflow net
              </h2>
              <p className="text-xs text-textSecondary mt-0.5">
                {includeInv
                  ? "Venit − cheltuieli − investiții (după investiții)"
                  : "Venit − cheltuieli (înainte de investiții)"}
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-textPrimary mt-1">
                {currentData
                  ? formatRON(currentData.cashflow)
                  : "0,00 RON"}
              </p>
            </div>
            <p className="text-xs font-medium text-textSecondary uppercase tracking-wide">
              {periodLabel}
            </p>
          </div>
        </div>
        <div className="px-6 pt-2 pb-6">
          {chartData.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${v / 1000}K` : String(v)
                    }
                    domain={[0, Math.max(maxChartValue * 1.15, 1000)]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] min-w-[180px]">
                          <p className="text-xs text-textSecondary mb-2">{d.full}</p>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between gap-4">
                              <span className="text-textSecondary">Venit:</span>
                              <span className="font-semibold text-[#3B82F6]">
                                {formatRON(d.income)}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-textSecondary">Cheltuieli:</span>
                              <span className="font-semibold text-textPrimary">
                                {formatRON(d.expenses)}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-textSecondary">Economii:</span>
                              <span className="font-semibold" style={{ color: colors.accentPositive }}>
                                {formatRON(d.economii ?? 0)}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-textSecondary">Investiții:</span>
                              <span className="font-semibold text-[#EAB308]">
                                {formatRON(d.investitii ?? 0)}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4 pt-1 border-t border-black/[0.06]">
                              <span className="text-textSecondary">Total:</span>
                              <span className="font-semibold text-textPrimary">
                                {formatRON(d.total)}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="income"
                    stackId="a"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                    name="Venit"
                  />
                  <Bar
                    dataKey="expenses"
                    stackId="a"
                    fill={colors.sidebar}
                    radius={[0, 0, 0, 0]}
                    name="Cheltuieli"
                  />
                  <Bar
                    dataKey="economii"
                    stackId="a"
                    fill={colors.accentPositive}
                    radius={[0, 0, 0, 0]}
                    name="Economii"
                  />
                  <Bar
                    dataKey="investitii"
                    stackId="a"
                    fill="#EAB308"
                    radius={[0, 0, 6, 6]}
                    name="Investiții"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-textSecondary text-sm rounded-2xl bg-black/[0.02]">
              Completează date în Monthly Input pentru grafic.
            </div>
          )}
        </div>
      </div>

      {/* Category bar chart: Venit, Rate, Facturi, Altele, Cheltuieli, Economii & Investiții */}
      <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
        <h3 className="text-base font-bold text-textPrimary mb-1">Pe categorii</h3>
        <p className="text-xs text-textSecondary mb-4">{periodLabel} · Venit, Rate, Facturi, Altele, Cheltuieli, Economii & Investiții</p>
        {categoryBarData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip formatter={(v: number) => formatRON(v)} />
                <Bar dataKey="value" fill={colors.accentPrimary} radius={[4, 4, 0, 0]} name="Sumă" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-textSecondary text-sm">Nu există date pentru perioada selectată.</div>
        )}
      </section>

      {/* Extra charts grid — numbered so you can choose which to keep */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Income vs expenses over time (line) */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[1]</span>
            Venit vs cheltuieli
          </h3>
          <p className="text-xs text-textSecondary mb-4">
            {dashboardView === "annual" ? `An ${selectedYear} (ian–dec)` : "Ultimele 12 luni"} · Evoluția veniturilor și a cheltuielilor
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip content={({ active, payload }) => (active && payload?.length ? (
                  <div className="rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-lg text-xs">
                    <p className="text-textSecondary mb-1">{payload[0]?.payload?.full}</p>
                    <p className="text-[#3B82F6]">Venit: {formatRON(payload[0]?.payload?.income ?? 0)}</p>
                    <p className="text-textPrimary">Cheltuieli: {formatRON(payload[0]?.payload?.expenses ?? 0)}</p>
                  </div>
                ) : null)} />
                <Line type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Venit" />
                <Line type="monotone" dataKey="expenses" stroke={colors.sidebar} strokeWidth={2} dot={{ r: 3 }} name="Cheltuieli" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Spending by category (pie) */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[2]</span>
            Cheltuieli pe categorii
          </h3>
          <p className="text-xs text-textSecondary mb-4">{periodLabel}</p>
          {spendingByCategoryData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={72}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {spendingByCategoryData.map((_, i) => (
                      <Cell key={i} fill={["#3B82F6", "#1F2937", "#EAB308", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"][i % 8]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatRON(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-textSecondary text-sm">Nu există cheltuieli pentru luna selectată.</div>
          )}
        </section>

        {/* Chart 3: Savings / investment rate over time */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[3]</span>
            Rata de economii (investiții / venit)
          </h3>
          <p className="text-xs text-textSecondary mb-4">
            {dashboardView === "annual" ? `An ${selectedYear}` : "Ultimele 12 luni"} · Procent din venit alocat investițiilor
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={({ active, payload }) => (active && payload?.[0] ? (
                  <div className="rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-lg text-xs">
                    <p className="text-textSecondary">{payload[0].payload?.full}</p>
                    <p className="font-semibold text-textPrimary">Rata: {payload[0].payload?.savingsRate}%</p>
                  </div>
                ) : null)} />
                <Bar dataKey="savingsRate" fill="#EAB308" radius={[4, 4, 0, 0]} name="Rata %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 4: Paul vs Codru comparison (grouped bar) */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[4]</span>
            Paul vs Codru
          </h3>
          <p className="text-xs text-textSecondary mb-4">{periodLabel}</p>
          {paulVsCodruData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paulVsCodruData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical" barCategoryGap="20%">
                  <XAxis type="number" tick={{ fontSize: 10, fill: colors.textSecondary }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                  <YAxis type="category" dataKey="metric" width={80} tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => formatRON(v)} />
                  <Legend />
                  <Bar dataKey="Paul" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Paul" />
                  <Bar dataKey="Codru" fill="#EAB308" radius={[0, 4, 4, 0]} name="Codru" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-textSecondary text-sm">Nu există date pentru luna selectată.</div>
          )}
        </section>

        {/* Chart 5: Cashflow net over time (line) */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[5]</span>
            Cashflow net în timp
          </h3>
          <p className="text-xs text-textSecondary mb-4">
            {dashboardView === "annual" ? `An ${selectedYear}` : "Ultimele 12 luni"}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip content={({ active, payload }) => (active && payload?.[0] ? (
                  <div className="rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-lg text-xs">
                    <p className="text-textSecondary">{payload[0].payload?.full}</p>
                    <p className={payload[0].payload?.cashflow >= 0 ? "text-accentPositive font-semibold" : "text-accentNegative font-semibold"}>
                      Cashflow: {formatRON(payload[0].payload?.cashflow ?? 0)}
                    </p>
                  </div>
                ) : null)} />
                <Line type="monotone" dataKey="cashflow" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Cashflow net" strokeDasharray={undefined} />
                <ReferenceLine y={0} stroke={colors.textSecondary} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 6: Top spending categories (horizontal bar) */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[6]</span>
            Top categorii de cheltuieli
          </h3>
          <p className="text-xs text-textSecondary mb-4">{periodLabel}</p>
          {topSpendingCategoriesData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSpendingCategoriesData} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: colors.textSecondary }} tickFormatter={(v) => formatRON(v)} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => formatRON(v)} />
                  <Bar dataKey="value" fill={colors.sidebar} radius={[0, 4, 4, 0]} name="Sumă" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-textSecondary text-sm">Nu există cheltuieli pentru luna selectată.</div>
          )}
        </section>

        {/* Chart 7: Bills vs rest of expenses (stacked bar) */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden p-6 lg:col-span-2">
          <h3 className="text-base font-bold text-textPrimary mb-1">
            <span className="text-xs font-normal text-textMuted mr-2">[7]</span>
            Facturi vs restul cheltuielilor
          </h3>
          <p className="text-xs text-textSecondary mb-4">
            {dashboardView === "annual" ? `An ${selectedYear} (ian–dec)` : "Ultimele 12 luni"} · Facturi fixe vs altele
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip content={({ active, payload }) => (active && payload?.length ? (
                  <div className="rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-lg text-xs">
                    <p className="text-textSecondary mb-1">{payload[0]?.payload?.full}</p>
                    <p className="text-[#1F2937]">Facturi: {formatRON(payload[0]?.payload?.bills ?? 0)}</p>
                    <p className="text-textPrimary">Alte cheltuieli: {formatRON(payload[0]?.payload?.restExpenses ?? 0)}</p>
                  </div>
                ) : null)} />
                <Bar dataKey="bills" stackId="b" fill="#1F2937" radius={[6, 6, 0, 0]} name="Facturi" />
                <Bar dataKey="restExpenses" stackId="b" fill="#6B7280" radius={[0, 0, 6, 6]} name="Alte cheltuieli" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* History — frosted card */}
      <section>
        <h2 className="text-lg font-bold text-textPrimary">History</h2>
        <p className="text-sm text-textSecondary mt-0.5">
          Transaction of last 6 months
        </p>
        <div className="mt-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          {last6.length ? (
            <ul className="divide-y divide-black/[0.06]">
              {last6.map((r, idx) => {
                const data = getDataForPerson(r, selectedPerson, getCombinedData);
                const cashflow = data
                  ? calculateNetCashflow(data, includeInv)
                  : 0;
                return (
                  <li
                    key={r.month}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 hover:bg-black/[0.03] transition-colors duration-200",
                      idx === 1 && "bg-black/[0.04]"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.06]">
                      <User className="h-5 w-5 text-textSecondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-textPrimary text-sm">
                        {formatMonthShort(r.month)}
                      </p>
                      <p className="text-xs text-textSecondary">
                        {format(parseISO(r.meta.updatedAt), "hh:mm:ss a", {
                          locale: ro,
                        })}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        cashflow >= 0
                          ? "text-accentPositive"
                          : "text-accentNegative"
                      }`}
                    >
                      {formatRON(cashflow)}
                    </p>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-xl ${
                        r.meta.isSaved
                          ? "bg-savedBg/80 text-savedText"
                          : "bg-draftBg/80 text-draftText"
                      }`}
                    >
                      {r.meta.isSaved ? "Completed" : "Draft"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center text-textSecondary text-sm rounded-2xl bg-black/[0.02]">
              No records. Add data in Monthly Input.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
