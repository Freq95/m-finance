/**
 * Zustand Finance Store
 * Global state management with persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  MonthRecord,
  Person,
  PersonView,
  CategoryAmounts,
  MonthString,
  UpcomingPayment,
} from "../types";
import { loadRecords, saveRecords, createPersistStorage } from "../storage/storage";
import { createDefaultCategoryAmounts } from "../validation/schemas";
import { getCurrentMonth } from "../utils/date";
import { combineCategoryAmounts } from "../calculations/calculations";
import { logError } from "../utils/errors";
import type { DisplayCurrency, ExchangeRates } from "../utils/currency";

export type DashboardView = "month" | "annual";
export type Theme = "light" | "dark";

interface FinanceStore {
  // State
  records: MonthRecord[];
  selectedPerson: PersonView;
  selectedMonth: MonthString;
  dashboardView: DashboardView;
  theme: Theme;
  displayCurrency: DisplayCurrency;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  settings: {
    includeInvestmentsInNetCashflow: boolean;
  };
  upcomingPayments: UpcomingPayment[];

  // Actions
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  setExchangeRates: (rates: ExchangeRates | null) => void;
  loadRecords: () => Promise<void>;
  updateMonth: (
    month: MonthString,
    data: Partial<CategoryAmounts>,
    person: Person
  ) => void;
  updateMonthFull: (
    month: MonthString,
    data: { me: CategoryAmounts; wife: CategoryAmounts }
  ) => void;
  saveMonth: (month: MonthString) => Promise<void>;
  duplicateMonth: (fromMonth: MonthString, toMonth: MonthString) => void;
  resetMonth: (month: MonthString) => void;
  setSelectedPerson: (person: PersonView) => void;
  setSelectedMonth: (month: MonthString) => void;
  setDashboardView: (view: DashboardView) => void;
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
      selectedPerson: "me",
      selectedMonth: getCurrentMonth(),
      dashboardView: "month",
      theme: "light",
      displayCurrency: "RON",
      exchangeRates: null,
      isLoading: false,
      isSaving: false,
      error: null,
      settings: {
        includeInvestmentsInNetCashflow: true,
      },
      upcomingPayments: [],

      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
      setExchangeRates: (rates) => set({ exchangeRates: rates }),

      // Load records from IndexedDB
      loadRecords: async () => {
        set({ isLoading: true, error: null });
        try {
          const records = await loadRecords();
          set({ records, isLoading: false });
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
        const records = [...state.records];
        const index = records.findIndex((r) => r.month === month);

        const defaultData = createDefaultCategoryAmounts();
        const updatedData = { ...defaultData, ...data };

        if (index >= 0) {
          // Update existing record
          records[index] = {
            ...records[index],
            people: {
              ...records[index].people,
              [person]: updatedData,
            },
            meta: {
              ...records[index].meta,
              updatedAt: new Date().toISOString(),
              isSaved: false,
            },
          };
        } else {
          // Create new record
          const otherPerson = person === "me" ? "wife" : "me";
          const people =
            person === "me"
              ? { me: updatedData, wife: createDefaultCategoryAmounts() }
              : { me: createDefaultCategoryAmounts(), wife: updatedData };
          records.push({
            month,
            people,
            meta: {
              updatedAt: new Date().toISOString(),
              isSaved: false,
            },
          });
        }

        set({ records });
        saveRecords(records).catch((error) => {
          logError(error, "updateMonth autosave");
        });
      },

      updateMonthFull: (month, { me, wife }) => {
        const state = get();
        const records = [...state.records];
        const index = records.findIndex((r) => r.month === month);

        const record: MonthRecord = {
          month,
          people: { me: { ...me }, wife: { ...wife } },
          meta: {
            updatedAt: new Date().toISOString(),
            isSaved: false,
          },
        };

        if (index >= 0) {
          records[index] = record;
        } else {
          records.push(record);
        }

        set({ records });
        saveRecords(records).catch((error) => {
          logError(error, "updateMonthFull autosave");
        });
      },

      // Mark month as saved
      saveMonth: async (month) => {
        const state = get();
        const records = [...state.records];
        const index = records.findIndex((r) => r.month === month);

        if (index >= 0) {
          records[index] = {
            ...records[index],
            meta: {
              ...records[index].meta,
              isSaved: true,
              updatedAt: new Date().toISOString(),
            },
          };
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

        if (!fromRecord) {
          return;
        }

        const records = [...state.records];
        const existingIndex = records.findIndex((r) => r.month === toMonth);

        const duplicatedRecord: MonthRecord = {
          month: toMonth,
          people: {
            me: { ...fromRecord.people.me },
            wife: { ...fromRecord.people.wife },
          },
          meta: {
            updatedAt: new Date().toISOString(),
            isSaved: false,
          },
        };

        if (existingIndex >= 0) {
          records[existingIndex] = duplicatedRecord;
        } else {
          records.push(duplicatedRecord);
        }

        set({ records });
        saveRecords(records).catch((error) => {
          logError(error, "duplicateMonth");
        });
      },

      // Reset month data
      resetMonth: (month) => {
        const state = get();
        const records = [...state.records];
        const index = records.findIndex((r) => r.month === month);

        if (index >= 0) {
          records[index] = {
            month,
            people: {
              me: createDefaultCategoryAmounts(),
              wife: createDefaultCategoryAmounts(),
            },
            meta: {
              updatedAt: new Date().toISOString(),
              isSaved: false,
            },
          };
          set({ records });
          saveRecords(records).catch((error) => {
            logError(error, "resetMonth");
          });
        }
      },

      // Set selected person view
      setSelectedPerson: (person) => {
        set({ selectedPerson: person });
      },

      // Set selected month
      setSelectedMonth: (month) => {
        set({ selectedMonth: month });
      },

      // Set dashboard view (month vs annual)
      setDashboardView: (view) => {
        set({ dashboardView: view });
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

      // Get combined data for a month
      getCombinedData: (month) => {
        const state = get();
        const record = state.records.find((r) => r.month === month);
        if (!record) {
          return null;
        }
        return combineCategoryAmounts(record.people.me, record.people.wife);
      },
    }),
    {
      name: "finance-store",
      storage: createJSONStorage(() => createPersistStorage()),
      partialize: (state) => ({
        selectedPerson: state.selectedPerson,
        selectedMonth: state.selectedMonth,
        dashboardView: state.dashboardView,
        theme: state.theme,
        displayCurrency: state.displayCurrency,
        settings: state.settings,
        upcomingPayments: state.upcomingPayments,
      }),
    }
  )
);
