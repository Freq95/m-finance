"use client";

import * as React from "react";
import type { UpcomingPayment } from "@/lib/types";
import { getUpcomingPaymentIcon } from "@/lib/upcoming-payment-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { useFinanceStore } from "@/lib/store/finance-store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface DuePaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: UpcomingPayment[];
  formatDate: (dateStr: string) => string;
  onMarkAsDone?: (id: string) => void;
}

export function DuePaymentsModal({
  open,
  onOpenChange,
  payments,
  formatDate,
  onMarkAsDone,
}: DuePaymentsModalProps) {
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const decimalPlaces = useFinanceStore((s) => s.settings.decimalPlaces);
  const [exitingId, setExitingId] = React.useState<string | null>(null);

  const handleMarkAsDone = (id: string) => {
    if (!onMarkAsDone) return;
    setExitingId(id);
  };

  const handleRowAnimationEnd = (e: React.AnimationEvent<HTMLLIElement>, id: string) => {
    if (e.animationName !== "due-payment-row-out") return;
    onMarkAsDone?.(id);
    setExitingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-textPrimary dark:text-white">
            Plăți viitoare (notificări)
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {payments.length === 0 ? (
            <p className="text-sm text-textSecondary dark:text-gray-300 py-4 text-center">
              Nu există plăți în perioada de notificare.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {payments.map((item) => {
                const Icon = getUpcomingPaymentIcon(item.icon);
                const isExiting = exitingId === item.id;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-white/20 dark:border-white/10",
                      "glass-surface p-3 text-left",
                      isExiting && "animate-due-payment-row-out pointer-events-none"
                    )}
                    onAnimationEnd={(e) => isExiting && handleRowAnimationEnd(e, item.id)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.06] dark:bg-white/10">
                      <Icon className="h-5 w-5 text-textSecondary dark:text-gray-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-textPrimary dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-textSecondary dark:text-gray-300 mt-0.5">
                        {formatDate(item.date)}
                        {item.cost != null && (
                          <span className="tabular-nums ml-2">
                            · {formatCurrency(item.cost, displayCurrency, exchangeRates, decimalPlaces)}
                          </span>
                        )}
                      </p>
                    </div>
                    {onMarkAsDone && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkAsDone(item.id)}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5",
                          "border-accentPositive/40 bg-accentPositive/10 dark:bg-accentPositive/20 text-accentPositive hover:bg-accentPositive/15 dark:hover:bg-accentPositive/25"
                        )}
                        aria-label="Mark as done (move to Recent Activities)"
                      >
                        <Check className="h-4 w-4" />
                        Done
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Închide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
