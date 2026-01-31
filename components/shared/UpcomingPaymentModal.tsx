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
import { Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
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
  recurrence: NonNullable<UpcomingPayment["recurrence"]>;
} => ({
  icon: "Home",
  title: "",
  date: format(new Date(), "yyyy-MM-dd"),
  cost: 0,
  recurrence: "none",
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
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [recurrenceOpen, setRecurrenceOpen] = React.useState(false);
  const recurrenceRef = React.useRef<HTMLDivElement | null>(null);

  const recurrenceOptions: { value: NonNullable<UpcomingPayment["recurrence"]>; label: string }[] = [
    { value: "none", label: "Fără recurență" },
    { value: "weekly", label: "Săptămânal" },
    { value: "monthly", label: "Lunar" },
    { value: "yearly", label: "Anual" },
  ];

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
          recurrence: editItem.recurrence ?? "none",
        });
      } else {
        setForm({
          ...defaultForm(),
          date: initialDate ?? defaultForm().date,
        });
      }
      setDateError(null);
      setRecurrenceOpen(false);
    }
  }, [open, editItem, initialDate]);

  React.useEffect(() => {
    if (!recurrenceOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (recurrenceRef.current?.contains(target)) return;
      setRecurrenceOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [recurrenceOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const today = format(new Date(), "yyyy-MM-dd");
    if (form.date < today) {
      setDateError("Data trebuie să fie azi sau în viitor.");
      return;
    }
    const payload = {
      icon: form.icon,
      title: form.title.trim(),
      date: form.date,
      cost: form.cost === 0 ? null : form.cost,
      recurrence: form.recurrence,
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
              onChange={(date) => {
                setForm((p) => ({ ...p, date }));
                const today = format(new Date(), "yyyy-MM-dd");
                setDateError(date < today ? "Data trebuie să fie azi sau în viitor." : null);
              }}
              locale={dateLocale}
              placeholder="Selectează data"
              required
              name="date"
            />
            {dateError && (
              <p className="mt-1 text-xs text-accentNegative">{dateError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary dark:text-white">
              Recurență
            </label>
            <div ref={recurrenceRef} className="relative">
              <button
                type="button"
                onClick={() => setRecurrenceOpen((open) => !open)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-xl border border-white/20 dark:border-white/10",
                  "glass-surface px-3 py-2 text-left text-sm transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentPrimary/30 focus-visible:border-accentPrimary/40",
                  "hover:bg-white/60 dark:hover:bg-white/5",
                  "dark:text-white",
                  recurrenceOpen && "ring-2 ring-accentPrimary/30 border-accentPrimary/40"
                )}
                aria-haspopup="listbox"
                aria-expanded={recurrenceOpen}
              >
                <span className="text-textPrimary dark:text-white">
                  {recurrenceOptions.find((o) => o.value === form.recurrence)?.label ?? "Fără recurență"}
                </span>
                <ChevronDown className="h-4 w-4 text-textMuted dark:text-gray-400" />
              </button>
              {recurrenceOpen && (
                <div
                  className={cn(
                    "absolute z-10 mt-2 w-full rounded-2xl border border-white/20 dark:border-white/10",
                    "bg-[#2C2C2C] shadow-modal p-1"
                  )}
                  role="listbox"
                >
                  {recurrenceOptions.map((option) => {
                    const selected = option.value === form.recurrence;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setForm((p) => ({ ...p, recurrence: option.value }));
                          setRecurrenceOpen(false);
                        }}
                        className={cn(
                          "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                          selected
                            ? "bg-white/10 text-white"
                            : "text-textSecondary hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
