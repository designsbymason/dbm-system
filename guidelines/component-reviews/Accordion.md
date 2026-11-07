# Accordion — Storybook/component review findings

**Overlay & Disclosure:** Accordion — built 2026-09-17, item 9 in the itemized molecule-tier build
order (`04-component-inventory.md`). Adds `@radix-ui/react-accordion` (^1.2.20) as a new dependency.
**Finalized 2026-09-18** — declared by the user after the final review pass; see the closing entry at
the bottom of this file. Everything above it records the build and review history leading there.

**The second component in this system exposing real Radix-mirroring compound sub-parts**, after
`Popover`. Composes `Accordion.Item`, `Accordion.Trigger`, `Accordion.Content` inside `Accordion`
itself. Each sub-part's own props get a `### Accordion.{Part} properties` subsection on the Docs
page via a hidden, docs-only stories file per `guidelines/adr/0013` — `AccordionItem.stories.tsx`,
`AccordionTrigger.stories.tsx`, `AccordionContent.stories.tsx`.

## Design decisions made during the build

- **Wraps `@radix-ui/react-accordion` fully (`Root`/`Item`/`Header`/`Trigger`/`Content`) rather than
  literally reusing the `Collapse` atom's own React component for `Accordion.Content`**, correcting
  what both `04-component-inventory.md`'s own Accordion row and `Collapse`'s own component-level
  JSDoc previously assumed. `Accordion.Trigger`/`Accordion.Content` read from the same Radix `Item`
  context to track open state — swapping in `Collapse` for the content half only would either
  duplicate that wiring for no benefit or require re-deriving Radix's own open-state/id-linking/
  keyboard-navigation logic by hand, against [ADR-0004](../adr/0004-radix-ui-primitives-for-accessibility-logic.md)'s
  standing rule to lean on Radix rather than hand-roll interaction logic. Recorded as a real
  fork-in-the-road decision: [ADR-0018](../adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md).
  The animation *technique* is still the same one `Collapse` uses (a measured-height CSS custom
  property driving a `slideDown`/`slideUp` keyframe pair) — just against Radix Accordion's own copy
  of that mechanism (`--radix-accordion-content-height`) instead of Radix Collapsible's.
  **Flagged, not yet fixed:** `Collapse.tsx`'s own component-level JSDoc still states "the building
  block `Accordion` composes for each of its items," which this decision makes inaccurate. `Collapse`
  is Finalized, so per `06-engineering-standards.md` §9's finalization rule this needs explicit
  authorization before editing, even though the fix is doc-only with zero behavioral change (which
  would keep it Finalized once landed, per that same section's three-question test) — surfaced here
  and to the user rather than touched silently.
- **`Accordion.Header` is folded into the exported `Accordion.Trigger`, not a fourth sub-part.**
  Radix's own `Header` is a semantic-only heading wrapper with no visible styling of its own — asking
  a consumer to compose it separately around every `Trigger` would be pure boilerplate with no real
  configurability gained. `Accordion.Trigger` renders `<AccordionPrimitive.Header asChild>` wrapping a
  dynamically-chosen heading tag (`h1`-`h6`, matching `Heading`'s own `elementForLevel` pattern)
  internally instead.
- **`headingLevel` lives on the `Accordion` root, not per-item** — every item in one accordion sits at
  the same depth in the page's own heading outline, so a per-`Accordion.Item`/`Accordion.Trigger`
  override would be a real prop nobody has a reason to actually vary. Propagated via a plain internal
  React Context (`AccordionHeadingLevelContext`), read inside `Accordion.Trigger`. Defaults to `3`,
  matching `Heading`'s own `level` default reasoning (a component this deep in a typical page's
  structure is rarely the `h1`/`h2`).
- **A built-in rotating disclosure-indicator icon (`CaretDownIcon`, rotated 180° via `[data-state=
  "open"]`), not a bare label-only trigger** — comparable production accordion components uniformly
  ship this, and it's the single clearest visual affordance that a trigger is a disclosure control
  rather than a plain heading. Customizable via `icon` (a different Phosphor icon reference) and
  `hideIcon`, matching the icon-prop conventions already established (`05-component-api-conventions.md`
  §5) — same one-icon-slot naming (`icon`, not `leadingIcon`/`trailingIcon`) as `IconButton`/`ListItem`,
  since there's only one icon slot here too.
- **No `overflow: hidden` on the root group**, despite rounding its outer corners. Rounding only the
  first/last item's own trigger corners (`.item:first-child .trigger`/`.item:last-child .trigger`)
  gets the same visually-rounded-group result without it — chosen specifically so the standard
  positive `outline-offset` focus-ring convention (`05-component-api-conventions.md` §6) never gets
  clipped on either end item the way a hidden-overflow wrapper would cut it off. Verified live: a
  keyboard-focused first/last trigger's own ring renders uncropped in both directions.
- **`type="single"` defaults to `collapsible: true`, not Radix's own unset/`false` default.** Radix
  requires `type` with no default at all; this system defaults it to `"single"` and additionally
  defaults `collapsible` to `true` within that mode — with `collapsible: false` and nothing open to
  start, a reader has no way to tell one section is meant to always stay open until they've already
  closed every other one and hit the floor, so `true` is the safer, more discoverable default (flagged
  as a Do/Don't on the Docs page's own Usage guidelines rather than left as a silent trap).
- **No built-in horizontal visual layout for `orientation="horizontal"`** — the prop is forwarded to
  Radix for correct keyboard-arrow-direction/`data-orientation` semantics (parity with `RadioGroup`'s
  own `orientation` convention), but this component's own CSS stays a vertical stack either way,
  documented explicitly on the Docs page rather than silently under-delivering on the prop's name. A
  genuinely side-by-side accordion is a rare enough real-world need that building full horizontal
  layout CSS speculatively would be exactly the kind of un-requested scope `06-engineering-standards.md`
  §9's guardrail warns against; revisit if a real need for it comes up.
- **Discriminated `AccordionSingleProps | AccordionMultipleProps` union, mirroring Radix's own props
  shape** — `value`/`defaultValue`/`onValueChange` are a plain `string` under `type="single"`, a
  `string[]` under `type="multiple"`, and `collapsible` only exists on the `"single"` arm. Implemented
  with zero `any`/casts: two full object literals (one per arm) are each independently assignable to
  `ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>`, assigned to one variable typed as that
  union, which TypeScript accepts without needing to merge the two shapes into one loosely-typed
  object first.

## Baseline correctness

- `forwardRef` on every part (root `<div>`, `Item`, `Trigger`, `Content`); `className`/`style`/`id`/
  `data-testid` accepted and documented on all four.
- `{...props}` spread before each part's own computed attributes throughout (`Accordion.Item`,
  `Accordion.Trigger`, `Accordion.Content` all follow the standing ordering rule from the first
  build, not retrofitted).
