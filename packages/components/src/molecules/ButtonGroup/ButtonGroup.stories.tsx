import {
  ClipboardIcon,
  CopyIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Text } from "../../atoms/Text";
import { Tooltip } from "../../atoms/Tooltip";
import { ButtonGroup } from "./ButtonGroup";
import { buttonGroupPlaygroundSnippet, buttonGroupSnippets } from "./ButtonGroup.snippets";
import type { ButtonGroupProps } from "./ButtonGroup.types";

// The Playground's own args: every `ButtonGroup` prop, plus the Storybook-only number of buttons in the demo.
interface PlaygroundArgs extends ButtonGroupProps {
  /** Storybook only — how many buttons the demo group holds. */
  count: number;
}

const noControls = { control: false } as const;
const demoLabels = ["Copy", "Paste", "Cut", "Undo", "Redo", "Select"] as const;

const DemoButtons = ({ count }: { count: number }) => (
  <>
    {demoLabels.slice(0, count).map((label) => (
      <Button key={label}>{label}</Button>
    ))}
  </>
);

const meta: Meta<PlaygroundArgs> = {
  title: "Components/ButtonGroup",
  id: "molecules-inputs-buttongroup",
  component: ButtonGroup,
  parameters: { layout: "padded" },
  // Core visual props first, then behavioral/state props, then advanced/escape-hatch props last — the same
  // sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description:
        "The visual style every button in the group uses unless it sets its own variant. Left out, each button keeps its own, which is primary unless it says otherwise. An attached group draws the separator between buttons to suit each one's variant.",
      table: { defaultValue: { summary: "primary" } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description:
        "The colour family every button in the group uses unless it sets its own tone: brand, or neutral. Left out, each button keeps its own, which is brand unless it says otherwise. destructive buttons ignore it. An attached group draws neutral tertiary and ghost separators in neutral colours.",
      table: { defaultValue: { summary: "brand" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size every button in the group uses unless it sets its own size. Left out, each button keeps its own, which is md unless it says otherwise.",
      table: { defaultValue: { summary: "md" } },
    },
    rounded: {
      control: "boolean",
      description:
        "Fully rounded ends, a pill: the outer corners of the first and last button are circular, and, attached, the corners where buttons meet stay square. Also the default for each button's own rounded.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every button in the group. A button that is disabled itself stays disabled either way.",
      table: { defaultValue: { summary: "false" } },
    },
    attached: {
      control: "boolean",
      description:
        "Fuses the buttons into one segmented control: square corners where they meet, one separator between them, no gap. false keeps them apart, spaced by a gap, and lets a horizontal group wrap onto more lines.",
      table: { defaultValue: { summary: "true" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Lays the buttons out in a row or a column. Also takes a mobile-first map keyed by breakpoint, so a row on a wide screen can stack on a phone ({ base: \"vertical\", md: \"horizontal\" }).",
      table: { defaultValue: { summary: "horizontal" } },
    },
    fullWidth: {
      control: "boolean",
      description:
        "Stretches the group to the width of its container. A horizontal group shares that width equally between its buttons; a vertical group makes every button as wide as the group already is.",
      table: { defaultValue: { summary: "false" } },
    },
    count: {
      control: { type: "number", min: 1, max: 6 },
      description: "Storybook only — not a ButtonGroup prop. How many buttons the demo group holds.",
      table: { disable: true },
    },
    children: {
      ...noControls,
      description:
        "The buttons to group: Buttons and IconButtons, including ones wrapped for a tooltip or a menu trigger (asChild). Anything else in the group is laid out but takes none of its settings.",
    },
    "aria-label": {
      control: "text",
      description:
        "Names the group for assistive tech (\"Text alignment\") — announced when focus enters it. Required unless aria-labelledby points at a visible label.",
    },
    "aria-labelledby": {
      ...noControls,
      description: "The id of an already-visible element that names the group, in place of aria-label.",
    },
    "aria-describedby": {
      ...noControls,
      description: "The id of a helper text or description for the group.",
    },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the group's element." },
  },
  // Every controllable prop gets an explicit value here, matching its real default. A group that sets no variant,
  // size or rounded leaves each button its own defaults, which are the same three values, so the group's own
  // controls start there.
  args: {
    variant: "primary",
    tone: "brand",
    size: "md",
    rounded: false,
    disabled: false,
    attached: true,
    orientation: "horizontal",
    fullWidth: false,
    count: 3,
    "aria-label": "Clipboard",
  },
  render: ({ count, ...args }) => (
    <ButtonGroup {...args}>
      <DemoButtons count={count} />
    </ButtonGroup>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => buttonGroupPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

export const Variants: Story = {
  parameters: { docs: { source: { code: buttonGroupSnippets.variants } } },
  // `variant` is the whole point of this grid — each group intentionally sets its own.
  argTypes: { variant: noControls, "aria-label": noControls },
  render: ({ count, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" }}>
      {(["primary", "secondary", "tertiary", "ghost", "destructive"] as const).map((variant) => (
        <ButtonGroup key={variant} {...args} variant={variant} aria-label={`${variant} group`}>
          <DemoButtons count={count} />
        </ButtonGroup>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: buttonGroupSnippets.sizes } } },
  args: { variant: "secondary" },
  argTypes: { size: noControls, "aria-label": noControls },
  render: ({ count, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ButtonGroup key={size} {...args} size={size} aria-label={`Size ${size}`}>
          <DemoButtons count={count} />
        </ButtonGroup>
      ))}
    </div>
  ),
};

export const Spaced: Story = {
  name: "Spaced, not attached",
  parameters: { docs: { source: { code: buttonGroupSnippets.spaced } } },
  args: { attached: false, variant: "secondary", count: 2 },
  argTypes: { attached: noControls, count: noControls },
  render: ({ count: _count, ...args }) => (
    <ButtonGroup {...args}>
      <Button>Cancel</Button>
      <Button variant="primary">Save</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  parameters: { docs: { source: { code: buttonGroupSnippets.vertical } } },
  args: { orientation: "vertical", variant: "secondary", count: 3 },
  argTypes: { orientation: noControls, count: noControls },
  render: ({ count: _count, ...args }) => (
    <ButtonGroup {...args} aria-label="View">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  ),
};

export const Rounded: Story = {
  parameters: { docs: { source: { code: buttonGroupSnippets.rounded } } },
  args: { rounded: true, variant: "secondary", count: 3 },
  argTypes: { rounded: noControls, count: noControls },
  render: ({ count: _count, ...args }) => (
    <ButtonGroup {...args} aria-label="View">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  parameters: { docs: { source: { code: buttonGroupSnippets.icons } } },
  args: { variant: "secondary" },
  argTypes: { variant: noControls, count: noControls, size: noControls, "aria-label": noControls },
  render: ({ count: _count, size: _size, "aria-label": _label, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" }}>
      <ButtonGroup {...args} aria-label="Text style" size="sm">
        <IconButton icon={TextBIcon} aria-label="Bold" />
        <IconButton icon={TextItalicIcon} aria-label="Italic" />
        <IconButton icon={TextUnderlineIcon} aria-label="Underline" />
      </ButtonGroup>
      <ButtonGroup {...args} aria-label="Editing">
        <Button leadingIcon={CopyIcon}>Copy</Button>
        <Button leadingIcon={ClipboardIcon}>Paste</Button>
      </ButtonGroup>
    </div>
  ),
};

export const OwnPropsWin: Story = {
  name: "A button's own props win",
  parameters: { docs: { source: { code: buttonGroupSnippets.override } } },
  args: { variant: "secondary", size: "sm" },
  argTypes: { variant: noControls, size: noControls, count: noControls, "aria-label": noControls },
  render: ({ count: _count, "aria-label": _label, ...args }) => (
    <ButtonGroup {...args} aria-label="Document">
      <Button>Edit</Button>
      <Button>Share</Button>
      <Button variant="destructive" size="md">
        Delete
      </Button>
    </ButtonGroup>
  ),
};

export const FullWidth: Story = {
  name: "Full width",
  parameters: { docs: { source: { code: buttonGroupSnippets.fullWidth } } },
  args: { fullWidth: true, variant: "secondary", count: 3 },
  argTypes: { fullWidth: noControls, count: noControls },
  render: ({ count: _count, ...args }) => (
    <ButtonGroup {...args} aria-label="View">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  ),
};

export const ResponsiveOrientation: Story = {
  name: "Stacked on a phone, in a row from md up",
  parameters: { docs: { source: { code: buttonGroupSnippets.responsive } } },
  args: { fullWidth: true, variant: "secondary", orientation: { base: "vertical", md: "horizontal" } },
  argTypes: { fullWidth: noControls, orientation: noControls, count: noControls, "aria-label": noControls },
  render: ({ count: _count, ...args }) => (
    <ButtonGroup {...args} aria-label="Actions">
      <Button>Edit</Button>
      <Button>Share</Button>
      <Button>Export</Button>
    </ButtonGroup>
  ),
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: buttonGroupSnippets.disabled } } },
  args: { disabled: true, variant: "secondary", count: 3 },
  argTypes: { disabled: noControls, count: noControls, "aria-label": noControls },
  render: ({ count: _count, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" }}>
      <ButtonGroup {...args} aria-label="View">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>
      <ButtonGroup {...args} disabled={false} aria-label="Pages">
        <Button>Previous</Button>
        <Button disabled>Next</Button>
      </ButtonGroup>
    </div>
  ),
};

export const Wrapped: Story = {
  name: "Wrapped in a tooltip, or a link",
  parameters: { docs: { source: { code: buttonGroupSnippets.wrapped } } },
  args: { variant: "secondary" },
  argTypes: { variant: noControls, count: noControls, "aria-label": noControls },
  render: ({ count: _count, ...args }) => (
    <ButtonGroup {...args} aria-label="Document">
      <Tooltip content="Copy the link">
        <Button>Copy</Button>
      </Tooltip>
      <Button asChild>
        <a href="/docs" onClick={(event) => event.preventDefault()}>
          Docs
        </a>
      </Button>
    </ButtonGroup>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: buttonGroupSnippets.rtl } } },
  args: { variant: "secondary" },
  argTypes: { variant: noControls, count: noControls, "aria-label": noControls },
  render: ({ count: _count, ...args }) => (
    <div dir="rtl">
      <ButtonGroup {...args} aria-label="Text alignment">
        <Button>Left</Button>
        <Button>Centre</Button>
        <Button>Right</Button>
      </ButtonGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------------------------------------
// The stories below are hidden from the sidebar and the Docs page (`!dev`) but still run as tests. Everything
// they check is layout — corner shape, separators, where one button ends and the next begins, what is on top —
// which only a real browser computes.

const rect = (element: Element) => element.getBoundingClientRect();
const px = (value: string) => Number.parseFloat(value);
/** A token's colour as the browser resolves it, so a separator can be compared with the token it should be. */
const resolveColor = (token: string) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};
/** The four corner radii, physical, in pixels: top-left, top-right, bottom-right, bottom-left. */
const corners = (element: Element) => {
  const style = getComputedStyle(element);
  return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(px);
};

export const CornersInteraction: Story = {
  ...Playground,
  name: "Interaction: only the corners where buttons meet are square",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      <div data-testid="horizontal">
        <ButtonGroup aria-label="H" variant="secondary">
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div data-testid="vertical">
        <ButtonGroup aria-label="V" variant="secondary" orientation="vertical">
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div data-testid="rtl" dir="rtl">
        <ButtonGroup aria-label="R" variant="secondary">
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div data-testid="pill">
        <ButtonGroup aria-label="P" variant="secondary" rounded>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div data-testid="single">
        <ButtonGroup aria-label="S" variant="secondary">
          <Button>Only</Button>
        </ButtonGroup>
      </div>
      <div data-testid="spaced">
        <ButtonGroup aria-label="Sp" variant="secondary" attached={false}>
          <Button>One</Button>
          <Button>Two</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttonsOf = (id: string) => within(canvas.getByTestId(id)).getAllByRole("button");
    const outer = px(getComputedStyle(document.documentElement).getPropertyValue("--dbm-radius-md")) || 8;

    // Horizontal, left to right: the first keeps its left corners, the last its right, the middle none.
    let [first, middle, last] = buttonsOf("horizontal") as unknown as [Element, Element, Element];
    await expect(corners(first)).toEqual([outer, 0, 0, outer]);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    await expect(corners(last)).toEqual([0, outer, outer, 0]);

    // Vertical: the first keeps its top corners, the last its bottom.
    [first, middle, last] = buttonsOf("vertical") as unknown as [Element, Element, Element];
    await expect(corners(first)).toEqual([outer, outer, 0, 0]);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    await expect(corners(last)).toEqual([0, 0, outer, outer]);

    // Right to left: the first button is at the right, so it keeps its right corners.
    [first, middle, last] = buttonsOf("rtl") as unknown as [Element, Element, Element];
    await expect(rect(first).left).toBeGreaterThan(rect(last).left);
    await expect(corners(first)).toEqual([0, outer, outer, 0]);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    await expect(corners(last)).toEqual([outer, 0, 0, outer]);

    // Pill: the outer corners are circular (at least half the height), the meeting corners still square.
    [first, middle, last] = buttonsOf("pill") as unknown as [Element, Element, Element];
    const halfHeight = rect(first).height / 2;
    await expect(corners(first)[0]).toBeGreaterThanOrEqual(halfHeight);
    await expect(corners(first)[1]).toBe(0);
    await expect(corners(middle)).toEqual([0, 0, 0, 0]);
    await expect(corners(last)[1]).toBeGreaterThanOrEqual(halfHeight);
    await expect(corners(last)[0]).toBe(0);

    // A group of one keeps every corner; a spaced group keeps every corner on every button.
    await expect(corners(buttonsOf("single")[0] as Element)).toEqual([outer, outer, outer, outer]);
    for (const button of buttonsOf("spaced")) await expect(corners(button)).toEqual([outer, outer, outer, outer]);
  },
};

export const SeparatorsInteraction: Story = {
  ...Playground,
  name: "Interaction: each variant's separator, and no gap between attached buttons",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {(["primary", "secondary", "tertiary", "ghost", "destructive"] as const).map((variant) => (
        <div key={variant} data-testid={`h-${variant}`}>
          <ButtonGroup aria-label={variant} variant={variant}>
            <Button>One</Button>
            <Button>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
        </div>
      ))}
      {(["primary", "secondary", "tertiary", "ghost"] as const).map((variant) => (
        <div key={variant} data-testid={`v-${variant}`}>
          <ButtonGroup aria-label={`v ${variant}`} variant={variant} orientation="vertical">
            <Button>One</Button>
            <Button>Two</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttonsOf = (id: string) => within(canvas.getByTestId(id)).getAllByRole("button");
    const surface = resolveColor("--dbm-bg-surface");
    const tertiaryRule = resolveColor("--dbm-border-brand-subtle");
    const ghostRule = resolveColor("--dbm-border-focus");
    const brand = resolveColor("--dbm-border-brand");
    const one = px(getComputedStyle(document.documentElement).getPropertyValue("--dbm-border-width-1")) || 1;

    // Solid fills: the first button has no separator; every later one starts with a hairline of the surface.
    for (const variant of ["primary", "destructive"] as const) {
      const [first, second, third] = buttonsOf(`h-${variant}`) as unknown as [Element, Element, Element];
      await expect(px(getComputedStyle(first).borderLeftWidth)).toBe(0);
      for (const button of [second, third]) {
        const style = getComputedStyle(button);
        await expect(px(style.borderLeftWidth)).toBe(one);
        await expect(style.borderLeftColor).toBe(surface);
      }
      // Nothing between them: each button starts where the previous one ends.
      await expect(Math.abs(rect(second).left - rect(first).right)).toBeLessThan(0.5);
      await expect(Math.abs(rect(third).left - rect(second).right)).toBeLessThan(0.5);
    }

    // Secondary: the buttons overlap by one border width, so the two borders are one shared line.
    const [sFirst, sSecond, sThird] = buttonsOf("h-secondary") as unknown as [Element, Element, Element];
    await expect(Math.abs(rect(sFirst).right - rect(sSecond).left - one)).toBeLessThan(0.5);
    await expect(Math.abs(rect(sSecond).right - rect(sThird).left - one)).toBeLessThan(0.5);
    await expect(getComputedStyle(sSecond).borderLeftColor).toBe(brand);

    // Tertiary and ghost have no solid fill or border, so each gets a rule instead — the brand's faint accent for
    // tertiary, the focus colour for ghost — with no gap either. The two must not be the same colour.
    for (const [variant, colour] of [["tertiary", tertiaryRule], ["ghost", ghostRule]] as const) {
      const [tFirst, tSecond] = buttonsOf(`h-${variant}`) as unknown as [Element, Element];
      await expect(px(getComputedStyle(tFirst).borderLeftWidth)).toBe(0);
      await expect(getComputedStyle(tSecond).borderLeftColor).toBe(colour);
      await expect(px(getComputedStyle(tSecond).borderLeftWidth)).toBe(one);
      await expect(Math.abs(rect(tSecond).left - rect(tFirst).right)).toBeLessThan(0.5);
    }
    await expect(tertiaryRule).not.toBe(ghostRule);

    // Vertical: the same, drawn on the top edge.
    const [pFirst, pSecond] = buttonsOf("v-primary") as unknown as [Element, Element];
    await expect(px(getComputedStyle(pFirst).borderTopWidth)).toBe(0);
    await expect(px(getComputedStyle(pSecond).borderTopWidth)).toBe(one);
    await expect(getComputedStyle(pSecond).borderTopColor).toBe(surface);
    await expect(Math.abs(rect(pSecond).top - rect(pFirst).bottom)).toBeLessThan(0.5);
    const [vsFirst, vsSecond] = buttonsOf("v-secondary") as unknown as [Element, Element];
    await expect(Math.abs(rect(vsFirst).bottom - rect(vsSecond).top - one)).toBeLessThan(0.5);
    const [, vtSecond] = buttonsOf("v-tertiary") as unknown as [Element, Element];
    await expect(getComputedStyle(vtSecond).borderTopColor).toBe(tertiaryRule);
    const [, vgSecond] = buttonsOf("v-ghost") as unknown as [Element, Element];
    await expect(getComputedStyle(vgSecond).borderTopColor).toBe(ghostRule);
  },
};

export const SizingInteraction: Story = {
  ...Playground,
  name: "Interaction: one height per row, equal shares with fullWidth, one width per column",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", width: "30rem" }}>
      <div data-testid="mixed">
        <ButtonGroup aria-label="Mixed" variant="secondary" size="md">
          <IconButton icon={TextBIcon} aria-label="Bold" />
          <Button>Copy</Button>
          <Button leadingIcon={CopyIcon}>Duplicate</Button>
        </ButtonGroup>
      </div>
      <div data-testid="mixed-large">
        <ButtonGroup aria-label="Mixed large" variant="secondary" size="lg">
          <IconButton icon={TextBIcon} aria-label="Bold" />
          <Button>Copy</Button>
        </ButtonGroup>
      </div>
      <div data-testid="full">
        <ButtonGroup aria-label="Full" fullWidth variant="secondary">
          <Button>A</Button>
          <Button>A much longer label</Button>
          <Button>Mid</Button>
        </ButtonGroup>
      </div>
      <div data-testid="column" style={{ width: "12rem" }}>
        <ButtonGroup aria-label="Column" orientation="vertical" variant="secondary" fullWidth>
          <Button>Day</Button>
          <Button>A longer label</Button>
        </ButtonGroup>
      </div>
      <div data-testid="column-shrink">
        <ButtonGroup aria-label="Column shrink" orientation="vertical" variant="secondary">
          <Button>Day</Button>
          <Button>A longer label</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttonsOf = (id: string) => within(canvas.getByTestId(id)).getAllByRole("button");

    // Every button in a row is the same height — an IconButton (a fixed box) and a Button with a leading icon (a
    // couple of pixels taller) included, and at lg, where a Button's height is fluid and an IconButton's is not —
    // so a mixed row is one straight line and a fused row has no step.
    for (const id of ["mixed", "mixed-large"]) {
      const heights = buttonsOf(id).map((button) => rect(button).height);
      await expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.5);
    }

    // fullWidth: the group fills the container and every button gets the same width, whatever its label.
    const group = canvas.getByTestId("full").firstElementChild as HTMLElement;
    await expect(Math.abs(rect(group).width - rect(canvas.getByTestId("full")).width)).toBeLessThan(0.5);
    const widths = buttonsOf("full").map((button) => rect(button).width);
    await expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1.5);

    // A vertical group: every button is as wide as the group, filling a set width or the widest label.
    const columnGroup = canvas.getByTestId("column").firstElementChild as HTMLElement;
    for (const button of buttonsOf("column")) await expect(Math.abs(rect(button).width - rect(columnGroup).width)).toBeLessThan(0.5);
    await expect(Math.abs(rect(columnGroup).width - rect(canvas.getByTestId("column")).width)).toBeLessThan(0.5);
    const shrinkGroup = canvas.getByTestId("column-shrink").firstElementChild as HTMLElement;
    const shrinkWidths = buttonsOf("column-shrink").map((button) => rect(button).width);
    await expect(Math.max(...shrinkWidths) - Math.min(...shrinkWidths)).toBeLessThan(0.5);
    await expect(Math.abs(shrinkWidths[0]! - rect(shrinkGroup).width)).toBeLessThan(0.5);
  },
};

export const SpacedInteraction: Story = {
  ...Playground,
  name: "Interaction: a spaced group has a gap and wraps when it doesn't fit",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="roomy">
        <ButtonGroup aria-label="Roomy" attached={false} variant="secondary">
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div data-testid="tight" style={{ width: "12rem" }}>
        <ButtonGroup aria-label="Tight" attached={false} variant="secondary">
          <Button>Copy</Button>
          <Button>Paste</Button>
          <Button>Cut</Button>
          <Button>Undo</Button>
        </ButtonGroup>
      </div>
      <div data-testid="tight-attached" style={{ width: "12rem" }}>
        <ButtonGroup aria-label="Tight attached" variant="secondary">
          <Button>Copy</Button>
          <Button>Paste</Button>
          <Button>Cut</Button>
          <Button>Undo</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttonsOf = (id: string) => within(canvas.getByTestId(id)).getAllByRole("button");
    const gap = px(getComputedStyle(document.documentElement).getPropertyValue("--dbm-space-2")) * 16 || 8;

    // The gap between spaced buttons is the space token, and they sit on one line.
    const [one, two, three] = buttonsOf("roomy") as unknown as [Element, Element, Element];
    await expect(Math.abs(rect(two).left - rect(one).right - gap)).toBeLessThan(0.5);
    await expect(Math.abs(rect(three).left - rect(two).right - gap)).toBeLessThan(0.5);
    await expect(Math.abs(rect(one).top - rect(three).top)).toBeLessThan(0.5);

    // Too wide for its container, a spaced row wraps onto a second line, with the same gap between the lines.
    const tight = buttonsOf("tight");
    const tops = new Set(tight.map((button) => Math.round(rect(button).top)));
    await expect(tops.size).toBeGreaterThan(1);
    for (const button of tight) await expect(rect(button).right).toBeLessThanOrEqual(rect(canvas.getByTestId("tight")).right + 0.5);

    // An attached row never wraps — a fused shape broken over two lines is no longer one shape. Too wide for its
    // container it overflows as one box: the group is as wide as its buttons, never narrower with them spilling out.
    const attachedButtons = buttonsOf("tight-attached");
    const attachedTops = new Set(attachedButtons.map((button) => Math.round(rect(button).top)));
    await expect(attachedTops.size).toBe(1);
    const attachedGroup = canvas.getByTestId("tight-attached").firstElementChild as HTMLElement;
    await expect(Math.max(...attachedButtons.map((button) => rect(button).right))).toBeLessThanOrEqual(rect(attachedGroup).right + 0.5);
    await expect(rect(attachedGroup).width).toBeGreaterThan(rect(canvas.getByTestId("tight-attached")).width);
  },
};

export const FocusInteraction: Story = {
  ...Playground,
  name: "Interaction: a focused button is drawn over its neighbours",
  tags: ["!dev"],
  render: () => (
    <ButtonGroup aria-label="Focus" variant="secondary">
      <Button>One</Button>
      <Button>Two</Button>
      <Button>Three</Button>
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    // The ring is drawn outside the button, over the next one, so the focused button has to be above it. Outlines
    // are not hit-testable, so this checks the stacking that puts it there: positioned (which paints above the
    // static siblings around it) on the base layer, while the others stay static. A focused button also keeps
    // its squared meeting corners — the ring's radius rule must not round them.
    for (const [index, button] of buttons.entries()) {
      await userEvent.tab();
      await expect(button).toHaveFocus();
      const style = getComputedStyle(button);
      await expect(style.position).toBe("relative");
      await expect(style.zIndex).toBe("0");
      for (const other of buttons.filter((_, i) => i !== index)) await expect(getComputedStyle(other).position).toBe("static");
      const [topLeft, topRight, bottomRight, bottomLeft] = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(Number.parseFloat);
      if (index > 0) await expect([topLeft, bottomLeft]).toEqual([0, 0]);
      if (index < buttons.length - 1) await expect([topRight, bottomRight]).toEqual([0, 0]);
    }
  },
};

export const ResponsiveInteraction: Story = {
  ...Playground,
  name: "Interaction: a breakpoint map stacks the group on a phone",
  tags: ["!dev"],
  // Only a real viewport can prove a breakpoint: pinned to a phone width, the group is a column.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <ButtonGroup aria-label="Actions" variant="secondary" fullWidth orientation={{ base: "vertical", md: "horizontal" }}>
      <Button>Edit</Button>
      <Button>Share</Button>
      <Button>Export</Button>
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport global didn't apply, rather than passing for the wrong reason.
    await expect(window.innerWidth).toBeLessThan(768);
    const group = within(canvasElement).getByRole("group");
    await expect(group).toHaveAttribute("data-orientation", "vertical");
    await expect(getComputedStyle(group).flexDirection).toBe("column");
    const buttons = within(group).getAllByRole("button");
    // Below the first (a secondary group's buttons overlap by one border width, so the second starts a border above its end).
    await expect(rect(buttons[1]!).top).toBeGreaterThanOrEqual(rect(buttons[0]!).bottom - 1.5);
    await expect(rect(buttons[1]!).top).toBeGreaterThan(rect(buttons[0]!).top + rect(buttons[0]!).height / 2);
    await expect(Math.abs(rect(buttons[0]!).left - rect(buttons[1]!).left)).toBeLessThan(0.5);
  },
};

// A visible label for the docs of a named group, not a test.
export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: buttonGroupSnippets.labelled } } },
  args: { variant: "secondary" },
  argTypes: { variant: noControls, count: noControls, "aria-label": noControls, "aria-labelledby": noControls },
  render: ({ count: _count, "aria-label": _label, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
      <Text id="align-label" size="sm" weight="semibold">
        Alignment
      </Text>
      <ButtonGroup {...args} aria-labelledby="align-label">
        <Button>Left</Button>
        <Button>Right</Button>
      </ButtonGroup>
    </div>
  ),
};

