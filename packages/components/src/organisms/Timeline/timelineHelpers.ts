import type { ButtonSize } from "../../atoms/Button";
import type { IconSize } from "../../atoms/Icon";
import type { TimelineLabels, TimelineSize } from "./Timeline.types";

/** The text the component writes itself, in English, with its numbers through `formatNumber`. */
export const defaultLabelsFor = (format: (value: number) => string): TimelineLabels => ({
  showMore: (hidden) => `Show ${format(hidden)} more ${hidden === 1 ? "event" : "events"}`,
  showLess: "Show fewer events",
  revealed: (count) => `${format(count)} more ${count === 1 ? "event" : "events"} shown`,
  pending: "In progress",
  details: "Details",
  loadMore: "Load more",
  loadingMore: "Loading…",
  empty: "No events yet",
  added: (count) => `${format(count)} new ${count === 1 ? "event" : "events"}`,
});

/** The size of the icon inside a marker, one step down from the marker's own. */
export const iconSizeForSize: Record<TimelineSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

/** The size of the buttons the timeline draws, one step down from the marker's own. */
export const buttonSizeForSize: Record<TimelineSize, ButtonSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

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

/** One entry of the list as the caller wrote it: an event, a heading before a run of events, or the end. */
export interface TimelineEntry<T> {
  kind: "item" | "group" | "end";
  node: T;
}

/**
 * Picks what to draw from the entries in order. Only the first `limit` events are drawn; a group heading is drawn only when
 * an event after it is, so a heading never stands over nothing; the end is drawn only when every event is.
 */
export function selectEntries<T>(entries: ReadonlyArray<TimelineEntry<T>>, limit: number): Array<TimelineEntry<T>> {
  const total = entries.filter((entry) => entry.kind === "item").length;
  const selected: Array<TimelineEntry<T>> = [];
  let shown = 0;
  let heading: TimelineEntry<T> | null = null;
  for (const entry of entries) {
    if (entry.kind === "group") {
      heading = entry;
    } else if (entry.kind === "item") {
      if (shown >= limit) continue;
      if (heading) selected.push(heading);
      heading = null;
      selected.push(entry);
      shown += 1;
    } else if (shown === total) {
      selected.push(entry);
    }
  }
  return selected;
}
