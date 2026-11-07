import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { FieldHelperText } from "../../atoms/FieldHelperText";
import { FieldLabel } from "../../atoms/FieldLabel";
import { Text } from "../../atoms/Text";
import { RangeSlider } from "./RangeSlider";
import { rangeSliderPlaygroundSnippet, rangeSliderSnippets } from "./RangeSlider.snippets";
import type { RangeSliderProps, RangeSliderValue } from "./RangeSlider.types";

// The Playground's own args: every `RangeSlider` prop, plus the two Storybook-only numbers that set where
// the uncontrolled demo starts (a range is a pair, which a single control can't edit).
interface PlaygroundArgs extends RangeSliderProps {
  /** Storybook only — the lower thumb's starting value. */
  lowerStart: number;
  /** Storybook only — the upper thumb's starting value. */
  upperStart: number;
}

const noControls = { control: false } as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Inputs/RangeSlider",
  component: RangeSlider,
  parameters: { layout: "padded" },
  // Core visual props first, then behavioral/state props, then advanced/escape-hatch props last — the same
  // sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Thumb diameter and track thickness, matching the shared size scale.",
      table: { defaultValue: { summary: "md" } },
    },
    hasError: {
      control: "boolean",
      description: "Marks the slider as invalid, visually and via aria-invalid on both thumbs.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — driving `value` from Controls without a real `onValueChange` wired back would freeze
    // the thumbs. The Playground demonstrates the uncontrolled path instead, through the two "start" controls.
    value: {
      ...noControls,
      description: "The controlled range as [minimum, maximum], lower first.",
    },
    // The real prop is a pair, which no single control edits; `lowerStart`/`upperStart` below stand in for it
    // in the Playground.
    defaultValue: {
      ...noControls,
      description: "The initial range when uncontrolled, as [minimum, maximum]. Defaults to the whole track ([min, max]).",
      table: { defaultValue: { summary: "[min, max]" } },
    },
    lowerStart: {
      control: "number",
      description: "Storybook only — not a RangeSlider prop. The lower thumb's starting value: written as the first number of defaultValue.",
      table: { disable: true },
    },
    upperStart: {
      control: "number",
      description: "Storybook only — not a RangeSlider prop. The upper thumb's starting value: written as the second number of defaultValue.",
      table: { disable: true },
    },
    onValueChange: {
      ...noControls,
      description: "Called continuously with the new [minimum, maximum] while dragging or stepping.",
    },
    onValueCommit: {
      ...noControls,
      description: "Called once, with the final [minimum, maximum], when the user finishes interacting.",
    },
    min: { control: "number", description: "The lowest value either thumb can take.", table: { defaultValue: { summary: "0" } } },
    max: { control: "number", description: "The highest value either thumb can take.", table: { defaultValue: { summary: "100" } } },
    step: {
      control: "number",
      description: "The increment each arrow-key press changes a thumb by.",
      table: { defaultValue: { summary: "1" } },
    },
    minStepsBetweenThumbs: {
      control: "number",
      description: "How many steps must always separate the two thumbs. 0 lets them meet; 1 or more keeps them apart.",
      table: { defaultValue: { summary: "0" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Lays the slider out horizontally or vertically.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    inverted: {
      control: "boolean",
      description: "Reverses which end of the track is the minimum.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction: rtl mirrors the slider for right-to-left languages — the minimum at the right, the filled range, thumbs and ticks running from there, ArrowLeft raising the value, and the value and min/max labels on the mirrored sides. Passed through to Radix Slider. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    showValue: {
      control: "boolean",
      description: "Shows the current range as live text next to the slider, as \"20 – 80\".",
      table: { defaultValue: { summary: "false" } },
    },
    showValueTooltip: {
      control: "boolean",
      description: "Shows each thumb's value in a tooltip above it while hovered, dragged, or focused.",
      table: { defaultValue: { summary: "false" } },
    },
    showMinMaxLabels: {
      control: "boolean",
      description: "Shows min and max as text labels at each end of the track.",
      table: { defaultValue: { summary: "false" } },
    },
    formatNumber: {
      ...noControls,
      description:
        "How a number is written where the slider shows one — the range (showValue), a thumb's tooltip (showValueTooltip) and the min and max labels (showMinMaxLabels) — for a language or region whose numerals or digit grouping differ, or to add a unit ($50): given a number, returns the text to show. It also becomes what assistive tech announces on each thumb (aria-valuetext). onValueChange, onValueCommit and the form value still get the plain numbers.",
      table: { defaultValue: { summary: "(value) => String(value)" } },
    },
    showTicks: {
      control: "boolean",
      description: "Shows a small tick mark at every tickInterval between min and max.",
      table: { defaultValue: { summary: "false" } },
    },
    tickInterval: {
      control: "number",
      description: "The spacing between tick marks, in the same units as value. Only meaningful when showTicks is set.",
      table: { defaultValue: { summary: "step" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables both thumbs natively.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling it live has no visible feedback.
    autoFocus: {
      ...noControls,
      description: "Focuses the lower thumb automatically on mount. Use sparingly.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description:
        "Form field name — inside a real <form>, the slider submits two values under name[], the lower then the upper, through hidden native inputs.",
    },
    // `control: false` — only meaningful paired with a real <form> whose id it points to.
    form: { ...noControls, description: "Associates the slider with a <form> by id." },
    labels: {
      ...noControls,
      description:
        "The text the component supplies itself; any you leave out keeps its English default. Keys: minimum (what the lower thumb is called, added to the slider's own name; default \"Minimum\"), maximum (the upper thumb; default \"Maximum\") and range (the text of the showValue label, given the plain lower and upper values; default \"20 – 80\" style, written with formatNumber).",
    },
    "aria-label": {
      control: "text",
      description: "Names the slider when there's no visible label. Each thumb adds Minimum or Maximum to it.",
    },
    "aria-labelledby": {
      ...noControls,
      description: "The id of an already-visible element that names the slider, in place of aria-label.",
    },
    "aria-describedby": {
      ...noControls,
      description: "The id of a helper or error message for this slider, announced with both thumbs.",
    },
    id: {
      ...noControls,
      description: "Standard DOM id, applied to the lower thumb; the upper thumb's is this with -maximum added.",
    },
    className: { ...noControls, description: "Additional CSS classes for customization. Applies to the slider control itself." },
    style: {
      ...noControls,
      description: "Inline styles, merged onto the component's own internal styles. Set an explicit height here for orientation=\"vertical\".",
    },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the slider's own root element." },
  },
  // Every controllable prop gets an explicit value here, matching its real component default.
  args: {
    size: "md",
    hasError: false,
    lowerStart: 20,
    upperStart: 80,
    min: 0,
    max: 100,
    step: 1,
    minStepsBetweenThumbs: 0,
    orientation: "horizontal",
    inverted: false,
    dir: "ltr",
    showValue: false,
    showValueTooltip: false,
    showMinMaxLabels: false,
    showTicks: false,
    // Deliberately not `1` (the real default, `tickInterval = step`, with `step` also `1`): a literal `1` across
    // this 0–100 range would draw 100 unreadable ticks the moment `showTicks` is toggled on.
    tickInterval: 10,
    disabled: false,
    name: "",
    "aria-label": "Price",
    onValueChange: fn(),
    onValueCommit: fn(),
  },
  // A vertical slider needs a height, and a range that changes underneath the uncontrolled state (the two
  // "start" controls, `min`, `max`) needs a fresh instance to take effect.
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={args.orientation === "vertical" ? { height: "12rem" } : { maxWidth: "20rem" }}>
      <RangeSlider
        key={`${lowerStart}-${upperStart}-${args.min}-${args.max}`}
        {...args}
        defaultValue={[lowerStart, upperStart]}
        style={args.orientation === "vertical" ? { height: "100%" } : undefined}
      />
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => rangeSliderPlaygroundSnippet(context.args),
    },
  },
};

// Options a Playground-only story hides from its own Controls: the pair of "start" numbers can't be edited
// once a story pins its own range.
const pinnedRange = { lowerStart: noControls, upperStart: noControls };

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: rangeSliderSnippets.allSizes } } },
  // `size` is the whole point of this grid — each instance intentionally varies it. Everything else stays live.
  argTypes: { size: noControls },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", maxWidth: "20rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <RangeSlider key={size} {...args} size={size} defaultValue={[lowerStart, upperStart]} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Vertical: Story = {
  parameters: playgroundSource,
  args: { orientation: "vertical" },
  argTypes: { orientation: noControls },
};