- Zero hardcoded values — every color/spacing/radius/typography/motion value in `Accordion.module.css`
  traces to an existing token; no new component-layer token needed (unlike `Popover`'s
  `popover.max-width`) — every value Accordion's own design called for already had a home on an
  existing scale.
- SSR/RSC safety: no module-scope or initial-render `window`/`document` access anywhere in the
  implementation.
- No console noise, no silent `catch` blocks.
- Compound-sub-part completeness, atom-reuse audit (`Icon` reused for the disclosure indicator, same
  as `Select`'s caret), and the Radix-primitive prop audit (traced the full `AccordionPrimitive.Root`/
  `Item`/`Trigger`/`Content` prop surface, not just the first layer, per the lesson `Popover`'s own
  review flagged) were all run as part of this same first pass rather than deferred to a later round.

## Accessibility

- Keyboard/ARIA state verified live and via jest-axe (18 unit tests, zero violations closed/open/
  `type="multiple"`/disabled): `aria-expanded`/`aria-controls` sync automatically, roving `Up`/`Down`
  arrow-key focus between triggers (`Left`/`Right` under `orientation="horizontal"`), `Home`/`End`,
  disabled items skipped by both `Tab` and arrow navigation.
- Real heading semantics via `headingLevel` (default `3`) — verified a focused/opened trigger resolves
  to `role="heading"` at the expected level via Testing Library's own `getByRole("heading", {level}
  )` query, not just visually.

## Theming

Verified live across all 4 themes (Purple/Emerald × light/dark) via the Storybook toolbar — border,
divider, trigger hover/focus, disabled text/icon color, and the content text tone all read correctly
in every combination. No brand-specific token is used anywhere except `border.focus` (already
brand-aware by design).

## Responsiveness

Verified live at mobile width (375px) via the standalone Playground story — trigger label wraps
correctly, no horizontal overflow, disclosure icon stays aligned.

## Storybook documentation

Docs page (`Accordion.mdx`) follows the full `07-storybook-and-documentation-standards.md` §4
template (10 sections plus the visually-hidden Intro heading). Playground drives every `type="single"`
prop live (`defaultValue`, `collapsible`, `disabled`, `orientation`, `headingLevel`); `type`,
`onValueChange`, `dir`, `id`, `className`, `style`, `data-testid` are documented in the Properties
table with `control: false` (the same "no single control shape" treatment `Popover`'s own `side` got
for its responsive-map form) rather than wired into the Playground, since `type` genuinely needs a
different value shape than what the Playground demonstrates — a dedicated `Multiple` story
demonstrates `type="multiple"` instead. Six additional stories cover disabled items, a custom
disclosure icon, a fully custom `asChild` trigger row, a controlled open item, and a `play`-function
interaction test (click to open, `ArrowDown`/`ArrowUp` roving focus, click to close) — all passing
under `@storybook/addon-vitest`'s full browser-mode sweep (67 story files, 483 tests, including the
three hidden sub-part stories).

**Follow-up (2026-09-17, same day), a shared-infrastructure fix found via this component's own
`defaultValue` control.** The `""` option (meaning "nothing open by default") rendered as a
genuinely blank, invisible-text row in the embedded Docs-page Playground's own dropdown — confirmed
directly in the DOM, not just suspected — since `PlaygroundControls.tsx` built every option's label
straight from its own stringified value with no way to override it. Fixed at the shared-block level
(`.storybook/blocks/PlaygroundControls.tsx`, full incident and fix in
`07-storybook-and-documentation-standards.md` §4.1) by adding support for Storybook's own
`argType.control.labels` convention; `Accordion.stories.tsx`'s `defaultValue` argType set
`labels: { "": "None" }`. Verified live: the control displayed "None", the real `defaultValue` arg
stayed `""` (confirmed via the Canvas's own "Show code" panel), and the fix was fully backward
compatible — spot-checked `Select`'s own `size` control and `Icon`'s `mapping`-backed `icon` control,
both unaffected.

**Follow-up (2026-09-17, same day, at explicit direction) — three refinements.**
1. **`labels`' own display text lowercased**, `"None"` → `"none"`, matching this system's other
   option labels (`shipping`/`returns`/`warranty`), none of which are capitalized.
2. **The same blank-pill bug also affected the Docs page's own Properties table** —
   `PropertiesTable.tsx`'s `ValueOptions` had the identical gap as `PlaygroundControls.tsx`
   (building each pill's text straight from `String(option)`, with no override), so the `""` option
   rendered as an invisible pill there too, not just in the Playground's own control. Fixed the same
   way: `PropertiesTable.tsx`'s `ArgTypeLike` now also reads `argType.control.labels`, falling back
   to `String(option)` when unset — same backward-compatible pattern, spot-checked against `Select`'s
   own `defaultValue` table row (unaffected). Both fixes now documented together in
   `07-storybook-and-documentation-standards.md` §4.1.
3. **`Accordion.Trigger`'s hover background moved from `bg.neutral-subtle` to
   `bg.brand-subtle-hover`** (`Accordion.module.css`'s `.trigger:hover:not(:disabled)`, and the
   Design tokens table's own row) — a deliberate brand-tinted hover instead of a neutral one.
   Contrast unaffected in either direction: `text.primary` (the trigger label) against
   `brand-subtle-hover` is comfortably high-contrast in all 4 themes (the token's own light value is
   a pale brand tint, `purple.100`/`emerald.100`; its dark value, `gray.800`, is shared and unchanged
   from before), confirmed live across all 4 brand/mode combinations.

Re-verified after all three: `tsc --noEmit` (both tsconfigs), `eslint --max-warnings 0`, the full
Vitest `unit` project (1376 tests), `storybook build`, and both bundle-size tripwires — all clean.

**Follow-up (2026-09-17, same day, at explicit direction) — trigger hover token revised again**,
`bg.brand-subtle-hover` → `bg.brand-subtle` (`Accordion.module.css`'s `.trigger:hover:not(:disabled)`
and the Design tokens table's own row, both updated). Verified live across all 4 brand/mode
combinations, including a direct `getComputedStyle` check against the built primitive values (not
just eyeballed): Emerald/Light resolves to `rgb(247, 251, 250)`, an exact match for `emerald.50`;
Purple/Dark resolves to `rgb(36, 34, 42)`, an exact match for `gray.950` — confirming `bg.brand-subtle`
is applying correctly even where the effect reads as a subtle darkening rather than a visible
lightening (dark mode's own value, `gray.950`, is shared across brands and slightly darker than the
group's own `bg.surface`/`gray.900`, unlike the light-mode pale-tint case). Re-verified: `tsc
--noEmit`, `eslint --max-warnings 0`, the full Vitest `unit` project (1376 tests) — all clean.

**Follow-up (2026-09-17, same day) — `type` made genuinely interactive in the Playground, and its
own real gap in the Properties table fixed.** Two real, user-identified gaps, both closed:

1. **`type`'s own Playground control was `control: false`** (per the original comment, "no single
   control shape can drive both" value shapes) — reconsidered: `type` itself only ever has two
   possible values, so it doesn't have the same open-ended-shape problem `Popover`'s own responsive
   `side` map does; only `defaultValue`'s *shape* changes with it. Made `type` a live `select`
   (`options: ["single", "multiple"]`); `render` now branches on `args.type` (mirroring
   `Accordion.tsx`'s own two-arm `rootProps` pattern) so each JSX branch satisfies exactly one arm of
   the discriminated union, no `any`/cast needed. `defaultValue` stays a single-string control either
   way — wrapped into a one-element array (or `[]` for "none") under `type="multiple"`, demonstrating
   the mechanism rather than the full multi-select case, which the dedicated `Multiple` story still
   covers (two items open at once). All 6 other, fixed-render stories (`Multiple`, `DisabledItem`,
   `CustomIcon`, `AsChildTrigger`, `Controlled`, `KeyboardInteraction`) got their own
   `type: { control: false }` override, matching this system's standing rule for any story whose
   render doesn't consume a given arg (`06-engineering-standards.md` §9's Storybook checklist).
   Verified live: toggling `type` to `"multiple"` in the embedded Docs-page Playground actually let
   two items ("Shipping" and "Returns") open independently at once, confirmed by clicking both.
2. **`type`'s own `argType` never set `options` at all** (only a `description`), so
   `PropertiesTable`'s "Value options" column — which reads directly from `argType.options` — showed
   an empty dash for `type` regardless of the control being interactive or not; this was a plain
   oversight from the original build, unrelated to the `control: false` decision. Added
   `options: ["single", "multiple"]` to the same argType (the same array now also driving the live
   `select` control above), and confirmed live: the Properties table now shows both `single` and
   `multiple` pills under `type`.

Re-verified after both fixes: `tsc --noEmit`, `eslint --max-warnings 0`, the full Vitest `unit`
project (1376 tests) and `storybook` project (483 tests, including all 6 revised fixed-render
stories) — all clean.

## Functional verification

- 18 unit tests (React Testing Library + jest-axe), all passing: render, click-to-open/close, single-
  vs-multiple exclusivity, `collapsible={false}`, controlled `value`/`onValueChange`, `defaultValue`,
  per-item and accordion-wide `disabled`, roving arrow-key focus, `headingLevel` (custom and default),
  `asChild` trigger, `hideIcon`, ref forwarding, and three separate jest-axe zero-violations checks
  (closed/open, `type="multiple"` with several open, accordion-wide disabled).
- `tsc --noEmit` (both the main and `.storybook` tsconfigs), `eslint --max-warnings 0`, the full
  Vitest `unit` project (1376 tests) and `storybook` project (483 tests), `tsup` build, and a real
  `storybook build` all pass clean. Per-component bundle size: 1.23KB JS / 0.80KB CSS gzipped — well
  within the established budget. Storybook static build and its largest chunk both within budget.
- Visually verified live in a running Storybook instance: Playground interactivity (single-open
  exclusivity, `type="multiple"` independence), every variant gallery story, all four Properties
  tables (root + three sub-parts), Design tokens table swatches, Related Components cards, and all
  four brand/mode theme combinations.

## Final review pass (2026-09-18)

A full `06-engineering-standards.md` §9 pass, re-checking the checklist end to end rather than
assuming prior turns already covered everything. Found and fixed five real, concrete gaps — not
proposed and left pending, since each is a checklist-compliance fix (baseline correctness / test
coverage), not a new design decision:

1. **`Accordion`'s own root didn't accept arbitrary native `<div>` attributes** (`onClick`,
   `onFocus`, `aria-*`, `role`, etc.) — a real gap against the standing "always extend native props
   where applicable" rule (`05-component-api-conventions.md` §3), and against Radix's own `Root`,
   which supports full native div passthrough natively. Left unfixed during the original build as a
   presumed TypeScript limitation (spreading a native-attribute `rest` alongside the separately
   -computed, discriminated-union-typed `rootProps` in the same JSX tag doesn't type-check — confirmed
   by reproducing the exact failure in isolation). Fixed properly, not worked around: added
   `collapsible?: never` to `AccordionMultipleProps` (a standard TypeScript idiom that makes a
   discriminated union destructure-friendly across both arms at once), then destructured every
   branch-specific key out by name before computing `rest`, so `rest` holds only genuine native
   passthrough. Verified in isolation first (a throwaway experiment file, deleted after confirming)
   before touching the real component. Zero `any`/casts anywhere in the fix. Added a Docs-page
   disclaimer sentence matching every sub-part's own existing one, and a dedicated test (`passes id,
   className, style, data-testid, and other native attributes through to the root element`,
   asserting `aria-label`/`onFocus` specifically).
2. **`Accordion.Content` was missing Radix's own `forceMount` prop** — confirmed by tracing the
   *full* Radix inheritance chain (`AccordionContentProps extends CollapsibleContentProps`, which
   declares `forceMount?: true`), the exact lesson `Popover`'s own second review round already
   flagged ("trace the entire inheritance chain, not just the layer that happens to hold the first
   gap"). Added to `AccordionContentProps`, sourced from the real Radix type rather than hand-typed,
   flows through automatically via the existing `{...props}` spread — no component-code change
   needed beyond the type addition. Added to the Docs page's `Accordion.Content` argTypes and
   `contentPropOrder`.
3. **Two real, silently-ignored prop combinations had no dev-mode warning** — `collapsible` under
   `type="multiple"` (now prevented at compile time too via the `never` addition above, but still a
   real runtime no-op for a non-TS/plain-JS consumer) and `icon`/`hideIcon` under `Accordion.Trigger
   asChild` (the exact same class of gap already warned about elsewhere in this codebase —
   `IconButton`'s own `icon`-ignored-under-`asChild` warning, visible in this same session's own
   `addon-vitest` console output). Both now warn once per mount in development, matching the
   established `hasWarned*Ref` pattern (`Collapse`, `Select`, `Tag`, `RadioGroup`), with dedicated
   tests for the warn-once behavior and the no-false-positive case.
4. **Test-coverage gap: no test verified `id`/`className`/`style`/`data-testid` passthrough** on any
   of the four parts (Root/Item/Trigger/Content) — confirmed missing by direct comparison against
   `Popover`'s own test suite, which has this exact test for each of its three sub-parts. Added one
   per part.
5. **Test-coverage gap: keyboard/ARIA claims made on the Docs page had no verifying test** —
   `Home`/`End` jumping to the first/last trigger, a disabled item's trigger being skipped by
   arrow-key roving focus, and the `aria-controls`/`aria-labelledby` wiring between a trigger and its
   own panel. All three were asserted as real behavior in the Docs page's own Accessibility section
   prose but never actually exercised by a unit test. Added all three — the disabled-skip test in
   particular was also live-verified directly in a running Storybook instance (via `activeElement`
   inspection, not just the jsdom unit test) before being written up here.
6. **`Accordion.Item`'s own `asChild` prop had zero coverage anywhere** — no story, no unit test —
   despite being a real, documented prop with the same "no extra wrapper" contract as `Collapse`'s
   identical `asChild`. Added a test rendering it as a real `<li>` inside a `<ul>`, confirming no
   wrapper element and that the `<ul>`'s own first child is the `<li>` itself.

**Feature-completeness pass against comparable production accordion components — two real gaps
named, deliberately not built without confirmation (per `06-engineering-standards.md` §9's own
scope-creep guardrail):**
- **No `variant`/visual-style prop** — comparable accordion components typically also offer a
  borderless/flush treatment (for use inside another already-bordered container, e.g. a `Card`),
  distinct from the single bordered-group look this component ships today.
- **No `size` prop** — comparable accordion components sometimes offer a compact/comfortable density
  option; this component currently has one fixed trigger padding/font-size.

Both are real, nameable gaps, not blanket "make it fancier" — but both are genuine design decisions
(a new token/visual system, not a narrow bug fix), so they're surfaced here rather than built
unprompted.

**Re-verified after all six fixes:** `tsc --noEmit` (both tsconfigs), `eslint --max-warnings 0`, the
full Vitest `unit` project (1388 tests, up from 1376) and `storybook` project (483 tests), a real
`tsup` build, and `storybook build` — all clean. Per-component bundle size: 1.59KB JS / 0.80KB CSS
gzipped, still well within budget. Live-verified in a running Storybook instance: the new native
-passthrough disclaimer and `forceMount` row both render correctly on their respective Properties
tables, and the disabled-item arrow-key skip was independently confirmed via direct DOM inspection
of a live story, not just the unit test.

## Feature-completeness gaps built (2026-09-18, at explicit direction)

The two gaps flagged (not built) in the final review pass above — implemented once confirmed:

- **`variant?: "bordered" | "ghost"` (default `"bordered"`)** — `"bordered"` is the pre-existing
  shipped look (outer border/radius, unchanged); `"ghost"` removes the outer border/radius only,
  keeping the between-item dividers, for embedding inside an already-bordered container (a `Card`).
  A single `.root.ghost` CSS class, no React Context needed (unlike `size` below) — variant only
  affects the root's own boundary, styled entirely via descendant selectors already scoped under
  `.root`.
- **`size?: "xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`)** — the standard 5-step scale
  (`05-component-api-conventions.md` §2), never a component-specific one. Drives trigger padding/
  font-size/label-icon gap, the disclosure icon's own size (via `Icon`'s existing scale, stepped
  down one notch at the small end — same convention as `Input`'s/`Select`'s own clear-icon sizing),
  and `Accordion.Content`'s own inline padding (tracking the trigger's padding at the same step, so
  panel text stays aligned under the trigger's label). Propagated via a new `AccordionSizeContext`,
  the same pattern already established for `headingLevel`. `md` is byte-identical to the
  pre-existing shipped default (`space-4`/`font-size-base`/`space-3` gap/`icon size="sm"`) — zero
  visual change for any existing consumer.

