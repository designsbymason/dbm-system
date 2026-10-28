import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { PackageIcon, TruckIcon } from "@dbm-system/icons";
import { useState } from "react";
import { formatRelativeTime } from "@dbm-system/utils";
import type { CSSProperties } from "react";
import { Avatar } from "../../atoms/Avatar";
import { Blockquote } from "../../atoms/Blockquote";
import { Link } from "../../atoms/Link";
import { EmptyState } from "../../molecules/EmptyState";
import { Timeline } from "./Timeline";
import { allSizes, Demo, demoEvents, IconDemo } from "./TimelineStoryKit";
import { timelinePlaygroundSnippet, timelineSnippets } from "./Timeline.snippets";
import type { TimelineAlign, TimelineConnector, TimelineOrientation, TimelineProps, TimelineSize, TimelineTimePlacement, TimelineTone, TimelineVariant } from "./Timeline.types";

// `Timeline.Item` gets its own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where its argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  size: TimelineSize;
  variant: TimelineVariant;
  tone: TimelineTone;
  orientation: TimelineOrientation;
  align: TimelineAlign;
  connector: TimelineConnector;
  colorfulConnector: boolean;
  timePlacement: TimelineTimePlacement;
  maxVisible: number | "All";
  defaultExpanded: boolean;
  "aria-label": string;
  loading: boolean;
  loadingCount: number;
  onLoadMore: TimelineProps["onLoadMore"];
  hasMore: boolean;
  empty: TimelineProps["empty"];
  announce: boolean;
  expanded: boolean;
  onExpandedChange: TimelineProps["onExpandedChange"];
  formatNumber: TimelineProps["formatNumber"];
  labels: TimelineProps["labels"];
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  children: TimelineProps["children"];
}

const allTones: TimelineTone[] = ["neutral", "brand", "info", "success", "warning", "danger", "highlight"];

