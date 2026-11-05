# Stat — Storybook/component review findings

**Data Display:** Stat — built 2026-09-27, item 22 in the itemized molecule-tier build order (`04-component-inventory.md`), where the row is
listed as `Stat / KPI` — the two names refer to the same component; it ships as `Stat`, the same convention `Tag / Chip` already set (the first
name in a dual-named row is what gets built). Adds no dependency and no component token, reusing existing status tokens for `Stat.Trend`'s
colour. **Finalized 2026-09-27** — the full `06-engineering-standards.md` §9 checklist, three same-day feature follow-ups, a final pre-Finalize
review, and a same-day correction to that review are all complete; see "Final review before Finalizing" below for what that last pass checked
and fixed, and the "Correction" entry right after it for what a live re-check of the review's own fix caught.

A compound component: `Stat` (root) with `Stat.Icon`, `Stat.Label`, `Stat.Value` (usually holding a `Stat.Trend`), and `Stat.Description`, every
one optional, in reading order.

## Decisions made during the build

- **The component name.** The inventory's own row reads `Stat / KPI`. Asked directly rather than assumed: ships as `Stat`, following the
  `Tag / Chip` precedent (`05-component-api-conventions.md` §2's "match the name in `04-component-inventory.md` exactly," applied to a
  dual-named row by taking the first name).
- **`Stat.Trend` takes one signed number, not a `direction` enum plus a separate magnitude.** `value={-4.2}` is both the number shown and the
  thing that decides the icon (up, down, or a dash for exactly `0`) and, together with `goodDirection`, the colour. Considered and rejected: a
  `direction: "increase" | "decrease"` prop alongside a `value`, which would let the two disagree (a "decrease" direction with a positive
  number) — deriving the direction from the sign is the only shape that can't be internally inconsistent. This is `Stat`'s own decision, not
  escalated to an ADR: it's self-contained (no other component currently has a "trend" concept to be consistent with), unlike `labels`/
  `formatNumber` (ADR-0021) or the settings-context pattern (ADR-0025), each of which was explicitly framed as a convention other components
  would also need.
- **`goodDirection`, not a fixed "up is good" assumption.** A support-ticket count, an error rate, or a cost going *down* is the improvement — the
  default (`"increase"`) fits the more common case (revenue, users, sales) but a metric where less is better needs the colours the other way
  round, and that's a real, common enough case in comparable production dashboards to build in from the start rather than leave as a named gap.
- **`Stat.Trend`'s accessible name needs `role="img"` on its own `<span>`.** `aria-label` on a plain `<span>` has no role that permits it —
  confirmed live by jest-axe (`aria-prohibited-attr`), not assumed. `role="img"` is the same fix `Avatar` already uses to flatten a composite
  visual (an icon plus a number, here) into one named unit, rather than a new pattern.
- **`announce` follows `Pagination`'s "never the first appearance" rule, not `EmptyState`'s "announce on appearance" one.** The two existing
  `announce` precedents in this system answer different questions: `EmptyState`'s announces because *content that wasn't there is now visible* on
  the page; `Pagination`'s announces because *a value that was already visible changed to a different one*. A stat's own value is closer to
  the second case (a live dashboard updates a number that was already showing), so the first render is remembered but never announced, exactly
  like `Pagination`'s own `previousPage` ref — not `EmptyState`'s "fill on mount" behaviour.
