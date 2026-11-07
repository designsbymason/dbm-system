# Select

**Tier:** Molecule · **Category:** Inputs & Forms · **Finalized:** 2026-09-14, at explicit user direction

## Review pass (2026-09-13)

Full `06-engineering-standards.md` §9 pass — first review for this component, the third
molecule-tier review overall (after `Grid`, `List`), and the first molecule review where the
compound-component and Radix-primitive checkpoints apply for real — `Grid`/`List` have neither a
dot-notation sub-export nor a wrapped Radix compound primitive; `Select` (`Select.Option`, built on
`@radix-ui/react-select`) has both. Findings, in the order fixed (Playground-missing first,
Docs-page-missing last, per the standing reporting convention):

1. **Playground story added, and every other story rewired to genuinely use its own args.**
   `Select.stories.tsx` had 6 stories, only one real `argType` (`size`), and 5 of 6 stories used an
   args-free `render: () => (...)` — the same "story ignores its own args" bug class both `Grid`'s
   and `List`'s reviews already found and fixed. Added a full interactive Playground plus real
   `argTypes` for all 27 props, and rewired every story to genuinely share `{...args}`, disabling
   only each story's own deliberate varying axis (`size` in `AllSizes`, `hasError`/`disabled` in
   `States` — both the multi-instance-gallery exception). Also added two new stories to actually
   demonstrate findings 5/6 below: `SideAndAlign` and `CustomTrigger`.

2. **Real, confirmed accessibility bug: `{...triggerProps}` was spread *after* the computed
   `aria-invalid`.** `Select.tsx`'s trigger render spread `{...triggerProps}` as the last JSX
   attribute, following `aria-invalid={hasError || undefined}`. `aria-invalid` isn't excluded from
   `SelectProps`' own native-attribute passthrough, so a consumer could pass their own
   `aria-invalid` — which silently won over `hasError`'s own computed value. Same recurring
   ordering bug class as `List`'s own finding #2 (Button/Skeleton/ProgressBar/FieldError/List).
   Fixed by reordering so `{...triggerProps}` comes first; applied the identical fix to
   `Select.Option`'s own `{...props}` spread too, even though no live bug was found there yet — the
   same class of risk exists the moment any computed attribute is added to that sub-part later.
   Added a regression test verifying a consumer-supplied `aria-invalid` no longer overrides the
   computed one.

3. **`id`/`style`/`data-testid`/`aria-label`/`aria-labelledby`/`aria-describedby` weren't explicitly
   redeclared in `SelectProps`.** Worked today only via the implicit `extends
   Omit<ComponentPropsWithoutRef<"button">, ...>` inheritance — confirmed this isn't automatically
   covered by checking `Input.types.ts` (the closest atom precedent, identical `interface X extends
   Y` shape), which explicitly redeclares all six regardless. Fixed by redeclaring all six with
   matching JSDoc wording.

4. **Real, more significant compound sub-part gap: `Select.Option` (`SelectOptionProps`) extended
   no native element type at all.** Unlike `SelectRoot`, an option couldn't accept `id`, `style`,
   `data-testid`, or *any* other native/aria passthrough — not even a bare `title` attribute. This
   is exactly what the "compound-component sub-part completeness" checkpoint (added ahead of the
   molecule review phase, never yet exercised — `Grid`/`List` have no sub-parts) exists to catch.
   Fixed by extending `Omit<ComponentPropsWithoutRef<"div">, ...>` and explicitly redeclaring
   `id`/`className`/`style`/`data-testid` with their own JSDoc, matching `SelectRoot`'s own
   convention. Also added: JSDoc on `children` (previously undocumented), and Radix `Item`'s own
   `textValue` prop (needed for correct typeahead search once an option's visible content isn't
   plain searchable text) — wired through and covered by a live keyboard-typeahead test.

5. **Radix-primitive prop audit: `side`/`align` (dropdown positioning) weren't exposed**, hardcoded
   to `position="popper"` only. `Tooltip` (already Finalized, the closest Radix-popover precedent in
   this codebase) explicitly exposes exactly these two as real, documented props on an identical
   `SelectSide`/`SelectAlign` type shape — establishing they're "commonly relevant" here too, not
   scope creep. Added both, wired to `SelectPrimitive.Content`, demonstrated in the new
   `SideAndAlign` story and verified live (a `side="right"` selection genuinely opened the dropdown
   to the trigger's right, not below it).

6. **`asChild` support added, with a real architectural conflict resolved deliberately, not
   guessed.** `Select`'s own `children` prop is already `<Select.Option>`s for the dropdown — Radix
   `Slot` needs exactly one child to merge the trigger's behavior onto, and the trigger's own
   built-in content (`Select.Value` + the caret `Icon`) is hardcoded internally, neither of which
   `Button`'s own `asChild` precedent (where `children` *is* the button's own visible content, no
   competing use) directly resolves. Asked for a decision rather than guessing an API shape that
   might need a breaking change later: added a dedicated `trigger?: ReactElement` prop (matching
   `Tooltip`'s own single-`ReactElement` trigger shape, just under its own name here since
   `children` was already spoken for) — when `asChild` is set, `trigger` becomes the `Slot`'s single
   child, fully replacing the built-in value/caret display, mirroring `Button`'s own "asChild
   replaces the icon/label content" precedent exactly. Three dev-mode warnings added, matching
   `Button`'s own validation style: `trigger` without `asChild`, `asChild` without `trigger`, and
   `placeholder` alongside `asChild` (inert — no `Select.Value` renders in that mode). Confirmed
   live: a real `<a>`/`<button>` passed as `trigger` renders as the actual DOM element (not wrapped
   in an extra node), still opens the real dropdown, and still receives `Select`'s own
   size/error/className chrome via Radix `Slot`'s built-in prop-merging.

7. **Docs page added** (`Select.mdx`), full 10-section template. Live-verified: Playground and all
   8 variant stories render correctly, including the `side`/`align` placement fix and the custom
   `asChild` trigger; Properties table renders all 27 props in the declared order with real
   descriptions and correct value-option pills; both `RelatedCard`s (`Input`, `FieldLabel`) render
   live previews with correct `/?path=/docs/...` `href`s. **Caught and fixed while drafting, not
   after:** an early draft referenced `FormField` (as the typical container for `Select` +
   `aria-describedby` wiring) both in `Select.mdx`'s own prose and in `Select.types.ts`'s own
   `aria-describedby` JSDoc — `FormField` doesn't exist yet (still an unbuilt molecule per
   `04-component-inventory.md`). Fixed by rewriting both to match `Input.types.ts`'s own real,
   already-shipped `aria-describedby` wording, and swapping the second `RelatedCard` to the
   already-built `FieldLabel` instead. Both brand themes × both modes spot-checked live
   (Purple/Light, Emerald/Dark) — correct contrast, dropdown and options both themed correctly, no
   console errors.

