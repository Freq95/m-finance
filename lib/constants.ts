/**
 * Category configuration for Monthly Input
 * Sections and Romanian labels matching design
 */

import type { CategoryAmounts } from "./types";

type CategoryKey = keyof CategoryAmounts;

export interface CategoryItem {
  key: CategoryKey;
  label: string;
}

export interface CategorySection {
  title: string;
  items: CategoryItem[];
}

export const CATEGORY_SECTIONS: CategorySection[] = [
  {
    title: "Venit",
    items: [
      { key: "venit", label: "Venit" },
      { key: "bonuri", label: "Bonuri" },
      { key: "extra", label: "Extra" },
    ],
  },
  {
    title: "Rate",
    items: [{ key: "rate", label: "Rate" }],
  },
  {
    title: "Facturi",
    items: [
      { key: "apple", label: "Apple" },
      { key: "intretinere", label: "Întreținere" },
      { key: "internet", label: "Internet" },
      { key: "gaz", label: "Gaz" },
      { key: "curent", label: "Curent" },
      { key: "telefon", label: "Telefon" },
      { key: "netflix", label: "Netflix" },
      { key: "sala", label: "Sală" },
    ],
  },
  {
    title: "Altele",
    items: [
      { key: "educatie", label: "Educație" },
      { key: "sanatate", label: "Sănătate" },
      { key: "beauty", label: "Beauty" },
      { key: "haine", label: "Haine" },
    ],
  },
  {
    title: "Cheltuieli",
    items: [
      { key: "diverse", label: "Diverse" },
      { key: "transport", label: "Transport" },
      { key: "cadouri", label: "Cadouri" },
      { key: "vacante", label: "Vacanțe" },
      { key: "casa", label: "Casă" },
      { key: "gadgets", label: "Gadgets" },
      { key: "tazz", label: "Tazz" },
      { key: "alimente", label: "Alimente" },
    ],
  },
  {
    title: "Economii & Investiții",
    items: [{ key: "economii_investitii", label: "Economii / Investiții" }],
  },
];

export const PERSON_LABELS = {
  me: "Eu",
  wife: "Soția",
} as const;
