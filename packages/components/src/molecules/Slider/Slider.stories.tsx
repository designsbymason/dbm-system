import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Text } from "../../atoms/Text";
import { Slider } from "./Slider";
import { sliderPlaygroundSnippet, sliderSnippets } from "./Slider.snippets";

const meta: Meta<typeof Slider> = {
  title: "Molecules/Inputs/Slider",
  component: Slider,
  parameters: { layout: "padded" },
  // Ordered core visual props first, then behavioral/state props, then
  // advanced/escape-hatch props last — same sequencing principle as every
  // other component's own stories file (07-storybook-and-documentation-
  // standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Thumb diameter and track thickness, matching the shared size scale.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the slider as invalid, visually and via aria-invalid.",
    },
    // `control: false` — driving `value` from Controls without a real
    // `onValueChange` wired back would freeze the slider, same reasoning as
    // Switch's own `checked`. The Playground demonstrates the uncontrolled
    // path via `defaultValue` instead.
    value: { control: false, description: "The controlled value, as a real number." },
    defaultValue: {
      control: "number",
      description: "The initial value when uncontrolled. Defaults to min when omitted.",
    },
    onValueChange: {
      control: false,
      description: "Called continuously with the new value while dragging or stepping.",
    },
    onValueCommit: {
      control: false,
      description: "Called once, with the final value, when the user finishes interacting.",
    },
    min: { control: "number", description: "The minimum allowed value." },
    max: { control: "number", description: "The maximum allowed value." },
    step: { control: "number", description: "The increment each arrow-key press changes the value by." },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Lays the slider out horizontally or vertically.",
    },
    inverted: {
      control: "boolean",
      description: "Reverses which end of the track represents the minimum.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction: rtl mirrors the slider for right-to-left languages — the minimum at the right, the fill, thumbs and ticks running from there, ArrowLeft raising the value, and the value and min/max labels on the mirrored sides. Passed through to Radix Slider. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    showValue: {
      control: "boolean",
      description: "Shows the current numeric value as live text next to the slider.",
    },
    showValueTooltip: {
      control: "boolean",
      description: "Shows the current value in a tooltip above the thumb while hovering, dragging, or focused.",
    },
    showMinMaxLabels: {
      control: "boolean",
      description: "Shows min and max as text labels at each end of the track.",
    },
    formatNumber: {
      control: false,
      description:
        "How a number is written where the slider shows one — the current value (showValue, showValueTooltip) and the min and max labels (showMinMaxLabels) — for a language or region whose numerals or digit grouping differ from the plain 5 and 1234, or to add a unit (50%, $50): given a number, returns the text to show. It also becomes what assistive tech announces (aria-valuetext) unless you pass an aria-valuetext of your own, which wins everywhere, so what is shown and what is announced always agree. For example new Intl.NumberFormat(\"ar-EG\").format shows ٥٠. onValueChange, onValueCommit and the form value still get the plain number.",
      table: { defaultValue: { summary: "(value) => String(value)" } },
    },
    showTicks: {
      control: "boolean",
      description: "Shows a small tick mark at every tickInterval between min and max.",
    },
    tickInterval: {
      control: "number",
      description: "The spacing between tick marks, in the same units as value. Only meaningful when showTicks is set.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the slider natively.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the slider's thumb automatically on mount. Use sparingly.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description:
        "Form field name — when set inside a real <form>, Radix renders a hidden native input for real form submission.",
    },
    // `control: false` — only meaningful paired with a real <form> whose id
    // it points to, which the Playground's own plain demo doesn't have.
    form: {
      control: false,
      description: "Associates the slider with a <form> by id.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible label announced by assistive tech when there's no visible label (e.g. no paired FieldLabel).",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    "aria-describedby": {
      control: false,
      description:
        "Points to the id of a helper or error message associated with this slider.",
    },
    "aria-valuetext": {
      control: "text",
      description: "A human-readable alternative to the raw numeric value announced by assistive tech.",
    },
    id: {
      control: false,
      description: "Standard DOM id, applied to the slider's own root element.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization. Applies to the slider control itself.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles. Set an explicit height here for orientation=\"vertical\".",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    size: "md",
    hasError: false,
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    orientation: "horizontal",
    inverted: false,
    dir: "ltr",
    showValue: false,
    showValueTooltip: false,
    showMinMaxLabels: false,
    showTicks: false,
    // Deliberately not `1` (the component's real default, `tickInterval =
    // step`, with `step` also `1` here) — a literal `1` across this
    // Playground's 0–100 range would render 100 unreadable ticks the moment
    // `showTicks` is toggled on, a bad demo default even though it's the
    // technically "real" one. `10` is a sensible non-blank demo value for
    // this specific prop instead (07-storybook-and-documentation-
    // standards.md §5's own carve-out for props with no single literal
    // default worth matching).
    tickInterval: 10,
    disabled: false,
    name: "",
    "aria-label": "Volume",
    "aria-valuetext": "",
    onValueChange: fn(),
    onValueCommit: fn(),
  },
  // Gives the canvas a real height once `orientation` is switched to
  // "vertical" via the Controls panel — `Slider` itself now floors at a
  // reasonable default height with zero sizing at all (found
  // user-reported: toggling orientation here previously showed only the
  // thumb), but a taller, explicit demo height still reads better live.
  render: (args) => (
    <div
      style={
        args.orientation === "vertical"
          ? { height: "12rem" }
          : { maxWidth: "16rem" }
      }
    >
      <Slider {...args} style={args.orientation === "vertical" ? { height: "100%" } : undefined} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Slider>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: sliderSnippets.allSizes } } },
  // `size` is the whole point of this grid — each instance intentionally
  // varies it, so no single control value could represent them.
  // `hasError`/`disabled` still stay live and shared via `{...args}`.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-5)",
        maxWidth: "16rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Slider key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Vertical: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { orientation: "vertical" },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ height: "12rem" }}>
      <Slider {...args} style={{ height: "100%" }} />
    </div>
  ),
};

