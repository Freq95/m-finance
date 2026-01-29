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
      <DialogContent
        className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.08)]"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="text-[#111827]">Settings</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Configure how net cashflow is calculated.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 transition-colors hover:bg-black/[0.04]",
              settings.includeInvestmentsInNetCashflow && "border-[#3B82F6]/30 bg-[#3B82F6]/5"
            )}
            htmlFor="include-investments"
          >
            <span className="text-sm font-medium text-[#111827]">
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
              className="h-4 w-4 rounded border-[#E5E7EB] text-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
            />
          </label>
          <p className="mt-2 text-xs text-[#6B7280]">
            When on, net cashflow = income − expenses − investments. When off,
            investments are excluded from the calculation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