export const WithValue: Story = {
  name: "With the live range shown",
  parameters: playgroundSource,
  args: { showValue: true },
  argTypes: { showValue: noControls },
};

export const WithValueTooltip: Story = {
  name: "With a value tooltip on each thumb",
  parameters: playgroundSource,
  args: { showValueTooltip: true },
  argTypes: { showValueTooltip: noControls },
};

export const WithMinMaxLabels: Story = {
  name: "With min/max labels",
  parameters: playgroundSource,
  args: { showMinMaxLabels: true },
  argTypes: { showMinMaxLabels: noControls },
};

export const WithTicks: Story = {
  name: "With tick marks",
  parameters: playgroundSource,
  args: { showTicks: true, tickInterval: 10 },
  argTypes: { showTicks: noControls, tickInterval: noControls },
};

export const KeepingThumbsApart: Story = {
  name: "Keeping the thumbs apart",
  parameters: { docs: { source: { code: rangeSliderSnippets.minGap } } },
  args: { min: 0, max: 100, step: 2, lowerStart: 30, upperStart: 60, minStepsBetweenThumbs: 5, showValue: true },
  argTypes: { min: noControls, max: noControls, step: noControls, minStepsBetweenThumbs: noControls, showValue: noControls, ...pinnedRange },
};

export const FullyDecorated: Story = {
  name: "Every decoration combined",
  parameters: playgroundSource,
  args: { showValue: true, showValueTooltip: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25 },
  argTypes: {
    showValue: noControls,
    showValueTooltip: noControls,
    showMinMaxLabels: noControls,
    showTicks: noControls,
    tickInterval: noControls,
  },
};

