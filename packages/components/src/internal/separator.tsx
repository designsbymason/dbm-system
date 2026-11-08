import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, PointerEvent as ReactPointerEvent } from "react";

/**
 * What a draggable, focusable separator needs that is the same wherever it is drawn (`Splitter`'s handles, `AppShell`'s sidebar handle): the
 * WAI-ARIA window-splitter element, and the lifecycle of a pointer drag. What the separator moves and by how much is each component's own.
 */

/** The ARIA window splitter: a separator that takes focus and reports a value. Pass `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and the handlers. */
export const SeparatorHandle = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div"> & { orientation: "vertical" | "horizontal" }>(
  ({ orientation, ...props }, ref) => (
    // A focusable separator is a widget (the ARIA window-splitter pattern); the lint rule that treats every separator as static content doesn't know that.
    <div
      {...props}
      ref={ref}
      role="separator"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-orientation={orientation}
    />
  ),
);
SeparatorHandle.displayName = "SeparatorHandle";

/**
 * Starts a drag from a pointer press on a separator: the pointer is captured, and the window hears every move, the end and a cancel, so the drag
 * carries on when the pointer leaves the handle. A pointer that is not active (a synthetic event, or one that has just ended) cannot be captured,
 * and the window listeners carry the drag either way. Returns a function that stops the drag (it removes the listeners and releases the pointer);
 * `onEnd` runs when the pointer ends or is cancelled, after it has stopped.
 */
export function startSeparatorDrag(
  event: ReactPointerEvent<HTMLElement>,
  { onMove, onEnd }: { onMove: (event: PointerEvent) => void; onEnd: () => void },
): () => void {
  const handle = event.currentTarget;
  const pointerId = event.pointerId;
  try {
    handle.setPointerCapture(pointerId);
  } catch {
    // Not active, so it cannot be captured; the window listeners below carry the drag either way.
  }
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    try {
      handle.releasePointerCapture(pointerId);
    } catch {
      // Already released, or never captured (see above).
    }
  };
  function finish() {
    stop();
    onEnd();
  }
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
  return stop;
}
