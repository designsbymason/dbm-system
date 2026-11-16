import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useArgs } from "storybook/preview-api";
import { Stack } from "../Stack";
import { defaultSizeForLevel, Heading } from "./Heading";
import { headingPlaygroundSnippet, headingSnippets } from "./Heading.snippets";
import type { HeadingLevel, HeadingTrim } from "./Heading.types";

/**
 * `truncate`'s Storybook control is a plain text field, paired with a real
 * `""` starting arg (see `meta.args` below) rather than `undefined` — see
 * that argType's own comment for the full reasoning (an empty string is
 * what actually avoids Storybook's "Set X" boundary button, not the
 * control *type*: confirmed empirically that a `text` control gates on an
 * undefined value exactly the same way a `number` control does, showing
 * "Set string" instead of "Set number" — an earlier version of this file
 * assumed `text` was exempt, which was wrong). `Heading`'s own `truncate`
 * prop stays a real `number` — this parses the control's raw string back
 * to one (or `undefined` for an empty/non-numeric string, rather than
 * `NaN` reaching a real CSS property) before it's ever passed to the
 * component.
 */
function parseTruncateArg(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Keeps a story's own `size` arg in sync with `level`'s real default —
 * shared by every story below whose `size` control should show that
 * resolved value instead of a blank "Choose option…" (the same reasoning
 * as the Playground's own version of this, `06-engineering-standards.md`
 * §9's DRY rule: identical logic, now needed in six places, not one).
 * Deliberately unconditional, not "sticky once manually touched" — see the
 * Playground story's own comment below for why a ref-based version of this
 * silently broke.
 */
function useSyncSizeToLevel(level: HeadingLevel) {
  const [, updateArgs] = useArgs();
  useEffect(() => {
    updateArgs({ size: defaultSizeForLevel[level] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);
}

const meta: Meta<typeof Heading> = {
  title: "Components/Heading",
  id: "atoms-typography-heading",
  component: Heading,
  parameters: { layout: "padded" },
  // Ordered to match HeadingProps' own declaration order (children, level,
  // size, align, weight, color, fontFamily, wrap, trim, truncate, as, then
  // the inherited native escape-hatch props last) — same sequencing
  // principle the Properties table uses (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    children: { control: "text", description: "The heading text." },
    level: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description:
        "Semantic heading level, rendered as h1-h6 by default. When as is set to a non-heading element, this instead drives aria-level on a role=\"heading\" fallback.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description:
        "Visual size, from the full font-size token scale. Defaults to a sensible size for the given level, but can be set independently.",
      // Not a Storybook concept — this custom Docs page's own
      // PlaygroundControls block (.storybook/blocks/PlaygroundControls.tsx)
      // reads this to show the size `level` actually resolves to
      // internally while `size` itself is left unset, rather than a blank
      // "Choose option…" — reuses Heading's own real default-size mapping
      // directly rather than duplicating it. Picking a value here never
      // writes a real `size` arg on its own; it's display-only until the
      // user actually touches the control.
      resolveDisplayValue: (args: Record<string, unknown>) =>
        defaultSizeForLevel[args.level as HeadingLevel],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Text alignment. Unset by default — inherits the surrounding layout's alignment.",
    },
    weight: {
      control: "select",
      options: ["regular", "medium", "semibold", "bold"],
      description: "Font weight.",
    },
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "tertiary",
        "disabled",
        "link",
        "danger",
        "warning",
        "success",
        "info",
      ],
      description: "Semantic text color.",
    },
    fontFamily: {
      control: "select",
      options: ["primary", "secondary"],
      description:
        "Font family. primary switches to Nunito, for UI-dense/enterprise sections that want headings to stay consistent with the rest of the interface rather than the editorial serif.",
    },
    wrap: {
      control: "select",
      options: ["wrap", "nowrap", "balance", "pretty"],
      description:
        "Line-wrapping behavior (CSS text-wrap). balance or pretty improve how a multi-line heading breaks. nowrap conflicts with a multi-line truncate and warns in development if combined with one.",
    },
    trim: {
      control: "select",
      options: ["start", "end", "both"],
      description:
        "Leading-trim — removes the extra space a font reserves above the cap-height and/or below the baseline. Unset by default (no trim). Uses the native CSS text-box-trim where supported, falling back to a pre-calculated margin (per font family) elsewhere.",
    },
    // A `text` control, paired with a real `""` (not `undefined`) starting
    // arg in `meta.args` below — the combination that actually avoids
    // Storybook's own "Set X" boundary button. Confirmed empirically, twice
    // over: a `number` control with an undefined value shows "Set number";
    // a `text` control with an undefined value shows "Set string" just the
    // same (a real Storybook/shared-block behavior gated on the *value*,
    // not the control type — an earlier version of this comment assumed
    // otherwise). `""` is a real, defined value, so neither surface gates
    // it — a genuinely empty, always-live input from the start, on both
    // the native Controls tab and this Docs page's own PlaygroundControls
    // block. Every `Heading` instance in this file passes `truncate`
    // through `parseTruncateArg` (this file's own helper, above) rather
    // than the raw control value, so the component itself still only ever
    // receives a real `number` or `undefined`, never the empty string.
    truncate: {
      control: "text",
      description:
        "Truncates text after this many lines, with an ellipsis (-webkit-line-clamp).",
    },
    // `control: false` — toggling `as` genuinely changes the rendered
    // element (confirmed live: the DOM tag and its role/aria-level really
    // do change), but between `div`/`span`/`p` at otherwise-identical
    // styling the *visible* result is indistinguishable without opening
    // devtools, which reads as "this control does nothing" in a Playground
    // meant to be judged by eye. `as` stays fully live, and its effect
    // fully visible, on the "Polymorphic: as=..." story, which pairs it
    // with a visual cue (a card background) specifically so the change is
    // actually observable.
    as: {
      control: false,
      description:
        "The HTML element (or component) to render as, overriding the element level would normally select. Renders role=\"heading\" and aria-level={level} in this case. Intended for a non-heading element — passing an actual h1-h6 tag warns in development.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5). `size` is
  // left `undefined` deliberately (falls back to `level`'s own matched
  // default internally, shown live via `resolveDisplayValue` above; giving
  // it a fixed demo value would hide the level->size behavior this
  // Playground exists to demonstrate) — `select`-type controls don't gate
  // on this the way free-form ones do, so it still renders live. `truncate`
  // gets `""`, not `undefined` — its real default genuinely is "off," but a
  // `text` control gates on `undefined` exactly like a `number` control
  // does (see that argType's own comment); `""` is a real, defined value
  // that reads as empty, avoiding the gate while still meaning "no
  // truncation" once parsed. `align`/`wrap` have no true default either but
  // get a sensible non-blank demo value since doing so doesn't hide any
  // other prop's behavior. `as`'s control is disabled entirely (see that
  // argType's own comment), so its own arg value here is moot.
  args: {
    children: "Design builds meaning",
    level: 2,
    size: undefined,
    align: "start",
    weight: "bold",
    color: "primary",
    fontFamily: "secondary",
    wrap: "wrap",
    // Cast, not a real `number` — see this file's own `truncate` argType
    // comment for why the Storybook *control* needs a string `""` here
    // even though the real component prop is always a `number`.
    truncate: "" as unknown as number,
    as: undefined,
  },
  // The fallback renderer for any story below with no `render` of its own
  // (`Default`, `NarrowViewport`) — every story that *does* define its own
  // `render` applies this same `parseTruncateArg` coercion and
  // `useSyncSizeToLevel` call itself, since this meta-level one only ever
  // runs in place of a missing one, never alongside it.
  render: function DefaultRenderer(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    return <Heading {...args} truncate={parseTruncateArg(args.truncate)} />;
  },
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => headingPlaygroundSnippet(context.args),
      },
    },
  },
  // The *native* per-story Controls panel (the addon tab beside this
  // canvas, distinct from the Docs page's own custom PlaygroundControls
  // block) is Storybook's own vanilla `<select>` — it can only ever display
  // `args.size` itself, with no equivalent to that block's own
  // `resolveDisplayValue` mechanism for a display-only computed fallback.
  // `useSyncSizeToLevel` (above) syncs a *real* `size` arg to
  // `defaultSizeForLevel[level]` whenever `level` changes instead, so this
  // (and every other story below with a live `level`) shows the resolved
  // size rather than a blank "Choose option…".
  //
  // Deliberately unconditional — an earlier version tried to preserve a
  // manually-picked `size` across a later `level` change by tracking "was
  // this value the one I last auto-set" in a `useRef`. Real, confirmed bug
  // (user-reported, reproduced): that tracking silently broke the moment
  // the story's component instance was recreated for any reason (an HMR
  // reload, a Storybook internal re-render) while `args.size` already held
  // a previously-auto-set value — the fresh `ref` came back empty, so the
  // check read the existing value as "the user must have picked this," and
  // the sync permanently stopped re-firing from then on, with no visible
  // error. A `useRef` has no guaranteed lifetime here; `args` in the
  // Storybook store does. Trading the "manual size survives a level
  // change" nicety for something that can't silently wedge itself off:
  // changing `level` now always re-snaps `size` to that level's own
  // default, full stop. Setting `size` independently still works exactly
  // as before as long as `level` itself isn't touched again afterward —
  // the "Size set independently of level" story is the dedicated,
  // always-correct demo of that combination.
  render: function PlaygroundStory(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    return <Heading {...args} truncate={parseTruncateArg(args.truncate)} />;
  },
};

