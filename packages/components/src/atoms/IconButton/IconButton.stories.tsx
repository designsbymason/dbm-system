import { HeartIcon, TrashIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { IconButton } from "./IconButton";
import { iconButtonPlaygroundSnippet, iconButtonSnippets } from "./IconButton.snippets";
import type { IconButtonProps } from "./IconButton.types";

// `icon` takes a component reference, not a string name (see
// guidelines/05-component-api-conventions.md §5) — Storybook's Controls
// panel can't natively drive an arbitrary component reference, so this maps
// a small curated set of real icons onto string keys via `argTypes.mapping`,
// the same pattern already established on Button's `leadingIcon`/
// `trailingIcon`. Unlike Button's icon slots, there's no "None" option here
// — `icon` is required on `IconButtonProps` (an icon-only button has
// nothing to fall back to), so letting the control resolve to `undefined`
// would just produce a broken, unintentionally-invalid state.
const iconMapping = {
  Heart: HeartIcon,
  Trash: TrashIcon,
};
const iconControl = {
  control: "select" as const,
  options: Object.keys(iconMapping),
  mapping: iconMapping,
};

const meta: Meta<typeof IconButton> = {
  title: "Atoms/Inputs/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  // Ordered to match IconButtonProps' own declaration order (content prop
  // → core visual props → behavioral/state props → advanced/escape-hatch
  // props last), the same sequencing principle the future Properties table
  // will use (guidelines/07-storybook-and-documentation-standards.md §4
  // item 3).
  argTypes: {
    icon: {
      ...iconControl,
      description: "The icon to render — a component reference, not a string name.",
    },
    // The defaults are resolved in the component (a `ButtonGroup` around it can supply them), not written as
    // destructuring defaults, so docgen can't read them and each is stated here.
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description:
        "Visual style, signaling emphasis: primary for the one main action, down to ghost for the quietest, and destructive for an action that deletes or can't be undone. The same five styles Button has.",
      table: { defaultValue: { summary: "primary" } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description:
        "The colour family: brand, or neutral, a grey look for a control that shouldn't draw the eye to the brand colour. Every variant but destructive follows it; destructive ignores it and stays danger-coloured.",
      table: { defaultValue: { summary: "brand" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The button's box, on the shared 5-step size scale. Its height and width match a Button of the same step, so an IconButton sits flush beside one; the icon scales with it.",
      table: { defaultValue: { summary: "md" } },
    },
    label: {
      control: "text",
      description:
        "A short caption under the icon, so the icon and the caption are one control: hover, pressed, focus and a click all cover both. The box is taller and as wide as the caption needs, never narrower than the plain square of its size. aria-label stays required, and should contain the caption. Not drawn with asChild; rounded is ignored while it shows.",
    },
    hideLabelBelow: {
      control: "select",
      options: ["none", "sm", "md", "lg", "xl", "2xl", "3xl"],
      mapping: { none: undefined },
      description:
        "The width below which the caption is left out and the button is the plain icon-only square, a breakpoint step, so a bar can drop its captions on a phone. none shows the caption at every width. No effect without label.",
    },
    isLoading: {
      control: "boolean",
      description:
        "Shows a spinner in place of the icon and disables interaction while true.",
    },
    loadingLabel: {
      control: "text",
      description:
        "Overrides aria-label while isLoading is true. Falls back to aria-label when omitted.",
    },
    // A real slotted child isn't wired up in the Playground (Slot requires
    // exactly one child, which a generic Controls toggle can't supply) —
    // see the dedicated `AsChild`/`AsChildDisabled` stories below instead.
    // Same treatment as Button's own Playground.
    asChild: { control: false },
    rounded: {
      control: "boolean",
      description:
        "Renders as a circle instead of the standard rounded-corner shape.",
      table: { defaultValue: { summary: "false" } },
    },
    // `pressed`/`defaultPressed`/`onPressedChange` don't each get their own
    // Controls-panel widget: `pressed` alone would freeze the button (a
    // controlled value always wins over the click handler's own toggle
    // attempt, and there's no real `onPressedChange` wired back to a live
    // control), and a bare `defaultPressed` boolean can't represent "not a
    // toggle at all" — `false` is still a defined value, so it would leave
    // `isToggle` permanently `true` regardless of which way the switch is
    // set (found in review: every story in this file rendered in toggle
    // mode by default before this fix, since the shared meta-level default
    // below used to set `defaultPressed: false`). Driven instead by the
    // Playground's own "Interaction mode" synthetic select (not a real
    // IconButtonProps field, see `Playground.argTypes.interactionMode`
    // below — same pattern as Tag's own Playground), which composes
    // `defaultPressed`/`onPressedChange` into one coherent, correctly-
    // behaving control, or via the dedicated `Toggle` story.
    pressed: {
      control: false,
      description:
        "Controlled pressed state — pair with onPressedChange. Setting either pressed or defaultPressed opts into toggle-button semantics. Demo via the Playground's \"Interaction mode\" control.",
    },
    defaultPressed: {
      control: false,
      description:
        'Initial pressed state for an uncontrolled toggle button. Demo via the Playground\'s "Interaction mode" control (select "Toggle") or the dedicated "Toggle" story below.',
    },
    onPressedChange: {
      control: false,
      description:
        "Fires when the pressed state changes. Demo via the Playground's \"Interaction mode\" control.",
    },
    // Not a live control at the meta level: `tooltip` takes any content, and its Playground-only choices
    // ("Off", "Label", "Custom text") are on the Playground story's own argTypes so they aren't listed as values.
    tooltip: {
      control: false,
      description:
        "Shows a tooltip on hover and keyboard focus. true uses the button's own aria-label as the text; any other content (a string, or a node) is shown instead. Left out, or false, there is no tooltip. The button is still named by aria-label. A tooltip doesn't open on a disabled or loading button.",
      table: { defaultValue: { summary: "false" } },
    },
    tooltipSide: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Which side of the button the tooltip opens on, before it flips to fit. Has no effect without tooltip.",
      table: { defaultValue: { summary: "top" } },
    },
    "aria-label": {
      control: "text",
      description:
        "Required — an icon-only button has no visible text, so an accessible name must be supplied explicitly.",
    },
    type: { control: "select", options: ["button", "submit", "reset"] },
    disabled: {
      description:
        "Disables the button natively. When asChild is also set, the slotted element can't take a native disabled attribute, so this instead applies aria-disabled plus matching dimmed styling and blocks its click handler.",
    },
    // A function prop was never meant to be live-editable (guidelines/
    // 07-storybook-and-documentation-standards.md §5) — set explicitly
    // rather than relying on inference, same guard Button's own `onClick`
    // needed after a similar redeclaration.
    onClick: { control: false },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead of aria-label.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set
    // of four (Button, ProgressBar, Checkbox…).
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
  // boolean"/"Set string" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  // `loadingLabel` gets a real, non-blank demo value rather than "" —
  // IconButton still resolves it via `loadingLabel ?? aria-label`, and an
  // explicit empty string would silently win over `aria-label` the same
  // way Button's own `loadingText ?? children` once did.
  // `defaultPressed`/`onPressedChange` are deliberately absent here (found
  // in review, fixed at explicit direction) — `defaultPressed: false` used
  // to live in this shared args object, which meant `isToggle` was `true`
  // for every single story in this file (`false` is still a *defined*
  // value), none of which ever demonstrated IconButton's actual default,
  // non-toggle appearance. Toggle mode is opted into per-story instead —
  // the Playground's own "Interaction mode" control, or the dedicated
  // `Toggle` story below.
  args: {
    icon: "Heart" as unknown as IconButtonProps["icon"],
    variant: "primary",
    tone: "brand",
    size: "md",
    label: "",
    hideLabelBelow: "none" as unknown as IconButtonProps["hideLabelBelow"],
    isLoading: false,
    loadingLabel: "Favoriting…",
    asChild: false,
    rounded: false,
    tooltipSide: "top",
    "aria-label": "Favorite",
    type: "button",
    disabled: false,
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

type InteractionMode = "Non-toggle" | "Toggle";

// `interactionMode` is a Playground-only Controls axis, not a real
// IconButtonProps field — `defaultPressed`/`onPressedChange` don't have a
// sensible standalone control on their own (see each one's own argTypes
// description above), and a bare `defaultPressed` boolean can't represent
// "not a toggle at all" (see the meta-level comment above `pressed`). This
// one synthetic select composes them into a single, correctly-behaving
// control — same pattern as Tag's own Playground. Defaults to
// "Non-toggle" — IconButton's real zero-extra-props default — so the
// Playground's initial render matches what a plain `<IconButton>` actually
// looks like, rather than starting pre-opted into toggle mode.
interface PlaygroundArgs extends IconButtonProps {
  interactionMode: InteractionMode;
}

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => iconButtonPlaygroundSnippet(context.args),
      },
    },
  },
  // Cast: `interactionMode` isn't part of `IconButtonProps` — see the
  // interface and comment above. `onPressedChange` is created once here
  // (module-eval time, not per-render) so its identity — and Actions-panel
  // call history — stays stable across unrelated control changes, matching
  // every other `fn()` usage in this file.
  args: {
    interactionMode: "Non-toggle",
    defaultPressed: false,
    onPressedChange: fn(),
    tooltip: "Off",
  } as Partial<PlaygroundArgs>,
  argTypes: {
    // Playground-only choices for `tooltip`: "Off" leaves the prop out, "Label" is `true`, "Custom text" is a string.
    tooltip: {
      control: "select",
      options: ["Off", "Label", "Custom text"],
      mapping: { Off: undefined, Label: true, "Custom text": "Add to favorites" },
      description:
        'Playground-only choices for tooltip. "Off": no tooltip. "Label": true, which shows the aria-label. "Custom text": a string shown instead of the label.',
    },
    interactionMode: {
      name: "Interaction mode",
      control: "select",
      options: ["Non-toggle", "Toggle"],
      description:
        'Playground-only control (not a real IconButtonProps field). "Non-toggle": neither defaultPressed nor onPressedChange is applied — IconButton\'s real default. "Toggle": wires defaultPressed + onPressedChange (uncontrolled, so the button below toggles live on click with no external state needed).',
    },
  } as NonNullable<Meta<typeof IconButton>["argTypes"]>,
  render: (args) => {
    const { interactionMode, defaultPressed, onPressedChange, ...rest } =
      args as PlaygroundArgs;
    if (interactionMode === "Toggle") {
      return (
        <IconButton
          {...rest}
          defaultPressed={defaultPressed}
          onPressedChange={onPressedChange}
        />
      );
    }
    return <IconButton {...rest} />;
  },
};

export const AllVariants: Story = {
  name: "All variants",
  parameters: { docs: { source: { code: iconButtonSnippets.allVariants } } },
  // `variant` is the whole point of this grid, paired with `icon`/
  // `aria-label` (fixed together per instance so every button keeps the
  // "delete" narrative and a distinct accessible name) — no single control
  // value could represent any of the three. Every other prop (`size`,
  // `isLoading`, `rounded`, `disabled`, …) stays live and shared via
  // `{...args}`, matching ProgressBar's own AllTones/AllSizes precedent —
  // previously this story used a bare `render: () => (...)` that ignored
  // args entirely, making every control here a silent no-op (found in
  // review).
  argTypes: {
    variant: { control: false },
    icon: { control: false },
    "aria-label": { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      {(
        ["primary", "secondary", "tertiary", "ghost", "destructive"] as const
      ).map((variant) => (
        <IconButton
          key={variant}
          {...args}
          icon={TrashIcon}
          aria-label={`${variant} delete`}
          variant={variant}
        />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "Neutral tone",
  parameters: { docs: { source: { code: iconButtonSnippets.tones } } },
  // `tone` and `variant` are the whole point of this grid, paired with `icon`/`aria-label` (fixed per instance so every
  // button has a distinct accessible name); every other prop stays live and shared via `{...args}`.
  argTypes: { tone: { control: false }, variant: { control: false }, icon: { control: false }, "aria-label": { control: false } },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
          {(["primary", "secondary", "tertiary", "ghost", "destructive"] as const).map((variant) => (
            <IconButton key={variant} {...args} icon={TrashIcon} aria-label={`${tone} ${variant} delete`} tone={tone} variant={variant} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const WithCaption: Story = {
  name: "With a caption",
  parameters: { docs: { source: { code: iconButtonSnippets.labelled } } },
  // `tone`, `variant` and `label` are the point of this grid: each row sets its own tone, and each button its variant and caption.
  argTypes: { tone: { control: false }, variant: { control: false }, icon: { control: false }, label: { control: false }, "aria-label": { control: false } },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
          {(["primary", "secondary", "tertiary", "ghost", "destructive"] as const).map((variant) => (
            <IconButton
              key={variant}
              {...args}
              icon={TrashIcon}
              aria-label={`${variant} delete, ${tone}`}
              label={variant}
              tone={tone}
              variant={variant}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const CaptionFromAWidth: Story = {
  name: "A caption from a width",
  parameters: { docs: { source: { code: iconButtonSnippets.labelFrom } } },
  argTypes: { icon: { control: false }, label: { control: false }, hideLabelBelow: { control: false }, "aria-label": { control: false } },
  render: (args) => (
    <IconButton {...args} icon={HeartIcon} aria-label="Favorites" label="Favorites" hideLabelBelow="md" variant="tertiary" />
  ),
};

export const CaptionedToggle: Story = {
  name: "A toggle with a caption",
  parameters: { docs: { source: { code: iconButtonSnippets.labelledToggle } } },
  argTypes: { icon: { control: false }, label: { control: false }, "aria-label": { control: false } },
  render: (args) => (
    <IconButton {...args} icon={HeartIcon} aria-label="Favorite" label="Favorite" variant="ghost" defaultPressed={false} onPressedChange={fn()} />
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: iconButtonSnippets.allSizes } } },
  // `size` is the whole point of this grid, paired with `icon`/
  // `aria-label` (fixed together per instance, same reasoning as
  // AllVariants above). Every other prop stays live and shared via
  // `{...args}`.
  argTypes: {
    size: { control: false },
    icon: { control: false },
    "aria-label": { control: false },
  },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <IconButton
          key={size}
          {...args}
          icon={HeartIcon}
          aria-label={`Favorite (${size})`}
          size={size}
        />
      ))}
    </div>
  ),
};

export const WithTooltip: Story = {
  name: "With a tooltip",
  parameters: { docs: { source: { code: iconButtonSnippets.tooltip } } },
  // `true` shows the aria-label; the second button shows its own text on the other side. Hover or tab to a button.
  argTypes: { tooltip: { control: false }, tooltipSide: { control: false }, icon: { control: false }, "aria-label": { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-10)" }}>
      <IconButton {...args} icon={HeartIcon} aria-label="Favorite" variant="secondary" tooltip />
      <IconButton {...args} icon={TrashIcon} aria-label="Delete" variant="secondary" tooltip="Delete this item" tooltipSide="bottom" />
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading state",
  parameters: { docs: { source: { code: iconButtonSnippets.loading } } },
  args: { isLoading: true },
};

export const LoadingWithLoadingLabel: Story = {
  name: "Loading state with loadingLabel",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => iconButtonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { isLoading: true, loadingLabel: "Favoriting…" },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => iconButtonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true },
};

export const Rounded: Story = {
  name: "Rounded (circular)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => iconButtonPlaygroundSnippet(context.args),
      },
    },
  },
  args: { rounded: true },
};

export const Toggle: Story = {
  name: "Toggle (click to favorite)",
  parameters: { docs: { source: { code: iconButtonSnippets.toggle } } },
  // Uncontrolled (`defaultPressed`) — IconButton manages its own pressed
  // state internally, so clicking directly in the canvas visibly toggles
  // the pressed treatment with no story-level state needed, same pattern
  // as Tag's own `Selectable` story. `ghost` is the clearer variant for
  // this demo — its transparent-at-rest look makes the brand-tinted
  // pressed fill an obvious, unambiguous change; `onPressedChange: fn()`
  // logs each toggle to the Actions panel.
  args: { variant: "ghost", defaultPressed: false, onPressedChange: fn() },
};

export const AsChild: Story = {
  name: "asChild (renders as an anchor)",
  parameters: { docs: { source: { code: iconButtonSnippets.asChild } } },
  // Every other prop stays live and shared via `{...args}` (`asChild`
  // itself is forced regardless, matching the story's purpose — it's
  // already `control: false` at the meta level). Previously this story
  // used a bare `render: () => (...)` that ignored args entirely, making
  // every control here a silent no-op (found in review) — same regression
  // class, and same fix, as Button's own `AsChild` story.
  render: (args) => (
    <IconButton {...args} asChild>
      {/* The same name on the link itself: lint rules that check a link for content (jsx-a11y) read the element as written. */}
      <a href="/favorite" aria-label={args["aria-label"]} />
    </IconButton>
  ),
};

export const AsChildDisabled: Story = {
  name: "asChild + disabled (aria-disabled, click blocked)",
  parameters: { docs: { source: { code: iconButtonSnippets.asChildDisabled } } },
  // Same reasoning as AsChild above — `disabled: true` is a story-level
  // arg default (live/toggleable in Controls) rather than hardcoded in
  // render.
  args: { disabled: true },
  render: (args) => (
    <IconButton {...args} asChild>
      {/* The same name on the link itself: lint rules that check a link for content (jsx-a11y) read the element as written. */}
      <a href="/favorite" aria-label={args["aria-label"]} />
    </IconButton>
  ),
};
