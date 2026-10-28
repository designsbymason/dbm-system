import { useEffect, useRef, useState } from "react";

interface TimelineExpandedOptions {
  expanded: boolean | undefined;
  defaultExpanded: boolean;
  onExpandedChange: ((expanded: boolean) => void) | undefined;
  /** How many events the cap hides while collapsed; `0` when there is no cap or nothing is hidden. */
  hidden: number;
  /** The text said when they are shown, given how many appeared. */
  write: (count: number) => string;
  /** Says text in the timeline's live region. */
  say: (text: string) => void;
}

/**
 * Whether the events past the cap are shown. Controlled when `expanded` is given: a request then only asks through
 * `onExpandedChange`, and the events appear when the prop changes. It also says how many events appeared when they are
 * shown: said when the value changes between two states that were both on screen, never on the first appearance
 * (`06` §9, live regions).
 */
export function useTimelineExpanded({ expanded: expandedProp, defaultExpanded, onExpandedChange, hidden, write, say }: TimelineExpandedOptions) {
  const controlled = expandedProp !== undefined;
  const wasControlled = useRef(controlled);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && wasControlled.current !== controlled) {
      console.warn(
        `Timeline: changed from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${controlled ? "controlled" : "uncontrolled"}. Decide between \`expanded\` and \`defaultExpanded\` for the timeline's life.`,
      );
    }
    wasControlled.current = controlled;
  }, [controlled]);

  const [inner, setInner] = useState(defaultExpanded);
  const expanded = controlled ? expandedProp : inner;

  // The button asks; the timeline changes only when it holds the state itself.
  const request = (next: boolean) => {
    if (!controlled) setInner(next);
    onExpandedChange?.(next);
  };

  const previous = useRef(expanded);
  useEffect(() => {
    const before = previous.current;
    previous.current = expanded;
    if (!before && expanded && hidden > 0) say(write(hidden));
  }, [expanded, hidden, say, write]);

  return { expanded, request };
}