export const VerticalWithMinMaxLabels: Story = {
  name: "Vertical, with the range and min/max labels",
  parameters: playgroundSource,
  args: { orientation: "vertical", showValue: true, showMinMaxLabels: true },
  argTypes: { orientation: noControls, showValue: noControls, showMinMaxLabels: noControls },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ height: "12rem", paddingInlineStart: "var(--dbm-space-6)" }}>
      <RangeSlider {...args} defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
    </div>
  ),
};

export const PriceRange: Story = {
  name: "Numbers with a unit or in your own locale",
  parameters: { docs: { source: { code: rangeSliderSnippets.price } } },
  // Two fixed examples — a unit and a locale's numerals — so the range, formatter and display props are pinned
  // per instance rather than controllable. `size`, `disabled`, `hasError` and the rest stay live.
  argTypes: {
    formatNumber: noControls,
    showValue: noControls,
    showValueTooltip: noControls,
    showMinMaxLabels: noControls,
    min: noControls,
    max: noControls,
    step: noControls,
    orientation: noControls,
    "aria-label": noControls,
    ...pinnedRange,
  },
  render: ({ lowerStart: _lower, upperStart: _upper, ...args }) => {
    const arabic = new Intl.NumberFormat("ar-EG");
    const shared = { ...args, orientation: "horizontal" as const, showValue: true, showMinMaxLabels: true, showValueTooltip: false };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxWidth: "20rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            A unit
          </Text>
          <RangeSlider {...shared} aria-label="Price" min={0} max={500} step={10} defaultValue={[100, 300]} formatNumber={(value) => `$${value}`} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            Arabic-Indic digits (ar-EG)
          </Text>
          <RangeSlider {...shared} aria-label="Weight, Arabic digits" min={0} max={100} step={1} defaultValue={[20, 80]} formatNumber={arabic.format} />
        </div>
      </div>
    );
  },
};

export const WithVisibleLabel: Story = {
  name: "With a visible label and helper text",
  parameters: { docs: { source: { code: rangeSliderSnippets.labelled } } },
  argTypes: { "aria-label": noControls, "aria-labelledby": noControls, "aria-describedby": noControls, labels: noControls, ...pinnedRange },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "20rem" }}>
      <FieldLabel id="price-label">Price</FieldLabel>
      <RangeSlider
        {...args}
        aria-label={undefined}
        aria-labelledby="price-label"
        aria-describedby="price-help"
        defaultValue={[lowerStart, upperStart]}
        labels={{ minimum: "From", maximum: "To" }}
      />
      <FieldHelperText id="price-help">Between 0 and 100</FieldHelperText>
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: playgroundSource,
  args: { dir: "rtl", showValue: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25 },
  argTypes: {
    dir: noControls,
    showValue: noControls,
    showMinMaxLabels: noControls,
    showTicks: noControls,
    tickInterval: noControls,
  },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: playgroundSource,
  args: { hasError: true },
};

export const Disabled: Story = {
  parameters: playgroundSource,
  args: { disabled: true },
};

