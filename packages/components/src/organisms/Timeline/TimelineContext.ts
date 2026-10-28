import { createContext, useContext } from "react";
import type { TimelineConnector, TimelineSize, TimelineTimePlacement, TimelineTone, TimelineVariant } from "./Timeline.types";

/** What the root hands every event. */
export interface TimelineContextValue {
  size: TimelineSize;
  variant: TimelineVariant;
  tone: TimelineTone;
  connector: TimelineConnector;
  timePlacement: TimelineTimePlacement;
  labels: { pending: string };
}

export const TimelineContext = createContext<TimelineContextValue | null>(null);

export const useTimelineContext = (): TimelineContextValue => {
  const context = useContext(TimelineContext);
  if (!context) throw new Error("Timeline.Item must be used inside a Timeline.");
  return context;
};
