import { useEffect, useRef } from "react";

/**
 * Says how many events were added to a timeline that is showing, when `announce` is on. Remembers the count it last saw:
 * the first render says nothing, and neither does events arriving where there were none (data that comes after the page
 * is a first appearance, not a change); the remembered count is forgotten while there is nothing to show (`06` §9).
 */
export function useTimelineAdditions(count: number, announce: boolean, write: (added: number) => string, say: (text: string) => void) {
  const previous = useRef<number | undefined>(undefined);
  useEffect(() => {
    const before = previous.current;
    previous.current = count === 0 ? undefined : count;
    if (announce && before !== undefined && count > before) say(write(count - before));
  }, [announce, count, say, write]);
}
