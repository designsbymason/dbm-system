import { Bell } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { Badge } from "./Badge";
import { badgePlaygroundSnippet, badgeSnippets } from "./Badge.snippets";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  id: "atoms-data-display-badge",
  component: Badge,
  parameters: { layout: "padded" },
  // Ordered content prop first, then core visual props, then behavioral
  // props — same sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      description:
        "Badge content — text or a number. Ignored (nothing renders) when `dot` is set.",
    },
    tone: {
      control: "select",
      options: ["brand", "neutral", "info", "success", "warning", "highlight", "danger"],
      description: "Feedback-type coloring, independent of `variant`.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding, font-size, and gap together as one step on the shared size scale.",
    },
    variant: {
      control: "select",
      options: ["subtle", "solid"],
      description: "Low-emphasis subtle-background style, or high-emphasis solid-fill.",
    },
    max: {
      control: "number",
      description:
        "When `children` is a number greater than `max`, displays `${max}+` instead. No effect on non-numeric `children` or when `dot` is set.",
    },
    hideZero: {
      control: "boolean",
      description:
        "Renders nothing (just anchor, if set) when children is exactly the number 0. No effect on dot or non-zero children.",
    },
    dot: {
      control: "boolean",
      description:
        "Renders as a minimal dot with no visible text/count. Decorative (aria-hidden) unless an explicit aria-label/aria-labelledby is supplied.",
    },
    // A ReactNode prop can't be meaningfully driven from a generic Storybook
    // control (same reasoning as Button's icon props, which use a curated
    // select+mapping instead — not applicable here since "which element to
    // anchor to" isn't a small enum). Left undocumented-via-control at the
    // meta level; dedicated Anchor* stories below set it directly and keep
    // every *other* prop (position/overlap/tone/dot/etc.) fully live.
    anchor: {
      control: false,
      description:
        "Renders the badge overlapping the corner of this element instead of as a standalone inline label.",
    },
    position: {
      control: "select",
      options: ["top-right", "top-left", "bottom-right", "bottom-left"],
      description:
        "Which corner of `anchor` the badge overlaps. Has no effect unless `anchor` is set. A physical corner, not a logical one — doesn't mirror under RTL.",
    },
    overlap: {
      control: "select",
      options: ["rectangular", "circular"],
      description:
        "`circular` tucks the badge in further, for round anchors. Has no effect unless `anchor` is set.",
    },
    // Advanced/escape-hatch props last, matching BadgeProps' own
    // declaration order (finding #6's "standard prop pattern" pass).
    // `control: false` (`aria-labelledby`, `id`, `className`, `style`,
    // `data-testid`) renders as "-" for values that only mean something
    // wired up in real consuming code, not in an isolated Storybook
    // canvas — same reasoning and precedent as Avatar/Button. `aria-label`
    // is the one exception: a plain string, genuinely meaningful to type
    // directly into this canvas, so it gets a real `control: "text"`.
    "aria-label": {
      control: "text",
      description:
        "Explicit accessible-label override. Required when `dot` is set and the dot needs to convey meaning, rather than being purely decorative.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Required when another element's aria-labelledby/aria-describedby needs to point at this badge.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // number"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  // `max` has no true component default, so it gets a sensible non-blank
  // demo value instead (matching the component's own JSDoc example).
  args: {
    children: "Badge",
    tone: "danger",
    size: "md",
    variant: "solid",
    max: 99,
    hideZero: false,
    dot: false,
    position: "top-right",
    overlap: "rectangular",
    // Empty-string default, not undefined — needed for this control to be
    // genuinely interactive rather than an inert placeholder (see the
    // comment above `args`). Safe: Badge.tsx only treats a truthy
    // aria-label/aria-labelledby as "labeled" (`Boolean(ariaLabel ||
    // ariaLabelledby)`), so an empty string behaves exactly like the prop
    // being unset.
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => badgePlaygroundSnippet(context.args),
      },
    },
  },
  // `anchor` stays unset here (Playground shows Badge's plain standalone
  // mode, matching every other component's Playground convention) — which
  // makes `position`/`overlap` genuinely inert from this story's own UI
  // specifically (there's no way to turn `anchor` on from this panel), so
  // both are suppressed only here. They're live, working `select` controls
  // on the dedicated Anchor* stories below, where `anchor` is actually set.
  argTypes: { position: { control: false }, overlap: { control: false } },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: badgeSnippets.allSizes } } },
  argTypes: { size: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-2)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Badge key={size} {...args} size={size}>
          {size}
        </Badge>
      ))}
    </div>
  ),
};

