import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { PackageIcon, TruckIcon } from "@dbm-system/icons";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Avatar } from "../../atoms/Avatar";
import { Blockquote } from "../../atoms/Blockquote";
import { Link } from "../../atoms/Link";
import { Timeline } from "./Timeline";
import { allSizes, Demo, demoEvents, IconDemo } from "./TimelineStoryKit";
import { timelinePlaygroundSnippet, timelineSnippets } from "./Timeline.snippets";
import type { TimelineConnector, TimelineProps, TimelineSize, TimelineTimePlacement, TimelineTone, TimelineVariant } from "./Timeline.types";

// `Timeline.Item` gets its own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where its argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  size: TimelineSize;
  variant: TimelineVariant;
  tone: TimelineTone;
  connector: TimelineConnector;
  timePlacement: TimelineTimePlacement;
  maxVisible: number | "All";
  defaultExpanded: boolean;
  "aria-label": string;
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
  connector: off,
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
      table: { defaultValue: { summary: "neutral" } },
    },
    connector: {
      control: "select",
      options: ["solid", "dashed", "none"],
      description: "The line between events. The line leaving a pending event is always dashed.",
      table: { defaultValue: { summary: "solid" } },
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
    tone: "neutral",
    connector: "solid",
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
      connector={args.connector}
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