export const Default: Story = {
  // `level` is this story's own reason to exist (the default level) — kept
  // fixed so the story keeps demonstrating that specific default rather
  // than becoming a second, unlabeled Playground. Every other prop stays
  // live, matching `Blockquote`'s own established Default pattern.
  argTypes: { level: { control: false } },
  args: { level: 2 },
};

export const AllLevels: Story = {
  name: "All levels (h1-h6, matched default sizes)",
  parameters: { docs: { source: { code: headingSnippets.allLevels } } },
  // `level` is the deliberate varying axis (one instance per level, so no
  // single control value could represent "all of them" — per
  // 06-engineering-standards.md §9's multi-instance-gallery exception);
  // `children` is hardcoded per instance to label which level it is. Every
  // other prop is genuinely shared across all six instances and stays live.
  argTypes: {
    level: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} {...args} level={level} truncate={parseTruncateArg(args.truncate)}>
          Heading level {level}
        </Heading>
      ))}
    </>
  ),
};

export const SizeIndependentOfLevel: Story = {
  name: "Size set independently of level",
  parameters: { docs: { source: { code: headingSnippets.sizeIndependentOfLevel } } },
  // `level`/`size`/`children` are all fixed to preserve this story's own
  // specific point (a semantic h2 rendered visually smaller); every other
  // prop stays live.
  argTypes: {
    level: { control: false },
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <Heading {...args} level={2} size="xl" truncate={parseTruncateArg(args.truncate)}>
      Semantic h2, visually smaller (size=&quot;xl&quot;)
    </Heading>
  ),
};

