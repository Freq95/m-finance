"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { PersonView } from "@/lib/types";
import { Calendar, Bell, User, Settings, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDuePaymentsNotification } from "@/lib/useDuePaymentsNotification";
import { DuePaymentsModal } from "@/components/shared/DuePaymentsModal";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Payments updates" },
  "/monthly-input": { title: "Monthly Input", subtitle: "Enter monthly data" },
};

function getPageMeta(pathname: string) {
  for (const path of ["/monthly-input", "/"]) {
    if (path === "/" ? pathname === "/" : pathname.startsWith(path))
      return pageTitles[path];
  }
  return pageTitles["/"];
}

export function Header({
  onOpenSettings,
  onOpenCalendar,
}: {
  onOpenSettings: () => void;
  onOpenCalendar?: () => void;
}) {
  const pathname = usePathname();
  const profiles = useFinanceStore((s) => s.profiles);
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const setSelectedPerson = useFinanceStore((s) => s.setSelectedPerson);
  const theme = useFinanceStore((s) => s.theme);
  const personOptions: { value: PersonView; label: string }[] = [
    ...profiles.map((p) => ({ value: p.id as PersonView, label: p.name })),
    { value: "combined", label: "Împreună" },
  ];
  const toggleTheme = useFinanceStore((s) => s.toggleTheme);
  const exchangeRates = useFinanceStore((s) => s.exchangeRates);
  const { title, subtitle } = getPageMeta(pathname);

  const { duePayments, formatDate } = useDuePaymentsNotification();
  const moveUpcomingToRecent = useFinanceStore((s) => s.moveUpcomingToRecent);
  const [duePaymentsModalOpen, setDuePaymentsModalOpen] = useState(false);

  return (
    <header className="h-16 shrink-0 glass-panel border-b border-white/20 dark:border-white/10 px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-none">
      <div className="flex min-w-0 items-center gap-8">
        <div className="shrink-0">
          <h1 className="text-[22px] font-semibold text-textPrimary tracking-tight truncate dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-textSecondary truncate mt-0.5 dark:text-gray-300">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex justify-center items-center min-w-0">
        <button
          type="button"
          onClick={() => setDuePaymentsModalOpen(true)}
          className={cn(
            "relative rounded-xl p-2.5 transition-all duration-normal ease-liquid border",
            duePayments.length > 0
              ? "border-accentOrange/40 dark:border-accentOrange/50 bg-accentOrange/15 dark:bg-accentOrange/25 hover:bg-accentOrange/20 dark:hover:bg-accentOrange/30"
              : "glass-surface border-transparent text-textSecondary hover:text-textPrimary hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white hover:border-white/20 dark:hover:border-white/10"
          )}
          aria-label={duePayments.length > 0 ? "Vezi plăți viitoare (notificări active)" : "Notificări plăți viitoare"}
        >
          <Bell
            className={cn(
              "h-5 w-5 shrink-0",
              duePayments.length > 0
                ? "text-accentOrange dark:text-accentOrange animate-bell-ring"
                : "text-current"
            )}
            aria-hidden
          />
        </button>
      </div>

      <DuePaymentsModal
        open={duePaymentsModalOpen}
        onOpenChange={setDuePaymentsModalOpen}
        payments={duePayments}
        formatDate={formatDate}
        onMarkAsDone={moveUpcomingToRecent}
      />

      <div className="flex shrink-0 items-center justify-end gap-2">
        {!pathname.startsWith("/monthly-input") &&
          pathname !== "/" &&
          !pathname.startsWith("/settings") && (
          <div
            className="flex rounded-xl glass-surface p-1 border border-white/20 dark:border-white/10"
            role="group"
            aria-label="Profile view"
          >
            {personOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedPerson(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-normal ease-liquid min-w-[4rem] sm:min-w-0",
                  selectedPerson === opt.value
                    ? "bg-white/90 dark:bg-white/20 text-textPrimary dark:text-white shadow-soft border border-white/30 dark:border-white/20"
                    : "text-textSecondary hover:text-textPrimary hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <div
          role="group"
          aria-label="Curs valutar"
          className={cn(
            "inline-flex items-center gap-1 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-2 py-2.5 min-h-[2.5rem]"
          )}
        >
          <span
            className="shrink-0 text-sm font-medium text-textSecondary dark:text-gray-300"
            aria-live="polite"
          >
            {exchangeRates ? `$ ${(1 / exchangeRates.usd).toFixed(2)}` : "$ —"}
          </span>
          <span
            className="w-px h-4 bg-white/20 dark:bg-white/15 shrink-0"
            aria-hidden
          />
          <span
            className="shrink-0 text-sm font-medium text-textSecondary dark:text-gray-300"
            aria-live="polite"
          >
            {exchangeRates ? `€ ${(1 / exchangeRates.eur).toFixed(2)}` : "€ —"}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenCalendar ?? undefined}
          className="rounded-xl p-2.5 glass-surface text-textSecondary hover:bg-white/60 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent hover:border-white/20 dark:hover:border-white/10"
          aria-label="Calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2.5 glass-surface text-textSecondary hover:bg-white/60 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent hover:border-white/20 dark:hover:border-white/10"
          aria-label={
            theme === "dark"
              ? "Comută la modul deschis"
              : "Comută la modul întunecat"
          }
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-xl p-2.5 glass-surface text-textSecondary hover:bg-white/60 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent hover:border-white/20 dark:hover:border-white/10"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        <span className="relative shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-accentPrimary text-white shadow-soft dark:bg-blue-500 border border-white/20">
          <User className="h-4 w-4" />
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-accentPositive shadow-sm"
            aria-hidden="true"
          />
        </span>
      </div>
    </header>
  );
}
