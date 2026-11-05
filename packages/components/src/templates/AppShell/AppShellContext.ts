import { createContext, useContext } from "react";
import type { AppShellScroll } from "./AppShell.types";

/** What the shell tells its slots: what scrolls, and a way for the header to report its height when the page scrolls. */
export interface AppShellContextValue {
  scroll: AppShellScroll;
  /** Called by `AppShell.Header` with its height in pixels (and with `0` when it unmounts), so the shell can keep it in view. */
  setHeaderHeight: (height: number) => void;
}

const fallback: AppShellContextValue = { scroll: "content", setHeaderHeight: () => {} };

export const AppShellContext = createContext<AppShellContextValue>(fallback);

/** The shell around a slot. A slot drawn outside a shell (a story, a test) gets the defaults rather than throwing. */
export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}