export const AllSizes: Story = {
  name: "All sizes (full font-size scale)",
  parameters: { docs: { source: { code: headingSnippets.allSizes } } },
  // `size` is the deliberate varying axis; `children` is hardcoded per
  // instance to label which size it is. `level` stays live and shared
  // (changing it re-renders all 11 instances as a different heading tag,
  // still at their own labeled size).
  argTypes: {
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {(
        ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"] as const
      ).map((size) => (
        <Heading key={size} {...args} size={size} truncate={parseTruncateArg(args.truncate)}>
          size=&quot;{size}&quot;
        </Heading>
      ))}
    </>
  ),
};

export const FontFamily: Story = {
  name: "Font family (secondary/editorial vs primary)",
  parameters: { docs: { source: { code: headingSnippets.fontFamily } } },
  // `fontFamily` is the deliberate varying axis; `children` is hardcoded
  // per instance to describe each. Everything else stays live and shared.
  // Wrapped in `Stack` (this system's own layout atom, not a bare
  // Fragment) so the two instances get real breathing room between them —
  // `Heading` itself has `margin: 0`, so two of them back to back in a
  // Fragment stack flush against each other with no gap at all.
  argTypes: {
    fontFamily: { control: false },
    children: { control: false },
  },
  render: function FontFamilyStory(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    return (
      <Stack gap={4}>
        <Heading {...args} fontFamily="secondary" truncate={parseTruncateArg(args.truncate)}>
          fontFamily=&quot;secondary&quot; (Lora, default) — editorial heading.
        </Heading>
        <Heading {...args} fontFamily="primary" truncate={parseTruncateArg(args.truncate)}>
          fontFamily=&quot;primary&quot; (Nunito) — UI-dense/enterprise heading.
        </Heading>
      </Stack>
    );
  },
};