export const Controlled: Story = {
  name: "Controlled, with onValueCommit for an expensive operation",
  parameters: { docs: { source: { code: rangeSliderSnippets.controlled } } },
  // `value`/`onValueChange` are driven by this story's own local state; `size`/`hasError`/`disabled` still
  // stay live via `{...args}`.
  argTypes: { onValueChange: noControls, onValueCommit: noControls, ...pinnedRange },
  render: function ControlledStory({ lowerStart: _lower, upperStart: _upper, ...args }) {
    const [range, setRange] = useState<RangeSliderValue>([20, 80]);
    const [committed, setCommitted] = useState<RangeSliderValue>([20, 80]);
    return (
      <div style={{ maxWidth: "20rem" }}>
        <RangeSlider {...args} value={range} onValueChange={setRange} onValueCommit={setCommitted} />
        <p style={{ marginTop: "var(--dbm-space-2)", fontSize: "var(--dbm-font-size-sm)" }}>
          Live: {range[0]} – {range[1]} · Committed: {committed[0]} – {committed[1]}
        </p>
      </div>
    );
  },
};

export const InAForm: Story = {
  name: "In a form",
  parameters: { docs: { source: { code: rangeSliderSnippets.form } } },
  args: { name: "price" },
  argTypes: { name: noControls, ...pinnedRange },
  render: ({ lowerStart, upperStart, ...args }) => (
    <form style={{ maxWidth: "20rem" }} onSubmit={(event) => event.preventDefault()}>
      <RangeSlider {...args} defaultValue={[lowerStart, upperStart]} />
    </form>
  ),
};

// The interaction stories below are hidden from the sidebar and the Docs page (`!dev`) but still run as tests:
// a visible story that scripts its own keystrokes would animate on every open and settle somewhere unexpected
// (07-storybook-and-documentation-standards.md §5).

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const KeyboardInteraction: Story = {
  ...Playground,
  name: "Interaction: each thumb steps and jumps on its own",
  tags: ["!dev"],
  args: { lowerStart: 20, upperStart: 80 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const lower = canvas.getByRole("slider", { name: "Price Minimum" });
    const upper = canvas.getByRole("slider", { name: "Price Maximum" });

    lower.focus();
    await pause(400);
    await userEvent.keyboard("{ArrowRight}");
    await expect(lower).toHaveAttribute("aria-valuenow", "21");
    await expect(args.onValueChange).toHaveBeenLastCalledWith([21, 80]);
    await expect(args.onValueCommit).toHaveBeenLastCalledWith([21, 80]);

    // End goes to this thumb's own limit — the upper thumb, which Radix would have moved, stays where it is.
    await userEvent.keyboard("{End}");
    await expect(lower).toHaveAttribute("aria-valuenow", "80");
    await expect(upper).toHaveAttribute("aria-valuenow", "80");

    upper.focus();
    await userEvent.keyboard("{End}");
    await expect(upper).toHaveAttribute("aria-valuenow", "100");
    await expect(lower).toHaveAttribute("aria-valuenow", "80");

    await userEvent.keyboard("{Home}");
    await expect(upper).toHaveAttribute("aria-valuenow", "80");
  },
};

export const DisabledInteraction: Story = {
  ...Playground,
  name: "Interaction: disabled blocks keyboard input",
  tags: ["!dev"],
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const lower = within(canvasElement).getByRole("slider", { name: "Price Minimum" });
    lower.focus();
    await userEvent.keyboard("{ArrowRight}{Home}{End}");
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(lower).toHaveAttribute("aria-valuenow", "20");
  },
};

// jsdom can't lay anything out, so where the thumbs sit and what the filled range spans is measured here, in a
// real browser: each end of the fill must land inside its thumb, in every orientation. (Radix insets a thumb so
// it never overhangs the track, so a thumb's centre is a few pixels off the fill's exact edge — inside the
// thumb, not on its centre.)
const expectFillBetweenThumbs = async (root: HTMLElement, axis: "x" | "y") => {
  const fill = root.querySelector<HTMLElement>("[data-orientation][style*='left'], [data-orientation][style*='bottom'], [data-orientation][style*='right'], [data-orientation][style*='top']");
  await expect(fill).not.toBeNull();
  const along = (rect: DOMRect): [number, number] => (axis === "x" ? [rect.left, rect.right] : [rect.top, rect.bottom]);
  const [fillStart, fillEnd] = along((fill as HTMLElement).getBoundingClientRect());
  const [first, second] = within(root)
    .getAllByRole("slider")
    .map((thumb) => along(thumb.getBoundingClientRect()))
    .sort((a, b) => a[0] - b[0]) as [[number, number], [number, number]];
  const slack = 1;
  await expect(fillStart).toBeGreaterThanOrEqual(first[0] - slack);
  await expect(fillStart).toBeLessThanOrEqual(first[1] + slack);
  await expect(fillEnd).toBeGreaterThanOrEqual(second[0] - slack);
  await expect(fillEnd).toBeLessThanOrEqual(second[1] + slack);
  // The two thumbs are apart along the track, so the fill between them has a real length.
  await expect(second[0] - first[1]).toBeGreaterThan(20);
};

