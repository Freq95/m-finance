"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { ro } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const locales: Record<"ro" | "en", Locale> = { ro, en: enUS };

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  monthOnly?: boolean;
  /** Locale for month title and weekday names (ro = Lu Ma Mi..., en = Su Mo Tu...) */
  locale?: "ro" | "en";
  /** When "dropdown", uses gray/dark styling for use in popovers (matches dark modal) */
  variant?: "default" | "dropdown";
  className?: string;
}

const WEEKDAYS_RO = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];
const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({
  value,
  onChange,
  onMonthChange,
  monthOnly = false,
  locale: localeKey = "ro",
  variant = "default",
  className,
}: CalendarProps) {
  const locale = locales[localeKey];
  const weekDays = localeKey === "en" ? WEEKDAYS_EN : WEEKDAYS_RO;
  const isDropdown = variant === "dropdown";
  const [currentMonth, setCurrentMonth] = React.useState(
    value || new Date()
  );

  React.useEffect(() => {
    if (value) setCurrentMonth(value);
  }, [value ? `${value.getFullYear()}-${value.getMonth()}` : ""]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      if (monthOnly) onMonthChange?.(newDate);
      return newDate;
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      if (monthOnly) onMonthChange?.(newDate);
      return newDate;
    });
  };

  const handleDayClick = (day: Date) => {
    if (monthOnly) {
      // For month-only mode, just update the month
      setCurrentMonth(day);
      onChange?.(day);
    } else {
      onChange?.(day);
    }
  };

  return (
    <div
      className={cn(
        "rounded-card border p-4",
        isDropdown
          ? "border-white/10 bg-transparent text-white"
          : "border-border bg-card",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={previousMonth}
          className={cn(
            "h-8 w-8 p-0",
            isDropdown && "text-gray-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className={cn("text-h3 font-medium", isDropdown && "text-white")}>
          {format(currentMonth, "LLLL yyyy", { locale })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className={cn(
            "h-8 w-8 p-0",
            isDropdown && "text-gray-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!monthOnly && (
        <>
          <div
            className={cn(
              "mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium",
              isDropdown ? "text-gray-400" : "text-textSecondary"
            )}
          >
            {weekDays.map((day) => (
              <div key={day} className="p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({
              length:
                localeKey === "en"
                  ? getDay(monthStart)
                  : (getDay(monthStart) + 6) % 7,
            }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const isSelected = value && isSameDay(day, value);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-9 w-9 rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-accentOrange text-white"
                      : isCurrentMonth
                      ? isDropdown
                        ? "text-gray-200 hover:bg-white/15"
                        : "hover:bg-gray-100 text-textPrimary"
                      : "text-textMuted",
                    !isCurrentMonth && "opacity-50"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
