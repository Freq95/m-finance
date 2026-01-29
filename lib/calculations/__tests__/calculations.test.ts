import {
  calculateIncomeTotal,
  calculateBillsTotal,
  calculateExpensesTotal,
  calculateInvestmentsTotal,
  calculateProfitLoss,
  calculateNetCashflow,
  combineCategoryAmounts,
} from "../calculations";
import type { CategoryAmounts } from "@/lib/types";

function makeAmounts(overrides: Partial<CategoryAmounts> = {}): CategoryAmounts {
  const zero: CategoryAmounts = {
    venit: 0,
    bonuri: 0,
    extra: 0,
    rate: 0,
    apple: 0,
    intretinere: 0,
    internet: 0,
    gaz: 0,
    curent: 0,
    telefon: 0,
    netflix: 0,
    sala: 0,
    educatie: 0,
    sanatate: 0,
    beauty: 0,
    haine: 0,
    diverse: 0,
    transport: 0,
    cadouri: 0,
    vacante: 0,
    casa: 0,
    gadgets: 0,
    tazz: 0,
    alimente: 0,
    economii: 0,
    investitii: 0,
  };
  return { ...zero, ...overrides };
}

describe("calculateIncomeTotal", () => {
  it("returns 0 for all zeros", () => {
    expect(calculateIncomeTotal(makeAmounts())).toBe(0);
  });

  it("sums venit, bonuri, extra", () => {
    expect(
      calculateIncomeTotal(makeAmounts({ venit: 1000, bonuri: 200, extra: 50 }))
    ).toBe(1250);
  });

  it("ignores other categories", () => {
    expect(
      calculateIncomeTotal(makeAmounts({ rate: 500, alimente: 300 }))
    ).toBe(0);
  });
});

describe("calculateBillsTotal", () => {
  it("returns 0 for all zeros", () => {
    expect(calculateBillsTotal(makeAmounts())).toBe(0);
  });

  it("sums apple, intretinere, internet, gaz, curent, telefon, netflix, sala", () => {
    const data = makeAmounts({
      apple: 10,
      intretinere: 100,
      internet: 50,
      gaz: 30,
      curent: 80,
      telefon: 20,
      netflix: 40,
      sala: 60,
    });
    expect(calculateBillsTotal(data)).toBe(390);
  });

  it("ignores non-bill categories", () => {
    expect(
      calculateBillsTotal(makeAmounts({ venit: 5000, alimente: 200 }))
    ).toBe(0);
  });
});

describe("calculateExpensesTotal", () => {
  it("returns 0 for all zeros", () => {
    expect(calculateExpensesTotal(makeAmounts())).toBe(0);
  });

  it("includes rate + bills + other expenses", () => {
    const data = makeAmounts({
      rate: 100,
      apple: 10,
      intretinere: 100,
      internet: 0,
      gaz: 0,
      curent: 0,
      telefon: 0,
      netflix: 0,
      sala: 0,
      educatie: 50,
      sanatate: 0,
      beauty: 0,
      haine: 0,
      diverse: 20,
      transport: 100,
      cadouri: 0,
      vacante: 0,
      casa: 0,
      gadgets: 0,
      tazz: 30,
      alimente: 200,
    });
    expect(calculateExpensesTotal(data)).toBe(610);
  });

  it("does not include economii or investitii", () => {
    const data = makeAmounts({ economii: 500, investitii: 500, venit: 5000 });
    expect(calculateExpensesTotal(data)).toBe(0);
  });
});

describe("calculateInvestmentsTotal", () => {
  it("returns 0 when economii and investitii are 0", () => {
    expect(calculateInvestmentsTotal(makeAmounts())).toBe(0);
  });

  it("returns economii + investitii", () => {
    expect(
      calculateInvestmentsTotal(makeAmounts({ economii: 300, investitii: 200 }))
    ).toBe(500);
  });
});

