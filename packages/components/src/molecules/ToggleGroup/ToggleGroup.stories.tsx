import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Text } from "../../atoms/Text";
import { Tooltip } from "../../atoms/Tooltip";
import { ToggleGroup } from "./ToggleGroup";
import { toggleGroupPlaygroundSnippet, toggleGroupSnippets } from "./ToggleGroup.snippets";
import type { ToggleGroupSize, ToggleGroupVariant } from "./ToggleGroup.types";

// The Playground's own args: every `ToggleGroup` prop, plus two Storybook-only ones. A group's value has a different
// shape for `single` (a string) and `multiple` (an array), which one control can't edit, so the demo takes a count of
// items and which of them starts chosen.
interface PlaygroundArgs {
  type: "single" | "multiple";
  variant: ToggleGroupVariant;
  size: ToggleGroupSize;
  rounded: boolean;
  attached: boolean;
  orientation: "horizontal" | "vertical";
  fullWidth: boolean;
  disabled: boolean;
  loop: boolean;
  rovingFocus: boolean;
  dir: "ltr" | "rtl";
  deselectable: boolean;
  /** Storybook only — how many items the demo group holds. */
  count: number;
  /** Storybook only — which item starts chosen ("none" for nothing). */
  chosen: string;
  "aria-label": string;
  // Documented props with no live control of their own.
  children?: never;
  value?: never;
  defaultValue?: never;
  onValueChange?: never;
  "aria-labelledby"?: never;
  "aria-describedby"?: never;
  id?: never;
  className?: never;
  style?: never;
  "data-testid"?: never;
}

const noControls = { control: false } as const;
const demoItems = [
  ["day", "Day"],
  ["week", "Week"],
  ["month", "Month"],
  ["quarter", "Quarter"],
  ["year", "Year"],
  ["all", "All"],
] as const;