// The six stories below each render multiple Badge instances that
// intentionally vary along one or more fixed identity props — no single
// Controls-panel value could represent "all 5 tones at once" or
// "Active/Pending/Failed/Draft simultaneously". Only those coupled
// identity props (tone, and — wherever each instance is a specific
// real-world label rather than a plain loop over tone — children too) are
// suppressed per story via `argTypes: { ...: { control: false } }`; every
// other prop (variant/max/dot) is still genuinely shared across every
// instance in the grid and stays fully wired through `args` via `{...args}`
// in a `render` that actually accepts it, same fix already established on
// Avatar (see guidelines/06-engineering-standards.md §9 and
// guidelines/07-storybook-and-documentation-standards.md §5). Previously
// every story below used `render: () => (...)` with no `args` parameter at
// all, so every Controls-panel toggle was a silent no-op.
export const AllTonesSubtle: Story = {
  name: "All tones (subtle)",
  parameters: { docs: { source: { code: badgeSnippets.allTonesSubtle } } },
  // `variant: "subtle"` is now an explicit override, not the default (the
  // component default flipped to "solid") — without it this story would
  // silently render solid badges under a name that says otherwise.
  argTypes: { tone: { control: false }, children: { control: false } },
  args: { variant: "subtle" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      {(["brand", "neutral", "info", "success", "warning", "highlight", "danger"] as const).map(
        (tone) => (
          <Badge key={tone} {...args} tone={tone}>
            {tone}
          </Badge>
        ),
      )}
    </div>
  ),
};

export const AllTonesSolid: Story = {
  name: "All tones (solid)",
  parameters: { docs: { source: { code: badgeSnippets.allTonesSolid } } },
  argTypes: { tone: { control: false }, children: { control: false } },
  args: { variant: "solid" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      {(["brand", "neutral", "info", "success", "warning", "highlight", "danger"] as const).map(
        (tone) => (
          <Badge key={tone} {...args} tone={tone}>
            {tone}
          </Badge>
        ),
      )}
    </div>
  ),
};

export const StatusLabels: Story = {
  name: "As status labels",
  parameters: { docs: { source: { code: badgeSnippets.statusLabels } } },
  // `variant: "subtle"` is now an explicit override (see AllTonesSubtle's
  // own note) — needed here specifically to keep this the deliberately
  // low-emphasis counterpart to SolidStatusLabels below.
  argTypes: { tone: { control: false }, children: { control: false } },
  args: { variant: "subtle" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <Badge {...args} tone="success">
        Active
      </Badge>
      <Badge {...args} tone="warning">
        Pending
      </Badge>
      <Badge {...args} tone="danger">
        Failed
      </Badge>
      <Badge {...args} tone="neutral">
        Draft
      </Badge>
    </div>
  ),
};

export const CountWithMax: Story = {
  name: "Count with max overflow (99+)",
  parameters: { docs: { source: { code: badgeSnippets.countWithMax } } },
  argTypes: { children: { control: false } },
  args: { tone: "danger" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <Badge {...args}>{42}</Badge>
      <Badge {...args}>{100}</Badge>
    </div>
  ),
};

export const HideZero: Story = {
  name: "Hide when count is zero (hideZero)",
  parameters: { docs: { source: { code: badgeSnippets.hideZero } } },
  // `children` is a fixed identity per instance (0 vs 3 — the whole point
  // of this story is comparing those two specific values), same reasoning
  // as the tone/status galleries above. Every other prop, including
  // `hideZero` itself, stays live via `{...args}`.
  argTypes: { children: { control: false } },
  args: { hideZero: true, tone: "danger" },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-2)" }}>
        <span>count = 0:</span>
        <Badge {...args}>{0}</Badge>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-2)" }}>
        <span>count = 3:</span>
        <Badge {...args}>{3}</Badge>
      </div>
    </div>
  ),
};

export const Dot: Story = {
  name: "Dot indicator",
  parameters: { docs: { source: { code: badgeSnippets.dot } } },
  argTypes: { tone: { control: false } },
  args: { dot: true },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      <Badge {...args} tone="danger" aria-label="Unread notifications" />
      <Badge {...args} tone="success" aria-label="Online" />
      <Badge {...args} tone="neutral" aria-label="Offline" />
    </div>
  ),
};

export const SolidStatusLabels: Story = {
  name: "As high-emphasis status labels (solid)",
  parameters: { docs: { source: { code: badgeSnippets.solidStatusLabels } } },
  argTypes: { tone: { control: false }, children: { control: false } },
  args: { variant: "solid" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <Badge {...args} tone="success">
        Active
      </Badge>
      <Badge {...args} tone="warning">
        Pending
      </Badge>
      <Badge {...args} tone="danger">
        Failed
      </Badge>
    </div>
  ),
};

// The five stories below demonstrate `anchor` — the overlay/positioning
// mode (badge overlapping a corner of another element, e.g. a notification
// dot on a bell icon), added to close a real feature gap: an overlay/
// notification-dot badge is a common, expected use case this component
// didn't originally cover. `anchor` itself is
// a fixed identity value per story (a ReactNode can't be represented by a
// generic Storybook control at all — same reasoning as Button's icon props
// needing a curated control, except there's no small enum to curate here),
// suppressed via `control: false`; every other prop (position/overlap/
// tone/dot/size/variant) stays genuinely live via `{...args}`.
export const AnchorOnIcon: Story = {
  name: "Anchor: notification dot on an icon",
  parameters: { docs: { source: { code: badgeSnippets.anchorOnIcon } } },
  argTypes: { anchor: { control: false } },
  args: { dot: true, tone: "danger" },
  render: (args) => (
    <Badge
      {...args}
      anchor={<Icon icon={Bell} size="lg" />}
      aria-label="Unread notifications"
    />
  ),
};

