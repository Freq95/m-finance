/**
 * TypeScript Type Definitions
 * Core data types for the finance dashboard
 */

export type MonthString = `${number}-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12"}`;

/** Opaque profile id (e.g. UUID or "me", "wife" for migrated data). */
export type ProfileId = string;

/** Person view: a single profile or combined. */
export type PersonView = ProfileId | "combined";

/** Profile with display name. */
export type Profile = { id: ProfileId; name: string };

/** @deprecated Use ProfileId. Kept for migration/compat. */
export type Person = "me" | "wife";

export type CategoryAmounts = {
  // Income
  venit: number;
  bonuri: number;
  extra: number;

  // Rates
  rate: number;

  // Bills
  apple: number;
  intretinere: number;
  internet: number;
  gaz: number;
  curent: number;
  telefon: number;
  netflix: number;
  sala: number;

  // Other
  educatie: number;
  sanatate: number;
  beauty: number;
  haine: number;

  // Spending
  diverse: number;
  transport: number;
  cadouri: number;
  vacante: number;
  casa: number;
  gadgets: number;
  tazz: number;
  alimente: number;

  // Savings & Investments (separate inputs, displayed as "Economii & Investiții")
  economii: number;
  investitii: number;
};

export type MonthRecord = {
  month: MonthString;
  /** Keyed by ProfileId. v3: Record<ProfileId, CategoryAmounts>. */
  people: Record<ProfileId, CategoryAmounts>;
  meta: {
    updatedAt: string; // ISOString
    isSaved: boolean; // Required, default false
  };
};

export type StorageSchema = {
  version: number;
  data: MonthRecord[];
};

/** Full backup payload (records + profiles). Used for export/import. */
export type FullBackupSchema = StorageSchema & {
  profiles?: Profile[];
};

/** Icon key for Upcoming Payment (must match keys in UPCOMING_PAYMENT_ICONS) */
export type UpcomingPaymentIconId =
  | "Home"
  | "Car"
  | "CreditCard"
  | "Wallet"
  | "Land"
  | "Id"
  | "Heart"
  | "Utensils"
  | "ShoppingCart"
  | "Zap";

export type UpcomingPayment = {
  id: string;
  icon: UpcomingPaymentIconId;
  title: string;
  date: string; // YYYY-MM-DD
  cost: number | null; // null if unknown
};