Both are purely additive on top of an unreviewed (not-yet-Finalized) component, so there's no
finalization-status question here — this is still first-pass build work, not a post-Finalization
reopening.

**One real bug found and fixed while building the `Sizes` gallery story, not in the component
itself:** rendering all five size-comparison instances pre-opened (`defaultValue="shipping"` on
each) created five simultaneous `role="region"` landmarks sharing the identical accessible name
("How long does shipping take?") — a genuine `landmark-unique` a11y violation, caught by
`@storybook/addon-vitest`'s own a11y check on this exact story, not assumed. Fixed by rendering the
gallery closed by default instead (the padding/typography difference this story exists to show is
already fully visible on the closed trigger) — not a component defect, purely a story-authoring
fix, but worth recording since it's the kind of gallery-of-many-instances mistake other future
multi-instance stories should watch for.

Re-verified after both additions: `tsc --noEmit` (both tsconfigs), `eslint --max-warnings 0`, the
full Vitest `unit` project (1395 tests) and `storybook` project (485 tests, including the two new
`Ghost`/`Sizes` stories), a real `tsup` build, and `storybook build` — all clean. Per-component
bundle size: 1.78KB JS / 0.90KB CSS gzipped, still comfortably within budget. Live-verified in a
running Storybook instance: both new Playground controls, the Properties table's own `variant`/
`size` rows, and both new gallery stories, across both light and dark mode.