// A fixed-render story ignores its own args, so every control it can't honour is
// turned off (07-storybook-and-documentation-standards.md §5).
const off = { control: false } as const;
const noControls = {
  size: off,
  variant: off,
  tone: off,
  orientation: off,
  align: off,
  connector: off,
  colorfulConnector: off,
  timePlacement: off,
  maxVisible: off,
  defaultExpanded: off,
  "aria-label": off,
} as const;
/** The same, except the one axis a story does draw from its own args. */
const except = (...keys: Array<keyof typeof noControls>) =>
  Object.fromEntries(Object.entries(noControls).filter(([key]) => !keys.includes(key as keyof typeof noControls)));

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Data Display/Timeline",
  parameters: { layout: "padded" },
  argTypes: {
    children: { control: false, description: "The events, in the order to read them: one Timeline.Item each." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the markers, text and gaps.",
      table: { defaultValue: { summary: "md" } },
    },
    variant: {
      control: "select",
      options: ["filled", "outlined"],
      description: "The look of the markers: a solid dot or disc, or a ring on the page.",
      table: { defaultValue: { summary: "filled" } },
    },
    tone: {
      control: "select",
      options: allTones,
      description: "The colour of the markers, for every event that does not set its own tone.",
      table: { defaultValue: { summary: "brand" } },
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Which way the events run. Takes a breakpoint map. A horizontal timeline scrolls sideways when its events do not fit, and ignores align and timePlacement.",
      table: { defaultValue: { summary: "vertical" } },
    },
    align: {
      control: "select",
      options: ["start", "alternate"],
      description: "Where a vertical timeline puts its content relative to the line: all on one side, or alternating from the md breakpoint up (below it, every event is on one side).",
      table: { defaultValue: { summary: "start" } },
    },
    loading: {
      control: false,
      description: "Shows that events are being fetched: placeholder events at the end, aria-busy on the list and a busy load-more button.",
      table: { defaultValue: { summary: "false" } },
    },
    loadingCount: { control: false, description: "How many placeholder events loading draws.", table: { defaultValue: { summary: "3" } } },
    onLoadMore: { control: false, description: "Called when the person presses the load-more button, drawn after the last event whenever this is set and hasMore is not false." },
    hasMore: { control: false, description: "Whether there are more events to load. Hides the load-more button when false.", table: { defaultValue: { summary: "true" } } },
    empty: { control: false, description: "What to draw when there are no events and it is not loading, in place of the words in labels.empty. false draws nothing." },
    announce: {
      control: false,
      description: "Says how many new events there are in a polite live region when events are added to a timeline that is showing, never on its first render.",
      table: { defaultValue: { summary: "false" } },
    },
    connector: {
      control: "select",
      options: ["solid", "dashed", "none"],
      description: "The line between events. The line leaving a pending event is always dashed.",
      table: { defaultValue: { summary: "solid" } },
    },
    colorfulConnector: {
      control: "boolean",
      description: "Draws the line leaving each event in its tone's soft colour (the tone's subtle border), instead of the neutral grey every line has by default.",
      table: { defaultValue: { summary: "false" } },
    },
    timePlacement: {
      control: "select",
      options: ["top", "side"],
      description: "Where each event's time goes: above its title, or in a column beside the marker from the sm breakpoint up. Takes a breakpoint map.",
      table: { defaultValue: { summary: "top" } },
    },
    maxVisible: {
      control: "number",
      description:
        "Shows only this many events, then a button that shows the rest. Leave it out to show them all. There is no windowing: events have different heights, so page a very long history yourself.",
    },
    expanded: {
      control: false,
      description: "Whether the events past maxVisible are shown. Makes it controlled: the button asks through onExpandedChange and the events appear when this changes.",
    },
    defaultExpanded: {
      control: "boolean",
      description: "Whether the events past maxVisible are shown at first, when expanded is not set.",
      table: { defaultValue: { summary: "false" } },
    },
    onExpandedChange: { control: false, description: "Called with the value the person asked for when they press the button that shows or hides the events past maxVisible." },
    formatNumber: { control: false, description: "Writes a digit for a number the component shows or says. Callbacks keep plain numbers.", table: { defaultValue: { summary: "String" } } },
    labels: { control: false, description: "Text the component writes itself, such as the show-more button. Any entry left out keeps its English default." },
    "aria-label": { control: "text", description: "Accessible name for the list, for a page with more than one." },
    "aria-labelledby": { control: false, description: "Id of an element that names the list (a heading above it)." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
    variant: "filled",
    tone: "brand",
    orientation: "vertical",
    align: "start",
    connector: "solid",
    colorfulConnector: false,
    timePlacement: "top",
    maxVisible: "All",
    defaultExpanded: false,
    "aria-label": "Order history",
  },
  render: (args) => (
    <Timeline
      // Keyed by the cap, so changing it restarts the (uncontrolled) timeline.
      key={`${args.maxVisible}-${args.defaultExpanded}`}
      aria-label={args["aria-label"]}
      size={args.size}
      variant={args.variant}
      tone={args.tone}
      orientation={args.orientation}
      align={args.align}
      connector={args.connector}
      colorfulConnector={args.colorfulConnector}
      timePlacement={args.timePlacement}
      maxVisible={typeof args.maxVisible === "number" ? args.maxVisible : undefined}
      defaultExpanded={typeof args.maxVisible === "number" ? args.defaultExpanded : undefined}
    >
      {demoEvents.map(([title, time, dateTime], index) => (
        <Timeline.Item key={title} title={title} time={time} dateTime={dateTime} description={index === 0 ? "Left with the neighbour at number 14" : undefined} />
      ))}
    </Timeline>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  argTypes: {
    maxVisible: { control: "select", options: ["All", 2, 3, 4], description: "Shows only this many events, then a button that shows the rest. Leave it out to show them all." },
  },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => timelinePlaygroundSnippet(context.args),
      },
    },
  },
};

/** The five size steps. */
export const Sizes: Story = {
  name: "All sizes",
  argTypes: { ...except("tone", "variant") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} tone={args.tone} variant={args.variant} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: timelineSnippets.sizes } } },
};

export const Variants: Story = {
  argTypes: { ...except("tone") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      <IconDemo variant="filled" tone={args.tone} aria-label="Filled" />
      <IconDemo variant="outlined" tone={args.tone} aria-label="Outlined" />
    </div>
  ),
  args: { tone: "brand" },
  parameters: { docs: { source: { code: timelineSnippets.variants } } },
};

export const Tones: Story = {
  argTypes: { ...except("variant") },
  render: (args) => (
    <Timeline aria-label="Deployment" variant={args.variant}>
      {allTones.map((tone) => (
        <Timeline.Item key={tone} title={`${tone[0]!.toUpperCase()}${tone.slice(1)} event`} tone={tone} statusText={tone} time="10:31" />
      ))}
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.tones } } },
};

export const Markers: Story = {
  name: "Dot, icon and your own marker",
  argTypes: { ...except("size", "variant") },
  render: (args) => (
    <Timeline aria-label="Order history" size={args.size} variant={args.variant}>
      <Timeline.Item title="Out for delivery" time="Today" icon={TruckIcon} />
      <Timeline.Item title="Packed" time="Yesterday" icon={PackageIcon} />
      <Timeline.Item title="Order placed" time="12 Mar" marker={<Avatar name="Ada Lovelace" size="xs" />} />
      <Timeline.Item title="Cart saved" time="11 Mar" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.markers } } },
};

