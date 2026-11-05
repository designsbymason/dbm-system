import { useEffect, useLayoutEffect } from "react";
import type { RefObject } from "react";

/** The custom property that scales the value's font size, from 1 (its full size) down. Read by the value's own inline `font-size`. */
export const fitProperty = "--stat-value-fit";

// Before paint where there is a browser, so a value that does not fit is never drawn overflowing; on the server `useLayoutEffect` warns in
// React 18 and does nothing useful, so it is the plain effect there.
const useBeforePaint =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The room for the value: the stat's own content box, the width its padding leaves. */
function availableWidth(root: HTMLElement): number {
  const style = getComputedStyle(root);
  return (
    root.clientWidth -
    (Number.parseFloat(style.paddingInlineStart) || 0) -
    (Number.parseFloat(style.paddingInlineEnd) || 0)
  );
}

/** How wide the value is drawn: its box and its content, whichever is wider, since a box that cannot shrink below its text overflows. */
function drawnWidth(value: HTMLElement): number {
  return Math.max(value.scrollWidth, value.getBoundingClientRect().width);
}

/**
 * One fitting pass. At full size first; if that is too wide, scaled by how much too wide it is; and then by a secant step from the last two
 * measurements, because part of the value (a trend beside the number) keeps its own size, so the width is a line in the scale and two
 * points find where it meets the room.
 */
function fit(value: HTMLElement, root: HTMLElement): void {
  value.style.removeProperty(fitProperty);
  const available = availableWidth(root);
  let width = drawnWidth(value);
  let scale = 1;
  let previous: { scale: number; width: number } | null = null;
  for (
    let pass = 0;
    pass < 6 && available > 0 && width > available + 0.5;
    pass += 1
  ) {
    let next = scale * (available / width);
    if (previous !== null) {
      const slope = (previous.width - width) / (previous.scale - scale);
      const secant = slope > 0 ? scale + (available - width) / slope : next;
      if (secant > 0 && secant < scale) next = secant;
    }
    previous = { scale, width };
    scale = next;
    value.style.setProperty(fitProperty, String(scale));
    width = drawnWidth(value);
  }
}

/**
 * Shrinks the value's font size, only as far as it takes, so the value (with any trend beside it) fits inside the stat's padding: measured at
 * its full size, then scaled until it does (see `fit`). It grows back as the stat gets wider, because every pass starts from the full size.
 *
 * Done on the element directly and not through state: the result is one custom property, so a change needs no render. Runs after every render
 * of the value (its text may have changed) and whenever the stat's own width does.
 */
export function useFitValue(
  enabled: boolean,
  valueRef: RefObject<HTMLElement | null>,
  /** A CSS selector for the stat the value is in, found from the value with `closest`. */
  rootSelector: string,
): void {
  // The stat is found from the value, not through a ref the stat sets: a child's layout effect runs before its parent's ref is attached.
  useBeforePaint(() => {
    const value = valueRef.current;
    const root = value?.closest<HTMLElement>(rootSelector);
    if (enabled && value && root) fit(value, root);
  });

  useEffect(() => {
    const value = valueRef.current;
    const root = value?.closest<HTMLElement>(rootSelector);
    if (!enabled || !value || !root) return undefined;
    // Refit when the stat's width changes, not its height: shrinking the text changes the height, and refitting for that would chase itself.
    // The refit waits for the next frame: changing the height inside the observer's own callback makes the browser report a loop.
    let lastWidth = root.clientWidth;
    let frame = 0;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (root.clientWidth === lastWidth) return;
            lastWidth = root.clientWidth;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => fit(value, root));
          });
    observer?.observe(root);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      value.style.removeProperty(fitProperty);
    };
  }, [enabled, valueRef, rootSelector]);
}
