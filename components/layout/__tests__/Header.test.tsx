/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseFinanceStore = jest.fn();
jest.mock("@/lib/store/finance-store", () => ({
  useFinanceStore: (selector: (s: unknown) => unknown) => mockUseFinanceStore(selector),
}));

jest.mock("@/lib/useDuePaymentsNotification", () => ({
  useDuePaymentsNotification: () => ({
    duePayments: [{ id: "p1", title: "Rent", date: "2026-01-10", cost: 100, icon: "Home" }],
    formatDate: (d: string) => d,
    toShow: [],
    summary: "",
    handleDismiss: () => undefined,
  }),
}));

jest.mock("@/components/shared/DuePaymentsModal", () => ({
  DuePaymentsModal: ({ open }: { open: boolean }) => (open ? <div>DuePaymentsModal</div> : null),
}));

import { Header } from "../Header";

describe("Header", () => {
  beforeEach(() => {
    const nav = require("next/navigation") as {
      __mock: { mockUsePathname: jest.Mock };
    };
    nav.__mock.mockUsePathname.mockReturnValue("/");
    mockUseFinanceStore.mockReset();
  });

  it("opens settings and toggles theme", async () => {
    const user = userEvent.setup();
    const onOpenSettings = jest.fn();
    const onOpenCalendar = jest.fn();
    const toggleTheme = jest.fn();

    const state = {
      profiles: [{ id: "me", name: "Me" }],
      selectedPerson: "me",
      setSelectedPerson: jest.fn(),
      theme: "light",
      toggleTheme,
      exchangeRates: null,
      moveUpcomingToRecent: jest.fn(),
    };
    mockUseFinanceStore.mockImplementation((selector) => selector(state));

    render(<Header onOpenSettings={onOpenSettings} onOpenCalendar={onOpenCalendar} />);

    await user.click(screen.getByLabelText("Settings"));
    expect(onOpenSettings).toHaveBeenCalled();

    await user.click(screen.getByLabelText("Comută la modul întunecat"));
    expect(toggleTheme).toHaveBeenCalled();
  });

  it("opens due payments modal when bell is clicked", async () => {
    const user = userEvent.setup();
    const state = {
      profiles: [{ id: "me", name: "Me" }],
      selectedPerson: "me",
      setSelectedPerson: jest.fn(),
      theme: "light",
      toggleTheme: jest.fn(),
      exchangeRates: null,
      moveUpcomingToRecent: jest.fn(),
    };
    mockUseFinanceStore.mockImplementation((selector) => selector(state));

    render(<Header onOpenSettings={() => undefined} onOpenCalendar={() => undefined} />);

    await user.click(screen.getByRole("button", { name: /plăți viitoare/i }));
    expect(screen.getByText("DuePaymentsModal")).toBeInTheDocument();
  });
});

