/** @jest-environment jsdom */
import { renderHook } from "@testing-library/react";

const mockUseFinanceStore = jest.fn();
jest.mock("@/lib/store/finance-store", () => ({
  useFinanceStore: (selector: (s: unknown) => unknown) => mockUseFinanceStore(selector),
}));

const mockBuildRecordByMonth = jest.fn();
const mockBuildChartData = jest.fn();
const mockBuildCurrentData = jest.fn();
const mockBuildDataForPeriod = jest.fn();
const mockBuildSpendingByCategoryData = jest.fn();
const mockBuildCategoryBarData = jest.fn();
const mockBuildTopSpendingCategoriesData = jest.fn();
const mockBuildProfileComparisonData = jest.fn();
const mockGetChartDomainMax = jest.fn();

jest.mock("../dashboard-data", () => ({
  buildRecordByMonth: (...args: unknown[]) => mockBuildRecordByMonth(...args),
  buildChartData: (...args: unknown[]) => mockBuildChartData(...args),
  buildCurrentData: (...args: unknown[]) => mockBuildCurrentData(...args),
  buildDataForPeriod: (...args: unknown[]) => mockBuildDataForPeriod(...args),
  buildSpendingByCategoryData: (...args: unknown[]) => mockBuildSpendingByCategoryData(...args),
  buildCategoryBarData: (...args: unknown[]) => mockBuildCategoryBarData(...args),
  buildTopSpendingCategoriesData: (...args: unknown[]) => mockBuildTopSpendingCategoriesData(...args),
  buildProfileComparisonData: (...args: unknown[]) => mockBuildProfileComparisonData(...args),
  getChartDomainMax: (...args: unknown[]) => mockGetChartDomainMax(...args),
}));

describe("useDashboardData", () => {
  beforeEach(() => {
    mockUseFinanceStore.mockReset();
    mockBuildRecordByMonth.mockReset();
    mockBuildChartData.mockReset();
    mockBuildCurrentData.mockReset();
    mockBuildDataForPeriod.mockReset();
    mockBuildSpendingByCategoryData.mockReset();
    mockBuildCategoryBarData.mockReset();
    mockBuildTopSpendingCategoriesData.mockReset();
    mockBuildProfileComparisonData.mockReset();
    mockGetChartDomainMax.mockReset();
  });

  it("wires store + dashboard-data builders together", async () => {
    const getCombinedData = jest.fn();
    const getLast6Months = jest.fn().mockReturnValue([]);

    const state = {
      records: [],
      profiles: [
        { id: "me", name: "Me" },
        { id: "wife", name: "Wife" },
      ],
      selectedMonth: "2026-01",
      selectedPerson: "me",
      getCombinedData,
      settings: { includeInvestmentsInNetCashflow: true, dateLocale: "en" },
      getLast6Months,
    };

    mockUseFinanceStore.mockImplementation((selector) => selector(state));
    mockBuildRecordByMonth.mockReturnValue(new Map());
    mockBuildChartData.mockReturnValue([{ month: "2026-01" }]);
    mockBuildCurrentData.mockReturnValue(null);
    mockBuildDataForPeriod.mockReturnValue(null);
    mockBuildSpendingByCategoryData.mockReturnValue([]);
    mockBuildTopSpendingCategoriesData.mockReturnValue([]);
    mockBuildCategoryBarData.mockReturnValue([]);
    mockBuildProfileComparisonData.mockReturnValue([]);
    mockGetChartDomainMax.mockReturnValue(123);

    const { useDashboardData } = await import("../useDashboardData");
    const { result } = renderHook(() => useDashboardData());

    expect(result.current.selectedYear).toBe(2026);
    expect(result.current.domainMax).toBe(123);
    expect(mockBuildChartData).toHaveBeenCalled();
    expect(mockBuildProfileComparisonData).toHaveBeenCalled();
  });
});

describe("useDashboardLoad", () => {
  it("calls loadRecords once on mount", async () => {
    const loadRecords = jest.fn();
    mockUseFinanceStore.mockImplementation((selector) =>
      selector({
        loadRecords,
      })
    );

    const { useDashboardLoad } = await import("../useDashboardData");
    renderHook(() => useDashboardLoad());
    expect(loadRecords).toHaveBeenCalledTimes(1);
  });
});

