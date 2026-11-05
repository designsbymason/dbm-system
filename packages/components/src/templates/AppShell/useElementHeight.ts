import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Reports an element's height, in pixels, while `enabled`, and again whenever it changes; reports `0` when disabled or unmounted.
 * Measured from the element itself, only once mounted, so a server render and the first client render agree (nothing reported).
 */
export function useElementHeight(enabled: boolean, ref: RefObject<HTMLElement | null>, report: (height: number) => void): void {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return undefined;
    const measure = () => report(element.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return () => report(0);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      report(0);
    };
  }, [enabled, ref, report]);
}
