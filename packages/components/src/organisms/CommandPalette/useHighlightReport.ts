import { useEffect, useRef } from "react";
import type { CommandItem } from "./CommandPalette.types";

/**
 * Tells the app which command is highlighted, and that none is once the palette closes. It reports a change of
 * command by its `value`, not by the object: an app that builds its `commands` on every render hands over new objects
 * each time, and a report per render would call a callback that sets state in a loop.
 */
export function useHighlightReport(item: CommandItem | null, onChange: ((item: CommandItem | null) => void) | undefined) {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  // What was last reported: `undefined` before anything has been, so the first report is made.
  const reported = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const value = item ? item.value : null;
    if (reported.current === value) return;
    reported.current = value;
    latest.current?.(item);
  }, [item]);
  useEffect(
    () => () => {
      // Forgotten on the way out, so React's StrictMode remount (which keeps the ref) reports again.
      reported.current = undefined;
      latest.current?.(null);
    },
    [],
  );
}
