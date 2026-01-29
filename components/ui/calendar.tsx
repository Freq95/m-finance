"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  monthOnly?: boolean;
  className?: string;
}

export function Calendar({
  value,
  onChange,
  onMonthChange,
  monthOnly = false,
  className,
}: CalendarProps) {
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

  const weekDays = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];

  return (
    <div className={cn("rounded-card border border-border bg-card p-4", className)}>
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={previousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-h3 font-semibold">
          {format(currentMonth, "LLLL yyyy", { locale: ro })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!monthOnly && (
        <>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-textSecondary">
            {weekDays.map((day) => (
              <div key={day} className="p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1 }).map((_, i) => (
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
                      ? "bg-accentPrimary text-white"
                      : isCurrentMonth
                      ? "hover:bg-gray-100 text-textPrimary"
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
