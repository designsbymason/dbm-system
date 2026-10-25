import { useCallback, useRef } from "react";

/** A development-only warning that says each message once for as long as the component is mounted. Stable across renders. */
export function useWarnOnce(): (message: string) => void {
  const seen = useRef(new Set<string>());
  return useCallback((message: string) => {
    if (process.env.NODE_ENV === "production" || seen.current.has(message)) return;
    seen.current.add(message);
    console.warn(message);
  }, []);
}
