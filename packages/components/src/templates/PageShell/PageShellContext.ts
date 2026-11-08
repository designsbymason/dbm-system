import { createContext, useContext } from "react";
import type { RefObject } from "react";

/** What the shell's parts share: the `<main>`, which a page change moves focus to, and the aside's drawer state. */
export interface PageShellContextValue {
  mainRef: RefObject<HTMLElement | null>;
  /** Whether the aside's drawer is open. */
  asideOpen: boolean;
  /** Opens or closes the aside's drawer, and reports it through `onAsideOpenChange`. */
  setAsideOpen: (open: boolean) => void;
  /** The toggle that opened the drawer, which gets focus back when it closes. */
  asideToggleRef: RefObject<HTMLElement | null>;
}

export const PageShellContext = createContext<PageShellContextValue | null>(null);

/** The shell the part is in. A part outside one has nothing to attach to, so this throws. */
export function usePageShellContext(): PageShellContextValue {
  const context = useContext(PageShellContext);
  if (context === null) throw new Error("PageShell parts must be used inside a PageShell.");
  return context;
}

/**
 * Where a part is written, for the development warnings: inside a `Body` (`body`), inside the `Main` of a `Body` (`bodyMain`), or inside a
 * `Content` (`content`). `null` is anywhere else. Nothing but a warning reads it.
 */
export type PageShellPlacement = "body" | "bodyMain" | "content" | null;

export const PageShellPlacementContext = createContext<PageShellPlacement>(null);
