/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

const mockUseFinanceStore = jest.fn();
jest.mock("@/lib/store/finance-store", () => ({
  useFinanceStore: (selector: (s: unknown) => unknown) => mockUseFinanceStore(selector),
}));

jest.mock("@/lib/dashboard/useDashboardData", () => ({
  useDashboardData: () => ({
    recordByMonth: new Map(),
    chartData: [],
    currentData: null,
    dataForPeriod: null,
    spendingByCategoryData: [],
    topSpendingCategoriesData: [],
    categoryBarData: [],
    paulVsCodruData: [],
    last6: [],
    selectedYear: 2026,
    periodLabel: "An 2026",
    domainMax: 0,
  }),
}));

jest.mock("@/components/dashboard/DashboardSkeleton", () => ({
  DashboardSkeleton: () => <div>DashboardSkeleton</div>,
}));

import Home from "../page";

describe("Dashboard page", () => {
  it("renders dashboard sections with empty data", () => {
    const state = {
      loadRecords: jest.fn(),
      clearError: jest.fn(),
      error: null,
      isLoading: false,
      selectedPerson: "me",
      setSelectedPerson: jest.fn(),
      setSelectedMonth: jest.fn(),
      setDisplayCurrency: jest.fn(),
      displayCurrency: "RON",
      exchangeRates: null,
      getCombinedData: jest.fn(),
      settings: { includeInvestmentsInNetCashflow: true, decimalPlaces: 0, dateLocale: "en" },
      records: [],
      profiles: [{ id: "me", name: "Paul" }],
    };
    mockUseFinanceStore.mockImplementation((selector) => selector(state));

    render(<Home />);

    expect(screen.getByRole("heading", { name: "Cashflow net" })).toBeInTheDocument();
    expect(screen.getByText(/Completează date în Monthly Input/)).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText(/No records/)).toBeInTheDocument();
  });
});

