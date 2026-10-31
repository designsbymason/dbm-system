import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { edgeOf, indexFromGeometry, prefersReducedMotion, scrollDelta } from "./carouselHelpers";
import type { Axis } from "./carouselHelpers";
import type { CarouselAlign } from "./Carousel.types";

// How long the track must stop moving before a scroll counts as settled, for a browser with no `scrollend`.
const SETTLE_MS = 120;
// Browsers report sub-pixel scroll positions that differ by less than a pixel from the true end.
const EDGE_EPSILON = 1;

interface UseCarouselScrollOptions {
  trackRef: RefObject<HTMLDivElement | null>;
  axis: Axis;
  /** Which edge of a slide is kept at the track's: its start, or its middle. */
  align: CarouselAlign;
  /** The index of the slide at the track's edge, as the carousel holds it. */
  value: number;
  /** The last index `value` can take. */
  max: number;
  /** The number of real slides. */
  count: number;
  /** How many copies of the first and last slides sit at each end for a seamless loop; `0` when the carousel does not wrap. */
  cloneCount: number;
  /** Anything that changes where a slide sits without the value changing (how many are in view, the gap), so the track is put back. */
  layoutKey: string;
  /** Changes whenever a settle was reported, so the track is put back if a controlled owner did not take it. */
  realignTick: number;
  /** Reports the slide the track settled on, when it isn't the value. */
  onSettle: (index: number) => void;
  /** Reports that the track has started (`true`) or stopped (`false`) moving under the person's hand or an animation. */
  onMoving: (moving: boolean) => void;
}

/** The slides of a track, in order, the copies at each end of a wrapping one included. */
export const slidesOf = (track: HTMLElement): HTMLElement[] => [...track.querySelectorAll<HTMLElement>(":scope > [data-carousel-slide]")];

/**
 * Keeps the native scroll position and the carousel's `value` agreeing. A change of `value` scrolls the track (smooth, or
 * instant under `prefers-reduced-motion`, and on the first render); a scroll the browser did itself (a swipe, a wheel, a
 * trackpad, a key, a mouse drag) is read once it settles and reported through `onSettle`. A scroll the carousel started
 * settles on the value it was sent to, so it reports nothing.
 *
 * A wrapping carousel has copies of its first and last slides at the ends: a move across the seam takes the shortest way, onto a
 * copy, and the track jumps without animating to the real slide it matches once it has settled, which looks the same.
 *
 * Positions are read from bounding rectangles, so a right-to-left track needs no special handling of `scrollLeft`.
 */
export function useCarouselScroll({
  trackRef,
  axis,
  align,
  value,
  max,
  count,
  cloneCount,
  layoutKey,
  realignTick,
  onSettle,
  onMoving,
}: UseCarouselScrollOptions): void {
  const latest = useRef({ value, max, count, cloneCount, axis, align, onSettle, onMoving });
  useEffect(() => {
    latest.current = { value, max, count, cloneCount, axis, align, onSettle, onMoving };
  });
  const moving = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const scrollTo = useCallback(
    (track: HTMLElement, delta: number, smooth: boolean) => {
      if (Math.abs(delta) < 1) return;
      const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? "smooth" : "instant";
      const inline = latest.current.axis === "inline";
      if (typeof track.scrollTo === "function") {
        track.scrollTo(inline ? { left: track.scrollLeft + delta, behavior } : { top: track.scrollTop + delta, behavior });
      } else if (inline) track.scrollLeft += delta;
      else track.scrollTop += delta;
    },
    [],
  );

  const deltaTo = useCallback((track: HTMLElement, slide: HTMLElement): number => {
    const rtl = getComputedStyle(track).direction === "rtl";
    return scrollDelta(track.getBoundingClientRect(), slide.getBoundingClientRect(), latest.current.axis, rtl, latest.current.align);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, smooth: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      const slides = slidesOf(track);
      const { cloneCount: clones, count: total } = latest.current;
      // A real slide, or the copy of it across the seam when that is the shorter way.
      const candidates = clones > 0 ? [clones + index - total, clones + index, clones + index + total] : [index];
      let best: number | undefined;
      for (const place of candidates) {
        const slide = slides[place];
        if (!slide) continue;
        const delta = deltaTo(track, slide);
        if (best === undefined || Math.abs(delta) < Math.abs(best)) best = delta;
      }
      if (best !== undefined) scrollTo(track, best, smooth);
    },
    [trackRef, deltaTo, scrollTo],
  );

  const read = useCallback((): { real: number; place: number } => {
    const track = trackRef.current;
    if (!track) return { real: latest.current.value, place: -1 };
    const { axis: direction, align: alignment, max: last, count: total, cloneCount: clones } = latest.current;
    const box = track.getBoundingClientRect();
    const rtl = getComputedStyle(track).direction === "rtl";
    const edges = slidesOf(track).map((slide) => edgeOf(slide.getBoundingClientRect(), direction, rtl, alignment));
    const block = direction === "block";
    const room = block ? track.scrollHeight - track.clientHeight : track.scrollWidth - track.clientWidth;
    const position = Math.abs(block ? track.scrollTop : track.scrollLeft);
    const atEnd = clones === 0 && alignment === "start" && last > 0 && room > 0 && position >= room - EDGE_EPSILON;
    const place = indexFromGeometry({ edges, trackEdge: edgeOf(box, direction, rtl, alignment), atEnd, max: clones > 0 ? edges.length - 1 : last });
    if (clones === 0) return { real: place, place };
    return { real: (((place - clones) % total) + total) % total, place };
  }, [trackRef]);

  const settle = useCallback(() => {
    window.clearTimeout(timer.current);
    if (moving.current) {
      moving.current = false;
      latest.current.onMoving(false);
    }
    const track = trackRef.current;
    const { real, place } = read();
    const { cloneCount: clones, count: total, value: current } = latest.current;
    // Resting on a copy: jump, without animating, to the real slide it matches. The two look the same.
    if (track && clones > 0 && (place < clones || place >= clones + total)) {
      const target = slidesOf(track)[clones + real];
      if (target) scrollTo(track, deltaTo(track, target), false);
    }
    if (real !== current) latest.current.onSettle(real);
  }, [read, trackRef, scrollTo, deltaTo]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      if (!moving.current) {
        moving.current = true;
        latest.current.onMoving(true);
      }
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(settle, SETTLE_MS);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", settle);
    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", settle);
      window.clearTimeout(timer.current);
    };
  }, [trackRef, settle]);

  // The first render puts the track at the starting value without animating; every change after it animates.
  const mounted = useRef(false);
  useEffect(() => {
    scrollToIndex(value, mounted.current);
    mounted.current = true;
  }, [value, scrollToIndex]);

  // A change in how the slides are laid out moves them without the value changing; put the track back, instantly.
  useEffect(() => {
    scrollToIndex(latest.current.value, false);
  }, [layoutKey, scrollToIndex]);

  // A controlled carousel whose owner did not take what a swipe settled on still shows the swipe: once the owner has had its
  // turn (this runs in the commit after the report), put the track back on the value it holds.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scrollToIndex(latest.current.value, true);
  }, [realignTick, scrollToIndex]);
}
