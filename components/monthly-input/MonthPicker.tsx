"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonthShort, monthStringToDate, monthStringFromDate } from "@/lib/utils/date";
import type { MonthString } from "@/lib/types";
import { ChevronDown } from "lucide-react";

export type DateLocale = import("@/lib/utils/date").DateLocale;

interface MonthPickerProps {
  value: MonthString;
  onChange: (month: MonthString) => void;
  className?: string;
  dateLocale?: DateLocale;
}

export function MonthPicker({ value, onChange, className, dateLocale = "ro" }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Date>(() => monthStringToDate(value));

  React.useEffect(() => {
    setDraft(monthStringToDate(value));
  }, [value]);

  const handleApply = () => {
    onChange(monthStringFromDate(draft));
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className={className}
      >
        {formatMonthShort(value, dateLocale)}
        <ChevronDown className="ml-2 h-4 w-4 text-textMuted dark:text-white" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Selectează luna</DialogTitle>
          </DialogHeader>
          <Calendar
            monthOnly
            value={draft}
            onMonthChange={setDraft}
            className="mx-auto"
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Anulare
            </Button>
            <Button onClick={handleApply}>Aplică</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
