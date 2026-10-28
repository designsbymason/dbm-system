import { PackageIcon, TruckIcon } from "@dbm-system/icons";
import type { ReactNode } from "react";
import { Timeline } from "./Timeline";
import type { TimelineProps, TimelineSize } from "./Timeline.types";

// What the stories file and the real-browser checks file share. A module that is not a stories file, so the runner loads
// each stories file on its own and this is drawn by both (`07-storybook-and-documentation-standards.md` §4.2).

export const allSizes: readonly TimelineSize[] = ["xs", "sm", "md", "lg", "xl"];

/** The events every demo draws, newest first. */
export const demoEvents = [
  ["Delivered", "Today, 11:02", "2026-03-14T11:02"],
  ["Out for delivery", "Today, 08:15", "2026-03-14T08:15"],
  ["Shipped", "Yesterday, 17:40", "2026-03-13T17:40"],
  ["Packed", "Yesterday, 09:05", "2026-03-13T09:05"],
  ["Order placed", "12 Mar, 14:22", "2026-03-12T14:22"],
] as const;

export type DemoProps = Omit<TimelineProps, "children"> & {
  /** How many events to draw. */
  count?: number;
  /** Draws a description under the first events. */
  descriptions?: boolean;
  /** Replaces the events. */
  children?: ReactNode;
};

/** A small, real timeline the gallery stories and the checks vary. */
export const Demo = ({ count = 3, descriptions = false, children, ...props }: DemoProps) => (
  <Timeline aria-label="Order history" {...props}>
    {children ??
      demoEvents.slice(0, count).map(([title, time, dateTime], index) => (
        <Timeline.Item
          key={title}
          title={title}
          time={time}
          dateTime={dateTime}
          description={descriptions && index < 2 ? "Left with the neighbour at number 14" : undefined}
        />
      ))}
  </Timeline>
);

/** The same events with an icon each, the first still under way. */
export const IconDemo = (props: Omit<DemoProps, "children">) => (
  <Demo {...props} count={3}>
    <Timeline.Item title="Out for delivery" time="Today, 08:15" icon={TruckIcon} pending />
    <Timeline.Item title="Packed" time="Yesterday, 09:05" icon={PackageIcon} tone="success" statusText="Done" />
    <Timeline.Item title="Order placed" time="12 Mar, 14:22" tone="success" statusText="Done" />
  </Demo>
);
