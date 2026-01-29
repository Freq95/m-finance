"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  calculateIncomeTotal,
  calculateBillsTotal,
  calculateExpensesTotal,
  calculateNetCashflow,
  combineCategoryAmounts,
} from "@/lib/calculations/calculations";
import { formatRON } from "@/lib/utils/currency";
import { formatMonthShort } from "@/lib/utils/date";
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
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

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

export default function Home() {
  const loadRecords = useFinanceStore((s) => s.loadRecords);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const getLast12Months = useFinanceStore((s) => s.getLast12Months);
  const getLast6Months = useFinanceStore((s) => s.getLast6Months);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const includeInv = useFinanceStore((s) => s.settings.includeInvestmentsInNetCashflow);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const last12 = getLast12Months();
  const last6 = getLast6Months();

  const currentData = (() => {
    const latest = last12[0];
    if (!latest) return null;
    const data = getCombinedData(latest.month);
    if (!data) return null;
    return {
      income: calculateIncomeTotal(data),
      bills: calculateBillsTotal(data),
      expenses: calculateExpensesTotal(data),
      cashflow: calculateNetCashflow(data, includeInv),
    };
  })();

  const chartData = last12
    .slice()
    .reverse()
    .map((r) => {
      const d = getCombinedData(r.month);
      const expenses = d ? calculateExpensesTotal(d) : 0;
      return {
        month: formatMonthShort(r.month).split(" ")[0],
        full: formatMonthShort(r.month),
        expense: expenses,
      };
    });

  const maxExpense = Math.max(...chartData.map((d) => d.expense), 1);

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
                : "text-[#111827]"
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
                    className="rounded-xl p-1.5 text-[#9CA3AF] hover:bg-black/[0.05] hover:text-[#111827] -mr-1 -mt-1 transition-colors duration-200"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-[#6B7280] mb-1">{m.label}</p>
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
              <h2 className="text-lg font-bold text-[#111827]">Balance</h2>
              <p className="text-2xl lg:text-3xl font-bold text-[#111827] mt-0.5">
                {currentData
                  ? formatRON(currentData.cashflow)
                  : "0,00 RON"}
              </p>
            </div>
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
              Past 30 days
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
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${v / 1000}K` : String(v)
                    }
                    domain={[0, Math.max(maxExpense * 1.15, 1000)]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                          <p className="text-xs text-[#6B7280]">{d.full}</p>
                          <p className="text-sm font-semibold text-[#111827]">
                            Expense {formatRON(d.expense)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="expense" radius={[6, 6, 0, 0]} fill="#1F2937">
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#1F2937" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-[#6B7280] text-sm rounded-2xl bg-black/[0.02]">
              Completează date în Monthly Input pentru grafic.
            </div>
          )}
        </div>
      </div>

      {/* History — frosted card */}
      <section>
        <h2 className="text-lg font-bold text-[#111827]">History</h2>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Transaction of last 6 months
        </p>
        <div className="mt-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          {last6.length ? (
            <ul className="divide-y divide-black/[0.06]">
              {last6.map((r, idx) => {
                const data = getCombinedData(r.month);
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
                      <User className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#111827] text-sm">
                        {formatMonthShort(r.month)}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {format(parseISO(r.meta.updatedAt), "hh:mm:ss a", {
                          locale: ro,
                        })}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        cashflow >= 0
                          ? "text-[#10B981]"
                          : "text-[#EF4444]"
                      }`}
                    >
                      {formatRON(cashflow)}
                    </p>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-xl ${
                        r.meta.isSaved
                          ? "bg-[#D1FAE5]/80 text-[#065F46]"
                          : "bg-[#FEF3C7]/80 text-[#92400E]"
                      }`}
                    >
                      {r.meta.isSaved ? "Completed" : "Draft"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center text-[#6B7280] text-sm rounded-2xl bg-black/[0.02]">
              No records. Add data in Monthly Input.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