export const Align: Story = {
  name: "Text alignment (start/center/end)",
  parameters: { docs: { source: { code: headingSnippets.align } } },
  // `align` is the deliberate varying axis; `children` is hardcoded per
  // instance to describe each. `level` defaults to 3 via `args` (not a
  // JSX-literal override) specifically so it stays live — a literal
  // `level={3}` on every instance would silently make the `level` control
  // do nothing despite looking enabled, the exact "control exists but has
  // no effect" bug this component's own review flagged elsewhere. Every
  // other prop stays live and shared too.
  args: { level: 3 },
  argTypes: {
    align: { control: false },
    children: { control: false },
  },
  render: function AlignStory(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    return (
      <>
        <Heading {...args} align="start" truncate={parseTruncateArg(args.truncate)}>
          align=&quot;start&quot; (default)
        </Heading>
        <Heading {...args} align="center" truncate={parseTruncateArg(args.truncate)}>
          align=&quot;center&quot;
        </Heading>
        <Heading {...args} align="end" truncate={parseTruncateArg(args.truncate)}>
          align=&quot;end&quot;
        </Heading>
      </>
    );
  },
};

export const Wrap: Story = {
  name: "Line-wrapping (wrap vs balance vs pretty)",
  parameters: { docs: { source: { code: headingSnippets.wrap } } },
  // `wrap` is the deliberate varying axis; `children` is hardcoded per
  // instance (text calibrated to actually wrap at the demo width). `level`
  // defaults via `args` rather than a JSX-literal override, same reasoning
  // as `Align`'s own comment — keeps its control genuinely live instead of
  // silently dead. Every other prop stays shared and live too, including
  // `truncate` — setting it alongside `wrap="nowrap"` here triggers
  // Heading's own development warning about that exact combination, a
  // legitimate, useful thing to be able to demonstrate live.
  args: { level: 2 },
  argTypes: {
    wrap: { control: false },
    children: { control: false },
  },
  render: function WrapStory(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    return (
      <>
        <div style={{ maxWidth: "20rem" }}>
          <Heading {...args} wrap="wrap" truncate={parseTruncateArg(args.truncate)}>
            A longer heading that wraps with the browser&apos;s default line breaks
          </Heading>
        </div>
        <div style={{ maxWidth: "20rem" }}>
          <Heading {...args} wrap="balance" truncate={parseTruncateArg(args.truncate)}>
            A longer heading that wraps with balanced line breaks
          </Heading>
        </div>
        <div style={{ maxWidth: "20rem" }}>
          <Heading {...args} wrap="pretty" truncate={parseTruncateArg(args.truncate)}>
            A longer heading that wraps avoiding an orphaned last word
          </Heading>
        </div>
      </>
    );
  },
};

const trimRows: { label: string; trim: HeadingTrim | undefined }[] = [
  { label: "trim unset (default)", trim: undefined },
  { label: 'trim="start"', trim: "start" },
  { label: 'trim="end"', trim: "end" },
  { label: 'trim="both"', trim: "both" },
];

