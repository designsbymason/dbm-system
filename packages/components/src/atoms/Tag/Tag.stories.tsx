import {
  CheckCircleIcon,
  InfoIcon,
  StarIcon,
  TagIcon,
} from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Tag } from "./Tag";
import { tagPlaygroundSnippet, tagSnippets } from "./Tag.snippets";
import type { TagProps } from "./Tag.types";

// `leadingIcon`/`trailingIcon` take component references, not strings (see
// guidelines/05-component-api-conventions.md §5) — Storybook's Controls
// panel can't natively drive an arbitrary component reference, so this maps
// a small curated set of real icons onto string keys via `argTypes.mapping`,
// matching Button's own established pattern. "None" maps to `undefined`.
const iconMapping = {
  None: undefined,
  Tag: TagIcon,
  Star: StarIcon,
  CheckCircle: CheckCircleIcon,
  Info: InfoIcon,
};
const iconControl = {
  control: "select" as const,
  options: Object.keys(iconMapping),
  mapping: iconMapping,
};

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  id: "atoms-data-display-tag",
  component: Tag,
  parameters: { layout: "padded" },
  // Ordered content prop first, then core visual props, then
  // behavioral/state props, then advanced/escape-hatch props last — same
  // sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "Tag content — usually a short label.",
    },
    tone: {
      control: "select",
      options: ["brand", "neutral", "info", "success", "warning", "highlight", "danger"],
      description:
        "Feedback-type coloring, independent of `variant`. `brand` and `highlight` are the system's own identity color and its general highlight and accent color, rather than statuses.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "solid", "outlined"],
      description:
        "Low-emphasis subtle-background style, high-emphasis solid-fill, or a bordered style with no background of its own (selecting an outlined tag adds one).",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Padding and font-size together as one step on the shared size scale — also controls the leading icon's and remove button's own sizing.",
    },
    leadingIcon: {
      ...iconControl,
      description: "Leading icon (select 'None' to omit).",
    },
    trailingIcon: {
      ...iconControl,
      description: "Trailing icon (select 'None' to omit).",
    },
    removable: {
      control: "boolean",
      description:
        'Shows a trailing remove ("×") button, calling `onRemove` when clicked. Actually removing the tag (e.g. from a filter list) is the caller\'s responsibility.',
    },
    // Function prop — not meaningfully editable via a Controls-panel
    // widget, same reasoning as every other event-handler prop in this
    // codebase (e.g. Badge's own onClick-style props). Wired to `fn()` in
    // `args` below (not left unset) specifically so toggling `removable`
    // on in *any* story's Controls panel produces a remove button that
    // visibly does something (an Actions-panel entry) instead of silently
    // no-op'ing — a real control/canvas mismatch found in review.
    onRemove: {
      control: false,
      description:
        "Called when the remove button is clicked. Has no effect unless `removable` is set.",
    },
    removeLabel: {
      control: "text",
      description:
        "Accessible label for the remove button. Defaults to `Remove ${children}` (the plain text of the label); an empty value uses that default.",
      table: { defaultValue: { summary: "`Remove ${children}`" } },
    },
    removeTabStop: {
      control: "boolean",
      description:
        "Whether the remove button is a tab stop. Turn it off for a parent that manages focus among several tags itself; the button then has tabindex -1.",
      table: { defaultValue: { summary: "true" } },
    },
    // `onClick`/`selected`/`defaultSelected`/`onSelectedChange` don't each
    // get their own Controls-panel widget: `onClick`/`onSelectedChange`
    // are functions (nothing to toggle), and a bare `selected` toggle
    // without a paired, synced `onSelectedChange` would look broken (the
    // ring would never visually update on click, since controlled mode
    // defers entirely to the prop). Correctly showing "-" here per the
    // review checklist for props with no sensible generic control — driven
    // instead by the Playground's own "Interaction mode" synthetic select
    // (not a real Tag prop, see `Playground.argTypes.interactionMode`
    // below), which composes them into one coherent, correctly-behaving
    // control.
    onClick: {
      control: false,
      description:
        'Called when the tag itself is clicked, or activated via Enter/Space while focused. Passing this — or any of `selected`/`defaultSelected`/`onSelectedChange` — makes the whole tag focusable and keyboard-activatable, not just visually clickable. Demo via the Playground\'s "Interaction mode" control.',
    },
    selected: {
      control: false,
      description:
        'Controlled selected/active state, for a toggleable filter-style tag — pairs with `onSelectedChange`. Demo via the "Selectable filter group" story below (a real controlled-mode consumer needs its own external state to be meaningful, which a single Controls-panel toggle can\'t provide).',
    },
    defaultSelected: {
      control: false,
      table: { defaultValue: { summary: "false" } },
      description:
        'Initial selected state for uncontrolled usage — ignored once `selected` is provided. Demo via the Playground\'s "Interaction mode" control (select "Selectable") or the dedicated "Selectable" story below.',
    },
    onSelectedChange: {
      control: false,
      description:
        "Called with the next selected state whenever the tag is toggled (click, or Enter/Space while focused).",
    },
    disabled: {
      control: "boolean",
      description:
        "Disables interaction — blocks onClick/selection toggling and (when removable) the remove affordance. Only has an effect once the tag is interactive; Tag warns once in development otherwise. Demo via the \"Disabled\" story below.",
    },
    "aria-label": {
      control: "text",
      description:
        "Explicit accessible-name override for the tag's interactive role. Rarely needed — visible `children` already provide the accessible name in the common case.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    // `control: false` (className/style/id/data-testid) — values that only
    // mean something wired up in real consuming code, not in an isolated
    // Storybook canvas. Matches Skeleton/Avatar/Badge's established
    // precedent.
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this tag.",
    },
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
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  // `removeLabel` has no true default (it's computed from `children` when omitted), so its arg is `""`, which Tag treats as "use the
  // default": the remove button's name then follows the `children` control instead of staying on a fixed demo string.
  args: {
    children: "Design",
    tone: "brand",
    variant: "subtle",
    size: "md",
    leadingIcon: "None" as unknown as TagProps["leadingIcon"],
    trailingIcon: "None" as unknown as TagProps["leadingIcon"],
    removable: false,
    removeTabStop: true,
    onRemove: fn(),
    removeLabel: "",
    disabled: false,
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Tag>;

type InteractionMode = "Static" | "Clickable" | "Selectable";

// `interactionMode` is a Playground-only Controls axis, not a real Tag
// prop — none of `onClick`/`selected`/`defaultSelected`/`onSelectedChange`
// can be a sensible standalone control on their own (see each one's own
// argTypes description above: functions have nothing to toggle, and a
// bare `selected` toggle with no synced `onSelectedChange` looks broken).
// This one synthetic select composes them into a single, correctly-
// behaving control, the same way `AllTones`/`AllSizes` below already
// synthesize a grid axis that isn't a 1:1 real prop either. Defaults to
// "Static" — Tag's real zero-extra-props default — so the Playground's
// initial render matches what a plain `<Tag>` actually looks like, rather
// than starting pre-opted into interactive mode.
interface PlaygroundArgs extends TagProps {
  interactionMode: InteractionMode;
}

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tagPlaygroundSnippet(context.args),
      },
    },
  },
  // Cast: `interactionMode` isn't part of `TagProps` — see the interface
  // and comment above. `onClick`/`onSelectedChange` are created once here
  // (module-eval time, not per-render) so their identity — and Actions-
  // panel call history — stays stable across unrelated control changes,
  // matching every other `fn()` usage in this file.
  args: {
    interactionMode: "Static",
    onClick: fn(),
    defaultSelected: false,
    onSelectedChange: fn(),
  } as TagProps,
  argTypes: {
    interactionMode: {
      name: "Interaction mode",
      control: "select",
      options: ["Static", "Clickable", "Selectable"],
      description:
        'Playground-only control (not a real Tag prop). "Static": none of onClick/defaultSelected/onSelectedChange are applied — Tag\'s real default. "Clickable": wires only onClick. "Selectable": wires defaultSelected + onSelectedChange (uncontrolled, so the tag below toggles live on click/Enter/Space with no external state needed).',
    },
  } as NonNullable<Meta<typeof Tag>["argTypes"]>,
  render: (args) => {
    const { interactionMode, onClick, defaultSelected, onSelectedChange, ...rest } =
      args as PlaygroundArgs;
    if (interactionMode === "Clickable") {
      return <Tag {...rest} onClick={onClick} />;
    }
    if (interactionMode === "Selectable") {
      return (
        <Tag
          {...rest}
          defaultSelected={defaultSelected}
          onSelectedChange={onSelectedChange}
        />
      );
    }
    return <Tag {...rest} />;
  },
};

