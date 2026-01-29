/**
 * Calculation Utilities
 * Pure functions for financial calculations
 */

import type { CategoryAmounts } from "../types";

/**
 * Calculate total income
 */
export function calculateIncomeTotal(data: CategoryAmounts): number {
  return data.venit + data.bonuri + data.extra;
}

/**
 * Calculate total bills
 */
export function calculateBillsTotal(data: CategoryAmounts): number {
  return (
    data.apple +
    data.intretinere +
    data.internet +
    data.gaz +
    data.curent +
    data.telefon +
    data.netflix +
    data.sala
  );
}

/**
 * Calculate total expenses (includes rate and bills)
 */
export function calculateExpensesTotal(data: CategoryAmounts): number {
  const billsTotal = calculateBillsTotal(data);
  const otherExpenses =
    data.educatie +
    data.sanatate +
    data.beauty +
    data.haine +
    data.diverse +
    data.transport +
    data.cadouri +
    data.vacante +
    data.casa +
    data.gadgets +
    data.tazz +
    data.alimente;

  return data.rate + billsTotal + otherExpenses;
}

/**
 * Calculate savings + investments total (Economii & Investiții)
 */
export function calculateInvestmentsTotal(data: CategoryAmounts): number {
  return data.economii + data.investitii;
}

/**
 * Calculate profit/loss (before investments)
 */
export function calculateProfitLoss(data: CategoryAmounts): number {
  const incomeTotal = calculateIncomeTotal(data);
  const expensesTotal = calculateExpensesTotal(data);
  return incomeTotal - expensesTotal;
}

/**
 * Calculate net cashflow (after investments)
 * @param includeInvestments - Whether to include investments in the calculation
 */
export function calculateNetCashflow(
  data: CategoryAmounts,
  includeInvestments: boolean = true
): number {
  const incomeTotal = calculateIncomeTotal(data);
  const expensesTotal = calculateExpensesTotal(data);
  const investmentsTotal = calculateInvestmentsTotal(data);

  if (includeInvestments) {
    return incomeTotal - expensesTotal - investmentsTotal;
  }
  return incomeTotal - expensesTotal;
}

/**
 * Combine two CategoryAmounts (for combined view)
 */
export function combineCategoryAmounts(
  me: CategoryAmounts,
  wife: CategoryAmounts
): CategoryAmounts {
  return {
    venit: me.venit + wife.venit,
    bonuri: me.bonuri + wife.bonuri,
    extra: me.extra + wife.extra,
    rate: me.rate + wife.rate,
    apple: me.apple + wife.apple,
    intretinere: me.intretinere + wife.intretinere,
    internet: me.internet + wife.internet,
    gaz: me.gaz + wife.gaz,
    curent: me.curent + wife.curent,
    telefon: me.telefon + wife.telefon,
    netflix: me.netflix + wife.netflix,
    sala: me.sala + wife.sala,
    educatie: me.educatie + wife.educatie,
    sanatate: me.sanatate + wife.sanatate,
    beauty: me.beauty + wife.beauty,
    haine: me.haine + wife.haine,
    diverse: me.diverse + wife.diverse,
    transport: me.transport + wife.transport,
    cadouri: me.cadouri + wife.cadouri,
    vacante: me.vacante + wife.vacante,
    casa: me.casa + wife.casa,
    gadgets: me.gadgets + wife.gadgets,
    tazz: me.tazz + wife.tazz,
    alimente: me.alimente + wife.alimente,
    economii: me.economii + wife.economii,
    investitii: me.investitii + wife.investitii,
  };
}

/**
 * Sum multiple CategoryAmounts (e.g. for annual aggregation)
 */
export function sumCategoryAmounts(items: CategoryAmounts[]): CategoryAmounts {
  if (items.length === 0) {
    return {
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
  }
  return items.reduce((acc, curr) => {
    return {
      venit: acc.venit + curr.venit,
      bonuri: acc.bonuri + curr.bonuri,
      extra: acc.extra + curr.extra,
      rate: acc.rate + curr.rate,
      apple: acc.apple + curr.apple,
      intretinere: acc.intretinere + curr.intretinere,
      internet: acc.internet + curr.internet,
      gaz: acc.gaz + curr.gaz,
      curent: acc.curent + curr.curent,
      telefon: acc.telefon + curr.telefon,
      netflix: acc.netflix + curr.netflix,
      sala: acc.sala + curr.sala,
      educatie: acc.educatie + curr.educatie,
      sanatate: acc.sanatate + curr.sanatate,
      beauty: acc.beauty + curr.beauty,
      haine: acc.haine + curr.haine,
      diverse: acc.diverse + curr.diverse,
      transport: acc.transport + curr.transport,
      cadouri: acc.cadouri + curr.cadouri,
      vacante: acc.vacante + curr.vacante,
      casa: acc.casa + curr.casa,
      gadgets: acc.gadgets + curr.gadgets,
      tazz: acc.tazz + curr.tazz,
      alimente: acc.alimente + curr.alimente,
      economii: acc.economii + curr.economii,
      investitii: acc.investitii + curr.investitii,
    };
  });
}
