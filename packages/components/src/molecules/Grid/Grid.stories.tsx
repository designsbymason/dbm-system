import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { GridItem } from "../../atoms/GridItem";
import { Grid } from "./Grid";
import { gridPlaygroundSnippet, gridSnippets } from "./Grid.snippets";
import styles from "./Grid.stories.module.css";

const cellStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-3)",
  textAlign: "center" as const,
};

// A "chip" with NO explicit width/height (content-sized via padding only,
// same shape as `cellStyle` above) — required for justifyItems/alignItems
// to have any visible effect at all. CSS `stretch` only applies to a grid
// item with no *definite* size on that axis; a percentage size (the
// previous approach here, found and fixed 2026-09-11 to solve a gap-overflow
// bug — see git history) still counts as definite and permanently blocks
// `stretch`, and uniform padding/no size at all is also what lets
// `start`/`center`/`end` actually reposition the item within its cell
// instead of it already filling the whole thing. The earlier overflow/
// dead-space concern that motivated percentage sizing no longer applies:
// `ColumnTrackOverlay` (added afterward) now paints each cell's own
// boundary directly, so a small content-sized chip inside a visibly larger
// cell reads as "item within its cell", not "broken gap" (found and fixed
// 2026-09-12, user-reported: justifyItems/alignItems "stretch"/"baseline"
// showed no visible change).
const chipStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-3)",
  textAlign: "center" as const,
};

// Mirrors `Grid.tsx`'s own private `CONTENT_ALIGN` map (not exported, so
// duplicated here — this is Storybook-only presentational code, not shipped
// logic) — `justifyContent`/`alignContent`'s "between"/"around"/"evenly"
// aren't real CSS keywords on their own; `ColumnTrackOverlay` needs the
// same translation the real `Grid` applies internally, or its own nested
// grid renders `justify-content: normal` instead (an actual bug found this
// way, not assumed — see `ColumnTrackOverlay`'s own comment).
const toCssContentAlign = (value: string | undefined) => {
  if (value === "between") return "space-between";
  if (value === "around") return "space-around";
  if (value === "evenly") return "space-evenly";
  return value;
};

const Cells = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={cellStyle}>
        {i + 1}
      </div>
    ))}
  </>
);

// Font size alternates per chip so `alignItems: baseline` has something to
// actually demonstrate — with every chip the same size, their text
// baselines already land in the same place under any alignment, making
// "baseline" visually indistinguishable from "start" (same fix as above,
// 2026-09-12).
const Chips = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        style={{
          ...chipStyle,
          fontSize:
            i % 2 === 0
              ? "var(--dbm-font-size-xs)"
              : "var(--dbm-font-size-xl)",
        }}
      >
        {i + 1}
      </div>
    ))}
  </>
);

