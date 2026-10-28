import type { TimelineLabels } from "./Timeline.types";

/** The text the component writes itself, in English, with its numbers through `formatNumber`. */
export const defaultLabelsFor = (format: (value: number) => string): TimelineLabels => ({
  showMore: (hidden) => `Show ${format(hidden)} more ${hidden === 1 ? "event" : "events"}`,
  showLess: "Show fewer events",
  revealed: (count) => `${format(count)} more ${count === 1 ? "event" : "events"} shown`,
  pending: "In progress",
});

/** The cap as a whole number of events, or `undefined` for no cap (nothing set, or a value that is not a finite number). */
export const normalizeMaxVisible = (maxVisible: number | undefined): number | undefined => {
  if (maxVisible === undefined || !Number.isFinite(maxVisible)) return undefined;
  return Math.max(0, Math.floor(maxVisible));
};

/** How many events to draw: all of them, or the first `cap` unless the rest are shown. */
export const visibleCount = (total: number, cap: number | undefined, expanded: boolean): number => {
  if (cap === undefined || expanded) return total;
  return Math.min(total, cap);
};
