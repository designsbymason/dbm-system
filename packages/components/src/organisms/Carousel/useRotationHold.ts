import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * What holds automatic rotation apart from the pointer, focus and a hidden page: `hold()` calls from code (each returns its own
 * release, and holds add up), and audio or video playing inside a slide. Media events don't bubble, so they are heard in the
 * capture phase on the track.
 */
export function useRotationHold(trackRef: RefObject<HTMLElement | null>, enabled: boolean): { held: boolean; hold: () => () => void } {
  const [holds, setHolds] = useState(0);
  const [mediaPlaying, setMediaPlaying] = useState(false);

  const hold = useCallback(() => {
    let released = false;
    setHolds((current) => current + 1);
    return () => {
      if (released) return;
      released = true;
      setHolds((current) => Math.max(0, current - 1));
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled) return;
    const playing = new Set<EventTarget>();
    const onPlay = (event: Event) => {
      playing.add(event.target as EventTarget);
      setMediaPlaying(true);
    };
    const onStop = (event: Event) => {
      playing.delete(event.target as EventTarget);
      setMediaPlaying(playing.size > 0);
    };
    track.addEventListener("play", onPlay, true);
    track.addEventListener("pause", onStop, true);
    track.addEventListener("ended", onStop, true);
    return () => {
      track.removeEventListener("play", onPlay, true);
      track.removeEventListener("pause", onStop, true);
      track.removeEventListener("ended", onStop, true);
      setMediaPlaying(false);
    };
  }, [trackRef, enabled]);

  return { held: holds > 0 || mediaPlaying, hold };
}