// A decorative overlay, one stripe per grid *cell* (not one continuous
// stripe per column) — added 2026-09-11, at explicit user direction, to
// make spanning/gaps/auto-placement easier to read at a glance; redesigned
// 2026-09-12, user-reported ("I see the vertical gap, but... no white space
// between the rows"): the original design rendered exactly `columns` many
// stripes, each explicitly spanning the *entire* height in one continuous
// block — column-gaps showed correctly (real CSS `gap` between adjacent
// stripes), but since each column was only ever one uninterrupted stripe,
// there was no row boundary anywhere for a row-gap to visibly break. Fixed
// by rendering `count` many ordinary, uniformly-sized stripes with no
// explicit position at all, letting the *same* CSS Grid auto-placement
// algorithm the real content uses lay them out — real row-gaps now appear
// naturally between every row, for free, exactly where the real grid's own
// rows break.
//
// Deliberately NOT implemented as extra grid items inside the *real* grid
// (the first approach tried, still correct as a reason to avoid it): a
// ghost item mixed into the real grid's own children competes with the
// real content for auto-placement slots — confirmed against the spec
// before building this, not assumed. Runs its own separate absolutely-
// positioned nested grid instead, matching the real grid's `columns`/`gap`
// exactly so its track boundaries land pixel-for-pixel on the real ones,
// with zero interaction with the real grid's own placement algorithm.
//
// Requires the real `<Grid>` to have both `position: "relative"` AND an
// explicit `zIndex: 0` in its own style — found and fixed 2026-09-11,
// user-reported "not displayed at all": `position: "relative"` alone does
// not establish a new CSS stacking context (only `position` combined with
// a non-`auto` `z-index` does), so without an explicit `zIndex` on `Grid`
// itself, the overlay's `zIndex: -1` doesn't resolve locally against its
// own parent — it escapes to whichever ancestor further up the tree *does*
// establish one, painting behind that instead and disappearing entirely.
// Confirmed by direct experiment: setting `zIndex: 0` on `Grid` alone (with
// the overlay still at `zIndex: -1`) was the one change that made the
// overlay actually visible, behind the real content, exactly as intended.
const ColumnTrackOverlay = ({
  columns,
  count,
  gap,
  gridTemplateColumns,
  autoRows,
  justifyContent,
  alignContent,
  responsiveColumns = false,
  responsiveGap = false,
  as: As = "div",
}: {
  columns: number;
  // How many uniform stripe cells to render — matches the real content's
  // own item count for a plain grid (auto-placement then naturally
  // produces the same row count as the real content, at any column count
  // or breakpoint, with no separate calculation needed); for a grid using
  // `GridItem`'s own `colSpan` (`WithSpanningItems`/`DensePacking`), the
  // real content's cell *occupancy* isn't 1 item = 1 cell, so this is
  // `rows × columns` instead (the full track rectangle the real content's
  // own row count actually needs), computed once by hand from that
  // story's own known layout, documented at its own call site.
  count: number;
  gap: number;
  // Escape hatch for a story like `ContentAlignment` that bypasses `Grid`'s
  // own `columns` prop entirely (fixed, non-`1fr` tracks via its own
  // `style.gridTemplateColumns` override) — lets the overlay mirror that
  // same literal template instead of assuming `1fr` tracks.
  gridTemplateColumns?: string;
  // Mirrors the real grid's own resolved `autoRows` (e.g. `"6rem"`) for a
  // `Chips`-based story, so implicit rows size identically on both —
  // without this, an empty stripe `<div>`'s own natural (contentless)
  // height would collapse each implicit row instead. Omit for a
  // `Cells`-based story instead (no story sets an explicit `autoRows` for
  // those) — each stripe's own padding + hidden text (below) approximates
  // a real `cellStyle` cell's natural content-driven height instead.
  autoRows?: string;
  // Must mirror the real grid's own `justifyContent`/`alignContent` — found
  // and fixed 2026-09-11, confirmed via measured `getBoundingClientRect()`
  // on `ContentAlignment` (not just visual impression): without these, the
  // overlay's own nested grid falls back to `justify-content: normal`
  // (tracks packed at the start), while the real grid's tracks were
  // actually spread via `justifyContent="between"` — the two landed in
  // completely different positions, not just off by a few pixels.
  justifyContent?: string;
  alignContent?: string;
  // Applies `.responsiveColumnsOverlay`/`.responsiveGapOverlay`
  // (Grid.stories.module.css) instead of the inline `gridTemplateColumns`/
  // `gap` — inline styles can't express `@media` queries, so a genuinely
  // responsive story (`ResponsiveColumns`/`ResponsiveGap`) needs the real
  // breakpoint cascade to live in an actual CSS class instead.
  responsiveColumns?: boolean;
  responsiveGap?: boolean;
  // `<div>` isn't valid content for a real `<ul>` (only `<li>`/`<script>`/
  // `<template>` are) — `AsUnorderedList` renders this overlay as `as="li"`
  // instead, so the DOM stays spec-valid even though React's own direct
  // DOM APIs (unlike innerHTML/HTML-string parsing) don't actually enforce
  // this and would have silently accepted a stray `<div>` there too
  // (confirmed live before fixing, not assumed).
  as?: "div" | "li";
}) => (
  <As
    aria-hidden="true"
    className={
      [
        responsiveColumns ? styles.responsiveColumnsOverlay : "",
        responsiveGap ? styles.responsiveGapOverlay : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined
    }
    style={{
      position: "absolute",
      inset: 0,
      zIndex: -1,
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: responsiveColumns
        ? undefined
        : (gridTemplateColumns ?? `repeat(${columns}, minmax(0, 1fr))`),
      gridAutoRows: autoRows,
      gap: responsiveGap ? undefined : `var(--dbm-space-${gap})`,
      justifyContent,
      alignContent,
      pointerEvents: "none",
    }}
  >
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        style={{ background: "var(--dbm-bg-brand-subtle)", padding: "var(--dbm-space-3)" }}
      >
        <span style={{ visibility: "hidden" }}>0</span>
      </div>
    ))}
  </As>
);

