import { getPaymentsDueWithinDays } from "../notifications";
import type { UpcomingPayment } from "../types";

describe("getPaymentsDueWithinDays", () => {
  const payments: UpcomingPayment[] = [
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
    {
      id: "p3",
      icon: "Wallet",
      title: "Later",
      date: "2026-01-20",
      cost: 10,
    },
  ];

  it("returns items due within N days inclusive", () => {
    const result = getPaymentsDueWithinDays(payments, 3, "2026-01-10");
    expect(result.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("returns only today when days is 1", () => {
    const result = getPaymentsDueWithinDays(payments, 1, "2026-01-10");
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });

  it("returns only today when days is 0", () => {
    const result = getPaymentsDueWithinDays(payments, 0, "2026-01-10");
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });
});
