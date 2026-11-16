import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Grid } from "../../molecules/Grid";
import { GridItem } from "./GridItem";
import { gridItemPlaygroundSnippet, gridItemSnippets } from "./GridItem.snippets";

const cellStyle = {
  background: "var(--dbm-bg-brand-subtle)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-primary)",
  padding: "var(--dbm-space-3)",
  textAlign: "center" as const,
};

/**
 * `colStart`/`rowStart`'s Storybook control is a plain text field, paired
 * with a real `""` starting arg (see `meta.args` below) rather than
 * `undefined` — mirrors `Heading.stories.tsx`'s own identical
 * `parseTruncateArg` helper/comment: a `number` control gates on an
 * undefined value showing "Set number" exactly like a `text` control shows
 * "Set string," so neither control *type* alone avoids it. `""` is a real,
 * defined value that reads as empty, avoiding the gate while still meaning
 * "no explicit start" (auto-placement) once parsed. This parsing is
 * required, not cosmetic: unlike `colSpan`/`rowSpan` (safe to default to a
 * real `1` — auto-placement still applies normally when only a span is
 * set), explicitly setting `colStart`/`rowStart` on *every* item in a
 * multi-item story would pin them all to the same line, overlapping each
 * other — confirmed live (the `Order` story's three items all collapsed
 * onto grid-column-start 1 before this fix). `GridItem`'s own `colStart`/
 * `rowStart` props stay real `number | undefined` — this parses the
 * control's raw string back to one (or `undefined` for an empty/non-numeric
 * string) before it's ever passed to the component.
 */
