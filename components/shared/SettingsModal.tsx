"use client";

import { useState, useRef } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/utils/errors";
import { exportBackup, importBackup } from "@/lib/settings/data-io";
import { fetchExchangeRates } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PersonView, ProfileId } from "@/lib/types";
import { Pencil, Trash2, Plus } from "lucide-react";

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const profiles = useFinanceStore((s) => s.profiles);
  const addProfile = useFinanceStore((s) => s.addProfile);
  const removeProfile = useFinanceStore((s) => s.removeProfile);
  const renameProfile = useFinanceStore((s) => s.renameProfile);
  const setProfiles = useFinanceStore((s) => s.setProfiles);
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const loadRecords = useFinanceStore((s) => s.loadRecords);
  const resetAllData = useFinanceStore((s) => s.resetAllData);
  const setExchangeRates = useFinanceStore((s) => s.setExchangeRates);
  const exchangeRatesUpdatedAt = useFinanceStore((s) => s.exchangeRatesUpdatedAt);
  const [removeProfileId, setRemoveProfileId] = useState<ProfileId | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<ProfileId | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [dataMessage, setDataMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [refreshingRates, setRefreshingRates] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: "full" | "data_only" = "full") => {
    try {
      await exportBackup(format, format === "full" ? profiles : undefined);
      setDataMessage({
        type: "success",
        text: format === "data_only" ? "Data backup downloaded." : "Full backup downloaded.",
      });
    } catch (e) {
      setDataMessage({
        type: "error",
        text: getErrorMessage(e),
      });
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPendingImportFile(file);
    setImportConfirmOpen(true);
  };

  const handleImportConfirm = async () => {
    if (!pendingImportFile) return;
    setDataMessage(null);
    try {
      const payload = await importBackup(pendingImportFile);
      if (payload.profiles && payload.profiles.length > 0) {
        setProfiles(payload.profiles);
      }
      await loadRecords();
      setDataMessage({
        type: "success",
        text: "Data restored. Current data was replaced.",
      });
      setPendingImportFile(null);
    } catch (err) {
      setDataMessage({
        type: "error",
        text: getErrorMessage(err),
      });
    }
  };

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      const rates = await fetchExchangeRates();
      setExchangeRates(rates ?? null);
      setDataMessage(rates ? { type: "success", text: "Exchange rates updated." } : { type: "error", text: "Could not fetch rates." });
    } catch (e) {
      setDataMessage({ type: "error", text: getErrorMessage(e) });
    } finally {
      setRefreshingRates(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      await resetAllData();
      setClearConfirmOpen(false);
      onOpenChange(false);
    } catch (e) {
      setDataMessage({ type: "error", text: getErrorMessage(e) });
    }
  };

  const formatRatesUpdated = () => {
    if (!exchangeRatesUpdatedAt) return null;
    const d = new Date(exchangeRatesUpdatedAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} h ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-textPrimary dark:text-white">
              Settings
            </DialogTitle>
            <DialogDescription className="text-textSecondary dark:text-gray-300">
              Configure how your dashboard and calculations work.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <section>
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
                htmlFor="settings-modal-include-investments"
              >
                <span className="text-sm text-textPrimary dark:text-gray-100">
                  Include investments in net cashflow
                </span>
                <input
                  id="settings-modal-include-investments"
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

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Profiles
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Add, rename, or hide profiles. Hidden profiles keep their data but are not shown.
              </p>
              <ul className="space-y-2 mb-3">
                {profiles.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-2"
                  >
                    {editingProfileId === p.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameProfile(p.id, editingName);
                              setEditingProfileId(null);
                            }
                            if (e.key === "Escape") setEditingProfileId(null);
                          }}
                          autoFocus
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            renameProfile(p.id, editingName);
                            setEditingProfileId(null);
                          }}
                        >
                          OK
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-textPrimary dark:text-white">
                          {p.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileId(p.id);
                            setEditingName(p.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-textSecondary"
                          aria-label="Redenumește"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoveProfileId(p.id)}
                          className="p-1.5 rounded-lg hover:bg-accentNegative/10 text-accentNegative"
                          aria-label="Ascunde profil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Nume profil nou"
                  className="max-w-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addProfile(newProfileName);
                      setNewProfileName("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    addProfile(newProfileName);
                    setNewProfileName("");
                  }}
                  disabled={!newProfileName.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adaugă profil
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Default view
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Which view to show when you open the app.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ defaultPersonView: "last_used" })}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                    settings.defaultPersonView === "last_used"
                      ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                      : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10 dark:text-gray-300"
                  )}
                >
                  Last used
                </button>
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateSettings({ defaultPersonView: p.id })}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                      settings.defaultPersonView === p.id
                        ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                        : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10 dark:text-gray-300"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => updateSettings({ defaultPersonView: "combined" })}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                    settings.defaultPersonView === "combined"
                      ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                      : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10 dark:text-gray-300"
                  )}
                >
                  Împreună
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Amount display
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Number of decimal places for currency amounts.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ decimalPlaces: 0 })}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                    settings.decimalPlaces === 0
                      ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                      : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10"
                  )}
                >
                  No decimals
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ decimalPlaces: 2 })}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                    settings.decimalPlaces === 2
                      ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                      : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10"
                  )}
                >
                  2 decimals
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Date format
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Locale for month names (e.g. in charts).
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ dateLocale: "ro" })}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                    settings.dateLocale === "ro"
                      ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                      : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10"
                  )}
                >
                  Romanian (Ian 2026)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ dateLocale: "en" })}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                    settings.dateLocale === "en"
                      ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                      : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10"
                  )}
                >
                  English (Jan 2026)
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Exchange rates
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Refresh RON/USD and RON/EUR rates used for display.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleRefreshRates}
                  disabled={refreshingRates}
                >
                  {refreshingRates ? "Refreshing…" : "Refresh rates"}
                </Button>
                {exchangeRatesUpdatedAt && (
                  <span className="text-xs text-textSecondary dark:text-gray-300">
                    Updated {formatRatesUpdated()}
                  </span>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Notifications
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Remind before upcoming payments. You can choose how many days in advance to be notified.
              </p>
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-4 py-3 transition-all duration-normal ease-liquid hover:bg-white/20 dark:hover:bg-white/10",
                  settings.notificationsEnabled &&
                    "border-accentPrimary/40 bg-accentPrimary/10 dark:bg-accentPrimary/20"
                )}
                htmlFor="settings-modal-notifications"
              >
                <span className="text-sm text-textPrimary dark:text-gray-100">
                  Remind before upcoming payments
                </span>
                <input
                  id="settings-modal-notifications"
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) =>
                    updateSettings({ notificationsEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border text-accentPrimary focus:ring-2 focus:ring-accentPrimary/30"
                />
              </label>
              <p className="mt-2 text-xs text-textSecondary dark:text-gray-300 mb-3">
                Notifications will remind you {settings.notificationsDaysBefore} day(s) before each payment.
              </p>
              <div className="flex flex-wrap gap-2">
                {([1, 3, 7, 14, 31] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updateSettings({ notificationsDaysBefore: days })}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                      settings.notificationsDaysBefore === days
                        ? "bg-accentPrimary/20 border-accentPrimary/40 text-textPrimary dark:text-white"
                        : "glass-surface border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/20 dark:hover:bg-white/10 dark:text-gray-300"
                    )}
                  >
                    {days} {days === 1 ? "day" : "days"}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Data
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Export a JSON backup or restore from a previous backup. Import replaces all current data.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={() => handleExport("full")}>
                  Export full backup
                </Button>
                <Button variant="secondary" onClick={() => handleExport("data_only")}>
                  Export data only
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFileSelect}
                  className="hidden"
                  id="settings-modal-import-file"
                />
                <Button variant="secondary" asChild>
                  <label
                    htmlFor="settings-modal-import-file"
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

            <section>
              <h2 className="text-lg font-medium text-textPrimary dark:text-white mb-1">
                Clear all data
              </h2>
              <p className="text-sm text-textSecondary dark:text-gray-300 mb-4">
                Delete all month data and reset settings, theme, and upcoming payments. You cannot undo this.
              </p>
              <Button
                variant="secondary"
                onClick={() => setClearConfirmOpen(true)}
                className="border-accentNegative/40 text-accentNegative hover:bg-accentNegative/10"
              >
                Clear all data
              </Button>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Clear all data?"
        description="This will delete all month data and reset settings, theme, currency, and upcoming payments. You cannot undo this."
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        onConfirm={handleClearAllData}
        variant="danger"
      />

      <ConfirmationModal
        open={importConfirmOpen}
        onOpenChange={(open) => {
          setImportConfirmOpen(open);
          if (!open) setPendingImportFile(null);
        }}
        title="Import from file?"
        description="Replace current data with backup? Existing data will be overwritten."
        confirmLabel="Import"
        cancelLabel="Cancel"
        onConfirm={handleImportConfirm}
      />

      <ConfirmationModal
        open={!!removeProfileId}
        onOpenChange={(open) => !open && setRemoveProfileId(null)}
        title="Ascunde profil?"
        description="Profilul va fi ascuns din listă. Datele rămân salvate. Poți adăuga din nou un profil mai târziu."
        confirmLabel="Ascunde"
        cancelLabel="Anulare"
        onConfirm={() => {
          if (removeProfileId) {
            removeProfile(removeProfileId);
            setRemoveProfileId(null);
          }
        }}
        variant="danger"
      />
    </>
  );
}