export const WithValue: Story = {
  name: "With the live value shown",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { showValue: true },
  argTypes: { showValue: { control: false } },
};

export const WithValueTooltip: Story = {
  name: "With a value tooltip",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { showValueTooltip: true },
  argTypes: { showValueTooltip: { control: false } },
};

export const WithMinMaxLabels: Story = {
  name: "With min/max labels",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { showMinMaxLabels: true },
  argTypes: { showMinMaxLabels: { control: false } },
};

export const LocalisedNumbers: Story = {
  name: "Numbers in your own locale",
  parameters: { docs: { source: { code: sliderSnippets.locale } } },
  // Three fixed examples — a locale's numerals, a unit, and a locale's decimal separator — so the value, range,
  // label, `formatNumber` and the display props are pinned per instance rather than controllable. `size`,
  // `disabled`, `hasError` and the rest stay live and shared via `{...args}`.
  argTypes: {
    formatNumber: { control: false },
    showValue: { control: false },
    showValueTooltip: { control: false },
    showMinMaxLabels: { control: false },
    defaultValue: { control: false },
    min: { control: false },
    max: { control: false },
    step: { control: false },
    orientation: { control: false },
    "aria-label": { control: false },
    "aria-valuetext": { control: false },
  },
  render: (args) => {
    const arabic = new Intl.NumberFormat("ar-EG");
    const german = new Intl.NumberFormat("de-DE");
    const shared = { ...args, orientation: "horizontal" as const, showValue: true, showMinMaxLabels: true, showValueTooltip: false, "aria-valuetext": undefined };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxWidth: "16rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            Arabic-Indic digits (ar-EG)
          </Text>
          <Slider {...shared} aria-label="Volume, Arabic digits" defaultValue={50} min={0} max={100} step={1} formatNumber={arabic.format} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            A unit
          </Text>
          <Slider {...shared} aria-label="Opacity, as a percentage" defaultValue={60} min={0} max={100} step={5} formatNumber={(value) => `${value}%`} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            Decimal separator (de-DE)
          </Text>
          <Slider {...shared} aria-label="Ratio, German decimals" defaultValue={0.5} min={0} max={1} step={0.1} formatNumber={german.format} />
        </div>
      </div>
    );
  },
};