const meta: Meta<typeof Grid> = {
  title: "Components/Grid",
  id: "molecules-layout-grid",
  component: Grid,
  parameters: { layout: "padded" },
  // Ordered to match GridProps' own declaration order (as, columns,
  // minChildWidth, gap, autoFlow, autoRows, autoColumns, justifyItems,
  // alignItems, justifyContent, alignContent, children, then the inherited
  // native escape-hatch props last) — same sequencing principle the
  // Properties table uses (07-storybook-and-documentation-standards.md §4
  // item 3).
  argTypes: {
    // `control: false` — matches GridItem's/Heading's/Text's own identical
    // `as` argType: toggling it changes the rendered element, but a plain
    // <div> vs <ul> at otherwise-identical styling is indistinguishable
    // without opening devtools. Fully demonstrated on its own dedicated
    // "Polymorphic: as=ul" story instead, which renders real <li> children
    // so the semantic change is actually observable.
    as: {
      control: false,
      description: "The HTML element (or component) to render as.",
      table: { defaultValue: { summary: '"div"' } },
    },
    columns: {
      control: "number",
      description:
        "Number of columns, or a responsive map keyed by breakpoint, e.g. { base: 1, md: 2, lg: 3 }. Breakpoints follow a mobile-first cascade — each one applies at its min-width and above until overridden by a larger breakpoint. Ignored when minChildWidth is set.",
    },
    // `text` control + `""` starting arg, parsed back to `undefined` in
    // every render below — an empty string must NOT reach the component,
    // since Grid.tsx's own `minChildWidth !== undefined` check would then
    // apply `minmax(, 1fr)`, invalid CSS. Mirrors GridItem's own
    // `parseNumberArg` pattern for the same reason (a control needs a real,
    // defined starting value to read as "live," not `undefined`).
    minChildWidth: {
      control: "text",
      description:
        'Renders a fluid grid — as many columns as fit, each at least this CSS size wide (e.g. "12rem") — via repeat(auto-fill, minmax(minChildWidth, 1fr)), instead of a fixed or responsive column count. Takes precedence over columns when set.',
    },
    // `select`, not a plain `number` — `gap` is a spacing *token* step, not
    // an arbitrary integer, and the scale skips several numbers entirely
    // (no `space.7`, `space.9`, `space.11`, etc.). A plain number control
    // let you type an invalid step, which silently resolved to nothing and
    // collapsed to 0 with no error — found and fixed 2026-09-11,
    // user-reported ("no value associated with gap 7"). `SpaceValue` itself
    // already enforces this exact set at the type level; `Stack.stories.tsx`
    // already gets this right for its own `gap` — this matches it.
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "Gap between grid cells (both row and column), as a spacing token step — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    autoFlow: {
      control: "select",
      options: ["row", "column", "row dense", "column dense"],
      description:
        "Controls grid-auto-flow — how implicitly-placed items are auto-arranged.",
      table: { defaultValue: { summary: '"row"' } },
    },
    autoRows: {
      control: "text",
      description: "Sets grid-auto-rows — the size of implicitly-created rows.",
    },
    autoColumns: {
      control: "text",
      description:
        "Sets grid-auto-columns — the size of implicitly-created columns.",
    },
    justifyItems: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description:
        "justify-items — how each item aligns within its own cell along the inline (horizontal) axis — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    alignItems: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description:
        "align-items — how each item aligns within its own cell along the block (vertical) axis — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `control: false` — genuinely inert in this Playground's own demo:
    // both `columns` and `minChildWidth` generate 1fr-based column tracks,
    // which always fill 100% of the container's inline size by definition,
    // leaving justify-content nothing to position (see this prop's own
    // JSDoc in Grid.types.ts). Demonstrated on its own dedicated "Content
    // alignment" story instead, via a fixed (non-fr) gridTemplateColumns
    // override — the one real case where it has a visible effect.
    justifyContent: {
      control: false,
      options: ["start", "center", "end", "stretch", "between", "around", "evenly"],
      description:
        "justify-content — how the grid's own column tracks are positioned within the container along the inline axis, when their total size is smaller than the container. Has no visible effect under Grid's own default track sizing — see the Content alignment story.",
    },
    alignContent: {
      control: "select",
      options: ["start", "center", "end", "stretch", "between", "around", "evenly"],
      description:
        "align-content — how the grid's own row tracks are positioned within the container along the block axis, when their total size is smaller than the container — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `children` isn't a meaningful live-editable control for a layout
    // container rendering multiple structured child cells — every story
    // (including the Playground) hardcodes its own children in `render`.
    children: {
      control: false,
      description: "The content to lay out in the grid.",
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
  // Every controllable prop gets an explicit value matching its real
  // component default where one exists (columns=12, gap=0, autoFlow="row" —
  // CSS's own initial value, since autoFlow has no JS-level default either).
  // `minChildWidth`/`autoRows`/`autoColumns` get "" (parses to `undefined`,
  // see each argType's own comment) rather than a real value, since none of
  // the three has a safe non-empty default that wouldn't override `columns`
  // or otherwise change every other prop's own demonstrated behavior.
  // `justifyItems`/`alignItems`/`alignContent` have no true default (all
  // three are genuinely unset/`normal` until a consumer opts in) — per
  // 06-engineering-standards.md §9, a prop with no true default gets a
  // sensible non-blank demo value instead, so the demo starts from a
  // visibly non-trivial state rather than every chip stacked at its cell's
  // natural corner.
  args: {
    columns: 3,
    minChildWidth: "",
    gap: 4,
    autoFlow: "row",
    autoRows: "",
    autoColumns: "",
    justifyItems: "start",
    alignItems: "center",
    alignContent: "start",
    as: undefined,
  },
  render: (args) => {
    // `columns`/`gap`'s Playground controls only ever produce a plain
    // number (never a responsive map) — this narrowing is a type-safe
    // fallback, not a real runtime case, same reasoning as `ItemAlignment`'s
    // own `describe` helper below.
    const columns = typeof args.columns === "number" ? args.columns : 3;
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        minChildWidth={args.minChildWidth || undefined}
        autoRows={args.autoRows || "6rem"}
        autoColumns={args.autoColumns || undefined}
        style={{
          position: "relative",
          zIndex: 0,
          height: "16rem",
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={columns}
          count={6}
          gap={gap}
          autoRows={args.autoRows || "6rem"}
          alignContent={alignContent}
        />
        <Chips count={6} />
      </Grid>
    );
  },
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => gridPlaygroundSnippet(context.args),
      },
    },
  },
};

