"use client";

import { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { UpcomingPayment } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, Pencil, Undo2, Check, ChevronDown } from "lucide-react";
import { getUpcomingPaymentIcon } from "@/lib/upcoming-payment-icons";
import { UpcomingPaymentModal } from "@/components/shared/UpcomingPaymentModal";
import { UpcomingPaymentViewModal } from "@/components/shared/UpcomingPaymentViewModal";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

export function RightSidebar() {
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const upcomingPayments = useFinanceStore((s) => s.upcomingPayments);
  const recentActivitiesFromStore = useFinanceStore((s) => s.recentActivities);
  const moveUpcomingToRecent = useFinanceStore((s) => s.moveUpcomingToRecent);
  const moveRecentBackToUpcoming = useFinanceStore((s) => s.moveRecentBackToUpcoming);
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const decimalPlaces = useFinanceStore((s) => s.settings.decimalPlaces);
  const dateLocale = useFinanceStore((s) => s.settings.dateLocale);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UpcomingPayment | null>(
    null
  );
  const [viewingPayment, setViewingPayment] = useState<UpcomingPayment | null>(
    null
  );
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);

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

  return (
    <aside className="hidden lg:flex w-[400px] min-w-[400px] shrink-0 flex-col gap-6 glass-panel border-l border-white/20 dark:border-white/10 p-6 overflow-y-auto rounded-none">
      {/* Upcoming payments */}
      <section className="min-w-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setUpcomingOpen((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-textPrimary dark:text-white"
            aria-expanded={upcomingOpen}
            aria-controls="upcoming-payments-list"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                upcomingOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
            <span>Upcoming Payments ({upcomingPayments.length})</span>
          </button>
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
        {upcomingOpen ? (
          <ul id="upcoming-payments-list" className="space-y-2 mt-3">
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
                      className="flex items-center gap-3 rounded-xl p-3 -mx-1 hover:bg-white/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-normal ease-liquid group cursor-pointer"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-surface border border-white/10">
                        <Icon className="h-4 w-4 text-textSecondary dark:text-gray-300" />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-sm font-medium leading-tight text-textPrimary truncate dark:text-gray-100">
                          {item.title}
                        </p>
                        <p className="text-xs text-textSecondary leading-tight mt-0.5 dark:text-gray-300">
                          {dateLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium text-textPrimary tabular-nums whitespace-nowrap dark:text-gray-100">
                          {item.cost != null
                            ? formatCurrency(
                                item.cost,
                                displayCurrency,
                                exchangeRates,
                                decimalPlaces
                              )
                            : "—"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveUpcomingToRecent(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg glass-surface hover:bg-white/20 dark:hover:bg-white/10 text-accentPositive hover:text-accentPositive dark:text-accentPositive dark:hover:text-accentPositive border border-transparent"
                          aria-label="Marchează ca efectuată (mută la Recent Activities)"
                          title="Marchează ca efectuată"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPayment(item);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg glass-surface hover:bg-white/20 dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all duration-normal shrink-0 dark:hover:text-gray-200 border border-transparent"
                          aria-label="Editează"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })
            ) : (
              <li className="text-xs text-textSecondary py-2 dark:text-gray-300">
                Nicio plată viitoare. Apasă + pentru a adăuga.
              </li>
            )}
          </ul>
        ) : null}
      </section>

      <div className="h-px bg-white/10 dark:bg-white/10" />

      {/* Recent activities — completed upcoming payments */}
      <section>
        <button
          type="button"
          onClick={() => setRecentOpen((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-textPrimary dark:text-white"
          aria-expanded={recentOpen}
          aria-controls="recent-activities-list"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              recentOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span>Recent Activities ({recentActivitiesFromStore.length})</span>
        </button>
        {recentOpen ? (
          <ul id="recent-activities-list" className="space-y-2 mt-3">
            {recentActivitiesFromStore.length ? (
              recentActivitiesFromStore.slice(0, 10).map((activity) => {
                const Icon = getUpcomingPaymentIcon(activity.icon);
                const dateLabel = (() => {
                  try {
                    return format(parseISO(activity.date), "d MMM yyyy", {
                      locale: ro,
                    });
                  } catch {
                    return activity.date;
                  }
                })();
                return (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 rounded-xl p-3 -mx-1 hover:bg-white/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-normal ease-liquid group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-surface border border-white/10">
                      <Icon className="h-4 w-4 text-textSecondary dark:text-gray-300" />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="text-sm font-medium leading-tight text-textPrimary truncate dark:text-gray-100">
                        {activity.title}
                      </p>
                      <p className="text-xs text-textSecondary leading-tight mt-0.5 dark:text-gray-300">
                        {dateLabel}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium text-textPrimary tabular-nums whitespace-nowrap dark:text-gray-100">
                        {activity.cost != null
                          ? formatCurrency(
                              activity.cost,
                              displayCurrency,
                              exchangeRates,
                              decimalPlaces
                            )
                          : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRecentBackToUpcoming(activity.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg glass-surface hover:bg-white/20 dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all duration-normal shrink-0 dark:hover:text-gray-200 border border-transparent"
                        aria-label="Mută înapoi la Upcoming Payments"
                        title="Mută înapoi la Upcoming Payments"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-xs text-textSecondary py-2 dark:text-gray-300">
                Marchează plăți ca efectuate din Upcoming Payments sau din
                notificări.
              </li>
            )}
          </ul>
        ) : null}
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
        onMarkAsDone={moveUpcomingToRecent}
      />
    </aside>
  );
}