export const WithTicks: Story = {
  name: "With tick marks",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { showTicks: true, tickInterval: 10 },
  argTypes: { showTicks: { control: false }, tickInterval: { control: false } },
};

export const FullyDecorated: Story = {
  name: "Every decoration combined",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    showValue: true,
    showValueTooltip: true,
    showMinMaxLabels: true,
    showTicks: true,
    tickInterval: 25,
  },
  argTypes: {
    showValue: { control: false },
    showValueTooltip: { control: false },
    showMinMaxLabels: { control: false },
    showTicks: { control: false },
    tickInterval: { control: false },
  },
};

export const VerticalWithMinMaxLabels: Story = {
  name: "Vertical, with min/max labels",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { orientation: "vertical", showMinMaxLabels: true },
  argTypes: { orientation: { control: false }, showMinMaxLabels: { control: false } },
  render: (args) => (
    <div style={{ height: "12rem", paddingInlineStart: "var(--dbm-space-6)" }}>
      <Slider {...args} style={{ height: "100%" }} />
    </div>
  ),
};

export const CustomRange: Story = {
  name: "Custom min/max/step",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { min: -10, max: 10, step: 5, defaultValue: 0, showValue: true },
  argTypes: { min: { control: false }, max: { control: false }, step: { control: false } },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { hasError: true, defaultValue: 20 },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true, defaultValue: 50 },
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => sliderPlaygroundSnippet(context.args),
      },
    },
  },
  args: { dir: "rtl", defaultValue: 20, showValue: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25 },
  argTypes: {
    dir: { control: false },
    showValue: { control: false },
    showMinMaxLabels: { control: false },
    showTicks: { control: false },
    tickInterval: { control: false },
  },
};

export const Controlled: Story = {
  name: "Controlled, with onValueCommit for an expensive operation",
  parameters: { docs: { source: { code: sliderSnippets.controlled } } },
  // `value`/`onValueChange` are driven by this story's own local state (the
  // whole point of the demo) — but `size`/`hasError`/`disabled` are still
  // meaningful to preview here and stay live via `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, same
  // controlled/uncontrolled-conflict fix as every other component's own
  // Controlled/Clearable story — this story sets its own controlled
  // `value` below.
  args: { defaultValue: undefined },
  argTypes: {
    defaultValue: { control: false },
    onValueChange: { control: false },
    onValueCommit: { control: false },
  },
  render: function ControlledStory(args) {
    const [value, setValue] = useState(50);
    const [committedValue, setCommittedValue] = useState(50);
    return (
      <div style={{ maxWidth: "16rem" }}>
        <Slider {...args} value={value} onValueChange={setValue} onValueCommit={setCommittedValue} />
        <p style={{ marginTop: "var(--dbm-space-2)", fontSize: "var(--dbm-font-size-sm)" }}>
          Live: {value} · Committed: {committedValue}
        </p>
      </div>
    );
  },
};

export const KeyboardInteraction: Story = {
  name: "Interaction: arrow keys step, Home/End jump to the extremes",
  args: { defaultValue: 50 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");

    // Purely for human legibility when watching this replay in the
    // Interactions panel — the assertions themselves need none of these
    // pauses (same pattern as NumberInput's/SearchInput's own interaction
    // stories).
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    slider.focus();
    await pause(500);

    await userEvent.keyboard("{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuenow", "51");
    await expect(args.onValueChange).toHaveBeenCalledWith(51);
    await expect(args.onValueCommit).toHaveBeenCalledWith(51);
    await pause(500);

    await userEvent.keyboard("{End}");
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
    await pause(500);

    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await pause(600);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks keyboard input",
  args: { disabled: true, defaultValue: 50 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await pause(500);
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(slider).toHaveAttribute("aria-valuenow", "50");
    await pause(800);
  },
};

// The thumb is drawn 12, 16 and 20px at xs, sm and md, but its pointer and touch target must be at least 24 x 24px
// (WCAG 2.5.8). jsdom does no hit-testing, so this is measured in a real browser: a point 11px from the thumb's
// centre, in each direction, must land on the thumb — at every size, both orientations.
export const TargetSizeInteraction: Story = {
  name: "Interaction: the thumb's target is at least 24px at every size",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", width: "16rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-testid={`horizontal-${size}`}>
          <Slider aria-label={`Horizontal ${size}`} size={size} defaultValue={50} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "var(--dbm-space-8)", height: "8rem" }}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <div key={size} data-testid={`vertical-${size}`} style={{ height: "100%" }}>
            <Slider aria-label={`Vertical ${size}`} size={size} orientation="vertical" defaultValue={50} style={{ height: "100%" }} />
          </div>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const orientation of ["horizontal", "vertical"] as const) {
      for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
        const thumb = within(canvas.getByTestId(`${orientation}-${size}`)).getByRole("slider");
        const rect = thumb.getBoundingClientRect();
        const centreX = rect.left + rect.width / 2;
        const centreY = rect.top + rect.height / 2;
        for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
          const hit = document.elementFromPoint(centreX + dx, centreY + dy);
          await expect(hit).toBe(thumb);
        }
      }
    }
  },
};

