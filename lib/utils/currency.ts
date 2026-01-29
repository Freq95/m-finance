/**
 * Currency Formatting Utilities
 * Romanian Leu (RON) formatting
 */

/**
 * Format a number as Romanian Leu (RON)
 * Example: 1234.56 -> "1.234,56 RON"
 */
export function formatRON(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "0,00 RON";

  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
 * Format a number as RON without the currency symbol
 * Example: 1234.56 -> "1.234,56"
 */
export function formatRONValue(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "0,00";

  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
