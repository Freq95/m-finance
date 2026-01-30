/**
 * Notification helpers for upcoming payment reminders.
 */

import type { UpcomingPayment } from "./types";

/**
 * Returns today's date as YYYY-MM-DD in local timezone.
 */
export function getTodayYYYYMMDD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the date string for (today + offsetDays) in local time, YYYY-MM-DD.
 * Uses noon to avoid DST edge cases when stepping by calendar days.
 */
function addCalendarDays(dateStr: string, offsetDays: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns payments whose due date falls within the next N calendar days (inclusive).
 * "N days" = today and the following (N-1) days, so 3 days = today, tomorrow, day after.
 * Uses calendar-day comparison (YYYY-MM-DD) so DST does not affect the window.
 */
export function getPaymentsDueWithinDays(
  payments: UpcomingPayment[],
  days: number,
  today?: string
): UpcomingPayment[] {
  const todayStr = today ?? getTodayYYYYMMDD();
  const endDateStr = addCalendarDays(todayStr, Math.max(0, days - 1));

  return payments.filter((p) => {
    return p.date >= todayStr && p.date <= endDateStr;
  });
}
