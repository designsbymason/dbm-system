import { createContext, useContext } from "react";
import type { RefObject } from "react";

/** What the shell's parts share: the `<main>`, which a page change moves focus to. */
export interface TopNavShellContextValue {
  mainRef: RefObject<HTMLElement | null>;
  /** Tells the shell that a sub-navigation scrolls away with the page, so only the bar (the header's first child) sticks. */
  setSubNavStatic: (isStatic: boolean) => void;
}

export const TopNavShellContext = createContext<TopNavShellContextValue | null>(null);

/** The shell the part is in. A part outside one has nothing to attach to, so this throws. */
export function useTopNavShellContext(): TopNavShellContextValue {
  const context = useContext(TopNavShellContext);
  if (context === null) throw new Error("TopNavShell parts must be used inside a TopNavShell.");
  return context;
}
