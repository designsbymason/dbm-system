import { createContext, useContext } from "react";
import type { RefObject } from "react";

/** What the shell's parts share: the `<main>`, which a page change moves focus to. */
export interface PageShellContextValue {
  mainRef: RefObject<HTMLElement | null>;
}

export const PageShellContext = createContext<PageShellContextValue | null>(null);

/** The shell the part is in. A part outside one has nothing to attach to, so this throws. */
export function usePageShellContext(): PageShellContextValue {
  const context = useContext(PageShellContext);
  if (context === null) throw new Error("PageShell parts must be used inside a PageShell.");
  return context;
}
