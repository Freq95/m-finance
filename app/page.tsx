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
import {
  formatCurrency,
  fetchExchangeRates,
  type DisplayCurrency,
} from "@/lib/utils/currency";
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
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Landmark,
  DollarSign,
  Euro,
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
  Rectangle,
} from "recharts";
import { colors, barCornerRadius, chartTooltipWrapperStyle, chartTooltipContentStyle, chartBarCursorStyle } from "@/lib/design-tokens";

/** Rounded bar chart hover cursor (Recharts Tooltip uses Rectangle; radius must be on the element). */
const chartBarCursor = <Rectangle {...chartBarCursorStyle} radius={6} />;
import { CATEGORY_BAR_GROUPS, EXPENSE_PIE_GROUPS, PERSON_LABELS } from "@/lib/constants";
import type { PersonView } from "@/lib/types";
import type { CategoryAmounts } from "@/lib/types";

/** Ordinea segmentelor în stack (de jos în sus). Folosit pentru radius per segment. */
const STACK_KEYS_MAIN: (keyof ChartDataPoint)[] = [
  "income",
  "expenses",
  "economii",
  "investitii",
];
const STACK_KEYS_BILLS: (keyof ChartDataPoint)[] = ["bills", "restExpenses"];

type ChartDataPoint = {
  month: string;
  full: string;
  monthStr: string;
  income: number;
  expenses: number;
  economii: number;
  investitii: number;
  investments: number;
  bills: number;
  restExpenses: number;
  cashflow: number;
  total: number;
  savingsRate: number;
};

/**
 * Calculează radius [topLeft, topRight, bottomRight, bottomLeft] pentru un segment
 * dintr-o bară stacked, în funcție de poziția în stack (doar topmost are radius sus,
 * doar bottommost are radius jos; segment unic = capsule).
 */
function getStackedBarRadius(
  stackKeys: (keyof ChartDataPoint)[],
  dataKey: keyof ChartDataPoint,
  payload: ChartDataPoint,
  barRadius: number
): [number, number, number, number] {
  const visibleSegments = stackKeys.filter(
    (k) => (Number(payload[k]) ?? 0) > 0
  );
  const currentIndex = visibleSegments.indexOf(dataKey);
  if (currentIndex === -1) return [0, 0, 0, 0];

  const isTopmost = currentIndex === visibleSegments.length - 1;
  const isBottommost = currentIndex === 0;
  const isSingle = visibleSegments.length === 1;

  const top = isTopmost || isSingle ? barRadius : 0;
  const bottom = isBottommost || isSingle ? barRadius : 0;
  return [top, top, bottom, bottom];
}

