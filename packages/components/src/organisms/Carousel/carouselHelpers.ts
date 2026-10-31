import { mergeDefined } from "@dbm-system/utils";
import type { CarouselLabels } from "./Carousel.types";

/** How long a slide stays when `autoPlay` gives no `interval`. A rhythm for reading, not a design value. */
export const DEFAULT_AUTO_PLAY_INTERVAL_MS = 5000;

/** Counts a number of slides given as anything into a whole number from `min` up, so a stray `NaN` or fraction can't loop or crash. */
export function wholeNumber(value: unknown, fallback: number, min: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.floor(value));
}

/** The index of the last place the first slide in view can be, with `perView` slides showing. */
export function lastStart(count: number, perView: number): number {
  return Math.max(0, count - perView);
}

/**
 * The positions the carousel can rest at, as the index of the first slide in view at each: every `move` slides from the
 * start, and always the last place the view can reach (so the final slides are never skipped).
 */
export function computeStops(count: number, perView: number, move: number): number[] {
  const last = lastStart(count, perView);
  const stops: number[] = [];
  for (let index = 0; index < last; index += move) stops.push(index);
  stops.push(last);
  return stops;
}

/** The place in `stops` of the position nearest `value` (the earlier one on a tie). */
export function nearestStop(stops: readonly number[], value: number): number {
  let best = 0;
  let distance = Infinity;
  stops.forEach((stop, place) => {
    const away = Math.abs(stop - value);
    if (away < distance) {
      best = place;
      distance = away;
    }
  });
  return best;
}

/** Keeps `value` inside `0 … max`, treating anything that isn't a number as the start. */
export function clampIndex(value: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(Math.max(0, Math.round(value)), max);
}

/**
 * Where the position after (`1`) or before (`-1`) the one at `place` in `stops` is, or `undefined` when there is none.
 * With `wrap`, the end hands over to the other end (and a single position has nowhere to go).
 */
export function neighbourStop(stops: readonly number[], place: number, direction: 1 | -1, wrap: boolean): number | undefined {
  if (stops.length < 2) return undefined;
  const next = place + direction;
  if (next >= 0 && next < stops.length) return stops[next];
  return wrap ? stops[direction === 1 ? 0 : stops.length - 1] : undefined;
}

export const defaultLabelsFor = (formatNumber: (n: number) => string, announcementOverride?: CarouselLabels["announcement"]): CarouselLabels => ({
  track: "Slides",
  slide: (position, total) => `${formatNumber(position)} of ${formatNumber(total)}`,
  announcement:
    announcementOverride ??
    ((first, last, total) =>
      first === last
        ? `Slide ${formatNumber(first)} of ${formatNumber(total)}`
        : `Slides ${formatNumber(first)} to ${formatNumber(last)} of ${formatNumber(total)}`),
  previous: "Previous slide",
  next: "Next slide",
  indicators: "Slide navigation",
  indicator: (position) => `Go to slide ${formatNumber(position)}`,
  play: "Start automatic slide show",
  pause: "Stop automatic slide show",
});

/** The labels with the caller's overrides laid over the defaults, an `undefined` override keeping its default. */
export const resolveLabels = (formatNumber: (n: number) => string, overrides?: Partial<CarouselLabels>): CarouselLabels =>
  mergeDefined(defaultLabelsFor(formatNumber), overrides);

/** Whether the person asked the system for less motion. False where `matchMedia` is missing (a server, a test). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type Axis = "inline" | "block";

/**
 * How far the track has to scroll to bring a slide's start edge to the track's start edge: the difference of the two
 * rectangles' start edges, which is right in a right-to-left track too (where `scrollLeft` is negative and its sign
 * convention differs across browsers).
 */
export function scrollDelta(track: DOMRect, slide: DOMRect, axis: Axis, rtl: boolean): number {
  if (axis === "block") return slide.top - track.top;
  return rtl ? slide.right - track.right : slide.left - track.left;
}

/**
 * The index of the first slide in view, from where the slides sit: the last position when the track is scrolled to its
 * end (a view can't reach further, so the slide nearest the start edge is an earlier one than the last position's),
 * otherwise the slide whose start edge is nearest the track's.
 */
export function indexFromGeometry(args: { starts: readonly number[]; trackStart: number; atEnd: boolean; max: number }): number {
  const { starts, trackStart, atEnd, max } = args;
  if (atEnd) return max;
  let best = 0;
  let distance = Infinity;
  starts.forEach((start, index) => {
    const away = Math.abs(start - trackStart);
    if (away < distance) {
      best = index;
      distance = away;
    }
  });
  return Math.min(best, max);
}
