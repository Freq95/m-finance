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
 * Calculate investments total
 */
export function calculateInvestmentsTotal(data: CategoryAmounts): number {
  return data.economii_investitii;
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
    economii_investitii: me.economii_investitii + wife.economii_investitii,
  };
}