// The value label reserves the width of the widest value it can show, so the track never changes size — or, in a
// vertical slider, shifts sideways — as the value goes from one digit to three. Only a real browser lays text out,
// so this measures the track at 5, 0, 100 and 99 and asserts it did not move or resize.
const trackBox = (root: HTMLElement) => {
  const rect = (root.querySelector("[class*='track']") as HTMLElement).getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
};

export const StableTrackInteraction: Story = {
  name: "Interaction: the track does not resize or shift as the value gains digits",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", width: "16rem" }}>
      <div data-testid="horizontal-value">
        <Slider aria-label="Horizontal, value" defaultValue={5} showValue />
      </div>
      <div data-testid="horizontal-both">
        <Slider aria-label="Horizontal, value and labels" defaultValue={5} showValue showMinMaxLabels />
      </div>
      <div style={{ display: "flex", gap: "var(--dbm-space-16)", height: "10rem", paddingBlockEnd: "var(--dbm-space-16)" }}>
        <div data-testid="vertical-value" style={{ height: "100%" }}>
          <Slider aria-label="Vertical, value" orientation="vertical" defaultValue={5} showValue style={{ height: "100%" }} />
        </div>
        <div data-testid="vertical-both" style={{ height: "100%" }}>
          <Slider aria-label="Vertical, value and labels" orientation="vertical" defaultValue={5} showValue showMinMaxLabels style={{ height: "100%" }} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ["horizontal-value", "horizontal-both", "vertical-value", "vertical-both"]) {
      const root = canvas.getByTestId(id);
      const thumb = within(root).getByRole("slider");
      const before = trackBox(root);
      thumb.focus();
      for (const key of ["{Home}", "{End}", "{ArrowLeft}"]) {
        await userEvent.keyboard(key);
        const after = trackBox(root);
        // Sub-pixel rounding only: one digit more used to cost the track 8px, or shift a vertical one by 4.
        await expect(Math.abs(after.width - before.width)).toBeLessThan(0.5);
        await expect(Math.abs(after.height - before.height)).toBeLessThan(0.5);
        await expect(Math.abs(after.left - before.left)).toBeLessThan(0.5);
        await expect(Math.abs(after.top - before.top)).toBeLessThan(0.5);
      }

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
      // End then one step back really did take the value through 100 to 99, not just leave it alone.
      await expect(thumb).toHaveAttribute("aria-valuenow", "99");
    }
  },
};

// Right to left is measured in a real browser: the layout is inline positions and translates, which jsdom lays out
// none of. `dir="rtl"` must mirror the whole slider — minimum at the right, ticks and labels on the mirrored sides,
// the thumb's hit area still centred on it — and, left out inside a right-to-left page, the slider and its labels
// must stay left-to-right and agree with each other.
const centreX = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

