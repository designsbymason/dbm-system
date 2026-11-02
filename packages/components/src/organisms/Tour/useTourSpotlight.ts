import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { warnOnce } from "../../internal/warnOnce";
import type { TourStep } from "./Tour.types";
import { resolveTarget, sameRect } from "./tourHelpers";
import type { SpotlightRect } from "./tourHelpers";

/** `"none"`: the step has no element. `"waiting"`: looking for it. `"found"`. `"missing"`: gave up. */
export type SpotlightStatus = "none" | "waiting" | "found" | "missing";

interface SpotlightOptions {
  step: TourStep | undefined;
  /** Whether the tour is open. */
  active: boolean;
  /** The layer the ring is drawn in: positions are measured from its corner, which a transformed container moves. */
  layerRef: RefObject<HTMLElement | null>;
  /** Milliseconds to wait for the element to appear. */
  timeout: number;
  /** Whether the step is not ready to be looked at yet (its `onEnter` has not finished): the card waits. */
  hold: boolean;
  onMissing: ((step: TourStep) => void) | undefined;
}

/** Frames of no movement before the loop slows down, and how long between checks once it has. */
const STILL_FRAMES = 30;
const IDLE_MS = 250;

interface Resolved {
  key: string | null;
  element: HTMLElement | null;
  status: SpotlightStatus;
}

export interface Spotlight {
  status: SpotlightStatus;
  element: HTMLElement | null;
  /** Where the spotlight is, from the layer's corner; `null` until first measured. */
  rect: SpotlightRect | null;
}

/**
 * Finds the step's element (waiting for it to appear, up to `timeout`) and follows its box. The box is read every
 * animation frame while the tour is open: a scroll in any box, a resize, a layout shift and an easing target all move
 * it, and one rectangle read a frame is cheap beside listening for each cause. A step with no element, or whose element
 * never turned up, is the middle of the layer.
 */
export function useTourSpotlight({ step, active, layerRef, timeout, hold, onMissing }: SpotlightOptions): Spotlight {
  const stepId = step?.id;
  const key = active && stepId !== undefined ? stepId : null;
  const searching = key !== null && !hold;
  const hasTarget = step?.target !== undefined;
  const [resolved, setResolved] = useState<Resolved>({ key: null, element: null, status: "none" });
  const [retry, setRetry] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const latest = useRef({ step, onMissing });
  useEffect(() => {
    latest.current = { step, onMissing };
  });

  // Look for the element: now, on every change to the page, and until the timeout.
  useEffect(() => {
    if (!searching || !hasTarget) return undefined;
    let done = false;
    let timer = 0;
    let frame = 0;
    const observer = new MutationObserver(() => attempt());
    const finish = () => {
      done = true;
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    function attempt() {
      if (done) return;
      const element = resolveTarget(latest.current.step?.target);
      if (!element) return;
      finish();
      setResolved({ key, element, status: "found" });
    }
    frame = requestAnimationFrame(attempt);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    timer = window.setTimeout(() => {
      if (done) return;
      finish();
      setResolved({ key, element: null, status: "missing" });
      const missed = latest.current.step;
      if (missed) {
        warnOnce(`Tour: the step "${missed.id}" found no element to highlight, so its card is in the middle of the screen.`);
        latest.current.onMissing?.(missed);
      }
    }, timeout);
    return finish;
  }, [key, searching, hasTarget, timeout, retry]);

  const found = resolved.key === key && key !== null && hasTarget && !hold;
  const current: Resolved = found
    ? resolved
    : { key, element: null, status: key === null || !hasTarget ? "none" : "waiting" };

  // Follow the element's box from the layer's own corner. A frame a moment while anything is moving, then a slow check
  // that wakes at once on a scroll, a resize or a change in the element's own size, so a still page costs next to nothing.
  const element = current.element;
  useEffect(() => {
    if (key === null) return undefined;
    let frame = 0;
    let timer = 0;
    let still = 0;
    let lastBox: SpotlightRect | null = null;
    const measure = (): boolean => {
      const layer = layerRef.current;
      if (!layer) return false;
      if (element && !element.isConnected) {
        // The page removed it: look again.
        setResolved({ key: null, element: null, status: "none" });
        setRetry((count) => count + 1);
        return false;
      }
      const origin = layer.getBoundingClientRect();
      let next: SpotlightRect;
      if (element) {
        const box = element.getBoundingClientRect();
        next = { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height, centered: false, owner: element };
      } else {
        next = { x: origin.width / 2, y: origin.height / 2, width: 0, height: 0, centered: true, owner: null };
      }
      const changed = !sameRect(lastBox, next);
      lastBox = next;
      setRect((previous) => (sameRect(previous, next) ? previous : next));
      return changed;
    };
    const run = () => {
      frame = 0;
      timer = 0;
      still = measure() ? 0 : still + 1;
      if (still < STILL_FRAMES) frame = requestAnimationFrame(run);
      else timer = window.setTimeout(run, IDLE_MS);
    };
    const wake = () => {
      still = 0;
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
      if (!frame) frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    window.addEventListener("scroll", wake, { capture: true, passive: true });
    window.addEventListener("resize", wake);
    // Content inserted or restyled elsewhere on the page, and a CSS transition or animation starting or ending, move an
    // element without a scroll, a resize or a change in its own size.
    const mutations = typeof MutationObserver === "undefined" ? null : new MutationObserver(wake);
    mutations?.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden"] });
    const movers = ["transitionrun", "transitionend", "animationstart", "animationend"] as const;
    for (const type of movers) document.addEventListener(type, wake, true);
    const observer = element && typeof ResizeObserver !== "undefined" ? new ResizeObserver(wake) : null;
    if (element) observer?.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", wake, { capture: true });
      window.removeEventListener("resize", wake);
      mutations?.disconnect();
      for (const type of movers) document.removeEventListener(type, wake, true);
      observer?.disconnect();
    };
  }, [key, element, layerRef]);

  return { status: current.status, element: current.element, rect: key === null ? null : rect };
}