export const DefaultColumns: Story = {
  name: "Default (12 columns, no columns prop)",
  parameters: { docs: { source: { code: gridSnippets.defaultColumns } } },
  // `columns` isn't just hidden — it must never actually reach `Grid` at
  // all (the whole point of this story is the *default*, un-set value), so
  // it's explicitly overridden to `undefined` after the spread below, not
  // just given `control: false`. Every other prop stays genuinely live and
  // shared, spread via `{...args}` — this story previously used an
  // args-free `render: () => (...)`, which silently no-opped every control
  // except the ones each story explicitly hardcoded (found and fixed
  // 2026-09-11, user-reported: the "story ignores its own args" bug class
  // `06-engineering-standards.md` §9 already warns about).
  // `minChildWidth` disabled alongside `columns` — not just redundant with
  // it, but a *stronger* override: per Grid.tsx's own precedence (inline
  // `gridTemplateColumns` from `minChildWidth` always wins over the
  // `columns`-driven CSS class rule), setting it here would silently switch
  // the whole demo into a fluid grid, defeating the very point of this
  // story (found and fixed 2026-09-12, user-requested control-panel audit —
  // confirmed live: typing a value left `--grid-cols-base` inert while the
  // real rendered columns changed to a fluid, viewport-dependent count).
  argTypes: {
    columns: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  args: { gap: 2 },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 2;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={undefined}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={12}
          count={12}
          gap={gap}
          alignContent={alignContent}
        />
        <Cells count={12} />
      </Grid>
    );
  },
};

