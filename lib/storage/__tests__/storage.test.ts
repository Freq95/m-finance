import { StorageError, ValidationError } from "../../utils/errors";
import type { MonthRecord, StorageSchema } from "../../types";
import { createDefaultCategoryAmounts } from "../../validation/schemas";

const mockGetBestStorageType = jest.fn();
jest.mock("../../utils/browser", () => ({
  getBestStorageType: () => mockGetBestStorageType(),
}));

const mockMigrateData = jest.fn();
jest.mock("../migrations", () => ({
  migrateData: (data: unknown) => mockMigrateData(data),
}));

const mockConfig = jest.fn();
const mockCreateInstance = jest.fn();
const mockIndexedDb = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock("localforage", () => ({
  __esModule: true,
  default: {
    INDEXEDDB: "indexeddb",
    LOCALSTORAGE: "localstorage",
    config: (...args: unknown[]) => mockConfig(...args),
    createInstance: (...args: unknown[]) => mockCreateInstance(...args),
  },
}));

function makeValidRecord(month: string): MonthRecord {
  return {
    month: month as MonthRecord["month"],
    people: { me: createDefaultCategoryAmounts() },
    meta: { updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(), isSaved: true },
  };
}

describe("storage", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockGetBestStorageType.mockReset();
    mockMigrateData.mockReset();
    mockConfig.mockReset();
    mockCreateInstance.mockReset();
    mockIndexedDb.getItem.mockReset();
    mockIndexedDb.setItem.mockReset();
    mockIndexedDb.removeItem.mockReset();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();

    mockCreateInstance.mockImplementation(({ driver }: { driver: string }) => {
      return driver === "indexeddb" ? mockIndexedDb : mockLocalStorage;
    });

    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("loads empty array when no stored data", async () => {
    mockGetBestStorageType.mockReturnValue("indexeddb");
    mockIndexedDb.getItem.mockResolvedValue(null);
    const { loadRecords } = await import("../storage");
    await expect(loadRecords()).resolves.toEqual([]);
  });

  it("loads and migrates stored schema", async () => {
    mockGetBestStorageType.mockReturnValue("localstorage");
    const stored: StorageSchema = { version: 2, data: [makeValidRecord("2026-01")] };
    mockLocalStorage.getItem.mockResolvedValue(stored);
    mockMigrateData.mockReturnValue({ version: 3, data: stored.data });

    const { loadRecords } = await import("../storage");
    const records = await loadRecords();
    expect(mockMigrateData).toHaveBeenCalledWith(stored);
    expect(records).toHaveLength(1);
  });

  it("saveRecords validates and writes schema", async () => {
    mockGetBestStorageType.mockReturnValue("indexeddb");
    mockIndexedDb.setItem.mockResolvedValue(undefined);
    const { saveRecords, CURRENT_VERSION } = await import("../storage");

    const records = [makeValidRecord("2026-02")];
    await expect(saveRecords(records)).resolves.toBeUndefined();
    expect(mockIndexedDb.setItem).toHaveBeenCalledWith(
      "finance-dashboard-data",
      expect.objectContaining({ version: CURRENT_VERSION, data: records })
    );
  });

  it("saveRecords throws ValidationError for invalid records", async () => {
    mockGetBestStorageType.mockReturnValue("indexeddb");
    const { saveRecords } = await import("../storage");

    const bad: MonthRecord = {
      ...makeValidRecord("2026-01"),
      month: "2026-13" as MonthRecord["month"],
    };

    await expect(saveRecords([bad])).rejects.toBeInstanceOf(ValidationError);
  });

  it("clearStorage removes the key", async () => {
    mockGetBestStorageType.mockReturnValue("localstorage");
    mockLocalStorage.removeItem.mockResolvedValue(undefined);
    const { clearStorage } = await import("../storage");
    await expect(clearStorage()).resolves.toBeUndefined();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("finance-dashboard-data");
  });

  it("createPersistStorage falls back when storage is unavailable", async () => {
    mockGetBestStorageType.mockReturnValue("none");
    const { createPersistStorage } = await import("../storage");
    const p = createPersistStorage();
    await expect(p.getItem("x")).resolves.toBeNull();
    await expect(p.setItem("x", "y")).resolves.toBeUndefined();
    await expect(p.removeItem("x")).resolves.toBeUndefined();
  });

  it("wraps unknown errors as StorageError", async () => {
    mockGetBestStorageType.mockReturnValue("indexeddb");
    mockIndexedDb.getItem.mockRejectedValue(new Error("boom"));
    const { loadRecords } = await import("../storage");
    await expect(loadRecords()).rejects.toBeInstanceOf(StorageError);
  });
});

