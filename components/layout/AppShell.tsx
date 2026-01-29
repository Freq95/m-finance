"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { ThemeInjector } from "@/components/shared/ThemeInjector";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDashboard = pathname === "/";

  return (
    <>
      <ThemeInjector />
      <div className="flex min-h-screen bg-gradient-to-b from-background via-[#F2F4F8] to-[#EEF1F5] dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 lg:pl-[72px]">
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