export const FixedColumns: Story = {
  name: "Fixed 4 columns",
  parameters: { docs: { source: { code: gridSnippets.fixedColumns } } },
  // `minChildWidth` disabled alongside `columns` — same reasoning as
  // DefaultColumns above: it silently overrides the fixed 4-column
  // structure this story exists to demonstrate (confirmed live 2026-09-12 —
  // at a wide enough viewport the real grid rendered 7 columns while
  // `ColumnTrackOverlay` still assumed 4, visibly misaligned).
  argTypes: {
    columns: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={4}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={4}
          count={8}
          gap={gap}
          alignContent={alignContent}
        />
        <Cells count={8} />
      </Grid>
    );
  },
};

export const ResponsiveColumns: Story = {
  name: "Responsive: 1 column mobile, 2 tablet, 3 desktop",
  parameters: { docs: { source: { code: gridSnippets.responsiveColumns } } },
  // `columns` is hardcoded to a responsive map here — no single `number`
  // control could represent "base=1, md=2, lg=3" as one value, the
  // multi-instance-gallery exception (06-engineering-standards.md §9).
  // Every other prop stays live via `{...args}`. `ColumnTrackOverlay` here
  // uses `responsiveColumns` (found and fixed 2026-09-12, user-reported —
  // the earlier version of this story had no overlay at all, since a
  // single static column count couldn't represent "1 at mobile, 2 at
  // tablet, 3 at desktop" without misaligning at two of the three): a real
  // CSS class (Grid.stories.module.css) mirrors the exact same
  // `{ base: 1, md: 2, lg: 3 }` breakpoint cascade via `@media` queries,
  // which an inline style alone can't express.
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  // `minChildWidth` disabled alongside `columns` — same reasoning as
  // DefaultColumns/FixedColumns above: it would silently override the
  // `{ base: 1, md: 2, lg: 3 }` responsive cascade this story exists to
  // demonstrate (2026-09-12 control-panel audit).
  argTypes: {
    columns: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={{ base: 1, md: 2, lg: 3 }}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={3}
          count={6}
          gap={gap}
          alignContent={alignContent}
          responsiveColumns
        />
        <Cells count={6} />
      </Grid>
    );
  },
};

export const WithSpanningItems: Story = {
  name: "With GridItem colSpan/rowSpan",
  parameters: { docs: { source: { code: gridSnippets.withSpanningItems } } },
  // `columns` is fixed at 4 — structural to this demo's own colSpan={2}/
  // colSpan={4} values, which assume a 4-column grid. Every other prop
  // (gap, autoFlow, alignment, etc.) stays live via `{...args}`.
  // `minChildWidth` disabled too — it would override that same 4-column
  // structure, leaving colSpan={4} spanning an arbitrary fluid column count
  // instead of "the full width" as labeled (2026-09-12 control-panel audit).
  argTypes: {
    columns: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={4}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        {/* count=8, not the real itemCount (4) — these GridItems span
            multiple cells (colSpan=2/1/1/4), filling exactly 2 rows × 4
            columns; 8 uniform 1x1 stripes is the full track rectangle that
            actually needs representing, not one stripe per real item. */}
        <ColumnTrackOverlay columns={4} count={8} gap={gap} alignContent={alignContent} />
        <GridItem colSpan={2} style={cellStyle}>
          colSpan=2
        </GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem colSpan={4} style={cellStyle}>
          colSpan=4 (full width)
        </GridItem>
      </Grid>
    );
  },
};

