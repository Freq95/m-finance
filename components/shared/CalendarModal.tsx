"use client";

import { useState, useMemo } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { UpcomingPayment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parse,
  getDay,
} from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";
import { getMonthsForYear } from "@/lib/utils/date";
import { getUpcomingPaymentIcon } from "@/lib/upcoming-payment-icons";
import { formatCurrency } from "@/lib/utils/currency";
import { UpcomingPaymentModal } from "@/components/shared/UpcomingPaymentModal";
import { UpcomingPaymentViewModal } from "@/components/shared/UpcomingPaymentViewModal";
import { Button } from "@/components/ui/button";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { MonthString } from "@/lib/types";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Leading empty cells for Monday-based week (0=Sun → 6 empties, 1=Mon → 0, etc.) */
function getLeadingEmptyCount(date: Date): number {
  const d = getDay(date); // 0=Sun, 1=Mon, ..., 6=Sat
  return (d + 6) % 7;
}

function MiniMonthGrid({
  monthString,
  paymentsByDate,
  todayStr,
  onDayClick,
}: {
  monthString: MonthString;
  paymentsByDate: Record<string, number>;
  todayStr: string;
  onDayClick: (dateStr: string) => void;
}) {
  const monthDate = parse(monthString + "-01", "yyyy-MM-dd", new Date());
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmpty = getLeadingEmptyCount(monthStart);

  return (
    <div className="grid grid-cols-7 gap-0.5 text-center">
      {Array.from({ length: leadingEmpty }).map((_, i) => (
        <div key={`empty-${i}`} className="h-4 w-4" />
      ))}
      {days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const count = paymentsByDate[dateStr] ?? 0;
        const isToday = dateStr === todayStr;
        const hasPayment = count > 0;
        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => onDayClick(dateStr)}
            className={cn(
              "h-4 w-4 flex items-center justify-center rounded-sm text-[10px] transition-colors hover:opacity-80",
              isToday && "bg-accentPrimary text-white",
              !isToday && hasPayment && "bg-accentOrange text-white",
              !isToday &&
                !hasPayment &&
                "text-textPrimary dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10"
            )}
            title={hasPayment ? `${count} plăți - click pentru detalii` : "Click pentru a adăuga"}
          >
            {format(day, "d")}
          </button>
        );
      })}
    </div>
  );
}

