import { mergeDefined } from "@dbm-system/utils";
import type { CarouselAlign, CarouselLabels } from "./Carousel.types";

/** How long a slide stays when `autoPlay` gives no `interval`. A rhythm for reading, not a design value. */
export const DEFAULT_AUTO_PLAY_INTERVAL_MS = 5000;

/** Counts a number of slides given as anything into a whole number from `min` up, so a stray `NaN` or fraction can't loop or crash. */
export function wholeNumber(value: unknown, fallback: number, min: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.floor(value));
}

/** A number of slides in view as a number of at least one (a fraction is allowed: 1.5 shows a slide and half of the next), or the fallback. */
export function viewSize(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, value);
}

/** How many slides are at least partly in view for a view size: a fraction counts the slide it cuts. */
export const slidesTouched = (perView: number): number => Math.ceil(perView);

interface Mode {
  count: number;
  perView: number;
  /** Whether the carousel wraps round (seamlessly, through copies of the slides at each end). */
  loop: boolean;
  /** Whether the slide at `value` is the one kept in the middle of the view, instead of the first in it. */
  center: boolean;
}

/** Whether there is anything to wrap round: a carousel that already shows every slide has no seam. */
export const canLoop = (count: number, perView: number, wanted: boolean): boolean => wanted && count > slidesTouched(perView);

/**
 * The last index `value` can take: any slide when the view wraps or is centred on a slide, otherwise the last place the first
 * slide in view can be, with `perView` slides showing.
 */
export function lastIndex({ count, perView, loop, center }: Mode): number {
  if (count <= 0) return 0;
  return loop || center ? count - 1 : Math.max(0, count - slidesTouched(perView));
}

/**
 * The positions the carousel can rest at, as the value at each: every `move` slides from the start, and, when the view
 * neither wraps nor centres, always the last place it can reach (so the final slides are never skipped).
 */
export function computeStops(mode: Mode, move: number): number[] {
  const last = lastIndex(mode);
  const stops: number[] = [];
  if (mode.loop || mode.center) {
    for (let index = 0; index <= last; index += move) stops.push(index);
    return stops.length > 0 ? stops : [0];
  }
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
 * Where the position after (`1`) or before (`-1`) the one at `place` in `stops` is, or `undefined` when there is none. With
 * `wrap`, the end hands over to the other end (and a single position has nowhere to go).
 */
export function neighbourStop(stops: readonly number[], place: number, direction: 1 | -1, wrap: boolean): number | undefined {
  if (stops.length < 2) return undefined;
  const next = place + direction;
  if (next >= 0 && next < stops.length) return stops[next];
  return wrap ? stops[direction === 1 ? 0 : stops.length - 1] : undefined;
}

/** The slide `move` places from `value` round a wrapping carousel of `count` slides. */
export const wrapStep = (value: number, direction: 1 | -1, move: number, count: number): number => (((value + direction * move) % count) + count) % count;

/** How far, in slides, `index` is from `value` going the short way round a wrapping carousel, or plainly when it doesn't wrap. Positive is after. */
export function offsetFrom(index: number, value: number, count: number, loop: boolean): number {
  const plain = index - value;
  if (!loop) return plain;
  const forward = (((plain % count) + count) % count);
  return forward > count / 2 ? forward - count : forward;
}

interface SlideView extends Mode {
  value: number;
  peek: boolean;
}

/**
 * How many slides outside the view `index` is, `0` when any part of it is in the view. Measured round a wrapping carousel
 * the short way, and from the middle of the view when it is centred.
 */
export function slidesOutside(index: number, { count, perView, loop, center, value, peek }: SlideView): number {
  const offset = offsetFrom(index, value, count, loop);
  if (center) {
    const reach = (perView + 1) / 2;
    return Math.abs(offset) < reach ? 0 : Math.floor(Math.abs(offset) - reach) + 1;
  }
  if (offset < 0) return -offset;
  const end = slidesTouched(perView) + (peek ? 1 : 0);
  return offset < end ? 0 : offset - end + 1;
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

/** The coordinate of the edge a slide is aligned by along the axis: its start edge, or its middle when centred. */
export function edgeOf(rect: DOMRect, axis: Axis, rtl: boolean, align: CarouselAlign): number {
  if (axis === "block") return align === "center" ? (rect.top + rect.bottom) / 2 : rect.top;
  if (align === "center") return (rect.left + rect.right) / 2;
  return rtl ? rect.right : rect.left;
}

/**
 * How far the track has to scroll to bring a slide's aligned edge to the track's: the difference of the two rectangles'
 * edges, which is right in a right-to-left track too (where `scrollLeft` is negative and its sign convention differs across
 * browsers).
 */
export function scrollDelta(track: DOMRect, slide: DOMRect, axis: Axis, rtl: boolean, align: CarouselAlign): number {
  return edgeOf(slide, axis, rtl, align) - edgeOf(track, axis, rtl, align);
}

/**
 * The position of the slide aligned with the track, from where the slides sit: the last position when the track is
 * scrolled to its end (a view can't reach further, so the slide nearest the edge is an earlier one than the last
 * position's), otherwise the slide whose aligned edge is nearest the track's.
 */
export function indexFromGeometry(args: { edges: readonly number[]; trackEdge: number; atEnd: boolean; max: number }): number {
  const { edges, trackEdge, atEnd, max } = args;
  if (atEnd) return max;
  let best = 0;
  let distance = Infinity;
  edges.forEach((edge, index) => {
    const away = Math.abs(edge - trackEdge);
    if (away < distance) {
      best = index;
      distance = away;
    }
  });
  return Math.min(best, max);
}
