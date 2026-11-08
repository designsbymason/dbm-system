import type { Breakpoint } from "@dbm-system/utils";

/**
 * The widths the collapse steps of a shell stand for: the literal values of the breakpoint tokens (a media query can't read a custom property), as
 * `Sidebar`, `Drawer` and `Navbar` write them. A query that matches is the window at or above the step.
 */
export const minWidthQueries: Record<Exclude<Breakpoint, "base">, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
};

/** A width given as a number of pixels or as any CSS length, as a CSS length. */
export function toLength(width: number | string): string {
  return typeof width === "number" ? `${width}px` : width;
}
