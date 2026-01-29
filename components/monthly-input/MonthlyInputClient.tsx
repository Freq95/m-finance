"use client";

import * as React from "react";
import { useDebouncedCallback } from "use-debounce";
import { useFinanceStore } from "@/lib/store/finance-store";
import { createDefaultCategoryAmounts } from "@/lib/validation/schemas";
import type { CategoryAmounts, MonthString } from "@/lib/types";
import type { Person } from "@/lib/types";
import {
  getPreviousMonth,
  formatMonthShort,
  monthStringToDate,
} from "@/lib/utils/date";
import { format, parseISO } from "date-fns";
import {
  combineCategoryAmounts,
  calculateIncomeTotal,
  calculateBillsTotal,
  calculateExpensesTotal,
  calculateInvestmentsTotal,
  calculateNetCashflow,
} from "@/lib/calculations/calculations";
import { formatRON } from "@/lib/utils/currency";
import { CATEGORY_SECTIONS, PERSON_LABELS } from "@/lib/constants";
import { MonthPicker } from "./MonthPicker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { Save, Copy, RotateCcw } from "lucide-react";

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
  const duplicateMonth = useFinanceStore((s) => s.duplicateMonth);
  const resetMonth = useFinanceStore((s) => s.resetMonth);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const isSaving = useFinanceStore((s) => s.isSaving);
  const settings = useFinanceStore((s) => s.settings);

  const [formData, setFormData] = React.useState<{
    me: CategoryAmounts;
    wife: CategoryAmounts;
  }>(() => {
    const def = createDefaultCategoryAmounts();
    return { me: { ...def }, wife: { ...def } };
  });
  const formDataRef = React.useRef(formData);
  formDataRef.current = formData;

  const [initKey, setInitKey] = React.useState(0);
  const [dupDialogOpen, setDupDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const initFromStore = React.useCallback(() => {
    const r = getCurrentMonthRecord();
    const def = createDefaultCategoryAmounts();
    if (!r) {
      setFormData({ me: { ...def }, wife: { ...def } });
      return;
    }
    setFormData({
      me: { ...r.people.me },
      wife: { ...r.people.wife },
    });
  }, [getCurrentMonthRecord]);

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  React.useEffect(() => {
    initFromStore();
  }, [selectedMonth, initKey, initFromStore]);

  const flush = useDebouncedCallback(
    () => {
      updateMonthFull(selectedMonth, formDataRef.current);
    },
    1000,
    { flushOnExit: true }
  );

  const updateField = React.useCallback(
    (person: Person, key: keyof CategoryAmounts, value: number) => {
      setFormData((prev) => ({
        ...prev,
        [person]: { ...prev[person], [key]: value },
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
  const combinedForFooter = combineCategoryAmounts(formData.me, formData.wife);
  const includeInv = settings.includeInvestmentsInNetCashflow;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1 dark:text-white">Monthly Input</h1>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <Button
            onClick={() => setDupDialogOpen(true)}
            disabled={!hasPrevRecord}
            variant="secondary"
            aria-label={hasPrevRecord ? "Duplică luna anterioară" : "Nu există lună anterioară de duplicat"}
          >
            <Copy className="mr-2 h-4 w-4 dark:text-white" />
            Duplică luna anterioară
          </Button>
          <Button
            onClick={() => setResetDialogOpen(true)}
            variant="secondary"
            aria-label="Resetează luna la zero"
          >
            <RotateCcw className="mr-2 h-4 w-4 dark:text-white" />
            Resetează luna
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            aria-label={isSaving ? "Se salvează…" : "Salvează luna curentă"}
          >
            {isSaving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4 dark:text-white" />
            )}
            Salvează
          </Button>
          {record && (
            <>
              <Badge variant={record.meta.isSaved ? "saved" : "draft"}>
                {record.meta.isSaved ? "Salvat" : "Ciornă"}
              </Badge>
              <span className="text-small dark:text-white/80">
                Ultima salvare:{" "}
                {format(parseISO(record.meta.updatedAt), "HH:mm")}
              </span>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10 dark:border-white/10 bg-white/[0.02] dark:bg-white/[0.02] rounded-t-2xl px-6 pb-4 pt-6">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(140px,1fr)_minmax(140px,1fr)] gap-4 text-label dark:text-white">
            <div aria-hidden />
            <div className="text-center text-label font-medium tracking-wide dark:text-white">
              {PERSON_LABELS.me}
            </div>
            <div className="text-center text-label font-medium tracking-wide dark:text-white">
              {PERSON_LABELS.wife}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-5 dark:text-white">
          {CATEGORY_SECTIONS.map((section, sectionIndex) => (
            <div
              key={section.title}
              className={
                sectionIndex === 0
                  ? "pt-0"
                  : "pt-6 mt-6 border-t border-white/10 dark:border-white/10"
              }
            >
              <h3 className="text-h3 mb-4 font-medium tracking-tight dark:text-white">
                {section.title}
              </h3>
              <div className="space-y-0">
                {section.items.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(140px,1fr)_minmax(140px,1fr)] gap-4 items-center py-2.5 px-1 -mx-1 rounded-lg hover:bg-white/[0.02] dark:hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    <div className="text-sm text-textSecondary dark:text-white/90 min-w-0">
                      {label}
                    </div>
                    <div className="min-w-0">
                      <CurrencyInput
                        value={formData.me[key]}
                        onChange={(v) => updateField("me", key, v)}
                        aria-label={`${label} ${PERSON_LABELS.me}`}
                        className="w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <CurrencyInput
                        value={formData.wife[key]}
                        onChange={(v) => updateField("wife", key, v)}
                        aria-label={`${label} ${PERSON_LABELS.wife}`}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 glass-panel border-t border-white/20 dark:border-white/10 px-6 py-4 shadow-glass lg:pl-[72px]">
        <div className="mx-auto max-w-4xl">
          <div className="text-h3 mb-2 dark:text-white">Totaluri (Paul + Codru)</div>
          <div className="flex flex-wrap gap-6 text-small dark:text-white">
            <span>
              Venit total:{" "}
              <span className="dark:text-white">
                {formatRON(calculateIncomeTotal(combinedForFooter))}
              </span>
            </span>
            <span>
              Total facturi:{" "}
              <span className="dark:text-white">
                {formatRON(calculateBillsTotal(combinedForFooter))}
              </span>
            </span>
            <span>
              Cheltuieli totale:{" "}
              <span className="dark:text-white">
                {formatRON(calculateExpensesTotal(combinedForFooter))}
              </span>
            </span>
            <span>
              Economii / Investiții:{" "}
              <span className="dark:text-white">
                {formatRON(calculateInvestmentsTotal(combinedForFooter))}
              </span>
            </span>
            <span>
              Cashflow net:{" "}
              <span
                className={
                  "" +
                  (calculateNetCashflow(combinedForFooter, includeInv) >= 0
                    ? "text-accentPositive"
                    : "text-accentNegative")
                }
              >
                {formatRON(
                  calculateNetCashflow(combinedForFooter, includeInv)
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      <Dialog open={dupDialogOpen} onOpenChange={setDupDialogOpen}>
        <DialogContent onClose={() => setDupDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Duplică luna anterioară</DialogTitle>
            <DialogDescription>
              Copiezi datele din {formatMonthShort(prevMonth)} în{" "}
              {formatMonthShort(selectedMonth)}. Datele existente pentru{" "}
              {formatMonthShort(selectedMonth)} vor fi înlocuite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDupDialogOpen(false)}>
              Anulare
            </Button>
            <Button onClick={handleDuplicate}>Duplică</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent onClose={() => setResetDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Resetează luna</DialogTitle>
            <DialogDescription>
              Înregistrările pentru {formatMonthShort(selectedMonth)} vor fi
              șterse și toate valorile vor fi puse la 0. Nu poți reveni.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResetDialogOpen(false)}>
              Anulare
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Resetează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
