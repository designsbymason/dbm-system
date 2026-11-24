import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CloseButton } from "./CloseButton";
import { closeButtonPlaygroundSnippet, closeButtonSnippets } from "./CloseButton.snippets";

const meta: Meta<typeof CloseButton> = {
  title: "Components/CloseButton",
  id: "atoms-inputs-closebutton",
  component: CloseButton,
  parameters: { layout: "padded" },
  // Ordered core visual props → behavioral/state props → advanced/
  // escape-hatch props last, the same sequencing principle the future
  // Properties table will use (guidelines/
  // 07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Controls the button's clickable box and its glyph together, as one step — matches IconButton's own size scale (box sized generously around the glyph, not a tight fit).",
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "white"],
      description:
        "The colour family of the icon and its hover fill: neutral (the default) or brand, which are IconButton's own tertiary colours at the same tone, or white, for a surface that is dark in every theme (icon.white, a translucent white hover, and with hasBackground a dark grounding layer).",
    },
    rounded: {
      control: "boolean",
      description:
        "Renders as a circle instead of the standard rounded-corner shape — matches IconButton's own rounded prop exactly.",
    },
    hasBackground: {
      control: "boolean",
      description:
        "Adds an optional translucent grounding layer behind the icon (white in light mode, a dark neutral in dark mode), for use over unpredictable external content (a photo, a busy hero image).",
    },
    "aria-label": {
      control: "text",
      description:
        'Accessible label, announced by assistive tech. Defaults to "Close" — override for context, e.g. "Dismiss notification".',
    },
    type: { control: "select", options: ["button", "submit", "reset"] },
    disabled: {
      description: "Disables the button natively.",
    },
    // A function prop was never meant to be live-editable (guidelines/
    // 07-storybook-and-documentation-standards.md §5) — set explicitly
    // rather than relying on inference, same guard every other reviewed
    // component's own onClick needed.
    onClick: { control: false },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead of aria-label.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set
    // of four (Button, IconButton, ProgressBar, Checkbox…).
    id: { control: false, description: "Standard DOM id." },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md
  // §5).
  args: {
    size: "md",
    tone: "neutral",
    rounded: false,
    hasBackground: false,
    "aria-label": "Close",
    type: "button",
    disabled: false,
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof CloseButton>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => closeButtonPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: closeButtonSnippets.allSizes } } },
  // `size` is the whole point of this grid, paired with `aria-label`
  // (fixed together per instance so each button keeps a distinct
  // accessible name) — no single control value could represent either
  // across five differently-sized instances. Every other prop (`rounded`,
  // `hasBackground`, `disabled`, …) stays live and shared via `{...args}`,
  // matching IconButton's own AllSizes precedent — previously this story
  // used a bare `render: () => (...)` that ignored args entirely, making
  // every control here a silent no-op (found in review).
  argTypes: {
    size: { control: false },
    "aria-label": { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <CloseButton
          key={size}
          {...args}
          aria-label={`Close (${size})`}
          size={size}
        />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: closeButtonSnippets.tones } } },
  // `tone` is the point of this pair, so it and `aria-label` are fixed per instance.
  argTypes: { tone: { control: false }, "aria-label": { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "center" }}>
      <CloseButton {...args} aria-label="Close (neutral)" tone="neutral" />
      <CloseButton {...args} aria-label="Close (brand)" tone="brand" />
    </div>
  ),
};

export const OnDarkSurface: Story = {
  name: "On a dark surface (tone white)",
  parameters: { docs: { source: { code: closeButtonSnippets.onDarkSurface } } },
  argTypes: { tone: { control: false }, hasBackground: { control: false }, "aria-label": { control: false } },
  // bg.overlay is neutral black in every theme: the surface `white` is for. The right-hand pair sits over a busy gradient, where
  // hasBackground gives the icon its own dark layer.
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      <div style={{ background: "var(--dbm-bg-overlay)", padding: "var(--dbm-space-4)", borderRadius: "var(--dbm-radius-md)" }}>
        <CloseButton {...args} aria-label="Close (white, on dark)" tone="white" />
      </div>
      <div
        style={{
          background: "linear-gradient(135deg, var(--dbm-bg-overlay), var(--dbm-bg-neutral))",
          padding: "var(--dbm-space-4)",
          borderRadius: "var(--dbm-radius-md)",
        }}
      >
        <CloseButton {...args} aria-label="Close (white, with hasBackground)" tone="white" hasBackground />
      </div>
    </div>
  ),
};

export const Rounded: Story = {
  name: "Rounded (circular)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => closeButtonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { rounded: true },
};

export const OnBusyBackground: Story = {
  name: "hasBackground, over unpredictable content",
  parameters: { docs: { source: { code: closeButtonSnippets.onBusyBackground } } },
  // A CSS gradient stands in for a real photo/hero-image background here —
  // the point either way is content this component has no control over.
  // Side-by-side comparison: without hasBackground, the icon has nothing
  // grounding it against the busier part of the gradient; with it, the
  // translucent bg.scrim layer keeps it legible regardless of what's
  // underneath.
  render: (args) => (
    <div
      style={{
        display: "flex",
        gap: "var(--dbm-space-6)",
        padding: "var(--dbm-space-4)",
        background:
          "linear-gradient(135deg, var(--dbm-color-purple-600), var(--dbm-color-amber-400), var(--dbm-color-green-600))",
        borderRadius: "var(--dbm-radius-md)",
      }}
    >
      <CloseButton {...args} aria-label="Close (no background)" />
      <CloseButton {...args} aria-label="Close (with background)" hasBackground />
    </div>
  ),
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => closeButtonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true },
};
