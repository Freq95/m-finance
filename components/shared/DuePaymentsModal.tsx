"use client";

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

interface DuePaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: UpcomingPayment[];
  formatDate: (dateStr: string) => string;
}

export function DuePaymentsModal({
  open,
  onOpenChange,
  payments,
  formatDate,
}: DuePaymentsModalProps) {
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const decimalPlaces = useFinanceStore((s) => s.settings.decimalPlaces);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
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
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-white/20 dark:border-white/10",
                      "glass-surface p-3 text-left"
                    )}
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
