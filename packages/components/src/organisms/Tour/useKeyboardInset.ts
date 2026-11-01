import { useEffect, useState } from "react";

/**
 * How far an on-screen keyboard (or anything else that shrinks the visible part of the page without resizing the layout
 * viewport) covers the bottom of the screen, in pixels: a layer pinned to the bottom of the layout viewport would sit
 * behind it. `0` on a server, with no visual viewport, or while `enabled` is off. Measured again when the visual viewport
 * resizes or scrolls.
 */
export function useKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const visual = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!enabled || !visual) return undefined;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - visual.height - visual.offsetTop)));
    const first = requestAnimationFrame(update);
    visual.addEventListener("resize", update);
    visual.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(first);
      visual.removeEventListener("resize", update);
      visual.removeEventListener("scroll", update);
    };
  }, [enabled]);
  return enabled ? inset : 0;
}
