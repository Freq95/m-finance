"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { SettingsModal } from "@/components/shared/SettingsModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDashboard = pathname === "/";

  return (
    <>
      <div className="flex min-h-screen bg-gradient-to-b from-[#F5F7FA] via-[#F2F4F8] to-[#EEF1F5]">
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
