/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

const mockUseFinanceStore = jest.fn();
jest.mock("@/lib/store/finance-store", () => ({
  useFinanceStore: (selector: (s: unknown) => unknown) => mockUseFinanceStore(selector),
}));

jest.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: () => void) => {
    const f = (() => fn()) as unknown as { cancel: jest.Mock };
    f.cancel = jest.fn();
    return f;
  },
}));

jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: (props: { ["aria-label"]?: string }) => (
    <input aria-label={props["aria-label"]} />
  ),
}));
jest.mock("@/components/ui/button", () => ({
  Button: (props: { children: React.ReactNode }) => <button type="button">{props.children}</button>,
}));
jest.mock("@/components/ui/card", () => ({
  Card: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
  CardHeader: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
  CardContent: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
}));
jest.mock("@/components/shared/ConfirmationModal", () => ({
  ConfirmationModal: () => null,
}));
jest.mock("@/components/shared/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>LoadingSpinner</div>,
}));
jest.mock("@/components/shared/ErrorBanner", () => ({
  ErrorBanner: ({ message }: { message: string }) => <div>{message}</div>,
}));
jest.mock("@/components/shared/SegmentPanel", () => ({
  SegmentDivider: () => <div />,
  segmentPanelStyles: { panelHeight: "h-10", segmentGroupBase: "x" },
}));
jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { MonthlyInputClient } from "../MonthlyInputClient";

describe("MonthlyInputClient", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    mockUseFinanceStore.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const createStoreState = (overrides: Record<string, unknown> = {}) => ({
    loadRecords: jest.fn(),
    clearError: jest.fn(),
    error: null,
    selectedMonth: "2026-01",
    setSelectedMonth: jest.fn(),
    records: [],
    getCurrentMonthRecord: () => null,
    updateMonthFull: jest.fn(),
    saveMonth: jest.fn(),
    saveAllMonths: jest.fn(),
    profiles: [{ id: "me", name: "Paul" }],
    duplicateMonth: jest.fn(),
    resetMonth: jest.fn(),
    isLoading: false,
    isSaving: false,
    settings: { dateLocale: "en", includeInvestmentsInNetCashflow: true },
    ...overrides,
  });

  it("shows loading spinner when loading", () => {
    const storeState = createStoreState({ isLoading: true });
    mockUseFinanceStore.mockImplementation((selector) => selector(storeState));
    render(<MonthlyInputClient />);
    expect(screen.getByText("LoadingSpinner")).toBeInTheDocument();
  });

  it("shows a message when there are no profiles", () => {
    const storeState = createStoreState({ profiles: [] });
    mockUseFinanceStore.mockImplementation((selector) => selector(storeState));
    render(<MonthlyInputClient />);
    expect(screen.getByText(/Nu există profiluri/i)).toBeInTheDocument();
  });

  it("renders the input grid for profiles", () => {
    const storeState = createStoreState();
    mockUseFinanceStore.mockImplementation((selector) => selector(storeState));

    render(<MonthlyInputClient />);
    expect(screen.getByRole("button", { name: "Luna curentă" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Venit Paul" })).toBeInTheDocument();
  });
});