export const Pending: Story = {
  name: "A pending event",
  argTypes: { ...except("size") },
  render: (args) => (
    <Timeline aria-label="Order history" size={args.size}>
      <Timeline.Item title="Out for delivery" time="Today, 08:15" pending />
      <Timeline.Item title="Shipped" time="Yesterday" tone="success" statusText="Done" />
      <Timeline.Item title="Order placed" time="12 Mar" tone="success" statusText="Done" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.pending } } },
};

export const TimeBeside: Story = {
  name: "The time in a side column",
  argTypes: { ...except("size", "timePlacement") },
  render: (args) => <Demo size={args.size} timePlacement="side" count={4} descriptions />,
  parameters: {
    docs: { source: { code: timelineSnippets.timeSide } },
  },
};

export const Connectors: Story = {
  name: "Solid, dashed and no line",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      <Demo connector="solid" aria-label="Solid" />
      <Demo connector="dashed" aria-label="Dashed" />
      <Demo connector="none" aria-label="No line" />
    </div>
  ),
  parameters: { docs: { source: { code: timelineSnippets.connectors } } },
};

export const ColorfulConnectors: Story = {
  name: "Connectors in the tone's colour",
  argTypes: { ...except("size", "variant") },
  render: (args) => (
    <Timeline aria-label="Deployment" size={args.size} variant={args.variant} colorfulConnector>
      <Timeline.Item title="Rolled back" tone="danger" statusText="Failed" time="10:42" />
      <Timeline.Item title="Deployed" tone="success" statusText="Succeeded" time="10:31" />
      <Timeline.Item title="Build started" tone="info" time="10:24" />
      <Timeline.Item title="Queued" tone="warning" time="10:20" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.colorfulConnector } } },
};

export const Groups: Story = {
  name: "Headings for runs of events",
  argTypes: { ...except("size") },
  render: (args) => (
    <Timeline aria-label="Activity" size={args.size}>
      <Timeline.Group>Today</Timeline.Group>
      <Timeline.Item title="Deployed" time="10:31" tone="success" statusText="Done" />
      <Timeline.Item title="Build started" time="10:24" />
      <Timeline.Group>Yesterday</Timeline.Group>
      <Timeline.Item title="Merged" time="17:02" />
      <Timeline.Item title="Review requested" time="15:48" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.groups } } },
};

export const EndCap: Story = {
  name: "An end",
  argTypes: { ...except("size") },
  render: (args) => (
    <Timeline aria-label="Order history" size={args.size}>
      <Timeline.Item title="Delivered" time="14 Mar" tone="success" statusText="Done" />
      <Timeline.Item title="Order placed" time="12 Mar" />
      <Timeline.End>Order closed</Timeline.End>
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.end } } },
};

export const Linked: Story = {
  name: "Events that are links and buttons",
  argTypes: { ...noControls },
  render: () => (
    <Timeline aria-label="Activity">
      <Timeline.Item title="Plan updated" time="Yesterday" href="/plans/q3" description="Open the plan" />
      <Timeline.Item title="Comment added" time="Monday" onPress={() => {}}>
        <Link href="/people/mina">Mina</Link>
      </Timeline.Item>
      <Timeline.Item title="Created" time="Last week" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.linked } } },
};

export const WithDetail: Story = {
  name: "Detail behind a button",
  argTypes: { ...except("size") },
  render: (args) => (
    <Timeline aria-label="Deployment" size={args.size}>
      <Timeline.Item
        title="Deploy failed"
        tone="danger"
        statusText="Failed"
        time="10:42"
        detail="Step 3 of 5 exited with code 1: the database was not reachable."
      />
      <Timeline.Item title="Build passed" time="10:31" detail="42 tests, 0 failures." defaultOpen />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.detail } } },
};

export const ConnectorOverride: Story = {
  name: "A line of its own",
  argTypes: { ...noControls },
  render: () => (
    <Timeline aria-label="Account">
      <Timeline.Item title="Reopened" time="Today" />
      <Timeline.Item title="Closed" time="2 years ago" connector="dashed" />
      <Timeline.Item title="Opened" time="3 years ago" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.connectorOverride } } },
};

export const AlternateLayout: Story = {
  name: "Alternating sides",
  argTypes: { ...except("size", "timePlacement") },
  render: (args) => <Demo align="alternate" size={args.size} timePlacement={args.timePlacement} count={5} descriptions />,
  parameters: {
    docs: {
      description: { story: "From the md breakpoint (768px) up. On a narrower screen every event is on one side." },
      source: { code: timelineSnippets.alternate },
    },
  },
};