/** The group the Playground and most stories show: `count` items, with `chosen` chosen at first. */
function Demo({ count, chosen, type, deselectable, ...rest }: Omit<PlaygroundArgs, "aria-label"> & { "aria-label"?: string }) {
  const shown = demoItems.slice(0, count);
  const start = shown.some(([value]) => value === chosen) ? chosen : undefined;
  // Remount when what the demo starts from changes, since an uncontrolled group ignores a changed `defaultValue`.
  const key = `${type}-${chosen}-${count}`;
  const items = shown.map(([value, label]) => (
    <ToggleGroup.Item key={value} value={value}>
      {label}
    </ToggleGroup.Item>
  ));
  const common = { ...rest, "aria-label": rest["aria-label"] ?? "View" };
  return type === "multiple" ? (
    <ToggleGroup key={key} {...common} type="multiple" defaultValue={start ? [start] : undefined}>
      {items}
    </ToggleGroup>
  ) : (
    <ToggleGroup key={key} {...common} deselectable={deselectable} defaultValue={start}>
      {items}
    </ToggleGroup>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Inputs/ToggleGroup",
  // The props are a single/multiple union, which the Playground's flat args can't satisfy directly.
  component: ToggleGroup as unknown as ComponentType<PlaygroundArgs>,
  parameters: { layout: "padded" },
  // Core visual props first, then behavioral/state props, then advanced/escape-hatch props last — the same sequencing
  // as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      ...noControls,
      description: "The ToggleGroup.Items, one per choice.",
    },
    type: {
      control: "select",
      options: ["single", "multiple"],
      description:
        "single: at most one item is chosen, as in a segmented control. multiple: any number are, each its own on/off toggle. A single group is a radiogroup of radio items; a multiple group is a toolbar of toggle buttons.",
      table: { defaultValue: { summary: "single" } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description:
        "How the chosen item is marked: outlined gives every item a border, brand-coloured on the chosen one, so nothing moves when the choice does; subtle has no borders and tints the chosen item; solid keeps the borders and fills the chosen item with the brand colour.",
      table: { defaultValue: { summary: "outlined" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Item height, padding and type size, on the shared 5-step scale.",
      table: { defaultValue: { summary: "md" } },
    },
    rounded: {
      control: "boolean",
      description:
        "Fully rounded ends, a pill: the outer corners of the first and last item are circular, and, attached, the corners where items meet stay square.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      ...noControls,
      description: "The controlled choice: a string for a single group (\"\" for none), an array of strings for a multiple one. Pair it with onValueChange.",
    },
    defaultValue: {
      ...noControls,
      description: "What is chosen at first when uncontrolled: a string for a single group, an array for a multiple one. Left out, nothing is chosen.",
    },
    onValueChange: {
      ...noControls,
      description:
        "Called with the new choice: the chosen item's value for a single group (\"\" when deselectable clears it), every chosen value for a multiple one.",
    },
    deselectable: {
      control: "boolean",
      description:
        "Whether clicking the chosen item clears it, so a single group can have nothing chosen. Off, a single group keeps one item chosen once it has one. Only for type=single; a multiple group can always be cleared.",
      table: { defaultValue: { summary: "false" } },
    },
    attached: {
      control: "boolean",
      description:
        "Fuses the items into one segmented control: square corners where they meet, no gap. false keeps them apart, spaced by a gap, and lets a horizontal group wrap onto more lines.",
      table: { defaultValue: { summary: "true" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Lays the items out in a row or a column, which is also which arrow-key pair moves between them. Also takes a mobile-first map keyed by breakpoint ({ base: \"vertical\", md: \"horizontal\" }).",
      table: { defaultValue: { summary: "horizontal" } },
    },
    fullWidth: {
      control: "boolean",
      description: "Stretches the group to the width of its container. A horizontal group shares that width equally between its items.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every item. An item that is disabled itself stays disabled either way.",
      table: { defaultValue: { summary: "false" } },
    },
    loop: {
      control: "boolean",
      description: "Whether the arrow keys wrap from the last item to the first, and back.",
      table: { defaultValue: { summary: "true" } },
    },
    // Not live-editable: turning it off removes the group's own keyboard movement, which only makes sense inside
    // another roving-focus container such as a Toolbar.
    rovingFocus: {
      control: false,
      description:
        "Whether the group is a roving-focus group of its own: one tab stop, arrow keys moving between its items. Leave it on. Turn it off only when the items sit inside another roving-focus container that moves focus between them (Toolbar.ToggleGroup does). With it off, loop has no effect and a multiple group is announced as a plain group, not a toolbar.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction, passed through to Radix ToggleGroup: rtl mirrors the group (the first item at the right, the arrow keys the other way round). Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    count: {
      control: { type: "number", min: 1, max: 6 },
      description: "Storybook only — not a ToggleGroup prop. How many items the demo group holds.",
      table: { disable: true },
    },
    chosen: {
      control: "select",
      options: ["none", "day", "week", "month", "quarter", "year", "all"],
      description: "Storybook only — not a ToggleGroup prop. Which item starts chosen: written as defaultValue.",
      table: { disable: true },
    },
    "aria-label": {
      control: "text",
      description:
        "Names the group for assistive tech (\"Text alignment\"). Required unless aria-labelledby points at a visible label.",
    },
    "aria-labelledby": { ...noControls, description: "The id of an already-visible element that names the group, in place of aria-label." },
    "aria-describedby": { ...noControls, description: "The id of a helper text or description for the group." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the group's element." },
  },
  // Every controllable prop gets an explicit value here, matching its real default.
  args: {
    type: "single",
    variant: "outlined",
    size: "md",
    rounded: false,
    attached: true,
    orientation: "horizontal",
    fullWidth: false,
    disabled: false,
    loop: true,
    dir: "ltr",
    deselectable: false,
    count: 3,
    chosen: "week",
    "aria-label": "View",
  },
  render: (args) => <Demo {...args} />,
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => toggleGroupPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" } as const;

export const Variants: Story = {
  parameters: { docs: { source: { code: toggleGroupSnippets.variants } } },
  // `variant` is the whole point of this grid — each group intentionally sets its own.
  argTypes: { variant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["subtle", "outlined", "solid"] as const).map((variant) => (
        <Demo key={variant} {...args} variant={variant} aria-label={`${variant} group`} />
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: toggleGroupSnippets.sizes } } },
  argTypes: { size: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Demo key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Multiple: Story = {
  name: "Multiple choice",
  parameters: { docs: { source: { code: toggleGroupSnippets.multiple } } },
  args: { type: "multiple", chosen: "day", count: 3 },
  argTypes: { type: noControls, deselectable: noControls, count: noControls, chosen: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, ...args }) => (
    <ToggleGroup {...args} type="multiple" aria-label="Text style" defaultValue={["bold"]}>
      <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
      <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
      <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  parameters: { docs: { source: { code: toggleGroupSnippets.icons } } },
  args: { variant: "solid" },
  argTypes: { type: noControls, variant: noControls, size: noControls, count: noControls, chosen: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, size: _size, ...args }) => (
    <div style={column}>
      <ToggleGroup {...args} type="multiple" size="sm" aria-label="Text style">
        <ToggleGroup.Item value="bold" icon={TextBIcon} aria-label="Bold" />
        <ToggleGroup.Item value="italic" icon={TextItalicIcon} aria-label="Italic" />
        <ToggleGroup.Item value="underline" icon={TextUnderlineIcon} aria-label="Underline" />
      </ToggleGroup>
      <ToggleGroup {...args} variant="outlined" aria-label="Text alignment" defaultValue="left">
        <ToggleGroup.Item value="left" icon={TextAlignLeftIcon}>
          Left
        </ToggleGroup.Item>
        <ToggleGroup.Item value="center" icon={TextAlignCenterIcon}>
          Centre
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right" icon={TextAlignRightIcon}>
          Right
        </ToggleGroup.Item>
      </ToggleGroup>
    </div>
  ),
};

export const Spaced: Story = {
  name: "Spaced, not attached",
  parameters: { docs: { source: { code: toggleGroupSnippets.spaced } } },
  args: { attached: false, type: "multiple" },
  argTypes: { attached: noControls, type: noControls, count: noControls, chosen: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, ...args }) => (
    <ToggleGroup {...args} type="multiple" aria-label="Filter" defaultValue={["open"]}>
      <ToggleGroup.Item value="open">Open</ToggleGroup.Item>
      <ToggleGroup.Item value="closed">Closed</ToggleGroup.Item>
      <ToggleGroup.Item value="draft">Draft</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Vertical: Story = {
  parameters: { docs: { source: { code: toggleGroupSnippets.vertical } } },
  args: { orientation: "vertical" },
  argTypes: { orientation: noControls },
};

export const Rounded: Story = {
  parameters: { docs: { source: { code: toggleGroupSnippets.rounded } } },
  args: { rounded: true },
  argTypes: { rounded: noControls },
};

export const FullWidth: Story = {
  name: "Full width",
  parameters: { docs: { source: { code: toggleGroupSnippets.fullWidth } } },
  args: { fullWidth: true },
  argTypes: { fullWidth: noControls },
};

export const ResponsiveOrientation: Story = {
  name: "Stacked on a phone, in a row from md up",
  parameters: { docs: { source: { code: toggleGroupSnippets.responsive } } },
  args: { fullWidth: true },
  argTypes: { fullWidth: noControls, orientation: noControls, count: noControls, chosen: noControls, type: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, orientation: _orientation, "aria-label": _label, ...args }) => (
    <ToggleGroup {...args} orientation={{ base: "vertical", md: "horizontal" }} aria-label="View" defaultValue="week">
      <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
      <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
      <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Deselectable: Story = {
  parameters: { docs: { source: { code: toggleGroupSnippets.deselectable } } },
  args: { deselectable: true, count: 2, chosen: "day" },
  argTypes: { deselectable: noControls, type: noControls, count: noControls, chosen: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, "aria-label": _label, deselectable: _deselectable, ...args }) => (
    <ToggleGroup {...args} deselectable aria-label="Filter" defaultValue="open">
      <ToggleGroup.Item value="open">Open</ToggleGroup.Item>
      <ToggleGroup.Item value="closed">Closed</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Controlled: Story = {
  name: "Controlled",
  parameters: { docs: { source: { code: toggleGroupSnippets.controlled } } },
  argTypes: { type: noControls, deselectable: noControls, count: noControls, chosen: noControls, "aria-label": noControls },
  render: function ControlledStory({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, ...args }) {
    const [view, setView] = useState("week");
    return (
      <div style={column}>
        <ToggleGroup {...args} aria-label="View" value={view} onValueChange={setView}>
          <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
          <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
          <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
        </ToggleGroup>
        <Text size="sm">Showing: {view}</Text>
      </div>
    );
  },
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: toggleGroupSnippets.disabled } } },
  args: { disabled: true },
  argTypes: { disabled: noControls, type: noControls, count: noControls, chosen: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, disabled: _disabled, ...args }) => (
    <div style={column}>
      <ToggleGroup {...args} disabled aria-label="View" defaultValue="week">
        <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
        <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
      </ToggleGroup>
      <ToggleGroup {...args} disabled={false} aria-label="Plan" defaultValue="free">
        <ToggleGroup.Item value="free">Free</ToggleGroup.Item>
        <ToggleGroup.Item value="team" disabled>
          Team
        </ToggleGroup.Item>
        <ToggleGroup.Item value="pro">Pro</ToggleGroup.Item>
      </ToggleGroup>
    </div>
  ),
};

export const Wrapped: Story = {
  name: "Wrapped in a tooltip",
  parameters: { docs: { source: { code: toggleGroupSnippets.wrapped } } },
  args: { size: "sm" },
  argTypes: { size: noControls, type: noControls, count: noControls, chosen: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, ...args }) => (
    <ToggleGroup {...args} type="multiple" aria-label="Text style">
      <Tooltip content="Bold">
        <ToggleGroup.Item value="bold" icon={TextBIcon} aria-label="Bold" />
      </Tooltip>
      <Tooltip content="Italic">
        <ToggleGroup.Item value="italic" icon={TextItalicIcon} aria-label="Italic" />
      </Tooltip>
    </ToggleGroup>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: toggleGroupSnippets.rtl } } },
  args: { dir: "rtl" },
  argTypes: { dir: noControls, type: noControls, count: noControls, chosen: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, ...args }) => (
    <ToggleGroup {...args} aria-label="Text alignment" defaultValue="left">
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Centre</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: toggleGroupSnippets.labelled } } },
  argTypes: { type: noControls, count: noControls, chosen: noControls, deselectable: noControls, "aria-label": noControls },
  render: ({ count: _count, chosen: _chosen, type: _type, deselectable: _deselectable, "aria-label": _label, ...args }) => (
    <div style={{ ...column, gap: "var(--dbm-space-2)" }}>
      <Text id="view-label" size="sm" weight="semibold">
        View
      </Text>
      <ToggleGroup {...args} aria-labelledby="view-label" defaultValue="week">
        <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
        <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
      </ToggleGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------------------------------------
// The stories below are hidden from the sidebar and the Docs page (`!dev`) but still run as tests. Everything they
// check is layout, colour or focus placement, which only a real browser computes.

const rect = (element: Element) => element.getBoundingClientRect();
const px = (value: string) => Number.parseFloat(value);
const resolveColor = (token: string) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};
const cssPx = (token: string, fallback: number) => px(getComputedStyle(document.documentElement).getPropertyValue(token)) || fallback;
const corners = (element: Element) => {
  const style = getComputedStyle(element);
  return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(px);
};

const trio = (canvasElement: HTMLElement, id: string) =>
  within(within(canvasElement).getByTestId(id)).getAllByRole("radio") as unknown as [HTMLElement, HTMLElement, HTMLElement];

const Three = ({ id, ...props }: { id: string } & Partial<React.ComponentProps<typeof ToggleGroup>>) => (
  <div data-testid={id}>
    <ToggleGroup aria-label={id} defaultValue="b" {...(props as object)}>
      <ToggleGroup.Item value="a">One</ToggleGroup.Item>
      <ToggleGroup.Item value="b">Two</ToggleGroup.Item>
      <ToggleGroup.Item value="c">Three</ToggleGroup.Item>
    </ToggleGroup>
  </div>
);

export const CornersInteraction: Story = {
  ...Playground,
  name: "Interaction: only the corners where items meet are square",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      <Three id="horizontal" />
      <Three id="vertical" orientation="vertical" />
      <Three id="rtl" dir="rtl" />
      <Three id="pill" rounded />
      <Three id="spaced" attached={false} />
      <div data-testid="single">
        <ToggleGroup aria-label="single" defaultValue="a">
          <ToggleGroup.Item value="a">Only</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const outer = cssPx("--dbm-radius-md", 8);
    let [first, middle, last] = trio(canvasElement, "horizontal");
    await expect(corners(first)).toEqual([outer, 0, 0, outer]);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    await expect(corners(last)).toEqual([0, outer, outer, 0]);
    [first, middle, last] = trio(canvasElement, "vertical");
    await expect(corners(first)).toEqual([outer, outer, 0, 0]);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    await expect(corners(last)).toEqual([0, 0, outer, outer]);
    // Right to left: the first item is at the right, so it keeps its right corners.
    [first, , last] = trio(canvasElement, "rtl");
    await expect(rect(first).left).toBeGreaterThan(rect(last).left);
    await expect(corners(first)).toEqual([0, outer, outer, 0]);
    await expect(corners(last)).toEqual([outer, 0, 0, outer]);
    [first, middle, last] = trio(canvasElement, "pill");
    await expect(corners(first)[0]).toBeGreaterThanOrEqual(rect(first).height / 2);
    await expect(corners(first)[1]).toBe(0);
    await expect(corners(last)[1]).toBeGreaterThanOrEqual(rect(last).height / 2);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    for (const item of trio(canvasElement, "spaced")) await expect(corners(item)).toEqual([outer, outer, outer, outer]);
    await expect(corners(within(within(canvasElement).getByTestId("single")).getByRole("radio"))).toEqual([outer, outer, outer, outer]);
  },
};

export const LooksInteraction: Story = {
  ...Playground,
  name: "Interaction: the chosen item is marked, borders are shared, and choosing moves nothing",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {(["subtle", "outlined", "solid"] as const).map((variant) => (
        <Three key={variant} id={variant} variant={variant} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const one = cssPx("--dbm-border-width-1", 1);
    const neutral = resolveColor("--dbm-border-neutral");
    const brand = resolveColor("--dbm-border-brand");
    const brandSubtle = resolveColor("--dbm-bg-brand-subtle");
    const brandFill = resolveColor("--dbm-bg-brand");
    const transparent = "rgba(0, 0, 0, 0)";

    // Outlined: every item has a neutral border; the chosen one a brand border and a soft tint, drawn above its neighbours.
    const outlined = trio(canvasElement, "outlined");
    let [a, b] = outlined;
    const c = outlined[2];
    await expect(getComputedStyle(a).borderLeftColor).toBe(neutral);
    await expect(getComputedStyle(b).borderLeftColor).toBe(brand);
    await expect(getComputedStyle(b).backgroundColor).toBe(brandSubtle);
    await expect(getComputedStyle(a).backgroundColor).toBe(transparent);
    await expect(getComputedStyle(b).position).toBe("relative");
    await expect(getComputedStyle(a).position).toBe("static");
    // Above its neighbours, so its brand border isn't hidden under the shared one.
    await expect(getComputedStyle(b).zIndex).toBe(getComputedStyle(document.documentElement).getPropertyValue("--dbm-z-index-base").trim());
    await expect(getComputedStyle(a).zIndex).toBe("auto");
    // Neighbouring borders overlap by one border width, so they are one shared line.
    await expect(Math.abs(rect(a).right - rect(b).left - one)).toBeLessThan(0.5);
    await expect(Math.abs(rect(b).right - rect(c).left - one)).toBeLessThan(0.5);

    // Solid: the chosen item is filled with the brand colour, and the borders stay.
    [a, b] = trio(canvasElement, "solid");
    await expect(getComputedStyle(b).backgroundColor).toBe(brandFill);
    await expect(getComputedStyle(a).borderLeftColor).toBe(neutral);
    await expect(getComputedStyle(a).backgroundColor).toBe(transparent);

    // Subtle: no borders, so items abut with no overlap, and the chosen one is tinted.
    [a, b] = trio(canvasElement, "subtle");
    await expect(px(getComputedStyle(a).borderLeftWidth)).toBe(0);
    await expect(getComputedStyle(b).backgroundColor).toBe(brandSubtle);
    await expect(Math.abs(rect(b).left - rect(a).right)).toBeLessThan(0.5);

    // Choosing a different item moves nothing: the group and every item keep their position and size.
    for (const variant of ["subtle", "outlined", "solid"] as const) {
      const items = trio(canvasElement, variant);
      const group = items[0].parentElement as HTMLElement;
      const before = [rect(group), ...items.map(rect)].map((r) => [r.left, r.top, r.width, r.height]);
      await userEvent.click(items[2]);
      await expect(items[2]).toHaveAttribute("aria-checked", "true");
      const after = [rect(group), ...items.map(rect)].map((r) => [r.left, r.top, r.width, r.height]);
      before.forEach((box, index) => box.forEach((value, i) => expect(Math.abs(value - (after[index] as number[])[i]!)).toBeLessThan(0.5)));
    }
  },
};

export const FocusInteraction: Story = {
  ...Playground,
  name: "Interaction: the focus ring sits inside an attached item, outside a spaced one, and reads on a filled item",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Three id="attached-solid" variant="solid" />
      <Three id="attached-outlined" variant="outlined" />
      <Three id="spaced-solid" variant="solid" attached={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const focusRing = resolveColor("--dbm-border-focus");
    const onBrand = resolveColor("--dbm-icon-on-brand");
    const two = cssPx("--dbm-border-width-2", 2);
    // The chosen solid item is filled with the brand colour: an inside ring in the colour that contrasts with it.
    const solid = trio(canvasElement, "attached-solid");
    solid[1].focus();
    await expect(solid[1]).toHaveFocus();
    let style = getComputedStyle(solid[1]);
    await expect(px(style.outlineOffset)).toBe(-two);
    await expect(style.outlineColor).toBe(onBrand);
    await expect(px(style.outlineWidth)).toBe(two);
    // An unchosen item in the same group sits on the surface: the ordinary focus colour, still inside.
    solid[0].focus();
    style = getComputedStyle(solid[0]);
    await expect(px(style.outlineOffset)).toBe(-two);
    await expect(style.outlineColor).toBe(focusRing);
    // Attached and outlined: inside, in the focus colour; the meeting corners stay square.
    const outlined = trio(canvasElement, "attached-outlined");
    outlined[1].focus();
    style = getComputedStyle(outlined[1]);
    await expect(px(style.outlineOffset)).toBe(-two);
    await expect(style.outlineColor).toBe(focusRing);
    // Spaced: the ordinary ring outside the item, even on the chosen solid one (it lies on the surface).
    const spaced = trio(canvasElement, "spaced-solid");
    spaced[1].focus();
    style = getComputedStyle(spaced[1]);
    await expect(px(style.outlineOffset)).toBeGreaterThan(0);
    await expect(style.outlineColor).toBe(focusRing);
  },
};

export const TargetSizeInteraction: Story = {
  ...Playground,
  name: "Interaction: every item is at least 24 by 24px, at every size",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).flatMap((size) => [
        <div key={`h-${size}`} data-testid={`horizontal-${size}`}>
          <ToggleGroup aria-label={`Horizontal ${size}`} type="multiple" size={size}>
            <ToggleGroup.Item value="a">A</ToggleGroup.Item>
            <ToggleGroup.Item value="b" icon={TextBIcon} aria-label="Bold" />
          </ToggleGroup>
        </div>,
        <div key={`v-${size}`} data-testid={`vertical-${size}`}>
          <ToggleGroup aria-label={`Vertical ${size}`} type="multiple" size={size} orientation="vertical">
            <ToggleGroup.Item value="a">A</ToggleGroup.Item>
            <ToggleGroup.Item value="b" icon={TextBIcon} aria-label="Bold" />
          </ToggleGroup>
        </div>,
      ])}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // WCAG 2.5.8: the smallest things a group can hold — a one-letter label and an icon-only item.
    for (const orientation of ["horizontal", "vertical"] as const) {
      for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
        for (const item of within(canvas.getByTestId(`${orientation}-${size}`)).getAllByRole("button")) {
          await expect(rect(item).width).toBeGreaterThanOrEqual(24);
          await expect(rect(item).height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  },
};

export const SizingInteraction: Story = {
  ...Playground,
  name: "Interaction: equal shares with fullWidth, one width per column, the spaced gap, and no wrapping when attached",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", width: "30rem" }}>
      <div data-testid="full">
        <ToggleGroup aria-label="Full" fullWidth defaultValue="a">
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">A much longer label</ToggleGroup.Item>
          <ToggleGroup.Item value="c">Mid</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div data-testid="column" style={{ width: "12rem" }}>
        <ToggleGroup aria-label="Column" orientation="vertical" fullWidth defaultValue="a">
          <ToggleGroup.Item value="a">Day</ToggleGroup.Item>
          <ToggleGroup.Item value="b">A longer label</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div data-testid="mixed">
        <ToggleGroup aria-label="Mixed" type="multiple">
          <ToggleGroup.Item value="a" icon={TextBIcon} aria-label="Bold" />
          <ToggleGroup.Item value="b" icon={TextItalicIcon}>Italic</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div data-testid="roomy">
        <ToggleGroup aria-label="Roomy" attached={false} type="multiple">
          <ToggleGroup.Item value="a">One</ToggleGroup.Item>
          <ToggleGroup.Item value="b">Two</ToggleGroup.Item>
          <ToggleGroup.Item value="c">Three</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div data-testid="tight" style={{ width: "12rem" }}>
        <ToggleGroup aria-label="Tight" attached={false} type="multiple">
          <ToggleGroup.Item value="a">Copy</ToggleGroup.Item>
          <ToggleGroup.Item value="b">Paste</ToggleGroup.Item>
          <ToggleGroup.Item value="c">Cut</ToggleGroup.Item>
          <ToggleGroup.Item value="d">Undo</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div data-testid="tight-attached" style={{ width: "12rem" }}>
        <ToggleGroup aria-label="Tight attached" type="multiple">
          <ToggleGroup.Item value="a">Copy</ToggleGroup.Item>
          <ToggleGroup.Item value="b">Paste</ToggleGroup.Item>
          <ToggleGroup.Item value="c">Cut</ToggleGroup.Item>
          <ToggleGroup.Item value="d">Undo</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const itemsOf = (id: string) => within(canvas.getByTestId(id)).getAllByRole(id === "full" || id === "column" ? "radio" : "button");
    // fullWidth: the group fills the container and every item gets the same width, whatever its label.
    const full = canvas.getByTestId("full").firstElementChild as HTMLElement;
    await expect(Math.abs(rect(full).width - rect(canvas.getByTestId("full")).width)).toBeLessThan(0.5);
    const widths = itemsOf("full").map((item) => rect(item).width);
    await expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1.5);
    // A vertical group: every item is as wide as the group.
    const column = canvas.getByTestId("column").firstElementChild as HTMLElement;
    for (const item of itemsOf("column")) await expect(Math.abs(rect(item).width - rect(column).width)).toBeLessThan(0.5);
    // An icon-only item and a labelled one are the same height, so a mixed row is level.
    const heights = itemsOf("mixed").map((item) => rect(item).height);
    await expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.5);
    // Spaced: the gap is the space token, on one line; too wide, it wraps; attached, it never does.
    const gap = cssPx("--dbm-space-2", 0.5) * (cssPx("--dbm-space-2", 0.5) < 4 ? 16 : 1);
    const [one, two] = itemsOf("roomy") as [HTMLElement, HTMLElement];
    await expect(Math.abs(rect(two).left - rect(one).right - gap)).toBeLessThan(0.5);
    await expect(new Set(itemsOf("tight").map((item) => Math.round(rect(item).top))).size).toBeGreaterThan(1);
    const attached = itemsOf("tight-attached");
    await expect(new Set(attached.map((item) => Math.round(rect(item).top))).size).toBe(1);
    const attachedGroup = canvas.getByTestId("tight-attached").firstElementChild as HTMLElement;
    await expect(Math.max(...attached.map((item) => rect(item).right))).toBeLessThanOrEqual(rect(attachedGroup).right + 0.5);
  },
};

