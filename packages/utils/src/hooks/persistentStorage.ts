/** Where a remembered value is kept. */
export type PersistentStorage = "local" | "session";

// What can't be written to (private browsing in some browsers, storage disabled or full) still has to work for the
// page's own lifetime, so a value falls back to this map: it lasts until the page is reloaded, and no longer.
const memory = new Map<string, string>();

// Same-tab listeners. The browser's `storage` event only reaches *other* tabs, so a write tells this tab's own
// subscribers itself.
const listeners = new Set<() => void>();

/** Tells every subscriber in this tab that something stored changed. */
export const notifyStorage = (): void => listeners.forEach((listener) => listener());

/** For `useSyncExternalStore`: this tab's writes, and another tab (or window) changing the same key. */
export const subscribeToStorage = (listener: () => void): (() => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

const areaFor = (storage: PersistentStorage): Storage | undefined => {
  try {
    return storage === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    // Reading the property itself can throw when storage is blocked: use the in-memory fallback instead.
    return undefined;
  }
};

/** What is stored under `key`, or `null`. Falls back to the in-memory copy when storage refuses the read. */
export const readStored = (key: string, storage: PersistentStorage): string | null => {
  try {
    const stored = areaFor(storage)?.getItem(key);
    if (stored !== null && stored !== undefined) return stored;
  } catch {
    // Reading refused: fall through to the in-memory copy, if there is one.
  }
  return memory.get(key) ?? null;
};

/** Stores `value`, in memory when the browser's storage is blocked or refuses it, and tells subscribers. */
export const writeStored = (key: string, value: string, storage: PersistentStorage): void => {
  const area = areaFor(storage);
  try {
    if (!area) throw new Error("storage unavailable");
    area.setItem(key, value);
    memory.delete(key);
  } catch {
    // Storage is blocked, or refused the write (full): keep it in memory, which lasts for this page's lifetime. Only
    // then — a copy kept alongside a working storage would outlive another tab's removal.
    memory.set(key, value);
  }
  notifyStorage();
};

/** Forgets what is stored under `key`, and tells subscribers. */
export const removeStored = (key: string, storage: PersistentStorage): void => {
  try {
    areaFor(storage)?.removeItem(key);
  } catch {
    // Nothing to remove from a storage that refused the write in the first place; the memory copy is cleared below.
  }
  memory.delete(key);
  notifyStorage();
};
