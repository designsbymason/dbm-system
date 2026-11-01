import { mergeDefined } from "@dbm-system/utils";
import { warnOnce } from "../../internal/warnOnce";
import type { TourAlign, TourLabels, TourSide, TourStep, TourTarget } from "./Tour.types";

/** The English defaults, with every number written through `formatNumber`. */
export function defaultLabelsFor(
  formatNumber: (value: number) => string,
  stepOf?: TourLabels["stepOf"],
): TourLabels {
  const progress = stepOf ?? ((current, total) => `Step ${formatNumber(current)} of ${formatNumber(total)}`);
  return {
    next: "Next",
    back: "Back",
    skip: "Skip tour",
    finish: "Finish",
    later: "Remind me later",
    never: "Don't show again",
    stepOf: progress,
    announcement: (current, total, title) => `${progress(current, total)}: ${title}`,
    dialog: "Tour",
  };
}

/** The labels with a step's own button text laid over them. */
export function labelsForStep(labels: TourLabels, step: TourStep | undefined): TourLabels {
  return step?.labels ? mergeDefined<TourLabels>(labels, step.labels) : labels;
}

/** The plain text of a step's title, for a name or an announcement; `undefined` when it is not text. */
export function plainTitle(step: TourStep): string | undefined {
  if (step.textValue) return step.textValue;
  return typeof step.title === "string" ? step.title : undefined;
}

/**
 * Looks a step's target up. A selector that is not valid CSS is reported once and read as "not found", not thrown, so
 * one bad step does not take the page down.
 */
export function resolveTarget(target: TourTarget | undefined): HTMLElement | null {
  if (target === undefined) return null;
  if (typeof target === "string") {
    try {
      return document.querySelector<HTMLElement>(target);
    } catch {
      warnOnce(`Tour: "${target}" is not a valid CSS selector, so the step has no element to highlight.`);
      return null;
    }
  }
  if (typeof target === "function") return target();
  if (target instanceof HTMLElement) return target;
  return target.current;
}

/** Radix places by physical side; the tour's sides follow the text direction. */
export function physicalSide(side: TourSide, dir: "ltr" | "rtl"): "top" | "bottom" | "left" | "right" {
  if (side === "start") return dir === "rtl" ? "right" : "left";
  if (side === "end") return dir === "rtl" ? "left" : "right";
  return side;
}

/** Radix's `align` is already along the side, so it needs no mapping; named here so the type is the tour's own. */
export function physicalAlign(align: TourAlign): TourAlign {
  return align;
}

export interface SpotlightRect {
  /** Pixels from the layer's left edge. */
  x: number;
  /** Pixels from the layer's top edge. */
  y: number;
  width: number;
  height: number;
  /** Whether this is the middle of the screen (a step with no element), not an element's box. */
  centered: boolean;
  /** The element this was measured for (`null` for the middle of the screen), so a stale box is not taken for the new step's. */
  owner: HTMLElement | null;
}

export const sameRect = (a: SpotlightRect | null, b: SpotlightRect): boolean =>
  a !== null &&
  a.x === b.x &&
  a.y === b.y &&
  a.width === b.width &&
  a.height === b.height &&
  a.centered === b.centered &&
  a.owner === b.owner;

/**
 * A `clip-path` over the whole layer with a hole where the element is, so a press inside the spotlight passes through
 * the shield (hit-testing follows `clip-path`). `evenodd` leaves the inner rectangle out.
 */
export function holeClipPath(rect: SpotlightRect): string {
  const x1 = `calc(${rect.x}px - var(--tour-padding))`;
  const y1 = `calc(${rect.y}px - var(--tour-padding))`;
  const x2 = `calc(${rect.x + rect.width}px + var(--tour-padding))`;
  const y2 = `calc(${rect.y + rect.height}px + var(--tour-padding))`;
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1} ${y1}, ${x1} ${y2}, ${x2} ${y2}, ${x2} ${y1}, ${x1} ${y1})`;
}

export interface ScrollOptions {
  /** Pixels to keep clear at the bottom (a docked card). */
  reserve: number;
  /** Pixels to keep clear at the top and bottom (a sticky header or footer). */
  offset: { top?: number; bottom?: number } | undefined;
  smooth: boolean;
}

/**
 * Brings an element into view: inside any scrolling box it sits in and the page. `reserve` keeps the bottom edge clear of a
 * docked card, and `offset` of a sticky header or footer; both are the element's `scroll-margin` for the length of the call.
 */
export function scrollTargetIntoView(element: HTMLElement, { reserve, offset, smooth }: ScrollOptions): void {
  const behavior = smooth ? "smooth" : "auto";
  const top = offset?.top ?? 0;
  const bottom = Math.max(offset?.bottom ?? 0, reserve);
  const previous = { start: element.style.scrollMarginBlockStart, end: element.style.scrollMarginBlockEnd };
  if (top > 0) element.style.scrollMarginBlockStart = `${top}px`;
  if (bottom > 0) element.style.scrollMarginBlockEnd = `${bottom}px`;
  const rect = element.getBoundingClientRect();
  const fits = rect.top >= top && rect.bottom <= window.innerHeight - bottom;
  element.scrollIntoView({ block: fits || bottom > 0 ? "nearest" : "center", inline: "nearest", behavior });
  element.style.scrollMarginBlockStart = previous.start;
  element.style.scrollMarginBlockEnd = previous.end;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** The controls inside an element (or the element itself, if it is one) that Tab reaches, in order. */
export function focusablesIn(element: HTMLElement): HTMLElement[] {
  const inside = [...element.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (candidate) => {
      if (candidate.closest("[hidden], [inert]")) return false;
      const style = getComputedStyle(candidate);
      return style.display !== "none" && style.visibility !== "hidden";
    },
  );
  return element.matches(FOCUSABLE) ? [element, ...inside] : inside;
}
