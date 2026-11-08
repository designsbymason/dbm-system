import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Scrolls the current link (`[aria-current]`) of a sideways-scrolling box into view, kept clear of the box's `scroll-padding-inline` (where an edge
 * fade is): when the box mounts, and again whenever the current link changes (an observed `aria-current`). Only the box scrolls, never the page, and
 * it is direction-agnostic: the move is the difference of two rectangles, so it is the same in right-to-left text. Smooth after the first reveal,
 * unless the reader asked for reduced motion.
 */
export function useRevealCurrent(scrollerRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!enabled || scroller === null) return undefined;
    let first = true;
    const reveal = () => {
      const current = scroller.querySelector("[aria-current]");
      if (current === null) return;
      const box = scroller.getBoundingClientRect();
      const rect = current.getBoundingClientRect();
      const gap = Number.parseFloat(getComputedStyle(scroller).scrollPaddingInlineStart) || 0;
      const smooth = !first && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior = smooth ? "smooth" : "auto";
      if (rect.left < box.left + gap) scroller.scrollBy({ left: rect.left - box.left - gap, behavior });
      else if (rect.right > box.right - gap) scroller.scrollBy({ left: rect.right - box.right + gap, behavior });
    };
    reveal();
    first = false;
    if (typeof MutationObserver === "undefined") return undefined;
    const observer = new MutationObserver(reveal);
    observer.observe(scroller, { attributes: true, attributeFilter: ["aria-current"], subtree: true });
    return () => observer.disconnect();
  }, [scrollerRef, enabled]);
}
