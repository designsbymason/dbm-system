import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

// `useLayoutEffect` warns on the server; the bar draws every item there and measures once it is in a browser.
export const useIsomorphicLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

const pixels = (value: string) => Number.parseFloat(value) || 0;

/**
 * How many of a bar's leading items fit in the room its container gives it, the rest going into a "More" menu.
 *
 * The bar draws every item first and measures them, remembers each width, and from then on works from the remembered
 * widths (a trimmed item is not in the page to measure), so the bar can grow back when its container does. Items are
 * the bar's children marked `data-menubar-item`, and the "More" trigger is the one marked `data-menubar-more`; its width
 * is read once it has been drawn. A bar is as wide as its items, so the room is the container's, not the bar's.
 *
 * An item that has keyboard focus is never taken out from under it: the count is held, and settled when focus leaves.
 */
export function useMenubarOverflow({
  enabled,
  barRef,
  count,
  signature,
}: {
  enabled: boolean;
  barRef: RefObject<HTMLElement | null>;
  /** How many items the bar was given. */
  count: number;
  /** Changes when what the items are drawn as changes, so their remembered widths are forgotten. */
  signature: string;
}): number {
  // How many were drawn for how many items: items that have just come (or gone) are all drawn until they are measured.
  const [state, setState] = useState({ visible: count, count });
  const visible =
    state.count === count ? Math.min(state.visible, count) : count;
  const widths = useRef<number[]>([]);
  const moreWidth = useRef(0);
  const latest = useRef({ visible, count });

  const fit = useCallback(() => {
    const bar = barRef.current;
    if (!enabled || !bar) return;
    const { visible: shown, count: total } = latest.current;
    const items = [
      ...bar.querySelectorAll<HTMLElement>(
        "[data-menubar-item]:not([data-menubar-more])",
      ),
    ];
    // Only a draw of every item has every width to read.
    if (shown >= total && items.length === total)
      widths.current = items.map((item) => item.getBoundingClientRect().width);
    const more = bar.querySelector<HTMLElement>("[data-menubar-more]");
    if (more) moreWidth.current = more.getBoundingClientRect().width;
    if (widths.current.length !== total) return;
    const parent = bar.parentElement;
    if (!parent) return;
    const own = getComputedStyle(bar);
    const around = getComputedStyle(parent);
    const room =
      parent.getBoundingClientRect().width -
      pixels(around.paddingInlineStart) -
      pixels(around.paddingInlineEnd);
    const box =
      pixels(own.paddingInlineStart) +
      pixels(own.paddingInlineEnd) +
      pixels(own.borderInlineStartWidth) +
      pixels(own.borderInlineEndWidth);
    const gap = pixels(own.columnGap);
    const widthOf = (n: number) =>
      widths.current.slice(0, n).reduce((sum, width) => sum + width, 0) +
      Math.max(0, n - 1) * gap;
    let next = 0;
    if (widthOf(total) + box <= room) next = total;
    else {
      // Until the "More" trigger has been drawn, assume it is as wide as an item.
      const reserved = (moreWidth.current || widths.current[0] || 0) + gap;
      for (let n = total - 1; n > 0; n -= 1) {
        if (widthOf(n) + reserved + box <= room) {
          next = n;
          break;
        }
      }
    }
    if (next === shown) return;
    // An item with keyboard focus that would go is held until focus has moved on.
    const active = document.activeElement;
    const focused =
      active instanceof HTMLElement
        ? items.findIndex((item) => item === active || item.contains(active))
        : -1;
    if (next < shown && focused >= next) return;
    setState({ visible: next, count: total });
  }, [barRef, enabled]);

  useIsomorphicLayoutEffect(() => {
    latest.current = { visible, count };
  });

  // What the items are drawn as changed: draw every one again and measure them afresh.
  useIsomorphicLayoutEffect(() => {
    widths.current = [];
    moreWidth.current = 0;
    setState({ visible: count, count });
  }, [signature, count]);

  // Fit once what it depends on has changed (items drawn or not, their count or look), not after every render of the bar:
  // reading layout is the cost, and a resize of the container is the observer's to report.
  useIsomorphicLayoutEffect(() => {
    fit();
  }, [fit, state.visible, state.count, count, signature]);

  useEffect(() => {
    const bar = barRef.current;
    if (!enabled || !bar) return undefined;
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => requestAnimationFrame(fit));
    if (bar.parentElement) observer?.observe(bar.parentElement);
    // Focus left an item the count was held for: settle it now.
    const onFocusOut = () => requestAnimationFrame(fit);
    bar.addEventListener("focusout", onFocusOut);
    return () => {
      observer?.disconnect();
      bar.removeEventListener("focusout", onFocusOut);
    };
  }, [barRef, enabled, fit]);

  return enabled ? visible : count;
}
