/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseFinanceStore = jest.fn();
const mockAddProfile = jest.fn();
const mockRemoveProfile = jest.fn();
const mockRenameProfile = jest.fn();
const mockSetProfiles = jest.fn();
const mockUpdateSettings = jest.fn();
const mockSetTheme = jest.fn();
const mockLoadRecords = jest.fn();
const mockResetAllData = jest.fn();
const mockSetExchangeRates = jest.fn();

jest.mock("@/lib/store/finance-store", () => ({
  useFinanceStore: (selector: (s: unknown) => unknown) => mockUseFinanceStore(selector),
  MAX_PROFILES: 5,
  MIN_PROFILES: 1,
}));

jest.mock("@/lib/settings/data-io", () => ({
  exportBackup: jest.fn(),
  importBackup: jest.fn(),
}));

jest.mock("@/lib/utils/currency", () => ({
  fetchExchangeRates: jest.fn(),
}));

import { SettingsModal } from "../SettingsModal";

describe("SettingsModal", () => {
  beforeEach(() => {
    mockUseFinanceStore.mockReset();
    mockAddProfile.mockReset();
    mockRemoveProfile.mockReset();
    mockRenameProfile.mockReset();
    mockSetProfiles.mockReset();
    mockUpdateSettings.mockReset();
    mockSetTheme.mockReset();
    mockLoadRecords.mockReset();
    mockResetAllData.mockReset();
    mockSetExchangeRates.mockReset();

    const state = {
      profiles: [{ id: "me", name: "Paul" }],
      records: [],
      addProfile: mockAddProfile,
      removeProfile: mockRemoveProfile,
      renameProfile: mockRenameProfile,
      setProfiles: mockSetProfiles,
      settings: {
        includeInvestmentsInNetCashflow: true,
        decimalPlaces: 0,
        dateLocale: "en",
        defaultPersonView: "last_used",
        notificationsEnabled: false,
        notificationsDaysBefore: 1,
      },
      updateSettings: mockUpdateSettings,
      theme: "light",
      setTheme: mockSetTheme,
      loadRecords: mockLoadRecords,
      resetAllData: mockResetAllData,
      setExchangeRates: mockSetExchangeRates,
      exchangeRatesUpdatedAt: null,
    };
    mockUseFinanceStore.mockImplementation((selector) => selector(state));
  });

  it("renders when open and toggles a setting", async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onOpenChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText("Include investments in net cashflow") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(mockUpdateSettings).toHaveBeenCalledWith({ includeInvestmentsInNetCashflow: false });
  });

  it("adds a profile from the Profiles section", async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onOpenChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText("Profiles")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Nume profil nou");
    await user.type(input, "New");
    await user.click(screen.getByRole("button", { name: "Adaugă profil" }));
    expect(mockAddProfile).toHaveBeenCalledWith("New");
  });
});