## Verification

`pnpm lint` (eslint + full `tsc --noEmit` + `typecheck:storybook`, clean), full `vitest` unit suite
(1095/1095 passing package-wide, 24/24 for `Select` itself, up from 13), the `storybook` Vitest
project (381/381 passing package-wide, up from 378), `tsup` build (clean), `check-component-
bundle-size` (`Select`: 1.56KB JS / 0.92KB CSS gzipped, within budget). Live-verified in Storybook:
every prop's control genuinely drives its own story's canvas; the `aria-invalid` override fix
re-verified via a real consumer-supplied `aria-invalid={false}` no longer winning over `hasError`;
`side="right"` genuinely repositioned the dropdown; the custom `asChild` trigger opens the real
dropdown and receives Select's own chrome; 0 accessibility violations closed, open, and with a
custom `asChild` trigger; both brand themes × both modes confirmed live.

**Checked and passing, no action needed:** TypeScript strict/no `any`, zero hardcoded values (the
one non-token `box-shadow` variant selector is an already-established, deliberate pattern — shadows
aren't reactive semantic tokens, matches precedent elsewhere in this codebase), SSR-safe (`useId`),
original DBM implementation, solid existing baseline test coverage before this review (13 tests,
including open/closed axe checks), atom-reuse of `Icon` with no defect found in it, controlled/
uncontrolled pairs already correct for both `value`/`defaultValue` and `open`/`defaultOpen`,
composed tab order not applicable in the way `GridItem`'s stepper example was (Radix's own
roving-focus/typeahead mechanism inside the open dropdown is a standard, already-accessible pattern,
not a DBM-composed tab-order decision to verify by hand), cross-part ARIA/id wiring not applicable
(`Select` doesn't compose a label/helper-text triad itself — that's a future `FormField`'s job).
Grouped options (`Select.Group`/`Select.Label`) remain a deliberate, already-JSDoc'd deferral
("leaves room for grouped options later without a breaking API change") — re-affirmed during this
review, not a fresh finding, and now also noted in the Docs page's own "Best practices" section for
visibility.

## Post-review fix (2026-09-14, user-reported): control-panel wiring, values, and order

**Request: verify Select's Storybook controls show each story's real value instead of "Choose
option..."; fix props showing an inert "Set string" placeholder instead of a real input; make sure
prop order makes sense in both the stories and the Docs page Properties table; and disable any
control that isn't genuinely interactive for a given story.**

**`name`/`form`/`autoComplete` showing an inert "Set string" placeholder button.** Same root cause
as `List`'s own `start` prop fix: a `text` control with an `undefined` starting arg renders as a
placeholder button, not an empty-but-editable input. Fixed by giving all three a real `""` starting
arg, matching `GridItem.stories.tsx`'s own established `parseNumberArg`-adjacent convention (a
`text` control gates on `undefined` exactly like a `number` control does).

**`dir` showing "Choose option..." though it has a real, standard resolved value.** Same "control
must match what's genuinely in effect" reasoning as `List`'s own `as`/`marker` fix — `dir` has no
destructuring-level default in `Select.tsx` (passed straight through to Radix `Root`), but its real
effective value when omitted is `'ltr'`. Fixed by setting it as the Playground's starting arg.
`defaultValue`/`value`/`placeholder` were audited too and correctly left alone — their true default
genuinely *is* "nothing selected," which the canvas already shows consistently as a placeholder; a
forced fake selection there would misrepresent real default behavior, not fix a bug.

