/** @jest-environment jsdom */
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useDuePaymentsNotification } from "../useDuePaymentsNotification";
import type { UpcomingPayment } from "../types";

const mockUseFinanceStore = jest.fn();

jest.mock("../store/finance-store", () => ({
  useFinanceStore: (selector: (state: unknown) => unknown) =>
    mockUseFinanceStore(selector),
}));

type StoreSlice = {
  upcomingPayments: UpcomingPayment[];
  settings: {
    notificationsEnabled: boolean;
    notificationsDaysBefore: number;
    dateLocale: "ro" | "en";
  };
};

function renderHook(state: StoreSlice) {
  let latest: ReturnType<typeof useDuePaymentsNotification> | null = null;
  mockUseFinanceStore.mockImplementation((selector) => selector(state));

  function TestComponent() {
    latest = useDuePaymentsNotification();
    return null;
  }

  const container = document.createElement("div");
  const root = createRoot(container);

  return {
    getLatest: () => latest,
    render: async () => {
      await act(async () => {
        root.render(React.createElement(TestComponent));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useDuePaymentsNotification", () => {
  const basePayments: UpcomingPayment[] = [
    {
      id: "p1",
      icon: "Home",
      title: "Rent",
      date: "2026-01-10",
      cost: 1000,
    },
    {
      id: "p2",
      icon: "Car",
      title: "Insurance",
      date: "2026-01-12",
      cost: 250,
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
    localStorage.clear();
    mockUseFinanceStore.mockReset();
    (global as unknown as { Notification?: unknown }).Notification = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns empty list when notifications are disabled", async () => {
    const state: StoreSlice = {
      upcomingPayments: basePayments,
      settings: {
        notificationsEnabled: false,
        notificationsDaysBefore: 3,
        dateLocale: "en",
      },
    };
    const hook = renderHook(state);
    await hook.render();

    const latest = hook.getLatest();
    expect(latest?.toShow).toHaveLength(0);
    expect(latest?.summary).toBe("");

    hook.unmount();
  });

  it("builds a summary for payments in range", async () => {
    const state: StoreSlice = {
      upcomingPayments: basePayments,
      settings: {
        notificationsEnabled: true,
        notificationsDaysBefore: 3,
        dateLocale: "en",
      },
    };
    const hook = renderHook(state);
    await hook.render();

    const latest = hook.getLatest();
    expect(latest?.toShow).toHaveLength(2);
    expect(latest?.summary).toContain("2 plăți");
    expect(latest?.formatDate("bad-date")).toBe("bad-date");

    hook.unmount();
  });

  it("dismisses payments and stores dismissed ids", async () => {
    const state: StoreSlice = {
      upcomingPayments: basePayments,
      settings: {
        notificationsEnabled: true,
        notificationsDaysBefore: 3,
        dateLocale: "en",
      },
    };
    const hook = renderHook(state);
    await hook.render();

    const latest = hook.getLatest();
    expect(latest?.toShow).toHaveLength(2);

    await act(async () => {
      latest?.handleDismiss();
    });

    const afterDismiss = hook.getLatest();
    expect(afterDismiss?.toShow).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem("finance-notification-dismissed-ids") ?? "[]")).toEqual([
      "p1",
      "p2",
    ]);

    hook.unmount();
  });
});