export const ResponsiveGap: Story = {
  name: "Responsive gap (tight on mobile, roomy from lg up)",
  parameters: { docs: { source: { code: gridSnippets.responsiveGap } } },
  // `gap` is hardcoded to a responsive map here — same multi-instance-
  // gallery exception as ResponsiveColumns above. `columns` stays live via
  // `{...args}` (its own meta default, 3, already matches this story's
  // original fixed value). `ColumnTrackOverlay` here uses `responsiveGap`
  // (found and fixed 2026-09-12, user-reported — same gap as
  // ResponsiveColumns had): a real CSS class mirrors the exact
  // `{ base: 1, lg: 8 }` cascade via `@media`, matching this story's own
  // `gap` prop exactly.
  // `parameters.chromatic` removed (2026-08-29) — see ResponsiveColumns
  // above, same file, for why.
  // `minChildWidth` disabled too — it would silently override `columns`
  // (still live here), leaving `ColumnTrackOverlay`'s `columns`-based
  // stripes misaligned against the resulting fluid grid (2026-09-12
  // control-panel audit).
  argTypes: {
    gap: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const columns = typeof args.columns === "number" ? args.columns : 3;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        gap={{ base: 1, lg: 8 }}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={columns}
          count={6}
          gap={0}
          alignContent={alignContent}
          responsiveGap
        />
        <Cells count={6} />
      </Grid>
    );
  },
};

export const FluidMinChildWidth: Story = {
  name: "Fluid: minChildWidth (no explicit breakpoints)",
  parameters: { docs: { source: { code: gridSnippets.fluidMinChildWidth } } },
  // `columns` disabled too, not just `minChildWidth` — `minChildWidth` is
  // hardcoded truthy below, and per Grid.tsx's own precedence (inline
  // `gridTemplateColumns` from `minChildWidth` always wins over the
  // `columns`-driven CSS class rule), that makes `columns` permanently
  // inert here regardless of its own value — confirmed live 2026-09-12:
  // `--grid-cols-base` changed on toggling the control, but the actual
  // rendered `grid-template-columns` never left `repeat(auto-fill, ...)`.
  argTypes: {
    columns: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        minChildWidth="var(--dbm-space-32)"
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        {/* The real column count here is however many `auto-fill` tracks
            fit the current container width — genuinely unknowable ahead of
            render (found and fixed 2026-09-12, user-reported — the earlier
            version of this story had no overlay at all for this reason).
            Reusing the exact same `repeat(auto-fill, minmax(...))` formula
            `Grid`/`Grid.tsx` itself applies means the overlay computes the
            *same* track count from the *same* container width natively, no
            JS measurement needed — `count={9}` matches the real content
            exactly (not an oversupply), so auto-placement wraps the
            overlay's own stripes into the same row count as the real
            `Cells`, with row-gaps landing in the same places. */}
        <ColumnTrackOverlay
          columns={12}
          count={9}
          gap={gap}
          gridTemplateColumns="repeat(auto-fill, minmax(var(--dbm-space-32), 1fr))"
          alignContent={alignContent}
        />
        <Cells count={9} />
      </Grid>
    );
  },
};

export const DensePacking: Story = {
  name: 'autoFlow="row dense" (backfills gaps from mixed spans)',
  parameters: { docs: { source: { code: gridSnippets.densePacking } } },
  // `autoFlow` and `columns` are both fixed — the demo's specific colSpan
  // values and gap-backfilling behavior are only meaningful against this
  // exact 4-column, row-dense combination. Every other prop stays live.
  // `minChildWidth` disabled too — it would override that same 4-column
  // structure the dense-packing backfill depends on (2026-09-12
  // control-panel audit).
  argTypes: {
    autoFlow: { control: false },
    columns: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={4}
        autoFlow="row dense"
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        {/* count=8 (2 rows × 4 columns), same reasoning as
            WithSpanningItems above — these 5 GridItems' own colSpan values
            don't map 1:1 to cells. */}
        <ColumnTrackOverlay columns={4} count={8} gap={gap} alignContent={alignContent} />
        <GridItem colSpan={2} style={cellStyle}>
          colSpan=2
        </GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem colSpan={2} style={cellStyle}>
          colSpan=2
        </GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
      </Grid>
    );
  },
};

