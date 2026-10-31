import { useEffect, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The height, in pixels, a vertical track needs to show `perView` slides of their own natural heights: the tallest window of
 * that many slides along the list (a fraction counts the slide it cuts by its share), plus the gaps, so the track never changes
 * height as it moves. `undefined` until measured, or while `enabled` is off. Measured again when any slide changes size.
 */
export function useAutoHeight(
  trackRef: RefObject<HTMLDivElement | null>,
  { enabled, perView, layoutKey }: { enabled: boolean; perView: number; layoutKey: string },
): number | undefined {
  const [size, setSize] = useState<number | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled) {
      setSize(undefined);
      return;
    }
    const slides = () => [...track.querySelectorAll<HTMLElement>(":scope > [data-carousel-slide]:not([data-carousel-clone])")];
    const measure = () => {
      const heights = slides().map((slide) => slide.getBoundingClientRect().height);
      const gap = parseFloat(getComputedStyle(track).rowGap) || 0;
      const whole = Math.floor(perView);
      const share = perView - whole;
      const windows = Math.max(1, heights.length - Math.ceil(perView) + 1);
      let tallest = 0;
      for (let start = 0; start < windows; start += 1) {
        let total = 0;
        for (let offset = 0; offset < whole; offset += 1) total += heights[start + offset] ?? 0;
        if (share > 0) total += share * (heights[start + whole] ?? 0);
        total += gap * (share > 0 ? whole : Math.max(0, whole - 1));
        tallest = Math.max(tallest, total);
      }
      setSize((current) => (current !== undefined && Math.abs(current - tallest) < 0.5 ? current : tallest));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    slides().forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
    // `layoutKey` stands for what changes which slides there are or how they are laid out.
  }, [trackRef, enabled, perView, layoutKey]);

  return size;
}
