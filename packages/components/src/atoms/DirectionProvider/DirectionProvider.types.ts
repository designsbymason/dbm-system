import type { ReactNode } from "react";

/** The reading direction: left to right, or right to left. */
export type Direction = "ltr" | "rtl";

export interface DirectionProviderProps {
  /**
   * The reading direction for everything inside. Every component that takes a `dir` (`Tabs`, `Slider`, `Menu`, `Sidebar`, `AppShell` and
   * the rest) and every overlay that opens in a portal (`Dialog`, `Popover`, `Tooltip`) uses it when it is given no `dir` of its own; a `dir` on
   * the component itself still wins. Anything other than `"ltr"` or `"rtl"` is refused with a development warning and read as `"ltr"`.
   */
  dir: Direction;
  /** What the direction applies to. The provider draws no element of its own. */
  children?: ReactNode;
}
