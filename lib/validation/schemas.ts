/**
 * Zod Schemas for Runtime Validation
 */

import { z } from "zod";
import type { MonthString } from "../types";

const monthStringRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const CategoryAmountsSchema = z.object({
  // Income
  venit: z.number().min(0),
  bonuri: z.number().min(0),
  extra: z.number().min(0),

  // Rates
  rate: z.number().min(0),

  // Bills
  apple: z.number().min(0),
  intretinere: z.number().min(0),
  internet: z.number().min(0),
  gaz: z.number().min(0),
  curent: z.number().min(0),
  telefon: z.number().min(0),
  netflix: z.number().min(0),
  sala: z.number().min(0),

  // Other
  educatie: z.number().min(0),
  sanatate: z.number().min(0),
  beauty: z.number().min(0),
  haine: z.number().min(0),

  // Spending
  diverse: z.number().min(0),
  transport: z.number().min(0),
  cadouri: z.number().min(0),
  vacante: z.number().min(0),
  casa: z.number().min(0),
  gadgets: z.number().min(0),
  tazz: z.number().min(0),
  alimente: z.number().min(0),

  // Investments
  economii_investitii: z.number().min(0),
});

export const MonthRecordSchema = z.object({
  month: z.string().regex(monthStringRegex) as z.ZodType<MonthString>,
  people: z.object({
    me: CategoryAmountsSchema,
    wife: CategoryAmountsSchema,
  }),
  meta: z.object({
    updatedAt: z.string().datetime(),
    isSaved: z.boolean(),
  }),
});

export const StorageSchema = z.object({
  version: z.number(),
  data: z.array(MonthRecordSchema),
});

// Helper function to create default CategoryAmounts
export function createDefaultCategoryAmounts(): z.infer<typeof CategoryAmountsSchema> {
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
    economii_investitii: 0,
  };
}
