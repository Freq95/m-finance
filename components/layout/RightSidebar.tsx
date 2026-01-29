"use client";

import { useFinanceStore } from "@/lib/store/finance-store";
import { CATEGORY_SECTIONS } from "@/lib/constants";
import type { CategoryAmounts } from "@/lib/types";
import { formatRON } from "@/lib/utils/currency";
import { formatMonthShort } from "@/lib/utils/date";
import { Home, Car, CreditCard } from "lucide-react";

const INCOME_AND_SAVINGS_KEYS = [
  "venit",
  "bonuri",
  "extra",
  "economii_investitii",
] as const;

function getTopSpendingCategories(
  data: CategoryAmounts | null,
  limit: number = 4
): { label: string; amount: number }[] {
  if (!data) return [];
  const items = CATEGORY_SECTIONS.flatMap((s) => s.items).filter(
    (item) => !INCOME_AND_SAVINGS_KEYS.includes(item.key as (typeof INCOME_AND_SAVINGS_KEYS)[number])
  );
  const withAmounts = items
    .map((item) => ({
      label: item.label,
      amount: (data[item.key] as number) ?? 0,
    }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  return withAmounts;
}

const upcomingPayments = [
  { icon: Home, label: "Home Rent Pending", amount: 1500 },
  { icon: Car, label: "Car Insurance Pending", amount: 150 },
] as const;

export function RightSidebar() {
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const getLast12Months = useFinanceStore((s) => s.getLast12Months);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);

  const cardHolder =
    selectedPerson === "me"
      ? "Eu"
      : selectedPerson === "wife"
        ? "Soția"
        : "Împreună";

  const last12 = getLast12Months();
  const latestMonth = last12[0]?.month;
  const combinedData = latestMonth ? getCombinedData(latestMonth) : null;
  const recentActivities = getTopSpendingCategories(combinedData, 4);
  const activitiesDate = latestMonth
    ? formatMonthShort(latestMonth)
    : "—";

  return (
    <aside className="hidden lg:flex w-[320px] shrink-0 flex-col gap-6 border-l border-black/[0.06] bg-white/60 backdrop-blur-xl p-6 overflow-y-auto supports-[backdrop-filter]:bg-white/40">
      {/* Credit card — frosted dark with subtle transparency */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827]/95 to-[#1F2937]/95 backdrop-blur-md p-5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-orange-500/25 to-red-500/15 rounded-full -translate-y-1/2 translate-x-1/2 backdrop-blur-sm" />
        <CreditCard className="relative h-5 w-5 text-white/50 mb-5" />
        <p className="relative text-[10px] text-white/50 uppercase tracking-widest mb-0.5">
          Card holder
        </p>
        <p className="relative font-semibold text-sm">{cardHolder}</p>
        <p className="relative mt-5 font-mono text-sm tracking-[0.2em] text-white/90">
          4562 1122 4595 7852
        </p>
        <div className="relative mt-4 flex justify-end">
          <div className="flex -space-x-1">
            <span className="h-6 w-6 rounded-full bg-[#EB001B]" />
            <span className="h-6 w-6 rounded-full bg-[#F79E1B]" />
          </div>
        </div>
      </div>

      {/* Recent activities — top 4 spending categories */}
      <section>
        <h3 className="text-sm font-semibold text-[#111827] mb-0.5">
          Recent Activities
        </h3>
        <p className="text-xs text-[#6B7280] mb-3">{activitiesDate}</p>
        <ul className="space-y-1">
          {recentActivities.length ? (
            recentActivities.map((a) => (
              <li
                key={a.label}
                className="flex items-center gap-3 rounded-xl p-2.5 -mx-1 hover:bg-black/[0.04] transition-colors duration-200"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {a.label}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#111827] shrink-0 tabular-nums">
                  {formatRON(a.amount)}
                </span>
              </li>
            ))
          ) : (
            <li className="text-xs text-[#6B7280] py-2">
              No spending data. Add data in Monthly Input.
            </li>
          )}
        </ul>
      </section>

      {/* Upcoming payments — placeholder UI */}
      <section>
        <h3 className="text-sm font-semibold text-[#111827] mb-0.5">
          Upcoming Payments
        </h3>
        <p className="text-xs text-[#6B7280] mb-3">—</p>
        <ul className="space-y-1">
          {upcomingPayments.map((a) => (
            <li
              key={a.label}
              className="flex items-center gap-3 rounded-xl p-2.5 -mx-1 hover:bg-black/[0.04] transition-colors duration-200"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05]">
                <a.icon className="h-4 w-4 text-[#6B7280]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111827] truncate">
                  {a.label}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#111827] shrink-0 tabular-nums">
                {formatRON(a.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
