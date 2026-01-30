"use client";

import { useFinanceStore } from "@/lib/store/finance-store";
import { calculateNetCashflow } from "@/lib/calculations/calculations";
import { getDataForPerson } from "@/lib/dashboard/dashboard-data";
import { useDashboardData, useDashboardLoad } from "@/lib/dashboard/useDashboardData";
import {
  METRIC_CARDS,
  STACK_KEYS_MAIN,
  STACK_KEYS_BILLS,
} from "@/lib/dashboard/chart-types";
import {
  getStackedBarRadius,
  cellRadius,
} from "@/lib/dashboard/chart-helpers";
import { formatCurrency, type DisplayCurrency } from "@/lib/utils/currency";
import { formatMonthShort, monthStringForYear } from "@/lib/utils/date";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Landmark,
  DollarSign,
  Euro,
  Info,
} from "lucide-react";
import { Tooltip as UITooltip } from "@/components/ui/tooltip";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { SegmentPanel, SegmentDivider, segmentPanelStyles } from "@/components/shared/SegmentPanel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
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
  ReferenceLine,
  Rectangle,
} from "recharts";
import {
  colors,
  barCornerRadius,
  chartTooltipWrapperStyle,
  chartTooltipContentStyle,
  chartBarCursorStyle,
} from "@/lib/design-tokens";
import type { PersonView } from "@/lib/types";

const chartBarCursor = <Rectangle {...chartBarCursorStyle} radius={6} />;

const PROFILE_CHART_COLORS = [colors.accentPositive, colors.accentOrange, colors.accentPrimary, "#6B7280", "#9CA3AF"];

const currencyOptions: { value: DisplayCurrency; label: string; icon: React.ReactNode }[] = [
  { value: "RON", label: "RON", icon: <Landmark className="h-4 w-4" aria-hidden /> },
  { value: "USD", label: "USD", icon: <DollarSign className="h-4 w-4" aria-hidden /> },
  { value: "EUR", label: "EUR", icon: <Euro className="h-4 w-4" aria-hidden /> },
];