- **Orientation's `horizontal` case is a two-column CSS grid, not a flex row.** `Stat.Icon` needs to sit beside *all* of `Stat.Label`/`Value`/
  `Description` stacked together, not just the next one — a plain flex row can't do that without an extra wrapper `<div>` this component doesn't
  render (the same class of problem `Tabs`' own vertical-overflow work ran into and solved with CSS Grid rather than `display: contents`, whose
  specificity conflicts with a part's own `display` — considered here first and rejected for the identical reason). `grid-row: 1 / -1` on the
  icon badge spans however many rows the other parts end up needing, so it works regardless of which parts are actually present.
- **No `align` prop.** Unlike `EmptyState` (often centred on a whole page), a stat tile reads left-to-right down a column and doesn't have a
  comparable centring use case; adding one without a concrete need would be scope creep the guardrail in `06-engineering-standards.md` §9
  explicitly warns against.
- **`Stat.Value`'s digits are `tabular-nums` and don't wrap.** A live value that changes in place shouldn't shift the layout next to it as it
  gains or loses digits (the same reasoning `Slider`'s value label and `Pagination`'s numbers already established) — mirrored here for a value's
  *own* width, not just its neighbour's position.

## Radix-primitive prop audit

Not applicable — `Stat` wraps no Radix primitive. It's a small compound component in the same category as `Card`/`EmptyState`.

## Baseline correctness

- [x] Full "definition of done" (`05-component-api-conventions.md` §8) — file structure, no `any`, JSDoc on every prop, a story per
  variant/size/state, a unit test covering rendering and interaction, jest-axe clean, keyboard verified (there is none — static content), every
  new colour pairing reuses an already-verified token, exported from the public `index.ts`, no hardcoded values.
- [x] `forwardRef` on every part; `className`/`style`/`id`/`data-testid` accepted on every part; no controlled/uncontrolled pair needed (nothing
  here holds interactive state); no `asChild` (nothing here composes onto another element's role).
- [x] Commonly-relevant native props audited: `Stat` extends `<div>`, `Stat.Label`/`Value`/`Description` extend `<p>` (with `color` omitted, the
  same obsolete-attribute clash `EmptyState.Title` already found and excluded), `Stat.Icon` extends `<div>`, `Stat.Trend` extends `<span>`.
- [x] `{...props}` spread before every explicit, computed attribute (`data-orientation`, `data-direction`, `data-sentiment`,
  `data-stat-trend-label`, `aria-label`, `role`) in every part's JSX — read directly, not inferred.
- [x] `Stat.Trend`'s `labels` override merges with `mergeDefined`, not a plain object spread — `{ increase: () => "custom" }` alone still falls
  back to the real default for `decrease`/`flat` (tested).
- [x] No text-parsing/regex work here (nothing runs a pattern over untrusted length-unbounded text) — not applicable.
- [x] No console noise in production; no silent `catch`; nothing here has an invalid-combination case to warn about (`Stat.Trend`'s `value`
  is a plain number with no invalid state — `0` is a legitimate, meaningful "flat" value, not an error).
- [x] SSR/RSC safety — no `window`/`document`/`localStorage` access outside the `announce` effect, which only runs client-side via `useEffect`
  already.
- [x] Survives `StrictMode` — `announce`'s own remembered-text ref is cleared on unmount, the same pattern `EmptyState`'s `announced` ref uses,
  confirmed by a StrictMode test (mount → unmount → remount still announces a real later change, not a false "already seen").
- [x] Original implementation — Radix is not involved at all; the styling, API shape, and visual identity are this system's own.
- [x] Compound-component sub-part completeness — every sub-part (`Icon`/`Label`/`Value`/`Trend`/`Description`) has `forwardRef`, full JSDoc,
  and `className`/`style`/`id`/`data-testid`.
- [x] Atom-reuse audit — composes `Icon`, `Text`, and `VisuallyHidden` directly rather than re-implementing icon rendering, typography, or the
  status region.
- [x] A component providing context to its children (`StatSizeContext`) tested nested inside itself — an inner `Stat` at a different `size`
  keeps its own size, not the outer one's (tested, mirroring `EmptyState`'s identical check).
- [x] Consumed-atom defect handling — none surfaced; `Icon`, `Text`, and `VisuallyHidden` were used exactly as their own Finalized reviews left
  them, no workaround needed inside `Stat`.

## Feature completeness

- Label, value, trend (with a direction, a colour, and a `goodDirection` for metrics where less is better), an icon badge, and supporting
  description text — the full set the inventory's own one-line description names ("Metric + label + trend indicator"), plus the surface
  (`variant`), colour accent (`tone`), density (`size`), and layout (`orientation`) axes every comparable molecule in this system already has.
  `announce` covers the live-dashboard case a static metric display wouldn't need but a real one commonly does.
- Required/recommended props sensibly defaulted: every prop but `Stat.Value`'s and `Stat.Trend`'s own required `children`/`value` has a default;
  nothing is required to render *something* reasonable (an empty `Stat` with no children renders a bare, empty box, matching `EmptyState`'s and
  `Card`'s own "every part optional" philosophy).
- Variant names (`ghost`/`outlined`/`filled`) and the tone/size scales are drawn from the existing shared vocabulary (`05` §2), not coined —
  checked against `Card`'s and `EmptyState`'s own unions before naming.

## Accessibility — verified, not assumed

- [x] ARIA correct for the actual role: `Stat` itself adds none (static content); `Stat.Icon` is `aria-hidden` unless given a `label`;
  `Stat.Trend` is `role="img"` with an `aria-label` that states the direction in words and always contains the same formatted text shown on
  screen (WCAG 2.5.3), confirmed for the default formatter and for a custom `formatNumber`/`labels` override.
- [x] Keyboard navigation — not applicable; nothing here is focusable or interactive.
- [x] jest-axe clean: the default composition, an announcing status region, a labelled region, every variant, both orientations, every tone.
  **Real finding, fixed the same pass, not a later follow-up:** the very first version had `aria-label` directly on `Stat.Trend`'s plain
  `<span>` with no role — axe's `aria-prohibited-attr` failed immediately (a `<span>` has no role that permits `aria-label`); fixed by adding
  `role="img"`, verified clean afterward.
- [x] Any new colour pairing — none. `Stat.Trend`'s success/danger/secondary text and icon colours, and the tone badge's colours, are all
  already-verified tokens (`03-token-system-spec.md`), reused as-is.
- [x] Cross-part ARIA/id wiring — `Stat` doesn't automatically wire `Stat.Label` to the root; unlike `FormField`'s exact shape (a label naming
  a single control), a stat's own label and value are read in plain DOM order by a linear screen-reader pass with nothing to mismatch, and the
  root's own `aria-label`/`aria-labelledby` escape hatches (mirroring `EmptyState`'s) cover the case where an explicit region name is wanted.
- [x] Composed tab order — not applicable; nothing here is in the tab order at all.
- [x] Responsive/measured collapse never removing a focused control — not applicable; nothing here is ever removed based on available space.
- [x] Live region announces a change, never a first appearance — the actual design decision documented above (`Pagination`'s pattern, not
  `EmptyState`'s), verified by a dedicated test: the very first value shown produces an empty status region even after the announce delay
  elapses, and only a later, different value triggers a real announcement.
- [x] Every interactive target at least 24×24px — not applicable; nothing here is interactive.
- [x] A list with markers removed states `role="list"`/`role="listitem"` — not applicable; `Stat` renders no list.

## Responsiveness

- [x] Correct across the breakpoint scale — a `Stat` tile has no breakpoint-specific behaviour of its own (unlike `Tabs`' overflow or
  `EmptyState`'s two-large-sizes padding step); it's sized entirely by its own `size` prop and the width its container gives it. Verified at
  narrow widths that `Stat.Value` doesn't wrap or overflow visibly in the demo grids' own narrowest realistic column.

## Design quality

- [x] Visual execution: a tinted icon badge, a muted label, a bold large value with `tabular-nums`, and a colour-and-icon-coded trend beside it
  — reads as a deliberate, premium metric display, not a generic default. Entirely within the existing token set; no new token needed.
- [x] Text that changes never resizes neighbouring content — `Stat.Value`'s `font-variant-numeric: tabular-nums` keeps each digit a fixed
  width, confirmed live: the announce demo's value changes from `12,480` to `12,716` (same digit count) and separately would keep the trend's
  own position stable across a digit-count change too, since the number itself doesn't reflow character-by-character.
- [x] **Real defect, found only by looking at a live screenshot, not by any measurement-based test:** `Stat.Value`'s shared `overflow-wrap:
  anywhere` rule (copied from `EmptyState`'s title/description, which are prose) broke `"12,480"` across two lines as `"12,48"`/`"0"` in a
  narrow demo grid column — a measurement-based test couldn't have caught this, since the geometry was exactly as specified, it just specified
  the wrong thing for a number. Fixed by removing `overflow-wrap`/wrapping from `.value` entirely: a metric now overflows its container rather
  than breaking mid-digit, and the demo grid was confirmed clean afterward at a realistic (wider) viewport, where the original narrow reading
  was actually just the browser pane's own width, not a real defect at typical screen sizes.
- [x] Micro-interactions — none needed; a stat is inert display content, matching `Divider`'s own "not every component needs one."
- [x] Performance — no memoization needed (cheap render, no expensive computation); tree-shaking intact (no barrel re-exports); CSS uses no
  layout-triggering transitions.
- [x] Scalability — composition over configuration: five named sub-parts rather than one component with a long flag list, the same shape
  `Card`/`EmptyState` already use for a comparable amount of optional content.

## Theming

- [x] Confirmed working in both light and dark mode and both brand themes (Purple/Emerald) — verified live via the Storybook toolbar toggles,
  not inferred: the icon badge's tint, the trend's success/danger/secondary colours, and the outlined/filled surfaces all read correctly in a
  dark, `emerald-dark`-themed canvas (screenshotted).

## Storybook documentation

- [x] Docs page (`Stat.mdx`) follows the full section template (`07-storybook-and-documentation-standards.md` §4): Intro, Playground,
  Properties (root plus one subsection per sub-part, via a hidden docs-only stories file per ADR-0013), Variants/states gallery, Usage
  guidelines, Best practices, Accessibility, Code examples, Design tokens used, Related components.
- [x] Properties section's native-attribute disclaimer sentence is worded per element (`<div>` for the root/icon, `<p>` for
  label/value/description, `<span>` for trend) rather than one fixed phrasing.
- [x] Code examples include a genuine native prop in use (`title`/`onMouseEnter` on the root, matching the disclaimer's own named examples).
- [x] "Design tokens used" table checked by hand against `Stat.module.css` and the atoms it composes (Icon's tone classes, Text's colour
  props) — no automated `*.docs.test.ts` guard yet (that convention started with `CodeBlock`, 2026-09-26, and hasn't been backfilled onto every
  earlier component; a fair candidate for that backfill pass, not done here).
- [x] Properties table prop order set via each `PropertiesTable`'s own `order` array, not left to docgen's default.
- [x] Playground story exists, first after Intro, every prop live (`variant`, `tone`, `size`, `orientation`, `announce`, plus a
  Storybook-only `trend` toggle for the demo).
- [x] Every visible story's "Show code" is a hand-written, pasteable snippet from `Stat.snippets.ts`, typechecked by the generic
  `import.meta.glob`-based mechanism in `storySnippets.test.ts` (no per-component registration needed for the static snippets — only the
  Playground's dynamic snippet-builder function, `statPlaygroundSnippet`, needed its own explicit tests, mirroring every other component's
  Playground snippet function).
- [x] Every prop's Storybook control is genuinely interactive; every story's Controls panel actually drives its canvas (checked live, not
  assumed from the code) — confirmed for the Playground and every fixed-render gallery story's own args.
- [x] Sidebar `title` (`Molecules/Data Display/Stat`) matches the category taxonomy.

## Real defects found while building (each has a test that fails without the fix)

1. **`aria-label` on `Stat.Trend`'s plain `<span>` is invalid ARIA.** No role permits `aria-label` on a bare `<span>`; jest-axe's
   `aria-prohibited-attr` failed immediately. **Fix:** `role="img"`, the same technique `Avatar` already uses for a composite visual with no
   other applicable role. Every accessibility test now passes, including a dedicated `toHaveAccessibleName` assertion per direction.
2. **The announced text for a value with a trend read the trend's own text twice.** `Stat.Trend` usually nests inside `Stat.Value`, so its
   formatted number is already part of the value's own `textContent` — announcing both the value's raw text and the trend's separate
   accessible label read `"13,188+1.9, Increased by +1.9"` in a real browser (found by clicking the live-update demo's own button and reading
   the status region, not by unit test — the unit tests at the time didn't have a trend nested inside the announced value). **Fix:** read each
   `Stat.Value`'s own text from a clone with any nested `[data-stat-trend-label]` element removed first, then append that label once,
   separately. A new unit test (`"does not read the trend's own text twice..."`) locks in the correct, de-duplicated phrasing and asserts each
   piece of text appears exactly once.
3. **`Stat.Value`'s digits broke across two lines in a narrow grid column.** See "Design quality" above — `overflow-wrap: anywhere`, appropriate
   for prose (`EmptyState`'s title/description), was wrong for a number. **Fix:** removed from `.value`; it neither wraps nor breaks now.

## Functional verification

- [x] Component functions correctly end to end — exercised live in a real browser (Playground, every gallery story, the live-update demo's
  actual click), not just read.
- [x] What jsdom can't evaluate tested in a real browser: the CSS Grid `horizontal` orientation (the icon spanning every row of the content
  column, confirmed via screenshot, not just that the grid classes were applied); the announce timing (filled ~300ms after a real click, not
  immediately and not still empty after it — confirmed by direct DOM inspection in the live page, catching defect 2 above); dark mode and the
  Emerald brand theme's computed colours.
- [x] Measured the content, not just the box around it — `Stat.Trend`'s baseline alignment against `Stat.Value`'s own number was checked by
  eye against a real screenshot (the value and the trend sit on a shared visual baseline), not inferred from the CSS declaration alone; the
  digit-wrap defect (finding 3) was itself only caught this way, exactly the "measure the content, don't trust a check that has never failed"
  rule (`06-engineering-standards.md` §9) — the geometry-only check (nothing here asserts pixel positions) would never have caught a bad
  line-break decision inside the text itself, only a screenshot could.
- [x] Unit tests (61) cover rendering, every prop, `Stat.Trend`'s direction/sentiment/`goodDirection`/`formatNumber`/`labels` logic, `announce`
  timing (including StrictMode), standard prop passthrough on every part, and jest-axe. Real-browser tests (17, across `Stat.stories.tsx` and
  the five sub-part docs-only story files) cover the same Playground/gallery/live-update surface a real reader would actually click through.
- [x] Self-verified before reporting done: `tsc --noEmit`, `eslint --max-warnings 0`, the full package's unit suite (4525 passing) and
  real-browser Storybook suite (853 passing), a production `build`, and the component bundle-size check (`Stat`: 2.63KB JS / 1.26KB CSS,
  comfortably within budget) — all re-run clean after every fix above, not just once at the start.

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **A sparkline or mini-chart inside `Stat`.** A real, concrete feature some comparable dashboard components include, but it's a genuinely
  separate rendering concern (likely its own small chart primitive) rather than a natural extension of this component's own five sub-parts —
  worth a dedicated look once there's a real need, not sketched in speculatively here.
- **A `StatGroup`/grid wrapper.** The Docs page's "Several, side by side" example uses a plain CSS grid (or the existing `Grid` molecule) —
  deliberately not a new dedicated wrapper component, since nothing about laying out several `Stat`s together needs behaviour beyond what
  `Grid` (or a bare CSS grid) already provides.
- **A loading/skeleton state.** `Skeleton` already exists as its own atom and composes naturally in `Stat.Value`'s place while data is
  loading; a dedicated `loading` prop on `Stat` itself would just be a thin, unnecessary wrapper around that composition.

## Follow-up (2026-09-27, at explicit direction) — label size, orientation restructured, tone-aware variants

Four requested changes, asked about first where the request left real ambiguity (`AskUserQuestion`, twice — once for four API-shape questions,
once more for what happens to the icon badge specifically once its own visual treatment was clearly going to change), then built:

1. **`Stat.Label` three size steps larger.** `xs→md, sm→lg, md→lg, lg→xl, xl→xl` (was `xs→xs, sm→sm, md→sm, lg→base, xl→base`). Split into its
   own `labelSize` table, separate from a new `descriptionSize` table holding the *old* values — `Stat.Description` was never asked to change,
   and the two had only ever coincidentally shared one table, not a reason to move together.
2. **`orientation` no longer means "the icon sits beside everything."** It now means "the icon and `Stat.Label` are paired into one row instead
   of stacking" — nothing else about the layout changes. This replaces the two-column CSS grid the original build used (icon spanning every row
   of a second column) entirely; `Stat`'s root is now a single flex column in both orientations. `Stat.tsx` finds `Stat.Icon`/`Stat.Label`
   among `children` (`Children.toArray` + `isValidElement` + a type check — the same pattern `Stack` already uses for inserting a divider
   between items) and moves the pair, icon first, ahead of everything else, regardless of the order they were written in or what sits between
   them — asked and confirmed, rather than assumed, including that this needed no new prop or sub-component for the caller to write.
3. **The icon matches `Stat.Label`'s own font size in the paired row, dropping its circular badge entirely.** Asked and confirmed
   specifically: keeping a badge and just shrinking it (a small tinted dot) was the explicit alternative rejected. The row's own `font-size` is
   set inline from the exact value driving `Stat.Label`'s size (`var(--dbm-font-size-${labelSize[size]})`) — not a second, parallel table in
   CSS that could drift from the one in `Stat.tsx` — and the icon (and its now-transparent, unpadded badge box) is sized `1em` against it in
   `Stat.module.css`, so the two can never disagree. The icon's own colour there is deliberately `--stat-icon-subtle-color` (the same value a
   plain ghost/outlined badge already uses), not whatever `--stat-badge-color` happens to be — `filled`'s own solid-fill treatment doesn't
   apply once there's no fill left to read against.
4. **Every variant now colours `Stat.Icon` and `Stat.Label` by `tone`, not just the icon badge.** `ghost`/`outlined` tint the badge and colour
   the label the same way they already tinted the badge; `outlined` additionally tints its border (`border.{tone}-subtle`, a decorative accent
   like every other `*-subtle` border in this system, not bound by the 3:1 floor); `filled` tints the *whole stat* (`bg.{tone}-subtle`, in
   place of the previous unconditional `bg.neutral-subtle`) and turns the badge into a *solid* fill (`bg.{tone}`) read against with the matching
   `icon.on-{tone}` token, rather than the light one the other two variants use — the same solid/on-tone pairing `Alert.Action` already
   established. `neutral` (no tone class rendered) keeps every one of today's existing defaults exactly — checked, not assumed, since it's the
   only tone with no dedicated CSS class to layer these onto. No new token: every value reused is already contrast-verified in
   `03-token-system-spec.md`.

**A real defect, caught only by measuring computed style live, not by any of the new unit tests:** the first version of `filled`'s own
per-tone rule set the badge's solid fill and its `icon.on-{tone}` colour, but never the *whole stat's* own light fill — `--stat-bg` stayed
`bg.neutral-subtle` regardless of `tone`. `filled`+`tone="danger"` read `rgb(250, 250, 251)` (`bg.neutral-subtle`, a near-white grey) where
`bg.danger-subtle` (a visibly pink tint) was expected — invisible in a screenshot at normal viewing size, caught by reading the actual computed
`backgroundColor` in the browser and comparing it against the intended token, the same way the announce-text duplication defect was caught in
the original build. Fixed by adding the missing `--stat-bg` line to each of the five `.filled.toneX` rules; a new real-browser regression test
(`ToneAcrossVariantsInteraction`) now asserts every one of the nine colour values this follow-up touches (badge fill/colour, label colour,
border colour, and the whole stat's own fill, across `ghost`/`outlined`/`filled`) against the literal token it should resolve to, not just that
a CSS class was applied — confirmed to actually fail without the fix before confirming it passes with it.

**`Stat.Label`'s own colour no longer comes from `Text`'s `color` prop at all** (previously hardcoded to `"tertiary"`) — a same-specificity
class from `Text`'s own default would otherwise win or lose against this file's own override depending on build/file order alone, the exact
fragile case `05-component-api-conventions.md`'s "spread props before computed attributes" rule warns about one level up the stack from. Fixed
with `p.label { color: var(--stat-label-color) }` — the extra element-type selector gives it reliably higher specificity than any single
`Text`-applied colour class, regardless of order.

Re-verified: `tsc`, `eslint`, the whole package's unit suite (4534 passing, +9 new/updated) and real-browser suite (855 passing, +1 new), a
production `build`, the bundle-size check (`Stat`: 2.82KB JS / 1.36KB CSS), and a live check of every gallery story (Playground, Orientation,
Tones, the new Tone-across-variants gallery) in both light and dark mode.

## Follow-up (2026-09-27, at explicit direction, same day) — label size pulled back down, uppercase by default

Two more requested changes, on top of the follow-up above:

1. **`Stat.Label` pulled back down one size step.** `xs→base, sm→md, md→md, lg→lg, xl→lg` (was `xs→md, sm→lg, md→lg, lg→xl, xl→xl` from
   the follow-up above — net two steps up from `Stat.Description`'s table now, not three). Applies identically in both orientations, since
   `labelSize` is the one table both read from. The icon in `orientation="horizontal"` needed no separate change: it was already sized `1em`
   against the row's own inline `font-size`, itself set from this same `labelSize` lookup, so it shrinks with the label automatically —
   confirmed live rather than assumed, since "the icon should follow" was the explicit ask.
2. **`Stat.Label` is uppercase by default.** A CSS default (`text-transform: uppercase` on `p.label` in `Stat.module.css`), not a new prop —
   asked for specifically ("developers can override the style if they want using style prop"), so the override path is `Stat.Label`'s
   existing `style` prop (e.g. `style={{ textTransform: "none" }}`), which as an inline style always wins over a class regardless of order,
   the same reasoning already applied to `p.label`'s own colour rule above. No new prop, no new token.

While touching this area, corrected several sentences in `Stat.mdx` left stale by the *first* 2026-09-27 follow-up above (tone colouring
`Stat.Label` too, not just `Stat.Icon`) — the intro copy, `Stat.Label`'s own properties-table description, and two Accessibility-tab bullets
still said `tone` "only tints the icon badge," contradicting the "All tones"/"Tone across variants" sections a few screens below in the same
file. Left the token-row list (`## Tokens`) as found — it's missing rows for `text.{tone}`, `border.{tone}-subtle`, the solid `bg.{tone}`/
`icon.on-{tone}` pair, and `bg.neutral`, all real tokens this component uses since the tone-aware-variants follow-up — a real gap, but a
separate, larger audit (verifying each one measured in all four themes, this system's own bar for a token row) than this two-item request
justified opening up; flagged here rather than fixed inline or silently left unmentioned.

Re-verified: `tsc`, `eslint`, the whole package's unit suite (4536 passing, +2 new: the uppercase default and its `style`-prop override), the
whole package's real-browser suite (855 passing, unchanged — no new interaction test was needed, since the existing
`ToneAcrossVariantsInteraction` computed-style assertions don't pin an exact label font size), a production `build`, and a live check of the
Orientation, Tone-across-variants and Docs pages in both light and dark mode.

## Follow-up (2026-09-27, at explicit direction, third same-day round) — label size down again, medium weight

Two more small changes, on top of both follow-ups above:

1. **`Stat.Label` pulled back down one more size step.** `xs→sm, sm→base, md→base, lg→md, xl→md` (was `xs→base, sm→md, md→md, lg→lg, xl→lg`
   — one step up from `Stat.Description`'s table now, not two). Same table both orientations read, so the icon in
   `orientation="horizontal"` shrinks with it automatically, same as the previous size follow-up.
2. **`Stat.Label` is medium weight by default**, up from `Text`'s own `regular` default (`Stat.Label` previously left `weight` unset
   entirely). A `weight="medium"` prop passed to the underlying `Text`, not a CSS override like uppercase — `Stat.module.css` has no
   font-weight rule for `.label`, so there's no specificity concern here the way there is for colour and `text-transform`. Overridable the
   same way as uppercase: `Stat.Label`'s own `style` prop (e.g. `style={{ fontWeight: "var(--dbm-font-weight-regular)" }}`), which as an
   inline style still wins over `Text`'s own weight class regardless of order — `weight` itself isn't a `Stat.Label` prop (`StatLabelProps`
   only extends native `<p>` attributes, not `Text`'s own props), so `style` is the one override path for both together.

Re-verified: `tsc`, `eslint`, the whole package's unit suite (4537 passing, +1 new: the medium-weight-by-default assertion), the whole
package's real-browser suite (855 passing, unchanged), a production `build`, and a live check of the Orientation and Tone-across-variants
stories in light mode.

## Final review before Finalizing (2026-09-27)

A last full pass across the whole `06-engineering-standards.md` §9 checklist before the user's own Finalized declaration — re-verifying the
original build's findings still hold after all three same-day follow-ups above (label size moved three times net, weight, uppercase,
orientation restructured, every variant made tone-aware), not just re-reading the original checklist as still true by assumption.

**Two real findings, both fixed:**

1. **The Docs page's "Design tokens used" table was significantly out of date with the stylesheet — the exact gap the original build review
   flagged as "a fair candidate for backfill, not done here."** The tone-aware-variants follow-up added roughly a dozen tokens to
   `Stat.module.css` (the five `bg.{tone}` solid fills and `icon.on-{tone}` pairs for `filled`, five `border.{tone}-subtle` borders for
   `outlined`, `text.brand`/`text.info`/`text.warning` for the label) without updating the table, and one row (`bg.surface`) named a token the
   stylesheet has never actually referenced. Also missing: `font-weight.medium`/`font-weight.bold` (applied via `Stat.Label`/`Value`/`Trend`'s
   own `weight` prop, not a CSS custom property, but still a real token this component's rendered output depends on — the sitewide convention,
   confirmed against `Text.mdx`/`Heading.mdx`/six other components, is to list these even when set through a prop rather than CSS). **Fixed:**
   every token the stylesheet declares now has a row, `bg.surface`'s bogus row is gone, and the `space.*`/`font-size.*` ranges were split into
   individual per-step rows (matching `CodeBlock.mdx`'s own convention) so each one is checkable. **Closed the gap for good, not just this once:**
   added `Stat.docs.test.ts`, the same drift guard `CodeBlock.docs.test.ts` established (2026-09-26) — it reads `Stat.module.css` and `Stat.mdx`
   and fails per-token if the stylesheet ever references a `--dbm-*` custom property with no matching `<TokenRow>`. It can't see the
   prop-driven font-size/icon-size/font-weight tokens (nothing in the CSS file names them), so those stay hand-verified, same as before.
2. **`StatProps.tone`'s own inline JSDoc was stale, contradicting the accurate type-level `StatTone` doc two lines above it and the component's
   actual current behaviour.** It still read "A colour accent for `Stat.Icon`'s badge" — true when originally written, wrong since the
   tone-aware-variants follow-up made `tone` colour `Stat.Label` (and the border/fill per variant) too. Docgen pulls a prop's description from
   its own inline comment, not the type's, so this was the version an agent reading the generated Properties table would actually see. Fixed to
   match the type-level doc.

**Everything else re-verified, nothing else changed:**

- **Properties tables' Default column** — checked live (not inferred from the `component:`-field shape alone, the exact lesson `Tabs`' own
  final review taught, 2026-09-22): `Stat.Trend`'s `goodDirection` correctly shows `'increase'` (an explicit `table.defaultValue.summary` was
  already set on all five sub-part story files when `Stat` was built, after that lesson was already recorded — the build didn't repeat the
  defect). `Stat.Icon`/`Label`/`Value`/`Description` have no props with a `@default` tag, so their all-empty Default columns are correct as-is,
  not a symptom of the same bug.
- **Contrast** — no new pairing to check. `text.{tone}` on `bg.{tone}-subtle}` (the label on `filled`'s own fill) and `icon.on-{tone}` on solid
  `bg.{tone}` (the badge on `filled`) are both pre-verified, existing pairings (`03-token-system-spec.md`'s own per-token contrast rows;
  `icon.on-{tone}`'s own `$description` in the token source), not new work this component introduces.
- **Theming** — reconfirmed live in Purple/Light, Purple/Dark, and Emerald/Dark (`Tone across variants`, `Orientation`, `All sizes`,
  `Playground`): the smaller, medium-weight, uppercase label and the matching horizontal-orientation icon read correctly across all three.
- **Responsiveness** — reconfirmed at a 375px viewport: `Stat` still has no breakpoint-specific behaviour of its own (the original conclusion
  holds); `Stat.Label`'s own `overflow-wrap: anywhere` wraps "OPEN TICKETS" onto several lines in an artificially narrow demo column, which is
  the label's own designed prose-wrap behaviour (unlike `Stat.Value`, which deliberately never wraps), not a defect.
- **Design quality** — every step of the size scale (`xs`–`xl`) screenshotted fresh: the label reads clearly at its own new, smaller size next
  to the value at every step, proportional throughout, no cramping.
- **Playground controls** — `orientation`'s radio confirmed live to actually drive the canvas (icon moves from above the label to beside it),
  not just present in the Controls panel.
- **Full re-verification, run clean:** `eslint` and both `tsc --noEmit` passes; unit 89 files / 4,581 tests (+55, all from the new
  `Stat.docs.test.ts`); the real-Chromium Storybook project 114 files / 855 tests (unchanged — no interaction test needed new coverage); `tsup`
  build; the per-component bundle-size check (`Stat`: 2.82KB JS / 1.38KB CSS, within budget).

**Outcome:** two real gaps found and fixed (both documentation-accuracy defects, not behavioral ones — nothing about what `Stat` actually does
changed in this pass). Everything else on the checklist re-verified and still holds.

**Correction, same day: fixing finding 2 above (the `tone` JSDoc) didn't actually fix what the Docs page renders — a third, distinct copy of
the same stale text, caught only because the user asked to verify it live rather than trust the source edit.** `Stat.types.ts`'s JSDoc feeds
future tooling (the manifest generator), but the root Properties table itself renders `Stat.stories.tsx`'s own hand-written
`argTypes.tone.description` — a separate, manually-duplicated string, because the Playground meta has no traceable `component:` field for
docgen to extract from (the same reason Default-value extraction fails on a synthetic meta, established via `Tabs`). That copy still read "for
`Stat.Icon`'s badge" untouched. Checking the whole block while there found a second stale one already present: `orientation`'s description
still said "beside them," the pre-follow-up two-column-grid wording. Both fixed, and `StatLabel.stories.tsx`'s own `style` description (missing
the size/weight/uppercase-override note this session's other follow-ups added) — every other sub-part story file's descriptions checked and
were already accurate. **The lesson:** every root-level prop description lives in two places for this component (the type's JSDoc and the
Playground meta's hand-written `argTypes`), and only reading the rendered table — not the source file that was actually edited — proves a
docs fix landed. Re-verified live in the rendered DOM this time (not assumed from the diff): `tsc`, `eslint`, `Stat`'s own unit (126) and
real-browser (7) suites.

**Declared Finalized by the user, 2026-09-27.**

## `fitValue`, added after Finalized (2026-11-04)
Authorized by the maintainer. A value is `white-space: nowrap` at a fixed size per `size` step, so a number wider than its stat overflowed the border (found in the `AppShell` demo, where a currency amount ran out of a card in a grid whose columns follow the main area, not the window). **Additive: an opt-in `fitValue` prop on `Stat`, default off, so nothing that already existed renders differently** and `Stat` stays Finalized, with a scoped pass on the new surface.
- The value measures itself and shrinks by just enough to fit the stat's content box (its width less the padding and border), and grows back as the stat gets wider. Measured, not estimated: no guessed digit-width ratio, and it tracks the stat's own width, not the window's. One custom property (`--stat-value-fit`) scales the value's inline `font-size` from the full token size; set on the element, with no state and no render.
- The first pass runs before paint (so a value that does not fit is never drawn overflowing) and again after every render of the value; a `ResizeObserver` on the stat refits when its **width** changes. The refit waits a frame, because changing the height inside the observer's own callback makes the browser report a resize loop (found by the runner's log). A trend beside the number keeps its own size, so the width is a line in the scale: the pass takes a proportional step and then a secant step, which settles it exactly.
- **Found while writing it:** the value cannot read the stat's element through a ref the stat sets, because a child's layout effect runs before its parent's ref is attached (the unit test failed on mount). It finds the stat with `closest`, as `announce` already does.
- A consumer's own `font-size` in `style` wins; a stat with no room at all (a hidden one) is left alone.
- Checks: 9 unit tests (layout stubbed, jsdom has none), 4 hidden real-browser checks (every width from 7rem to a roomy box keeps the value inside its border and no larger than at the next width up; fit off still overflows; every `size` with a trend; it grows back and shrinks again as the box is dragged), and the break-once proof (the fit not applied, no refit on resize, and the full size not restored before measuring each failed a check).
- Not verified: a very long value at `xl` in a narrow stat in other browsers; Safari's and Firefox's layout of the inline-flex value; the scale reading in a right-to-left stat.

## Not verified

No real screen reader (VoiceOver, NVDA, JAWS) was run against it; `Stat.Trend`'s `role="img"` announcement and `announce`'s own status region
were checked through the accessibility tree and axe, and by reading the live DOM after a real click, not by listening to actual screen-reader
output. Right-to-left rendering was not separately checked with a real-browser test — `Stat` uses only logical CSS properties throughout (no
physical `left`/`right`), so it's expected to mirror correctly, but that expectation hasn't been confirmed the way `Tabs`' own RTL behaviour was.
