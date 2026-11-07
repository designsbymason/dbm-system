import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card } from "../Card";
import { ScrollArea } from "./ScrollArea";
import { scrollAreaPlaygroundSnippet, scrollAreaSnippets } from "./ScrollArea.snippets";

// Real, educational sentences about ScrollArea itself — not placeholder copy — long enough
// (individually and combined) to genuinely overflow every demo below, including the tallest,
// widest ones. Grouped into paragraphs for the vertical-scroll demos (`educationalParagraphs`)
// and used one sentence per line for the horizontal/both-axis demos (`DemoLongLines`), so both
// demo styles share one real, single-sourced piece of writing instead of two disconnected ones.
const educationalSentences = [
  "Every browser and operating system draws its own native scrollbar a little differently, and most of them take up their own layout space all the time, whether or not there's anything to scroll.",
  "ScrollArea replaces that with one consistent, token-driven scrollbar that looks the same everywhere it renders, floating over its content instead of reserving space for itself.",
  "Wheel, trackpad, touch, and keyboard input all keep working exactly as they would with a native scrollbar — nothing about how someone actually scrolls changes.",
  "The scrollbar itself can fade in only on hover, only while actively scrolling, stay visible all the time, or appear only once there's genuinely something to scroll.",
  "The region becomes reachable by keyboard, and, once given an accessible name, announced as a landmark, only while its content actually overflows the space available to it.",
  "A short list that already fits doesn't pick up an extra, meaningless tab stop, and a long one that later shrinks below the fold loses that tab stop automatically.",
  "Overflow is measured live as content or the surrounding layout changes, never assumed once and left stale for the lifetime of the component.",
];

const educationalParagraphs = [
  educationalSentences.slice(0, 2).join(" "),
  educationalSentences.slice(2, 4).join(" "),
  educationalSentences.slice(4, 7).join(" "),
];

