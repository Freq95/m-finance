"use client";

import { usePathname } from "next/navigation";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { PersonView } from "@/lib/types";
import { Search, Calendar, Bell, User, Settings, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const personOptions: { value: PersonView; label: string }[] = [
  { value: "me", label: "Paul" },
  { value: "wife", label: "Codru" },
  { value: "combined", label: "Împreună" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Payments updates" },
  "/monthly-input": { title: "Monthly Input", subtitle: "Enter monthly data" },
  "/settings": { title: "Settings", subtitle: "Preferences" },
};

function getPageMeta(pathname: string) {
  for (const path of ["/monthly-input", "/settings", "/"]) {
    if (path === "/" ? pathname === "/" : pathname.startsWith(path))
      return pageTitles[path];
  }
  return pageTitles["/"];
}

export function Header({
  onOpenSettings,
}: {
  onOpenSettings?: () => void;
}) {
  const pathname = usePathname();
  const selectedPerson = useFinanceStore((s) => s.selectedPerson);
  const setSelectedPerson = useFinanceStore((s) => s.setSelectedPerson);
  const theme = useFinanceStore((s) => s.theme);
  const toggleTheme = useFinanceStore((s) => s.toggleTheme);
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <header className="h-16 shrink-0 glass-panel border-b border-white/20 dark:border-white/10 px-6 flex items-center gap-6 rounded-none">
      <div className="flex min-w-0 flex-1 items-center gap-8">
        <div className="shrink-0">
          <h1 className="text-[22px] font-bold text-textPrimary tracking-tight truncate dark:text-gray-100">
            {title}
          </h1>
          <p className="text-sm text-textSecondary truncate mt-0.5 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        <div className="hidden md:block flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted dark:text-gray-500" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-9 h-9 bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 rounded-xl text-sm"
              aria-label="Search"
            />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div
          className="flex rounded-xl bg-black/[0.04] dark:bg-white/10 p-1 border border-black/[0.06] dark:border-white/10"
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
                  ? "bg-white/90 dark:bg-white/20 text-textPrimary dark:text-gray-100 shadow-soft border border-white/30 dark:border-white/20"
                  : "text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded-xl p-2.5 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
          aria-label="Calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
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
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-xl p-2.5 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/settings"
            className="rounded-xl p-2.5 text-textSecondary hover:bg-black/[0.04] hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        )}
        <span className="relative shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-accentPrimary text-white shadow-soft dark:bg-blue-500">
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