export const Default: Story = {};

export const AllTones: Story = {
  name: "All tones (subtle)",
  parameters: { docs: { source: { code: tagSnippets.allTones } } },
  // `tone`/`children` are the whole point of this grid — each instance
  // intentionally varies both together, so no single control value could
  // represent them. Every other prop stays live and shared via `{...args}`
  // (matches Badge's own AllTonesSubtle precedent). `removeLabel` is the
  // one exception: it's a *text* value tied to whichever tag it's on, so
  // leaving the shared "Remove Design" arg wired here would mislabel every
  // tag except a literal "Design" one — explicitly reset to `undefined`
  // per instance instead, letting Tag's own `Remove ${children}` fallback
  // compute the correct label for each tone (found in review: toggling
  // `removable` on here previously made every remove button announce
  // "Remove Design" regardless of its actual tone label).
  argTypes: {
    tone: { control: false },
    children: { control: false },
    removeLabel: { control: false },
  },
  args: { variant: "subtle" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)", flexWrap: "wrap" }}>
      {(
        ["brand", "neutral", "info", "success", "warning", "highlight", "danger"] as const
      ).map((tone) => (
        <Tag key={tone} {...args} tone={tone} removeLabel={undefined}>
          {tone}
        </Tag>
      ))}
    </div>
  ),
};

