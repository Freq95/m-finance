/**
 * Zustand Finance Store
 * Global state management with persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  MonthRecord,
  PersonView,
  Profile,
  ProfileId,
  CategoryAmounts,
  MonthString,
  UpcomingPayment,
  RecentActivity,
  SavingsPlan,
  SavingsPlanBlock,
  SavingsPlanItem,
  IncomeEstimatesByProfile,
  IncomeEstimateSummary,
  IncomeEstimateSummaryByYear,
  IncomeEstimateYearData,
} from "../types";
import {
  loadRecords as loadRecordsFromStorage,
  saveRecords,
  clearStorage,
  createPersistStorage,
} from "../storage/storage";
import {
  createDefaultCategoryAmounts,
  createDefaultIncomeEstimateSummary,
  createDefaultIncomeEstimateYear,
} from "../validation/schemas";
import { getCurrentMonth } from "../utils/date";
import { sumCategoryAmounts } from "../calculations/calculations";
import { addMonths, addWeeks, addYears, format, parseISO } from "date-fns";
import { DEFAULT_PROFILES } from "../constants";
import { logError } from "../utils/errors";
import { findRecordIndex, upsertRecord } from "./record-helpers";
import type { DisplayCurrency, ExchangeRates } from "../utils/currency";

export type Theme = "light" | "dark";

/** Maximum number of profiles allowed */
export const MAX_PROFILES = 5;

/** Minimum number of profiles required */
export const MIN_PROFILES = 1;

let cachedSortedRecords: MonthRecord[] = [];
let cachedSortedRecordsRef: MonthRecord[] | null = null;

function getSortedRecords(records: MonthRecord[]): MonthRecord[] {
  if (records === cachedSortedRecordsRef) return cachedSortedRecords;
  cachedSortedRecordsRef = records;
  cachedSortedRecords = [...records].sort((a, b) => b.month.localeCompare(a.month));
  return cachedSortedRecords;
}

function createId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultSavingsPlan(): SavingsPlan {
  return {
    expenses: [
      { id: createId("exp"), label: "credit imobiliar", amount: 2500 },
      { id: createId("exp"), label: "credit nevoi", amount: 1800 },
      { id: createId("exp"), label: "thermomix", amount: 700 },
      { id: createId("exp"), label: "facturi", amount: 1000 },
      { id: createId("exp"), label: "trai", amount: 5000 },
    ],
    blocks: [
      {
        id: createId("block"),
        title: "incepand cu Ianuarie 2026",
        income: 25000,
        out: 11000,
        allocations: [
          { id: createId("alloc"), label: "anticipat - nevoi", amount: 10000 },
          { id: createId("alloc"), label: "actiuni", amount: 2500 },
          { id: createId("alloc"), label: "economii", amount: 1500 },
        ],
        note: "achitare in 5 luni",
      },
      {
        id: createId("block"),
        title: "incepand cu Iunie 2026",
        income: 25000,
        out: 8500,
        allocations: [
          { id: createId("alloc"), label: "anticipat - imobiliar", amount: 10000 },
          { id: createId("alloc"), label: "actiuni", amount: 2500 },
          { id: createId("alloc"), label: "economii", amount: 1500 },
        ],
      },
      {
        id: createId("block"),
        title: "incepand cu 2030",
        income: 25000,
        out: 6000,
        allocations: [
          { id: createId("alloc"), label: "actiuni", amount: 10000 },
          { id: createId("alloc"), label: "economii", amount: 9000 },
        ],
      },
    ],
    milestones: [
      { id: createId("mile"), label: "Achitare", amount: 10000, note: "in 45 luni • Martie 2030" },
      { id: createId("mile"), label: "Achitare", amount: 11000, note: "in 41 luni • Noiembrie 2029" },
      { id: createId("mile"), label: "Achitare", amount: 12500, note: "in 36 luni • Iunie 2029" },
    ],
    notes: [
      "* nu s-a luat in calcul cresteri/bonusuri/vacante/scaderi salariale",
      "** de stabilit ce facem cu suma de 2500 lei extra lunara",
    ],
  };
}

