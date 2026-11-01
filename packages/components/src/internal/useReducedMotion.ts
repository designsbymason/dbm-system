import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (notify: () => void) => {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/**
 * Whether the person asked the system for less motion. Read through a store with a server snapshot of `false`, so a
 * server render and the first client render agree (`06` §9, SSR safety); the client corrects it right after hydration.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
