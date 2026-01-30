"use client";

import { useFinanceStore } from "@/lib/store/finance-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="text-textPrimary">Settings</DialogTitle>
          <DialogDescription className="text-textSecondary">
            Configure how net cashflow is calculated.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-4 py-3 transition-all duration-normal ease-liquid hover:bg-white/20 dark:hover:bg-white/10",
              settings.includeInvestmentsInNetCashflow && "border-accentPrimary/40 bg-accentPrimary/10 dark:bg-accentPrimary/20"
            )}
            htmlFor="include-investments"
          >
            <span className="text-sm font-medium text-textPrimary">
              Include investments in net cashflow
            </span>
            <input
              id="include-investments"
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
          <p className="mt-2 text-xs text-textSecondary">
            When on, net cashflow = income − expenses − investments. When off,
            investments are excluded from the calculation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
