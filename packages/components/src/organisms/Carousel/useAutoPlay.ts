import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface UseAutoPlayOptions {
  /** Whether `autoPlay` is on at all. */
  enabled: boolean;
  intervalMs: number;
  /** Whether the pointer is over the carousel, or focus is inside it. */
  held: boolean;
  /** Whether the track is moving under the person's hand or an animation. */
  moving: boolean;
  /** The index of the first slide in view; a change restarts the wait. */
  value: number;
  /** Asks for the next slide, wrapping from the last to the first. */
  advance: () => void;
}

interface AutoPlay {
  /** Whether rotation is running now. */
  playing: boolean;
  /** Whether the person's own pause is off. */
  wanted: boolean;
  toggle: () => void;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(notify: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** Whether the person asked for less motion. False on the server and in the first client render, so the two agree. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * Automatic rotation with its pause rules (WCAG 2.2.2): it waits `intervalMs` on each slide, and holds while the pointer
 * is over the carousel or focus is inside it, while the track moves, and while the page is hidden. The person's own
 * pause stays until they undo it, and rotation starts paused when they prefer reduced motion. Nothing here touches
 * `window` while rendering.
 */
export function useAutoPlay({ enabled, intervalMs, held, moving, value, advance }: UseAutoPlayOptions): AutoPlay {
  // `null` until the person presses the pause button: before that, rotation is wanted unless they prefer reduced motion.
  const [choice, setChoice] = useState<boolean | null>(null);
  const reducedMotion = useReducedMotion();
  const wanted = choice ?? !reducedMotion;
  const [hidden, setHidden] = useState(false);
  const latestAdvance = useRef(advance);
  useEffect(() => {
    latestAdvance.current = advance;
  });

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  const playing = enabled && wanted && !hidden && !held && !moving;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => latestAdvance.current(), intervalMs);
    return () => window.clearTimeout(timer);
  }, [playing, intervalMs, value]);

  return { playing, wanted, toggle: () => setChoice(!wanted) };
}