export const LayoutInteraction: Story = {
  ...Playground,
  name: "Interaction: the filled range runs between the two thumbs",
  tags: ["!dev"],
  args: { lowerStart: 20, upperStart: 80 },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", width: "20rem" }}>
      <div data-testid="horizontal">
        <RangeSlider {...args} aria-label="Horizontal" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div data-testid="inverted">
        <RangeSlider {...args} inverted aria-label="Inverted" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div data-testid="vertical" style={{ height: "10rem" }}>
        <RangeSlider {...args} orientation="vertical" aria-label="Vertical" defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectFillBetweenThumbs(canvas.getByTestId("horizontal"), "x");
    await expectFillBetweenThumbs(canvas.getByTestId("inverted"), "x");
    await expectFillBetweenThumbs(canvas.getByTestId("vertical"), "y");
  },
};

// Digits from a right-to-left script (Arabic-Indic) pull the dash between two of them into a right-to-left run,
// so without the isolates around each number a left-to-right page draws the range backwards. Only a real
// browser lays text out, so the order is measured here: the lower number sits to the left of the upper.
export const LocaleOrderInteraction: Story = {
  ...Playground,
  name: "Interaction: the range reads lower to upper in a left-to-right page, in any script",
  tags: ["!dev"],
  args: { lowerStart: 20, upperStart: 80, showValue: true },
  render: ({ lowerStart, upperStart, ...args }) => (
    <RangeSlider {...args} defaultValue={[lowerStart, upperStart]} formatNumber={new Intl.NumberFormat("ar-EG").format} />
  ),
  play: async ({ canvasElement }) => {
    const arabic = new Intl.NumberFormat("ar-EG");
    const low = arabic.format(20);
    const high = arabic.format(80);
    // The digits really are Arabic-Indic: the test would pass for any input if the formatter did nothing.
    await expect(low).not.toBe("20");
    const label = Array.from(canvasElement.querySelectorAll("*")).find(
      (element) => element.children.length === 0 && element.textContent?.includes(low) && element.textContent.includes(high),
    );
    await expect(label).toBeDefined();
    const textNode = (label as HTMLElement).firstChild as Text;
    const text = textNode.data;
    const leftOf = (needle: string) => {
      const start = text.indexOf(needle);
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, start + needle.length);
      return range.getBoundingClientRect().left;
    };
    await expect(leftOf(low)).toBeLessThan(leftOf(high));
  },
};

// Each thumb's pointer and touch target must be at least 24 x 24px (WCAG 2.5.8) however small it is drawn (12, 16
// and 20px at xs, sm and md). jsdom does no hit-testing, so a point 11px from each thumb's centre, in each direction,
// must land on that thumb — measured here in a real browser, at every size and both orientations.
export const TargetSizeInteraction: Story = {
  ...Playground,
  name: "Interaction: each thumb's target is at least 24px at every size",
  tags: ["!dev"],
  args: { lowerStart: 20, upperStart: 80 },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", width: "20rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-testid={`horizontal-${size}`}>
          <RangeSlider {...args} size={size} aria-label={`Horizontal ${size}`} defaultValue={[lowerStart, upperStart]} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "var(--dbm-space-8)", height: "8rem" }}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <div key={size} data-testid={`vertical-${size}`} style={{ height: "100%" }}>
            <RangeSlider {...args} size={size} orientation="vertical" aria-label={`Vertical ${size}`} defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
          </div>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const orientation of ["horizontal", "vertical"] as const) {
      for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
        for (const thumb of within(canvas.getByTestId(`${orientation}-${size}`)).getAllByRole("slider")) {
          const rect = thumb.getBoundingClientRect();
          const centreX = rect.left + rect.width / 2;
          const centreY = rect.top + rect.height / 2;
          for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
            await expect(document.elementFromPoint(centreX + dx, centreY + dy)).toBe(thumb);
          }
        }
      }
    }
  },
};

