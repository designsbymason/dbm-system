import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { MIN_AUTO_PLAY_INTERVAL_MS } from "./carouselHelpers";

interface CarouselWarningInputs {
  name: { label?: string; labelledBy?: string };
  /** The `value` prop when controlled, with the range it is held to. */
  controlledValue: number | undefined;
  max: number;
  count: number;
  perView: number;
  /** The `interval` the caller asked for, when `autoPlay` is an object. */
  requestedInterval: number | undefined;
  trackRef: RefObject<HTMLElement | null>;
  /** A vertical carousel that draws its slides one after the other, so it needs a height from its container unless sized by content. */
  needsHeight: boolean;
  slidesInView: number;
}

/** The development warnings for invalid or risky props. Nothing here runs in a production build. */
export function useCarouselWarnings({ name, controlledValue, max, count, perView, requestedInterval, trackRef, needsHeight, slidesInView }: CarouselWarningInputs): void {
  const { label, labelledBy } = name;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !label && !labelledBy) {
      console.warn("Carousel: it needs an accessible name. Pass `aria-label` or `aria-labelledby`.");
    }
  }, [label, labelledBy]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && count > 0 && controlledValue !== undefined && (controlledValue < 0 || controlledValue > max)) {
      console.warn(`Carousel: \`value\` (${controlledValue}) is outside 0–${max} for ${count} slides with ${perView} in view; it is held to that range.`);
    }
  }, [controlledValue, max, count, perView]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && requestedInterval !== undefined && !(requestedInterval >= MIN_AUTO_PLAY_INTERVAL_MS)) {
      console.warn(`Carousel: \`autoPlay.interval\` (${requestedInterval}) is raised to ${MIN_AUTO_PLAY_INTERVAL_MS} ms, the shortest a slide stays.`);
    }
  }, [requestedInterval]);

  const warnedHeight = useRef(false);
  useEffect(() => {
    const track = trackRef.current;
    if (process.env.NODE_ENV === "production" || warnedHeight.current || !needsHeight || !track || count <= slidesInView) return;
    // With a height from its container the track scrolls; with none it grows to hold every slide and there is nothing to scroll.
    if (track.clientHeight > 0 && track.scrollHeight <= track.clientHeight + 1) {
      warnedHeight.current = true;
      console.warn("Carousel: a vertical carousel needs a height from its container (a `block-size` on it or on a parent that it fills), or `autoHeight`; without one every slide is shown at once.");
    }
  }, [trackRef, needsHeight, count, slidesInView]);
}
