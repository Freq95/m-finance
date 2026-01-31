"use client";

import * as React from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { getMonthsForYear } from "@/lib/utils/date";
import { formatRON } from "@/lib/utils/currency";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";
import type { ProfileId } from "@/lib/types";
import { createDefaultIncomeEstimateYear } from "@/lib/validation/schemas";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  colors,
  chartTooltipWrapperStyle,
  chartTooltipContentStyle,
} from "@/lib/design-tokens";
import { formatMonthShort } from "@/lib/utils/date";
import { calculateIncomeTotal } from "@/lib/calculations/calculations";

const MONTH_LABELS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

const PROFILE_CHART_COLORS = [
  colors.accentPositive,
  colors.accentOrange,
  colors.accentPrimary,
  "#6B7280",
  "#9CA3AF",
];

export function IncomeEstimatesClient() {
  const profiles = useFinanceStore((s) => s.profiles);
  const incomeEstimates = useFinanceStore((s) => s.incomeEstimates);
  const incomeEstimateSummaryByYear = useFinanceStore(
    (s) => s.incomeEstimateSummaryByYear
  );
  const records = useFinanceStore((s) => s.records);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const settings = useFinanceStore((s) => s.settings);
  const ensureIncomeEstimatesForYear = useFinanceStore(
    (s) => s.ensureIncomeEstimatesForYear
  );
  const updateIncomeEstimateMonth = useFinanceStore(
    (s) => s.updateIncomeEstimateMonth
  );
  const updateIncomeEstimateSummary = useFinanceStore(
    (s) => s.updateIncomeEstimateSummary
  );
  const currentYear = new Date().getFullYear();
  const [year, setYear] = React.useState(currentYear);
  const [grabOpen, setGrabOpen] = React.useState(false);

  React.useEffect(() => {
    if (profiles.length > 0) {
      ensureIncomeEstimatesForYear(year);
    }
  }, [profiles.length, year, ensureIncomeEstimatesForYear]);

  const months = React.useMemo(() => getMonthsForYear(year), [year]);
  const gridTemplateColumns = React.useMemo(() => {
    const profileCols = profiles.map(() => "minmax(140px,1fr)").join(" ");
    return `minmax(160px,1.2fr) ${profileCols} minmax(140px,1fr)`;
  }, [profiles.length]);

  const getYearData = React.useCallback(
    (profileId: ProfileId) =>
      incomeEstimates[profileId]?.[year] ?? createDefaultIncomeEstimateYear(year),
    [incomeEstimates, year]
  );

  const summary = React.useMemo(() => {
    return (
      incomeEstimateSummaryByYear[year] ?? {
        targetEconomiiLunare: 0,
        economiiInceput: 0,
      }
    );
  }, [incomeEstimateSummaryByYear, year]);

  const incomeFields = settings.incomeEstimateFields ?? {
    venit: true,
    bonuri: true,
    extra: true,
  };

  const toggleIncomeField = (field: keyof typeof incomeFields) => {
    const next = { ...incomeFields, [field]: !incomeFields[field] };
    const enabledCount = Object.values(next).filter(Boolean).length;
    if (enabledCount === 0) return;
    updateSettings({ incomeEstimateFields: next });
  };

  const calculateIncomeByDefinition = React.useCallback(
    (data: { venit: number; bonuri: number; extra: number }) => {
      if (incomeFields.venit && incomeFields.bonuri && incomeFields.extra) {
        return calculateIncomeTotal(data);
      }
      let total = 0;
      if (incomeFields.venit) total += data.venit ?? 0;
      if (incomeFields.bonuri) total += data.bonuri ?? 0;
      if (incomeFields.extra) total += data.extra ?? 0;
      return total;
    },
    [incomeFields]
  );

  const handleGrab = React.useCallback(() => {
    for (const month of months) {
      const record = records.find((r) => r.month === month);
      if (!record) continue;
      for (const p of profiles) {
        const personData = record.people[p.id];
        if (!personData) continue;
        const total = calculateIncomeByDefinition(personData);
        updateIncomeEstimateMonth(p.id, year, month, total);
      }
    }
  }, [months, records, profiles, calculateIncomeByDefinition, updateIncomeEstimateMonth, year]);

  const chartData = React.useMemo(() => {
    return months.map((monthStr) => {
      const short = formatMonthShort(monthStr, "ro");
      const row: Record<string, string | number> = {
        month: short.split(" ")[0],
        full: short,
        monthStr,
      };
      profiles.forEach((p) => {
        row[p.id] = getYearData(p.id).months[monthStr] ?? 0;
      });
      return row;
    });
  }, [months, profiles, getYearData]);

  if (profiles.length === 0) {
    return (
      <div className="space-y-6 pb-32">
        <div className="rounded-2xl glass-panel shadow-soft p-8 text-center">
          <p className="text-textSecondary dark:text-gray-300 mb-2">
            Nu există profiluri. Adaugă cel puțin un profil în Setări pentru a
            introduce date.
          </p>
          <p className="text-sm text-textSecondary dark:text-gray-400">
            Deschide Setări (icon roată) și secțiunea &quot;Profiles&quot; → Adaugă
            profil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="rounded-2xl glass-panel shadow-soft p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-textPrimary dark:text-white">
              Estimare venituri
            </h2>
            <p className="text-sm text-textSecondary dark:text-gray-300">
              Setează estimările lunare și sumarul pentru toate profilurile.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-textSecondary dark:text-white/80">
                  Economii inceput {year}
                </label>
                <CurrencyInput
                  value={summary.economiiInceput ?? 0}
                  onChange={(v) =>
                    updateIncomeEstimateSummary(year, { economiiInceput: v })
                  }
                  aria-label={`Economii inceput ${year}`}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-textSecondary dark:text-white/80">
                  Target economii lunare
                </label>
                <CurrencyInput
                  value={summary.targetEconomiiLunare ?? 0}
                  onChange={(v) =>
                    updateIncomeEstimateSummary(year, { targetEconomiiLunare: v })
                  }
                  aria-label="Target economii lunare"
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-textSecondary dark:text-white/80">
                  Economii EOF {year}
                </span>
                <div className="text-sm font-semibold text-textPrimary dark:text-white">
                  {formatRON((summary.targetEconomiiLunare ?? 0) * 12)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-textSecondary dark:text-white/80">
                  Total economii EOF {year}
                </span>
                <div className="text-sm font-semibold text-textPrimary dark:text-white">
                  {formatRON(
                    (summary.economiiInceput ?? 0) +
                      (summary.targetEconomiiLunare ?? 0) * 12
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg glass-surface border border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/70 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Anul anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[6rem] text-center">
              <span className="text-base font-medium text-textPrimary dark:text-white">
                {year}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg glass-surface border border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/70 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Anul următor"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setGrabOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-3 text-sm font-medium text-textPrimary transition-all duration-normal ease-liquid hover:bg-white/10 dark:border-white/10 dark:text-white"
            >
              Grab din Monthly Input
            </button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10 dark:border-white/10 glass-surface rounded-t-2xl px-6 pb-4 pt-6 border-x border-t border-white/10">
          <div
            className="grid gap-4 text-label text-textPrimary dark:text-white"
            style={{ gridTemplateColumns }}
          >
            <div aria-hidden />
            {profiles.map((p) => (
              <div
                key={p.id}
                className="text-center text-label font-medium tracking-wide text-textPrimary dark:text-white"
              >
                {p.name}
              </div>
            ))}
            <div className="text-center text-label font-medium tracking-wide text-textPrimary dark:text-white">
              Total RON
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-5 text-textPrimary dark:text-white">
          <div className="space-y-0">
            {months.map((month, index) => {
              const rowValues = profiles.map(
                (p) => getYearData(p.id).months[month] ?? 0
              );
              const rowTotal = rowValues.reduce((sum, v) => sum + v, 0);
              return (
                <div
                  key={month}
                  className="grid gap-4 items-center py-2.5 px-1 -mx-1 rounded-lg hover:bg-white/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-150"
                  style={{ gridTemplateColumns }}
                >
                  <div className="text-sm text-textSecondary dark:text-white/90 min-w-0">
                    {MONTH_LABELS[index] ?? month}
                  </div>
                  {profiles.map((p) => (
                    <div key={p.id} className="min-w-0">
                      <CurrencyInput
                        value={getYearData(p.id).months[month] ?? 0}
                        onChange={(v) =>
                          updateIncomeEstimateMonth(p.id, year, month, v)
                        }
                        aria-label={`${MONTH_LABELS[index]} ${p.name}`}
                        className="w-full"
                      />
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold tabular-nums text-textPrimary dark:text-white">
                    {formatRON(rowTotal)}
                  </div>
                </div>
              );
            })}
            <div
              className="grid gap-4 items-center pt-4 mt-4 border-t border-white/10 dark:border-white/10"
              style={{ gridTemplateColumns }}
            >
              <div className="text-sm font-medium text-textPrimary dark:text-white">
                Total
              </div>
              {profiles.map((p) => {
                const total = months.reduce(
                  (sum, month) => sum + (getYearData(p.id).months[month] ?? 0),
                  0
                );
                return (
                  <div
                    key={p.id}
                    className="text-right text-sm font-semibold tabular-nums text-textPrimary dark:text-white"
                  >
                    {formatRON(total)}
                  </div>
                );
              })}
              <div className="text-right text-sm font-semibold tabular-nums text-textPrimary dark:text-white">
                {formatRON(
                  profiles.reduce((sum, p) => {
                    const total = months.reduce(
                      (acc, month) => acc + (getYearData(p.id).months[month] ?? 0),
                      0
                    );
                    return sum + total;
                  }, 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="rounded-2xl glass-panel shadow-soft overflow-hidden p-6">
        <h3 className="text-base font-medium text-textPrimary dark:text-white mb-1">
          <span className="text-xs font-normal text-textMuted dark:text-white/70 mr-2">
            [1]
          </span>
          Venit lunar total (estimare)
        </h3>
        <p className="text-xs text-textSecondary dark:text-white/90 mb-4">
          {`An ${year} (ian–dec)`} · Evoluția veniturilor lunare estimate
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  v >= 1000 ? `${Math.round(v / 1000)}K` : String(Math.round(v))
                }
              />
              <Tooltip
                wrapperStyle={chartTooltipWrapperStyle}
                contentStyle={chartTooltipContentStyle}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="chart-tooltip">
                      <p className="chart-tooltip-label">
                        {payload[0]?.payload?.full}
                      </p>
                      <div className="space-y-1 text-sm">
                        {payload.map((entry) => (
                          <p key={String(entry.dataKey)} className="chart-tooltip-row">
                            <span className="chart-tooltip-label">
                              {entry.name}
                            </span>
                            <span>{formatRON(Number(entry.value) ?? 0)}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null
                }
              />
              {profiles.map((p, index) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.id}
                  name={p.name}
                  stroke={PROFILE_CHART_COLORS[index % PROFILE_CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <ConfirmationModal
        open={grabOpen}
        onOpenChange={setGrabOpen}
        title="Importă din Monthly Input"
        description={
          <div className="space-y-4">
            <p className="text-sm text-[#E0E0E0]">
              Importă venitul pentru anul {year}. Lunile fără date rămân neschimbate.
            </p>
            <div className="space-y-2">
              <span className="text-xs text-[#E0E0E0]">
                Alege ce consideri venit (minim una)
              </span>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["venit", "Venit"],
                    ["bonuri", "Bonuri"],
                    ["extra", "Extra"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <input
                      type="checkbox"
                      checked={incomeFields[key]}
                      onChange={() => toggleIncomeField(key)}
                      className="h-4 w-4 rounded border-white/30 bg-transparent text-accentPrimary focus:ring-accentPrimary/40"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        }
        confirmLabel="Importă"
        onConfirm={handleGrab}
      />
    </div>
  );
}