/** Recharts Cell mergează props în entry; radius per segment e tuple [topL, topR, bottomR, bottomL], tipurile Recharts nu îl declară. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cellRadius = (r: [number, number, number, number]): any => r;

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
  const setSelectedPerson = useFinanceStore((s) => s.setSelectedPerson);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const setSelectedMonth = useFinanceStore((s) => s.setSelectedMonth);
  const dashboardView = useFinanceStore((s) => s.dashboardView);
  const setDashboardView = useFinanceStore((s) => s.setDashboardView);
  const records = useFinanceStore((s) => s.records);
  const getLast12Months = useFinanceStore((s) => s.getLast12Months);
  const getLast6Months = useFinanceStore((s) => s.getLast6Months);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const includeInv = useFinanceStore((s) => s.settings.includeInvestmentsInNetCashflow);
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const setDisplayCurrency = useFinanceStore((s) => s.setDisplayCurrency);
  const setExchangeRates = useFinanceStore((s) => s.setExchangeRates);

  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, [setExchangeRates]);

  useEffect(() => {
    if (displayCurrency !== "RON") {
      fetchExchangeRates().then(setExchangeRates);
    }
  }, [displayCurrency, setExchangeRates]);

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
              className="rounded-2xl glass-panel shadow-soft p-5 animate-pulse"
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
        <div className="rounded-2xl glass-panel shadow-soft overflow-hidden animate-pulse">
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
          <div className="rounded-2xl glass-panel shadow-soft overflow-hidden">
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
      {/* Period + Person selector — one panel, centered, with dividers */}
      {(() => {
        const panelHeight = "h-11";
        const segmentBase =
          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-normal ease-liquid min-w-[4rem] sm:min-w-0 inline-flex items-center justify-center gap-1.5";
        const segmentSelected =
          "bg-white/90 dark:bg-white/20 text-textPrimary dark:text-white shadow-soft border border-white/20 dark:border-white/20";
        const segmentUnselected =
          "text-textSecondary hover:text-textPrimary dark:text-gray-300 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/10";
        const segmentGroup = cn(
          "inline-flex items-center rounded-xl border border-white/20 dark:border-white/10 bg-black/[0.04] dark:bg-white/10 p-1 shrink-0",
          panelHeight
        );
        const divider = (
          <span
            className={cn("w-px bg-white/20 dark:bg-white/15 shrink-0", panelHeight)}
            aria-hidden
          />
        );
        const personOptions: { value: PersonView; label: string; icon?: boolean }[] = [
          { value: "me", label: PERSON_LABELS.me },
          { value: "wife", label: PERSON_LABELS.wife },
          { value: "combined", label: "Împreună", icon: true },
        ];
        return (
          <div className="rounded-2xl glass-panel shadow-soft p-4">
            <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
              {/* Lună | An */}
              <div
                role="group"
                aria-label="Vizualizare lună sau an"
                className={segmentGroup}
              >
                <button
                  type="button"
                  onClick={() => setDashboardView("month")}
                  className={cn(
                    segmentBase,
                    dashboardView === "month" ? segmentSelected : segmentUnselected
                  )}
                >
                  Lună
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardView("annual")}
                  className={cn(
                    segmentBase,
                    dashboardView === "annual" ? segmentSelected : segmentUnselected
                  )}
                >
                  An
                </button>
              </div>

              {divider}

              {/* Paul | Codru | 2-person icon */}
              <div
                role="group"
                aria-label="Vizualizare date"
                className={segmentGroup}
              >
                {personOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedPerson(opt.value)}
                    aria-label={opt.label}
                    className={cn(
                      segmentBase,
                      opt.icon && "px-2.5",
                      selectedPerson === opt.value ? segmentSelected : segmentUnselected
                    )}
                  >
                    {opt.icon ? (
                      <Users className="h-4 w-4" aria-hidden />
                    ) : (
                      opt.label
                    )}
                  </button>
                ))}
              </div>

              {divider}

              {/* RON | USD | EUR — currency display */}
              <div
                role="group"
                aria-label="Monedă afișare"
                className={segmentGroup}
              >
                {(
                  [
                    { value: "RON" as DisplayCurrency, label: "RON", Icon: Landmark },
                    { value: "USD" as DisplayCurrency, label: "USD", Icon: DollarSign },
                    { value: "EUR" as DisplayCurrency, label: "EUR", Icon: Euro },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDisplayCurrency(value)}
                    aria-label={label}
                    title={label}
                    className={cn(
                      segmentBase,
                      "px-2.5 min-w-0",
                      displayCurrency === value ? segmentSelected : segmentUnselected
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>

              {divider}
              <button
                type="button"
                disabled={
                  (dashboardView === "month" && selectedMonth === getCurrentMonth()) ||
                  (dashboardView === "annual" && selectedYear === new Date().getFullYear())
                }
                onClick={() =>
                  setSelectedMonth(
                    dashboardView === "month"
                      ? getCurrentMonth()
                      : monthStringForYear(new Date().getFullYear())
                  )
                }
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 dark:border-white/10 px-3 py-1.5 text-sm font-medium transition-all duration-normal ease-liquid shrink-0",
                  panelHeight,
                  "bg-black/[0.04] dark:bg-white/10 text-textSecondary hover:bg-black/[0.06] hover:text-textPrimary dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/[0.04] disabled:dark:hover:bg-white/10"
                )}
              >
                <Calendar className="h-4 w-4 shrink-0" />
                {dashboardView === "month" ? "Luna curentă" : "Anul curent"}
              </button>

              {divider}

              {/* Nav + period display — inside panel */}
              <div
                role="group"
                aria-label={dashboardView === "month" ? "Lună" : "An"}
                className={cn(segmentGroup, "gap-2")}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMonth(
                      dashboardView === "month"
                        ? getPreviousMonth(selectedMonth)
                        : monthStringForYear(selectedYear - 1)
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/10 text-textSecondary hover:bg-black/[0.05] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
                  aria-label={dashboardView === "month" ? "Luna anterioară" : "Anul anterior"}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="min-w-[7rem] py-1 text-center">
                  <span className="text-base font-medium text-textPrimary dark:text-white">
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/10 text-textSecondary hover:bg-black/[0.05] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
                  aria-label={dashboardView === "month" ? "Luna următoare" : "Anul următor"}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
              className="group relative rounded-2xl glass-panel shadow-soft hover:shadow-glass transition-all duration-normal ease-liquid"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="rounded-xl bg-black/[0.05] dark:bg-white/10 p-2.5">
                    <m.icon className={`h-5 w-5 ${colorClass}`} />
                  </div>
                  <button
                    type="button"
                    className="rounded-xl p-1.5 text-textMuted hover:bg-black/[0.05] hover:text-textPrimary -mr-1 -mt-1 transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-white/90 mb-1">{m.label}</p>
                <p className="text-xl text-white">
                  {formatCurrency(val, displayCurrency, exchangeRates)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance + Chart */}
      <div className="rounded-2xl glass-panel shadow-soft overflow-hidden">
        <div className="px-6 pt-6 pb-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">
                Cashflow net
              </h2>
              <p className="text-xs text-white/90 mt-0.5">
                {includeInv
                  ? "Venit − cheltuieli − investiții (după investiții)"
                  : "Venit − cheltuieli (înainte de investiții)"}
              </p>
              <p className="text-2xl lg:text-3xl text-white mt-1">
                {currentData
                  ? formatCurrency(currentData.cashflow, displayCurrency, exchangeRates)
                  : formatCurrency(0, displayCurrency, exchangeRates)}
              </p>
            </div>
            <p className="text-xs text-white/90 uppercase tracking-wide">
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
                    cursor={chartBarCursor}
                    wrapperStyle={chartTooltipWrapperStyle}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                          <div className="chart-tooltip">
                          <p className="chart-tooltip-label">{d.full}</p>
                          <div className="space-y-1 text-sm">
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">Venit</span>
                              <span>{formatCurrency(d.income, displayCurrency, exchangeRates)}</span>
                            </p>
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">Cheltuieli</span>
                              <span>{formatCurrency(d.expenses, displayCurrency, exchangeRates)}</span>
                            </p>
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">Economii</span>
                              <span style={{ color: colors.accentPositive }}>{formatCurrency(d.economii ?? 0, displayCurrency, exchangeRates)}</span>
                            </p>
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">Investiții</span>
                              <span>{formatCurrency(d.investitii ?? 0, displayCurrency, exchangeRates)}</span>
                            </p>
                            <p className="chart-tooltip-row pt-1 border-t border-white/10">
                              <span className="chart-tooltip-label">Total</span>
                              <span>{formatCurrency(d.total, displayCurrency, exchangeRates)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="income"
                    stackId="a"
                    fill="#6B7280"
                    name="Venit"
                  >
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`income-${i}`}
                        radius={cellRadius(getStackedBarRadius(
                          STACK_KEYS_MAIN,
                          "income",
                          entry,
                          barCornerRadius
                        ))}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expenses"
                    stackId="a"
                    fill={colors.sidebar}
                    name="Cheltuieli"
                  >
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`expenses-${i}`}
                        radius={cellRadius(getStackedBarRadius(
                          STACK_KEYS_MAIN,
                          "expenses",
                          entry,
                          barCornerRadius
                        ))}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="economii"
                    stackId="a"
                    fill={colors.accentPositive}
                    name="Economii"
                  >
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`economii-${i}`}
                        radius={cellRadius(getStackedBarRadius(
                          STACK_KEYS_MAIN,
                          "economii",
                          entry,
                          barCornerRadius
                        ))}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="investitii"
                    stackId="a"
                    fill={colors.accentOrange}
                    name="Investiții"
                  >
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`investitii-${i}`}
                        radius={cellRadius(getStackedBarRadius(
                          STACK_KEYS_MAIN,
                          "investitii",
                          entry,
                          barCornerRadius
                        ))}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-white/80 text-sm rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]">
              Completează date în Monthly Input pentru grafic.
            </div>
          )}
        </div>
      </div>

      {/* Category bar chart */}
      <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
        <h3 className="text-base font-medium text-white mb-1">Pe categorii</h3>
        <p className="text-xs text-white/90 mb-4">{periodLabel} · Venit, Rate, Facturi, Altele, Cheltuieli, Economii & Investiții</p>
        {categoryBarData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip cursor={chartBarCursor} wrapperStyle={chartTooltipWrapperStyle} contentStyle={chartTooltipContentStyle} formatter={(v: number) => formatCurrency(v, displayCurrency, exchangeRates)} />
                <Bar dataKey="value" fill={colors.sidebar} radius={[4, 4, 0, 0]} name="Sumă" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-white/80 text-sm">Nu există date pentru perioada selectată.</div>
        )}
      </section>

      {/* Extra charts grid — numbered so you can choose which to keep */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Income vs expenses over time (line) */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[1]</span>
            Venit vs cheltuieli
          </h3>
          <p className="text-xs text-white/90 mb-4">
            {dashboardView === "annual" ? `An ${selectedYear} (ian–dec)` : "Ultimele 12 luni"} · Evoluția veniturilor și a cheltuielilor
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} padding={{left: 0, right: 10}}/>
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip wrapperStyle={chartTooltipWrapperStyle} content={({ active, payload }) => (active && payload?.length ? (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip-label">{payload[0]?.payload?.full}</p>
                    <p className="chart-tooltip-row">Venit: {formatCurrency(payload[0]?.payload?.income ?? 0, displayCurrency, exchangeRates)}</p>
                    <p className="chart-tooltip-row">Cheltuieli: {formatCurrency(payload[0]?.payload?.expenses ?? 0, displayCurrency, exchangeRates)}</p>
                  </div>
                ) : null)} />
                <Line type="monotone" dataKey="income" stroke={colors.sidebar} strokeWidth={2} dot={{ r: 3 }} name="Venit" />
                <Line type="monotone" dataKey="expenses" stroke={colors.sidebar} strokeWidth={2} dot={{ r: 3 }} name="Cheltuieli" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Spending by category (pie) */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[2]</span>
            Cheltuieli pe categorii
          </h3>
          <p className="text-xs text-white/90 mb-4">{periodLabel}</p>
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
                      <Cell key={i} fill={colors.chartPalette[i % colors.chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={chartTooltipWrapperStyle} contentStyle={chartTooltipContentStyle} formatter={(v: number) => formatCurrency(v, displayCurrency, exchangeRates)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-white/80 text-sm">Nu există cheltuieli pentru luna selectată.</div>
          )}
        </section>

        {/* Chart 3: Savings / investment rate over time */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[3]</span>
            Rata de economii (investiții / venit)
          </h3>
          <p className="text-xs text-white/90 mb-4">
            {dashboardView === "annual" ? `An ${selectedYear}` : "Ultimele 12 luni"} · Procent din venit alocat investițiilor
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip cursor={chartBarCursor} wrapperStyle={chartTooltipWrapperStyle} content={({ active, payload }) => (active && payload?.[0] ? (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip-label">{payload[0].payload?.full}</p>
                    <p className="chart-tooltip-row">Rata: {payload[0].payload?.savingsRate}%</p>
                  </div>
                ) : null)} />
                <Bar dataKey="savingsRate" fill={colors.accentOrange} radius={[4, 4, 0, 0]} name="Rata %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 4: Paul vs Codru comparison (grouped bar) */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[4]</span>
            Paul vs Codru
          </h3>
          <p className="text-xs text-white/90 mb-4">{periodLabel}</p>
          {paulVsCodruData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paulVsCodruData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical" barCategoryGap="20%">
                  <XAxis type="number" tick={{ fontSize: 10, fill: colors.textSecondary }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                  <YAxis type="category" dataKey="metric" width={80} tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={chartBarCursor} wrapperStyle={chartTooltipWrapperStyle} contentStyle={chartTooltipContentStyle} formatter={(v: number) => formatCurrency(v, displayCurrency, exchangeRates)} />
                  <Legend />
                  <Bar dataKey="Paul" fill={colors.sidebar} radius={[0, 4, 4, 0]} name="Paul" />
                  <Bar dataKey="Codru" fill={colors.accentOrange} radius={[0, 4, 4, 0]} name="Codru" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-white/80 text-sm">Nu există date pentru luna selectată.</div>
          )}
        </section>

        {/* Chart 5: Cashflow net over time (line) */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[5]</span>
            Cashflow net în timp
          </h3>
          <p className="text-xs text-white/90 mb-4">
            {dashboardView === "annual" ? `An ${selectedYear}` : "Ultimele 12 luni"}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip wrapperStyle={chartTooltipWrapperStyle} content={({ active, payload }) => (active && payload?.[0] ? (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip-label">{payload[0].payload?.full}</p>
                    <p className="chart-tooltip-row" style={{ color: (payload[0].payload?.cashflow ?? 0) >= 0 ? colors.accentPositive : colors.accentNegative }}>
                      Cashflow: {formatCurrency(payload[0].payload?.cashflow ?? 0, displayCurrency, exchangeRates)}
                    </p>
                  </div>
                ) : null)} />
                <Line type="monotone" dataKey="cashflow" stroke={colors.accentPositive} strokeWidth={2} dot={{ r: 3 }} name="Cashflow net" strokeDasharray={undefined} />
                <ReferenceLine y={0} stroke={colors.textSecondary} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 6: Top spending categories (horizontal bar) */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[6]</span>
            Top categorii de cheltuieli
          </h3>
          <p className="text-xs text-white/90 mb-4">{periodLabel}</p>
          {topSpendingCategoriesData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSpendingCategoriesData} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: colors.textSecondary }} tickFormatter={(v) => formatCurrency(v, displayCurrency, exchangeRates)} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={chartBarCursor} wrapperStyle={chartTooltipWrapperStyle} contentStyle={chartTooltipContentStyle} formatter={(v: number) => formatCurrency(v, displayCurrency, exchangeRates)} />
                  <Bar dataKey="value" fill={colors.sidebar} radius={[0, 4, 4, 0]} name="Sumă" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-white/80 text-sm">Nu există cheltuieli pentru luna selectată.</div>
          )}
        </section>

        {/* Chart 7: Bills vs rest of expenses (stacked bar) */}
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6 lg:col-span-2">
          <h3 className="text-base font-medium text-white mb-1">
            <span className="text-xs font-normal text-white/70 mr-2">[7]</span>
            Facturi vs restul cheltuielilor
          </h3>
          <p className="text-xs text-white/90 mb-4">
            {dashboardView === "annual" ? `An ${selectedYear} (ian–dec)` : "Ultimele 12 luni"} · Facturi fixe vs altele
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSecondary }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
                <Tooltip cursor={chartBarCursor} wrapperStyle={chartTooltipWrapperStyle} content={({ active, payload }) => (active && payload?.length ? (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip-label">{payload[0]?.payload?.full}</p>
                    <p className="chart-tooltip-row">Facturi: {formatCurrency(payload[0]?.payload?.bills ?? 0, displayCurrency, exchangeRates)}</p>
                    <p className="chart-tooltip-row">Alte cheltuieli: {formatCurrency(payload[0]?.payload?.restExpenses ?? 0, displayCurrency, exchangeRates)}</p>
                  </div>
                ) : null)} />
                <Bar dataKey="bills" stackId="b" fill="#1F2937" name="Facturi">
                  {chartData.map((entry, i) => (
                    <Cell
                      key={`bills-${i}`}
                      radius={cellRadius(getStackedBarRadius(
                        STACK_KEYS_BILLS,
                        "bills",
                        entry,
                        barCornerRadius
                      ))}
                    />
                  ))}
                </Bar>
                <Bar dataKey="restExpenses" stackId="b" fill="#6B7280" name="Alte cheltuieli">
                  {chartData.map((entry, i) => (
                    <Cell
                      key={`restExpenses-${i}`}
                      radius={cellRadius(getStackedBarRadius(
                        STACK_KEYS_BILLS,
                        "restExpenses",
                        entry,
                        barCornerRadius
                      ))}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* History — frosted card */}
      <section>
        <h2 className="text-lg font-medium text-white">History</h2>
        <p className="text-sm text-white/90 mt-0.5">
          Transaction of last 6 months
        </p>
        <div className="mt-4 rounded-2xl glass-panel shadow-soft overflow-hidden">
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
                      "flex items-center gap-4 px-6 py-4 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all duration-normal ease-liquid",
                      idx === 1 && "bg-black/[0.03] dark:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.06] dark:bg-white/10">
                      <User className="h-5 w-5 text-white/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm">
                        {formatMonthShort(r.month)}
                      </p>
                      <p className="text-xs text-white/80">
                        {format(parseISO(r.meta.updatedAt), "hh:mm:ss a", {
                          locale: ro,
                        })}
                      </p>
                    </div>
                    <p
                      className={`text-sm tabular-nums ${
                        cashflow >= 0
                          ? "text-accentPositive"
                          : "text-accentNegative"
                      }`}
                    >
                      {formatCurrency(cashflow, displayCurrency, exchangeRates)}
                    </p>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl ${
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
            <div className="px-6 py-12 text-center text-white/80 text-sm rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]">
              No records. Add data in Monthly Input.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
