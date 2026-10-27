import { useIsScrollable } from "@dbm-system/utils";
import { useEffect, useRef } from "react";
import type { FocusEvent } from "react";
import { COMPACT_QUERY, revealInline } from "./stepperHelpers";
import type { StepperCompact, StepperOrientation, StepperSize } from "./Stepper.types";

interface StepperFocusOptions {
  compact: StepperCompact;
  orientation: StepperOrientation;
  size: StepperSize;
  currentIndex: number;
  /** Whether any step can be entered, so something in the strip has focus to offer. */
  hasEnterable: boolean;
  /** Asks for a step by position (a summary button was pressed). */
  requestIndex: (index: number) => void;
  onFocus: ((event: FocusEvent<HTMLElement>) => void) | undefined;
  onBlur: ((event: FocusEvent<HTMLElement>) => void) | undefined;
}

/**
 * Everything about where focus is and what is in view: the strip that scrolls (the current and the focused step are
 * brought fully into view, and the strip is a tab stop only while it scrolls with nothing in it to focus), focus kept
 * across the compact breakpoint, and focus kept when a summary button the person pressed becomes disabled. Returns the
 * refs to attach and the handlers for the nav.
 */
export function useStepperFocus({
  compact,
  orientation,
  size,
  currentIndex,
  hasEnterable,
  requestIndex,
  onFocus,
  onBlur,
}: StepperFocusOptions) {
  const navRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  // The strip: reachable by keyboard only while it scrolls (sideways, or, in a short container, down) and has no step to focus
  // (WCAG 2.1.1).
  const scrollable = useIsScrollable(scrollerRef, "both");
  const scrollerTabIndex = scrollable && !hasEnterable ? 0 : undefined;

  // The current step is in view whenever it changes, and when the stepper first draws: a strip that scrolls can
  // otherwise hold it off the edge.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const item = currentIndex >= 0 ? listRef.current?.children[currentIndex] : undefined;
    if (scroller && item instanceof HTMLElement) revealInline(scroller, item);
  }, [currentIndex, orientation, size]);

  const firstEnabledSummaryButton = (): HTMLElement | null => {
    for (const button of [backRef.current, nextRef.current]) {
      if (button && !button.disabled) return button;
    }
    return summaryRef.current;
  };

  // Where focus is in the stepper, kept from the focus events: by the time the width changes, the browser has already
  // taken focus off a control it hid, so asking where focus is then finds nothing. A blur that comes from the control
  // being hidden leaves it as it was; any other leaving of the stepper clears it.
  const focusPlace = useRef<"list" | "summary" | null>(null);
  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    onFocus?.(event);
    const scroller = scrollerRef.current;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (summaryRef.current?.contains(target)) focusPlace.current = "summary";
    else if (listRef.current?.contains(target)) focusPlace.current = "list";
    // A browser scrolls a focused control into view only when it is completely hidden, so a partly hidden one is revealed here.
    if (!scroller || target === scroller) return;
    requestAnimationFrame(() => revealInline(scroller, target));
  };
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget;
    if (next instanceof Node) {
      if (!navRef.current?.contains(next)) focusPlace.current = null;
    } else if (event.target instanceof HTMLElement && event.target.getClientRects().length > 0) {
      focusPlace.current = null;
    }
  };

  // When the width crosses the breakpoint `compact="auto"` switches at, the form that was drawn is hidden: focus inside
  // it moves to the other form instead of falling to the top of the page. Done here, in the change event.
  useEffect(() => {
    if (compact !== "auto" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(COMPACT_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      const place = focusPlace.current;
      if (event.matches && place === "list") {
        firstEnabledSummaryButton()?.focus();
      } else if (!event.matches && place === "summary") {
        const target = listRef.current?.querySelector<HTMLElement>("button:not(:disabled), a[href]") ?? scrollerRef.current;
        target?.focus();
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [compact]);

  // A summary button that is pressed and then becomes disabled (back at the first step, next at the last) would drop focus
  // to the page, or leave it on a dead button. A press leaves a short-lived note, and if focus is lost by the next commit
  // it goes to the other button, or the summary.
  const pendingFocus = useRef(0);
  useEffect(() => {
    if (pendingFocus.current === 0) return;
    if (Date.now() - pendingFocus.current > 1000) {
      pendingFocus.current = 0;
      return;
    }
    const active = document.activeElement;
    const stillAlive =
      active && active !== document.body && navRef.current?.contains(active) && !(active instanceof HTMLButtonElement && active.disabled);
    if (stillAlive) return;
    pendingFocus.current = 0;
    firstEnabledSummaryButton()?.focus();
  });
  const pressSummaryButton = (index: number) => {
    pendingFocus.current = Date.now();
    requestIndex(index);
  };

  return { navRef, scrollerRef, listRef, summaryRef, backRef, nextRef, scrollerTabIndex, handleFocus, handleBlur, pressSummaryButton };
}
