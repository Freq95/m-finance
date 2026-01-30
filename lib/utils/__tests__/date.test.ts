import {
  formatMonthShort,
  formatMonthDisplay,
  getPreviousMonth,
  getNextMonth,
  getMonthsForYear,
  monthStringForYear,
  isValidMonthString,
  getCurrentMonth,
} from "../date";

describe("formatMonthShort", () => {
  it("returns short month format for 2026-01", () => {
    const result = formatMonthShort("2026-01");
    expect(result).toMatch(/ian|Ian|Jan/i);
    expect(result).toMatch(/2026/);
  });

  it("returns consistent shape (month + year)", () => {
    const result = formatMonthShort("2025-06");
    expect(result).toMatch(/\d{4}/);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(3);
  });
});

describe("formatMonthDisplay", () => {
  it("returns display format for 2026-01", () => {
    const result = formatMonthDisplay("2026-01");
    expect(result).toMatch(/2026/);
    expect(typeof result).toBe("string");
  });

  it("returns consistent shape", () => {
    const result = formatMonthDisplay("2025-12");
    expect(result).toMatch(/\d{4}/);
  });
});

describe("getPreviousMonth / getNextMonth chain", () => {
  it("getNextMonth then getPreviousMonth returns original", () => {
    const m = "2026-06" as const;
    expect(getPreviousMonth(getNextMonth(m))).toBe(m);
  });

  it("getPreviousMonth then getNextMonth returns original", () => {
    const m = "2026-06" as const;
    expect(getNextMonth(getPreviousMonth(m))).toBe(m);
  });

  it("getNextMonth advances month", () => {
    expect(getNextMonth("2026-01")).toBe("2026-02");
    expect(getNextMonth("2026-12")).toBe("2027-01");
  });

  it("getPreviousMonth goes back", () => {
    expect(getPreviousMonth("2026-02")).toBe("2026-01");
    expect(getPreviousMonth("2026-01")).toBe("2025-12");
  });
});

describe("getMonthsForYear", () => {
  it("returns 12 months for 2026", () => {
    const months = getMonthsForYear(2026);
    expect(months).toHaveLength(12);
  });

  it("first month is 2026-01", () => {
    const months = getMonthsForYear(2026);
    expect(months[0]).toBe("2026-01");
  });

  it("last month is 2026-12", () => {
    const months = getMonthsForYear(2026);
    expect(months[11]).toBe("2026-12");
  });
});

describe("monthStringForYear", () => {
  it("returns first month of year", () => {
    expect(monthStringForYear(2026)).toBe("2026-01");
  });
});

describe("isValidMonthString", () => {
  it("returns true for valid YYYY-MM", () => {
    expect(isValidMonthString("2026-01")).toBe(true);
    expect(isValidMonthString("2025-12")).toBe(true);
    expect(isValidMonthString("2024-06")).toBe(true);
  });

  it("returns false for invalid", () => {
    expect(isValidMonthString("2026-00")).toBe(false);
    expect(isValidMonthString("2026-13")).toBe(false);
    expect(isValidMonthString("26-01")).toBe(false);
    expect(isValidMonthString("2026/01")).toBe(false);
    expect(isValidMonthString("")).toBe(false);
    expect(isValidMonthString("not-a-month")).toBe(false);
  });
});

describe("getCurrentMonth", () => {
  it("returns string in YYYY-MM format", () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});