// ScrollArea itself adds no padding around its own content (an unopinionated wrapper, matching
// Box's own "bring your own presentation" default) — every demo below supplies its own, the same
// pattern a real consumer follows.
function DemoParagraphs() {
  return (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      {educationalParagraphs.map((paragraph, index) => (
        <p key={index} style={{ margin: 0, marginBlockStart: index === 0 ? 0 : "var(--dbm-space-4)" }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

// One sentence per line, `whiteSpace: "nowrap"` so a line never wraps onto the next — long enough,
// individually, to overflow horizontally at any reasonable canvas width, and with enough lines
// (seven) to also overflow a typical vertical constraint (e.g. the Playground's own 12rem default),
// so switching `scrollbars` to "both" shows genuine overflow on both axes without a separate,
// narrower demo.
function DemoLongLines() {
  return (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      {educationalSentences.map((sentence, index) => (
        <p key={index} style={{ margin: 0, marginBlockStart: index === 0 ? 0 : "var(--dbm-space-3)", whiteSpace: "nowrap" }}>
          {sentence}
        </p>
      ))}
    </div>
  );
}

const meta: Meta<typeof ScrollArea> = {
  title: "Molecules/Layout/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
  // Content prop first, then core visual props, then behavioral/state props, then
  // advanced/escape-hatch props last (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: { control: false, description: "The content to make scrollable." },
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description: "The region's own outer frame.",
      table: { defaultValue: { summary: "bordered" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Scrollbar track/thumb thickness.",
      table: { defaultValue: { summary: "md" } },
    },
    scrollbars: {
      control: "select",
      options: ["vertical", "horizontal", "both"],
      description: "Which scrollbar(s) to render, and which axis (or axes) actually scroll.",
      table: { defaultValue: { summary: "vertical" } },
    },
    showTrack: {
      control: "boolean",
      description: "Draws a visible track behind the thumb.",
      table: { defaultValue: { summary: "false" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand"],
      description: "The scrollbar's own color.",
      table: { defaultValue: { summary: "neutral" } },
    },
    scrollbarVisibility: {
      control: "select",
      options: ["auto", "always", "scroll", "hover"],
      description: "When the scrollbar(s) are visible.",
      table: { defaultValue: { summary: "hover" } },
    },
    scrollHideDelay: {
      control: "number",
      description:
        "How long, in milliseconds, a scrollbar stays visible after the pointer leaves or scrolling stops. Only meaningful for \"hover\"/\"scroll\".",
      table: { defaultValue: { summary: "600" } },
    },
    overscrollBehavior: {
      control: "select",
      options: ["auto", "contain"],
      description: "Whether scrolling past this region's own end chains onto whatever scrolls behind it.",
      table: { defaultValue: { summary: "auto" } },
    },
    maxHeight: {
      control: "text",
      description: "A shortcut for constraining the region's own block-axis size.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, passed to the underlying Radix primitive. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    onScroll: { control: false, description: "Fires on the actual scrolling element, not the outer frame." },
    viewportRef: { control: false, description: "A ref to the actual scrolling element." },
    "aria-label": { control: "text", description: "Accessible name for the scrollable region." },
    "aria-labelledby": { control: false, description: "Points to an existing element's id to use as the accessible name instead." },
    id: { control: false, description: "Standard DOM id, applied to the region's own outer frame." },
    className: { control: false, description: "Additional CSS classes for customization. Applies to the outer frame." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: {
    variant: "bordered",
    size: "md",
    scrollbars: "vertical",
    showTrack: false,
    tone: "neutral",
    scrollbarVisibility: "hover",
    scrollHideDelay: 600,
    overscrollBehavior: "auto",
    maxHeight: "12rem",
    dir: "ltr",
    "aria-label": "Scrollable content",
  },
};

export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => scrollAreaPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <ScrollArea {...args}>{args.scrollbars === "vertical" ? <DemoParagraphs /> : <DemoLongLines />}</ScrollArea>
  ),
};

export const Vertical: Story = {
  name: "Vertical (default)",
  parameters: { docs: { source: { code: scrollAreaSnippets.vertical } } },
  argTypes: { scrollbars: { control: false }, maxHeight: { control: false } },
  render: (args) => (
    <ScrollArea {...args} scrollbars="vertical">
      <DemoParagraphs />
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  name: "Horizontal",
  parameters: { docs: { source: { code: scrollAreaSnippets.horizontal } } },
  argTypes: { scrollbars: { control: false }, maxHeight: { control: false } },
  args: { maxHeight: undefined },
  render: (args) => (
    <ScrollArea {...args} scrollbars="horizontal">
      <DemoLongLines />
    </ScrollArea>
  ),
};

export const Both: Story = {
  name: "Both axes",
  parameters: { docs: { source: { code: scrollAreaSnippets.both } } },
  argTypes: { scrollbars: { control: false } },
  render: (args) => (
    <ScrollArea {...args} scrollbars="both">
      <DemoLongLines />
    </ScrollArea>
  ),
};

export const Ghost: Story = {
  name: "Ghost variant, embedded in a Card",
  parameters: { docs: { source: { code: scrollAreaSnippets.ghost } } },
  argTypes: { variant: { control: false } },
  render: (args) => (
    <Card style={{ maxWidth: "24rem" }}>
      <Card.Body>
        <ScrollArea {...args} variant="ghost" style={{ maxHeight: "10rem" }}>
          <DemoParagraphs />
        </ScrollArea>
      </Card.Body>
    </Card>
  ),
};

export const Sizes: Story = {
  parameters: { docs: { source: { code: scrollAreaSnippets.sizes } } },
  argTypes: {
    size: { control: false },
    scrollbarVisibility: { control: false },
    maxHeight: { control: false },
    "aria-label": { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)", flexWrap: "wrap" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <span style={{ fontSize: "var(--dbm-font-size-xs)", color: "var(--dbm-text-tertiary)" }}>{size}</span>
          <ScrollArea
            {...args}
            size={size}
            scrollbarVisibility="always"
            // Distinct per instance — five identically-named `role="region"` landmarks side by
            // side is a real WCAG/axe `landmark-unique` violation, found live by this exact story
            // once the Playground's shared `aria-label` default started reaching every story.
            aria-label={`Scrollable content, size ${size}`}
            style={{ maxHeight: "8rem", width: "12rem" }}
          >
            <DemoParagraphs />
          </ScrollArea>
        </div>
      ))}
    </div>
  ),
};

export const Tone: Story = {
  parameters: { docs: { source: { code: scrollAreaSnippets.tone } } },
  argTypes: {
    tone: { control: false },
    showTrack: { control: false },
    scrollbarVisibility: { control: false },
    "aria-label": { control: false },
  },
  // showTrack so the track's own tinted color (bg.brand-subtle for tone="brand") is visible too,
  // not just the thumb.
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)", flexWrap: "wrap" }}>
      {(["neutral", "brand"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <span style={{ fontSize: "var(--dbm-font-size-xs)", color: "var(--dbm-text-tertiary)" }}>{tone}</span>
          <ScrollArea
            {...args}
            tone={tone}
            showTrack
            scrollbarVisibility="always"
            aria-label={`Scrollable content, ${tone} tone`}
            style={{ maxHeight: "8rem", width: "14rem" }}
          >
            <DemoParagraphs />
          </ScrollArea>
        </div>
      ))}
    </div>
  ),
};

export const KeyboardScrollInteraction: Story = {
  name: "Overflowing content is a focusable, genuinely scrollable region — interaction test",
  tags: ["!dev"],
  args: { "aria-label": "Recent activity" },
  render: (args) => (
    <ScrollArea {...args} data-testid="scroll-area">
      <DemoParagraphs />
    </ScrollArea>
  ),
  // Doesn't assert that a simulated keypress actually moves `scrollTop`: confirmed live (against
  // both this component and a plain, unrelated `tabindex="0"; overflow: scroll` div in the same
  // browser) that this automated environment's synthetic key events don't trigger the browser's
  // own native default-action scrolling, even once genuinely focused — the same reason `Table`'s
  // own scroll-container tests never assert it either. A real user's Page Down/arrow keys do
  // scroll a focused, overflowing region; what's provable here is that it's reachable (tabindex),
  // focusable, and genuinely overflows (scrollHeight > clientHeight) — and that scrollTop, once
  // set, actually moves the content, proving the element really is the scrolling one.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "Recent activity" });
    expect(region).toHaveAttribute("tabindex", "0");
    region.focus();
    expect(region).toHaveFocus();
    expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    region.scrollTop = 50;
    expect(region.scrollTop).toBe(50);
  },
};

export const FitsNoTabStopInteraction: Story = {
  name: "Content that fits is not a keyboard tab stop — interaction test",
  tags: ["!dev"],
  render: (args) => (
    <ScrollArea {...args} maxHeight="20rem" data-testid="scroll-area">
      <p>Short content that fits comfortably.</p>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("scroll-area");
    const viewport = frame.querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).not.toHaveAttribute("tabindex");
    expect(viewport).not.toHaveAttribute("role");
  },
};
