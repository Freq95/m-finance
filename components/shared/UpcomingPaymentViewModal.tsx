"use client";

import * as React from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { UpcomingPayment } from "@/lib/types";
import { getUpcomingPaymentIcon } from "@/lib/upcoming-payment-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";

const EXIT_DURATION_MS = 360;

interface UpcomingPaymentViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UpcomingPayment | null;
  onEdit: (item: UpcomingPayment) => void;
  onMarkAsDone?: (id: string) => void;
}

export function UpcomingPaymentViewModal({
  open,
  onOpenChange,
  item,
  onEdit,
  onMarkAsDone,
}: UpcomingPaymentViewModalProps) {
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const decimalPlaces = useFinanceStore((s) => s.settings.decimalPlaces);
  const removeUpcomingPayment = useFinanceStore((s) => s.removeUpcomingPayment);
  const [exitingForDone, setExitingForDone] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const exitTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!open) {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [open]);

  if (!item) return null;

  const Icon = getUpcomingPaymentIcon(item.icon);
  const dateLabel = (() => {
    try {
      return format(parseISO(item.date), "d MMMM yyyy", { locale: ro });
    } catch {
      return item.date;
    }
  })();
  const recurrenceLabel = (() => {
    switch (item.recurrence) {
      case "weekly":
        return "Săptămânal";
      case "monthly":
        return "Lunar";
      case "yearly":
        return "Anual";
      default:
        return "Fără recurență";
    }
  })();

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(item);
  };

  const handleMarkAsDone = () => {
    setExitingForDone(true);
    exitTimeoutRef.current = setTimeout(() => {
      exitTimeoutRef.current = null;
      onMarkAsDone?.(item.id);
      onOpenChange(false);
      setExitingForDone(false);
    }, EXIT_DURATION_MS);
  };

  const handleDeleteConfirm = () => {
    removeUpcomingPayment(item.id);
    setDeleteConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div
          className={cn(
            "transition-all duration-[360ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
            exitingForDone && "opacity-0 scale-95 pointer-events-none"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-textPrimary dark:text-white flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.06]">
                <Icon className="h-5 w-5 text-textSecondary dark:text-gray-300" />
              </div>
              <span className="break-words">{item.title}</span>
            </DialogTitle>
            <DialogDescription className="text-textSecondary dark:text-gray-300">
              Detalii plată viitoare
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-textSecondary dark:text-gray-300 uppercase tracking-wide mb-0.5">
                Titlu
              </p>
              <p className="text-sm text-textPrimary dark:text-white break-words">{item.title}</p>
            </div>
            <div>
              <p className="text-xs text-textSecondary dark:text-gray-300 uppercase tracking-wide mb-0.5">
                Data
              </p>
              <p className="text-sm text-textPrimary dark:text-white">{dateLabel}</p>
            </div>
            <div>
              <p className="text-xs text-textSecondary dark:text-gray-300 uppercase tracking-wide mb-0.5">
                Recurență
              </p>
              <p className="text-sm text-textPrimary dark:text-white">{recurrenceLabel}</p>
            </div>
            <div>
              <p className="text-xs text-textSecondary dark:text-gray-300 uppercase tracking-wide mb-0.5">
                Sumă
              </p>
              <p className="text-sm text-textPrimary dark:text-white tabular-nums">
                {item.cost != null ? formatCurrency(item.cost, displayCurrency, exchangeRates, decimalPlaces) : "— (necunoscută)"}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-2 border-accentOrange/40 bg-accentOrange/10 dark:bg-accentOrange/20 text-accentOrange hover:bg-accentOrange/15 dark:hover:bg-accentOrange/25"
              aria-label="Șterge plată"
            >
              <Trash2 className="h-4 w-4" />
              Șterge
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleMarkAsDone}
              className={cn(
                "inline-flex items-center gap-2",
                onMarkAsDone && "border-accentPositive/40 bg-accentPositive/10 dark:bg-accentPositive/20 text-accentPositive hover:bg-accentPositive/15 dark:hover:bg-accentPositive/25"
              )}
              disabled={!onMarkAsDone}
              aria-label="Mark as done (move to Recent Activities)"
            >
              <Check className="h-4 w-4" />
              Done
            </Button>
            <Button onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1.5" aria-hidden />
              Editează
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmationModal
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      title="Ștergi această plată viitoare?"
      description="Plata va fi ștearsă definitiv. Nu poți reveni."
      confirmLabel="Șterge"
      onConfirm={handleDeleteConfirm}
      variant="danger"
    />
  </>
  );
}
