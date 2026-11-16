import { CheckIcon, GearIcon, HouseIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { useArgs } from "storybook/preview-api";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { ListItem } from "../../atoms/ListItem";
import { defaultMarkerFor, List } from "./List";
import { listPlaygroundSnippet, listSnippets } from "./List.snippets";
import type { ListElement } from "./List.types";

/**
 * Keeps the *native* Storybook Controls panel's own `marker` value in sync
 * with `as` whenever `as` changes — user-reported 2026-09-13: "when I
 * change the prop 'as' in the list story, nothing changes," because
 * `marker` had been given a fixed, real starting value (`"disc"`, see
 * `meta.args` below, itself a fix for a *different* bug — see that
 * comment) that no longer tracked `as` once it stopped being genuinely
 * `undefined`. Mirrors `Heading.stories.tsx`'s own identical
 * `useSyncSizeToLevel` (`size` following `level`) — a native `<select>`
 * control has no equivalent to the Docs page's own `resolveDisplayValue`
 * mechanism (display-only, doesn't touch the real arg), so keeping the
 * *actual* arg in sync via Storybook's own `updateArgs` is the only way to
 * make the native panel (not just the Docs page) show and use the correct
 * resolved value. Deliberately unconditional (always re-snaps `marker` to
 * `as`'s own default, not just when `marker` looks "auto-set") — matches
 * `useSyncSizeToLevel`'s own hard-won reasoning: tracking "was this
 * value user-picked or auto-set" in a `ref` has no guaranteed lifetime
 * across an HMR reload/internal re-render and can silently stop syncing.
 */
function useSyncMarkerToAs(as: ListElement | undefined) {
  const [, updateArgs] = useArgs();
  useEffect(() => {
    updateArgs({ marker: defaultMarkerFor[as ?? "ul"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [as]);
}

/**
 * `start`'s Storybook control is a plain text field, paired with a real
 * `""` starting arg (see `meta.args` below) rather than `undefined` —
 * mirrors `GridItem.stories.tsx`'s own identical `parseNumberArg` helper:
 * a `number` control gates on an undefined value showing an inert "Set
 * number" placeholder button instead of a real, always-editable input,
 * exactly like a `text` control shows "Set string" — neither control
 * *type* alone avoids this, only pairing the control with a real, defined
 * starting value does. `""` reads as empty while still meaning "no
 * explicit start" (native default of `1`) once parsed. `List`'s own
 * `start` prop stays real `number | undefined` — this parses the
 * control's raw string (or an already-numeric per-story demo value) back
 * to one before it's ever passed to the component.
 */
function parseNumberArg(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const meta: Meta<typeof List> = {
  title: "Components/List",
  id: "molecules-typography-list",
  component: List,
  parameters: { layout: "padded" },
  // Ordered to match ListProps' own declaration order (as, marker, spacing,
  // children, start, reversed, type, then id/className/style/data-testid) —
  // same sequencing principle the Properties table uses
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    as: {
      control: "select",
      options: ["ul", "ol"],
      description: "The list element to render.",
      table: { defaultValue: { summary: '"ul"' } },
    },
    marker: {
      control: "select",
      options: ["disc", "decimal", "none"],
      description: "Marker style. Defaults to 'disc' for ul and 'decimal' for ol.",
    },
    // `select`, not a plain `number` — `spacing` is a spacing *token* step,
    // matching Grid's/Stack's identical `gap`/`spacing` convention (see
    // Grid.stories.tsx's own `gap` argType for the full rationale: a plain
    // number control lets an invalid, non-token step through silently).
    spacing: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "Vertical gap between items, as a spacing token step — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `children` isn't a meaningful live-editable control for a list
    // rendering multiple structured `ListItem` children — every story
    // hardcodes its own children in `render`.
    children: {
      control: false,
      description: "The list items (typically ListItem).",
    },
    // `text` control + `""` starting arg — see this file's own
    // `parseNumberArg` comment above for why (not a plain `number` control
    // with `undefined`). `placeholder: "1"` matches the native default
    // when `start` is omitted, keeping the empty box from reading as
    // broken while still not setting any real value.
    start: {
      control: "text",
      description:
        'Native <ol> start — the ordinal value the first item counts from. Only applies when as="ol".',
      placeholder: "1",
    },
    reversed: {
      control: "boolean",
      description:
        'Native <ol> reversed — counts items in descending order. Only applies when as="ol".',
    },
    type: {
      control: "select",
      options: ["1", "a", "A", "i", "I"],
      description:
        'Native <ol> type — the marker character to count with. Only applies when as="ol".',
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value matching its real,
  // effective default — including `as`/`marker`, neither of which has a
  // destructuring-level default in `List.tsx` (both resolve via `??`
  // inside the function body instead), but both of which *do* have a real,
  // documented effective value (`as` → `'ul'`, `marker` → `'disc'` for the
  // resulting `ul`) that the canvas already renders regardless of what the
  // control shows. Leaving them `undefined` left the Controls panel
  // showing "Choose option..." while the canvas visibly rendered `ul`/
  // `disc` the whole time — a control claiming an unset state while the
  // canvas shows a real one is the same class of bug as a control that
  // silently doesn't work at all (06-engineering-standards.md §9, found
  // and fixed 2026-09-13, user-reported). `type` genuinely has no
  // effective default to show even when unset (no CSS override applies at
  // all until a real value is chosen — see `List.tsx`'s own `type`
  // handling) and correctly stays unset here; see the
  // `OrderedListSpecificProps` story below for where it's demonstrated
  // with a real value.
  args: {
    as: "ul",
    marker: "disc",
    spacing: 2,
    start: "" as unknown as number,
    reversed: false,
    type: undefined,
  },
  render: function DefaultRenderer(args) {
    useSyncMarkerToAs(args.as as ListElement);
    return (
      <List {...args} start={parseNumberArg(args.start)}>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </List>
    );
  },
};

export default meta;

type Story = StoryObj<typeof List>;

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => listPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Unordered: Story = {
  name: "Unordered (default)",
  parameters: { docs: { source: { code: listSnippets.unordered } } },
  // `as` fixed to the default `ul` — the whole point of this story is the
  // default marker/element, so it must never actually receive a live `as`
  // override (explicitly forced `undefined` after the spread below, not
  // just `control: false` — same reasoning as Grid's own `DefaultColumns`
  // story). Every other prop stays live via `{...args}`.
  argTypes: { as: { control: false } },
  render: (args) => (
    <List {...args} as={undefined} start={parseNumberArg(args.start)}>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const Ordered: Story = {
  name: "Ordered",
  parameters: { docs: { source: { code: listSnippets.ordered } } },
  // `marker` explicitly set to `"decimal"` — its own real, effective
  // resolved value once `as="ol"` (not the meta-level default of `"disc"`,
  // which only matches the default `ul` context) — same "control must
  // match what the canvas actually shows" reasoning as the meta-level fix
  // above, found while auditing this specific story (2026-09-13).
  argTypes: { as: { control: false } },
  args: { as: "ol", marker: "decimal" },
  render: (args) => (
    <List {...args} start={parseNumberArg(args.start)}>
      <ListItem>First step</ListItem>
      <ListItem>Second step</ListItem>
      <ListItem>Third step</ListItem>
    </List>
  ),
};

export const NoMarker: Story = {
  name: 'marker="none"',
  parameters: { docs: { source: { code: listSnippets.noMarker } } },
  // `marker` fixed to `"none"` — the whole point of this story, and the
  // one case exercising the Safari/VoiceOver `role="list"` fix. Every
  // other prop stays live via `{...args}`.
  argTypes: { marker: { control: false } },
  args: { marker: "none" },
  render: (args) => (
    <List {...args} start={parseNumberArg(args.start)}>
      <ListItem>Item without a marker</ListItem>
      <ListItem>Another item</ListItem>
    </List>
  ),
};

export const CustomSpacing: Story = {
  name: "Custom spacing between items",
  parameters: { docs: { source: { code: listSnippets.customSpacing } } },
  argTypes: { spacing: { control: false } },
  args: { spacing: 6 },
  render: function CustomSpacingStory(args) {
    useSyncMarkerToAs(args.as as ListElement);
    return (
      <List {...args} start={parseNumberArg(args.start)}>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </List>
    );
  },
};

export const OrderedListSpecificProps: Story = {
  name: 'as="ol" with start/reversed/type (ol-specific native props)',
  parameters: { docs: { source: { code: listSnippets.orderedListSpecificProps } } },
  // `as` fixed to `"ol"` — `start`/`reversed`/`type` are inert (and warn in
  // development) on the default `ul`, so this story exists specifically to
  // demonstrate them with a real, non-default value. `marker` explicitly
  // set to `"decimal"` (its own real resolved value for `ol`, same
  // reasoning as `Ordered` above) rather than inheriting the meta-level
  // `ul`-context default of `"disc"`. Every other prop (including
  // `start`/`reversed`/`type` themselves) stays live via `{...args}`.
  argTypes: { as: { control: false } },
  args: {
    as: "ol",
    marker: "decimal",
    start: "5" as unknown as number,
    reversed: true,
    type: "A",
  },
  render: (args) => (
    <List {...args} start={parseNumberArg(args.start)}>
      <ListItem>Counts down from 5</ListItem>
      <ListItem>Then 4</ListItem>
      <ListItem>Then 3</ListItem>
    </List>
  ),
};

export const ResponsiveSpacing: Story = {
  name: "Responsive spacing (tight on mobile, roomy from lg up)",
  parameters: { docs: { source: { code: listSnippets.responsiveSpacing } } },
  // `spacing` is hardcoded to a responsive map here — no single control
  // could represent "1 at base, 6 at lg" as one value, the
  // multi-instance-gallery exception (06-engineering-standards.md §9),
  // matching Grid's own `ResponsiveGap` story. Every other prop stays live.
  argTypes: { spacing: { control: false } },
  render: function ResponsiveSpacingStory(args) {
    useSyncMarkerToAs(args.as as ListElement);
    return (
      <List {...args} spacing={{ base: 1, lg: 6 }} start={parseNumberArg(args.start)}>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </List>
    );
  },
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (long items wrap)",
  parameters: { docs: { source: { code: listSnippets.narrowViewport } } },
  render: function NarrowViewportStory(args) {
    useSyncMarkerToAs(args.as as ListElement);
    return (
      <List {...args} start={parseNumberArg(args.start)}>
        <ListItem>
          A longer list item that should wrap gracefully at narrow viewport widths
          without overflowing its container.
        </ListItem>
        <ListItem>Short item</ListItem>
      </List>
    );
  },
};

export const WithListItemFeatures: Story = {
  name: "Composed with ListItem's icon/trailing/interactive features",
  parameters: { docs: { source: { code: listSnippets.withListItemFeatures } } },
  // `marker` fixed to `"none"` — every item here uses a custom `icon`,
  // which already suppresses the native marker on its own, so an explicit
  // marker style would be a visible no-op competing with it. See
  // ListItem.stories.tsx for each of these features demonstrated in
  // isolation (icon marker, trailing content, interactive/selected/
  // disabled) — this story exists to confirm the realistic *composed*
  // case (all of them together, inside a real List) actually works, not
  // to duplicate that per-feature breakdown.
  argTypes: { marker: { control: false } },
  args: { marker: "none" },
  render: function WithListItemFeaturesStory(args) {
    const [selected, setSelected] = useState("home");
    return (
      <List {...args} start={parseNumberArg(args.start)}>
        <ListItem
          interactive
          selected={selected === "home"}
          icon={HouseIcon}
          onClick={() => setSelected("home")}
        >
          Home
        </ListItem>
        <ListItem
          interactive
          selected={selected === "settings"}
          icon={GearIcon}
          trailing={<Badge tone="info">3</Badge>}
          onClick={() => setSelected("settings")}
        >
          Settings
        </ListItem>
        <ListItem
          interactive
          disabled
          icon={CheckIcon}
          trailing={<IconButton icon={GearIcon} aria-label="Configure" size="xs" variant="ghost" />}
          onClick={() => {}}
        >
          Unavailable
        </ListItem>
      </List>
    );
  },
};

export const NestedLists: Story = {
  name: "Nested lists",
  parameters: { docs: { source: { code: listSnippets.nestedLists } } },
  // Nesting already works mechanically with no code changes needed — a
  // `<ul>`/`<ol>` inside a `<li>`'s own content is standard, unguarded
  // HTML, and `ListItem` renders `children` as-is — this story exists to
  // actually demonstrate it, since nothing previously did.
  render: function NestedListsStory(args) {
    useSyncMarkerToAs(args.as as ListElement);
    return (
      <List {...args} start={parseNumberArg(args.start)}>
        <ListItem>
          Layout
          <List as="ol" spacing={1} marker="decimal">
            <ListItem>Grid</ListItem>
            <ListItem>Stack</ListItem>
          </List>
        </ListItem>
        <ListItem>Typography</ListItem>
        <ListItem>Inputs &amp; Forms</ListItem>
      </List>
    );
  },
};
