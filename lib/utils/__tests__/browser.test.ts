/** @jest-environment jsdom */
import { getBestStorageType, isIndexedDBAvailable, isLocalStorageAvailable } from "../browser";

describe("browser utils", () => {
  const originalIndexedDb = (globalThis as unknown as { indexedDB?: unknown }).indexedDB;
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  afterEach(() => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDb;
    localStorage.setItem = originalSetItem;
    localStorage.removeItem = originalRemoveItem;
  });

  it("detects indexedDB when present", () => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = {};
    expect(isIndexedDBAvailable()).toBe(true);
    expect(getBestStorageType()).toBe("indexeddb");
  });

  it("falls back to localStorage when indexedDB is missing", () => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    expect(isLocalStorageAvailable()).toBe(true);
    expect(getBestStorageType()).toBe("localstorage");
  });

  it("returns none when localStorage throws", () => {
    (globalThis as unknown as { indexedDB?: unknown }).indexedDB = undefined;
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("nope");
    });
    expect(isLocalStorageAvailable()).toBe(false);
    expect(getBestStorageType()).toBe("none");
    spy.mockRestore();
  });
});

