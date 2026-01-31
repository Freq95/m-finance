/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseFinanceStore = jest.fn();
jest.mock("@/lib/store/finance-store", () => ({
  useFinanceStore: (selector: (s: unknown) => unknown) => mockUseFinanceStore(selector),
}));

const mockFetchExchangeRates = jest.fn();
jest.mock("@/lib/utils/currency", () => ({
  fetchExchangeRates: () => mockFetchExchangeRates(),
}));

const mockIsStorageAvailable = jest.fn();
jest.mock("@/lib/storage/storage", () => ({
  isStorageAvailable: () => mockIsStorageAvailable(),
}));

jest.mock("@/components/layout/Sidebar", () => ({
  Sidebar: () => <nav>Sidebar</nav>,
}));
jest.mock("@/components/layout/RightSidebar", () => ({
  RightSidebar: () => <aside>RightSidebar</aside>,
}));
jest.mock("@/components/layout/Header", () => ({
  Header: ({
    onOpenSettings,
    onOpenCalendar,
  }: {
    onOpenSettings: () => void;
    onOpenCalendar?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onOpenSettings}>
        open-settings
      </button>
      <button type="button" onClick={onOpenCalendar}>
        open-calendar
      </button>
    </div>
  ),
}));
jest.mock("@/components/shared/SettingsModal", () => ({
  SettingsModal: ({ open }: { open: boolean }) => (open ? <div>SettingsModal</div> : null),
}));
jest.mock("@/components/shared/CalendarModal", () => ({
  CalendarModal: ({ open }: { open: boolean }) => (open ? <div>CalendarModal</div> : null),
}));
jest.mock("@/components/shared/SavingsPlanModal", () => ({
  SavingsPlanModal: ({ open }: { open: boolean }) => (open ? <div>SavingsPlanModal</div> : null),
}));
jest.mock("@/components/shared/ThemeInjector", () => ({
  ThemeInjector: () => null,
}));
jest.mock("@/components/shared/ErrorBanner", () => ({
  ErrorBanner: ({ message }: { message: string }) => <div>{message}</div>,
}));

import { AppShell } from "../AppShell";

describe("AppShell", () => {
  beforeEach(() => {
    mockUseFinanceStore.mockReset();
    mockFetchExchangeRates.mockReset();
    mockIsStorageAvailable.mockReset();
  });

  it("loads records and opens modals via header callbacks", async () => {
    const user = userEvent.setup();
    const loadRecords = jest.fn();
    const setExchangeRates = jest.fn();
    const setSelectedPerson = jest.fn();

    mockFetchExchangeRates.mockResolvedValue({ usd: 5, eur: 5 });
    mockIsStorageAvailable.mockReturnValue(false);

    const state = {
      loadRecords,
      setExchangeRates,
      displayCurrency: "USD",
      settings: { defaultPersonView: "combined" },
      setSelectedPerson,
    };
    mockUseFinanceStore.mockImplementation((selector) => selector(state));

    render(
      <AppShell>
        <div>child</div>
      </AppShell>
    );

    expect(loadRecords).toHaveBeenCalledTimes(1);
    expect(setSelectedPerson).toHaveBeenCalledWith("combined");
    expect(screen.getByText("Storage is unavailable in this browser. Your data may not be saved.")).toBeInTheDocument();

    await user.click(screen.getByText("open-settings"));
    expect(screen.getByText("SettingsModal")).toBeInTheDocument();

    await user.click(screen.getByText("open-calendar"));
    expect(screen.getByText("CalendarModal")).toBeInTheDocument();
  });
});

