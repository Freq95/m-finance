"use client";

import { useState, useEffect, useMemo } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { getPaymentsDueWithinDays } from "@/lib/notifications";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

const STORAGE_KEY = "finance-notification-dismissed-ids";
const BROWSER_NOTIFICATION_KEY = "finance-browser-notification-ids";

function getDismissedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addDismissedIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDismissedIds();
    const next = [...new Set([...current, ...ids])];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function getBrowserNotificationShownIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(BROWSER_NOTIFICATION_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addBrowserNotificationShownIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getBrowserNotificationShownIds();
    const next = [...new Set([...current, ...ids])];
    sessionStorage.setItem(BROWSER_NOTIFICATION_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function useDuePaymentsNotification() {
  const upcomingPayments = useFinanceStore((s) => s.upcomingPayments);
  const notificationsEnabled = useFinanceStore((s) => s.settings.notificationsEnabled);
  const notificationsDaysBefore = useFinanceStore((s) => s.settings.notificationsDaysBefore);
  const dateLocale = useFinanceStore((s) => s.settings.dateLocale);

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const duePayments = useMemo(() => {
    if (!notificationsEnabled || !mounted) return [];
    return getPaymentsDueWithinDays(upcomingPayments, notificationsDaysBefore);
  }, [upcomingPayments, notificationsEnabled, notificationsDaysBefore, mounted]);

  const dismissedSet = useMemo(() => {
    if (!mounted) return new Set<string>();
    return new Set([...getDismissedIds(), ...dismissedIds]);
  }, [dismissedIds, mounted]);

  const toShow = useMemo(
    () => duePayments.filter((p) => !dismissedSet.has(p.id)),
    [duePayments, dismissedSet]
  );

  const formatDate = useMemo(() => {
    return (dateStr: string) => {
      try {
        return format(parseISO(dateStr), "d MMM", {
          locale: dateLocale === "ro" ? ro : undefined,
        });
      } catch {
        return dateStr;
      }
    };
  }, [dateLocale]);

  const summary = useMemo(() => {
    if (toShow.length === 0) return "";
    return toShow.length === 1
      ? `${toShow[0].title} (${formatDate(toShow[0].date)})`
      : `${toShow.length} plăți în următoarele ${notificationsDaysBefore} zile: ${toShow.map((p) => `${p.title} (${formatDate(p.date)})`).join(", ")}`;
  }, [toShow, notificationsDaysBefore, formatDate]);

  useEffect(() => {
    if (toShow.length === 0 || typeof window === "undefined" || !("Notification" in window))
      return;
    const shownIds = getBrowserNotificationShownIds();
    const needsNotification = toShow.some((p) => !shownIds.includes(p.id));
    if (!needsNotification) return;

    const tryShow = () => {
      if (Notification.permission === "granted") {
        try {
          new Notification("Plăți viitoare", {
            body: summary,
            icon: "/favicon.ico",
          });
          addBrowserNotificationShownIds(toShow.map((p) => p.id));
        } catch {
          // ignore
        }
        return;
      }
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            try {
              new Notification("Plăți viitoare", {
                body: summary,
                icon: "/favicon.ico",
              });
              addBrowserNotificationShownIds(toShow.map((p) => p.id));
            } catch {
              // ignore
            }
          }
        });
      }
    };

    tryShow();
  }, [toShow, summary]);

  const handleDismiss = () => {
    const ids = duePayments.map((p) => p.id);
    addDismissedIds(ids);
    setDismissedIds((prev) => [...prev, ...ids]);
  };

  return { toShow, summary, formatDate, handleDismiss, duePayments };
}
