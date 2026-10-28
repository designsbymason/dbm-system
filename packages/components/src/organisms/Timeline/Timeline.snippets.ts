// The code shown under each story's "Show code" button on Timeline's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TimelineAlign, TimelineConnector, TimelineHorizontalTimePlacement, TimelineOrientation, TimelineSize, TimelineTimePlacement, TimelineTone, TimelineVariant } from "./Timeline.types";

const item = (title: string, time: string, attributes = "") =>
  `  <Timeline.Item title="${title}" time="${time}"${attributes ? ` ${attributes}` : ""} />`;

const defaultItems = [item("Delivered", "Today, 11:02"), item("Shipped", "Yesterday"), item("Order placed", "12 Mar")].join("\n");

const timeline = (attributes = "", items = defaultItems) =>
  `<Timeline aria-label="Order history"${attributes ? ` ${attributes}` : ""}>\n${items}\n</Timeline>`;

export const timelineSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — markers, text and gaps */}
${timeline('size="lg"')}`,

  variants: `{/* variant: "filled" (default) — a solid dot or disc
    | "outlined" — a ring on the page */}
${timeline('variant="outlined"')}`,

  tones: `{/* tone: "brand" (default) | "neutral" | "info" | "success" | "warning" | "danger" | "highlight".
    A tone is only colour: say what it means with statusText. */}
<Timeline aria-label="Deployment">
  <Timeline.Item title="Rolled back" tone="danger" statusText="Failed" time="10:42" />
  <Timeline.Item title="Deployed" tone="success" statusText="Succeeded" time="10:31" />
  <Timeline.Item title="Build started" tone="info" time="10:24" />
</Timeline>`,

  markers: `{/* A dot by default; icon draws an icon in a disc; marker draws anything of your own */}
{/* TruckIcon and PackageIcon come from @dbm-system/icons */}
<Timeline aria-label="Order history">
  <Timeline.Item title="Out for delivery" icon={TruckIcon} time="Today" />
  <Timeline.Item title="Packed" icon={PackageIcon} time="Yesterday" />
  <Timeline.Item title="Order placed" marker={<Avatar name="Ada Lovelace" size="xs" />} time="12 Mar" />
  <Timeline.Item title="Cart saved" time="11 Mar" />
</Timeline>`,

  pending: `{/* pending: an event still under way — a spinner, "In progress" read after the title, a dashed line leaving it */}
<Timeline aria-label="Order history">
  <Timeline.Item title="Out for delivery" time="Today, 08:15" pending />
  <Timeline.Item title="Shipped" time="Yesterday" tone="success" statusText="Done" />
  <Timeline.Item title="Order placed" time="12 Mar" tone="success" statusText="Done" />
</Timeline>`,

  colorfulConnector: `{/* colorfulConnector: each line takes its event's tone (the tone's soft border), not the neutral grey */}
<Timeline aria-label="Deployment" colorfulConnector>
  <Timeline.Item title="Rolled back" tone="danger" statusText="Failed" time="10:42" />
  <Timeline.Item title="Deployed" tone="success" statusText="Succeeded" time="10:31" />
  <Timeline.Item title="Build started" tone="info" time="10:24" />
</Timeline>`,

  groups: `{/* Timeline.Group: a heading before a run of events. level (default 3) is the heading level it announces.
    A heading is drawn only while an event after it is. */}
<Timeline aria-label="Activity">
  <Timeline.Group>Today</Timeline.Group>
  <Timeline.Item title="Deployed" time="10:31" />
  <Timeline.Item title="Build started" time="10:24" />
  <Timeline.Group>Yesterday</Timeline.Group>
  <Timeline.Item title="Merged" time="17:02" />
</Timeline>`,

  end: `{/* Timeline.End: where it stopped. A bar across the line, and the words if there are any; it shows once every event does */}
<Timeline aria-label="Order history">
  <Timeline.Item title="Delivered" time="14 Mar" tone="success" statusText="Done" />
  <Timeline.Item title="Order placed" time="12 Mar" />
  <Timeline.End>Order closed</Timeline.End>