function ensureIncomeEstimateYearData(
  data: IncomeEstimatesByProfile,
  profileId: ProfileId,
  year: number
): IncomeEstimatesByProfile {
  const byProfile = data[profileId];
  if (byProfile?.[year]) return data;
  return {
    ...data,
    [profileId]: {
      ...(byProfile ?? {}),
      [year]: createDefaultIncomeEstimateYear(year),
    },
  };
}

function ensureIncomeEstimateSummary(
  data: IncomeEstimateSummaryByYear,
  year: number
): IncomeEstimateSummaryByYear {
  if (data[year]) return data;
  return { ...data, [year]: createDefaultIncomeEstimateSummary() };
}

/**
 * Serialized save queue to prevent race conditions.
 * Only one save operation runs at a time. If saves are queued while one is in progress,
 * only the latest state is saved (the intermediate states are skipped).
 */
let pendingSave: Promise<void> = Promise.resolve();
let latestRecordsToSave: MonthRecord[] | null = null;
let saveInProgress = false;

async function queueSaveRecords(records: MonthRecord[]): Promise<void> {
  latestRecordsToSave = records;
  
  if (saveInProgress) {
    // A save is already in progress; the latest state will be picked up when it finishes
    return pendingSave;
  }
  
  saveInProgress = true;
  
  pendingSave = (async () => {
    try {
      while (latestRecordsToSave !== null) {
        const recordsToSave = latestRecordsToSave;
        latestRecordsToSave = null; // Clear so we can detect new updates during save
        await saveRecords(recordsToSave);
      }
    } finally {
      saveInProgress = false;
    }
  })();
  
  return pendingSave;
}

