// The code shown under each story's "Show code" button on Timeline's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TimelineConnector, TimelineSize, TimelineTimePlacement, TimelineTone, TimelineVariant } from "./Timeline.types";

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

  tones: `{/* tone: "neutral" (default) | "brand" | "info" | "success" | "warning" | "danger" | "highlight".
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
  connector?: TimelineConnector;
  timePlacement?: TimelineTimePlacement;
  /** A number, or `"All"` (no cap) in the Playground's own select. */
  maxVisible?: number | string;
  defaultExpanded?: boolean;
  "aria-label"?: string;
}

/** The Playground's snippet, built from its current controls: only the props that differ from their defaults. */
export function timelinePlaygroundSnippet(args: TimelinePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "filled") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.connector && args.connector !== "solid") attributes.push(`connector="${args.connector}"`);
  if (args.timePlacement && args.timePlacement !== "top") attributes.push(`timePlacement="${args.timePlacement}"`);
  const capped = typeof args.maxVisible === "number";
  if (capped) attributes.push(`maxVisible={${args.maxVisible}}`);
  if (capped && args.defaultExpanded) attributes.push("defaultExpanded");
  const label = args["aria-label"];
  const body = `<Timeline aria-label=${quote(label || "Order history")}${attributes.length ? ` ${attributes.join(" ")}` : ""}>\n${defaultItems}\n</Timeline>`;
  return body;
}
