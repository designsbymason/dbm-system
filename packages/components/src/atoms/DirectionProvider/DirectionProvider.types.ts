import type { ReactNode } from "react";

/** The reading direction: left to right, or right to left. */
export type Direction = "ltr" | "rtl";

export interface DirectionProviderProps {
  /**
   * The reading direction for everything inside. A direction-aware component (`Sidebar`, `Navbar`, `AppShell` and the parts they hold) that is
   * given no `dir` of its own uses this one; a `dir` on the component itself still wins.
   */
  dir: Direction;
  /** What the direction applies to. The provider draws no element of its own. */
  children?: ReactNode;
}
