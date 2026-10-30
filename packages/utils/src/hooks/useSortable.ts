import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

// How far (CSS pixels) a press has to travel before it is a drag and not a click: a behaviour threshold, not a design value.
const DRAG_THRESHOLD = 4;
// How close (CSS pixels) to the edge of the scrolling container a drag has to be before it scrolls it, and the most it
// scrolls in a frame, at the very edge: behaviour thresholds, not design values.
const AUTO_SCROLL_EDGE = 40;
const AUTO_SCROLL_MAX_STEP = 20;

/** How far to scroll along one axis for a pointer at `position` in a box from `start` to `end`: 0 away from the edges. */
function edgeStep(position: number, start: number, end: number): number {
  const edge = Math.min(AUTO_SCROLL_EDGE, (end - start) / 3);
  if (edge <= 0) return 0;
  if (position < start + edge) return -AUTO_SCROLL_MAX_STEP * Math.min(1, (start + edge - position) / edge);
  if (position > end - edge) return AUTO_SCROLL_MAX_STEP * Math.min(1, (position - (end - edge)) / edge);
  return 0;
}

export interface SortableMove {
  /** What asked for the move: a key press, or a drag or a tap. */
  via: "keyboard" | "pointer";
}

/** What picked an item up: a key press, or a tap (`tapToMove`). */
export type SortableLift = "keyboard" | "pointer";

export interface UseSortableOptions {
  /** Whether items can be moved. When `false` the hook does nothing and every handler reports "not handled". @default true */
  enabled?: boolean;
  /** How many items there are. */
  count: number;
  /**
   * Asks the owner to move the item at `from` so that it ends up at `to` (the index it will have once moved). The hook
   * never reorders anything itself: a gesture asks, and the owner applies it by changing what it passes next.
   */
  onMove: (from: number, to: number, move: SortableMove) => void;
  /** The item at `index` was picked up, by a key press or a tap. */
  onLift?: (index: number, via: SortableLift) => void;
  /** The picked-up item was dropped where it is, at `index`. */
  onDrop?: (index: number) => void;
  /** The pick-up was cancelled and the item put back at `origin`. */
  onCancel?: (origin: number) => void;
  /**
   * Lets a tap or click that does not move pick an item up, and a tap on another item put it in that item's place (a tap
   * on the picked-up item drops it where it is). It is the way to move an item without dragging, for a person who can't
   * drag (WCAG 2.5.7). A press on a button, a link or a field inside an item is not a tap on the item.
   * @default false
   */
  tapToMove?: boolean;
  /**
   * Scrolls the container, the element that has `containerRef`, while an item is dragged near its edge, so an item
   * can be taken to one that is out of view. The container must be the element that scrolls.
   * @default false
   */
  autoScroll?: boolean;
  /**
   * Which way the items are laid out. A vertical list decides which side of an item a drop lands on from the pointer's height
   * against the item's middle, not its width, and its drop marker is on the item's top or bottom edge.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /** Whether the items read right to left, which flips the horizontal arrow keys and the side a drop lands on. @default false */
  rtl?: boolean | (() => boolean);
}

export interface SortableDrag {
  /** The index the dragged item started at. */
  from: number;
  /** Where it will end up if dropped now, or `from` when dropping would change nothing. */
  to: number;
  /** The item the pointer is nearest, which the drop marker is drawn beside. */
  over: number;
  /** Which side of `over` the marker is on, in reading order. */
  position: "before" | "after";
}