export default function Home() {
  useDashboardLoad();
  const {
    chartData,
    currentData,
    last6,
    selectedYear,
    periodLabel,
    domainMax,
    categoryBarData,
    spendingByCategoryData,
    topSpendingCategoriesData,
    paulVsCodruData,
  } = useDashboardData();

  const loadRecords = useFinanceStore((s) => s.loadRecords);
  const clearError = useFinanceStore((s) => s.clearError);
  const error = useFinanceStore((s) => s.error);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const setSelectedPerson = useFinanceStore((s) => s.setSelectedPerson);
  const setSelectedMonth = useFinanceStore((s) => s.setSelectedMonth);
  const setDisplayCurrency = useFinanceStore((s) => s.setDisplayCurrency);
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const includeInvestmentsInNetCashflow = useFinanceStore(
    (s) => s.settings.includeInvestmentsInNetCashflow
  );
  const decimalPlaces = useFinanceStore((s) => s.settings.decimalPlaces);
  const dateLocale = useFinanceStore((s) => s.settings.dateLocale);
  const records = useFinanceStore((s) => s.records);
  const profiles = useFinanceStore((s) => s.profiles);
  const personOptions = [
    ...profiles.map((p) => ({ value: p.id as PersonView, label: p.name })),
    {
      value: "combined" as PersonView,
      label: "Împreună",
      icon: <Users className="h-4 w-4" aria-hidden />,
      compact: true,
    },
  ];

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "page.tsx:Home:render",
      message: "Dashboard render",
      data: { isLoading, recordsLength: records?.length ?? -1, hasError: !!error },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H1,H3,H4",
    }),
  }).catch(() => {});
  // #endregion

  if (isLoading) {
    return <DashboardSkeleton />;
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
      <div className="rounded-2xl glass-panel shadow-soft p-4">
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          <SegmentPanel
            segments={personOptions}
            selectedValue={selectedPerson}
            onSelect={setSelectedPerson}
            ariaLabel="Vizualizare date"
          />
          <SegmentDivider />
          <SegmentPanel
            segments={currencyOptions.map((o) => ({
              ...o,
              compact: true,
            }))}
            selectedValue={displayCurrency}
            onSelect={setDisplayCurrency}
            ariaLabel="Monedă afișare"
          />
          <SegmentDivider />
          <button
            type="button"
            disabled={selectedYear === new Date().getFullYear()}
            onClick={() =>
              setSelectedMonth(monthStringForYear(new Date().getFullYear()))
            }
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-1.5 text-sm font-medium transition-all duration-normal ease-liquid shrink-0",
              segmentPanelStyles.panelHeight,
              "text-textSecondary hover:bg-white/60 hover:text-textPrimary dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:dark:hover:bg-transparent"
            )}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Anul curent
          </button>
          <SegmentDivider />
          <div
            role="group"
            aria-label="An"
            className={cn(segmentPanelStyles.segmentGroupBase, "gap-2")}
          >
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(monthStringForYear(selectedYear - 1))
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-surface border border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/70 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Anul anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[7rem] py-1 text-center">
              <span className="text-base font-medium text-textPrimary dark:text-white">
                {selectedYear}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(monthStringForYear(selectedYear + 1))
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-surface border border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/70 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Anul următor"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-panel-wrap p-4 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_CARDS.map((m) => {
            const val = currentData ? m.getValue(currentData) : 0;
            const colorClass =
              typeof m.color === "function"
                ? currentData
                  ? m.color(currentData)
                  : "text-textPrimary"
                : m.color;
            return (
              <div
                key={m.key}
                className="group relative rounded-2xl glass-panel shadow-soft hover:shadow-glass transition-all duration-normal ease-liquid"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="rounded-xl glass-surface p-2.5 border border-white/20 dark:border-white/10">
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
                  <p className="text-sm text-textSecondary dark:text-white/90 mb-1">
                    {m.label}
                  </p>
                  <p className="text-xl text-textPrimary dark:text-white">
                    {formatCurrency(val, displayCurrency, exchangeRates, decimalPlaces)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl glass-panel shadow-soft overflow-visible">
        <div className="px-6 pt-6 pb-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-medium text-textPrimary dark:text-white">
                Cashflow net
              </h2>
              <UITooltip
                content={
                  includeInvestmentsInNetCashflow
                    ? "Venit − cheltuieli − investiții (după investiții)"
                    : "Venit − cheltuieli (înainte de investiții)"
                }
                side="top"
              >
                <span
                  className="inline-flex cursor-help rounded-full text-textMuted hover:text-textSecondary dark:text-white/70 dark:hover:text-white/90"
                  aria-label="Info"
                >
                  <Info className="h-4 w-4" />
                </span>
              </UITooltip>
            </div>
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
                      v >= 1000
                        ? `${Math.round(v / 1000)}K`
                        : String(Math.round(v))
                    }
                    domain={[0, Math.max(domainMax, 1000)]}
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
                              <span>
                                {formatCurrency(
                                  d.income,
                                  displayCurrency,
                                  exchangeRates,
                                  decimalPlaces
                                )}
                              </span>
                            </p>
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">
                                Cheltuieli
                              </span>
                              <span>
                                {formatCurrency(
                                  d.expenses,
                                  displayCurrency,
                                  exchangeRates,
                                  decimalPlaces
                                )}
                              </span>
                            </p>
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">
                                Economii
                              </span>
                              <span
                                style={{
                                  color: colors.accentPositive,
                                }}
                              >
                                {formatCurrency(
                                  d.economii ?? 0,
                                  displayCurrency,
                                  exchangeRates,
                                  decimalPlaces
                                )}
                              </span>
                            </p>
                            <p className="chart-tooltip-row">
                              <span className="chart-tooltip-label">
                                Investiții
                              </span>
                              <span>
                                {formatCurrency(
                                  d.investitii ?? 0,
                                  displayCurrency,
                                  exchangeRates,
                                  decimalPlaces
                                )}
                              </span>
                            </p>
                            <p className="chart-tooltip-row pt-1 border-t border-white/10">
                              <span className="chart-tooltip-label">Total</span>
                              <span>
                                {formatCurrency(
                                  d.total,
                                  displayCurrency,
                                  exchangeRates,
                                  decimalPlaces
                                )}
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
                    fill={colors.accentPositive}
                    name="Venit"
                  >
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`income-${i}`}
                        radius={cellRadius(
                          getStackedBarRadius(
                            STACK_KEYS_MAIN,
                            "income",
                            entry,
                            barCornerRadius
                          )
                        )}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expenses"
                    stackId="a"
                    fill={colors.accentPrimaryActive}
                    name="Cheltuieli"
                  >
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`expenses-${i}`}
                        radius={cellRadius(
                          getStackedBarRadius(
                            STACK_KEYS_MAIN,
                            "expenses",
                            entry,
                            barCornerRadius
                          )
                        )}
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
                        radius={cellRadius(
                          getStackedBarRadius(
                            STACK_KEYS_MAIN,
                            "economii",
                            entry,
                            barCornerRadius
                          )
                        )}
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
                        radius={cellRadius(
                          getStackedBarRadius(
                            STACK_KEYS_MAIN,
                            "investitii",
                            entry,
                            barCornerRadius
                          )
                        )}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-textSecondary dark:text-white/80 text-sm rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]">
              Completează date în Monthly Input pentru grafic.
            </div>
          )}
        </div>
      </div>

      <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
        <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
          Pe categorii
        </h3>
        <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
          {periodLabel} · Venit, Rate, Facturi, Altele, Cheltuieli, Economii &
          Investiții
        </p>
        {categoryBarData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBarData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? `${Math.round(v / 1000)}K`
                      : String(Math.round(v))
                  }
                />
                <Tooltip
                  cursor={chartBarCursor}
                  wrapperStyle={chartTooltipWrapperStyle}
                  contentStyle={chartTooltipContentStyle}
                  formatter={(v: number) =>
                    formatCurrency(v, displayCurrency, exchangeRates, decimalPlaces)
                  }
                />
                <Bar
                  dataKey="value"
                  fill={colors.accentPositive}
                  radius={[4, 4, 0, 0]}
                  name="Sumă"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-textSecondary dark:text-white/80 text-sm">
            Nu există date pentru perioada selectată.
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [1]
            </span>
            Venit vs cheltuieli
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {`An ${selectedYear} (ian–dec)`} · Evoluția veniturilor și a
            cheltuielilor
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
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
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                  tickLine={false}
                  padding={{ left: 0, right: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? `${Math.round(v / 1000)}K`
                      : String(Math.round(v))
                  }
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="chart-tooltip">
                        <p className="chart-tooltip-label">
                          {payload[0]?.payload?.full}
                        </p>
                        <p className="chart-tooltip-row">
                          Venit:{" "}
                          {formatCurrency(
                            payload[0]?.payload?.income ?? 0,
                            displayCurrency,
                            exchangeRates,
                            decimalPlaces
                          )}
                        </p>
                        <p className="chart-tooltip-row">
                          Cheltuieli:{" "}
                          {formatCurrency(
                            payload[0]?.payload?.expenses ?? 0,
                            displayCurrency,
                            exchangeRates,
                            decimalPlaces
                          )}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke={colors.accentPositive}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Venit"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke={colors.accentOrange}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Cheltuieli"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [2]
            </span>
            Cheltuieli pe categorii
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {periodLabel}
          </p>
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {spendingByCategoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          colors.chartPalette[
                            i % colors.chartPalette.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={chartTooltipWrapperStyle}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="chart-tooltip">
                          <p className="chart-tooltip-label">
                            {payload[0].name}
                          </p>
                          <p className="chart-tooltip-row">
                            {payload[0].name}:{" "}
                            {formatCurrency(
                              Number(payload[0].value) || 0,
                              displayCurrency,
                              exchangeRates,
                              decimalPlaces
                            )}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-textSecondary dark:text-white/80 text-sm">
              Nu există cheltuieli pentru anul selectat.
            </div>
          )}
        </section>

        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [3]
            </span>
            Rata de economii (investiții / venit)
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {`An ${selectedYear}`} · Procent din venit alocat investițiilor
          </p>
          <div className="h-56">
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
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={chartBarCursor}
                  wrapperStyle={chartTooltipWrapperStyle}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="chart-tooltip">
                        <p className="chart-tooltip-label">
                          {payload[0].payload?.full}
                        </p>
                        <p className="chart-tooltip-row">
                          Rata: {payload[0].payload?.savingsRate}%
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar
                  dataKey="savingsRate"
                  fill={colors.accentOrange}
                  radius={[4, 4, 0, 0]}
                  name="Rata %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [4]
            </span>
            Comparație profiluri
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {periodLabel}
          </p>
          {paulVsCodruData.length > 0 && profiles.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paulVsCodruData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  layout="vertical"
                  barCategoryGap="20%"
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: colors.textSecondary }}
                    tickFormatter={(v) =>
                      v >= 1000
                        ? `${Math.round(v / 1000)}K`
                        : String(Math.round(v))
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="metric"
                    width={80}
                    tick={{ fontSize: 10, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={chartBarCursor}
                    wrapperStyle={chartTooltipWrapperStyle}
                    contentStyle={chartTooltipContentStyle}
                    formatter={(v: number) =>
                      formatCurrency(v, displayCurrency, exchangeRates, decimalPlaces)
                    }
                  />
                  <Legend />
                  {profiles.map((p, i) => (
                    <Bar
                      key={p.id}
                      dataKey={p.name}
                      fill={PROFILE_CHART_COLORS[i % PROFILE_CHART_COLORS.length]}
                      radius={[0, 4, 4, 0]}
                      name={p.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-textSecondary dark:text-white/80 text-sm">
              Nu există date pentru anul selectat.
            </div>
          )}
        </section>

        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [5]
            </span>
            Cashflow net în timp
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {`An ${selectedYear}`}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
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
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? `${Math.round(v / 1000)}K`
                      : String(Math.round(v))
                  }
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="chart-tooltip">
                        <p className="chart-tooltip-label">
                          {payload[0].payload?.full}
                        </p>
                        <p
                          className="chart-tooltip-row"
                          style={{
                            color:
                              (payload[0].payload?.cashflow ?? 0) >= 0
                                ? colors.accentPositive
                                : colors.accentNegative,
                          }}
                        >
                          Cashflow:{" "}
                          {formatCurrency(
                            payload[0].payload?.cashflow ?? 0,
                            displayCurrency,
                            exchangeRates,
                            decimalPlaces
                          )}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="cashflow"
                  stroke={colors.accentPositive}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Cashflow net"
                  strokeDasharray={undefined}
                />
                <ReferenceLine
                  y={0}
                  stroke={colors.textSecondary}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [6]
            </span>
            Top categorii de cheltuieli
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {periodLabel}
          </p>
          {topSpendingCategoriesData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSpendingCategoriesData}
                  layout="vertical"
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: colors.textSecondary }}
                    tickFormatter={(v) =>
                      formatCurrency(v, displayCurrency, exchangeRates, decimalPlaces)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 10, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={chartBarCursor}
                    wrapperStyle={chartTooltipWrapperStyle}
                    contentStyle={chartTooltipContentStyle}
                    formatter={(v: number) =>
                      formatCurrency(v, displayCurrency, exchangeRates, decimalPlaces)
                    }
                  />
                  <Bar
                    dataKey="value"
                    fill={colors.accentPositive}
                    radius={[0, 4, 4, 0]}
                    name="Sumă"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-textSecondary dark:text-white/80 text-sm">
              Nu există cheltuieli pentru anul selectat.
            </div>
          )}
        </section>

        <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6 lg:col-span-2">
          <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
            <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
              [7]
            </span>
            Facturi vs restul cheltuielilor
          </h3>
          <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
            {`An ${selectedYear} (ian–dec)`} · Facturi fixe vs altele
          </p>
          <div className="h-56">
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
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? `${Math.round(v / 1000)}K`
                      : String(Math.round(v))
                  }
                />
                <Tooltip
                  cursor={chartBarCursor}
                  wrapperStyle={chartTooltipWrapperStyle}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="chart-tooltip">
                        <p className="chart-tooltip-label">
                          {payload[0]?.payload?.full}
                        </p>
                        <p className="chart-tooltip-row">
                          Facturi:{" "}
                          {formatCurrency(
                            payload[0]?.payload?.bills ?? 0,
                            displayCurrency,
                            exchangeRates,
                            decimalPlaces
                          )}
                        </p>
                        <p className="chart-tooltip-row">
                          Alte cheltuieli:{" "}
                          {formatCurrency(
                            payload[0]?.payload?.restExpenses ?? 0,
                            displayCurrency,
                            exchangeRates,
                            decimalPlaces
                          )}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar
                  dataKey="bills"
                  stackId="b"
                  fill={colors.accentPositive}
                  name="Facturi"
                >
                  {chartData.map((entry, i) => (
                    <Cell
                      key={`bills-${i}`}
                      radius={cellRadius(
                        getStackedBarRadius(
                          STACK_KEYS_BILLS,
                          "bills",
                          entry,
                          barCornerRadius
                        )
                      )}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="restExpenses"
                  stackId="b"
                  fill={colors.accentPrimaryActive}
                  name="Alte cheltuieli"
                >
                  {chartData.map((entry, i) => (
                    <Cell
                      key={`restExpenses-${i}`}
                      radius={cellRadius(
                        getStackedBarRadius(
                          STACK_KEYS_BILLS,
                          "restExpenses",
                          entry,
                          barCornerRadius
                        )
                      )}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-medium text-textPrimary dark:text-white">
          History
        </h2>
        <p className="text-sm text-textSecondary dark:text-white/90 mt-0.5">
          Transaction of last 6 months
        </p>
        <div className="mt-4 rounded-2xl glass-panel shadow-soft overflow-hidden">
          {last6.length ? (
            <ul className="divide-y divide-black/[0.06]">
              {last6.map((r, idx) => {
                const data = getDataForPerson(
                  r,
                  selectedPerson,
                  getCombinedData
                );
                const cashflow = data
                  ? calculateNetCashflow(
                      data,
                      includeInvestmentsInNetCashflow
                    )
                  : 0;
                return (
                  <li
                    key={r.month}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all duration-normal ease-liquid",
                      idx === 1 &&
                        "bg-black/[0.03] dark:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.06] dark:bg-white/10">
                      <User className="h-5 w-5 text-textMuted dark:text-white/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-textPrimary dark:text-white text-sm">
                        {formatMonthShort(r.month, dateLocale)}
                      </p>
                      <p className="text-xs text-textSecondary dark:text-white/80">
                        {format(parseISO(r.meta.updatedAt), "hh:mm:ss a", {
                          locale: ro,
                        })}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-sm tabular-nums",
                        cashflow >= 0
                          ? "text-accentPositive"
                          : "text-accentNegative"
                      )}
                    >
                      {formatCurrency(
                        cashflow,
                        displayCurrency,
                        exchangeRates,
                        decimalPlaces
                      )}
                    </p>
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-xl glass-surface border",
                        r.meta.isSaved
                          ? "border-saved/40 text-savedText"
                          : "border-draft/40 text-draftText"
                      )}
                    >
                      {r.meta.isSaved ? "Completed" : "Draft"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center text-textSecondary dark:text-white/80 text-sm rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]">
              No records. Add data in Monthly Input.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