export const Solid: Story = {
  name: "All tones (solid)",
  parameters: { docs: { source: { code: tagSnippets.solid } } },
  argTypes: {
    tone: { control: false },
    children: { control: false },
    removeLabel: { control: false },
  },
  args: { variant: "solid" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)", flexWrap: "wrap" }}>
      {(
        ["brand", "neutral", "info", "success", "warning", "highlight", "danger"] as const
      ).map((tone) => (
        <Tag key={tone} {...args} tone={tone} removeLabel={undefined}>
          {tone}
        </Tag>
      ))}
    </div>
  ),
};

export const Outlined: Story = {
  name: "All tones (outlined)",
  parameters: { docs: { source: { code: tagSnippets.outlined } } },
  argTypes: {
    tone: { control: false },
    children: { control: false },
    removeLabel: { control: false },
  },
  args: { variant: "outlined" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)", flexWrap: "wrap" }}>
      {(
        ["brand", "neutral", "info", "success", "warning", "highlight", "danger"] as const
      ).map((tone) => (
        <Tag key={tone} {...args} tone={tone} removeLabel={undefined}>
          {tone}
        </Tag>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: tagSnippets.allSizes } } },
  // `size`/`children` are the whole point of this grid, same reasoning as
  // AllTones above — `removeLabel` gets the same per-instance reset for
  // the same reason (every instance's real label is "Size {size}", not
  // "Design").
  argTypes: {
    size: { control: false },
    children: { control: false },
    removeLabel: { control: false },
  },
  render: (args) => (
    <div
      style={{
        display: "flex",
        gap: "var(--dbm-space-2)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Tag key={size} {...args} size={size} removeLabel={undefined}>
          Size {size}
        </Tag>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  name: "With leading icon",
  parameters: { docs: { source: { code: tagSnippets.withIcon } } },
  // `leadingIcon` uses the mapped string key ("Tag"), not the raw TagIcon
  // reference — the Controls-panel select can only show as "selected"
  // when the arg value matches one of its mapping's option keys (same
  // reasoning as the Playground's own `args.leadingIcon` above); passing
  // the real component reference directly rendered correctly but left the
  // control itself showing "unselected", a real control/canvas mismatch.
  args: { leadingIcon: "Tag" as unknown as TagProps["leadingIcon"], tone: "info" },
};

export const WithTrailingIcon: Story = {
  name: "With trailing icon",
  parameters: { docs: { source: { code: tagSnippets.withTrailingIcon } } },
  args: {
    trailingIcon: "Star" as unknown as TagProps["leadingIcon"],
    tone: "warning",
  },
};

export const Clickable: Story = {
  name: "Clickable (no selection state)",
  parameters: { docs: { source: { code: tagSnippets.clickable } } },
  // `onClick` alone applies no built-in "active" look — just makes the
  // tag focusable/keyboard-activatable. Pair with `selected` for a
  // visual toggle state (see the Selectable stories below).
  args: { onClick: fn(), tone: "info" },
};

export const Selectable: Story = {
  name: "Selectable (click to toggle)",
  parameters: { docs: { source: { code: tagSnippets.selectable } } },
  // Uncontrolled (`defaultSelected`) — Tag manages its own toggle state
  // internally, so clicking directly in the canvas below visibly toggles
  // the selected ring with no story-level state needed. Starts
  // *unselected* — this story's job is to demonstrate the toggle action
  // itself, so the first click turning the ring on is the clearer demo;
  // what the selected look already looks like on load is separately shown
  // by `SelectableFilterGroup` below ("Design" starts selected there).
  args: { defaultSelected: false, onSelectedChange: fn(), tone: "info" },
};

export const SelectableOutline: Story = {
  name: "Selectable (outlined)",
  parameters: { docs: { source: { code: tagSnippets.selectableOutlined } } },
  // Same toggle behavior as `Selectable` above, but on the `outlined`
  // variant specifically — demonstrates that selecting it swaps in a
  // full tone fill with on-color text (converging toward `solid`'s own
  // look) rather than the offset-halo ring `solid`'s own selected state
  // uses; the border itself is unchanged from its unselected color.
  args: {
    defaultSelected: false,
    onSelectedChange: fn(),
    tone: "info",
    variant: "outlined",
  },
};

export const SelectableFilterGroup: Story = {
  name: "Selectable filter group",
  parameters: { docs: { source: { code: tagSnippets.selectableFilterGroup } } },
  // Fully bespoke — tone/selected/onSelectedChange are hardcoded/wired to
  // local state per instance below, not read from `args` at all. Every
  // inherited control is explicitly marked dead rather than left looking
  // live (found in review: none of them had any effect here, the same
  // "dead controls" bug class AllTones/AllSizes were already fixed for).
  argTypes: {
    children: { control: false },
    tone: { control: false },
    variant: { control: false },
    size: { control: false },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
    removable: { control: false },
    removeLabel: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: function SelectableFilterGroupStory() {
    const [selected, setSelected] = useState<Record<string, boolean>>({
      Design: true,
      Engineering: false,
      "In review": false,
    });
    return (
      <div style={{ display: "flex", gap: "var(--dbm-space-2)", flexWrap: "wrap" }}>
        {Object.keys(selected).map((filter) => (
          <Tag
            key={filter}
            tone="info"
            selected={selected[filter]}
            onSelectedChange={(next) =>
              setSelected((prev) => ({ ...prev, [filter]: next }))
            }
          >
            {filter}
          </Tag>
        ))}
      </div>
    );
  },
};

export const Disabled: Story = {
  name: "Disabled (interactive)",
  parameters: { docs: { source: { code: tagSnippets.disabled } } },
  // `disabled` only has an effect once the tag is interactive — this
  // story fixes `onClick`/`defaultSelected`/`onSelectedChange` so the
  // control panel's own `disabled` toggle demonstrates a real blocked
  // interaction, not the dev-warning no-op case (a plain `<Tag disabled>`
  // with nothing else). Removable too, so both the click-block and the
  // remove-block are visible in one instance — its decorative remove
  // glyph shares the same dim/blocked treatment as the rest of the tag
  // (see Tag.module.css's own `.disabled` comment for why no separate
  // per-glyph opacity is needed).
  args: {
    tone: "info",
    removable: true,
    onRemove: fn(),
    disabled: true,
    defaultSelected: false,
    onSelectedChange: fn(),
    onClick: fn(),
  },
};

export const RemovableAndSelectable: Story = {
  name: "Removable + selectable together",
  parameters: { docs: { source: { code: tagSnippets.removableAndSelectable } } },
  // Confirms the two coexist correctly: clicking the tag body toggles
  // `selected`, clicking the trailing × removes it — neither triggers the
  // other (Tag.tsx's `handleRemoveClick` stopPropagation on the mouse
  // side, the keydown `target === currentTarget` check on the keyboard
  // side).
  // Fully bespoke, same reasoning as `SelectableFilterGroup` above — every
  // inherited control is dead here too.
  argTypes: {
    children: { control: false },
    tone: { control: false },
    variant: { control: false },
    size: { control: false },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
    removable: { control: false },
    removeLabel: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: function RemovableAndSelectableStory() {
    const [filters, setFilters] = useState(["Design", "Engineering"]);
    const [selected, setSelected] = useState<Record<string, boolean>>({
      Design: true,
      Engineering: false,
    });
    return (
      <div style={{ display: "flex", gap: "var(--dbm-space-2)", flexWrap: "wrap" }}>
        {filters.map((filter) => (
          <Tag
            key={filter}
            tone="info"
            removable
            onRemove={() =>
              setFilters((prev) => prev.filter((f) => f !== filter))
            }
            selected={selected[filter] ?? false}
            onSelectedChange={(next) =>
              setSelected((prev) => ({ ...prev, [filter]: next }))
            }
          >
            {filter}
          </Tag>
        ))}
      </div>
    );
  },
};

export const RemovableFilterList: Story = {
  name: "Removable filter list",
  parameters: { docs: { source: { code: tagSnippets.removableFilterList } } },
  // Fully bespoke, same reasoning as `SelectableFilterGroup` above — every
  // inherited control is dead here too (real per-tag `onRemove` wired to
  // local state, tone/removable hardcoded).
  argTypes: {
    children: { control: false },
    tone: { control: false },
    variant: { control: false },
    size: { control: false },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
    removable: { control: false },
    removeLabel: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: function RemovableFilterListStory() {
    const [filters, setFilters] = useState([
      "Design",
      "Engineering",
      "In review",
    ]);
    return (
      <div style={{ display: "flex", gap: "var(--dbm-space-2)", flexWrap: "wrap" }}>
        {filters.map((filter) => (
          <Tag
            key={filter}
            tone="info"
            removable
            onRemove={() => setFilters(filters.filter((f) => f !== filter))}
          >
            {filter}
          </Tag>
        ))}
      </div>
    );
  },
};

export const ClickInteraction: Story = {
  name: "Interaction: fires onRemove",
  args: { removable: true, onRemove: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Design" }),
    );
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const KeyboardInteraction: Story = {
  name: "Interaction: remove button is focusable and activatable via Enter",
  args: { removable: true, onRemove: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const removeButton = canvas.getByRole("button", { name: "Remove Design" });
    await userEvent.tab();
    await expect(removeButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const OnClickInteraction: Story = {
  name: "Interaction: fires onClick",
  args: { onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Design" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SelectedToggleInteraction: Story = {
  name: "Interaction: toggles selected via click and Enter",
  args: { defaultSelected: false, onSelectedChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByRole("button", { name: "Design" });
    await expect(tag).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(tag);
    await expect(tag).toHaveAttribute("aria-pressed", "true");
    await expect(args.onSelectedChange).toHaveBeenNthCalledWith(1, true);

    tag.focus();
    await userEvent.keyboard("{Enter}");
    await expect(tag).toHaveAttribute("aria-pressed", "false");
    await expect(args.onSelectedChange).toHaveBeenNthCalledWith(2, false);
  },
};

export const RemoveDoesNotTriggerSelectInteraction: Story = {
  name: "Interaction: clicking remove doesn't also toggle selected",
  args: {
    removable: true,
    onRemove: fn(),
    defaultSelected: false,
    onSelectedChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    // The remove glyph is intentionally `aria-hidden`/non-focusable in this
    // combined mode (see Tag.tsx's own comment on the decorative branch),
    // so it isn't reachable via `getByRole` — a raw class-substring query
    // is the correct tool for a deliberately non-accessible element,
    // mirroring the same CSS-Modules-hash-tolerant matching this file's
    // own unit tests already use elsewhere.
    const removeIcon = canvasElement.querySelector('[class*="removeDecorative"]');
    if (!removeIcon) throw new Error("Decorative remove icon not found");
    await userEvent.click(removeIcon);
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    await expect(args.onSelectedChange).not.toHaveBeenCalled();
  },
};

export const RemoveViaKeyboardInteraction: Story = {
  name: "Interaction: Delete/Backspace removes in the combined removable + interactive mode",
  args: {
    removable: true,
    onRemove: fn(),
    defaultSelected: false,
    onSelectedChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByRole("button", { name: "Design" });
    await expect(tag).toHaveAttribute("aria-keyshortcuts", "Delete Backspace");

    await userEvent.tab();
    await expect(tag).toHaveFocus();
    await userEvent.keyboard("{Delete}");
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    // Delete/Backspace only removes — it must not also toggle selection.
    await expect(args.onSelectedChange).not.toHaveBeenCalled();
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks click, keyboard, and remove",
  args: {
    disabled: true,
    onClick: fn(),
    defaultSelected: false,
    onSelectedChange: fn(),
    removable: true,
    onRemove: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByRole("button", { name: "Design" });
    await expect(tag).toHaveAttribute("aria-disabled", "true");

    // Still focusable via Tab (aria-disabled, not a real removed-from-
    // tab-order native disabled) — the tag stays discoverable to
    // keyboard/AT users, it just doesn't activate. Checked *before* the
    // click below: a real browser focuses a clicked focusable element as
    // a side effect of the click itself, so tabbing afterward would move
    // focus *away* from an already-focused tag rather than onto it.
    await userEvent.tab();
    await expect(tag).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSelectedChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Delete}");
    await expect(args.onRemove).not.toHaveBeenCalled();

    await userEvent.click(tag);
    await expect(args.onClick).not.toHaveBeenCalled();
    await expect(args.onSelectedChange).not.toHaveBeenCalled();

    const removeIcon = canvasElement.querySelector('[class*="removeDecorative"]');
    if (!removeIcon) throw new Error("Decorative remove icon not found");
    await userEvent.click(removeIcon);
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};
