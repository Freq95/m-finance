import {
  ronToCurrency,
  formatCurrency,
  formatRON,
  parseRON,
  formatRONValue,
  type ExchangeRates,
} from "../currency";

const RATES: ExchangeRates = { usd: 0.22, eur: 0.20 };

describe("ronToCurrency", () => {
  it("returns same value for RON", () => {
    expect(ronToCurrency(1000, "RON", RATES)).toBe(1000);
  });

  it("returns same value when rates are null (RON)", () => {
    expect(ronToCurrency(1000, "RON", null)).toBe(1000);
  });

  it("converts RON to USD with rates", () => {
    expect(ronToCurrency(1000, "USD", RATES)).toBe(220);
  });

  it("converts RON to EUR with rates", () => {
    expect(ronToCurrency(1000, "EUR", RATES)).toBe(200);
  });

  it("returns RON value when rates are null and currency is USD (caller responsibility)", () => {
    expect(ronToCurrency(1000, "USD", null)).toBe(1000);
  });

  it("returns RON value when rates are null and currency is EUR", () => {
    expect(ronToCurrency(1000, "EUR", null)).toBe(1000);
  });
});

describe("formatCurrency", () => {
  it("formats RON with locale", () => {
    const result = formatCurrency(1234, "RON", RATES);
    expect(result).toMatch(/\d[\d.,]*\s*RON/);
  });

  it("formats USD when rates provided", () => {
    const result = formatCurrency(1000, "USD", RATES);
    expect(result).toMatch(/\$|USD/);
    expect(result).toMatch(/\d/);
  });

  it("formats EUR when rates provided", () => {
    const result = formatCurrency(1000, "EUR", RATES);
    expect(result).toMatch(/€|EUR/);
    expect(result).toMatch(/\d/);
  });

  it("falls back to RON when no rates and currency is USD", () => {
    const result = formatCurrency(1000, "USD", null);
    expect(result).toMatch(/RON/);
  });

  it("returns 0 RON for NaN", () => {
    expect(formatCurrency(NaN, "RON", RATES)).toBe("0 RON");
  });

  it("returns 0 RON for Infinity", () => {
    expect(formatCurrency(Infinity, "RON", RATES)).toBe("0 RON");
  });

  it("returns 0 USD for NaN when currency USD", () => {
    const result = formatCurrency(NaN, "USD", RATES);
    expect(result).toMatch(/0.*USD/);
  });
});

describe("formatRON", () => {
  it("formats positive number as RON", () => {
    const result = formatRON(1234.56);
    expect(result).toMatch(/\d[\d.,]*\s*RON/);
  });

  it("returns 0 RON for NaN", () => {
    expect(formatRON(NaN)).toBe("0 RON");
  });

  it("returns 0 RON for Infinity", () => {
    expect(formatRON(Infinity)).toBe("0 RON");
  });
});

describe("parseRON", () => {
  it("parses Romanian format with comma decimal (1.234,56)", () => {
    expect(parseRON("1.234,56")).toBe(1234.56);
  });

  it("strips RON text and parses", () => {
    expect(parseRON("1.234,56 RON")).toBe(1234.56);
  });

  it("returns 0 for empty string", () => {
    expect(parseRON("")).toBe(0);
  });

  it("returns 0 for non-numeric string", () => {
    expect(parseRON("abc")).toBe(0);
  });

  it("handles negative", () => {
    expect(parseRON("-100")).toBe(-100);
  });
});

describe("formatRONValue", () => {
  it("formats number without currency symbol", () => {
    const result = formatRONValue(1234.56);
    expect(result).toMatch(/^\d[\d.,]*$/);
    expect(result).not.toMatch(/RON/);
  });

  it("returns 0 for NaN", () => {
    expect(formatRONValue(NaN)).toBe("0");
  });

  it("returns 0 for Infinity", () => {
    expect(formatRONValue(Infinity)).toBe("0");
  });
});
