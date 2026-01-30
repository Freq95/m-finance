/**
 * Dashboard chart types and constants
 */

import type { LucideIcon } from "lucide-react";
import { TrendingUp, Receipt, Wallet, PiggyBank } from "lucide-react";

export type ChartDataPoint = {
  month: string;
  full: string;
  monthStr: string;
  income: number;
  expenses: number;
  economii: number;
  investitii: number;
  investments: number;
  bills: number;
  restExpenses: number;
  cashflow: number;
  total: number;
  savingsRate: number;
};

/** Stack segment order (bottom to top) for stacked bar radius. */
export const STACK_KEYS_MAIN: (keyof ChartDataPoint)[] = [
  "income",
  "expenses",
  "economii",
  "investitii",
];
export const STACK_KEYS_BILLS: (keyof ChartDataPoint)[] = ["bills", "restExpenses"];

export type CurrentDataPoint = {
  income: number;
  bills: number;
  expenses: number;
  cashflow: number;
};

export type MetricCardConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string | ((d: { cashflow: number }) => string);
  getValue: (d: CurrentDataPoint) => number;
};

export const METRIC_CARDS: MetricCardConfig[] = [
  {
    key: "income",
    label: "Venit total",
    icon: TrendingUp,
    color: "text-accentPositive",
    getValue: (d) => d.income,
  },
  {
    key: "bills",
    label: "Total facturi",
    icon: Receipt,
    color: "text-textPrimary",
    getValue: (d) => d.bills,
  },
  {
    key: "expenses",
    label: "Cheltuieli totale",
    icon: Wallet,
    color: "text-textPrimary",
    getValue: (d) => d.expenses,
  },
  {
    key: "cashflow",
    label: "Cashflow net",
    icon: PiggyBank,
    color: (d) =>
      d.cashflow >= 0 ? "text-accentPositive" : "text-accentNegative",
    getValue: (d) => d.cashflow,
  },
];
