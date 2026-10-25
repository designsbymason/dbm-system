import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readStored, removeStored, subscribeToStorage, writeStored } from "./persistentStorage";
import type { PersistentStorage } from "./persistentStorage";

export interface UseRecentCommandsOptions {
  /**
   * Where to remember the list: `"local"` survives closing the browser, `"session"` lasts for this tab only.
   * @default 'local'
   */
  storage?: PersistentStorage;
  /**
   * The most values to keep. Adding past it drops the oldest.
   * @default 8
   */
  max?: number;
}

export interface RecentCommands {
  /**
   * Whether the browser has been asked yet. `false` on the server and on the first render while a server-rendered
   * page hydrates, since there is nothing to ask; `true` from then on. `recent` is empty until it is.
   */
  ready: boolean;
  /** The remembered values, most recent first. Pass it as `CommandPalette`'s `recent`. */
  recent: string[];
  /** Puts `value` first, moving it up if it was already there, and drops the oldest past `max`. Stable across renders. */
  add: (value: string) => void;
  /** Forgets one value. Stable across renders. */
  remove: (value: string) => void;
  /** Forgets every value. Stable across renders. */
  clear: () => void;
}

const PREFIX = "dbm-recent:";
const DEFAULT_MAX = 8;

/** Reads a stored list, leaving out anything that is not a string: what is in storage is not always what was put there. */
function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Remembers the commands a person ran most recently, across page loads, for `CommandPalette`'s `recent` prop. Call
 * `add(item.value)` from the palette's `onSelect` and pass `recent` back in.
 *
 * It is built to be safe to render on the server: `recent` is empty and `ready` is `false` until the browser has been
 * asked, so the palette's first render matches the server's. It keeps other open tabs in step (`storage: "local"`),
 * and falls back to memory when the browser's storage is blocked, so the list then lasts until the page is reloaded.
 *
 * `key` names the list (`"app-commands"`); use a different one for each palette, or for each person's workspace. What
 * is stored is only the values you add under `dbm-recent:<key>`, so keep them to ids and not names or text a person
 * typed. Whether storing even that needs consent depends on where your readers are, and is yours to decide.
 *
 * @example
 * ```tsx
 * const { recent, add } = useRecentCommands("app-commands", { max: 5 });
 * <CommandPalette commands={commands} recent={recent} onSelect={(item) => add(item.value)} />
 * ```
 */
export function useRecentCommands(key: string, options: UseRecentCommandsOptions = {}): RecentCommands {
  const { storage = "local", max = DEFAULT_MAX } = options;
  const storageKey = PREFIX + key;
  const limit = Math.max(0, Math.floor(max));

  // The stored text itself, a primitive that changes exactly when the list does.
  const raw = useSyncExternalStore(
    subscribeToStorage,
    () => readStored(storageKey, storage) ?? "",
    // The server, and the first render while hydrating, have nothing to read.
    () => null,
  );
  const recent = useMemo(() => (raw === null || raw === "" ? [] : parse(raw).slice(0, limit)), [raw, limit]);

  const current = useCallback(() => parse(readStored(storageKey, storage) ?? ""), [storageKey, storage]);
  const add = useCallback(
    (value: string) => {
      writeStored(storageKey, JSON.stringify([value, ...current().filter((item) => item !== value)].slice(0, limit)), storage);
    },
    [storageKey, storage, limit, current],
  );
  const remove = useCallback(
    (value: string) => {
      writeStored(storageKey, JSON.stringify(current().filter((item) => item !== value)), storage);
    },
    [storageKey, storage, current],
  );
  const clear = useCallback(() => removeStored(storageKey, storage), [storageKey, storage]);

  return { ready: raw !== null, recent, add, remove, clear };
}