export const ResponsiveInteraction: Story = {
  ...Playground,
  name: "Interaction: a breakpoint map stacks the group on a phone",
  tags: ["!dev"],
  // Only a real viewport can prove a breakpoint: pinned to a phone width, the group is a column.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <ToggleGroup aria-label="View" fullWidth orientation={{ base: "vertical", md: "horizontal" }} defaultValue="a">
      <ToggleGroup.Item value="a">Day</ToggleGroup.Item>
      <ToggleGroup.Item value="b">Week</ToggleGroup.Item>
      <ToggleGroup.Item value="c">Month</ToggleGroup.Item>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport global didn't apply, rather than passing for the wrong reason.
    await expect(window.innerWidth).toBeLessThan(768);
    const group = within(canvasElement).getByRole("radiogroup");
    await expect(group).toHaveAttribute("data-orientation", "vertical");
    await expect(getComputedStyle(group).flexDirection).toBe("column");
    const items = within(group).getAllByRole("radio");
    await expect(rect(items[1]!).top).toBeGreaterThan(rect(items[0]!).top + rect(items[0]!).height / 2);
    await expect(Math.abs(rect(items[0]!).left - rect(items[1]!).left)).toBeLessThan(0.5);
  },
};

export const KeyboardInteraction: Story = {
  ...Playground,
  name: "Interaction: the group is one tab stop, and the arrow keys move between items in reading order and choose",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      <button type="button" data-testid="before">Before</button>
      <Three id="ltr" />
      <Three id="rtl" dir="rtl" />
      <button type="button" data-testid="after">After</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One tab stop: Tab enters on the chosen item, and the next Tab leaves the group.
    canvas.getByTestId("before").focus();
    await userEvent.tab();
    const ltr = trio(canvasElement, "ltr");
    await expect(ltr[1]).toHaveFocus();
    // Reading order on screen: ArrowRight goes to the item on the right, and chooses it, as in a native radio group.
    await userEvent.keyboard("{ArrowRight}");
    await expect(ltr[2]).toHaveFocus();
    await expect(rect(ltr[2]).left).toBeGreaterThan(rect(ltr[1]).left);
    await expect(ltr[2]).toHaveAttribute("aria-checked", "true");
    await expect(ltr[1]).toHaveAttribute("aria-checked", "false");
    await userEvent.tab();
    await expect(ltr[2]).not.toHaveFocus();
    // Right to left: the first item is at the right, and ArrowLeft goes to the item on the left, which is the next.
    const rtl = trio(canvasElement, "rtl");
    rtl[1].focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(rtl[2]).toHaveFocus();
    await expect(rect(rtl[2]).left).toBeLessThan(rect(rtl[1]).left);
    await expect(rtl[2]).toHaveAttribute("aria-checked", "true");
  },
};