export const ItemAlignment: Story = {
  name: "justifyItems/alignItems (aligning every item within its own cell)",
  parameters: { docs: { source: { code: gridSnippets.itemAlignment } } },
  // `justifyItems`/`alignItems` are set on the *grid container* and apply
  // uniformly to every item in it (the CSS Grid item-alignment properties
  // are not settable per-item through Grid alone — GridItem has no such
  // props). Demonstrated via two grids, each its own full-width row (found
  // and fixed 2026-09-12, user-requested — previously side-by-side at a
  // fixed 13rem each), that share every prop via `{...args}` — columns,
  // gap, autoRows, etc. all stay live and update both grids identically —
  // except `justifyItems`/`alignItems` themselves: the top grid always
  // forces them `undefined` (the fixed "unset" baseline), the bottom grid
  // uses their live value from `args`. This keeps the comparison
  // meaningful under any combination of the other controls, rather than
  // the two grids silently drifting apart.
  // `minChildWidth` disabled — it would override `columns` (still live) on
  // both grids identically, but `ColumnTrackOverlay`'s own `columns` prop
  // stays a static number either way, so the overlay would misalign against
  // the resulting fluid grid (2026-09-12 control-panel audit).
  argTypes: { minChildWidth: { control: false }, children: { control: false } },
  args: { columns: 2, autoRows: "6rem" },
  render: (args) => {
    const sharedProps = {
      ...args,
      minChildWidth: args.minChildWidth || undefined,
      autoRows: args.autoRows || "6rem",
      autoColumns: args.autoColumns || undefined,
    };
    // `justifyItems`/`alignItems` are typed `Responsive<GridItemsAlign>` —
    // a responsive breakpoint map is a valid value but isn't renderable as
    // plain text; the Playground's own `select` control only ever produces
    // a plain string, so this is just a type-safe display fallback, not a
    // real runtime case.
    const describe = (value: unknown) =>
      typeof value === "string" ? value : "unset";
    const columns = typeof args.columns === "number" ? args.columns : 2;
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)" }}>
        <div>
          <p style={{ margin: "0 0 var(--dbm-space-2)" }}>
            Unset (default — CSS&apos;s own initial value, &quot;normal&quot;,
            behaves as &quot;stretch&quot; for an item with no definite size,
            same as the bottom grid below with justifyItems/alignItems
            explicitly set to &quot;stretch&quot;)
          </p>
          <Grid
            {...sharedProps}
            justifyItems={undefined}
            alignItems={undefined}
            style={{
              position: "relative",
              zIndex: 0,
              width: "100%",
              outline: "1px dashed var(--dbm-border-focus)",
            }}
          >
            <ColumnTrackOverlay
              columns={columns}
              count={4}
              gap={gap}
              autoRows={sharedProps.autoRows}
              alignContent={alignContent}
            />
            <Chips count={4} />
          </Grid>
        </div>
        <div>
          <p style={{ margin: "0 0 var(--dbm-space-2)" }}>
            justifyItems=&quot;{describe(args.justifyItems)}&quot; alignItems=&quot;
            {describe(args.alignItems)}&quot;
          </p>
          <Grid
            {...sharedProps}
            style={{
              position: "relative",
              zIndex: 0,
              width: "100%",
              outline: "1px dashed var(--dbm-border-focus)",
            }}
          >
            <ColumnTrackOverlay
              columns={columns}
              count={4}
              gap={gap}
              autoRows={sharedProps.autoRows}
              alignContent={alignContent}
            />
            <Chips count={4} />
          </Grid>
        </div>
      </div>
    );
  },
};

