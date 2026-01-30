/**
 * Category configuration for Monthly Input
 * Sections and Romanian labels matching design
 */

import type { CategoryAmounts, Profile } from "./types";

/** Default profiles after migration or clear data (v3). */
export const DEFAULT_PROFILES: Profile[] = [
  { id: "me", name: "Paul" },
  { id: "wife", name: "Codru" },
];

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
    items: [
      { key: "economii", label: "Economii" },
      { key: "investitii", label: "Investiții" },
    ],
  },
];

/** @deprecated Use store profiles (profiles[].name) for display. Kept for tests/fallback. */
export const PERSON_LABELS = {
  me: "Paul",
  wife: "Codru",
} as const;

/**
 * Grouped categories for "Cheltuieli pe categorii" pie chart.
 * Keys must match CategoryAmounts. Note: "rate" (Rate) is not in any group—
 * add to Nevoi or as a 5th group if needed.
 */
export const EXPENSE_PIE_GROUPS: { id: string; label: string; keys: (keyof CategoryAmounts)[] }[] = [
  {
    id: "nevoi",
    label: "Nevoi",
    keys: ["alimente", "transport", "apple", "intretinere", "internet", "gaz", "curent", "telefon", "sala"],
  },
  {
    id: "dorinte",
    label: "Dorințe",
    keys: ["vacante", "casa", "gadgets", "haine", "beauty", "netflix", "diverse", "cadouri", "tazz"],
  },
  {
    id: "educatie",
    label: "Educație",
    keys: ["educatie"],
  },
  {
    id: "sanatate",
    label: "Sănătate",
    keys: ["sanatate"],
  },
];

/**
 * Category bars for "Pe categorii" bar chart (Venit, Rate, Facturi, Altele, Cheltuieli, Economii & Investiții).
 * Cheltuieli bar = only Cheltuieli section (not Altele); Altele is its own bar.
 */
export const CATEGORY_BAR_GROUPS: { id: string; label: string; keys: (keyof CategoryAmounts)[] }[] = [
  { id: "venit", label: "Venit", keys: ["venit", "bonuri", "extra"] },
  { id: "rate", label: "Rate", keys: ["rate"] },
  {
    id: "facturi",
    label: "Facturi",
    keys: ["apple", "intretinere", "internet", "gaz", "curent", "telefon", "netflix", "sala"],
  },
  {
    id: "altele",
    label: "Altele",
    keys: ["educatie", "sanatate", "beauty", "haine"],
  },
  {
    id: "cheltuieli",
    label: "Cheltuieli",
    keys: ["diverse", "transport", "cadouri", "vacante", "casa", "gadgets", "tazz", "alimente"],
  },
  {
    id: "economii_investitii",
    label: "Economii & Investiții",
    keys: ["economii", "investitii"],
  },
];
