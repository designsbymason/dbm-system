import { useEffect, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";

/**
 * A button the person's own press turns off (the last position without a wrap) must not take their focus with it: a disabled
 * button loses focus in some browsers and keeps it, dead, in others. The press leaves a note in the returned ref; once the
 * state has changed, if focus is on `body` or on a disabled button inside the carousel it moves to the other enabled button.
 */
export function useButtonFocusHandoff(
  root: RefObject<HTMLElement | null>,
  state: { value: number; canNext: boolean; canPrevious: boolean },
): MutableRefObject<"previous" | "next" | null> {
  const pressed = useRef<"previous" | "next" | null>(null);
  const { value, canNext, canPrevious } = state;
  useEffect(() => {
    const wasPressed = pressed.current;
    pressed.current = null;
    if (!wasPressed || !root.current) return;
    const active = document.activeElement;
    const lost = active === document.body || (active instanceof HTMLButtonElement && active.disabled && root.current.contains(active));
    if (!lost) return;
    const other = wasPressed === "next" ? "previous" : "next";
    // A carousel inside one of this one's slides has buttons of its own, so only those that belong to this carousel count.
    const owner = root.current;
    [...owner.querySelectorAll<HTMLButtonElement>(`[data-carousel-control="${other}"]:not(:disabled)`)]
      .find((button) => button.closest('[aria-roledescription="carousel"]') === owner)
      ?.focus();
  }, [root, value, canNext, canPrevious]);
  return pressed;
}
