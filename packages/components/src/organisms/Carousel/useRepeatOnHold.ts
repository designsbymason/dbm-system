import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

// How long a press must last before it starts repeating, and how often it then steps. Rhythms for the hand, not design values.
const HOLD_DELAY_MS = 500;
const REPEAT_INTERVAL_MS = 450;

interface RepeatOnHoldHandlers {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClickCapture: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Makes a button that steps the carousel keep stepping while it is held: a press that lasts past a short delay steps, and steps
 * again at an interval, until it is let go, leaves the button, or `step` says there is nowhere left to go. The click that ends a
 * held press is swallowed, so letting go does not step once more. A press that is let go early is an ordinary click.
 */
export function useRepeatOnHold(step: () => boolean, enabled: boolean): RepeatOnHoldHandlers {
  const latestStep = useRef(step);
  useEffect(() => {
    latestStep.current = step;
  });
  const timers = useRef<{ delay?: number; repeat?: number }>({});
  const repeated = useRef(false);

  const stop = useCallback(() => {
    window.clearTimeout(timers.current.delay);
    window.clearInterval(timers.current.repeat);
  }, []);
  useEffect(() => stop, [stop]);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!enabled || event.button !== 0) return;
    repeated.current = false;
    stop();
    // A disabled button receives no pointer-up of its own, so the window hears the release too.
    window.addEventListener("pointerup", stop, { once: true });
    timers.current.delay = window.setTimeout(() => {
      repeated.current = true;
      if (!latestStep.current()) {
        stop();
        return;
      }
      timers.current.repeat = window.setInterval(() => {
        if (!latestStep.current()) stop();
      }, REPEAT_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  };

  return {
    onPointerDown,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClickCapture: (event) => {
      if (!repeated.current) return;
      repeated.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