export function CalendarModal({ open, onOpenChange }: CalendarModalProps) {
  const upcomingPayments = useFinanceStore((s) => s.upcomingPayments);
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const decimalPlaces = useFinanceStore((s) => s.settings.decimalPlaces);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [initialDateForAdd, setInitialDateForAdd] = useState<string | null>(
    null
  );
  const [editingPayment, setEditingPayment] = useState<UpcomingPayment | null>(
    null
  );
  const [viewingPayment, setViewingPayment] = useState<UpcomingPayment | null>(
    null
  );

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const months = useMemo(() => getMonthsForYear(year), [year]);

  const paymentsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of upcomingPayments) {
      const d = p.date;
      map[d] = (map[d] ?? 0) + 1;
    }
    return map;
  }, [upcomingPayments]);

  const paymentsByDateMap = useMemo(() => {
    const map: Record<string, UpcomingPayment[]> = {};
    for (const p of upcomingPayments) {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    }
    for (const arr of Object.values(map)) {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    }
    return map;
  }, [upcomingPayments]);

  const openAddPayment = (dateStr?: string) => {
    setEditingPayment(null);
    setViewingPayment(null);
    setInitialDateForAdd(dateStr ?? null);
    setPaymentModalOpen(true);
  };

  const handleDayClick = (dateStr: string) => {
    const payments = paymentsByDateMap[dateStr] ?? [];
    if (payments.length > 0) {
      openViewPayment(payments[0]);
    } else {
      openAddPayment(dateStr);
    }
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
    if (!open) {
      setEditingPayment(null);
      setInitialDateForAdd(null);
    }
  };
  const handleViewModalOpenChange = (open: boolean) => {
    if (!open) setViewingPayment(null);
  };
  const handleEditFromView = (item: UpcomingPayment) => {
    setViewingPayment(null);
    setEditingPayment(item);
    setPaymentModalOpen(true);
  };

  const sortedPayments = useMemo(
    () =>
      [...upcomingPayments].sort((a, b) => a.date.localeCompare(b.date)),
    [upcomingPayments]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-textPrimary dark:text-white">
                  Calendar
                </DialogTitle>
                <DialogDescription className="text-textSecondary dark:text-gray-300">
                  Vizualizează plățile viitoare pe an.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1 rounded-xl glass-surface border border-white/20 dark:border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setYear((y) => y - 1)}
                  className="rounded-lg p-1.5 text-textSecondary hover:text-textPrimary hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                  aria-label="Anul anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[4rem] text-center text-sm font-medium text-textPrimary dark:text-white">
                  {year}
                </span>
                <button
                  type="button"
                  onClick={() => setYear((y) => y + 1)}
                  className="rounded-lg p-1.5 text-textSecondary hover:text-textPrimary hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                  aria-label="Anul următor"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
            {/* Left: 12-month grid */}
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-auto">
              {months.map((monthStr) => {
                const d = parse(monthStr + "-01", "yyyy-MM-dd", new Date());
                const monthName = format(d, "LLL", { locale: ro });
                return (
                  <div
                    key={monthStr}
                    className="rounded-xl glass-surface border border-white/20 dark:border-white/10 p-3"
                  >
                    <p className="text-xs font-medium text-textSecondary dark:text-gray-300 mb-2">
                      {monthName}
                    </p>
                    <div className="mb-1 grid grid-cols-7 gap-0.5 text-[9px] text-textMuted dark:text-gray-400">
                      {WEEKDAYS.map((w) => (
                        <span key={w} className="text-center truncate">
                          {w}
                        </span>
                      ))}
                    </div>
                    <MiniMonthGrid
                      monthString={monthStr}
                      paymentsByDate={paymentsByDate}
                      todayStr={todayStr}
                      onDayClick={handleDayClick}
                    />
                  </div>
                );
              })}
            </div>

            {/* Right: Payments list */}
            <section className="lg:w-80 xl:w-96 shrink-0 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-white/20 dark:border-white/10 pt-4 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-textPrimary dark:text-white">
                  Toate plățile viitoare
                </h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openAddPayment}
                  className="h-8 w-8 p-0 rounded-full shrink-0"
                  aria-label="Adaugă plată"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto rounded-xl glass-surface border border-white/20 dark:border-white/10 p-2">
                {sortedPayments.length ? (
                  <ul className="space-y-1">
                    {sortedPayments.map((item) => {
                      const Icon = getUpcomingPaymentIcon(item.icon);
                      const isTodayPayment = item.date === todayStr;
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
                          className={cn(
                            "flex items-center gap-3 rounded-xl p-2.5 -mx-1 transition-colors duration-normal ease-liquid group cursor-pointer",
                            isTodayPayment
                              ? "bg-accentPrimary text-white hover:bg-accentPrimary/90"
                              : "hover:bg-white/[0.06] dark:hover:bg-white/[0.08]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                              isTodayPayment
                                ? "bg-white/20 border-white/30"
                                : "glass-surface border-white/10"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4",
                                isTodayPayment
                                  ? "text-white"
                                  : "text-textSecondary dark:text-gray-300"
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm leading-snug truncate",
                                isTodayPayment
                                  ? "text-white"
                                  : "text-textPrimary dark:text-gray-100"
                              )}
                            >
                              {item.title}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                isTodayPayment
                                  ? "text-white/80"
                                  : "text-textSecondary dark:text-gray-300"
                              )}
                            >
                              {dateLabel}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium shrink-0 tabular-nums whitespace-nowrap",
                              isTodayPayment
                                ? "text-white"
                                : "text-textPrimary dark:text-gray-100"
                            )}
                          >
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
                              openEditPayment(item);
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-all duration-normal shrink-0",
                              isTodayPayment
                                ? "opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 text-white"
                                : "opacity-0 group-hover:opacity-100 glass-surface hover:bg-white/20 dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary"
                            )}
                            aria-label="Editează"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-textSecondary py-4 text-center dark:text-gray-300">
                    Nicio plată viitoare. Apasă + pentru a adăuga.
                  </p>
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <UpcomingPaymentModal
        open={paymentModalOpen}
        onOpenChange={handlePaymentModalOpenChange}
        editItem={editingPayment}
        initialDate={initialDateForAdd ?? undefined}
      />

      <UpcomingPaymentViewModal
        open={!!viewingPayment}
        onOpenChange={handleViewModalOpenChange}
        item={viewingPayment}
        onEdit={handleEditFromView}
      />
    </>
  );
}
