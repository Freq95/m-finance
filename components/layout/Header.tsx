"use client";

import { usePathname } from "next/navigation";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { PersonView } from "@/lib/types";
import { Search, Calendar, Bell, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const personOptions: { value: PersonView; label: string }[] = [
  { value: "me", label: "Eu" },
  { value: "wife", label: "Soția" },
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
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <header className="h-16 shrink-0 border-b border-black/[0.06] bg-white/70 backdrop-blur-xl px-6 flex items-center gap-6 supports-[backdrop-filter]:bg-white/50">
      <div className="flex min-w-0 flex-1 items-center gap-8">
        <div className="shrink-0">
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight truncate">
            {title}
          </h1>
          <p className="text-sm text-[#6B7280] truncate mt-0.5">{subtitle}</p>
        </div>
        <div className="hidden md:block flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-9 h-9 bg-black/[0.04] hover:bg-black/[0.06] border-0 rounded-xl text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 focus-visible:bg-white"
              aria-label="Search"
            />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* Segmented control: Eu | Soția | Împreună */}
        <div
          className="flex rounded-xl bg-black/[0.05] p-1 border border-black/[0.06]"
          role="group"
          aria-label="Profile view"
        >
          {personOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedPerson(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 min-w-[4rem] sm:min-w-0",
                selectedPerson === opt.value
                  ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-black/[0.03]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded-xl p-2.5 text-[#6B7280] hover:bg-black/[0.05] hover:text-[#111827] transition-all duration-200"
          aria-label="Calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-[#6B7280] hover:bg-black/[0.05] hover:text-[#111827] transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />
        </button>
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-xl p-2.5 text-[#6B7280] hover:bg-black/[0.05] hover:text-[#111827] transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/settings"
            className="rounded-xl p-2.5 text-[#6B7280] hover:bg-black/[0.05] hover:text-[#111827] transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        )}
        <span className="relative shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-sm">
          <User className="h-4 w-4" />
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22c55e] shadow-sm"
            aria-hidden="true"
          />
        </span>
      </div>
    </header>
  );
}