function parseNumberArg(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const meta: Meta<typeof GridItem> = {
  title: "Components/GridItem",
  id: "atoms-layout-griditem",
  component: GridItem,
  parameters: { layout: "padded" },
  // Ordered to match GridItemProps' own declaration order (children,
  // colSpan, rowSpan, colStart, rowStart, order, as, then the inherited
  // native escape-hatch props last) — same sequencing principle the
  // Properties table uses (07-storybook-and-documentation-standards.md §4
  // item 3).
  argTypes: {
    children: { control: "text", description: "The content to render inside the grid cell." },
    colSpan: {
      control: "number",
      description:
        "Number of columns this item spans — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    rowSpan: {
      control: "number",
      description:
        "Number of rows this item spans — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `text` control + `""` starting arg — see this file's own
    // `parseNumberArg` comment above for why (not a plain `number` control
    // with `undefined`, unlike `colSpan`/`rowSpan` above). `placeholder`
    // (cosmetic only — see `PlaygroundControls.tsx`'s own doc comment on
    // that field) keeps the empty box from reading as broken while still
    // not setting any real value that could collide once spread across
    // more than one grid item, unlike a plain numeric default would (user
    // request, 2026-09-07).
    colStart: {
      control: "text",
      description:
        "Explicit starting column line (1-indexed, per the CSS Grid spec) — a single value, or a mobile-first responsive map keyed by breakpoint.",
      placeholder: "auto",
    },
    rowStart: {
      control: "text",
      description:
        "Explicit starting row line (1-indexed, per the CSS Grid spec) — a single value, or a mobile-first responsive map keyed by breakpoint.",
      placeholder: "auto",
    },
    order: {
      control: "number",
      description:
        "Visual reordering (CSS order), independent of DOM/source order — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `control: false` — matches Heading's/Text's own identical `as`
    // argType: toggling it genuinely changes the rendered element
    // (confirmed live), but a plain <div> vs <li> at otherwise-identical
    // styling is indistinguishable without opening devtools. `as` stays
    // fully live, and its effect fully visible, on the dedicated
    // "Polymorphic: as=li" story, which renders inside a real <ul> so the
    // semantic change is actually observable (and correct).
    as: {
      control: false,
      description: "The HTML element (or component) to render as.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // number"/"Set string" placeholder instead of a live, interactive control
  // (see guidelines/07-storybook-and-documentation-standards.md §5).
  // `colSpan`/`rowSpan` default to their own true CSS-initial value (`1`) —
  // safe to spread onto *any* number of sibling items, since a span of 1
  // never fights auto-placement. `colStart`/`rowStart` get `""`, not a
  // number — see this file's own `parseNumberArg` comment for why a real
  // default there is actually unsafe once spread onto more than one item.
  // `order`'s own true default is `0`, but the demo starts it at `1`
  // instead — deliberately not the real default, same carve-out as Heading's
  // own `wrap`/`align` defaults ("a sensible non-blank demo value" when the
  // true default wouldn't demonstrate anything). Here specifically: `0` and
  // `1` render identically against these fillers (see the comment below),
  // so starting at `0` means the very first increment (`0`→`1`) looks like
  // nothing happened — starting at `1` means a reader exploring upward
  // (`1`→`2`→`3`→`4`, the natural direction) never hits that dead step at
  // all; it only appears if they explicitly go back down to `0` (user
  // request, 2026-09-07).
  args: {
    children: "Grid cell",
    colSpan: 1,
    rowSpan: 1,
    colStart: "" as unknown as number,
    rowStart: "" as unknown as number,
    order: 1,
    as: undefined,
  },
  render: (args) => (
    <Grid columns={4} gap={4}>
      <GridItem
        {...args}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      />
      {/* Filler `order` values are 1/2/3 — the small, obvious numbers a
          reader would naturally try first — not spaced out (10/20/30 was
          tried first and reverted, at direct user request: nobody
          discovers "try 15" or "try 25" on their own, so it just moved the
          same discoverability problem to a different number range). Trying
          0,1,2,3,4 against these fillers produces only four visually
          distinct positions, not five — confirmed empirically (a
          three-item + one-item test grid, computed getBoundingClientRect
          order for each value): order=1 ties with this first filler (both
          order 1), and CSS resolves same-order ties by DOM position, which
          keeps the highlighted cell (earlier in the DOM) in front of it
          either way — so 0 and 1 look identical, but 2/3/4 each land in a
          new spot as they overtake one more filler in turn. `meta.args`
          above starts the demo's own `order` at `1`, not `0`, specifically
          so exploring upward from the default (the natural direction) never
          crosses that one dead step at all — see that arg's own comment.
          One skipped step either way is a far smaller cost than requiring a
          double-digit guess, which is what actually prompted this rewrite
          (user-reported, 2026-09-07: "why order 10, 20, 30 — how would
          users know those to test order properly?"). A first version of
          this demo before *that* used three identical, order-unset
          fillers, so any positive `order` at all looked the same regardless
          of value — also reported as "order does nothing" (same session)
          even though the prop itself was wired correctly throughout every
          iteration. */}
      <GridItem style={cellStyle} order={1}>
        Cell
      </GridItem>
      <GridItem style={cellStyle} order={2}>
        Cell
      </GridItem>
      <GridItem style={cellStyle} order={3}>
        Cell
      </GridItem>
    </Grid>
  ),
};

export default meta;

type Story = StoryObj<typeof GridItem>;

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => gridItemPlaygroundSnippet(context.args),
      },
    },
  },
};

export const ColSpan: Story = {
  name: "colSpan",
  parameters: { docs: { source: { code: gridItemSnippets.colSpan } } },
  argTypes: {
    colSpan: { control: false },
    children: { control: false },
  },
  args: { colSpan: 3 },
  render: (args) => (
    <Grid columns={4} gap={4}>
      <GridItem
        {...args}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        colSpan=3
      </GridItem>
      <GridItem style={cellStyle}>1</GridItem>
    </Grid>
  ),
};

export const ExplicitColumnPlacement: Story = {
  name: "colStart + colSpan (explicit placement)",
  parameters: { docs: { source: { code: gridItemSnippets.explicitColumnPlacement } } },
  argTypes: {
    colStart: { control: false },
    colSpan: { control: false },
    children: { control: false },
  },
  args: { colStart: 2, colSpan: 2 },
  render: (args) => (
    <Grid columns={4} gap={4}>
      <GridItem
        {...args}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        starts at column 2, spans 2
      </GridItem>
    </Grid>
  ),
};

export const ExplicitRowPlacement: Story = {
  name: "rowStart + rowSpan (explicit placement)",
  parameters: { docs: { source: { code: gridItemSnippets.explicitRowPlacement } } },
  argTypes: {
    rowStart: { control: false },
    rowSpan: { control: false },
    children: { control: false },
  },
  args: { rowStart: 2, rowSpan: 2 },
  render: (args) => (
    // `autoRows="4rem"` fixes every implicit row to the same height,
    // regardless of content. Without it (an earlier version of this story
    // used a plain `height: "12rem"` on the Grid instead), CSS Grid's
    // auto-sizing algorithm sizes each implicit row only by whatever
    // content actually occupies *that specific row* — and since nothing
    // else sits in columns 2/3 of rows 2-3 here, the two rows this item
    // spans end up far shorter than row 1's, so a rowSpan={2} item renders
    // barely taller than a rowSpan={1} one even though `grid-row: 2 / span
    // 2` is genuinely applied underneath (confirmed via computed style).
    <Grid columns={3} gap={4} autoRows="4rem">
      <GridItem
        {...args}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        starts at row 2, spans 2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
    </Grid>
  ),
};

export const RowAndColSpanCombined: Story = {
  name: "rowSpan + colSpan on the same item",
  parameters: { docs: { source: { code: gridItemSnippets.rowAndColSpanCombined } } },
  argTypes: {
    rowSpan: { control: false },
    colSpan: { control: false },
    children: { control: false },
  },
  args: { rowSpan: 2, colSpan: 2 },
  render: (args) => (
    // Same `autoRows` fix as the story above — without it, this item's
    // rowSpan={2} wouldn't visually read as double-height either.
    <Grid columns={3} gap={4} autoRows="4rem">
      <GridItem
        {...args}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        rowSpan=2, colSpan=2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
    </Grid>
  ),
};

export const Order: Story = {
  name: "order (visual reordering, independent of DOM order)",
  parameters: { docs: { source: { code: gridItemSnippets.order } } },
  // `order` is the deliberate varying axis (one instance per value, so no
  // single control value could represent "all of them" — per
  // 06-engineering-standards.md §9's multi-instance-gallery exception);
  // `children` is hardcoded per instance to label its DOM position and
  // order value. Every other prop (colSpan/rowSpan/colStart/rowStart) is
  // genuinely shared across all three instances and stays live — safe here
  // specifically because colStart/rowStart's own default is `""` (parses to
  // `undefined`/auto), not a real line number, so spreading them onto three
  // siblings doesn't pin them all to the same explicit position.
  argTypes: {
    order: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <Grid columns={3} gap={4}>
      <GridItem
        {...args}
        order={3}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        1st in DOM, order=3 (renders last)
      </GridItem>
      <GridItem
        {...args}
        order={1}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        2nd in DOM, order=1 (renders first)
      </GridItem>
      <GridItem
        {...args}
        order={2}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        3rd in DOM, order=2 (renders middle)
      </GridItem>
    </Grid>
  ),
};

export const ResponsiveSpan: Story = {
  name: "Responsive colSpan (full-width on mobile, half on desktop)",
  parameters: { docs: { source: { code: gridItemSnippets.responsiveSpan } } },
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  // `colSpan` is hardcoded to a responsive map here — no single `number`
  // control could represent "base=4, md=2" as one value, the same
  // multi-instance-gallery exception as `Order` above. Every other prop is
  // genuinely shared across both instances and stays live.
  argTypes: {
    colSpan: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <Grid columns={4} gap={4}>
      <GridItem
        {...args}
        colSpan={{ base: 4, md: 2 }}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        colSpan: base=4, md=2
      </GridItem>
      <GridItem
        {...args}
        colSpan={{ base: 4, md: 2 }}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        style={cellStyle}
      >
        colSpan: base=4, md=2
      </GridItem>
    </Grid>
  ),
};

export const AsListItem: Story = {
  name: 'Polymorphic: as="li" (real semantic list item, GridItem layout behavior)',
  parameters: { docs: { source: { code: gridItemSnippets.asListItem } } },
  // `as` is fixed to "li" on every instance (necessary for valid list
  // markup — every child of a real <ul> must be an <li>), matching
  // Heading's/Text's own identical `as` argType (globally disabled — see
  // that argType's own comment above). `colSpan` stays live and shared, so
  // toggling it while looking at this story still works.
  args: { colSpan: 2 },
  argTypes: {
    as: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <Grid
      as="ul"
      columns={4}
      gap={4}
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {/* Not `{...args} as="li"` — spreading the generically-inferred args
          object conflicts with a concrete `as="li"`: Storybook infers
          `args`'s type as a union across every element GridItem's fully
          open `ElementType` allows, so native event-handler props don't
          narrow to HTMLLIElement the way a direct literal call does (same
          issue and fix as Text.stories.tsx's own AsLabel story). Picking
          only the specific props this story cares about sidesteps that
          union entirely. */}
      <GridItem
        as="li"
        colSpan={args.colSpan}
        rowSpan={args.rowSpan}
        colStart={parseNumberArg(args.colStart)}
        rowStart={parseNumberArg(args.rowStart)}
        order={args.order}
        className={args.className}
        style={cellStyle}
        data-testid={args["data-testid"]}
      >
        colSpan=2
      </GridItem>
      <GridItem as="li" style={cellStyle}>
        1x1
      </GridItem>
      <GridItem as="li" style={cellStyle}>
        1x1
      </GridItem>
    </Grid>
  ),
};
