"use client";

import * as React from "react";
import { useDebouncedCallback } from "use-debounce";
import { useFinanceStore } from "@/lib/store/finance-store";
import { createDefaultCategoryAmounts } from "@/lib/validation/schemas";
import type { CategoryAmounts, MonthString, ProfileId } from "@/lib/types";
import {
  getPreviousMonth,
  getNextMonth,
  getCurrentMonth,
  formatMonthShort,
  monthStringToDate,
} from "@/lib/utils/date";
import { format, parseISO } from "date-fns";
import {
  sumCategoryAmounts,
  calculateIncomeTotal,
  calculateBillsTotal,
  calculateExpensesTotal,
  calculateNetCashflow,
} from "@/lib/calculations/calculations";
import { formatRON } from "@/lib/utils/currency";
import { CATEGORY_SECTIONS } from "@/lib/constants";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { SegmentDivider, segmentPanelStyles } from "@/components/shared/SegmentPanel";
import { Save, Copy, RotateCcw, TrendingUp, Receipt, Wallet, PiggyBank, Landmark, Minus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ro } from "date-fns/locale";

export function MonthlyInputClient() {
  const loadRecords = useFinanceStore((s) => s.loadRecords);
  const clearError = useFinanceStore((s) => s.clearError);
  const error = useFinanceStore((s) => s.error);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const setSelectedMonth = useFinanceStore((s) => s.setSelectedMonth);
  const records = useFinanceStore((s) => s.records);
  const getCurrentMonthRecord = useFinanceStore((s) => s.getCurrentMonthRecord);
  const updateMonthFull = useFinanceStore((s) => s.updateMonthFull);
  const saveMonth = useFinanceStore((s) => s.saveMonth);
  const profiles = useFinanceStore((s) => s.profiles);
  const duplicateMonth = useFinanceStore((s) => s.duplicateMonth);
  const resetMonth = useFinanceStore((s) => s.resetMonth);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const isSaving = useFinanceStore((s) => s.isSaving);
  const settings = useFinanceStore((s) => s.settings);

  const [formData, setFormData] = React.useState<Record<ProfileId, CategoryAmounts>>({});
  const formDataRef = React.useRef(formData);
  formDataRef.current = formData;

  const [initKey, setInitKey] = React.useState(0);
  const [dupDialogOpen, setDupDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const initFromStore = React.useCallback(() => {
    const r = getCurrentMonthRecord();
    const def = createDefaultCategoryAmounts();
    const next: Record<ProfileId, CategoryAmounts> = {};
    for (const p of profiles) {
      next[p.id] = r?.people[p.id]
        ? { ...r.people[p.id] }
        : { ...def };
    }
    setFormData(next);
  }, [getCurrentMonthRecord, profiles]);

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  React.useEffect(() => {
    if (profiles.length > 0) initFromStore();
  }, [selectedMonth, initKey, initFromStore, profiles.length]);

  const flush = useDebouncedCallback(
    () => {
      updateMonthFull(selectedMonth, formDataRef.current);
    },
    1000,
    { flushOnExit: true }
  );

  const updateField = React.useCallback(
    (person: ProfileId, key: keyof CategoryAmounts, value: number) => {
      setFormData((prev) => ({
        ...prev,
        [person]: { ...(prev[person] ?? createDefaultCategoryAmounts()), [key]: value },
      }));
      flush();
    },
    [flush]
  );

  const handleSave = async () => {
    flush.cancel();
    updateMonthFull(selectedMonth, formDataRef.current);
    await saveMonth(selectedMonth);
    initFromStore();
  };

  const prevMonth = getPreviousMonth(selectedMonth);
  const hasPrevRecord = useFinanceStore((s) =>
    s.records.some((r) => r.month === prevMonth)
  );

  const handleDuplicate = () => {
    duplicateMonth(prevMonth, selectedMonth);
    setInitKey((k) => k + 1);
    setDupDialogOpen(false);
  };

  const handleReset = () => {
    resetMonth(selectedMonth);
    setInitKey((k) => k + 1);
    setResetDialogOpen(false);
  };

  const record = getCurrentMonthRecord();
  const combinedForFooter =
    profiles.length > 0
      ? sumCategoryAmounts(
          profiles.map((p) => formData[p.id] ?? createDefaultCategoryAmounts())
        )
      : createDefaultCategoryAmounts();
  const includeInvestmentsInNetCashflow = settings.includeInvestmentsInNetCashflow;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="space-y-6 pb-32">
        <div className="rounded-2xl glass-panel shadow-soft p-8 text-center">
          <p className="text-textSecondary dark:text-gray-300 mb-2">
            Nu există profiluri. Adaugă cel puțin un profil în Setări pentru a introduce date.
          </p>
          <p className="text-sm text-textSecondary dark:text-gray-400">
            Deschide Setări (icon roată) și secțiunea &quot;Profiles&quot; → Adaugă profil.
          </p>
        </div>
      </div>
    );
  }

  const gridTemplateColumns = `minmax(0,1fr) ${profiles.map(() => "minmax(140px,1fr)").join(" ")}`;

  return (
    <div className="space-y-6 pb-32">
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => (error === "Failed to save" ? saveMonth(selectedMonth) : loadRecords())}
          onDismiss={clearError}
          retryLabel={error === "Failed to save" ? "Salvează din nou" : "Reîncarcă"}
        />
      )}
      {/* Period + actions — same panel style as Dashboard */}
      <div className="rounded-2xl glass-panel shadow-soft p-4">
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          <button
            type="button"
            disabled={selectedMonth === getCurrentMonth()}
            onClick={() => setSelectedMonth(getCurrentMonth())}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-1.5 text-sm font-medium transition-all duration-normal ease-liquid shrink-0",
              segmentPanelStyles.panelHeight,
              "text-textSecondary hover:bg-white/60 hover:text-textPrimary dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:dark:hover:bg-transparent"
            )}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Luna curentă
          </button>
          <SegmentDivider />
          <div
            role="group"
            aria-label="Lună"
            className={cn(segmentPanelStyles.segmentGroupBase, "gap-2")}
          >
            <button
              type="button"
              onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-surface border border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/70 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Luna anterioară"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[7rem] py-1 text-center">
              <span className="text-base font-medium text-textPrimary dark:text-white">
                {formatMonthShort(selectedMonth, settings.dateLocale)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-surface border border-white/20 dark:border-white/10 text-textSecondary hover:bg-white/70 hover:text-textPrimary transition-all duration-normal ease-liquid dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Luna următoare"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <SegmentDivider />
          <Button
            onClick={() => setDupDialogOpen(true)}
            disabled={!hasPrevRecord}
            variant="secondary"
            className={segmentPanelStyles.panelHeight}
                aria-label={hasPrevRecord ? "Duplică luna anterioară" : "Nu există lună anterioară de duplicat"}
              >
                <Copy className="mr-2 h-4 w-4 text-textSecondary dark:text-white" />
                Duplică luna anterioară
              </Button>
          <Button
            onClick={() => setResetDialogOpen(true)}
            variant="secondary"
            className={segmentPanelStyles.panelHeight}
            aria-label="Resetează luna la zero"
          >
                <RotateCcw className="mr-2 h-4 w-4 text-textSecondary dark:text-white" />
                Resetează luna
              </Button>
              <Tooltip
                variant="glass"
                side="bottom"
                content={
                  record ? (
                    <div className="space-y-0.5">
                      <div className="font-medium">
                        {record.meta.isSaved ? "Salvat" : "Ciornă"}
                      </div>
                      <div className="text-white/80 text-xs">
                        Ultima salvare: {format(parseISO(record.meta.updatedAt), "d MMM yyyy, HH:mm", { locale: ro })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-white/80 text-sm">Nu există salvare</span>
                  )
                }
              >
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || (record?.meta.isSaved === true)}
                  role="group"
                  aria-label={isSaving ? "Se salvează…" : "Salvează luna curentă"}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-normal ease-liquid",
                    "ring-2 ring-white/20 dark:ring-white/15",
                    "hover:ring-white/30 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
                    record && !record.meta.isSaved
                      ? "bg-accentOrange text-white shadow-[0_0_14px_rgba(254,127,45,0.4)] hover:shadow-[0_0_18px_rgba(254,127,45,0.5)]"
                      : "bg-accentPrimary text-white shadow-[0_0_14px_rgba(33,94,97,0.4)] hover:shadow-[0_0_18px_rgba(33,94,97,0.5)]"
                  )}
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <Save className="h-5 w-5 stroke-[1.5]" />
                  )}
                </button>
          </Tooltip>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10 dark:border-white/10 glass-surface rounded-t-2xl px-6 pb-4 pt-6 border-x border-t border-white/10">
          <div
            className="grid gap-4 text-label text-textPrimary dark:text-white"
            style={{ gridTemplateColumns }}
          >
            <div aria-hidden />
            {profiles.map((p) => (
              <div
                key={p.id}
                className="text-center text-label font-medium tracking-wide text-textPrimary dark:text-white"
              >
                {p.name}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-5 text-textPrimary dark:text-white">
          {CATEGORY_SECTIONS.map((section, sectionIndex) => (
            <div
              key={section.title}
              className={
                sectionIndex === 0
                  ? "pt-0"
                  : "pt-6 mt-6 border-t border-white/10 dark:border-white/10"
              }
            >
              <h3 className="text-h3 mb-4 font-medium tracking-tight text-textPrimary dark:text-white">
                {section.title}
              </h3>
              <div className="space-y-0">
                {section.items.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid gap-4 items-center py-2.5 px-1 -mx-1 rounded-lg hover:bg-white/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-150"
                    style={{ gridTemplateColumns }}
                  >
                    <div className="text-sm text-textSecondary dark:text-white/90 min-w-0">
                      {label}
                    </div>
                    {profiles.map((p) => (
                      <div key={p.id} className="min-w-0">
                        <CurrencyInput
                          value={(formData[p.id] ?? createDefaultCategoryAmounts())[key]}
                          onChange={(v) => updateField(p.id, key, v)}
                          aria-label={`${label} ${p.name}`}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 lg:pl-[72px] px-6 lg:px-8">
        <div className="mx-auto max-w-7xl px-4 pt-2 pb-4">
          <div className="rounded-2xl bg-teal/90 dark:bg-navy/90 backdrop-blur-xl border border-white/20 shadow-glass overflow-hidden">
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                {[
                  {
                    label: "Venit",
                    value: calculateIncomeTotal(combinedForFooter),
                    icon: TrendingUp,
                    valueColor: "text-textPrimary dark:text-white",
                  },
                  {
                    label: "Facturi",
                    value: calculateBillsTotal(combinedForFooter),
                    icon: Receipt,
                    valueColor: "text-textPrimary dark:text-white",
                  },
                  {
                    label: "Cheltuieli",
                    value: calculateExpensesTotal(combinedForFooter),
                    icon: Wallet,
                    valueColor: "text-textPrimary dark:text-white",
                  },
                  {
                    label: "Economii",
                    value: combinedForFooter.economii ?? 0,
                    icon: PiggyBank,
                    valueColor: "text-textPrimary dark:text-white",
                  },
                  {
                    label: "Investiții",
                    value: combinedForFooter.investitii ?? 0,
                    icon: Landmark,
                    valueColor: "text-textPrimary dark:text-white",
                  },
                  {
                    label: "Cashflow net",
                    value: calculateNetCashflow(combinedForFooter, includeInvestmentsInNetCashflow),
                    icon: Minus,
                    valueColor:
                      calculateNetCashflow(combinedForFooter, includeInvestmentsInNetCashflow) >= 0
                        ? "text-emerald-300"
                        : "text-red-300",
                  },
                ].map(({ label, value, icon: Icon, valueColor }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 px-5 py-4 backdrop-blur-sm min-w-0"
                  >
                    <div className="shrink-0 mt-0.5 text-textSecondary dark:text-white/90">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0 overflow-visible">
                      <p className="text-xs sm:text-sm font-medium text-textSecondary dark:text-white/70 break-words">{label}</p>
                      <p
                        className={`text-base sm:text-lg font-semibold tabular-nums break-all ${valueColor}`}
                        title={formatRON(value)}
                      >
                        {formatRON(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={dupDialogOpen}
        onOpenChange={setDupDialogOpen}
        title="Duplică luna anterioară"
        description={
          <>
            Copiezi datele din {formatMonthShort(prevMonth, settings.dateLocale)} în{" "}
            {formatMonthShort(selectedMonth, settings.dateLocale)}. Datele existente pentru{" "}
            {formatMonthShort(selectedMonth, settings.dateLocale)} vor fi înlocuite.
          </>
        }
        confirmLabel="Duplică"
        onConfirm={handleDuplicate}
      />

      <ConfirmationModal
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Resetează luna"
        description={
          <>
            Înregistrările pentru {formatMonthShort(selectedMonth, settings.dateLocale)} vor fi
            șterse și toate valorile vor fi puse la 0. Nu poți reveni.
          </>
        }
        confirmLabel="Resetează"
        onConfirm={handleReset}
        variant="danger"
      />
    </div>
  );
}