// The range text reserves the width of the widest range it can show, so the track never changes size — or, in a
// vertical slider, shifts sideways — as either thumb goes from one digit to three. Only a real browser lays text
// out, so this measures the track with the thumbs at [20, 80], [0, 80], [0, 100] and [0, 99] and asserts it did not
// move or resize.
const trackBoxOf = (root: HTMLElement) => {
  const rect = (root.querySelector("[class*='track']") as HTMLElement).getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
};

export const StableTrackInteraction: Story = {
  ...Playground,
  name: "Interaction: the track does not resize or shift as the range gains digits",
  tags: ["!dev"],
  args: { lowerStart: 5, upperStart: 50 },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", width: "20rem" }}>
      <div data-testid="horizontal-value">
        <RangeSlider {...args} showValue aria-label="Horizontal, value" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div data-testid="horizontal-both">
        <RangeSlider {...args} showValue showMinMaxLabels aria-label="Horizontal, value and labels" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div style={{ display: "flex", gap: "var(--dbm-space-16)", height: "10rem", paddingBlockEnd: "var(--dbm-space-16)" }}>
        <div data-testid="vertical-value" style={{ height: "100%" }}>
          <RangeSlider {...args} orientation="vertical" showValue aria-label="Vertical, value" defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
        </div>
        <div data-testid="vertical-both" style={{ height: "100%" }}>
          <RangeSlider {...args} orientation="vertical" showValue showMinMaxLabels aria-label="Vertical, value and labels" defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ["horizontal-value", "horizontal-both", "vertical-value", "vertical-both"]) {
      const root = canvas.getByTestId(id);
      const before = trackBoxOf(root);
      const measure = async () => {
        const after = trackBoxOf(root);
        // Sub-pixel rounding only: an extra digit used to cost the track 8px or more, or shift a vertical one.
        await expect(Math.abs(after.width - before.width)).toBeLessThan(0.5);
        await expect(Math.abs(after.height - before.height)).toBeLessThan(0.5);
        await expect(Math.abs(after.left - before.left)).toBeLessThan(0.5);
        await expect(Math.abs(after.top - before.top)).toBeLessThan(0.5);
      };
      const [lower, upper] = within(root).getAllByRole("slider") as [HTMLElement, HTMLElement];
      lower.focus();
      await userEvent.keyboard("{Home}");
      await measure();
      upper.focus();
      await userEvent.keyboard("{End}");
      await measure();
      await userEvent.keyboard("{ArrowLeft}");
      await expect(upper).toHaveAttribute("aria-valuenow", "99");
      await measure();
      // The label's text starts at the label's own start edge beside a horizontal track, and is centred under a
      // vertical one — however much wider the reserved width is than the text.
      const valueLabel = root.querySelector<HTMLElement>("[data-sizer]") as HTMLElement;
      const textNode = valueLabel.firstChild as Text;
      const textRange = document.createRange();
      textRange.selectNodeContents(textNode);
      const text = textRange.getBoundingClientRect();
      const box = valueLabel.getBoundingClientRect();
      if (id.startsWith("horizontal")) {
        await expect(Math.abs(text.left - box.left)).toBeLessThan(1);
      } else {
        await expect(Math.abs(text.left + text.width / 2 - (box.left + box.width / 2))).toBeLessThan(1);
      }
    }
  },
};

// Right to left is measured in a real browser: the layout is inline positions and translates, which jsdom lays out
// none of. `dir="rtl"` must mirror the whole slider — the minimum at the right, so the lower thumb is the
// right-hand one, with the filled range between the thumbs, the ticks and labels on the mirrored sides and each
// thumb's invisible target still centred on it — and, left out inside a right-to-left page, the slider and its
// labels must stay left-to-right and agree with each other.
const centreOfX = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

