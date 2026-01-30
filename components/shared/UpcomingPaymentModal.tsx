"use client";

import * as React from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { UpcomingPayment, UpcomingPaymentIconId } from "@/lib/types";
import { UPCOMING_PAYMENT_ICONS } from "@/lib/upcoming-payment-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, edit mode; otherwise create mode */
  editItem: UpcomingPayment | null;
  /** Pre-filled date when adding (YYYY-MM-DD). Used when opening from calendar day click. */
  initialDate?: string;
}

const defaultForm = (): {
  icon: UpcomingPaymentIconId;
  title: string;
  date: string;
  cost: number;
} => ({
  icon: "Home",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  cost: 0,
});

export function UpcomingPaymentModal({
  open,
  onOpenChange,
  editItem,
  initialDate,
}: UpcomingPaymentModalProps) {
  const addUpcomingPayment = useFinanceStore((s) => s.addUpcomingPayment);
  const updateUpcomingPayment = useFinanceStore((s) => s.updateUpcomingPayment);
  const removeUpcomingPayment = useFinanceStore((s) => s.removeUpcomingPayment);
  const dateLocale = useFinanceStore((s) => s.settings.dateLocale);

  const [form, setForm] = React.useState(defaultForm);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const migrateIcon = (icon: string): UpcomingPaymentIconId => {
    if (icon === "Receipt") return "Wallet";
    if (icon === "Calendar") return "Home";
    return icon as UpcomingPaymentIconId;
  };

  React.useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          icon: migrateIcon(editItem.icon),
          title: editItem.title,
          date: editItem.date,
          cost: editItem.cost ?? 0,
        });
      } else {
        setForm({
          ...defaultForm(),
          date: initialDate ?? defaultForm().date,
        });
      }
    }
  }, [open, editItem, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      icon: form.icon,
      title: form.title.trim(),
      date: form.date,
      cost: form.cost === 0 ? null : form.cost,
    };
    if (editItem) {
      updateUpcomingPayment(editItem.id, payload);
    } else {
      addUpcomingPayment(payload);
    }
    onOpenChange(false);
  };

  const handleDeleteConfirm = () => {
    if (editItem) {
      removeUpcomingPayment(editItem.id);
      onOpenChange(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="text-textPrimary dark:text-white">
            {editItem ? "Editează plata" : "Plată viitoare"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary dark:text-white">
              Icon
            </label>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {UPCOMING_PAYMENT_ICONS.map(({ id, Icon, label }) => {
                const isSelected = form.icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, icon: id }))
                    }
                    className={cn(
                      "flex items-center justify-center h-11 w-11 rounded-full border shrink-0",
                      "transition-all duration-200 ease-out",
                      isSelected
                        ? "bg-accentOrange text-white border-accentOrange scale-110 shadow-md shadow-accentOrange/25"
                        : "bg-black/[0.06] dark:bg-white/10 border-transparent hover:bg-black/[0.1] dark:hover:bg-white/20 hover:scale-105 text-textSecondary dark:text-gray-300"
                    )}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="h-6 w-6" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary dark:text-white">
              Titlu
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="ex. Chirie, Asigurare mașină"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary dark:text-white">
              Data
            </label>
            <DatePicker
              value={form.date}
              onChange={(date) => setForm((p) => ({ ...p, date }))}
              locale={dateLocale}
              placeholder="Selectează data"
              required
              name="date"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary dark:text-white">
              Sumă (opțional)
            </label>
            <CurrencyInput
              value={form.cost}
              onChange={(v) => setForm((p) => ({ ...p, cost: v }))}
              placeholder="0"
            />
            <p className="mt-1 text-xs text-textSecondary dark:text-gray-300">
              Lasă 0 dacă nu știi încă suma.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-4 sm:justify-between">
            <div className="flex gap-2">
              {editItem && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-accentNegative hover:bg-accentNegative/10 w-11 p-0 shrink-0 rounded-xl"
                  aria-label="Șterge"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={!form.title.trim()}
                className="min-w-[140px]"
              >
                {editItem ? "Salvează" : "Adaugă"}
              </Button>
            </div>
          </DialogFooter>
        </form>
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
