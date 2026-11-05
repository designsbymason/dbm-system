// The code shown under each story's "Show code" button on Stat's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`gridStyle`, `.map(…)`), which can't
// be pasted anywhere. Each snippet here is the smallest real usage of what its
// story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. An icon is written by name,
// with a comment saying where it comes from, since a snippet carries no
// imports. See `07-storybook-and-documentation-standards.md` §4.2.

import type { StatOrientation, StatSize, StatTone, StatVariant } from "./Stat.types";

const iconNote = "{/* UsersIcon comes from @dbm-system/icons */}";

const usersParts = `  <Stat.Icon icon={UsersIcon} />
  <Stat.Label>Active users</Stat.Label>
  <Stat.Value>
    12,480
    <Stat.Trend value={4.2} />
  </Stat.Value>
  <Stat.Description>vs. last month</Stat.Description>`;

const stat = (attributes: string, children: string) =>
  `<Stat${attributes ? ` ${attributes}` : ""}>\n${children}\n</Stat>`;

export const statSnippets = {
  variants: `${iconNote}
{/* variant: "ghost" (default) | "outlined" | "filled" */}
${stat('variant="outlined"', usersParts)}`,

  tones: `{/* tone colours Stat.Icon and Stat.Label together: "neutral" (default) | "brand" | "info" | "success" | "warning" | "danger" */}
${stat('tone="brand"', usersParts)}`,

  toneAcrossVariants: `{/* Each variant colours the icon and label the same way — only what sits behind them differs:
    ghost has no fill at all, outlined adds a tone-tinted border, and filled's own icon badge
    becomes a solid tone fill (read against with a matching icon.on-{tone} token) instead of the
    light one ghost/outlined use. TicketIcon comes from @dbm-system/icons */}
<Stat variant="filled" tone="danger" size="sm">
  <Stat.Icon icon={TicketIcon} />
  <Stat.Label>Open tickets</Stat.Label>
  <Stat.Value>58</Stat.Value>
</Stat>`,

  sizes: `${iconNote}
{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — padding, spacing, and the icon and text size */}
${stat('size="lg"', usersParts)}`,

  orientation: `${iconNote}
{/* orientation: "vertical" (default) stacks Stat.Icon above Stat.Label; "horizontal" pairs them
    into one row instead — the icon before the label, both the same size, found and moved
    together automatically wherever they appear. Everything else stays stacked below either way. */}
${stat('orientation="horizontal"', usersParts)}`,

  trendIncrease: `{/* A positive value is an increase — an upward icon, coloured text.success by default. */}
<Stat.Value>
  12,480
  <Stat.Trend value={4.2} />
</Stat.Value>`,

  trendDecrease: `{/* A negative value is a decrease — a downward icon, coloured text.danger by default. */}
<Stat.Value>
  1,204
  <Stat.Trend value={-2.1} />
</Stat.Value>`,

  trendFlat: `{/* Exactly 0 is flat — a dash icon, coloured text.secondary, regardless of goodDirection. */}
<Stat.Value>
  842
  <Stat.Trend value={0} />
</Stat.Value>`,

  trendGoodDirection: `{/* goodDirection="decrease": for a metric where less is better, a decrease is the improvement
    (coloured text.success) and an increase is the regression (text.danger) — the opposite of
    Trend's own default. */}
<Stat.Value>
  58
  <Stat.Trend value={-12} goodDirection="decrease" />
</Stat.Value>`,

  trendFormatNumber: `{/* formatNumber writes the plain signed number for display and for the accessible name
    (e.g. "Increased by 12.5%") — write your own sign, unit, or locale numerals. */}
<Stat.Value>
  12,480
  <Stat.Trend value={12.5} formatNumber={(n) => \`\${n}%\`} />
</Stat.Value>`,

  partsOptional: `{/* Every part is optional — a label and a value alone */}
<Stat size="sm">
  <Stat.Label>Open tickets</Stat.Label>
  <Stat.Value>58</Stat.Value>
</Stat>

${iconNote}
<Stat size="sm">
  <Stat.Icon icon={UsersIcon} />
  <Stat.Value>12,480</Stat.Value>
</Stat>`,

  fitValue: `{/* fitValue shrinks the value's font size, only as far as it takes, so it always fits inside the stat's border (and
    grows back as the stat gets wider). Without it a value keeps the full size of its size and overflows a narrow stat */}
<Stat variant="outlined" tone="brand" fitValue>
  <Stat.Label>Balance due</Stat.Label>
  <Stat.Value>$9,851.50</Stat.Value>
</Stat>`,

  announce: `{/* announce tells a screen reader when the value (and trend) change after this stat is
    already on the page — a live dashboard. The very first value shown is never announced. */}
<Stat announce>
  <Stat.Label>Active users</Stat.Label>
  <Stat.Value>
    {count}
    <Stat.Trend value={change} />
  </Stat.Value>
</Stat>`,

  inCard: `{/* A ghost stat draws no border of its own, so it doesn't double up inside a Card. */}
<Card>
  <Card.Body>
    ${usersParts.replace(/\n/g, "\n  ")}
  </Card.Body>
</Card>`,

  grid: `${iconNote}
{/* Several stats side by side, in a plain CSS grid (or the Grid molecule). */}
<div style={{ display: "grid", gap: "var(--dbm-space-4)", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
  <Stat variant="outlined" size="sm">
    <Stat.Label>Active users</Stat.Label>
    <Stat.Value>
      12,480
      <Stat.Trend value={4.2} />
    </Stat.Value>
  </Stat>
  <Stat variant="outlined" size="sm">
    <Stat.Label>Revenue</Stat.Label>
    <Stat.Value>
      $84.2K
      <Stat.Trend value={1.8} />
    </Stat.Value>
  </Stat>
  <Stat variant="outlined" size="sm">
    <Stat.Label>Open tickets</Stat.Label>
    <Stat.Value>
      58
      <Stat.Trend value={-12} goodDirection="decrease" />
    </Stat.Value>
  </Stat>
</div>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface StatPlaygroundSnippetArgs {
  variant?: StatVariant;
  tone?: StatTone;
  size?: StatSize;
  orientation?: StatOrientation;
  announce?: boolean;
  fitValue?: boolean;
  /** Storybook only — whether the demo shows a `Stat.Trend` inside `Stat.Value`. */
  trend?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around a small real stat (the trend only when the
 * demo-trend control is on).
 */
export function statPlaygroundSnippet(args: StatPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "ghost") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  if (args.announce) attributes.push("announce");
  if (args.fitValue) attributes.push("fitValue");

  const value = args.trend === false ? "    12,480" : "    12,480\n    <Stat.Trend value={4.2} />";
  const parts = `  <Stat.Icon icon={UsersIcon} />
  <Stat.Label>Active users</Stat.Label>
  <Stat.Value>
${value}
  </Stat.Value>
  <Stat.Description>vs. last month</Stat.Description>`;
  return `${iconNote}\n${stat(attributes.join(" "), parts)}`;
}