**Real, confirmed control/canvas mismatch bugs — the same class as `List`'s own `as`/`marker`
finding, found by checking every story individually, not just the Playground.** `AllSizes`' own
`defaultValue: "md"` was genuinely applied and visibly showing "Medium" in all five instances, while
the shared control read "Choose option..." — root-caused to the `defaultValue` argType's `options`
list being hardcoded to the Playground's own 5-variant demo set, which doesn't include `"md"` at
all (a completely different value space from `AllSizes`' own `sm`/`md`/`lg` children). The same
options-list mismatch existed for `States` (children: `primary` only), `DisabledOption` (`primary`/
`secondary`/`tertiary`), and `LongList` (30 country names) — none of which share the Playground's
option set. Fixed per-story: `AllSizes`/`States`/`LongList` disable `defaultValue`'s control
(fixed/structural demo content, not the story's own point, and/or impractical to explore);
`DisabledOption` instead overrides `defaultValue`'s own `options` to its real three values, kept
live since trying `defaultValue="secondary"` (the disabled option) is a genuinely interesting,
real thing to explore there — confirmed live that Radix correctly declines to pre-select a disabled
option via `defaultValue`, real component behavior, not a bug.

**`Controlled` story's render ignored its own args entirely** — a bare hardcoded `<Select>` with no
`{...args}` spread, so every one of its 27 controls was a silent no-op (confirmed live: toggling
`disabled` did nothing). The same "story ignores its own args" bug class `Grid`'s and `List`'s own
reviews already found and fixed elsewhere in this codebase. Fixed by spreading `{...args}`, with
`value`/`onValueChange` still driven by this story's own local state (its whole point) and
`defaultValue` explicitly disabled (passing both `value` and `defaultValue` at once is the exact
controlled/uncontrolled conflict `Select.mdx`'s own "Don't" list already warns against). Re-verified
live: toggling `disabled` now genuinely dims the trigger.

**Real, non-obvious ordering bug, root-caused rather than patched around:** the *native* per-story
Controls panel (Storybook's own addon tab, distinct from the Docs page's own custom
`PlaygroundControls` block) consistently floated `disabled` to the very first position, ahead of
`value` — while every other prop matched the intended `SelectProps` declaration order exactly, and
the Docs page's own explicitly-`order`-controlled blocks were already 100% correct throughout.
Confirmed via direct comparison against `Input` (an atom with the identical `interface X extends
Omit<ComponentPropsWithoutRef<"button">, ...>` shape, including its own explicit `disabled`
redeclaration) that this isn't a general limitation of that pattern — `Input`'s own native panel
orders `disabled` correctly. The one structural difference: `Select` is `Object.assign(SelectRoot,
{ Option: SelectOption })` — the first compound, dot-notation component this codebase has reviewed
(`Grid`/`List` have no sub-parts) — and TypeScript infers the *bare* `Object.assign(...)` call's
return type as an unnamed intersection, which the docgen tool apparently resolves less predictably
than a plain `forwardRef` export. Fixed by introducing an explicit `SelectComponent` type alias and
annotating the export with it (`export const Select: SelectComponent = Object.assign(...)`) instead
of relying on the inferred type — confirmed live: `disabled` immediately moved to its correct
position, with no other change to the component's runtime behavior. Worth carrying forward as a
convention for any future dot-notation compound component in this codebase.

**Re-verified live across every story, not assumed from the diff:** `Playground`'s `dir`/`name`/
`form`/`autoComplete` all show correct real values in the native panel; `AllSizes`/`States`/
`LongList` show `defaultValue` as `-`; `DisabledOption`'s own options list correctly restricted to
its three real children; `Controlled`'s `disabled` toggle genuinely dims the canvas; `disabled`
correctly ordered (right after `hasError`) on every story checked. Full suite re-run clean: `pnpm
lint`, `vitest` unit (24/24 for `Select`) and `storybook` project (381/381) tests, `tsup` build,
`check-component-bundle-size` (unchanged, within budget).

## Post-review fix #2 (2026-09-14, user-reported, with a screenshot): dropdown never actually scrolled

**"select 'long list...' story seems incorrect. Shouldn't the dropdown be a short height that
vertically scrollable?"** Confirmed real, and — unlike the earlier Storybook-controls-only fix
round — a genuine defect in the shipped component's own CSS, not a demo issue. `Select.module.css`'s
`.content` rule had no `max-height` at all, so the dropdown rendered every option fully unclipped
regardless of how many there were; Radix's own `ScrollUpButton`/`ScrollDownButton`/`Viewport`
scrolling mechanism only activates once `Content` is actually height-constrained, and without that
constraint it never had anything to do. The "Long list (scroll buttons)" story's own name had been
describing behavior that was never actually happening.

Fixed by adding `max-height: var(--radix-select-content-available-height)` to `.content` — Radix's
own documented pattern for this exact case, not a value this component invents: a real CSS custom
property Radix sets at runtime to the actual remaining viewport space. Re-verified live, not assumed
from the CSS alone: the dropdown now opens to a short panel (Argentina–Egypt) with a visible
scroll-down affordance; scrolling reaches United States (the real last item) with the scroll-up
affordance now showing instead. Short lists (`Default`, 5 options) confirmed unaffected — no scroll
buttons appear, nothing changed there, since those never approach the available-height budget. Both
brand themes × both modes reconfirmed live on the fixed dropdown (Emerald/Dark screenshotted). 0
accessibility violations re-confirmed. Full suite re-run clean: `pnpm lint`, `vitest` unit (24/24)
and `storybook` project (381/381) tests.

## Post-review fix #3 (2026-09-14, user-requested): `CustomTrigger` story uses DBM's own `Button`

**"could you use dbm button instead?"** (of the story's plain `<button type="button">`), followed by
**"update 'asChild + trigger' button variant to primary. make sure its default and not full width
.... in other words it should hug content. Also, change label from 'Open the custom trigger ▾' to
'Open the custom trigger'"**. `CustomTrigger`'s own point is demonstrating that `asChild`/`trigger`
accepts *any* real element and correctly merges Select's chrome onto it via Radix `Slot` — swapping
the plain `<button>` for this system's own `Button` atom makes that concrete rather than abstract,
and is a more realistic real-world usage example besides.

Swapped to `<Button variant="primary">`, removed the label's manual `▾` (redundant now that `Button`
is the real, recognizable atom, not a placeholder). **Real cross-component interaction found and
fixed along the way:** `Select.module.css`'s `.trigger` class sets `width: 100%` by design (see
finding 1's own file header comment) — Radix `Slot` merges that class onto whatever element is
slotted as `trigger`, which silently overrode `Button`'s own `fullWidth={false}` default and stretched
it edge-to-edge, contrary to `Button`'s own real default behavior everywhere else in this codebase.
Fixed with an inline `style={{ width: "fit-content" }}` on the `Button` itself — inline styles always
beat an external stylesheet class regardless of merge order, so this reliably wins without touching
`Select.module.css`'s own `100%` rule (still correct for the built-in trigger). Confirmed live: the
button now hugs its own label content instead of stretching full width.

## Diagnostic (2026-09-14, user-reported, with a screenshot): `side="right"` dropdown appearing behind the control panel

**"I'm noticing the dropdown appears behind the control panel, for instance when the side is set to
'right'. is this storybook issue or component bug?"** Investigated via precise DOM/iframe coordinate
measurement (`getBoundingClientRect()` on the dropdown vs. the Storybook canvas iframe's own rect,
correctly offset into page-space rather than compared directly — an iframe-inner element's rect is
relative to the iframe's own viewport, not the outer page). **Concluded: a Storybook-layout artifact,
not a component defect.** The addon panel docks on the right by default, leaving a narrow canvas;
combined with the trigger's own full-width-by-design `.trigger` class (see finding 1), there is
genuinely no room on either side of the trigger for the ~244px-wide dropdown when `side="right"` is
requested in that narrow context. Confirmed by testing `side="bottom"` in the identical narrow
canvas — it positioned perfectly, and Radix's own collision detection (which measures
`window.innerWidth` from inside the iframe, matching its real rendered width) correctly perceived the
narrow viewport and repositioned accordingly rather than malfunctioning. No code change made — purely
diagnostic. Offered the user a documentation caveat about `side="left"`/`"right"` needing adequate
horizontal space; not yet requested.

## Post-review fix #4 (2026-09-14, user-requested): stories constrained and centered, not full-width

**"could you update the width of the select in the stories so that its not full width. also make
sure its centered within the canvas/demo box."** Every story's demo `<div>` had previously stretched
to the canvas's own full padded width, since `.trigger`'s `width: 100%` (finding 1) fills whatever
container it's given — matching the trigger's own real, deliberate default behavior, but making every
story visually stretch edge-to-edge in a way `Input.stories.tsx` (the closest sibling molecule,
already establishing a `maxWidth: "20rem"` demo-container convention) does not.

Added a shared `demoContainerStyle = { maxWidth: "20rem", marginInline: "auto" }` constant, matching
`Input.stories.tsx`'s own `20rem` value, and applied it to all 9 stories (`Playground`/meta-render,
`Default`, `AllSizes`, `States`, `DisabledOption`, `LongList`, `SideAndAlign`, `CustomTrigger`,
`Controlled`) — merged into each story's own existing wrapper (flex-column gap, `paddingBlock`, etc.)
rather than adding a redundant nested `<div>`. `CustomTrigger` needed one addition beyond the shared
style: since its `Button` trigger is `fit-content` (finding above), not `100%` width like every other
story's trigger, constraining only the outer container wasn't sufficient to center it — added
`display: "flex", justifyContent: "center"` to that story's own wrapper specifically.

Re-verified live in Storybook, not assumed from the diff: every story's canvas — both as its own
story view and embedded via `Select.mdx`'s own `<Canvas of={...}>` blocks on the Docs page — now
renders the select/button constrained to `20rem` and horizontally centered; `SideAndAlign`'s
`side="right"` dropdown re-confirmed still opening correctly in a normal (non-narrow) canvas after
the width change. `pnpm lint` clean; `vitest` unit (24/24 for `Select`) and `storybook` project
(381/381) suites re-run clean.

## Post-review fix #5 (2026-09-14, user-reported, with a screenshot): custom `Button` trigger not rendering as `primary`

**"what happen to our primary button as the custom trigger in select's 'asChild + Trigger' story? did
it revert back? fix it"** — the story's code genuinely still said `variant="primary"` (no revert), but
the rendered button showed white/outlined chrome instead. Root cause: `Select.tsx`'s trigger
`className` unconditionally applied `cx(styles.trigger, sizeClass[size], hasError && styles.error,
className)` regardless of `asChild`. Radix `Slot` merges that className onto the custom `trigger`
element by concatenation, so the rendered `Button` ended up with both its own `_variantPrimary_...`
class and Select's own `_trigger_...` class at once — and since both are equal-specificity
single-class CSS-Modules selectors, the winner came down to unpredictable stylesheet load order, not
intent. Confirmed live via computed styles: `Select.module.css`'s `.trigger` background-color/border/
color were winning over `Button`'s own `variantPrimary` rules (the earlier `width: "fit-content"`
inline-style fix from finding #3 only ever addressed `width`, not this).

Fixed by only applying Select's own built-in trigger chrome classes when *not* `asChild` — in
`asChild` mode, only the consumer's own `className` passthrough still applies, since the whole point
of a custom `trigger` is that it brings its own complete styling (unlike `Button`'s own `asChild`,
where merging its classes onto the child *is* the point — a different, non-transferable precedent).
Removed the now-unnecessary `style={{ width: "fit-content" }}` from the `CustomTrigger` story — with
`.trigger`'s `width: 100%` no longer applying in `asChild` mode, `Button`'s own `fullWidth={false}`
default already produces the right sizing with no override needed. Re-verified live: the button
renders fully purple/primary, still fit-content and centered, and still opens the real dropdown with
all five options. `pnpm lint` clean; `vitest` unit (24/24) and `storybook` project (381/381) suites
re-run clean.

## Post-review fix #6 (2026-09-14, user-requested): size variants didn't actually match Input's

**"update all Select component size variants to match to it's size counterpart in Input component,
eg. Select md size variant should be same size as the Input md size variant. do not change Input
component."** `Select.module.css`'s own "Sizes" comment had long claimed an "identical scale to
Input.module.css so a Select and an Input at the same `size` line up exactly in a shared row" — not
actually true. Two real gaps, found by directly diffing both files' size rules rather than trusting
the comment:

1. **`.trigger` had no `line-height` at all**, unlike `Input.module.css`'s own `.wrapper`, which sets
   `line-height: var(--dbm-line-height-tight)` explicitly — needed because a native interactive
   element doesn't inherit `line-height` from an ancestor the way a plain element does (same root
   cause `Input`'s own file documents for its `<input>`, just one level up here on the `<button>`
   trigger itself). Without it, `.trigger` fell back to the browser's own UA-default `line-height:
   normal`, not `tight`.
2. **Every `.sizeX`'s `padding-block` used its own shorter, ad hoc values** (`space-1`/`space-1`/
   `space-2`/`space-2`/`space-3` for xs/sm/md/lg/xl) instead of `Input`'s real formula — Button's own
   `padding-block` for the matching size, minus `--dbm-border-width-1` (both `Select`'s trigger and
   `Input`'s wrapper carry that same 1px border; Button, having none, doesn't subtract it). `font-size`
   and `padding-inline` already matched Input exactly per step — only `padding-block` was off, by
   6px of total height at every size except `lg` (14px there).

Fixed by adding the missing `line-height` and replacing each `padding-block` with `Input`'s own
formula (`calc(var(--dbm-space-N) - var(--dbm-border-width-1))`, same per-size `N` as Input: xs→2,
sm→3, md→3, lg→4, xl→4). Confirmed live, not assumed from the CSS: measured both components'
`AllSizes` stories via `getBoundingClientRect()` — Select's five trigger heights now equal Input's
five wrapper heights exactly (xs 29.8px, sm 39.3px, md 42.4px, lg 54.4px, xl 59.3px, matched at every
step), and both `AllSizes` galleries look visually identical box-height-wise side by side. `States`
(empty/filled/disabled/error) re-confirmed rendering correctly at the new heights. No change made to
`Input` itself, per the request. `pnpm lint` clean; `vitest` unit (`Select` 24/24, `Input` 25/25) and
`storybook` project (381/381) suites re-run clean.

## Final pre-finalization pass (2026-09-14, user-requested)

**"let's do a final review of the Select component before finalizing it."** Re-ran the full
`06-engineering-standards.md` §9 checklist against the component's current state (six post-review fix
rounds landed since the original pass), rather than assuming the original findings still fully cover
it. Found and fixed three real, concrete compliance gaps — no design decisions needed for any of
them:

1. **`Select.mdx`'s own "Design tokens used" section was incomplete** relative to what
   `Select.module.css` actually references — missing `border-width.1`/`border-width.2`,
   `font-family.primary`, `font-size.xs`–`font-size.lg`, `font-weight.semibold`, `line-height.tight`
   (added this session's own sizing fix), `opacity.40`, and `space.6` (the scroll buttons' own
   height) — noticeably thinner than `Input.mdx`'s own equivalent section for a component now
   explicitly sized to match it. Fixed by adding all seven, each with real usage descriptions.
2. **`trigger`/`size`/`hasError`'s own JSDoc didn't document that Select's own built-in trigger
   chrome doesn't apply in `asChild` mode** — a real behavior change from fix #5 above that a
   consumer reading only the types (not this file) would have no way to know. Fixed by adding a
   sentence to each of the three.
3. **No regression test covered fix #5's actual className-merge behavior** — existing tests covered
   `asChild` rendering the right element and warning correctly, but nothing asserted that Select's
   own built-in classes are absent from a custom trigger, or that the consumer's own `className` and
   the custom trigger's own `className` both still reach the DOM. Added two tests
   (`Select.test.tsx`, `24 → 26`) covering both.

**Also re-verified live, not re-derived from the diff**, since three CSS-affecting fixes (#5's
className logic, #6's `line-height`/`padding-block` sizing) landed since the original pass:
`AllSizes` and the `CustomTrigger` story confirmed correct in Emerald/Dark (the custom trigger's own
pale-mint `primary` color is `Button`'s own real, already-established dark-mode appearance, not a
Select-side regression); `Default` confirmed correct and fully functional (opens, selects) at a
375px mobile viewport, no overflow past its own `20rem` cap; full suite re-run clean — `pnpm lint`,
`vitest` unit (`Select` 26/26), `storybook` project (381/381), `tsup` build, `check-component-bundle-
size` (1.56KB JS / 0.97KB CSS gzipped, within budget — CSS grew ~0.05KB from fix #6's added
`line-height`/`calc()` rules).

**Two feature-completeness items surfaced for an explicit scope decision, not actioned without
one** (per §9's own scope-creep guardrail — every addition needs a named, concrete rationale, not
implemented speculatively):

- **`Select.Option` doesn't expose Radix `Item`'s own `asChild` prop**, unlike `Select` itself (which
  already got `asChild` in the original review, finding 6). Radix's `Select.Item` genuinely supports
  it — the concrete use case is rendering an option as a custom row component (e.g. with a leading
  icon or secondary description line) while keeping Radix's own listbox/typeahead/selection behavior.
  Not yet needed by anything in this codebase.
- **No "clear selection" affordance**, unlike `Input` — the same form-field family, sharing Select's
  own border/radius/focus/error/size chrome — which already has one (`onClear` + its own clear
  button). Once a value is selected, there's currently no way back to the placeholder/unselected
  state without a caller-provided blank option. A real, comparable-sibling gap, but a nontrivial one
  to add correctly (its own icon-size mapping per `size` step, keyboard/focus handling, RTL — the
  same shape of work `Input`'s own `onClear` already required).

Both left **unactioned pending the user's decision** — build now, defer explicitly (matching how
grouped options was already deferred in the original review), or decline.

## Post-review fix #7 (2026-09-14, user-requested): both surfaced findings built

**"let's do the 2 findings after the last review."** Both items above were implemented. Each surfaced
a real bug beyond the feature itself, found live in Storybook, not by reading the code — the standing
pattern throughout this whole review.

**`onClear` — a clear button that replaces the caret whenever a value is selected.** Added to
`SelectProps`, wired through `Select.tsx`: `showClear` computes from an internal `effectiveValue`
that shadows the real `value`/`defaultValue`; clicking the clear `<button>` (a plain DOM sibling of
the trigger, positioned via `.triggerContainer`'s `position: relative` + `.clear`'s
`position: absolute; inset-inline-end` — never nested inside the trigger `<button>`, which would be
invalid HTML) calls `onClear`, resets the selection, and refocuses the trigger. `.trigger`'s own
`padding-inline-end` grows via a new `.sizeXClearable` variant when the clear button is showing, so
its icon never overlaps the selected value's own text — sized from the same tokens as `.clearX`'s own
per-size icon+padding, not a guessed value. `asChild` skips this entirely (warns in development if
`onClear` is passed alongside it, matching the established `placeholder`-with-`asChild` warning
pattern) — a custom trigger has no built-in caret slot for a clear button to take over.

**Real bug found live, not caught by any test beforehand:** the first working version passed
`undefined` as the "nothing selected" sentinel when resetting an uncontrolled selection. This made
Radix's own `value` prop genuinely flip between controlled and uncontrolled from *Radix's own*
perspective every time a selection was made (real string) vs. cleared (`undefined`) — exactly the
anti-pattern Radix's own `useControllableState` dev warning exists to catch ("Select is changing from
uncontrolled to controlled... Components should not switch..."), confirmed firing in the console.
Root-caused by reading `@radix-ui/react-use-controllable-state`'s actual source rather than guessing:
Radix's own internal "uncontrolled fallback" value gets set as a *side effect* of Select genuinely
being uncontrolled (from Radix's perspective) at the moment a selection is first made — since nothing
on this side can reach in and reset *that* internal value, flipping back to `undefined` later made
Radix silently resurface the stale, just-cleared value instead of the placeholder. Confirmed live via
temporary render-logging: this component's own state reset to `undefined` correctly every time, but
the trigger kept showing the old label regardless — proof the bug was entirely on Radix's side of the
boundary, not this one. Fixed by using `""`, never `undefined`, as the sentinel whenever `onClear` is
engaged — `"" !== undefined` keeps Radix permanently controlled from the first render onward, so its
internal fallback is never used at all. Re-verified live through repeated select→clear→select→clear
cycles (including a second, *different* value after a clear, and RTL via `dir="rtl"`, where the clear
button correctly mirrors via `inset-inline-end`) with zero stale values and zero console warnings.
`jest-axe`: 0 violations with the clear button shown.

**`Select.Option`'s own `asChild`** — a custom option row (e.g. a two-line label + description)
while keeping Radix's own listbox/typeahead/highlight behavior. Requires `textValue` (warns in
development without it): Radix's own selected-label projection needs a plain string to show in the
trigger once selected, not the custom row itself, so in `asChild` mode the custom row renders as
provided with an extra `ItemText` appended (sourced from `textValue`) purely to feed that projection.
`styles.option` isn't merged onto the custom row (`className` still passes through), matching the
established `SelectRoot`-level `asChild` precedent from finding #5.

**Second real bug found live:** the extra `ItemText` was meant to be invisible (`style={{ display:
"none" }}` directly on it) — instead it rendered fully visible, duplicating every custom row's own
label directly beneath it in the open dropdown. Root-caused by reading Radix's own `SelectItemText`
source: it destructures `style`/`className` out of its own props and never actually applies either to
its rendered node — both are silently dropped, a genuine Radix behavior, not a typo on this side.
Fixed by wrapping the extra `ItemText` in a plain `<span style={{ display: "none" }}>` instead, which
does respect inline styles; confirmed this doesn't interfere with Radix's own portal-based projection
into the trigger, since `ReactDOM.createPortal` moves that content to a completely different DOM node
(the trigger's own), which isn't a descendant of the hidden wrapper. Added a regression test that
specifically locates the hidden text and asserts *where* it lives (inside a `display: none` ancestor)
rather than just counting occurrences in `textContent` — confirmed by temporarily reverting the fix
that the naive count-based version of this test can never fail, since `textContent` ignores CSS
`display` entirely, while the ancestor-based version correctly fails on the bug and passes on the fix.

Two new demo stories (`Clearable`/"With a clear button", `CustomOptionRow`/"Custom option row
(Select.Option asChild)") added to `Select.stories.tsx` and `Select.mdx`'s own Variants section — the
first pass at documenting `Clearable` shipped without its own `<Canvas>` block in the Docs page,
caught and fixed while verifying the Docs page live rather than assuming the story alone was enough.
Both stories: 0 accessibility violations. Full suite re-run clean: `pnpm lint`; `vitest` unit (`Select`
41/41, up from 26); `storybook` project (383/383, up from 381); `tsup` build; `check-component-
bundle-size` (2.20KB JS / 1.19KB CSS gzipped, within budget).

## Post-review fix #8 (2026-09-14, user-reported with a screenshot): custom option row had no chrome at all

**"Select's custom option variant dropdown... has a different hover state as well as the padding is
off compared to the non custom variant... Is this a storybook mismatch or component issue?"** A
real component bug, not a Storybook demo issue. `Select.Option`'s `asChild` path copied
`SelectRoot`'s own trigger `asChild` treatment verbatim — skip `styles.option` entirely — on the
assumption a custom element always brings its own complete chrome. That's true for the trigger
(`asChild` there is for a fully-styled element like `Button`), but not for an option row, which is
usually bare content (a `<div>` + a couple of `<span>`s) that still needs to look and behave like
every other option. Skipping `styles.option` meant no padding, and — lacking `outline: none` — the
browser's own default focus ring showed instead of this system's `bg.brand-subtle` highlight.

Fixed by splitting `.option` in `Select.module.css` into the chrome every option needs regardless of
content shape (padding, radius, cursor, outline reset, checked/disabled/highlight coloring) and a new
`.optionRow` modifier holding just the built-in single-line flex layout — applied for the default row,
withheld for `asChild` (which would otherwise force a custom column layout into a horizontal,
space-between arrangement). `Select.tsx` now always applies `.option`; `.optionRow` only when
`!asChild`. Updated the one existing test that had encoded the old (buggy) behavior as intentional
("does not merge the built-in option class onto a custom row") to assert the corrected contract
instead. Re-verified live, both brand themes × both modes: the custom row now shows the same padding
and highlight as a built-in option. `pnpm lint`, `tsc`, full `vitest` suite (1495/1495 package-wide)
all clean.

## Post-review fix #9 (2026-09-14, user-requested): "With a clear button" story didn't show a clear button

Asked directly whether the Docs page's own code example for this story was correct — it was
technically accurate to what rendered, but the story set no `defaultValue`, so the canvas showed
nothing selected and no clear button at all until a reader manually opened the dropdown and picked
something. `Input`'s own identically-named story seeds real local state for exactly this reason; this
"Variants/states gallery" entry didn't. Fixed by seeding `args: { defaultValue: "primary" }` — the
clear button now renders on load, matching `Input`'s convention. Verified live (button visible
immediately, clicking it correctly resets to the placeholder) and via `pnpm lint`/`tsc`/tests.

## Post-review fix #10 (2026-09-14, user-requested): Properties-table and native Controls-panel ordering

Two related but genuinely separate ordering mechanisms, checked one at a time at explicit request.

**Docs-page Properties table** (`Select.mdx`'s `propOrder`, feeding `<PropertiesTable>`): `onClear`
was missing from the array entirely — `PropertiesTable`'s own "anything omitted falls through to the
end" behavior meant it still rendered, just as the very last row instead of grouped with
`value`/`defaultValue`/`onValueChange` above it. Separately, `aria-label`/`aria-labelledby`/
`aria-describedby` were placed *after* `id`/`className`/`style`/`data-testid` — checked against seven
other already-Finalized components' own `propOrder` arrays (Button, Input, Textarea, Tooltip, Switch,
Checkbox, Avatar) and found every one of them places the `aria-*` cluster immediately *before* the
escape-hatch cluster, never after. Fixed both. (A first attempt at explaining the fix added a
narrative comment directly above the `export const propOrder = [...]` line, which broke the whole
Docs page — MDX's ESM-block recognition requires the block to start with a literal `export`/`import`
keyword, so a leading comment silently fails the parse. No other `.mdx` file in this codebase has a
comment before or inside one of these arrays; removed it rather than establish a new, apparently
unsafe pattern.)

**Native per-story Controls panel** (a separate mechanism per `07-storybook-and-documentation-
standards.md` §5 — driven by `SelectProps`' own field-declaration order in `Select.types.ts`, not by
any `order` prop): had the identical two bugs, since it was reading the un-fixed interface. Fixed by
reordering the actual fields in `Select.types.ts` (`children` moved next to `trigger`, `aria-*` moved
before `id`/className/style/data-testid) — field order in a TS interface has no runtime/type-safety
effect, so this was safe. Per the established fix pattern for this exact bug class, a full Storybook
dev-server restart was required (Vite HMR doesn't invalidate docgen's cache for a changed type file) —
done, then re-verified both the Docs-page table and the native panel render in the identical, corrected
order. Also fixed a stale top-of-file comment in `Select.stories.tsx` that still described the
pre-fix field order (and had been missing `disabled` even before that), and reordered the story
file's own `argTypes` object to match — cosmetic (doesn't affect either rendered mechanism) but was
contradicting the comment directly above it. `pnpm lint`/`tsc`/`typecheck:storybook`/tests all clean
throughout.

## Post-review fix #11 (2026-09-14, user-requested): missing `autoComplete` JSDoc

Asked how `autoComplete` works, which surfaced that `autoComplete?: string;` in `Select.types.ts` had
no JSDoc at all — unlike its neighbors `dir`/`form`. A full audit of every prop in both `SelectProps`
(28 props) and `SelectOptionProps` (9 props) found this was the only gap. Fixed by adding a real JSDoc
block explaining the actual mechanism (passed to Radix's own hidden native `<select>`, rendered
internally for browser autofill/form-submission compatibility — not to the visible trigger). Also
updated `Select.stories.tsx`'s own `argTypes.autoComplete.description` (the Storybook-side workaround
for docgen not always surfacing JSDoc) to match, since it had drifted to a shorter, less complete
version. `pnpm lint`/`tsc`/tests clean.

## Post-review fix #12 (2026-09-14, user-directed): decision-point language and internal doc references removed

A `TokenRow` in `Select.mdx`'s "Design tokens used" section read "the dropdown content's own
elevation — a fixed light/dark pair, not a reactive token (see 03-token-system-spec.md)" — both an
internal-doc citation and design-decision rationale, neither appropriate for public-facing Storybook
content per `07-storybook-and-documentation-standards.md` §4. Fixed by trimming to the plain usage
fact. Requested review of every other already-Finalized component's own Docs page for the same
pattern — found 18 more instances across 10 components (ThemeProvider, GridItem, Avatar, Text, Icon,
Badge, FieldError, Spinner, ProgressBar, ProgressCircle — see each of their own review files), all
fixed the same session with user confirmation, plus one more on `Select.mdx` itself (an `aria-invalid`
accessibility bullet citing "a real bug found and fixed during this component's own review (see
`component-reviews/Select.md`)" — trimmed to the plain behavior fact). `guidelines/07-storybook-and-
documentation-standards.md` §4 was broadened the same session to explicitly cover this
no-literal-doc-path variant (dates, "found and fixed during review," "at explicit direction," token-
consolidation history), not just literal `guidelines/*.md` path citations, so this doesn't need
rediscovering per-component going forward. All doc-prose-only edits — no component code, tokens, or
rendered behavior changed; `typecheck:storybook`/tests confirmed clean throughout.

## Final pre-finalization review, round 2 (2026-09-14, user-requested)

**"Let's do a final review of the Select component before finalizing it."** Re-ran the full
`06-engineering-standards.md` §9 checklist once more against the component's current state (twelve
post-review fix rounds landed since the original pass). Found and fixed two real gaps, plus closed one
genuinely new-ground documentation gap at the user's explicit request:

1. **Missing accessibility test coverage:** every existing `jest-axe` check with the dropdown open only
   ever exercised the built-in option markup, never a `Select.Option asChild` custom row — a
   materially different DOM structure (a plain `<div>` instead of `ItemText`+`ItemIndicator`), the same
   coverage-gap class the polymorphic-`as` convention already catches on `Avatar`. Added a test
   rendering a real two-line custom row with the dropdown open — **0 violations**, confirming fix #8's
   CSS change is accessibility-clean, not just visually correct.
2. **`Select.Option` (a real compound sub-part) had no Properties table of its own** on the Docs page —
   only `SelectRoot`'s props were documented. Genuinely new ground: Select is the first molecule with a
   dot-notation sub-part to go through review (`Grid`/`List` have none), so there was no established
   precedent either way. Flagged as an open decision rather than actioned unilaterally; confirmed by the
   user. Built via a docs-only `SelectOption.stories.tsx` (`tags: ["!dev"]` — a stable, documented CSF3
   tag, not an internal API — keeps it out of the sidebar/dev view while staying indexed for `useOf`
   resolution from the Docs page; its one story renders inside a real `<Select>` since Radix's own
   `SelectItem` throws outside that context) plus a new `### Select.Option properties` sub-section in
   `Select.mdx`. Along the way, found and fixed a real gap in the new table itself: the `value` prop's
   required-marker wasn't rendering (confirmed by comparing against `Icon`/`IconButton`'s own required
   `icon` prop, which do show it) — fixed by explicitly setting `type: { required: true }` in the new
   story's own `argTypes.value`, rather than relying on docgen extraction alone. This established a
   real, reusable pattern rather than a one-off — recorded as
   [ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md)
   for any future compound component's own sub-part(s).

Also re-verified full Radix-prop parity (cross-checked `SelectProps` against every one of Radix
`Select.Root`'s own props, including `autoComplete` — complete; cross-checked `side`/`align` scope
against `Tooltip`'s own precedent, which `Select`'s JSDoc explicitly claims to mirror — confirmed
identical, not a gap) and full keyboard flow live (Tab focuses → Enter opens → ArrowDown moves
highlight → Enter selects → focus returns to trigger, visible ring throughout).

**Final consolidated verification, everything from this round together:** `pnpm lint` (eslint + full
`tsc --noEmit` + `typecheck:storybook`, clean), full `vitest` suite (1497/1497 package-wide, 42/42 for
`Select` itself, 101 test files including the new hidden `SelectOption.stories.tsx` — confirming
`@storybook/addon-vitest`'s full-sweep render actually exercised the hidden story and passed, not just
that it typechecked), `tsup` build (clean), `check-component-bundle-size` (2.20KB JS / 1.19KB CSS
gzipped, within budget), `build-storybook` (succeeds) and `check-storybook-bundle-size` (12005KB/
20000KB total, largest chunk 1088KB/1536KB, within budget). Live-verified in Storybook: sidebar
confirmed clean (no stray "Option" entry); the new `Select.Option` properties table renders in the
intended order with the required marker on `value`; both brand themes × both modes spot-checked across
Default, Custom Option Row, and With a Clear Button — 0 accessibility violations on every check.

## Status

**Finalized 2026-09-14, at explicit user direction**, following this final review round. Per
`06-engineering-standards.md` §9's finalization rule, no further changes to `Select` (code, stories,
docs, or tokens it alone drives) without asking first, even for something that would otherwise be an
obvious, in-scope fix.

**Authorized post-finalization change (2026-09-14): clear button and down chevron recolored to
neutral.** Part of a system-wide rule established the same day (`05-component-api-conventions.md`
§6 — "icons used inside an input field use neutral colors"), applied here alongside `Input`,
`PasswordInput`, `NumberInput`, and `Textarea` — see each component's own entry.
- `.clear`'s own `Icon`: `tone="brand"` → `tone="default"` (Select.tsx); `.clear:hover`'s background
  changed from `var(--dbm-bg-brand-subtle)` to `var(--dbm-bg-neutral-subtle)`.
- `.icon` (the down chevron, `CaretDownIcon`): `color` changed from `var(--dbm-text-tertiary)` to
  `var(--dbm-icon-default)` — the two tokens share an identical resolved value in every theme
  (`03-token-system-spec.md`), so this is a semantic correction (matching the same `icon.*`-not-
  `text.*` principle `05-component-api-conventions.md` §6 already documents for `Image`), not a
  visual one. No hover background — the chevron is purely decorative, not itself interactive.

**Three-question finalization test:** (1) the clear button's rendered output changes (a real color
swap); the chevron's does not (identical resolved value) — (2) the clear button's change is a
deliberate preference change, not a defect, same reasoning as `Input`'s own identical change; the
chevron's is a semantic correctness fix; (3) blast radius scoped entirely to `Select.tsx`/
`Select.module.css`'s own `.clear`/`.icon` rules — no shared token/infra change. **Result: partial
re-finalization** for the clear-button half (re-verified Design quality and Theming/Accessibility
contrast — both tokens already carry vetted WCAG AA documentation; confirmed resolving correctly
across all 4 theme combinations via direct CSSOM/token inspection and live Storybook screenshots),
**stays Finalized with no new re-verification needed** for the chevron half (zero visual change).
No other checklist section touched. Full re-run: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` (1256/1256 whole package) and `storybook` (432/432 whole package),
`tsup` build, `check-component-bundle-size` (`Select` 2.20KB JS / 1.19KB CSS, still within budget)
— all clean. Live-reconfirmed in Storybook (`All sizes`, `With a clear button` stories, Purple
Light and Emerald Dark), zero Accessibility-panel violations. **Stays Finalized.**

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: five snippets (the Playground, "Default", "With a clear button", "side/align", "asChild + trigger") showed a `<DemoOptions />` placeholder where the options belong; every one spelled out ~16 props of defaults (`autoComplete=""`, `form=""`, `dir="ltr"`, `defaultOpen={false}`); and "Controlled" showed no `value`, a no-op handler and a hardcoded "Selected: none". Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `Select.snippets.ts` — real `Select.Option`s, the long list and the custom option rows written out (no `.map`), the controlled example as real state with a `useState` comment — and the Playground and "Default" build theirs from the live controls. All snippets and Playground combinations were typechecked against the real types (the controlled ones with the real `useState` lines, so the state handlers' types were checked too). **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Dropdown width no longer pinned to the trigger's, 2026-10-03 (defect fix; stays Finalized)

At explicit direction, after `Toolbar`'s "A select and a popover" story showed it. The dropdown's width was exactly the
trigger's (`width: var(--radix-select-trigger-width)`), so with a narrow trigger (a small select, "14 pt" in 78px) the
selected row, which is bold and carries a check mark, was too wide for its box and wrapped onto a second line while its
neighbours stayed on one. Reproduced in a real browser (trigger 78px, panel 78px, rows 68px wide, the checked one 59px
tall against 38px). Any select with a narrow trigger and a selected option had it, so it is a component defect, not the
story's.

Fix: the dropdown is at least as wide as the trigger (`min-width`), as wide as its longest option needs (`width:
max-content`), and no wider than the room there is (`max-width: var(--radix-select-content-available-width)`, so a very long
label still wraps, as it should, rather than running off the screen). With a trigger wider than every option nothing
changes. By the three-question test it is a defect fix (a layout failure of an existing requirement), so `Select` stays
Finalized. A hidden real-browser story ("Narrow trigger — interaction test") measures a 4.5rem trigger: the 12, 14 (checked)
and 18 rows are the same height, the panel is at least as wide as the trigger, and no option's text overflows its row;
it fails on the old CSS (`expected 72 to be less than or equal to 63`).

## Post-Finalization follow-up (2026-10-10, at explicit direction) — the list opened from a `Dialog`
`Select`'s list was on `z-index.dropdown` (1000), below a dialog's scrim (1300), so opened from inside a `Dialog` it was drawn under the scrim and could not be chosen from with the mouse. Found by a real-mouse check on `Dialog`, which keyboard-driven and synthetic-pointer checks had missed. It is now on `z-index.popover`, the step `Popover` uses ([ADR-0054](../adr/0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md)). By the three-question test it is a defect fix (an existing requirement, that the list is usable, was not met), so **`Select` stays Finalized**; its Docs token table and the Foundations z-index table were updated to match.

## Change after Finalization: the focus ring is drawn on the field's own edge (2026-10-11)
The same field-family rule as `Input`'s (see [Input.md](Input.md) and `05-component-api-conventions.md` §6): the ring sits on the trigger's own edge, the corners are not tightened while focused, and an invalid field keeps the ring in the danger colour. Covered by the shared real-browser check; the four themes and a real phone were not looked at live.

## Icons at the input's own step, 2026-10-19 (visual change; stays Finalized)

At explicit direction, following `Input`'s own change (see [Input](Input.md)): the icons this component draws in the field are the same step as its `size` (`xs` 12px … `xl` 32px) instead of one step below it. This covers the clear icon and the caret, which was fixed at `xs` before; the caret takes a negative block margin so a larger one never makes the trigger taller, and the clearable trigger's reserved room is recomputed from the new icon sizes. The option check mark in the list stays at `xs`. A real-browser check in `Input.checks.stories.tsx` measures the icons at every size.

## Decorative icons are `icon.secondary`, 2026-10-19 (visual change; stays Finalized)

At explicit direction: the icons that only decorate a field are `icon.secondary` (`gray.500`) instead of `icon.default`, so the controls beside them read as the stronger ones. The trigger's caret; the clear icon keeps `icon.default`. Measured contrast on the field's own backgrounds, computed from the primitives: 3.25:1 on the light surface and 4.34:1 on the dark one, and 3.12:1 / 3.10:1 on `bg.neutral-subtle`, all over the 3:1 non-text floor; the deeper `bg.neutral-subtle-hover` (2.86:1 light, 2.12:1 dark) is not under any decorative icon. Clickable icons (clear, show/hide, steppers, pickers' buttons, the `Combobox` caret) stay `icon.default`, and so does text in a slot (it needs 4.5:1). A real-browser check in `Input.checks.stories.tsx` reads the computed colours.

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`; with none, nothing changes. The `dir` JSDoc, the Controls description and the Docs text say so; a unit test and a real-browser check (`DirectionProvider.checks.stories.tsx`) set the direction only with a provider. Finalized status is unchanged.
