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
} from "../types";
import {
  loadRecords as loadRecordsFromStorage,
  saveRecords,
  clearStorage,
  createPersistStorage,
} from "../storage/storage";
import { createDefaultCategoryAmounts } from "../validation/schemas";
import { getCurrentMonth } from "../utils/date";
import { sumCategoryAmounts } from "../calculations/calculations";
import { DEFAULT_PROFILES } from "../constants";
import { logError } from "../utils/errors";
import { findRecordIndex, upsertRecord } from "./record-helpers";
import type { DisplayCurrency, ExchangeRates } from "../utils/currency";

export type Theme = "light" | "dark";

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
  };
  exchangeRatesUpdatedAt: string | null;
  upcomingPayments: UpcomingPayment[];

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
      settings: {
        includeInvestmentsInNetCashflow: true,
        decimalPlaces: 0,
        dateLocale: "ro",
        defaultPersonView: "last_used",
        notificationsEnabled: false,
        notificationsDaysBefore: 1,
      },
      upcomingPayments: [],

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
            settings: {
              includeInvestmentsInNetCashflow: true,
              decimalPlaces: 0,
              dateLocale: "ro",
              defaultPersonView: "last_used",
              notificationsEnabled: false,
              notificationsDaysBefore: 1,
            },
            upcomingPayments: [],
          });
        } catch (error) {
          logError(error, "resetAllData");
        }
      },

      setProfiles: (profiles) => set({ profiles: [...profiles] }),
      addProfile: (name) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          profiles: [...state.profiles, { id, name: name.trim() || "Profile" }],
        }));
      },
      removeProfile: (id) => {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          selectedPerson:
            state.selectedPerson === id ? (state.profiles[0]?.id ?? "me") : state.selectedPerson,
        }));
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
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "finance-store.ts:loadRecords:entry",
            message: "store loadRecords called",
            data: { isLoadingSet: true },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H1",
          }),
        }).catch(() => {});
        // #endregion
        set({ isLoading: true, error: null });
        try {
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "finance-store.ts:loadRecords:beforeAwait",
              message: "before loadRecordsFromStorage()",
              data: {},
              timestamp: Date.now(),
              sessionId: "debug-session",
              hypothesisId: "H1",
            }),
          }).catch(() => {});
          // #endregion
          const records = await loadRecordsFromStorage();
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "finance-store.ts:loadRecords:afterLoad",
              message: "loadRecordsFromStorage returned",
              data: { recordsLength: records?.length ?? -1, isLoadingFalse: true },
              timestamp: Date.now(),
              sessionId: "debug-session",
              hypothesisId: "H1,H2",
            }),
          }).catch(() => {});
          // #endregion
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
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/7fcaf6fd-2a4f-4cef-b98e-7aeb9ab2770b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "finance-store.ts:loadRecords:catch",
              message: "loadRecords threw",
              data: { error: String(error) },
              timestamp: Date.now(),
              sessionId: "debug-session",
              hypothesisId: "H1",
            }),
          }).catch(() => {});
          // #endregion
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
        saveRecords(records).catch((error) => {
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
        saveRecords(records).catch((error) => {
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
          await saveRecords(records);
          set({ error: null });
        } catch (error) {
          logError(error, "saveMonth");
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
        saveRecords(records).catch((error) => {
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
        saveRecords(records).catch((error) => {
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
        return state.records
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, 12);
      },

      // Get last 6 months
      getLast6Months: () => {
        const state = get();
        return state.records
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, 6);
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
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        const next = { ...current, ...p };
        if (!("profiles" in p) || !Array.isArray(p.profiles)) {
          next.profiles = current.profiles;
        }
        return next;
      },
    }
  )
);
