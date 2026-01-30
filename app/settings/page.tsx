"use client";

import { useState, useRef } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/utils/errors";
import { exportBackup, importBackup } from "@/lib/settings/data-io";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const loadRecords = useFinanceStore((s) => s.loadRecords);
  const [dataMessage, setDataMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportBackup();
      setDataMessage({ type: "success", text: "Backup downloaded." });
    } catch (e) {
      setDataMessage({
        type: "error",
        text: getErrorMessage(e),
      });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDataMessage(null);
    try {
      await importBackup(file);
      await loadRecords();
      setDataMessage({
        type: "success",
        text: "Data restored. Current data was replaced.",
      });
    } catch (err) {
      setDataMessage({
        type: "error",
        text: getErrorMessage(err),
      });
    }
    e.target.value = "";
  };

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-textPrimary dark:text-white">Settings</h1>
        <p className="text-sm text-textSecondary dark:text-gray-300 mt-0.5">
          Configure how your dashboard and calculations work.
        </p>
      </div>

      <section className="rounded-2xl glass-panel shadow-soft p-6">
        <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
          Net cashflow
        </h2>
        <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
          Choose whether to include investments (Economii / Investiții) in the
          net cashflow calculation on the dashboard and in history.
        </p>
        <label
          className={cn(
            "flex cursor-pointer items-center justify-between gap-4 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-4 py-3 transition-all duration-normal ease-liquid hover:bg-white/20 dark:hover:bg-white/10",
            settings.includeInvestmentsInNetCashflow &&
              "border-accentPrimary/40 bg-accentPrimary/10 dark:bg-accentPrimary/20"
          )}
          htmlFor="settings-include-investments"
        >
          <span className="text-sm text-textPrimary dark:text-gray-100">
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
            className="h-4 w-4 rounded border-border text-accentPrimary focus:ring-2 focus:ring-accentPrimary/30"
          />
        </label>
        <p className="mt-2 text-xs text-textSecondary dark:text-gray-300">
          When on: net cashflow = income − expenses − investments. When off:
          investments are excluded.
        </p>
      </section>

      <section className="rounded-2xl glass-panel shadow-soft p-6">
        <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">Data</h2>
        <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
          Export a JSON backup of all your data, or restore from a previous
          backup. Import replaces all current data.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Export backup
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="hidden"
            id="settings-import-file"
          />
          <Button variant="secondary" asChild>
            <label
              htmlFor="settings-import-file"
              className="cursor-pointer"
            >
              Import from file
            </label>
          </Button>
        </div>
        {dataMessage && (
          <p
            className={cn(
              "mt-3 text-sm",
              dataMessage.type === "success"
                ? "text-accentPositive"
                : "text-accentNegative"
            )}
          >
            {dataMessage.text}
          </p>
        )}
      </section>
    </div>
  );
}
