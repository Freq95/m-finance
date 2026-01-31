/** @jest-environment jsdom */
import type { CategoryAmounts, MonthRecord, Profile } from "../../types";
import { createDefaultCategoryAmounts } from "../../validation/schemas";

const mockLoadRecords = jest.fn();
const mockSaveRecords = jest.fn();
const mockClearStorage = jest.fn();
const mockCreatePersistStorage = jest.fn();

jest.mock("../../storage/storage", () => ({
  loadRecords: () => mockLoadRecords(),
  saveRecords: (records: unknown) => mockSaveRecords(records),
  clearStorage: () => mockClearStorage(),
  createPersistStorage: () => mockCreatePersistStorage(),
}));

function makePeople(profiles: Profile[]): Record<string, CategoryAmounts> {
  const people: Record<string, CategoryAmounts> = {};
  for (const p of profiles) people[p.id] = createDefaultCategoryAmounts();
  return people;
}

describe("finance-store", () => {
  beforeEach(() => {
    jest.resetModules();
    mockLoadRecords.mockReset();
    mockSaveRecords.mockReset();
    mockClearStorage.mockReset();
    mockCreatePersistStorage.mockReset();

    const mem = new Map<string, string>();
    mockCreatePersistStorage.mockImplementation(() => ({
      getItem: async (name: string) => mem.get(name) ?? null,
      setItem: async (name: string, value: string) => {
        mem.set(name, value);
      },
      removeItem: async (name: string) => {
        mem.delete(name);
      },
    }));

    // For deterministic IDs in tests
    (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto = {
      randomUUID: () => "uuid-1",
    };
  });

  it("has expected initial state", async () => {
    const { useFinanceStore, MAX_PROFILES, MIN_PROFILES } = await import("../finance-store");
    const s = useFinanceStore.getState();
    expect(s.records).toEqual([]);
    expect(s.profiles.length).toBeGreaterThanOrEqual(MIN_PROFILES);
    expect(s.profiles.length).toBeLessThanOrEqual(MAX_PROFILES);
    expect(s.theme).toBe("light");
    expect(s.settings.decimalPlaces).toBe(0);
  });

  it("addProfile enforces MAX_PROFILES", async () => {
    const { useFinanceStore, MAX_PROFILES } = await import("../finance-store");
    const s0 = useFinanceStore.getState();
    const filled: Profile[] = Array.from({ length: MAX_PROFILES }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
    }));
    useFinanceStore.setState({ profiles: filled, error: null });

    s0.addProfile("New");
    const s1 = useFinanceStore.getState();
    expect(s1.profiles).toHaveLength(MAX_PROFILES);
    expect(s1.error).toContain("maxim");
  });

  it("removeProfile enforces MIN_PROFILES", async () => {
    const { useFinanceStore, MIN_PROFILES } = await import("../finance-store");
    const profiles: Profile[] = Array.from({ length: MIN_PROFILES }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
    }));
    useFinanceStore.setState({ profiles, error: null, selectedPerson: profiles[0].id });

    useFinanceStore.getState().removeProfile(profiles[0].id);
    expect(useFinanceStore.getState().error).toContain(`${MIN_PROFILES}`);
    expect(useFinanceStore.getState().profiles).toHaveLength(MIN_PROFILES);
  });

  it("setProfiles clamps to MAX_PROFILES and ignores empty imports", async () => {
    const { useFinanceStore, MAX_PROFILES } = await import("../finance-store");
    const many: Profile[] = Array.from({ length: MAX_PROFILES + 3 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
    }));
    useFinanceStore.getState().setProfiles(many);
    expect(useFinanceStore.getState().profiles).toHaveLength(MAX_PROFILES);

    const before = useFinanceStore.getState().profiles;
    useFinanceStore.getState().setProfiles([]);
    expect(useFinanceStore.getState().profiles).toEqual(before);
  });

  it("updateMonth upserts a record and triggers autosave", async () => {
    const { useFinanceStore } = await import("../finance-store");
    mockSaveRecords.mockResolvedValue(undefined);

    const month = "2026-01" as MonthRecord["month"];
    const profiles = useFinanceStore.getState().profiles;
    useFinanceStore.setState({ records: [], profiles });

    useFinanceStore.getState().updateMonth(month, { venit: 123 }, profiles[0].id);

    const s = useFinanceStore.getState();
    expect(s.records).toHaveLength(1);
    expect(Object.keys(s.records[0].people)).toEqual(expect.arrayContaining(profiles.map((p) => p.id)));
  });

  it("getCombinedData returns null when no data for active profiles", async () => {
    const { useFinanceStore } = await import("../finance-store");
    const profiles = [{ id: "me", name: "Me" }];
    useFinanceStore.setState({
      profiles,
      records: [
        {
          month: "2026-01",
          people: {}, // no entries
          meta: { updatedAt: new Date().toISOString(), isSaved: true },
        } as unknown as MonthRecord,
      ],
    });
    expect(useFinanceStore.getState().getCombinedData("2026-01")).toBeNull();
  });

  it("toggleTheme flips between light/dark", async () => {
    const { useFinanceStore } = await import("../finance-store");
    useFinanceStore.setState({ theme: "light" });
    useFinanceStore.getState().toggleTheme();
    expect(useFinanceStore.getState().theme).toBe("dark");
  });

  it("resetAllData clears storage and resets state", async () => {
    const { useFinanceStore } = await import("../finance-store");
    mockClearStorage.mockResolvedValue(undefined);

    useFinanceStore.setState({
      records: [{ month: "2026-01" } as unknown as MonthRecord],
      upcomingPayments: [{ id: "p1" } as unknown],
      recentActivities: [{ id: "a1" } as unknown],
    });

    await useFinanceStore.getState().resetAllData();
    expect(mockClearStorage).toHaveBeenCalled();
    expect(useFinanceStore.getState().records).toEqual([]);
    expect(useFinanceStore.getState().upcomingPayments).toEqual([]);
    expect(useFinanceStore.getState().recentActivities).toEqual([]);
  });

  it("loadRecords loads records and updates selectedMonth to latest existing", async () => {
    const { useFinanceStore } = await import("../finance-store");
    mockLoadRecords.mockResolvedValue([
      {
        month: "2024-01",
        people: makePeople(useFinanceStore.getState().profiles),
        meta: { updatedAt: new Date().toISOString(), isSaved: true },
      },
      {
        month: "2025-12",
        people: makePeople(useFinanceStore.getState().profiles),
        meta: { updatedAt: new Date().toISOString(), isSaved: true },
      },
    ]);

    useFinanceStore.setState({ selectedMonth: "2026-01" });
    await useFinanceStore.getState().loadRecords();
    expect(useFinanceStore.getState().records).toHaveLength(2);
    expect(useFinanceStore.getState().selectedMonth).toBe("2025-12");
  });
});

