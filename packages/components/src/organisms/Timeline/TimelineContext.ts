import { createContext, useContext } from "react";
import type { TimelineConnector, TimelineLabels, TimelineSize, TimelineTimePlacement, TimelineTone, TimelineVariant } from "./Timeline.types";

/** What the root hands every entry. */
export interface TimelineContextValue {
  size: TimelineSize;
  variant: TimelineVariant;
  tone: TimelineTone;
  connector: TimelineConnector;
  timePlacement: TimelineTimePlacement;
  labels: Pick<TimelineLabels, "pending" | "details">;
}

export const TimelineContext = createContext<TimelineContextValue | null>(null);

export const useTimelineContext = (): TimelineContextValue => {
  const context = useContext(TimelineContext);
  if (!context) throw new Error("Timeline.Item must be used inside a Timeline.");
  return context;
};

/**
 * What the root works out about one event or end and hands to it: the side of the line its content is on in an `alternate`
 * timeline (`"end"` after the line, the first side, `"start"` before it), counting events and the end but not group headings.
 */
export interface TimelinePosition {
  side: "start" | "end";
}

export const TimelinePositionContext = createContext<TimelinePosition>({ side: "end" });
