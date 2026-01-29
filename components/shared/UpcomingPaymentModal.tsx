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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select } from "@/components/ui/select";

interface UpcomingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, edit mode; otherwise create mode */
  editItem: UpcomingPayment | null;
}

const defaultForm = (): {
  icon: UpcomingPaymentIconId;
  title: string;
  date: string;
  cost: number;
} => ({
  icon: "Receipt",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  cost: 0,
});

export function UpcomingPaymentModal({
  open,
  onOpenChange,
  editItem,
}: UpcomingPaymentModalProps) {
  const addUpcomingPayment = useFinanceStore((s) => s.addUpcomingPayment);
  const updateUpcomingPayment = useFinanceStore((s) => s.updateUpcomingPayment);
  const removeUpcomingPayment = useFinanceStore((s) => s.removeUpcomingPayment);

  const [form, setForm] = React.useState(defaultForm);

  React.useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          icon: editItem.icon,
          title: editItem.title,
          date: editItem.date,
          cost: editItem.cost ?? 0,
        });
      } else {
        setForm(defaultForm());
      }
    }
  }, [open, editItem]);

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

  const handleDelete = () => {
    if (editItem) {
      removeUpcomingPayment(editItem.id);
      onOpenChange(false);
    }
  };

  const SelectedIcon = UPCOMING_PAYMENT_ICONS.find((o) => o.id === form.icon)
    ?.Icon ?? UPCOMING_PAYMENT_ICONS[0].Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.08)]"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="text-textPrimary">
            {editItem ? "Editează plata" : "Plată viitoare"}
          </DialogTitle>
          <DialogDescription className="text-textSecondary">
            {editItem
              ? "Modifică detaliile plății."
              : "Adaugă o plată viitoare (titlu, dată, sumă opțională)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary">
              Icon
            </label>
            <Select
              value={form.icon}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  icon: e.target.value as UpcomingPaymentIconId,
                }))
              }
              className="w-full"
            >
              {UPCOMING_PAYMENT_ICONS.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
            <div className="mt-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.06]">
                <SelectedIcon className="h-5 w-5 text-textSecondary" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary">
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
            <label className="mb-1.5 block text-sm font-medium text-textPrimary">
              Data
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary">
              Sumă (opțional)
            </label>
            <CurrencyInput
              value={form.cost}
              onChange={(v) => setForm((p) => ({ ...p, cost: v }))}
              placeholder="0"
            />
            <p className="mt-1 text-xs text-textSecondary">
              Lasă 0 dacă nu știi încă suma.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-4 sm:justify-between">
            <div className="flex gap-2">
              {editItem && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDelete}
                  className="text-accentNegative hover:bg-accentNegative/10"
                >
                  Șterge
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Anulare
              </Button>
              <Button type="submit" disabled={!form.title.trim()}>
                {editItem ? "Salvează" : "Adaugă"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
