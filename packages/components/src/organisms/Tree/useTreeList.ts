import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A list of ids that is controlled when the prop is given and held here when not. A change is asked for the way every
 * controlled component's is: `onChange` always hears it, and the list changes itself only when it is not controlled.
 */
export function useTreeList(
  name: string,
  controlled: string[] | undefined,
  initial: string[] | (() => string[]),
  onChange: ((next: string[]) => void) | undefined,
) {
  const isControlled = controlled !== undefined;
  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && wasControlled.current !== isControlled) {
      console.warn(`Tree: \`${name}\` changed from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${isControlled ? "controlled" : "uncontrolled"}. Decide between controlling it and leaving it to the tree for the tree's life.`);
    }
    wasControlled.current = isControlled;
  }, [isControlled, name]);

  const [inner, setInner] = useState(initial);
  const value = controlled ?? inner;

  // The latest list and callback, so a request made in the same event as another (or from the controller) builds on the newest.
  const latest = useRef({ value, onChange, isControlled });
  useEffect(() => {
    latest.current = { value, onChange, isControlled };
  });

  const request = useCallback((next: string[]) => {
    if (!latest.current.isControlled) {
      latest.current.value = next;
      setInner(next);
    }
    latest.current.onChange?.(next);
  }, []);

  const read = useCallback(() => latest.current.value, []);
  return [value, request, read] as const;
}
