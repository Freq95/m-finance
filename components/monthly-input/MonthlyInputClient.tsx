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
  const combined = record
    ? combineCategoryAmounts(record.people.me, record.people.wife)
    : null;
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
        <h1 className="text-h1">Monthly Input</h1>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <Button
            onClick={() => setDupDialogOpen(true)}
            disabled={!hasPrevRecord}
            variant="secondary"
            aria-label={hasPrevRecord ? "Duplică luna anterioară" : "Nu există lună anterioară de duplicat"}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplică luna anterioară
          </Button>
          <Button
            onClick={() => setResetDialogOpen(true)}
            variant="secondary"
            aria-label="Resetează luna la zero"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
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
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvează
          </Button>
          {record && (
            <>
              <Badge variant={record.meta.isSaved ? "saved" : "draft"}>
                {record.meta.isSaved ? "Salvat" : "Ciornă"}
              </Badge>
              <span className="text-small text-textMuted">
                Ultima salvare:{" "}
                {format(parseISO(record.meta.updatedAt), "HH:mm")}
              </span>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 text-label">
            <div />
            <div className="text-center font-medium">{PERSON_LABELS.me}</div>
            <div className="text-center font-medium">{PERSON_LABELS.wife}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {CATEGORY_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-h3 mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center"
                  >
                    <div className="text-small text-textSecondary">{label}</div>
                    <CurrencyInput
                      value={formData.me[key]}
                      onChange={(v) => updateField("me", key, v)}
                      aria-label={`${label} ${PERSON_LABELS.me}`}
                    />
                    <CurrencyInput
                      value={formData.wife[key]}
                      onChange={(v) => updateField("wife", key, v)}
                      aria-label={`${label} ${PERSON_LABELS.wife}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/[0.06] bg-white/70 backdrop-blur-xl px-6 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] lg:pl-[72px] supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-4xl">
          <div className="text-h3 mb-2">Totaluri (Eu + Soția)</div>
          {combined ? (
            <div className="flex flex-wrap gap-6 text-small">
              <span>
                Venit total:{" "}
                <strong className="text-textPrimary">
                  {formatRON(calculateIncomeTotal(combined))}
                </strong>
              </span>
              <span>
                Total facturi:{" "}
                <strong className="text-textPrimary">
                  {formatRON(calculateBillsTotal(combined))}
                </strong>
              </span>
              <span>
                Cheltuieli totale:{" "}
                <strong className="text-textPrimary">
                  {formatRON(calculateExpensesTotal(combined))}
                </strong>
              </span>
              <span>
                Economii / Investiții:{" "}
                <strong className="text-textPrimary">
                  {formatRON(calculateInvestmentsTotal(combined))}
                </strong>
              </span>
              <span>
                Cashflow net:{" "}
                <strong
                  className={
                    calculateNetCashflow(combined, includeInv) >= 0
                      ? "text-accentPositive"
                      : "text-accentNegative"
                  }
                >
                  {formatRON(
                    calculateNetCashflow(combined, includeInv)
                  )}
                </strong>
              </span>
            </div>
          ) : (
            <p className="text-textMuted">
              Completează câmpurile pentru a vedea totalurile.
            </p>
          )}
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
