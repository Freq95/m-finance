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

export type DecimalPlaces = 0 | 2;

/**
 * Format a number in the given currency (value is in RON when currency is not RON, use rates to convert).
 * When rates are null and currency is not RON, falls back to RON to avoid showing wrong amounts.
 * @param decimalPlaces - 0 for whole numbers, 2 for two decimals (default 0)
 */
export function formatCurrency(
  valueRon: number,
  currency: DisplayCurrency,
  rates: ExchangeRates | null,
  decimalPlaces: DecimalPlaces = 0
): string {
  const effectiveCurrency =
    currency !== "RON" && !rates ? "RON" : currency;
  const value =
    effectiveCurrency === "RON"
      ? valueRon
      : ronToCurrency(valueRon, effectiveCurrency, rates);
  if (isNaN(value) || !isFinite(value))
    return effectiveCurrency === "RON" ? "0 RON" : `0 ${effectiveCurrency}`;

  const frac = decimalPlaces === 2 ? 2 : 0;
  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    currency: effectiveCurrency,
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  };
  const rounded = frac === 2 ? value : Math.round(value);
  return new Intl.NumberFormat(
    effectiveCurrency === "RON" ? "ro-RO" : "en-US",
    opts
  ).format(rounded);
}

/**
 * Fetch RON/USD and RON/EUR rates from Frankfurter (RON base: 1 RON = x USD/EUR).
 * API: https://api.frankfurter.app/latest?from=RON&to=USD,EUR
 */
export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  const requestRates = async (): Promise<ExchangeRates | null> => {
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
  };

  const firstTry = await requestRates();
  if (firstTry) return firstTry;
  await new Promise((resolve) => setTimeout(resolve, 500));
  return requestRates();
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
 * Parse a RON-formatted string to a number
 * Handles both formats: "1234.56" and "1.234,56"
 * Strips "RON" text and parses correctly
 */
export function parseRON(input: string): number {
  // Remove all non-numeric characters except dots, commas, and minus
  const normalized = input.replace(/[^\d,.-]/g, "");
  const isNegative = normalized.trim().startsWith("-");
  const cleaned = normalized
    .replace(/-/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
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
