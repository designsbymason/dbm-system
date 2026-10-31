import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { indexFromGeometry, prefersReducedMotion, scrollDelta } from "./carouselHelpers";
import type { Axis } from "./carouselHelpers";

// How long the track must stop moving before a scroll counts as settled, for a browser with no `scrollend`.
const SETTLE_MS = 120;
// Browsers report sub-pixel scroll positions that differ by less than a pixel from the true end.
const EDGE_EPSILON = 1;

interface UseCarouselScrollOptions {
  trackRef: RefObject<HTMLDivElement | null>;
  axis: Axis;
  /** The index of the first slide in view, as the carousel holds it. */
  value: number;
  /** The last index the first slide in view can be. */
  max: number;
  /** Anything that changes where a slide sits without the value changing (how many are in view, the gap), so the track is put back. */
  layoutKey: string;
  /** Reports the slide the track settled on, when it isn't the value. */
  onSettle: (index: number) => void;
  /** Reports that the track has started (`true`) or stopped (`false`) moving under the person's hand or an animation. */
  onMoving: (moving: boolean) => void;
}

/** The slides of a track, in order. */
const slidesOf = (track: HTMLElement): HTMLElement[] => [...track.querySelectorAll<HTMLElement>(":scope > [data-carousel-slide]")];

/**
 * Keeps the native scroll position and the carousel's `value` agreeing. A change of `value` scrolls the track (smooth, or
 * instant under `prefers-reduced-motion`, and on the first render); a scroll the browser did itself (a swipe, a wheel, a
 * trackpad, a key) is read once it settles and reported through `onSettle`. A scroll the carousel started settles on the
 * value it was sent to, so it reports nothing.
 *
 * Positions are read from bounding rectangles, so a right-to-left track needs no special handling of `scrollLeft`.
 */
export function useCarouselScroll({ trackRef, axis, value, max, layoutKey, onSettle, onMoving }: UseCarouselScrollOptions): void {
  const latest = useRef({ value, max, axis, onSettle, onMoving });
  useEffect(() => {
    latest.current = { value, max, axis, onSettle, onMoving };
  });
  const moving = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const scrollToIndex = useCallback(
    (index: number, smooth: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      const slide = slidesOf(track)[index];
      if (!slide) return;
      const rtl = getComputedStyle(track).direction === "rtl";
      const delta = scrollDelta(track.getBoundingClientRect(), slide.getBoundingClientRect(), latest.current.axis, rtl);
      if (Math.abs(delta) < 1) return;
      const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? "smooth" : "instant";
      const inline = latest.current.axis === "inline";
      if (typeof track.scrollTo === "function") {
        track.scrollTo(inline ? { left: track.scrollLeft + delta, behavior } : { top: track.scrollTop + delta, behavior });
      } else if (inline) track.scrollLeft += delta;
      else track.scrollTop += delta;
    },
    [trackRef],
  );

  const read = useCallback((): number => {
    const track = trackRef.current;
    if (!track) return latest.current.value;
    const { axis: direction, max: last } = latest.current;
    const box = track.getBoundingClientRect();
    const rtl = getComputedStyle(track).direction === "rtl";
    const block = direction === "block";
    const trackStart = block ? box.top : rtl ? box.right : box.left;
    const starts = slidesOf(track).map((slide) => {
      const rect = slide.getBoundingClientRect();
      return block ? rect.top : rtl ? rect.right : rect.left;
    });
    const room = block ? track.scrollHeight - track.clientHeight : track.scrollWidth - track.clientWidth;
    const position = Math.abs(block ? track.scrollTop : track.scrollLeft);
    return indexFromGeometry({ starts, trackStart, atEnd: last > 0 && room > 0 && position >= room - EDGE_EPSILON, max: last });
  }, [trackRef]);

  const settle = useCallback(() => {
    window.clearTimeout(timer.current);
    if (moving.current) {
      moving.current = false;
      latest.current.onMoving(false);
    }
    const index = read();
    if (index === latest.current.value) return;
    latest.current.onSettle(index);
    // A controlled carousel whose owner didn't take the new value still shows the old one: put the track back once the
    // owner has had its turn.
    window.setTimeout(() => scrollToIndex(latest.current.value, true), 0);
  }, [read, scrollToIndex]);

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
}
