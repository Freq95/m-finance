"use client";

import * as React from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface SavingsPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseAmount(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function PlanRow({
  label,
  amount,
  note,
  showNote = false,
  onLabelChange,
  onAmountChange,
  onNoteChange,
  onRemove,
}: {
  label: string;
  amount: number;
  note?: string;
  showNote?: boolean;
  onLabelChange: (value: string) => void;
  onAmountChange: (value: number) => void;
  onNoteChange?: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-2">
      <Input
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="Etichetă"
        className={cn("h-9 text-sm flex-1 min-w-[160px]", showNote && "min-w-[140px]")}
      />
      <Input
        type="number"
        step="0.01"
        value={Number.isFinite(amount) ? amount : 0}
        onChange={(e) => onAmountChange(parseAmount(e.target.value))}
        placeholder="0"
        className="h-9 text-sm w-[120px] text-right"
      />
      {showNote && (
        <Input
          value={note ?? ""}
          onChange={(e) => onNoteChange?.(e.target.value)}
          placeholder="Notă"
          className="h-9 text-sm flex-1 min-w-[180px]"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded-lg text-accentNegative hover:bg-accentNegative/10"
        aria-label="Șterge rând"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SavingsPlanModal({ open, onOpenChange }: SavingsPlanModalProps) {
  const savingsPlan = useFinanceStore((s) => s.savingsPlan);
  const addSavingsPlanExpense = useFinanceStore((s) => s.addSavingsPlanExpense);
  const updateSavingsPlanExpense = useFinanceStore((s) => s.updateSavingsPlanExpense);
  const removeSavingsPlanExpense = useFinanceStore((s) => s.removeSavingsPlanExpense);
  const addSavingsPlanBlock = useFinanceStore((s) => s.addSavingsPlanBlock);
  const updateSavingsPlanBlock = useFinanceStore((s) => s.updateSavingsPlanBlock);
  const removeSavingsPlanBlock = useFinanceStore((s) => s.removeSavingsPlanBlock);
  const addSavingsPlanAllocation = useFinanceStore((s) => s.addSavingsPlanAllocation);
  const updateSavingsPlanAllocation = useFinanceStore((s) => s.updateSavingsPlanAllocation);
  const removeSavingsPlanAllocation = useFinanceStore((s) => s.removeSavingsPlanAllocation);
  const addSavingsPlanMilestone = useFinanceStore((s) => s.addSavingsPlanMilestone);
  const updateSavingsPlanMilestone = useFinanceStore((s) => s.updateSavingsPlanMilestone);
  const removeSavingsPlanMilestone = useFinanceStore((s) => s.removeSavingsPlanMilestone);
  const addSavingsPlanNote = useFinanceStore((s) => s.addSavingsPlanNote);
  const updateSavingsPlanNote = useFinanceStore((s) => s.updateSavingsPlanNote);
  const removeSavingsPlanNote = useFinanceStore((s) => s.removeSavingsPlanNote);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-textPrimary dark:text-white">
            Plan economii (template)
          </DialogTitle>
          <DialogDescription className="text-textSecondary dark:text-gray-300">
            Editează și adaugă secțiunile din template-ul de plan.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-medium text-textPrimary dark:text-white">
                  Cheltuieli lunare
                </h2>
                <p className="text-sm text-textSecondary dark:text-gray-300">
                  Listează costurile fixe din fiecare lună.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={addSavingsPlanExpense}>
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </div>
            <div className="space-y-2">
              {savingsPlan.expenses.map((item) => (
                <PlanRow
                  key={item.id}
                  label={item.label}
                  amount={item.amount}
                  onLabelChange={(value) =>
                    updateSavingsPlanExpense(item.id, { label: value })
                  }
                  onAmountChange={(value) =>
                    updateSavingsPlanExpense(item.id, { amount: value })
                  }
                  onRemove={() => removeSavingsPlanExpense(item.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-medium text-textPrimary dark:text-white">
                  Blocuri cashflow
                </h2>
                <p className="text-sm text-textSecondary dark:text-gray-300">
                  Ajustează perioadele și alocările principale.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={addSavingsPlanBlock}>
                <Plus className="h-4 w-4 mr-1" />
                Adaugă bloc
              </Button>
            </div>
            <div className="space-y-4">
              {savingsPlan.blocks.map((block) => {
                const diff = block.income - block.out;
                return (
                  <div
                    key={block.id}
                    className="rounded-2xl border border-white/20 dark:border-white/10 glass-surface p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={block.title}
                        onChange={(e) =>
                          updateSavingsPlanBlock(block.id, { title: e.target.value })
                        }
                        placeholder="Titlu bloc"
                        className="h-9 text-sm flex-1 min-w-[220px]"
                      />
                      <button
                        type="button"
                        onClick={() => removeSavingsPlanBlock(block.id)}
                        className="p-1.5 rounded-lg text-accentNegative hover:bg-accentNegative/10"
                        aria-label="Șterge bloc"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-2">
                        <p className="text-xs text-textSecondary dark:text-gray-300">in</p>
                        <Input
                          type="number"
                          step="0.01"
                          value={Number.isFinite(block.income) ? block.income : 0}
                          onChange={(e) =>
                            updateSavingsPlanBlock(block.id, {
                              income: parseAmount(e.target.value),
                            })
                          }
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                      <div className="rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-2">
                        <p className="text-xs text-textSecondary dark:text-gray-300">out</p>
                        <Input
                          type="number"
                          step="0.01"
                          value={Number.isFinite(block.out) ? block.out : 0}
                          onChange={(e) =>
                            updateSavingsPlanBlock(block.id, {
                              out: parseAmount(e.target.value),
                            })
                          }
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                      <div className="rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-2">
                        <p className="text-xs text-textSecondary dark:text-gray-300">diff</p>
                        <div className="h-9 mt-1 text-sm font-medium text-textPrimary dark:text-white flex items-center">
                          {Number.isFinite(diff) ? diff.toLocaleString("ro-RO") : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-textPrimary dark:text-white">
                        Alocări
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => addSavingsPlanAllocation(block.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adaugă alocare
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {block.allocations.map((item) => (
                        <PlanRow
                          key={item.id}
                          label={item.label}
                          amount={item.amount}
                          onLabelChange={(value) =>
                            updateSavingsPlanAllocation(block.id, item.id, {
                              label: value,
                            })
                          }
                          onAmountChange={(value) =>
                            updateSavingsPlanAllocation(block.id, item.id, {
                              amount: value,
                            })
                          }
                          onRemove={() =>
                            removeSavingsPlanAllocation(block.id, item.id)
                          }
                        />
                      ))}
                    </div>

                    <div>
                      <p className="text-xs text-textSecondary dark:text-gray-300 mb-1">
                        Notă bloc
                      </p>
                      <Input
                        value={block.note ?? ""}
                        onChange={(e) =>
                          updateSavingsPlanBlock(block.id, { note: e.target.value })
                        }
                        placeholder="Ex: achitare in 5 luni"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-medium text-textPrimary dark:text-white">
                  Milestone-uri
                </h2>
                <p className="text-sm text-textSecondary dark:text-gray-300">
                  Ținte de achitare sau praguri de economii.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={addSavingsPlanMilestone}>
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </div>
            <div className="space-y-2">
              {savingsPlan.milestones.map((item) => (
                <PlanRow
                  key={item.id}
                  label={item.label}
                  amount={item.amount}
                  note={item.note}
                  showNote
                  onLabelChange={(value) =>
                    updateSavingsPlanMilestone(item.id, { label: value })
                  }
                  onAmountChange={(value) =>
                    updateSavingsPlanMilestone(item.id, { amount: value })
                  }
                  onNoteChange={(value) =>
                    updateSavingsPlanMilestone(item.id, { note: value })
                  }
                  onRemove={() => removeSavingsPlanMilestone(item.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-medium text-textPrimary dark:text-white">
                  Note
                </h2>
                <p className="text-sm text-textSecondary dark:text-gray-300">
                  Observații generale despre plan.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={addSavingsPlanNote}>
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </div>
            <div className="space-y-2">
              {savingsPlan.notes.map((note, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-xl glass-surface border border-white/20 dark:border-white/10 px-3 py-2"
                >
                  <Input
                    value={note}
                    onChange={(e) => updateSavingsPlanNote(index, e.target.value)}
                    placeholder="Notă"
                    className="h-9 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSavingsPlanNote(index)}
                    className="p-1.5 rounded-lg text-accentNegative hover:bg-accentNegative/10"
                    aria-label="Șterge notă"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