export const HorizontalLayout: Story = {
  name: "Horizontal",
  argTypes: { ...except("size", "variant") },
  render: (args) => <Demo orientation="horizontal" size={args.size} variant={args.variant} count={5} descriptions />,
  parameters: { docs: { source: { code: timelineSnippets.horizontal } } },
};

export const LoadingMore: Story = {
  name: "Load more",
  argTypes: { ...noControls },
  render: function Render() {
    const [count, setCount] = useState(2);
    const [loading, setLoading] = useState(false);
    return (
      <Timeline
        aria-label="Order history"
        loading={loading}
        hasMore={count < demoEvents.length}
        onLoadMore={() => {
          setLoading(true);
          setTimeout(() => {
            setCount((n) => Math.min(demoEvents.length, n + 2));
            setLoading(false);
          }, 900);
        }}
        announce
      >
        {demoEvents.slice(0, count).map(([title, time, dateTime]) => (
          <Timeline.Item key={title} title={title} time={time} dateTime={dateTime} />
        ))}
      </Timeline>
    );
  },
  parameters: { docs: { source: { code: timelineSnippets.loadMore } } },
};

export const LoadingState: Story = {
  name: "Loading",
  argTypes: { ...noControls },
  render: () => (
    <Timeline aria-label="Activity" loading loadingCount={4}>
      {[]}
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.loading } } },
};

export const EmptyTimeline: Story = {
  name: "Empty",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Timeline aria-label="Activity">{[]}</Timeline>
      <Timeline
        aria-label="Activity with a message"
        empty={
          <EmptyState size="sm">
            <EmptyState.Title>Nothing has happened yet</EmptyState.Title>
          </EmptyState>
        }
      >
        {[]}
      </Timeline>
    </div>
  ),
  parameters: { docs: { source: { code: timelineSnippets.empty } } },
};

export const RelativeTimes: Story = {
  name: "Relative times",
  argTypes: { ...noControls },
  render: () => {
    const now = Date.now();
    const ago = (hours: number) => new Date(now - hours * 3_600_000);
    return (
      <Timeline aria-label="Activity">
        <Timeline.Item title="Deployed" time={formatRelativeTime(ago(2))} dateTime={ago(2).toISOString()} />
        <Timeline.Item title="Merged" time={formatRelativeTime(ago(30), { locale: "fr" })} dateTime={ago(30).toISOString()} />
        <Timeline.Item title="Opened" time={formatRelativeTime(ago(24 * 9))} dateTime={ago(24 * 9).toISOString()} />
      </Timeline>
    );
  },
  parameters: { docs: { source: { code: timelineSnippets.relativeTime } } },
};

export const WithBody: Story = {
  name: "With a description and a body",
  argTypes: { ...except("size") },
  render: (args) => (
    <Timeline aria-label="Activity" size={args.size}>
      <Timeline.Item title="Mina commented" time="2 hours ago" description="On the Q3 plan">
        <Blockquote>Can we move the review to Friday?</Blockquote>
      </Timeline.Item>
      <Timeline.Item title="Plan updated" time="Yesterday" dateTime="2026-03-13">
        <Link href="/plans/q3">Open the plan</Link>
      </Timeline.Item>
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.body } } },
};

export const LongHistory: Story = {
  name: "A long history, collapsed",
  argTypes: { ...noControls },
  render: () => <Demo maxVisible={3} count={5} />,
  parameters: { docs: { source: { code: timelineSnippets.longHistory } } },
};

export const Controlled: Story = {
  name: "Controlled",
  argTypes: { ...noControls },
  render: function Render() {
    const [expanded, setExpanded] = useState(false);
    return <Demo maxVisible={3} count={5} expanded={expanded} onExpandedChange={setExpanded} />;
  },
  parameters: { docs: { source: { code: timelineSnippets.controlled } } },
};

export const Translated: Story = {
  name: "Translated text",
  argTypes: { ...noControls },
  render: () => (
    <Timeline
      aria-label="Historique"
      maxVisible={2}
      labels={{
        showMore: (hidden) => `Afficher ${hidden} événements de plus`,
        showLess: "Afficher moins",
        revealed: (count) => `${count} événements affichés`,
      }}
    >
      <Timeline.Item title="Livré" time="Aujourd'hui" />
      <Timeline.Item title="Expédié" time="Hier" />
      <Timeline.Item title="Commandé" time="12 mars" />
    </Timeline>
  ),
  parameters: { docs: { source: { code: timelineSnippets.translated } } },
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: { ...noControls },
  render: () => <Demo dir="rtl" timePlacement="side" />,
  parameters: { docs: { source: { code: timelineSnippets.rightToLeft } } },
};