export const RightToLeftInteraction: Story = {
  name: "Interaction: dir=rtl mirrors the slider, and left out it stays left-to-right",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", width: "16rem" }}>
      <div data-testid="rtl-horizontal">
        <Slider aria-label="RTL" dir="rtl" defaultValue={20} showValue showMinMaxLabels showTicks tickInterval={25} />
      </div>
      <div data-testid="ltr-horizontal">
        <Slider aria-label="LTR" defaultValue={20} showMinMaxLabels showTicks tickInterval={25} />
      </div>
      <div dir="rtl" data-testid="ltr-in-rtl-page">
        <Slider aria-label="LTR in an RTL page" defaultValue={20} showMinMaxLabels showTicks tickInterval={25} />
      </div>
      <div style={{ display: "flex", gap: "var(--dbm-space-16)", height: "10rem", paddingBlockEnd: "var(--dbm-space-16)" }}>
        <div data-testid="rtl-vertical" style={{ height: "100%" }}>
          <Slider aria-label="RTL vertical" dir="rtl" orientation="vertical" defaultValue={20} showMinMaxLabels showTicks tickInterval={25} style={{ height: "100%" }} />
        </div>
        <div data-testid="ltr-vertical" style={{ height: "100%" }}>
          <Slider aria-label="LTR vertical" orientation="vertical" defaultValue={20} showMinMaxLabels showTicks tickInterval={25} style={{ height: "100%" }} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parts = (id: string) => {
      const root = canvas.getByTestId(id);
      const track = root.querySelector("[class*='track']") as HTMLElement;
      return {
        root,
        track,
        thumb: within(root).getByRole("slider"),
        minLabel: within(root).getByText("0"),
        maxLabel: within(root).getByText("100"),
        ticks: Array.from(root.querySelectorAll("[class*='tick']")),
      };
    };

    // Mirrored: the minimum is at the right, so a value of 20 sits right of centre, "0" is right of "100", and
    // the ticks (25, 50, 75) run right to left with the middle one on the track's centre.
    const rtl = parts("rtl-horizontal");
    await expect(centreX(rtl.thumb)).toBeGreaterThan(centreX(rtl.track));
    await expect(centreX(rtl.minLabel)).toBeGreaterThan(centreX(rtl.maxLabel));
    await expect(centreX(rtl.minLabel)).toBeGreaterThan(centreX(rtl.track));
    await expect(centreX(rtl.ticks[0] as Element)).toBeGreaterThan(centreX(rtl.ticks[1] as Element));
    await expect(centreX(rtl.ticks[1] as Element)).toBeGreaterThan(centreX(rtl.ticks[2] as Element));
    await expect(Math.abs(centreX(rtl.ticks[1] as Element) - centreX(rtl.track))).toBeLessThan(1.5);
    // The value label sits on the far side from where the track starts: to the left of a track that begins at the right.
    const valueLabel = rtl.root.querySelector("[data-sizer]") as HTMLElement;
    await expect(valueLabel.getBoundingClientRect().right).toBeLessThanOrEqual(rtl.track.getBoundingClientRect().left + 1);
    // The thumb's invisible 24px target is still centred on it, mirrored.
    const thumbRect = rtl.thumb.getBoundingClientRect();
    for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
      await expect(document.elementFromPoint(thumbRect.left + thumbRect.width / 2 + dx, thumbRect.top + thumbRect.height / 2 + dy)).toBe(rtl.thumb);
    }

    // Left-to-right, and left out inside a right-to-left page: the same left-to-right layout in both.
    for (const id of ["ltr-horizontal", "ltr-in-rtl-page"]) {
      const ltr = parts(id);
      await expect(centreX(ltr.thumb)).toBeLessThan(centreX(ltr.track));
      await expect(centreX(ltr.minLabel)).toBeLessThan(centreX(ltr.maxLabel));
      await expect(centreX(ltr.ticks[0] as Element)).toBeLessThan(centreX(ltr.ticks[1] as Element));
      await expect(Math.abs(centreX(ltr.ticks[1] as Element) - centreX(ltr.track))).toBeLessThan(1.5);
    }

    // Vertical, both directions: the labels and the ticks are centred over the track, not half their width off.
    for (const id of ["rtl-vertical", "ltr-vertical"]) {
      const vertical = parts(id);
      const trackCentre = centreX(vertical.track);
      await expect(Math.abs(centreX(vertical.minLabel) - trackCentre)).toBeLessThan(1.5);
      await expect(Math.abs(centreX(vertical.maxLabel) - trackCentre)).toBeLessThan(1.5);
      for (const tick of vertical.ticks) await expect(Math.abs(centreX(tick) - trackCentre)).toBeLessThan(1.5);
    }
  },
};
