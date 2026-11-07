// The code shown under each story's "Show code" button on ToggleGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`attached={true}`, `loop={true}`) and fills every handler with a no-op. Each snippet here is the smallest real
// usage of what its story shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const toggleGroupSnippets = {
  variants: `{/* variant: "subtle" | "outlined" (default) | "solid" */}
<ToggleGroup aria-label="View" variant="solid" defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<ToggleGroup aria-label="View" size="sm" defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>`,

  multiple: `{/* type="multiple": any number of items can be chosen, and each is its own on/off toggle */}
<ToggleGroup aria-label="Text style" type="multiple" defaultValue={["bold"]}>
  <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
  <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
  <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
</ToggleGroup>`,

  icons: `{/* Icons come from @dbm-system/icons: TextBIcon, TextItalicIcon, TextUnderlineIcon, TextAlignLeftIcon,
    TextAlignCenterIcon, TextAlignRightIcon. An icon-only item needs an aria-label. */}
<ToggleGroup aria-label="Text style" type="multiple" variant="solid" size="sm">
  <ToggleGroup.Item value="bold" icon={TextBIcon} aria-label="Bold" />
  <ToggleGroup.Item value="italic" icon={TextItalicIcon} aria-label="Italic" />
  <ToggleGroup.Item value="underline" icon={TextUnderlineIcon} aria-label="Underline" />
</ToggleGroup>

<ToggleGroup aria-label="Text alignment" defaultValue="left">
  <ToggleGroup.Item value="left" icon={TextAlignLeftIcon}>Left</ToggleGroup.Item>
  <ToggleGroup.Item value="center" icon={TextAlignCenterIcon}>Centre</ToggleGroup.Item>
  <ToggleGroup.Item value="right" icon={TextAlignRightIcon}>Right</ToggleGroup.Item>
</ToggleGroup>`,

  spaced: `{/* attached={false} keeps the items apart, with a gap, and lets a horizontal group wrap */}
<ToggleGroup aria-label="Filter" attached={false} type="multiple" defaultValue={["open"]}>
  <ToggleGroup.Item value="open">Open</ToggleGroup.Item>
  <ToggleGroup.Item value="closed">Closed</ToggleGroup.Item>
  <ToggleGroup.Item value="draft">Draft</ToggleGroup.Item>
</ToggleGroup>`,

  vertical: `{/* orientation="vertical": a column, and Up / Down move between the items */}
<ToggleGroup aria-label="View" orientation="vertical" defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>`,

  rounded: `{/* rounded: fully rounded ends, and the corners where items meet stay square */}
<ToggleGroup aria-label="View" rounded defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>`,

  fullWidth: `{/* fullWidth: the group fills its container and shares the width equally between its items */}
<ToggleGroup aria-label="View" fullWidth defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>`,

  responsive: `{/* A mobile-first map: stacked on a phone, in a row from the md breakpoint up */}
<ToggleGroup
  aria-label="View"
  orientation={{ base: "vertical", md: "horizontal" }}
  fullWidth
  defaultValue="week"
>
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>`,

  deselectable: `{/* A single group keeps one item chosen once it has one. deselectable lets a click on the chosen item clear it;
    onValueChange is then given "" for nothing chosen. */}
<ToggleGroup aria-label="Filter" deselectable defaultValue="open">
  <ToggleGroup.Item value="open">Open</ToggleGroup.Item>
  <ToggleGroup.Item value="closed">Closed</ToggleGroup.Item>
</ToggleGroup>`,

  controlled: `{/* You own the choice:
    const [view, setView] = useState("week");  (a multiple group holds a string[] instead)
    A single group's onValueChange is given "" when deselectable clears it. */}
<ToggleGroup aria-label="View" value={view} onValueChange={setView}>
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
  <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
</ToggleGroup>
<p>Showing: {view}</p>`,

  disabled: `{/* disabled disables every item; an item can also be disabled on its own, and leaves the arrow-key order */}
<ToggleGroup aria-label="View" disabled defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
</ToggleGroup>

<ToggleGroup aria-label="Plan" defaultValue="free">
  <ToggleGroup.Item value="free">Free</ToggleGroup.Item>
  <ToggleGroup.Item value="team" disabled>Team</ToggleGroup.Item>
  <ToggleGroup.Item value="pro">Pro</ToggleGroup.Item>
</ToggleGroup>`,

  wrapped: `{/* An item wrapped for a tooltip keeps its place in the group and its arrow-key order */}
<ToggleGroup aria-label="Text style" type="multiple" size="sm">
  <Tooltip content="Bold">
    <ToggleGroup.Item value="bold" icon={TextBIcon} aria-label="Bold" />
  </Tooltip>
  <Tooltip content="Italic">
    <ToggleGroup.Item value="italic" icon={TextItalicIcon} aria-label="Italic" />
  </Tooltip>
</ToggleGroup>`,

  rtl: `{/* dir="rtl" mirrors the group: the first item at the right, and the arrow keys the other way round.
    Left out, it follows the nearest DirectionProvider, else left-to-right; it is not read from the page. */}
<ToggleGroup aria-label="Text alignment" dir="rtl" defaultValue="left">
  <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
  <ToggleGroup.Item value="center">Centre</ToggleGroup.Item>
  <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
</ToggleGroup>`,

  labelled: `{/* A visible label names the group */}
<span id="view-label">View</span>
<ToggleGroup aria-labelledby="view-label" defaultValue="week">
  <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
  <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
</ToggleGroup>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ToggleGroupPlaygroundSnippetArgs {
  type?: "single" | "multiple";
  variant?: string;
  size?: string;
  rounded?: boolean;
  disabled?: boolean;
  attached?: boolean;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
  deselectable?: boolean;
  loop?: boolean;
  dir?: "ltr" | "rtl";
  /** Storybook only: how many items the demo group has. */
  count?: number;
  /** Storybook only: which item is chosen at first (`"none"` for nothing). */
  chosen?: string;
  "aria-label"?: string;
}

const items = [
  ["day", "Day"],
  ["week", "Week"],
  ["month", "Month"],
  ["quarter", "Quarter"],
  ["year", "Year"],
  ["all", "All"],
] as const;
const variants = ["subtle", "outlined", "solid"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around
 * as many items as the demo shows. A single group's starting choice is written as `defaultValue="week"`, a multiple
 * group's as `defaultValue={["week"]}`; nothing is written when nothing is chosen.
 */
export function toggleGroupPlaygroundSnippet(args: ToggleGroupPlaygroundSnippetArgs): string {
  const count = Math.min(Math.max(args.count ?? 3, 1), items.length);
  const shown = items.slice(0, count);
  const multiple = args.type === "multiple";
  const attributes: string[] = [`aria-label="${args["aria-label"] || "View"}"`];
  if (multiple) attributes.push('type="multiple"');
  if (args.variant && args.variant !== "outlined" && (variants as readonly string[]).includes(args.variant)) attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md" && (sizes as readonly string[]).includes(args.size)) attributes.push(`size="${args.size}"`);
  if (args.rounded === true) attributes.push("rounded");
  if (args.disabled) attributes.push("disabled");
  if (args.attached === false) attributes.push("attached={false}");
  if (args.orientation === "vertical") attributes.push('orientation="vertical"');
  if (args.fullWidth) attributes.push("fullWidth");
  if (args.deselectable && !multiple) attributes.push("deselectable");
  if (args.loop === false) attributes.push("loop={false}");
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  const chosen = shown.find(([value]) => value === args.chosen);
  if (chosen) attributes.push(multiple ? `defaultValue={["${chosen[0]}"]}` : `defaultValue="${chosen[0]}"`);
  const lines = shown.map(([value, label]) => `  <ToggleGroup.Item value="${value}">${label}</ToggleGroup.Item>`);
  return `<ToggleGroup ${attributes.join(" ")}>\n${lines.join("\n")}\n</ToggleGroup>`;
}
