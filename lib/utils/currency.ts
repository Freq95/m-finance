/**
 * Currency Formatting Utilities
 * RON, USD, EUR with optional exchange rates (values stored as RON)
 */

export type DisplayCurrency = "RON" | "USD" | "EUR";

export interface ExchangeRates {
  /** 1 RON = usd (e.g. 0.22) */
  usd: number;
  /** 1 RON = eur (e.g. 0.20) */
  eur: number;
}

/**
 * Convert amount in RON to target currency using rates (1 RON = rate).
 */
export function ronToCurrency(ronValue: number, currency: DisplayCurrency, rates: ExchangeRates | null): number {
  if (currency === "RON" || !rates) return ronValue;
  if (currency === "USD") return ronValue * rates.usd;
  return ronValue * rates.eur;
}

/**
 * Format a number in the given currency (value is in RON when currency is not RON, use rates to convert).
 * When rates are null and currency is not RON, falls back to RON to avoid showing wrong amounts.
 */
export function formatCurrency(
  valueRon: number,
  currency: DisplayCurrency,
  rates: ExchangeRates | null
): string {
  const effectiveCurrency =
    currency !== "RON" && !rates ? "RON" : currency;
  const value =
    effectiveCurrency === "RON"
      ? valueRon
      : ronToCurrency(valueRon, effectiveCurrency, rates);
  if (isNaN(value) || !isFinite(value))
    return effectiveCurrency === "RON" ? "0 RON" : `0 ${effectiveCurrency}`;

  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    currency: effectiveCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  return new Intl.NumberFormat(
    effectiveCurrency === "RON" ? "ro-RO" : "en-US",
    opts
  ).format(Math.round(value));
}

/**
 * Fetch RON/USD and RON/EUR rates from Frankfurter (RON base: 1 RON = x USD/EUR).
 * API: https://api.frankfurter.app/latest?from=RON&to=USD,EUR
 */
export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=RON&to=USD,EUR"
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      base: string;
      rates: { USD?: number; EUR?: number };
    };
    const usd = data.rates?.USD;
    const eur = data.rates?.EUR;
    if (usd == null || eur == null || usd <= 0 || eur <= 0) return null;
    return { usd, eur };
  } catch {
    return null;
  }
}

/**
 * Format a number as Romanian Leu (RON), no decimals
 * Example: 1234.56 -> "1.235 RON"
 */
export function formatRON(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "0 RON";

  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format RON without decimal places (for compact display, e.g. upcoming payments)
 * Example: 1234.56 -> "1.235 RON"
 */
export function formatRONCompact(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "0 RON";

  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Parse a RON-formatted string to a number
 * Handles both formats: "1234.56" and "1.234,56"
 * Strips "RON" text and parses correctly
 */
export function parseRON(input: string): number {
  // Remove all non-numeric characters except dots, commas, and minus
  const cleaned = input
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as RON without the currency symbol, no decimals
 * Example: 1234.56 -> "1.235"
 */
export function formatRONValue(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "0";

  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