</Timeline>`,

  linked: `{/* href makes the title a link and onPress a button, stretched over the whole event; a link inside the body still works */}
<Timeline aria-label="Activity">
  <Timeline.Item title="Plan updated" time="Yesterday" href="/plans/q3" description="Open the plan" />
  <Timeline.Item title="Comment added" time="Monday" onPress={() => openThread("t-12")}>
    <Link href="/people/mina">Mina</Link>
  </Timeline.Item>
</Timeline>`,

  detail: `{/* detail: more about the event, behind a "Details" button (open / defaultOpen / onOpenChange control it) */}
<Timeline aria-label="Deployment">
  <Timeline.Item
    title="Deploy failed"
    tone="danger"
    statusText="Failed"
    time="10:42"
    detail="Step 3 of 5 exited with code 1: the database was not reachable."
  />
  <Timeline.Item title="Build passed" time="10:31" detail="42 tests, 0 failures." defaultOpen />
</Timeline>`,

  connectorOverride: `{/* connector on an item: the line leaving that event, "solid" | "dashed" | "none" — a gap in time, or the end of a thread */}
<Timeline aria-label="Account">
  <Timeline.Item title="Reopened" time="Today" />
  <Timeline.Item title="Closed" time="2 years ago" connector="dashed" />
  <Timeline.Item title="Opened" time="3 years ago" />
</Timeline>`,

  loadMore: `{/* onLoadMore: a "Load more" button after the last event, for a history you page yourself.
    loading draws placeholders and busies the button; hasMore={false} hides it once everything is in. */}
{/* const [events, setEvents] = useState(firstPage); const [loading, setLoading] = useState(false); */}
<Timeline aria-label="Activity" loading={loading} onLoadMore={loadNextPage} hasMore={hasMore}>
  {events.map((event) => (
    <Timeline.Item key={event.id} title={event.title} time={event.when} />
  ))}
</Timeline>`,

  loading: `{/* loading with no events yet: placeholder events stand in for the list (loadingCount, default 3) */}
<Timeline aria-label="Activity" loading loadingCount={4}>
  {[]}
</Timeline>`,

  empty: `{/* empty: what a timeline with no events shows (the words in labels.empty by default); false draws nothing */}
<Timeline aria-label="Activity" empty={<EmptyState><EmptyState.Title>Nothing has happened yet</EmptyState.Title></EmptyState>}>
  {[]}
</Timeline>`,

  announce: `{/* announce: says "N new events" in a live region when events are added to a timeline that is showing */}
<Timeline aria-label="Activity" announce>
  {events.map((event) => (
    <Timeline.Item key={event.id} title={event.title} time={event.when} />
  ))}
</Timeline>`,

  alternate: `{/* align="alternate": one event after the line, the next before it, from the md breakpoint up;
    on a narrower screen every event is on one side */}
${timeline('align="alternate"', [item("Delivered", "Today, 11:02"), item("Out for delivery", "Today, 08:15"), item("Shipped", "Yesterday"), item("Order placed", "12 Mar")].join("\n"))}`,

  horizontal: `{/* orientation="horizontal": events side by side; the row scrolls when they do not fit.
    A breakpoint map such as { base: "vertical", md: "horizontal" } changes it with the width. */}
${timeline('orientation="horizontal"')}`,

  horizontalAlternating: `{/* align="alternate" above and below the line, from md up; timePlacement "same" | "opposite": the time on the same
    side of the dot as the content, or the other */}
${timeline('orientation="horizontal" align="alternate" timePlacement="opposite"')}`,

  relativeTime: `{/* formatRelativeTime writes "2 hours ago" for a time you pass; dateTime keeps the machine-readable form */}
<Timeline aria-label="Activity">
  <Timeline.Item title="Deployed" time={formatRelativeTime(deployedAt)} dateTime={deployedAt.toISOString()} />
  <Timeline.Item title="Merged" time={formatRelativeTime(mergedAt, { locale: "fr" })} dateTime={mergedAt.toISOString()} />
</Timeline>`,

  timeSide: `{/* timePlacement: "top" (default) — above the title | "side" — a column beside the marker, from the sm breakpoint up */}
