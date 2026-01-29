"use client";

import { useFinanceStore } from "@/lib/store/finance-store";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Configure how your dashboard and calculations work.
        </p>
      </div>

      <section className="rounded-2xl bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-1">
          Net cashflow
        </h2>
        <p className="text-sm text-[#6B7280] mb-4">
          Choose whether to include investments (Economii / Investiții) in the
          net cashflow calculation on the dashboard and in history.
        </p>
        <label
          className={cn(
            "flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 transition-colors hover:bg-black/[0.04]",
            settings.includeInvestmentsInNetCashflow &&
              "border-[#3B82F6]/30 bg-[#3B82F6]/5"
          )}
          htmlFor="settings-include-investments"
        >
          <span className="text-sm font-medium text-[#111827]">
            Include investments in net cashflow
          </span>
          <input
            id="settings-include-investments"
            type="checkbox"
            checked={settings.includeInvestmentsInNetCashflow}
            onChange={(e) =>
              updateSettings({
                includeInvestmentsInNetCashflow: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-[#E5E7EB] text-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
          />
        </label>
        <p className="mt-2 text-xs text-[#6B7280]">
          When on: net cashflow = income − expenses − investments. When off:
          investments are excluded.
        </p>
      </section>
    </div>
  );
}
