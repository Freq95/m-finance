"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";

/**
 * Syncs theme from store to document.documentElement for Tailwind dark mode.
 * Renders nothing; must be mounted inside a client tree (e.g. AppShell).
 */
export function ThemeInjector() {
  const theme = useFinanceStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return null;
}