export const AnchorWithCount: Story = {
  name: "Anchor: count on an icon",
  parameters: { docs: { source: { code: badgeSnippets.anchorWithCount } } },
  argTypes: { anchor: { control: false } },
  // `variant="solid"` matters here in a way it doesn't for `dot` (which
  // always ignores `variant` and uses its own indicator fill regardless —
  // see the `dot` prop's own doc): a count badge switched to `subtle`
  // renders a very pale fill that's barely visible floating over arbitrary
  // anchor content with no guaranteed contrasting surface behind it, unlike
  // `subtle`'s intended use sitting on a card/page background. `solid` is
  // also the component's own default now, so this is explicit for clarity
  // rather than strictly required.
  args: { tone: "danger", variant: "solid", children: 4 },
  render: (args) => (
    <Badge
      {...args}
      anchor={<Icon icon={Bell} size="lg" />}
    />
  ),
};

export const AllPositions: Story = {
  name: "Anchor: all positions",
  parameters: { docs: { source: { code: badgeSnippets.allPositions } } },
  argTypes: { anchor: { control: false }, position: { control: false } },
  args: { dot: true, tone: "danger" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)" }}>
      {(["top-right", "top-left", "bottom-right", "bottom-left"] as const).map(
        (position) => (
          <Badge
            key={position}
            {...args}
            position={position}
            anchor={<Icon icon={Bell} size="lg" />}
            aria-label={`Unread notifications (${position})`}
          />
        ),
      )}
    </div>
  ),
};

// Plain shape placeholders (2026-08-16, revised same day to drop the real
// Avatar in favor of a plain circle in this same style — keeps all four
// anchors as pure geometry, not real components with their own baked-in
// styling, so the comparison is only ever about shape) — token-styled
// divs standing in for "any element of this shape", so
// AnchorOverlapComparison can show `overlap`'s effect on plain geometry.
// `square`/`rect`/`circle` differ only in width and border-radius, so the
// shape comparison isn't confounded by anything else changing.
const shapeStyle = {
  alignItems: "center",
  backgroundColor: "var(--dbm-bg-neutral-subtle)",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  display: "flex",
  height: "var(--dbm-space-10)",
  justifyContent: "center",
} as const;

export const AnchorOverlapComparison: Story = {
  name: "Anchor: overlap — rectangular vs circular anchor",
  parameters: { docs: { source: { code: badgeSnippets.anchorOverlapComparison } } },
  // `anchor` is a fixed identity per instance (four different shapes — an
  // icon, a square, a rectangle, and a circle — a single control couldn't
  // represent "four different elements at once"). `overlap` is *not*
  // suppressed, unlike the plain-content stories above: it's the one
  // shared prop this story exists to demonstrate, applied identically
  // across all four shapes via `{...args}` — toggle it in the Controls
  // panel to see the same inset either tuck correctly into the square/
  // rectangle/icon's actual corner, or fall short of the circle's round
  // edge (and the reverse: `circular` overtucking into the square/
  // rectangle/icon's corners instead of sitting flush with them).
  argTypes: { anchor: { control: false } },
  args: { tone: "danger", variant: "solid", children: 3 },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-8)" }}>
      <Badge {...args} anchor={<Icon icon={Bell} size="lg" />} />
      <Badge
        {...args}
        anchor={
          <div
            style={{ ...shapeStyle, width: "var(--dbm-space-10)", borderRadius: "var(--dbm-radius-sm)" }}
          />
        }
      />
      <Badge
        {...args}
        anchor={
          <div
            style={{ ...shapeStyle, width: "var(--dbm-space-16)", borderRadius: "var(--dbm-radius-sm)" }}
          />
        }
      />
      <Badge
        {...args}
        anchor={
          <div
            style={{ ...shapeStyle, width: "var(--dbm-space-10)", borderRadius: "var(--dbm-radius-full)" }}
          />
        }
      />
    </div>
  ),
};

// `anchor` isn't the only way to use Badge — it's the exception, not the
// default. Without it, Badge is just a `display: inline-flex` span with
// no positioning opinions of its own (`.positioned`'s `position: absolute`
// only ever applies when `anchor` is set) — so it composes directly into
// any parent's own flex/inline layout, exactly like this Button does with
// its own icon/label. `position`/`overlap` are suppressed here since they
// only affect anchor mode and have no effect on plain in-flow composition.
export const InlineInButton: Story = {
  name: "Composed inline (no anchor): inside a Button",
  parameters: { docs: { source: { code: badgeSnippets.inlineInButton } } },
  argTypes: { position: { control: false }, overlap: { control: false } },
  args: { size: "xs", tone: "danger", variant: "solid", children: 3 },
  render: (args) => (
    <Button variant="secondary">
      Messages <Badge {...args} />
    </Button>
  ),
};
