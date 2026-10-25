import { useCallback, useSyncExternalStore } from "react";
import { readStored, removeStored, subscribeToStorage, writeStored } from "./persistentStorage";
import type { PersistentStorage } from "./persistentStorage";

/** Where the dismissal is remembered. */
export type PersistentDismissStorage = PersistentStorage;

export interface UsePersistentDismissOptions {
  /**
   * Where to remember it: `"local"` survives closing the browser, `"session"` lasts for this tab only.
   * @default 'local'
   */
  storage?: PersistentDismissStorage;
  /**
   * How long a dismissal lasts, in milliseconds; after that the message shows again. Left out, it lasts until
   * `reset` is called or the browser's storage is cleared.
   */
  expiresAfter?: number;
}

export interface PersistentDismiss {
  /**
   * Whether the browser has been asked yet. `false` on the server and on the first render while a server-rendered
   * page hydrates, since there is nothing to ask; `true` from then on. Show the message only once it is `true`, or a
   * message the reader already dismissed would flash on screen before this hook can say so.
   */
  ready: boolean;
  /** Whether this has been dismissed, in this tab or (with `storage: "local"`) another one. `false` until `ready`. */
  dismissed: boolean;
  /** Remembers the dismissal. Stable across renders. */
  dismiss: () => void;
  /** Forgets it, so the message shows again. Stable across renders. */
  reset: () => void;
}

const PREFIX = "dbm-dismissed:";

/** `"dismissed"` or `"visible"` — a primitive, so `useSyncExternalStore` can tell whether it changed. */
const readState = (key: string, storage: PersistentDismissStorage): "dismissed" | "visible" => {
  const raw = readStored(key, storage);
  if (raw === null) return "visible";
  const expiresAt = Number(raw);
  // The stored value is the moment the dismissal ends (0 for one that never does).
  if (Number.isFinite(expiresAt) && expiresAt > 0 && Date.now() >= expiresAt) return "visible";
  return "dismissed";
};

/**
 * Remembers that a message was dismissed, across page loads: pair it with `Alert`'s controlled `open`, or with
 * anything else a reader can close for good — a promotion, an announcement, a cookie notice.
 *
 * It is built to be safe to render on the server: `ready` is `false` until the browser has been asked, so render
 * nothing while it is (`open={ready && !dismissed}`) rather than a message that may already have been dismissed.
 * The cost is that the message appears after the page loads, not in the server's HTML. It keeps other open tabs in
 * step (`storage: "local"`), and falls back to memory when the browser's storage is blocked, so a dismissal then lasts
 * until the page is reloaded.
 *
 * `key` names the message; change it (`"summer-sale-2027"`) to show a new message to people who dismissed the last
 * one. What is stored is only a timestamp under `dbm-dismissed:<key>` — no message text and nothing about the reader.
 * Whether storing even that needs consent depends on where your readers are, and is yours to decide.
 *
 * @example
 * ```tsx
 * const { ready, dismissed, dismiss } = usePersistentDismiss("summer-sale-2027", { expiresAfter: 7 * 24 * 60 * 60 * 1000 });
 * <Alert banner dismissible open={ready && !dismissed} onOpenChange={(open) => !open && dismiss()}>
 *   Summer sale ends Sunday.
 * </Alert>
 * ```
 */
export function usePersistentDismiss(key: string, options: UsePersistentDismissOptions = {}): PersistentDismiss {
  const { storage = "local", expiresAfter } = options;
  const storageKey = PREFIX + key;

  const state = useSyncExternalStore(
    subscribeToStorage,
    () => readState(storageKey, storage),
    // The server, and the first render while hydrating, have nothing to read.
    () => "unknown" as const,
  );

  const dismiss = useCallback(() => {
    writeStored(storageKey, String(expiresAfter !== undefined && expiresAfter > 0 ? Date.now() + expiresAfter : 0), storage);
  }, [storage, storageKey, expiresAfter]);

  const reset = useCallback(() => {
    removeStored(storageKey, storage);
  }, [storage, storageKey]);

  return { ready: state !== "unknown", dismissed: state === "dismissed", dismiss, reset };
}
