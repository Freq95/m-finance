"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { parse } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { formatDateDisplay } from "@/lib/utils/date";
import type { DateLocale } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface DatePickerProps {
  /** Value in YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  locale?: DateLocale;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** Optional: show Clear and Today buttons in the popover */
  showActions?: boolean;
}

export function DatePicker({
  value,
  onChange,
  locale = "ro",
  placeholder = "Select date",
  required,
  disabled,
  id,
  name,
  className,
  showActions = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number; placement: "below" | "above" } | null>(null);

  const valueDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const displayText = value ? formatDateDisplay(value, locale) : "";

  const handleSelect = React.useCallback(
    (date: Date) => {
      const iso = date.toISOString().slice(0, 10);
      onChange(iso);
      setOpen(false);
    },
    [onChange]
  );

  const handleToday = () => {
    const today = new Date();
    onChange(today.toISOString().slice(0, 10));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  // Position popover in viewport (portal) so it's not clipped by modal overflow
  React.useLayoutEffect(() => {
    if (!open || !containerRef.current) {
      setPosition(null);
      return;
    }
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const padding = 8;
    const popoverHeight = 380;
    const popoverWidth = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove ? "below" : "above";
    let top =
      placement === "below"
        ? rect.bottom + padding
        : rect.top - popoverHeight - padding;
    let left = rect.left;
    // Keep popover inside viewport
    if (left + popoverWidth > window.innerWidth - padding) left = window.innerWidth - popoverWidth - padding;
    if (left < padding) left = padding;
    if (top + popoverHeight > window.innerHeight - padding) top = window.innerHeight - popoverHeight - padding;
    if (top < padding) top = padding;
    setPosition({ top, left, placement });
  }, [open]);

  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border border-white/20 dark:border-white/10",
          "glass-surface px-3 py-2 text-left text-sm transition-all duration-200",
          "placeholder:text-textMuted dark:placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentPrimary/30 focus-visible:border-accentPrimary/40",
          "hover:bg-white/60 dark:hover:bg-white/5",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:text-white",
          open && "ring-2 ring-accentPrimary/30 border-accentPrimary/40"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={displayText || placeholder}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-textMuted dark:text-gray-400" />
        <span className={displayText ? "text-textPrimary dark:text-white" : "text-textMuted dark:text-gray-400"}>
          {displayText || placeholder}
        </span>
      </button>

      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={(el) => {
              popoverRef.current = el;
            }}
            className="fixed z-[200] rounded-2xl border border-white/20 dark:border-white/10 glass-panel-elevated p-3 shadow-modal"
            style={{
              top: position.top,
              left: position.left,
            }}
            role="dialog"
            aria-label="Calendar"
          >
            <Calendar
              value={valueDate}
              onChange={handleSelect}
              locale={locale}
              variant="dropdown"
              className="border-0 p-0 shadow-none"
            />
            {showActions && (
              <div className="mt-3 flex justify-end gap-2 border-t border-white/10 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-textSecondary hover:text-textPrimary dark:text-gray-300 dark:hover:text-white"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToday}
                  className="bg-white/10 text-white border border-white/10 hover:bg-white/15 dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/15"
                >
                  Today
                </Button>
              </div>
            )}
          </div>,
          document.body
        )}

      {required && name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          tabIndex={-1}
          aria-hidden
          onChange={() => {}}
        />
      )}
    </div>
  );
}