${timeline('timePlacement="side"')}`,

  connectors: `{/* connector: "solid" (default) | "dashed" | "none" */}
${timeline('connector="dashed"')}`,

  body: `{/* description is a line under the title; children is anything further (a link, a code block, a button) */}
<Timeline aria-label="Activity">
  <Timeline.Item title="Mina commented" time="2 hours ago" description="On the Q3 plan">
    <Blockquote>Can we move the review to Friday?</Blockquote>
  </Timeline.Item>
  <Timeline.Item title="Plan updated" time="Yesterday" dateTime="2026-03-13">
    <Link href="/plans/q3">Open the plan</Link>
  </Timeline.Item>
</Timeline>`,

  longHistory: `{/* maxVisible: show only the first events, then a button for the rest.
    Events are not windowed: page a very long history yourself. */}
<Timeline aria-label="Order history" maxVisible={3}>
  <Timeline.Item title="Delivered" time="Today" />
  <Timeline.Item title="Out for delivery" time="Today" />
  <Timeline.Item title="Shipped" time="Yesterday" />
  <Timeline.Item title="Packed" time="Yesterday" />
  <Timeline.Item title="Order placed" time="12 Mar" />
</Timeline>`,

  controlled: `{/* const [expanded, setExpanded] = useState(false); */}
<Timeline aria-label="Order history" maxVisible={3} expanded={expanded} onExpandedChange={setExpanded}>
  <Timeline.Item title="Delivered" time="Today" />
  <Timeline.Item title="Out for delivery" time="Today" />
  <Timeline.Item title="Shipped" time="Yesterday" />
  <Timeline.Item title="Packed" time="Yesterday" />
</Timeline>`,

  translated: `{/* labels: the "show more" button's words, in your language; formatNumber writes its digits */}
<Timeline
  aria-label="Historique"
  maxVisible={2}
  labels={{
    showMore: (hidden) => \`Afficher \${hidden} événements de plus\`,
    showLess: "Afficher moins",
    revealed: (count) => \`\${count} événements affichés\`,
  }}
>
  <Timeline.Item title="Livré" time="Aujourd'hui" />
  <Timeline.Item title="Expédié" time="Hier" />
  <Timeline.Item title="Commandé" time="12 mars" />
</Timeline>`,

  rightToLeft: `{/* dir="rtl" puts the marker and the line on the right */}
${timeline('dir="rtl"')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TimelinePlaygroundSnippetArgs {
  size?: TimelineSize;
  variant?: TimelineVariant;
  tone?: TimelineTone;
  orientation?: TimelineOrientation;
  align?: TimelineAlign;
  connector?: TimelineConnector;
  colorfulConnector?: boolean;
  timePlacement?: TimelineTimePlacement;
  /** The Playground's control for a horizontal timeline's two values. */
  horizontalTimePlacement?: TimelineHorizontalTimePlacement;
  /** A number, or `"All"` (no cap) in the Playground's own select. */
  maxVisible?: number | string;
  defaultExpanded?: boolean;
  "aria-label"?: string;
}

/** The Playground's snippet, built from its current controls: only the props that differ from their defaults. */
export function timelinePlaygroundSnippet(args: TimelinePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  if (args.align === "alternate") attributes.push('align="alternate"');
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "filled") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.connector && args.connector !== "solid") attributes.push(`connector="${args.connector}"`);
  if (args.colorfulConnector) attributes.push("colorfulConnector");
  // One prop with two sets of values: the orientation decides which control counts.
  if (args.orientation === "horizontal") {
    if (args.horizontalTimePlacement === "opposite") attributes.push('timePlacement="opposite"');
  } else if (args.timePlacement === "side") {
    attributes.push('timePlacement="side"');
  }
  const capped = typeof args.maxVisible === "number";
  if (capped) attributes.push(`maxVisible={${args.maxVisible}}`);
  if (capped && args.defaultExpanded) attributes.push("defaultExpanded");
  const label = args["aria-label"];
  const body = `<Timeline aria-label=${quote(label || "Order history")}${attributes.length ? ` ${attributes.join(" ")}` : ""}>\n${defaultItems}\n</Timeline>`;
  return body;
}
