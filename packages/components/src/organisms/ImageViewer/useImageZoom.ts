import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { clamp, clampView, fitSize, panLimits, stepScale, wheelFactor, zoomAt } from "./imageViewerMath";
import type { Size, View } from "./imageViewerMath";

/** Where a drag starts being a drag, in pixels: less than this is a tap. */
const SLOP = 6;
/** Two taps closer than this in time and place are a double tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 24;
/** The zoom a double tap goes to, relative to the fitted image. */
const DOUBLE_TAP_SCALE = 2;
/** A flick faster than this, in pixels per millisecond, counts however short it was. */
const FLICK_VELOCITY = 0.5;

/** What the stage asks its owner for when a swipe or a tap ends. */
export interface ZoomGestureHandlers {
  /** A horizontal swipe at the fitted size: `1` for the image after, `-1` for the one before, in reading order. */
  onSwipeNavigate: (direction: 1 | -1) => void;
  /** A downward swipe at the fitted size. */
  onSwipeDismiss: () => void;
  /** A tap on the stage outside the image. */
  onBackgroundPress: () => void;
}

export interface ImageZoomOptions extends ZoomGestureHandlers {
  stageRef: RefObject<HTMLElement | null>;
  boxRef: RefObject<HTMLElement | null>;
  /** The image's own size in pixels, or `null` before it is known. */
  natural: Size | null;
  /** The turn in degrees, a multiple of 90. */
  rotation: number;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  doubleClickZoom: boolean;
  /** Whether zoom, pan and swipe do anything (not while the image is loading or has failed). */
  enabled: boolean;
  /** `-1` in a right-to-left stage, where the image after is to the left. */
  directionSign: 1 | -1;
  /** Whether a downward swipe may dismiss. */
  canDismiss: boolean;
  /** Told the zoom whenever it changes, for the toolbar. */
  onZoomChange: (zoom: number) => void;
}

/** What the viewer's own controls and keys call. */
export interface ImageZoomApi {
  zoom: () => number;
  zoomIn: () => boolean;
  zoomOut: () => boolean;
  reset: () => boolean;
  /** Moves the image by pixels, as the arrow keys do while it is zoomed. `false` at the edge. */
  panBy: (dx: number, dy: number) => boolean;
}

interface Pointer {
  x: number;
  y: number;
}

/**
 * The gestures of the zoomable stage. It lays the image out at its fitted size, keeps the view (zoom and offset) in a
 * ref and writes it straight to the box's transform, so a drag or a pinch re-renders nothing; React is told only the
 * zoom, for the toolbar, when it changes.
 *
 * - A wheel zooms about the cursor, and a trackpad pinch (a wheel with the control key down) does so finely.
 * - Two fingers pinch and move together.
 * - One finger pans a zoomed image, and at the fitted size swipes: sideways to the next or previous image, down to
 *   dismiss. A mouse pans a zoomed image and does not swipe, since it has arrows.
 * - A double tap or click zooms about the point and back.
 */
