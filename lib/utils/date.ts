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
 * Get last N calendar months (including current), newest first.
 * Example: if today is Jan 2026, getLast12CalendarMonths() returns
 * ["2026-01", "2025-12", "2025-11", ..., "2025-02"].
 * Reserved for future use (e.g. calendar picker).
 */
export function getLast12CalendarMonths(): MonthString[] {
  const result: MonthString[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${y}-${m}` as MonthString);
  }
  return result;
}

/**
 * Get all 12 months for a given year (Jan–Dec).
 * Example: getMonthsForYear(2026) => ["2026-01", "2026-02", ..., "2026-12"].
 */
export function getMonthsForYear(year: number): MonthString[] {
  const result: MonthString[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = String(m).padStart(2, "0");
    result.push(`${year}-${month}` as MonthString);
  }
  return result;
}

/**
 * Get 12 calendar months ending in the given month (oldest first, for charts).
 * Example: get12MonthsEndingIn("2026-03") => ["2025-04", "2025-05", ..., "2026-03"].
 * Reserved for future use.
 */
export function get12MonthsEndingIn(monthString: MonthString): MonthString[] {
  const result: MonthString[] = [];
  const date = parse(monthString + "-01", "yyyy-MM-dd", new Date());
  for (let i = 11; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${y}-${m}` as MonthString);
  }
  return result;
}

/** First month of a year as MonthString (e.g. 2026 -> "2026-01") */
export function monthStringForYear(year: number): MonthString {
  return `${year}-01` as MonthString;
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
