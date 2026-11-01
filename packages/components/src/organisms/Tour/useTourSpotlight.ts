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
  onMissing: ((step: TourStep) => void) | undefined;
}

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
export function useTourSpotlight({ step, active, layerRef, timeout, onMissing }: SpotlightOptions): Spotlight {
  const stepId = step?.id;
  const key = active && stepId !== undefined ? stepId : null;
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
    if (key === null || !hasTarget) return undefined;
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
  }, [key, hasTarget, timeout, retry]);

  const current: Resolved =
    resolved.key === key && key !== null && hasTarget
      ? resolved
      : { key, element: null, status: key === null || !hasTarget ? "none" : "waiting" };

  // Follow the element's box, frame by frame, from the layer's own corner.
  const element = current.element;
  useEffect(() => {
    if (key === null) return undefined;
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const layer = layerRef.current;
      if (!layer) return;
      if (element && !element.isConnected) {
        // The page removed it: look again.
        setResolved({ key: null, element: null, status: "none" });
        setRetry((count) => count + 1);
        return;
      }
      const origin = layer.getBoundingClientRect();
      let next: SpotlightRect;
      if (element) {
        const box = element.getBoundingClientRect();
        next = { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height, centered: false, owner: element };
      } else {
        next = { x: origin.width / 2, y: origin.height / 2, width: 0, height: 0, centered: true, owner: null };
      }
      setRect((previous) => (sameRect(previous, next) ? previous : next));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, element, layerRef]);

  return { status: current.status, element: current.element, rect: key === null ? null : rect };
}