export function useImageZoom(options: ImageZoomOptions): { fitted: Size; api: ImageZoomApi } {
  const { stageRef, boxRef, natural, rotation } = options;
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  const [stage, setStage] = useState<Size>({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const measure = () => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      setStage((previous) => (previous.width === next.width && previous.height === next.height ? previous : next));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [stageRef]);

  const fitted = useMemo(() => (natural ? fitSize(natural, stage, rotation) : { width: 0, height: 0 }), [natural, stage, rotation]);

  const view = useRef<View>({ scale: 1, x: 0, y: 0 });
  const reportedZoom = useRef(1);
  const geometry = useRef({ fitted, stage, rotation });
  useLayoutEffect(() => {
    geometry.current = { fitted, stage, rotation };
  });

  const write = useCallback(
    (next: View, animate: boolean) => {
      view.current = next;
      const box = boxRef.current;
      if (box) {
        if (animate) box.setAttribute("data-animate", "");
        else box.removeAttribute("data-animate");
        const turn = geometry.current.rotation;
        box.style.transform = `translate(${next.x}px, ${next.y}px) rotate(${turn}deg) scale(${next.scale})`;
      }
      if (reportedZoom.current !== next.scale) {
        reportedZoom.current = next.scale;
        latest.current.onZoomChange(next.scale);
      }
    },
    [boxRef],
  );

  const constrained = useCallback((next: View): View => {
    const current = latest.current;
    return clampView(next, geometry.current.fitted, geometry.current.stage, geometry.current.rotation, current.minZoom, current.maxZoom);
  }, []);

  // A turn, a resize or a new size for the image keeps the view inside the stage.
  useLayoutEffect(() => {
    write(constrained(view.current), true);
  }, [fitted, rotation, write, constrained]);

  const centred = useCallback(
    (clientX: number, clientY: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: clientX - (rect.left + rect.width / 2), y: clientY - (rect.top + rect.height / 2) };
    },
    [stageRef],
  );

  const zoomTo = useCallback(
    (nextScale: number, point: Pointer, animate: boolean) => {
      write(constrained(zoomAt(view.current, nextScale, point.x, point.y)), animate);
    },
    [write, constrained],
  );

  const api = useMemo<ImageZoomApi>(
    () => ({
      zoom: () => view.current.scale,
      zoomIn: () => {
        const current = latest.current;
        if (!current.enabled || view.current.scale >= current.maxZoom) return false;
        zoomTo(stepScale(view.current.scale, 1, current.zoomStep, current.minZoom, current.maxZoom), { x: 0, y: 0 }, true);
        return true;
      },
      zoomOut: () => {
        const current = latest.current;
        if (!current.enabled || view.current.scale <= current.minZoom) return false;
        zoomTo(stepScale(view.current.scale, -1, current.zoomStep, current.minZoom, current.maxZoom), { x: 0, y: 0 }, true);
        return true;
      },
      reset: () => {
        const home = clamp(1, latest.current.minZoom, latest.current.maxZoom);
        const before = view.current;
        if (before.scale === home && before.x === 0 && before.y === 0) return false;
        write({ scale: home, x: 0, y: 0 }, true);
        return true;
      },
      panBy: (dx, dy) => {
        const limit = panLimits(geometry.current.fitted, geometry.current.stage, view.current.scale, geometry.current.rotation);
        if (limit.x === 0 && limit.y === 0) return false;
        const before = view.current;
        const next = constrained({ ...before, x: before.x + dx, y: before.y + dy });
        if (next.x === before.x && next.y === before.y) return false;
        write(next, true);
        return true;
      },
    }),
    [write, constrained, zoomTo],
  );

  // The gestures. They are native listeners: the wheel has to be non-passive to stop the page scrolling, and the pointer
  // listeners read the latest options rather than being rebuilt on every change.
  useEffect(() => {
    const stageElement = stageRef.current;
    if (!stageElement) return undefined;
    const element: HTMLElement = stageElement;

    const pointers = new Map<number, Pointer>();
    let single: {
      id: number;
      type: string;
      startX: number;
      startY: number;
      start: View;
      moved: boolean;
      axis: "x" | "y" | null;
      lastX: number;
      lastY: number;
      lastTime: number;
      velocityX: number;
      velocityY: number;
      onImage: boolean;
    } | null = null;
    let pinch: { distance: number; mid: Pointer; start: View } | null = null;
    let lastTap: { time: number; x: number; y: number } | null = null;

    const distanceOf = () => {
      const [a, b] = [...pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const midpointOf = (): Pointer => {
      const [a, b] = [...pointers.values()];
      return a && b ? centred((a.x + b.x) / 2, (a.y + b.y) / 2) : { x: 0, y: 0 };
    };
    const beginSingle = (event: PointerEvent, from: View) => {
      single = {
        id: event.pointerId,
        type: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        start: from,
        moved: false,
        axis: null,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: event.timeStamp,
        velocityX: 0,
        velocityY: 0,
        onImage: boxRef.current ? boxRef.current.contains(event.target as Node) : false,
      };
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if ((event.target as Element).closest("[data-viewer-ui]")) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!latest.current.enabled) {
        // Nothing to zoom yet, but a press on the stage outside the image still closes the viewer.
        if (pointers.size === 1) beginSingle(event, view.current);
        return;
      }
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // A synthetic or already-ended pointer can't be captured; the gesture still follows the events it gets.
      }
      if (pointers.size === 2) {
        single = null;
        pinch = { distance: Math.max(1, distanceOf()), mid: midpointOf(), start: view.current };
        element.setAttribute("data-gesture", "pinch");
      } else if (pointers.size === 1) {
        beginSingle(event, view.current);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = latest.current;
      if (!current.enabled) return;

      if (pinch && pointers.size >= 2) {
        const nextScale = clamp(pinch.start.scale * (distanceOf() / pinch.distance), current.minZoom, current.maxZoom);
        const mid = midpointOf();
        const zoomed = zoomAt(pinch.start, nextScale, pinch.mid.x, pinch.mid.y);
        write(constrained({ ...zoomed, x: zoomed.x + (mid.x - pinch.mid.x), y: zoomed.y + (mid.y - pinch.mid.y) }), false);
        event.preventDefault();
        return;
      }

      if (!single || event.pointerId !== single.id) return;
      const dx = event.clientX - single.startX;
      const dy = event.clientY - single.startY;
      if (!single.moved && Math.hypot(dx, dy) < SLOP) return;
      single.moved = true;
      const elapsed = Math.max(1, event.timeStamp - single.lastTime);
      single.velocityX = (event.clientX - single.lastX) / elapsed;
      single.velocityY = (event.clientY - single.lastY) / elapsed;
      single.lastX = event.clientX;
      single.lastY = event.clientY;
      single.lastTime = event.timeStamp;

      if (view.current.scale > 1) {
        element.setAttribute("data-gesture", "pan");
        write(constrained({ ...single.start, x: single.start.x + dx, y: single.start.y + dy }), false);
        event.preventDefault();
        return;
      }
      // At the fitted size only a finger swipes; a mouse has the arrows.
      if (single.type === "mouse") return;
      if (!single.axis) single.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      element.setAttribute("data-gesture", "swipe");
      if (single.axis === "x") write({ scale: 1, x: dx, y: 0 }, false);
      else write({ scale: 1, x: 0, y: current.canDismiss ? Math.max(0, dy) : 0 }, false);
      event.preventDefault();
    };

    const finishTap = (event: PointerEvent, onImage: boolean) => {
      const current = latest.current;
      if (!onImage) {
        current.onBackgroundPress();
        return;
      }
      if (!current.enabled || !current.doubleClickZoom) return;
      const now = event.timeStamp;
      const previous = lastTap;
      if (previous && now - previous.time < DOUBLE_TAP_MS && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < DOUBLE_TAP_DISTANCE) {
        lastTap = null;
        const target = view.current.scale > 1.001 ? 1 : Math.min(DOUBLE_TAP_SCALE, current.maxZoom);
        if (target === 1) write({ scale: 1, x: 0, y: 0 }, true);
        else zoomTo(target, centred(event.clientX, event.clientY), true);
        return;
      }
      lastTap = { time: now, x: event.clientX, y: event.clientY };
    };

    const onUp = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      const wasPinching = pinch !== null;
      pointers.delete(event.pointerId);
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // as above: nothing to release
      }
      const current = latest.current;

      if (wasPinching) {
        if (pointers.size < 2) {
          pinch = null;
          element.removeAttribute("data-gesture");
          if (view.current.scale < 1.02) write({ scale: 1, x: 0, y: 0 }, true);
          // The finger left on the screen carries on as a pan.
          const [id, rest] = [...pointers.entries()][0] ?? [];
          if (id !== undefined && rest) {
            beginSingle({ pointerId: id, pointerType: event.pointerType, clientX: rest.x, clientY: rest.y, timeStamp: event.timeStamp, target: event.target } as unknown as PointerEvent, view.current);
            if (single) single.moved = true;
          }
        }
        return;
      }

      if (!single || event.pointerId !== single.id) return;
      const finished = single;
      single = null;
      element.removeAttribute("data-gesture");
      if (!finished.moved) {
        finishTap(event, finished.onImage);
        return;
      }
      lastTap = null;
      if (view.current.scale > 1) return;

      const { stage: size } = geometry.current;
      const dx = event.clientX - finished.startX;
      const dy = event.clientY - finished.startY;
      if (finished.axis === "x") {
        const far = Math.abs(dx) > Math.max(56, size.width * 0.18);
        const quick = Math.abs(finished.velocityX) > FLICK_VELOCITY && Math.abs(dx) > 24;
        write({ scale: 1, x: 0, y: 0 }, true);
        if (far || quick) {
          // Swiping toward the start edge brings the image after it, in either reading direction.
          current.onSwipeNavigate(((dx < 0 ? 1 : -1) * current.directionSign) as 1 | -1);
        }
      } else if (finished.axis === "y") {
        const far = dy > Math.max(96, size.height * 0.18);
        const quick = finished.velocityY > FLICK_VELOCITY && dy > 32;
        write({ scale: 1, x: 0, y: 0 }, true);
        if (current.canDismiss && (far || quick)) current.onSwipeDismiss();
      }
    };

    const onCancel = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      single = null;
      pinch = null;
      lastTap = null;
      element.removeAttribute("data-gesture");
      write(constrained(view.current.scale > 1 ? view.current : { scale: 1, x: 0, y: 0 }), true);
    };

    const onWheel = (event: WheelEvent) => {
      if ((event.target as Element).closest("[data-viewer-ui]")) return;
      event.preventDefault();
      const current = latest.current;
      if (!current.enabled) return;
      const factor = wheelFactor(event.deltaY, event.deltaMode, event.ctrlKey);
      const nextScale = clamp(view.current.scale * factor, current.minZoom, current.maxZoom);
      if (nextScale === view.current.scale) return;
      zoomTo(nextScale, centred(event.clientX, event.clientY), false);
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onCancel);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onCancel);
      element.removeEventListener("wheel", onWheel);
      element.removeAttribute("data-gesture");
    };
  }, [stageRef, boxRef, centred, write, constrained, zoomTo]);

  return { fitted, api };
}