function getNextRecurringDate(
  dateStr: string,
  recurrence: UpcomingPayment["recurrence"]
): string | null {
  if (!recurrence || recurrence === "none") return null;
  const parsed = parseISO(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  switch (recurrence) {
    case "weekly":
      return format(addWeeks(parsed, 1), "yyyy-MM-dd");
    case "monthly":
      return format(addMonths(parsed, 1), "yyyy-MM-dd");
    case "yearly":
      return format(addYears(parsed, 1), "yyyy-MM-dd");
    default:
      return null;
  }
}

interface FinanceStore {
  // State
  records: MonthRecord[];
  profiles: Profile[];
  selectedPerson: PersonView;
  selectedMonth: MonthString;
  theme: Theme;
  displayCurrency: DisplayCurrency;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  settings: {
    includeInvestmentsInNetCashflow: boolean;
    decimalPlaces: 0 | 2;
    dateLocale: "ro" | "en";
    defaultPersonView: "last_used" | PersonView;
    notificationsEnabled: boolean;
    notificationsDaysBefore: number;
    incomeEstimateFields: {
      venit: boolean;
      bonuri: boolean;
      extra: boolean;
    };
  };
  exchangeRatesUpdatedAt: string | null;
  upcomingPayments: UpcomingPayment[];
  recentActivities: RecentActivity[];
  savingsPlan: SavingsPlan;
  incomeEstimates: IncomeEstimatesByProfile;
  incomeEstimateSummaryByYear: IncomeEstimateSummaryByYear;

  // Actions
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  setExchangeRates: (rates: ExchangeRates | null) => void;
  loadRecords: () => Promise<void>;
  resetAllData: () => Promise<void>;
  setProfiles: (profiles: Profile[]) => void;
  addProfile: (name: string) => void;
  removeProfile: (id: ProfileId) => void;
  renameProfile: (id: ProfileId, name: string) => void;
  updateMonth: (
    month: MonthString,
    data: Partial<CategoryAmounts>,
    person: ProfileId
  ) => void;
  updateMonthFull: (
    month: MonthString,
    data: Record<ProfileId, CategoryAmounts>
  ) => void;
  saveMonth: (month: MonthString) => Promise<void>;
  saveAllMonths: () => Promise<void>;
  duplicateMonth: (fromMonth: MonthString, toMonth: MonthString) => void;
  resetMonth: (month: MonthString) => void;
  setSelectedPerson: (person: PersonView) => void;
  setSelectedMonth: (month: MonthString) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  updateSettings: (settings: Partial<FinanceStore["settings"]>) => void;
  clearError: () => void;
  addUpcomingPayment: (item: Omit<UpcomingPayment, "id">) => void;
  updateUpcomingPayment: (id: string, item: Partial<Omit<UpcomingPayment, "id">>) => void;
  removeUpcomingPayment: (id: string) => void;
  moveUpcomingToRecent: (id: string) => void;
  moveRecentBackToUpcoming: (id: string) => void;

  setSavingsPlan: (plan: SavingsPlan) => void;
  updateSavingsPlan: (patch: Partial<SavingsPlan>) => void;
  addSavingsPlanExpense: () => void;
  updateSavingsPlanExpense: (id: string, patch: Partial<SavingsPlanItem>) => void;
  removeSavingsPlanExpense: (id: string) => void;
  addSavingsPlanBlock: () => void;
  updateSavingsPlanBlock: (id: string, patch: Partial<SavingsPlanBlock>) => void;
  removeSavingsPlanBlock: (id: string) => void;
  addSavingsPlanAllocation: (blockId: string) => void;
  updateSavingsPlanAllocation: (
    blockId: string,
    allocationId: string,
    patch: Partial<SavingsPlanItem>
  ) => void;
  removeSavingsPlanAllocation: (blockId: string, allocationId: string) => void;
  addSavingsPlanMilestone: () => void;
  updateSavingsPlanMilestone: (id: string, patch: Partial<SavingsPlanItem>) => void;
  removeSavingsPlanMilestone: (id: string) => void;
  addSavingsPlanNote: () => void;
  updateSavingsPlanNote: (index: number, value: string) => void;
  removeSavingsPlanNote: (index: number) => void;

  ensureIncomeEstimatesForYear: (year: number) => void;
  updateIncomeEstimateMonth: (
    profileId: ProfileId,
    year: number,
    month: MonthString,
    value: number
  ) => void;
  updateIncomeEstimateSummary: (
    year: number,
    patch: Partial<IncomeEstimateSummary>
  ) => void;

  // Selectors (computed)
  getCurrentMonthRecord: () => MonthRecord | null;
  getLast12Months: () => MonthRecord[];
  getLast6Months: () => MonthRecord[];
  getCombinedData: (month: MonthString) => CategoryAmounts | null;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      records: [],
      profiles: [...DEFAULT_PROFILES],
      selectedPerson: "me",
      selectedMonth: getCurrentMonth(),
      theme: "light",
      displayCurrency: "RON",
      exchangeRates: null,
      exchangeRatesUpdatedAt: null,
      isLoading: false,
      isSaving: false,
      error: null,
      savingsPlan: createDefaultSavingsPlan(),
      incomeEstimates: {},
      incomeEstimateSummaryByYear: {},
      settings: {
        includeInvestmentsInNetCashflow: true,
        decimalPlaces: 0,
        dateLocale: "ro",
        defaultPersonView: "last_used",
        notificationsEnabled: false,
        notificationsDaysBefore: 1,
        incomeEstimateFields: {
          venit: true,
          bonuri: true,
          extra: true,
        },
      },
      upcomingPayments: [],
      recentActivities: [],

      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
      setExchangeRates: (rates) =>
        set({
          exchangeRates: rates,
          exchangeRatesUpdatedAt: rates ? new Date().toISOString() : null,
        }),

      // Clear all data and reset state
      resetAllData: async () => {
        try {
          await clearStorage();
          set({
            records: [],
            profiles: [...DEFAULT_PROFILES],
            selectedPerson: "me",
            selectedMonth: getCurrentMonth(),
            theme: "light",
            displayCurrency: "RON",
            exchangeRates: null,
            exchangeRatesUpdatedAt: null,
            error: null,
            savingsPlan: createDefaultSavingsPlan(),
            incomeEstimates: {},
            incomeEstimateSummaryByYear: {},
            settings: {
              includeInvestmentsInNetCashflow: true,
              decimalPlaces: 0,
              dateLocale: "ro",
              defaultPersonView: "last_used",
              notificationsEnabled: false,
              notificationsDaysBefore: 1,
              incomeEstimateFields: {
                venit: true,
                bonuri: true,
                extra: true,
              },
            },
            upcomingPayments: [],
            recentActivities: [],
          });
        } catch (error) {
          logError(error, "resetAllData");
        }
      },

      setProfiles: (profiles) => {
        // Enforce profile limits on bulk set (e.g., from import)
        const clamped = profiles.slice(0, MAX_PROFILES);
        if (clamped.length < MIN_PROFILES) {
          // If imported data has no profiles, keep current profiles
          return;
        }
        set((state) => {
          const nextIncome: IncomeEstimatesByProfile = {};
          for (const p of clamped) {
            if (state.incomeEstimates[p.id]) {
              nextIncome[p.id] = state.incomeEstimates[p.id];
            } else {
              nextIncome[p.id] = {};
            }
          }
          return { profiles: [...clamped], incomeEstimates: nextIncome };
        });
      },
      addProfile: (name) => {
        const state = get();
        // Enforce maximum profile limit
        if (state.profiles.length >= MAX_PROFILES) {
          set({ error: `Număr maxim de profiluri atins (${MAX_PROFILES})` });
          return;
        }
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          profiles: [...state.profiles, { id, name: name.trim() || "Profile" }],
          incomeEstimates: { ...state.incomeEstimates, [id]: {} },
          error: null, // Clear any previous error
        }));
      },
      removeProfile: (id) => {
        const state = get();
        // Enforce minimum profile limit
        if (state.profiles.length <= MIN_PROFILES) {
          set({ error: `Trebuie să existe cel puțin ${MIN_PROFILES} profil` });
          return;
        }
        set((state) => {
          const nextProfiles = state.profiles.filter((p) => p.id !== id);
          const nextIncome = { ...state.incomeEstimates };
          delete nextIncome[id];
          return {
            profiles: nextProfiles,
            incomeEstimates: nextIncome,
            selectedPerson:
              state.selectedPerson === id
                ? (nextProfiles[0]?.id ?? "me")
                : state.selectedPerson,
            error: null, // Clear any previous error
          };
        });
      },
      renameProfile: (id, name) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, name: name.trim() || p.name } : p
          ),
        }));
      },

      // Load records from IndexedDB
      loadRecords: async () => {
        set({ isLoading: true, error: null });
        try {
          const records = await loadRecordsFromStorage();
          set({ records, isLoading: false });
          // If current selectedMonth has no data in loaded records, switch to latest month that has data (fixes Dashboard showing empty when data is for past years)
          const state = get();
          if (
            state.records.length > 0 &&
            !state.records.some((r) => r.month === state.selectedMonth)
          ) {
            const sortedMonths = state.records.map((r) => r.month).sort();
            const latestMonth = sortedMonths[sortedMonths.length - 1];
            set({ selectedMonth: latestMonth });
          }
        } catch (error) {
          logError(error, "loadRecords");
          set({
            error: "Failed to load records",
            isLoading: false,
          });
        }
      },

      // Update month data
      updateMonth: (month, data, person) => {
        const state = get();
        const index = findRecordIndex(state.records, month);
        const defaultData = createDefaultCategoryAmounts();
        const updatedData = { ...defaultData, ...data };

        const existingPeople =
          index >= 0 ? { ...state.records[index].people } : ({} as Record<ProfileId, CategoryAmounts>);
        existingPeople[person] = updatedData;
        // Ensure every active profile has an entry
        for (const p of state.profiles) {
          if (!(p.id in existingPeople)) existingPeople[p.id] = createDefaultCategoryAmounts();
        }

        const record: MonthRecord = {
          month,
          people: existingPeople,
          meta:
            index >= 0
              ? {
                  ...state.records[index].meta,
                  updatedAt: new Date().toISOString(),
                  isSaved: false,
                }
              : {
                  updatedAt: new Date().toISOString(),
                  isSaved: false,
                },
        };

        const records = upsertRecord(state.records, record);
        set({ records });
        queueSaveRecords(records).catch((error) => {
          logError(error, "updateMonth autosave");
        });
      },

      updateMonthFull: (month, data) => {
        const state = get();
        const people: Record<ProfileId, CategoryAmounts> = {};
        for (const p of state.profiles) {
          people[p.id] = data[p.id] ? { ...data[p.id] } : createDefaultCategoryAmounts();
        }
        const record: MonthRecord = {
          month,
          people,
          meta: {
            updatedAt: new Date().toISOString(),
            isSaved: false,
          },
        };
        const records = upsertRecord(state.records, record);
        set({ records });
        queueSaveRecords(records).catch((error) => {
          logError(error, "updateMonthFull autosave");
        });
      },

      // Mark month as saved
      saveMonth: async (month) => {
        const state = get();
        const index = findRecordIndex(state.records, month);
        if (index < 0) return;

        const record: MonthRecord = {
          ...state.records[index],
          meta: {
            ...state.records[index].meta,
            isSaved: true,
            updatedAt: new Date().toISOString(),
          },
        };
        const records = upsertRecord(state.records, record);
        set({ records, isSaving: true, error: null });
        try {
          await queueSaveRecords(records);
          set({ error: null });
        } catch (error) {
          logError(error, "saveMonth");
          set({ error: "Failed to save" });
        } finally {
          set({ isSaving: false });
        }
      },

      // Mark all months as saved
      saveAllMonths: async () => {
        const state = get();
        if (state.records.length === 0) return;
        const now = new Date().toISOString();
        const records = state.records.map((record) => ({
          ...record,
          meta: {
            ...record.meta,
            isSaved: true,
            updatedAt: now,
          },
        }));
        set({ records, isSaving: true, error: null });
        try {
          await queueSaveRecords(records);
          set({ error: null });
        } catch (error) {
          logError(error, "saveAllMonths");
          set({ error: "Failed to save" });
        } finally {
          set({ isSaving: false });
        }
      },

      clearError: () => set({ error: null }),

      addUpcomingPayment: (item) => {
        const id = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `up-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          upcomingPayments: [...state.upcomingPayments, { ...item, id }],
        }));
      },
      updateUpcomingPayment: (id, item) => {
        set((state) => ({
          upcomingPayments: state.upcomingPayments.map((p) =>
            p.id === id ? { ...p, ...item } : p
          ),
        }));
      },
      removeUpcomingPayment: (id) => {
        set((state) => ({
          upcomingPayments: state.upcomingPayments.filter((p) => p.id !== id),
        }));
      },

      moveUpcomingToRecent: (id) => {
        set((state) => {
          const payment = state.upcomingPayments.find((p) => p.id === id);
          if (!payment) return state;
          const completedAt = new Date().toISOString();
          const nextDate = getNextRecurringDate(payment.date, payment.recurrence);
          const activity: RecentActivity = {
            ...payment,
            id: nextDate ? `${payment.id}-${Date.now()}` : payment.id,
            completedAt,
            sourceId: payment.id,
          };
          if (nextDate) {
            const updatedUpcoming: UpcomingPayment = {
              ...payment,
              date: nextDate,
            };
            return {
              upcomingPayments: state.upcomingPayments.map((p) =>
                p.id === payment.id ? updatedUpcoming : p
              ),
              recentActivities: [activity, ...state.recentActivities].slice(0, 50),
            };
          }
          return {
            upcomingPayments: state.upcomingPayments.filter((p) => p.id !== id),
            recentActivities: [activity, ...state.recentActivities].slice(0, 50),
          };
        });
      },

      moveRecentBackToUpcoming: (id) => {
        set((state) => {
          const activity = state.recentActivities.find((a) => a.id === id);
          if (!activity) return state;
          const { completedAt: _, sourceId, ...payment } = activity;
          const targetId = sourceId ?? payment.id;
          if (state.upcomingPayments.some((p) => p.id === targetId)) {
            return {
              recentActivities: state.recentActivities.filter((a) => a.id !== id),
            };
          }
          return {
            recentActivities: state.recentActivities.filter((a) => a.id !== id),
            upcomingPayments: [...state.upcomingPayments, { ...payment, id: targetId }],
          };
        });
      },

      setSavingsPlan: (plan) => set({ savingsPlan: plan }),
      updateSavingsPlan: (patch) =>
        set((state) => ({ savingsPlan: { ...state.savingsPlan, ...patch } })),
      addSavingsPlanExpense: () =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            expenses: [
              ...state.savingsPlan.expenses,
              { id: createId("exp"), label: "", amount: 0 },
            ],
          },
        })),
      updateSavingsPlanExpense: (id, patch) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            expenses: state.savingsPlan.expenses.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            ),
          },
        })),
      removeSavingsPlanExpense: (id) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            expenses: state.savingsPlan.expenses.filter((item) => item.id !== id),
          },
        })),
      addSavingsPlanBlock: () =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            blocks: [
              ...state.savingsPlan.blocks,
              {
                id: createId("block"),
                title: "incepand cu",
                income: 0,
                out: 0,
                allocations: [],
              },
            ],
          },
        })),
      updateSavingsPlanBlock: (id, patch) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            blocks: state.savingsPlan.blocks.map((block) =>
              block.id === id ? { ...block, ...patch } : block
            ),
          },
        })),
      removeSavingsPlanBlock: (id) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            blocks: state.savingsPlan.blocks.filter((block) => block.id !== id),
          },
        })),
      addSavingsPlanAllocation: (blockId) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            blocks: state.savingsPlan.blocks.map((block) =>
              block.id === blockId
                ? {
                    ...block,
                    allocations: [
                      ...block.allocations,
                      { id: createId("alloc"), label: "", amount: 0 },
                    ],
                  }
                : block
            ),
          },
        })),
      updateSavingsPlanAllocation: (blockId, allocationId, patch) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            blocks: state.savingsPlan.blocks.map((block) =>
              block.id === blockId
                ? {
                    ...block,
                    allocations: block.allocations.map((item) =>
                      item.id === allocationId ? { ...item, ...patch } : item
                    ),
                  }
                : block
            ),
          },
        })),
      removeSavingsPlanAllocation: (blockId, allocationId) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            blocks: state.savingsPlan.blocks.map((block) =>
              block.id === blockId
                ? {
                    ...block,
                    allocations: block.allocations.filter((item) => item.id !== allocationId),
                  }
                : block
            ),
          },
        })),
      addSavingsPlanMilestone: () =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            milestones: [
              ...state.savingsPlan.milestones,
              { id: createId("mile"), label: "", amount: 0, note: "" },
            ],
          },
        })),
      updateSavingsPlanMilestone: (id, patch) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            milestones: state.savingsPlan.milestones.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            ),
          },
        })),
      removeSavingsPlanMilestone: (id) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            milestones: state.savingsPlan.milestones.filter((item) => item.id !== id),
          },
        })),
      addSavingsPlanNote: () =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            notes: [...state.savingsPlan.notes, ""],
          },
        })),
      updateSavingsPlanNote: (index, value) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            notes: state.savingsPlan.notes.map((note, i) =>
              i === index ? value : note
            ),
          },
        })),
      removeSavingsPlanNote: (index) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            notes: state.savingsPlan.notes.filter((_, i) => i !== index),
          },
        })),

      ensureIncomeEstimatesForYear: (year) =>
        set((state) => {
          let next: IncomeEstimatesByProfile = state.incomeEstimates;
          for (const p of state.profiles) {
            next = ensureIncomeEstimateYearData(next, p.id, year);
          }
          const nextSummary = ensureIncomeEstimateSummary(
            state.incomeEstimateSummaryByYear,
            year
          );
          if (next === state.incomeEstimates && nextSummary === state.incomeEstimateSummaryByYear) {
            return state;
          }
          return {
            incomeEstimates: next,
            incomeEstimateSummaryByYear: nextSummary,
          };
        }),
      updateIncomeEstimateMonth: (profileId, year, month, value) =>
        set((state) => {
          const ensured = ensureIncomeEstimateYearData(
            state.incomeEstimates,
            profileId,
            year
          );
          const yearData =
            ensured[profileId]?.[year] ?? createDefaultIncomeEstimateYear(year);
          const nextYear: IncomeEstimateYearData = {
            ...yearData,
            months: { ...yearData.months, [month]: value },
          };
          return {
            incomeEstimates: {
              ...ensured,
              [profileId]: { ...(ensured[profileId] ?? {}), [year]: nextYear },
            },
          };
        }),
      updateIncomeEstimateSummary: (year, patch) =>
        set((state) => {
          const ensured = ensureIncomeEstimateSummary(
            state.incomeEstimateSummaryByYear,
            year
          );
          return {
            incomeEstimateSummaryByYear: {
              ...ensured,
              [year]: { ...ensured[year], ...patch },
            },
          };
        }),

      // Duplicate month data
      duplicateMonth: (fromMonth, toMonth) => {
        const state = get();
        const fromRecord = state.records.find((r) => r.month === fromMonth);
        if (!fromRecord) return;

        const people: Record<ProfileId, CategoryAmounts> = {};
        const profileIds = new Set([...state.profiles.map((p) => p.id), ...Object.keys(fromRecord.people)]);
        for (const id of profileIds) {
          people[id] = fromRecord.people[id]
            ? { ...fromRecord.people[id] }
            : createDefaultCategoryAmounts();
        }

        const duplicatedRecord: MonthRecord = {
          month: toMonth,
          people,
          meta: {
            updatedAt: new Date().toISOString(),
            isSaved: false,
          },
        };
        const records = upsertRecord(state.records, duplicatedRecord);
        set({ records });
        queueSaveRecords(records).catch((error) => {
          logError(error, "duplicateMonth");
        });
      },

      // Reset month data
      resetMonth: (month) => {
        const state = get();
        const index = findRecordIndex(state.records, month);
        if (index < 0) return;

        const people: Record<ProfileId, CategoryAmounts> = {};
        for (const p of state.profiles) {
          people[p.id] = createDefaultCategoryAmounts();
        }

        const record: MonthRecord = {
          month,
          people,
          meta: {
            updatedAt: new Date().toISOString(),
            isSaved: false,
          },
        };
        const records = upsertRecord(state.records, record);
        set({ records });
        queueSaveRecords(records).catch((error) => {
          logError(error, "resetMonth");
        });
      },

      // Set selected person view
      setSelectedPerson: (person) => {
        set({ selectedPerson: person });
      },

      // Set selected month
      setSelectedMonth: (month) => {
        set({ selectedMonth: month });
      },

      setTheme: (theme) => {
        set({ theme });
      },
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" }));
      },

      // Update settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Get current month record
      getCurrentMonthRecord: () => {
        const state = get();
        return state.records.find((r) => r.month === state.selectedMonth) || null;
      },

      // Get last 12 months
      getLast12Months: () => {
        const state = get();
        return getSortedRecords(state.records).slice(0, 12);
      },

      // Get last 6 months
      getLast6Months: () => {
        const state = get();
        return getSortedRecords(state.records).slice(0, 6);
      },

      // Get combined data for a month (sum over active profiles that have data)
      getCombinedData: (month) => {
        const state = get();
        const record = state.records.find((r) => r.month === month);
        if (!record) return null;
        const profileIds = new Set(state.profiles.map((p) => p.id));
        const items = state.profiles
          .map((p) => record.people[p.id])
          .filter((d): d is CategoryAmounts => d != null);
        if (items.length === 0) return null;
        return sumCategoryAmounts(items);
      },
    }),
    {
      name: "finance-store",
      storage: createJSONStorage(() => createPersistStorage()),
      partialize: (state) => ({
        profiles: state.profiles,
        selectedPerson: state.selectedPerson,
        selectedMonth: state.selectedMonth,
        theme: state.theme,
        displayCurrency: state.displayCurrency,
        exchangeRatesUpdatedAt: state.exchangeRatesUpdatedAt,
        settings: state.settings,
        upcomingPayments: state.upcomingPayments,
        recentActivities: state.recentActivities,
        savingsPlan: state.savingsPlan,
        incomeEstimates: state.incomeEstimates,
        incomeEstimateSummaryByYear: state.incomeEstimateSummaryByYear,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        const next = { ...current, ...p };
        if (!("profiles" in p) || !Array.isArray(p.profiles)) {
          next.profiles = current.profiles;
        }
        if (!("incomeEstimates" in p)) {
          next.incomeEstimates = current.incomeEstimates;
        }
        if (!("incomeEstimateSummaryByYear" in p)) {
          next.incomeEstimateSummaryByYear = current.incomeEstimateSummaryByYear;
        }
        if (
          "settings" in p &&
          p.settings &&
          typeof p.settings === "object" &&
          !Array.isArray(p.settings)
        ) {
          next.settings = { ...current.settings, ...(p.settings as Record<string, unknown>) };
        }
        return next;
      },
    }
  )
);
