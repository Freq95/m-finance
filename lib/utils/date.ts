/**
 * Date Formatting Utilities
 * Romanian locale support using date-fns
 */

import { format, parse } from "date-fns";
import { ro } from "date-fns/locale";
import type { MonthString } from "../types";

/**
 * Format a month string for display
 * Example: "2026-01" -> "Ian 2026"
 */
export function formatMonthDisplay(monthString: MonthString): string {
  const date = parse(monthString + "-01", "yyyy-MM-dd", new Date());
  return format(date, "LLL yyyy", { locale: ro });
}

/**
 * Format short (e.g. "Ian 2026")
 */
export function formatMonthShort(monthString: MonthString): string {
  const date = parse(monthString + "-01", "yyyy-MM-dd", new Date());
  return format(date, "MMM yyyy", { locale: ro });
}

/**
 * Convert MonthString to Date (first day of month)
 */
export function monthStringToDate(monthString: MonthString): Date {
  return parse(monthString + "-01", "yyyy-MM-dd", new Date());
}

/**
 * Convert Date to MonthString
 */
export function monthStringFromDate(date: Date): MonthString {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}` as MonthString;
}

/**
 * Get current month as MonthString
 */
export function getCurrentMonth(): MonthString {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}` as MonthString;
}

/**
 * Get previous month as MonthString
 */
export function getPreviousMonth(monthString: MonthString): MonthString {
  const date = parse(monthString + "-01", "yyyy-MM-dd", new Date());
  date.setMonth(date.getMonth() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}` as MonthString;
}

/**
 * Get next month as MonthString
 */
export function getNextMonth(monthString: MonthString): MonthString {
  const date = parse(monthString + "-01", "yyyy-MM-dd", new Date());
  date.setMonth(date.getMonth() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}` as MonthString;
}

/**
 * Validate if a string is a valid MonthString
 */
export function isValidMonthString(value: string): value is MonthString {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/**
 * Romanian month abbreviations
 */
export const ROMANIAN_MONTHS = [
  "Ian",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Iun",
  "Iul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