export const RightToLeftInteraction: Story = {
  ...Playground,
  name: "Interaction: dir=rtl mirrors the slider, and left out it stays left-to-right",
  tags: ["!dev"],
  args: { lowerStart: 20, upperStart: 80 },
  render: ({ lowerStart, upperStart, ...args }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", width: "20rem" }}>
      <div data-testid="rtl-horizontal">
        <RangeSlider {...args} dir="rtl" showValue showMinMaxLabels showTicks tickInterval={25} aria-label="RTL" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div data-testid="ltr-horizontal">
        <RangeSlider {...args} showMinMaxLabels showTicks tickInterval={25} aria-label="LTR" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div dir="rtl" data-testid="ltr-in-rtl-page">
        <RangeSlider {...args} showMinMaxLabels showTicks tickInterval={25} aria-label="LTR in an RTL page" defaultValue={[lowerStart, upperStart]} />
      </div>
      <div style={{ display: "flex", gap: "var(--dbm-space-16)", height: "10rem", paddingBlockEnd: "var(--dbm-space-16)" }}>
        <div data-testid="rtl-vertical" style={{ height: "100%" }}>
          <RangeSlider {...args} dir="rtl" orientation="vertical" showMinMaxLabels showTicks tickInterval={25} aria-label="RTL vertical" defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
        </div>
        <div data-testid="ltr-vertical" style={{ height: "100%" }}>
          <RangeSlider {...args} orientation="vertical" showMinMaxLabels showTicks tickInterval={25} aria-label="LTR vertical" defaultValue={[lowerStart, upperStart]} style={{ height: "100%" }} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parts = (id: string) => {
      const root = canvas.getByTestId(id);
      const [lower, upper] = within(root).getAllByRole("slider") as [HTMLElement, HTMLElement];
      return {
        root,
        track: root.querySelector("[class*='track']") as HTMLElement,
        lower,
        upper,
        minLabel: within(root).getByText("0"),
        maxLabel: within(root).getByText("100"),
        ticks: Array.from(root.querySelectorAll("[class*='tick']")),
      };
    };

    // Mirrored: the lower thumb (20) is the right-hand one, "0" is right of "100", and the ticks (25, 50, 75) run
    // right to left with the middle one on the track's centre; the fill still runs between the thumbs.
    const rtl = parts("rtl-horizontal");
    await expect(centreOfX(rtl.lower)).toBeGreaterThan(centreOfX(rtl.upper));
    await expect(centreOfX(rtl.minLabel)).toBeGreaterThan(centreOfX(rtl.maxLabel));
    await expect(centreOfX(rtl.ticks[0] as Element)).toBeGreaterThan(centreOfX(rtl.ticks[1] as Element));
    await expect(Math.abs(centreOfX(rtl.ticks[1] as Element) - centreOfX(rtl.track))).toBeLessThan(1.5);
    await expectFillBetweenThumbs(rtl.root, "x");
    const valueLabel = rtl.root.querySelector("[data-sizer]") as HTMLElement;
    await expect(valueLabel.getBoundingClientRect().right).toBeLessThanOrEqual(rtl.track.getBoundingClientRect().left + 1);
    for (const thumb of [rtl.lower, rtl.upper]) {
      const rect = thumb.getBoundingClientRect();
      for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
        await expect(document.elementFromPoint(rect.left + rect.width / 2 + dx, rect.top + rect.height / 2 + dy)).toBe(thumb);
      }
    }

    // Left-to-right, and left out inside a right-to-left page: the same left-to-right layout in both.
    for (const id of ["ltr-horizontal", "ltr-in-rtl-page"]) {
      const ltr = parts(id);
      await expect(centreOfX(ltr.lower)).toBeLessThan(centreOfX(ltr.upper));
      await expect(centreOfX(ltr.minLabel)).toBeLessThan(centreOfX(ltr.maxLabel));
      await expect(centreOfX(ltr.ticks[0] as Element)).toBeLessThan(centreOfX(ltr.ticks[1] as Element));
      await expect(Math.abs(centreOfX(ltr.ticks[1] as Element) - centreOfX(ltr.track))).toBeLessThan(1.5);
    }

    // Vertical, both directions: the labels and the ticks are centred over the track, not half their width off.
    for (const id of ["rtl-vertical", "ltr-vertical"]) {
      const vertical = parts(id);
      const trackCentre = centreOfX(vertical.track);
      await expect(Math.abs(centreOfX(vertical.minLabel) - trackCentre)).toBeLessThan(1.5);
      await expect(Math.abs(centreOfX(vertical.maxLabel) - trackCentre)).toBeLessThan(1.5);
      for (const tick of vertical.ticks) await expect(Math.abs(centreOfX(tick) - trackCentre)).toBeLessThan(1.5);
    }
  },
};
