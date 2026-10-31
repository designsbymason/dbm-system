import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { prefersReducedMotion } from "./carouselHelpers";
import type { Axis } from "./carouselHelpers";

// A press that moves less than this is a click, not the start of a drag.
const DRAG_THRESHOLD_PX = 5;
// A release faster than this (pixels a millisecond) carries on to the next slide, like a flick.
const FLICK_SPEED = 0.4;
// How far a flick pushes the track before the snap takes it to the nearest slide, as a share of the track's own size.
const FLICK_PUSH = 0.35;
// How much of the distance dragged past the end the slides follow: the rest is resistance. CSS limits how far that can go.
const PULL_SHARE = 0.35;
// What a press on these starts, rather than a drag.
const NO_DRAG = "input, select, textarea, [contenteditable], video, audio, [data-carousel-no-drag]";

/**
 * Lets a mouse drag the slides, the way a finger does: press and move to scroll the track, let go and it snaps to the nearest
 * slide (or the next one, for a flick). Only a mouse: touch and pen scroll natively. While the drag lasts the track has
 * `data-dragging`, which switches snapping off so the scroll position can follow the pointer; letting go switches it back
 * on, and the browser snaps. A click that ends a drag is swallowed, so dragging a card that is a link does not open it.
 * Pressing in a form field, a media element or `[data-carousel-no-drag]` never starts a drag. With `resist`, a drag past the first
 * or last slide pulls the slides a little way (`--carousel-pull`, which the stylesheet limits and eases back on release).
 */
export function useCarouselDrag(trackRef: RefObject<HTMLDivElement | null>, { axis, enabled, resist }: { axis: Axis; enabled: boolean; resist: boolean }): void {
  const latestAxis = useRef(axis);
  const latestResist = useRef(resist);
  useEffect(() => {
    latestAxis.current = axis;
    latestResist.current = resist;
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled) return;
    let press: { pointerId: number; origin: number; scroll: number; dragging: boolean; samples: Array<{ at: number; position: number }> } | null = null;

    const coordinate = (event: PointerEvent) => (latestAxis.current === "block" ? event.clientY : event.clientX);
    const scrollOf = () => (latestAxis.current === "block" ? track.scrollTop : track.scrollLeft);
    const setScroll = (value: number) => {
      if (latestAxis.current === "block") track.scrollTop = value;
      else track.scrollLeft = value;
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(NO_DRAG)) return;
      press = { pointerId: event.pointerId, origin: coordinate(event), scroll: scrollOf(), dragging: false, samples: [] };
    };

    const onMove = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const travelled = coordinate(event) - press.origin;
      if (!press.dragging) {
        if (Math.abs(travelled) < DRAG_THRESHOLD_PX) return;
        press.dragging = true;
        track.dataset.dragging = "";
        window.getSelection()?.removeAllRanges();
        try {
          track.setPointerCapture(event.pointerId);
        } catch {
          // A synthetic or already-ended pointer can't be captured; the drag still follows the window's own moves.
        }
      }
      const wanted = press.scroll - travelled;
      setScroll(wanted);
      // What the browser refused is the drag past an end; the slides follow a share of it.
      if (latestResist.current && !prefersReducedMotion()) {
        const refused = wanted - scrollOf();
        if (Math.abs(refused) > 0.5) track.style.setProperty("--carousel-pull", `${-refused * PULL_SHARE}px`);
        else track.style.removeProperty("--carousel-pull");
      }
      press.samples.push({ at: event.timeStamp, position: coordinate(event) });
      if (press.samples.length > 6) press.samples.shift();
    };

    const swallowNextClick = () => {
      const stop = (event: Event) => {
        event.stopPropagation();
        event.preventDefault();
      };
      track.addEventListener("click", stop, { capture: true, once: true });
      // A drag that ends over nothing clickable produces no click; take the listener off so it can't eat the next real one.
      window.setTimeout(() => track.removeEventListener("click", stop, { capture: true }), 0);
    };

    const onUp = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const { dragging, samples } = press;
      press = null;
      if (!dragging) return;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const speed = first && last && last.at > first.at ? (last.position - first.position) / (last.at - first.at) : 0;
      if (Math.abs(speed) > FLICK_SPEED) {
        const size = latestAxis.current === "block" ? track.clientHeight : track.clientWidth;
        setScroll(scrollOf() - Math.sign(speed) * size * FLICK_PUSH);
      }
      delete track.dataset.dragging;
      track.style.removeProperty("--carousel-pull");
      swallowNextClick();
    };

    const onDragStart = (event: Event) => event.preventDefault();

    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    track.addEventListener("dragstart", onDragStart);
    return () => {
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      track.removeEventListener("dragstart", onDragStart);
      delete track.dataset.dragging;
      track.style.removeProperty("--carousel-pull");
    };
  }, [trackRef, enabled]);
}