export interface SortableItemProps {
  "data-sortable-index": number;
  /** Present on the item picked up with the keyboard. */
  "data-lifted"?: true;
  /** Present on the item being dragged with the pointer. */
  "data-dragging"?: true;
  /** Present on the item beside which a drop would land, and which side. */
  "data-drop"?: "before" | "after";
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * Reordering one list of items by pointer, touch and keyboard, with no dependency. It is mechanics only: it draws
 * nothing, owns no order and applies no move. A component spreads `itemProps(index)` onto each item (so the hook can find
 * the items and hear a press), calls `handleKeyDown` from a key handler for the item that has focus, and reorders its
 * own array in `onMove`.
 *
 * - **Pointer and touch:** press an item and move past a few pixels to drag it; the item nearest the pointer gets a
 *   `data-drop` marker, and the move is asked for on release. The press that ends a drag does not also click. A touch
 *   press drags at once, so a component that is scrolled by touch gives the items `touch-action: none`.
 * - **Tap:** with `tapToMove`, a tap that does not move picks an item up, and a tap on another item puts the picked-up one
 *   in its place, for a person who can't drag.
 * - **Keyboard:** Space picks the focused item up, the arrow keys (flipped in a right-to-left list), Home and End move
 *   it, Space or Enter drops it and Escape puts it back where it started. Alt with an arrow key moves an item one place
 *   without picking it up.
 * - **Wrapping rows:** the drop target is the item nearest the pointer, not a position along one axis, so a list that
 *   wraps onto several lines works the same.
 *
 * Moves are wanted in the index the item will have afterwards, so `onMove(2, 0)` means "make this item the first".
 *
 * @example
 * ```tsx
 * const sortable = useSortable({ count: items.length, onMove: (from, to) => setItems(move(items, from, to)) });
 * return (
 *   <ul ref={sortable.containerRef}>
 *     {items.map((item, index) => (
 *       <li key={item.id} {...sortable.itemProps(index)} onKeyDown={(event) => sortable.handleKeyDown(event, index)}>
 *         {item.name}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useSortable<Container extends HTMLElement = HTMLElement>({
  enabled = true,
  count,
  onMove,
  onLift,
  onDrop,
  onCancel,
  rtl = false,
  tapToMove = false,
  autoScroll = false,
  orientation = "horizontal",
}: UseSortableOptions) {
  const container = useRef<Container | null>(null);
  // A callback ref, so the element is set without anything reading a ref while rendering.
  const containerRef = useCallback((element: Container | null) => {
    container.current = element;
  }, []);
  const [lifted, setLifted] = useState<number | null>(null);
  const [liftedVia, setLiftedVia] = useState<SortableLift | null>(null);
  const [drag, setDrag] = useState<SortableDrag | null>(null);

  // The latest options, read by the listeners below, which are added once per press.
  const latest = useRef({ enabled, count, onMove, onLift, onDrop, onCancel, rtl, lifted, tapToMove, autoScroll, orientation });
  useLayoutEffect(() => {
    latest.current = { enabled, count, onMove, onLift, onDrop, onCancel, rtl, lifted, tapToMove, autoScroll, orientation };
  });
  const origin = useRef(0);
  const liftedViaRef = useRef<SortableLift | null>(null);
  useLayoutEffect(() => {
    liftedViaRef.current = liftedVia;
  });
  const cleanup = useRef<(() => void) | null>(null);

  const isRtl = () => {
    const value = latest.current.rtl;
    return typeof value === "function" ? value() : value;
  };

  // A press that was a drag must not also be a click on whatever was under the pointer when it ended.
  const swallowNextClick = () => {
    const stop = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    window.addEventListener("click", stop, { capture: true, once: true });
    window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
  };

  const itemRects = () => {
    if (!container.current) return [];
    return Array.from(container.current.querySelectorAll<HTMLElement>("[data-sortable-index]")).map((element) => ({
      index: Number(element.dataset.sortableIndex),
      rect: element.getBoundingClientRect(),
    }));
  };

  /** Which item the point is nearest, and which side of it the point is on in reading order. */
  const target = (x: number, y: number, from: number): SortableDrag | null => {
    let best: { index: number; rect: DOMRect; distance: number } | null = null;
    for (const { index, rect } of itemRects()) {
      if (rect.width === 0 && rect.height === 0) continue;
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      const distance = dx * dx + dy * dy;
      if (!best || distance < best.distance) best = { index, rect, distance };
    }
    if (!best) return null;
    const before =
      latest.current.orientation === "vertical"
        ? y < best.rect.top + best.rect.height / 2
        : isRtl()
          ? x > best.rect.left + best.rect.width / 2
          : x < best.rect.left + best.rect.width / 2;
    const insertion = before ? best.index : best.index + 1;
    const to = insertion > from ? insertion - 1 : insertion;
    return { from, to, over: best.index, position: before ? "before" : "after" };
  };

  const stopTracking = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
  }, []);
  useEffect(() => stopTracking, [stopTracking]);

  const lift = (index: number, via: SortableLift) => {
    origin.current = index;
    setLifted(index);
    setLiftedVia(via);
    latest.current.onLift?.(index, via);
  };
  const clearLift = () => {
    setLifted(null);
    setLiftedVia(null);
  };

  // A tap that did not move: pick the item up, or put the picked-up item in this item's place, or drop it where it is.
  const tap = (index: number) => {
    const { enabled: on, tapToMove: allowed, lifted: current } = latest.current;
    if (!on || !allowed) return;
    if (current === null) {
      lift(index, "pointer");
      return;
    }
    clearLift();
    // A move says where the item ended up; a drop is only for an item put down where it was.
    if (current !== index) latest.current.onMove(current, index, { via: "pointer" });
    else latest.current.onDrop?.(index);
  };

  const onPointerDown = (index: number) => (event: ReactPointerEvent<HTMLElement>) => {
    if (!latest.current.enabled || (event.pointerType === "mouse" && event.button !== 0) || !event.isPrimary) return;
    stopTracking();
    // A press on a button, a link or a field inside the item (a remove button) is that control's, not a tap on the item.
    const control = event.target instanceof Element ? event.target.closest("button, a, input, select, textarea") : null;
    const pressedOnControl = control !== null && control !== event.currentTarget && event.currentTarget.contains(control);
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    let pointer = { x: startX, y: startY };
    let frame = 0;
    const show = () => setDrag(target(pointer.x, pointer.y, index) ?? { from: index, to: index, over: index, position: "after" });
    // While the pointer is near an edge of the scrolling container, scroll it a step a frame and re-aim the drop.
    const scrollStep = () => {
      frame = 0;
      const scroller = container.current;
      if (!dragging || !latest.current.autoScroll || !scroller || typeof scroller.scrollBy !== "function") return;
      const box = scroller.getBoundingClientRect();
      const left = edgeStep(pointer.x, box.left, box.right);
      const top = edgeStep(pointer.y, box.top, box.bottom);
      if (left === 0 && top === 0) return;
      scroller.scrollBy({ left, top });
      show();
      frame = window.requestAnimationFrame(scrollStep);
    };
    const move = (moved: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(moved.clientX - startX, moved.clientY - startY) < DRAG_THRESHOLD) return;
        dragging = true;
      }
      pointer = { x: moved.clientX, y: moved.clientY };
      show();
      if (frame === 0 && latest.current.autoScroll) frame = window.requestAnimationFrame(scrollStep);
    };
    const end = (ended: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      const final = dragging ? target(ended.clientX, ended.clientY, index) : null;
      stopTracking();
      setDrag(null);
      if (!dragging) {
        if (ended.type === "pointerup" && !pressedOnControl) tap(index);
        return;
      }
      swallowNextClick();
      if (ended.type === "pointerup" && final && final.to !== index) latest.current.onMove(index, final.to, { via: "pointer" });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    cleanup.current = () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  };

  const itemProps = (index: number): SortableItemProps => {
    const props: SortableItemProps = { "data-sortable-index": index, onPointerDown: onPointerDown(index) };
    if (lifted === index) props["data-lifted"] = true;
    if (drag?.from === index) props["data-dragging"] = true;
    if (drag && drag.over === index && drag.to !== drag.from) props["data-drop"] = drag.position;
    return props;
  };

  const step = (index: number, to: number, via: SortableMove["via"]) => {
    const bounded = Math.min(Math.max(to, 0), latest.current.count - 1);
    if (bounded === index) return index;
    latest.current.onMove(index, bounded, { via });
    return bounded;
  };

  /**
   * Handles a key press on the item at `index`. Returns `true` when the key was for reordering (the caller should
   * stop, and keep it from other handlers), `false` when it was not.
   */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>, index: number): boolean => {
    if (!latest.current.enabled) return false;
    const { key } = event;
    const flip = isRtl() ? -1 : 1;
    const direction = key === "ArrowLeft" ? -flip : key === "ArrowRight" ? flip : key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;

    if (latest.current.lifted === null) {
      if (key === " " && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        lift(index, "keyboard");
        return true;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && direction !== 0) {
        event.preventDefault();
        step(index, index + direction, "keyboard");
        return true;
      }
      return false;
    }

    // A key pressed on another item than the picked-up one (it was picked up with a tap) only cancels.
    if (index !== latest.current.lifted && key !== "Escape") return false;
    if (direction !== 0) {
      event.preventDefault();
      setLifted(step(index, index + direction, "keyboard"));
      return true;
    }
    if (key === "Home" || key === "End") {
      event.preventDefault();
      setLifted(step(index, key === "Home" ? 0 : latest.current.count - 1, "keyboard"));
      return true;
    }
    if (key === " " || key === "Enter") {
      event.preventDefault();
      clearLift();
      latest.current.onDrop?.(index);
      return true;
    }
    if (key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      return true;
    }
    return false;
  };

  /** Puts a picked-up item back where it started, and drops it there. Does nothing when nothing is picked up. */
  const cancel = () => {
    const current = latest.current.lifted;
    if (current === null) return;
    if (current !== origin.current) latest.current.onMove(current, origin.current, { via: "keyboard" });
    clearLift();
    latest.current.onCancel?.(origin.current);
  };

  /**
   * Keeps Space from also activating a button it was pressed on, which a browser does on the key's release.
   * Call from a key-up handler; returns `true` when it kept the key.
   */
  const handleKeyUp = (event: ReactKeyboardEvent<HTMLElement>): boolean => {
    if (!latest.current.enabled || event.key !== " ") return false;
    event.preventDefault();
    return true;
  };

  /**
   * Drops a picked-up item where it is, as when focus leaves the list. With `via` it only drops an item picked up that
   * way: moving focus drops one picked up with the keyboard, but not one picked up with a tap.
   */
  const release = (via?: SortableLift) => {
    const current = latest.current.lifted;
    if (current === null || (via !== undefined && liftedViaRef.current !== via)) return;
    clearLift();
    latest.current.onDrop?.(current);
  };

  return { containerRef, lifted, liftedVia, drag, itemProps, handleKeyDown, handleKeyUp, release, cancel };
}
