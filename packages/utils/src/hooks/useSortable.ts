import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

// How far (CSS pixels) a press has to travel before it is a drag and not a click: a behaviour threshold, not a design value.
const DRAG_THRESHOLD = 4;

export interface SortableMove {
  /** What asked for the move: a key press or a drag. */
  via: "keyboard" | "pointer";
}

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
  /** A key press picked up the item at `index`. */
  onLift?: (index: number) => void;
  /** The picked-up item was dropped where it is, at `index`. */
  onDrop?: (index: number) => void;
  /** The pick-up was cancelled and the item put back at `origin`. */
  onCancel?: (origin: number) => void;
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
}: UseSortableOptions) {
  const container = useRef<Container | null>(null);
  // A callback ref, so the element is set without anything reading a ref while rendering.
  const containerRef = useCallback((element: Container | null) => {
    container.current = element;
  }, []);
  const [lifted, setLifted] = useState<number | null>(null);
  const [drag, setDrag] = useState<SortableDrag | null>(null);

  // The latest options, read by the listeners below, which are added once per press.
  const latest = useRef({ enabled, count, onMove, onLift, onDrop, onCancel, rtl, lifted });
  useLayoutEffect(() => {
    latest.current = { enabled, count, onMove, onLift, onDrop, onCancel, rtl, lifted };
  });
  const origin = useRef(0);
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
    const centre = best.rect.left + best.rect.width / 2;
    const before = isRtl() ? x > centre : x < centre;
    const insertion = before ? best.index : best.index + 1;
    const to = insertion > from ? insertion - 1 : insertion;
    return { from, to, over: best.index, position: before ? "before" : "after" };
  };

  const stopTracking = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
  }, []);
  useEffect(() => stopTracking, [stopTracking]);

  const onPointerDown = (index: number) => (event: ReactPointerEvent<HTMLElement>) => {
    if (!latest.current.enabled || (event.pointerType === "mouse" && event.button !== 0) || !event.isPrimary) return;
    stopTracking();
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    const move = (moved: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(moved.clientX - startX, moved.clientY - startY) < DRAG_THRESHOLD) return;
        dragging = true;
      }
      setDrag(target(moved.clientX, moved.clientY, index) ?? { from: index, to: index, over: index, position: "after" });
    };
    const end = (ended: PointerEvent) => {
      const final = dragging ? target(ended.clientX, ended.clientY, index) : null;
      stopTracking();
      setDrag(null);
      if (!dragging) return;
      swallowNextClick();
      if (ended.type === "pointerup" && final && final.to !== index) latest.current.onMove(index, final.to, { via: "pointer" });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    cleanup.current = () => {
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
        origin.current = index;
        setLifted(index);
        latest.current.onLift?.(index);
        return true;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && direction !== 0) {
        event.preventDefault();
        step(index, index + direction, "keyboard");
        return true;
      }
      return false;
    }

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
      setLifted(null);
      latest.current.onDrop?.(index);
      return true;
    }
    if (key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (index !== origin.current) latest.current.onMove(index, origin.current, { via: "keyboard" });
      setLifted(null);
      latest.current.onCancel?.(origin.current);
      return true;
    }
    return false;
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

  /** Drops a picked-up item where it is, as when focus leaves the list. */
  const release = () => {
    if (latest.current.lifted === null) return;
    const index = latest.current.lifted;
    setLifted(null);
    latest.current.onDrop?.(index);
  };

  return { containerRef, lifted, drag, itemProps, handleKeyDown, handleKeyUp, release };
}
