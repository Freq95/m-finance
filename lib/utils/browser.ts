/**
 * Browser Compatibility Checks
 */

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the best available storage mechanism
 */
export function getBestStorageType(): "indexeddb" | "localstorage" | "none" {
  if (isIndexedDBAvailable()) {
    return "indexeddb";
  }
  if (isLocalStorageAvailable()) {
    return "localstorage";
  }
  return "none";
}