**Follow-up (2026-09-18, same day), user-reported: the `Ghost` story's own demo "Card" wrapper was
visually indistinguishable from the real thing it's meant to show the *absence* of.** The fake
`Card` wrapper (a real `Card` molecule isn't built yet) used only `space-2` padding with no content
of its own beyond the accordion — the wrapper's edge sat close enough to the ghost accordion, with
no other visual cue separating the two, that the whole demo read identically to the default
`variant="bordered"` story: a bordered box around the same three items. Fixed by giving the wrapper
a real reason to look like a distinct container — a "Shipping & returns" title above the accordion,
generous `space-4` padding, and `radius-lg` (distinct from the accordion's own `radius-md`) — so the
border now reads as belonging to a card *containing* the accordion, not the accordion's own
(removed) border redrawn in the same place. Re-verified: `tsc --noEmit`, `eslint --max-warnings 0`,
and the full `unit`/`storybook` Vitest projects, all clean; visually confirmed live in Storybook.

**Finalized 2026-09-18.** Re-confirmed clean immediately before finalizing: `tsc --noEmit` (both the
main and `.storybook` tsconfigs), `eslint --max-warnings 0`, the full Vitest `unit` (1395/1395) and
`storybook` (485/485) projects, a real `tsup` build, `storybook build`, and
`check-component-bundle-size` (1.78KB JS / 0.90KB CSS gzipped, within budget) — all clean, per
`06-engineering-standards.md` §9's own note, don't make further changes to `Accordion` (code,
stories, docs, or its tokens) without asking first.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). The Playground's snippet was a
`<DemoItems />` placeholder, every gallery snippet was the story object's source, 4 of 8 used the demo-only `DemoItems`, "Click to open,
arrow keys" included its `play` test code, and the Ghost story's comment named `04-component-inventory.md` (split across a line break, so
easy to miss) and said a real `Card` "isn't built yet". Every story now sets `parameters.docs.source.code` to a hand-written snippet from
the new `Accordion.snippets.ts`; the Playground builds its snippet from the live controls (`type="multiple"` turns the single default value
into a one-element array, as the demo does). **The Ghost story now uses the real `Card`.** Typechecked against the real types. **Finalized
status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`; with none, nothing changes (the page's direction, or a Radix `DirectionProvider`, still applies as before). The `dir` JSDoc, the Controls description and the Docs text say so; a test covers it. Finalized status is unchanged.