describe("calculateProfitLoss", () => {
  it("returns 0 when income equals expenses", () => {
    const data = makeAmounts({ venit: 1000, rate: 1000 });
    expect(calculateProfitLoss(data)).toBe(0);
  });

  it("returns positive when income exceeds expenses", () => {
    const data = makeAmounts({ venit: 5000, rate: 2000 });
    expect(calculateProfitLoss(data)).toBe(3000);
  });

  it("returns negative when expenses exceed income", () => {
    const data = makeAmounts({ venit: 1000, rate: 1500 });
    expect(calculateProfitLoss(data)).toBe(-500);
  });
});

describe("calculateNetCashflow", () => {
  it("with includeInvestments true: subtracts investments from profit/loss", () => {
    const data = makeAmounts({
      venit: 5000,
      rate: 2000,
      economii: 300,
      investitii: 200,
    });
    expect(calculateNetCashflow(data, true)).toBe(2500);
  });

  it("with includeInvestments false: equals profit/loss (ignores investments)", () => {
    const data = makeAmounts({
      venit: 5000,
      rate: 2000,
      economii: 300,
      investitii: 200,
    });
    expect(calculateNetCashflow(data, false)).toBe(3000);
  });

  it("default (includeInvestments true) subtracts investments", () => {
    const data = makeAmounts({
      venit: 3000,
      rate: 2000,
      economii: 100,
      investitii: 100,
    });
    expect(calculateNetCashflow(data)).toBe(800);
  });

  it("returns zero when income minus expenses minus investments is zero", () => {
    const data = makeAmounts({
      venit: 3000,
      rate: 2000,
      economii: 500,
      investitii: 500,
    });
    expect(calculateNetCashflow(data, true)).toBe(0);
  });
});

describe("combineCategoryAmounts", () => {
  it("sums each category from me and wife", () => {
    const me = makeAmounts({ venit: 3000, alimente: 500 });
    const wife = makeAmounts({ venit: 2000, alimente: 300 });
    const combined = combineCategoryAmounts(me, wife);
    expect(combined.venit).toBe(5000);
    expect(combined.alimente).toBe(800);
  });

  it("returns zeros when both inputs are zero", () => {
    const me = makeAmounts();
    const wife = makeAmounts();
    const combined = combineCategoryAmounts(me, wife);
    expect(combined.venit).toBe(0);
    expect(combined.economii).toBe(0);
    expect(combined.investitii).toBe(0);
  });

  it("does not mutate inputs", () => {
    const me = makeAmounts({ venit: 1000 });
    const wife = makeAmounts({ venit: 2000 });
    const meBefore = { ...me };
    const wifeBefore = { ...wife };
    combineCategoryAmounts(me, wife);
    expect(me).toEqual(meBefore);
    expect(wife).toEqual(wifeBefore);
  });

  it("sums all categories correctly", () => {
    const me = makeAmounts({
      venit: 1,
      bonuri: 2,
      extra: 3,
      rate: 4,
      apple: 5,
      intretinere: 6,
      internet: 7,
      gaz: 8,
      curent: 9,
      telefon: 10,
      netflix: 11,
      sala: 12,
      educatie: 13,
      sanatate: 14,
      beauty: 15,
      haine: 16,
      diverse: 17,
      transport: 18,
      cadouri: 19,
      vacante: 20,
      casa: 21,
      gadgets: 22,
      tazz: 23,
      alimente: 24,
      economii: 15,
      investitii: 10,
    });
    const wife = makeAmounts({
      venit: 10,
      bonuri: 20,
      extra: 30,
      rate: 40,
      apple: 50,
      intretinere: 60,
      internet: 70,
      gaz: 80,
      curent: 90,
      telefon: 100,
      netflix: 110,
      sala: 120,
      educatie: 130,
      sanatate: 140,
      beauty: 150,
      haine: 160,
      diverse: 170,
      transport: 180,
      cadouri: 190,
      vacante: 200,
      casa: 210,
      gadgets: 220,
      tazz: 230,
      alimente: 240,
      economii: 150,
      investitii: 100,
    });
    const combined = combineCategoryAmounts(me, wife);
    expect(combined.venit).toBe(11);
    expect(combined.alimente).toBe(264);
    expect(combined.economii).toBe(165);
    expect(combined.investitii).toBe(110);
  });
});
