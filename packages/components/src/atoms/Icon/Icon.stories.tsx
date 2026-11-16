import {
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  StarIcon,
  TrashIcon,
  WalletIcon,
} from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Icon } from "./Icon";
import { iconPlaygroundSnippet, iconSnippets } from "./Icon.snippets";
import type { IconProps, IconTone } from "./Icon.types";

// `icon` takes a component reference, not a string (see
// guidelines/05-component-api-conventions.md §5) — Storybook's Controls
// panel can't natively drive an arbitrary component reference, so this maps
// a small curated set of real icons onto string keys via `argTypes.mapping`,
// the same pattern Button.stories.tsx already established. Unlike Button's
// leadingIcon/trailingIcon, `icon` is required here, so there's no "None"
// entry — Icon always needs a real icon reference to render.
const iconMapping = {
  Wallet: WalletIcon,
  Heart: HeartIcon,
  Star: StarIcon,
  Trash: TrashIcon,
  Check: CheckIcon,
  ArrowRight: ArrowRightIcon,
};
const iconControl = {
  control: "select" as const,
  options: Object.keys(iconMapping),
  mapping: iconMapping,
};

const standaloneTones = [
  "default",
  "secondary",
  "brand",
  "disabled",
  "danger",
  "warning",
  "success",
  "info",
  "highlight",
] as const;

const onColorTones: { tone: IconTone; bg: string }[] = [
  { tone: "on-brand", bg: "var(--dbm-bg-brand)" },
  { tone: "on-danger", bg: "var(--dbm-bg-danger)" },
  { tone: "on-warning", bg: "var(--dbm-bg-warning)" },
  { tone: "on-success", bg: "var(--dbm-bg-success)" },
  { tone: "on-info", bg: "var(--dbm-bg-info)" },
  { tone: "on-highlight", bg: "var(--dbm-bg-highlight)" },
  { tone: "on-neutral", bg: "var(--dbm-bg-neutral)" },
  { tone: "white", bg: "var(--dbm-bg-overlay)" },
];

const meta: Meta<typeof Icon> = {
  title: "Components/Icon",
  id: "atoms-media-icon",
  component: Icon,
  parameters: { layout: "padded" },
  // Ordered to match IconProps' own declaration order (icon, size, weight,
  // tone, label, mirrored), then the inherited native escape-hatch props
  // last — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    icon: {
      ...iconControl,
      description:
        "The Phosphor icon component to render — a component reference, not a string name.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
      description: "Icon size step, matching the primitive icon-size token scale.",
    },
    weight: {
      control: "select",
      options: ["thin", "light", "regular", "bold", "fill", "duotone"],
      description: "Stroke weight, matching Phosphor's own weight variants.",
    },
    tone: {
      control: "select",
      options: [...standaloneTones, ...onColorTones.map((t) => t.tone)],
      description:
        "Semantic color tone, mapped to the --dbm-icon-* token set. Omit to inherit currentColor from surrounding context instead.",
    },
    label: {
      control: "text",
      description:
        "Accessible label. When omitted, the icon is decorative and hidden from the accessibility tree.",
    },
    mirrored: {
      control: "boolean",
      description:
        "Flips the icon horizontally (Phosphor's own built-in mechanism) — for a directional icon whose meaning should mirror under RTL.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set object" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    // Storybook's `mapping` (see `iconControl` above) resolves this string
    // key to the real icon component before the story renders — the args
    // value here matches the Controls-panel select's option key, not
    // IconProps["icon"] itself, hence the cast (same pattern established in
    // Button.stories.tsx's own leadingIcon/trailingIcon args).
    icon: "Wallet" as unknown as IconProps["icon"],
    size: "md",
    weight: "bold",
    tone: "brand",
    label: "",
    mirrored: false,
  },
};

export default meta;

type Story = StoryObj<typeof Icon>;

const disableAllAxes = {
  icon: { control: false },
  size: { control: false },
  weight: { control: false },
  tone: { control: false },
  label: { control: false },
  mirrored: { control: false },
} as const;

/** Drive every prop live. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => iconPlaygroundSnippet(context.args),
      },
    },
  },
};

// A literal, args-free render, not `{...args}` — Storybook's "Show code"
// panel dumps a non-primitive resolved arg's raw runtime shape instead of
// clean source when a story spreads `args`; a literal render shows real,
// copyable source text instead, matching every other static-reference
// story in this file (see guidelines/component-reviews/Icon.md for the
// full finding — Storybook's source extraction only captures each export's
// own object literal, not a comment positioned outside/above it like this
// one, so this explanation itself never reaches the rendered "Show code"
// panel the way one placed inside the object would).
export const Default: Story = {
  parameters: { docs: { source: { code: iconSnippets.default } } },
  argTypes: disableAllAxes,
  render: () => <Icon icon={WalletIcon} size="md" weight="bold" />,
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: iconSnippets.allSizes } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const).map((size) => (
        <Icon key={size} icon={WalletIcon} size={size} tone="brand" />
      ))}
    </div>
  ),
};

export const AllWeights: Story = {
  name: "All weights",
  parameters: { docs: { source: { code: iconSnippets.allWeights } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["thin", "light", "regular", "bold", "fill", "duotone"] as const).map(
        (weight) => (
          <Icon
            key={weight}
            icon={HeartIcon}
            weight={weight}
            size="lg"
            tone="brand"
          />
        ),
      )}
    </div>
  ),
};

export const AllTones: Story = {
  name: "All tones",
  parameters: { docs: { source: { code: iconSnippets.allTones } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
        {standaloneTones.map((tone) => (
          <div key={tone} style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
            <Icon icon={HeartIcon} size="lg" tone={tone} />
            <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
              {tone}
            </span>
          </div>
        ))}
      </div>
      {/* The `on-*` tones are meant to sit on their matching solid-fill
          background (a Badge/Tag/Button's own solid variant) — shown here
          against the real `bg.*` token each pairs with, not on the default
          page background, so the contrast pairing actually reads. */}
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
        {onColorTones.map(({ tone, bg }) => (
          <div key={tone} style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
            <div
              style={{
                alignItems: "center",
                background: bg,
                borderRadius: "var(--dbm-radius-md)",
                display: "flex",
                justifyContent: "center",
                padding: "var(--dbm-space-2)",
              }}
            >
              <Icon icon={HeartIcon} size="lg" tone={tone} />
            </div>
            <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-xs)" }}>
              {tone}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Labeled: Story = {
  name: "With accessible label (role=img)",
  parameters: { docs: { source: { code: iconSnippets.labeled } } },
  argTypes: disableAllAxes,
  render: () => <Icon icon={HeartIcon} label="Favorite" />,
};

export const Mirrored: Story = {
  name: "Mirrored (RTL-flipped directional icon)",
  parameters: { docs: { source: { code: iconSnippets.mirrored } } },
  argTypes: disableAllAxes,
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      <Icon icon={ArrowRightIcon} size="lg" tone="brand" />
      <Icon icon={ArrowRightIcon} size="lg" tone="brand" mirrored />
    </div>
  ),
};