export const TargetSizeInteraction: Story = {
  ...Playground,
  name: "Interaction: every button is at least 24 by 24px, at every size",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).flatMap((size) => [
        <div key={`h-${size}`} data-testid={`horizontal-${size}`}>
          <ButtonGroup aria-label={`Horizontal ${size}`} variant="secondary" size={size}>
            <Button>A</Button>
            <IconButton icon={TextBIcon} aria-label="Bold" />
          </ButtonGroup>
        </div>,
        <div key={`v-${size}`} data-testid={`vertical-${size}`}>
          <ButtonGroup aria-label={`Vertical ${size}`} variant="secondary" size={size} orientation="vertical">
            <Button>A</Button>
            <IconButton icon={TextBIcon} aria-label="Bold" />
          </ButtonGroup>
        </div>,
      ])}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // WCAG 2.5.8: a target is at least 24 x 24 CSS pixels. The shortest possible label and an icon-only button are
    // the smallest things a group can hold, at every size and in both orientations, attached and stretched.
    for (const orientation of ["horizontal", "vertical"] as const) {
      for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
        for (const button of within(canvas.getByTestId(`${orientation}-${size}`)).getAllByRole("button")) {
          await expect(rect(button).width).toBeGreaterThanOrEqual(24);
          await expect(rect(button).height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  },
};

// A link rendered `asChild` carries its own click handler (a router's navigation). In a disabled group it must not
// run — checked in a real browser, where the event really is dispatched through the capture and bubble phases.
export const DisabledLinkInteraction: Story = {
  ...Playground,
  name: "Interaction: a link in a disabled group does not run its own click handler",
  tags: ["!dev"],
  args: { disabled: true },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
      <div data-testid="disabled">
        <ButtonGroup aria-label="Disabled" variant="secondary" disabled>
          <Button asChild>
            <a href="#disabled" data-testid="disabled-link">Disabled link</a>
          </Button>
        </ButtonGroup>
      </div>
      <div data-testid="enabled">
        <ButtonGroup aria-label="Enabled" variant="secondary">
          <Button asChild>
            <a href="#enabled" data-testid="enabled-link">Enabled link</a>
          </Button>
        </ButtonGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const onClick = fn();
    const disabledLink = canvas.getByTestId("disabled-link");
    const enabledLink = canvas.getByTestId("enabled-link");
    disabledLink.addEventListener("click", onClick);
    // The enabled link really would navigate (a hash change in the test page); its listener cancels that. The
    // disabled link's does not, so a click that leaked through would still show as a call and a navigation.
    enabledLink.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });
    await expect(disabledLink).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(disabledLink);
    // A native listener on the link itself sees the click only if it was not stopped in the capture phase.
    await expect(onClick).not.toHaveBeenCalled();
    await expect(window.location.hash).not.toBe("#disabled");
    await userEvent.click(enabledLink);
    await expect(onClick).toHaveBeenCalledTimes(1);
  },
};