export const Trim: Story = {
  name: "Leading-trim (unset vs start/end/both)",
  parameters: { docs: { source: { code: headingSnippets.trim } } },
  // `trim` is the deliberate varying axis — all 4 real states shown as
  // separate rows (not just the two most different ones), each with its
  // own label so it's clear which is which without relying on the heading
  // text itself to say so. `children` is fixed to a plain word so the
  // effect (space above the caps, below the baseline) is easy to see
  // against the highlighted background — every instance wrapped in a
  // bg.canvas box specifically to make the otherwise-invisible trimmed
  // space visible, the same "reveal the box" technique typography tools
  // like Capsize use to demo this. A generous `Stack` gap between rows
  // (this system's own layout atom, not a bare Fragment) keeps each row's
  // own box from reading as adjacent to its neighbors, since the boxes
  // themselves are already different heights by design (that's the whole
  // point being demonstrated). `level` stays live and shared.
  args: { level: 2, children: "Typography" },
  argTypes: {
    trim: { control: false },
    children: { control: false },
  },
  render: function TrimStory(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    const boxStyle = {
      background: "var(--dbm-bg-canvas)",
      display: "inline-block",
    } as const;
    const labelStyle = {
      color: "var(--dbm-text-secondary)",
      fontSize: "var(--dbm-font-size-sm)",
      marginBottom: "var(--dbm-space-2)",
    } as const;
    return (
      <Stack gap={8}>
        {trimRows.map(({ label, trim }) => (
          <div key={label}>
            <div style={labelStyle}>{label}</div>
            <div style={boxStyle}>
              <Heading {...args} trim={trim} truncate={parseTruncateArg(args.truncate)} />
            </div>
          </div>
        ))}
      </Stack>
    );
  },
};

export const Truncate: Story = {
  name: "truncate (line-clamp)",
  parameters: { docs: { source: { code: headingSnippets.truncate } } },
  // `level`/`children` are fixed so the demo text (calibrated to clamp at
  // exactly two lines at this width) stays consistent; `truncate` itself
  // defaults to 2 via `args` (not a JSX-literal override) so its own
  // control stays genuinely live — try 1/2/3 lines directly. Every other
  // prop stays live too.
  //
  // `truncate: "2"` is a *string* here, not the number `2` — this story's
  // own control is `text` (see that argType's own comment), and a text
  // control displays `typeof value === "string"` values only; a raw
  // number arg fails that check and the field renders empty instead of
  // "2", even though the canvas would still render correctly (real,
  // confirmed bug — `parseTruncateArg` below still normalizes either
  // shape back to a real number for the component itself either way).
  args: { level: 3, truncate: "2" as unknown as number },
  argTypes: {
    level: { control: false },
    children: { control: false },
  },
  render: function TruncateStory(args) {
    useSyncSizeToLevel(args.level as HeadingLevel);
    return (
      <div style={{ maxWidth: "20rem" }}>
        <Heading {...args} truncate={parseTruncateArg(args.truncate)}>
          A much longer card title than will fit on two lines, so it should be clamped with an
          ellipsis instead of overflowing or wrapping onto a third line.
        </Heading>
      </div>
    );
  },
};

export const AsCardTitle: Story = {
  name: 'Polymorphic: as="div" (card title, kept out of the page heading outline)',
  parameters: { docs: { source: { code: headingSnippets.asCardTitle } } },
  // `as`/`level`/`size`/`children` are all fixed to preserve this story's
  // own specific point (a card title using the ARIA-fallback mechanism);
  // every other prop stays live.
  argTypes: {
    as: { control: false },
    level: { control: false },
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div
      style={{
        background: "var(--dbm-bg-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <Heading
        {...args}
        level={3}
        as="div"
        size="lg"
        truncate={parseTruncateArg(args.truncate)}
      >
        Product card title
      </Heading>
      <p style={{ color: "var(--dbm-text-secondary)", margin: 0 }}>
        Renders as a real page heading (h1) above; this one is a &lt;div&gt; with
        role=&quot;heading&quot; aria-level=&quot;3&quot;, so it&apos;s still announced correctly
        to screen readers without adding another entry to the page&apos;s actual heading outline.
      </p>
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (large heading wraps, never overflows)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => headingPlaygroundSnippet(context.args),
      },
    },
  },
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  //
  // `level`/`children` are fixed — this story exists specifically to show a
  // large heading wrapping at a narrow width, which a smaller level/shorter
  // text wouldn't demonstrate. Every other prop stays live via the default
  // args-spread renderer (no custom `render` needed here).
  argTypes: {
    level: { control: false },
    children: { control: false },
  },
  args: {
    level: 1,
    children: "A longer heading that should wrap gracefully on narrow screens",
  },
};