export const ContentAlignment: Story = {
  name: "justifyContent/alignContent (positioning the grid's own tracks)",
  parameters: { docs: { source: { code: gridSnippets.contentAlignment } } },
  // `justifyContent`/`alignContent` only have a visible effect when the
  // grid's own tracks total less than the container's size — not the case
  // for `columns`/`minChildWidth`, both of which always generate 1fr-based
  // tracks that fill 100% of the container (see each prop's own JSDoc in
  // Grid.types.ts). Demonstrated via a direct `gridTemplateColumns`
  // override through the `style` escape hatch — three fixed 4rem tracks,
  // deliberately narrower than the container — the one real way these
  // props become relevant today, which is also why `columns` is disabled
  // here (it would be silently overridden by that same `style`, same as
  // `justifyContent` was found to be genuinely inert in the Playground).
  // `justifyContent`'s control is explicitly re-enabled here, overriding
  // the `control: false` set at the meta level — that meta-level setting
  // is correct for the Playground/every other story (where the prop is
  // genuinely inert), but this is the one story where it actually has a
  // visible effect, and a per-story `argTypes` override was needed or it
  // would have silently inherited "disabled" here too (found and fixed
  // 2026-09-11, user-reported).
  // `minChildWidth` disabled alongside `columns` — confirmed live
  // 2026-09-12 to be fully inert here, not just structurally undesirable:
  // this story's own hardcoded `style.gridTemplateColumns` ("repeat(3,
  // 4rem)") is spread onto `Grid` last, after `minChildWidth`'s own
  // conditional `gridTemplateColumns` in Grid.tsx's internal style object —
  // so the consumer-provided `style` always wins, and minChildWidth can
  // never have any visible effect in this story regardless of its value.
  argTypes: {
    columns: { control: false },
    minChildWidth: { control: false },
    justifyContent: {
      control: "select",
      options: ["start", "center", "end", "stretch", "between", "around", "evenly"],
    },
    children: { control: false },
  },
  args: { justifyContent: "between", alignContent: "center" },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const justifyContent = toCssContentAlign(
      typeof args.justifyContent === "string" ? args.justifyContent : undefined,
    );
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={undefined}
        minChildWidth={args.minChildWidth || undefined}
        autoRows={args.autoRows || undefined}
        autoColumns={args.autoColumns || undefined}
        style={{
          position: "relative",
          zIndex: 0,
          gridTemplateColumns: "repeat(3, 4rem)",
          height: "12rem",
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={3}
          count={3}
          gap={gap}
          gridTemplateColumns="repeat(3, 4rem)"
          justifyContent={justifyContent}
          alignContent={alignContent}
        />
        <Chips count={3} />
      </Grid>
    );
  },
};

export const AsUnorderedList: Story = {
  name: 'Polymorphic: as="ul" (real semantic list, Grid layout behavior)',
  parameters: { docs: { source: { code: gridSnippets.asUnorderedList } } },
  // `as` is fixed to "ul" — necessary for valid list markup, the whole
  // point of this story. Every other prop (columns/gap default to 3 here,
  // overriding the Playground's own meta defaults) stays live via
  // `{...args}`. `minChildWidth` is the one exception — left live it would
  // override `columns` (still live) and misalign `ColumnTrackOverlay`'s own
  // `columns`-based stripes against the resulting fluid grid, same as every
  // other non-Playground/non-fluid story (2026-09-12 control-panel audit).
  argTypes: {
    as: { control: false },
    minChildWidth: { control: false },
    children: { control: false },
  },
  args: { columns: 3, gap: 3 },
  render: (args) => {
    const columns = typeof args.columns === "number" ? args.columns : 3;
    const gap = typeof args.gap === "number" ? args.gap : 3;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        as="ul"
        style={{
          position: "relative",
          zIndex: 0,
          listStyle: "none",
          margin: 0,
          padding: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={columns}
          count={6}
          gap={gap}
          alignContent={alignContent}
          as="li"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} style={cellStyle}>
            {i + 1}
          </li>
        ))}
      </Grid>
    );
  },
};
