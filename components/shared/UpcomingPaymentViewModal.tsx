"use client";

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
import { formatRON } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

interface UpcomingPaymentViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UpcomingPayment | null;
  onEdit: (item: UpcomingPayment) => void;
}

export function UpcomingPaymentViewModal({
  open,
  onOpenChange,
  item,
  onEdit,
}: UpcomingPaymentViewModalProps) {
  if (!item) return null;

  const Icon = getUpcomingPaymentIcon(item.icon);
  const dateLabel = (() => {
    try {
      return format(parseISO(item.date), "d MMMM yyyy", { locale: ro });
    } catch {
      return item.date;
    }
  })();

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.08)]"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="text-textPrimary flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.06]">
              <Icon className="h-5 w-5 text-textSecondary" />
            </div>
            <span className="break-words">{item.title}</span>
          </DialogTitle>
          <DialogDescription className="text-textSecondary">
            Detalii plată viitoare
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-textSecondary uppercase tracking-wide mb-0.5">
              Titlu
            </p>
            <p className="text-sm text-textPrimary break-words">{item.title}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-textSecondary uppercase tracking-wide mb-0.5">
              Data
            </p>
            <p className="text-sm text-textPrimary">{dateLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-textSecondary uppercase tracking-wide mb-0.5">
              Sumă
            </p>
            <p className="text-sm font-semibold text-textPrimary tabular-nums">
              {item.cost != null ? formatRON(item.cost) : "— (necunoscută)"}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Închide
          </Button>
          <Button onClick={handleEdit}>
            Editează
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
