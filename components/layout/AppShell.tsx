"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { ThemeInjector } from "@/components/shared/ThemeInjector";
import { useFinanceStore } from "@/lib/store/finance-store";
import { fetchExchangeRates } from "@/lib/utils/currency";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDashboard = pathname === "/";
  const setExchangeRates = useFinanceStore((s) => s.setExchangeRates);
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);

  // Fetch exchange rates on app load and when display currency changes,
  // so Header shows $/€ values on every page (settings, monthly-input, dashboard).
  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, [setExchangeRates]);

  useEffect(() => {
    if (displayCurrency !== "RON") {
      fetchExchangeRates().then(setExchangeRates);
    }
  }, [displayCurrency, setExchangeRates]);

  return (
    <>
      <ThemeInjector />
      <div className="flex min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-background-deep/60 via-transparent to-background-deep/60 dark:from-black/50 dark:via-transparent dark:to-black/50 pointer-events-none" aria-hidden />
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 lg:pl-[72px] relative">
          <Header
            onOpenSettings={isDashboard ? () => setSettingsOpen(true) : undefined}
          />
          <div className="flex flex-1">
            <main className="flex-1 min-w-0 overflow-auto p-6 lg:p-8">
              {children}
            </main>
            <RightSidebar />
          </div>
        </div>
      </div>
      {isDashboard && (
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
}
