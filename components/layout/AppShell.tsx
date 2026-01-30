"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { CalendarModal } from "@/components/shared/CalendarModal";
import { ThemeInjector } from "@/components/shared/ThemeInjector";
import { useFinanceStore } from "@/lib/store/finance-store";
import { fetchExchangeRates } from "@/lib/utils/currency";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const setExchangeRates = useFinanceStore((s) => s.setExchangeRates);
  const displayCurrency = useFinanceStore((s) => s.displayCurrency);
  const defaultPersonView = useFinanceStore((s) => s.settings.defaultPersonView);
  const setSelectedPerson = useFinanceStore((s) => s.setSelectedPerson);
  const hasAppliedDefaultRef = useRef(false);

  // Apply default person view once on first load when not "last used"
  useEffect(() => {
    if (hasAppliedDefaultRef.current || defaultPersonView === "last_used") return;
    hasAppliedDefaultRef.current = true;
    setSelectedPerson(defaultPersonView);
  }, [defaultPersonView, setSelectedPerson]);

  // Fetch exchange rates on app load and when display currency changes,
  // so Header shows $/€ values on every page (monthly-input, dashboard).
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
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
          <div className="flex flex-1">
            <main className="flex-1 min-w-0 overflow-auto p-6 lg:p-8">
              {children}
            </main>
            <RightSidebar />
          </div>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CalendarModal open={calendarOpen} onOpenChange={setCalendarOpen} />
    </>
  );
}
