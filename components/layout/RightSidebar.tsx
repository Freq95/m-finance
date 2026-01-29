"use client";

import { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { CATEGORY_SECTIONS } from "@/lib/constants";
import type { CategoryAmounts, UpcomingPayment } from "@/lib/types";
import { formatRON } from "@/lib/utils/currency";
import { formatMonthShort } from "@/lib/utils/date";
import { CreditCard, Plus, Pencil } from "lucide-react";
import { getUpcomingPaymentIcon } from "@/lib/upcoming-payment-icons";
import { UpcomingPaymentModal } from "@/components/shared/UpcomingPaymentModal";
import { UpcomingPaymentViewModal } from "@/components/shared/UpcomingPaymentViewModal";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

const INCOME_AND_SAVINGS_KEYS = [
  "venit",
  "bonuri",
  "extra",
  "economii",
  "investitii",
] as const;

function getTopSpendingCategories(
  data: CategoryAmounts | null,
  limit: number = 4
): { label: string; amount: number }[] {
  if (!data) return [];
  const items = CATEGORY_SECTIONS.flatMap((s) => s.items).filter(
    (item) =>
      !INCOME_AND_SAVINGS_KEYS.includes(
        item.key as (typeof INCOME_AND_SAVINGS_KEYS)[number]
      )
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

export function RightSidebar() {
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const records = useFinanceStore((s) => s.records);
  const getLast12Months = useFinanceStore((s) => s.getLast12Months);
  const getCombinedData = useFinanceStore((s) => s.getCombinedData);
  const upcomingPayments = useFinanceStore((s) => s.upcomingPayments);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UpcomingPayment | null>(
    null
  );
  const [viewingPayment, setViewingPayment] = useState<UpcomingPayment | null>(
    null
  );

  const openAddPayment = () => {
    setEditingPayment(null);
    setViewingPayment(null);
    setPaymentModalOpen(true);
  };
  const openEditPayment = (item: UpcomingPayment) => {
    setEditingPayment(item);
    setViewingPayment(null);
    setPaymentModalOpen(true);
  };
  const openViewPayment = (item: UpcomingPayment) => {
    setViewingPayment(item);
  };
  const handlePaymentModalOpenChange = (open: boolean) => {
    setPaymentModalOpen(open);
    if (!open) setEditingPayment(null);
  };
  const handleViewModalOpenChange = (open: boolean) => {
    if (!open) setViewingPayment(null);
  };
  const handleEditFromView = (item: UpcomingPayment) => {
    setViewingPayment(null);
    setEditingPayment(item);
    setPaymentModalOpen(true);
  };

  const cardHolder =
    selectedPerson === "me"
      ? "Paul"
      : selectedPerson === "wife"
        ? "Codru"
        : "Împreună";

  const last12 = getLast12Months();
  const latestRecord = last12[0];
  const dataForPerson =
    !latestRecord
      ? null
      : selectedPerson === "combined"
        ? getCombinedData(latestRecord.month)
        : latestRecord.people[selectedPerson];
  const recentActivities = getTopSpendingCategories(dataForPerson, 4);
  const activitiesDate = latestRecord
    ? formatMonthShort(latestRecord.month)
    : "—";

  return (
    <aside className="hidden lg:flex w-[320px] shrink-0 flex-col gap-6 glass-panel border-l border-white/20 dark:border-white/10 p-6 overflow-y-auto rounded-none">
      {/* Credit card — frosted dark glass */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827]/90 to-sidebar/90 backdrop-blur-md p-5 text-white shadow-glass overflow-hidden border border-white/10">
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

      {/* Recent activities */}
      <section>
        <h3 className="text-sm font-semibold text-textPrimary mb-0.5 dark:text-gray-100">
          Recent Activities
        </h3>
        <p className="text-xs text-textSecondary mb-3 dark:text-gray-400">
          {activitiesDate}
        </p>
        <ul className="space-y-1">
          {recentActivities.length ? (
            recentActivities.map((a) => (
              <li
                key={a.label}
                className="flex items-center gap-3 rounded-xl p-2.5 -mx-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-normal ease-liquid"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-textPrimary truncate dark:text-gray-200">
                    {a.label}
                  </p>
                </div>
                <span className="text-sm font-semibold text-textPrimary shrink-0 tabular-nums dark:text-gray-200">
                  {formatRON(a.amount)}
                </span>
              </li>
            ))
          ) : (
            <li className="text-xs text-textSecondary py-2 dark:text-gray-400">
              No spending data. Add data in Monthly Input.
            </li>
          )}
        </ul>
      </section>

      {/* Upcoming payments */}
      <section>
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-sm font-semibold text-textPrimary dark:text-gray-100">
            Upcoming Payments
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openAddPayment}
            className="h-8 px-2 rounded-lg"
            aria-label="Adaugă plată viitoare"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-textSecondary mb-3 dark:text-gray-400">
          {upcomingPayments.length
            ? `${upcomingPayments.length} plăți`
            : "Nicio plată"}
        </p>
        <ul className="space-y-1">
          {upcomingPayments.length ? (
            upcomingPayments
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((item) => {
                const Icon = getUpcomingPaymentIcon(item.icon);
                const dateLabel = (() => {
                  try {
                    return format(parseISO(item.date), "d MMM yyyy", {
                      locale: ro,
                    });
                  } catch {
                    return item.date;
                  }
                })();
                return (
                  <li
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openViewPayment(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openViewPayment(item);
                      }
                    }}
                    className="flex items-start gap-3 rounded-xl p-2.5 -mx-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-normal ease-liquid group cursor-pointer"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/10">
                      <Icon className="h-4 w-4 text-textSecondary dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-textPrimary break-words dark:text-gray-200">
                        {item.title}
                      </p>
                      <p className="text-xs text-textSecondary mt-0.5 dark:text-gray-400">
                        {dateLabel}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-textPrimary shrink-0 tabular-nums dark:text-gray-200">
                      {item.cost != null ? formatRON(item.cost) : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditPayment(item);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all duration-normal shrink-0 dark:hover:text-gray-200"
                      aria-label="Editează"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })
          ) : (
            <li className="text-xs text-textSecondary py-2 dark:text-gray-400">
              Nicio plată viitoare. Apasă + pentru a adăuga.
            </li>
          )}
        </ul>
      </section>

      <UpcomingPaymentModal
        open={paymentModalOpen}
        onOpenChange={handlePaymentModalOpenChange}
        editItem={editingPayment}
      />

      <UpcomingPaymentViewModal
        open={!!viewingPayment}
        onOpenChange={handleViewModalOpenChange}
        item={viewingPayment}
        onEdit={handleEditFromView}
      />
    </aside>
  );
}
