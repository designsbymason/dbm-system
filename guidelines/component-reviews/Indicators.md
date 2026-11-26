# Indicators — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-04. Findings included one confirmed,
serious contrast/accessibility bug (not just documentation completeness) — the inactive dot's fill
was effectively invisible against its own default background in every theme — plus the recurring
`{...props}`-ordering bug class and the standard documentation-visibility gaps.

**Fixed:**
- **The inactive dot's fill failed contrast catastrophically — a third instance of the exact
  unverified-token-reuse mistake `03-token-system-spec.md` already flags twice (`bg.skeleton`,
  `bg.track`).** `.dot` used `background-color: var(--dbm-bg-neutral-subtle)`, never verified for
  this use. Computed directly from `packages/tokens/src/primitive/color.json`'s real values against
  `bg.surface`: **≈1.04:1 in light mode, ≈1.40:1 in dark mode** — nowhere near the WCAG 1.4.11 3:1
  non-text floor a real interactive `<button>` needs to be perceivable. Unlike `bg.track` (an
  accepted exception for a *passive* progress indicator), these dots are genuinely interactive
  controls a user must be able to see to know slides exist and are clickable. Fixed by switching to
  `bg.neutral` (gray.600/gray.300) — the token spec's own table already documents this token as
  verified "dot vs `bg.surface`: 4.70:1 / 5.86:1 (dual-purpose: dot fill...)" at the time (dark
  figure since risen to 8.21:1 — `bg.surface` itself got darker in the 2026-09-06 darker-dark-mode
  retuning pass, only improving this pairing further; see `03-token-system-spec.md`'s current
  `bg.neutral` row), and it's already the
  token Avatar's status dot and Switch's track use for the identical role. Verified live in all 4
  brand/mode combinations (Purple/Emerald × Light/Dark) — dots are now clearly visible in every one.
- **`.dot:hover:not(.active)` colored a `background-color` from `border.neutral`** — a border-family
  token used for a background role, the same token-category-mismatch class just established for
  icon/text tokens (`05-component-api-conventions.md` §6). Now that the base fill is `bg.neutral`,
  hover uses its paired `bg.neutral-hover` instead of reaching into `border.*`.
- **Confirmed instance of the `{...props}`-ordering bug class (`05-component-api-conventions.md`
  §3):** `{...props}` was spread *after* the computed `role`/`aria-label` in the JSX. `role` isn't
  destructured out, so a consumer-passed `role` would have silently overridden the required
  `role="group"`, since later JSX attributes win. Fixed by moving `{...props}` before both computed
  attributes, matching Divider's/ProgressBar's/FieldError's already-fixed pattern. Regression test
  added.
- **`className`, `style`, `id`, `data-testid`, and `aria-label` weren't explicitly redeclared with
  JSDoc** on `IndicatorsProps` — the same established gap as Tag/Avatar/Switch. Added, matching the
  standard wording used elsewhere.
- **No dev-mode `console.warn` when `activeIndex` is outside `[0, count)`.** A plausible off-by-one
  from an external Carousel would silently produce a group where no dot matches `isActive`, leaving
  nothing in the tab order with zero signal to the developer. Added, following `ProgressBar`'s own
  warn-once-per-mount pattern (`hasWarnedOutOfRangeRef`).
- **No `size` prop.** *(Judgment — a named gap, not a blanket enhancement.)* Every other shipped
  visual atom (Avatar, Badge, Spinner, ProgressBar, Skeleton, Switch) exposes the standard
  `xs`–`xl` scale; Indicators hardcoded one fixed dot size regardless of context. Added a new
  component-layer token file (`component/indicators.json`, `indicators.size.{xs,sm,md,lg,xl}` =
  4/6/8/10/12px — following the same reasoning as Avatar's/Badge's/IconButton's own component-layer
  tokens: 3 of 5 steps land on the primitive spacing scale, 2 don't, so a dedicated scale was created
  rather than distorting the shared one). `md` (8px) matches the original hardcoded diameter exactly,
  so existing usage with no `size` prop is visually unchanged. The active dot's pill width derives
  from the diameter via `calc(var(--dot-size) * 3)` rather than a second token family, preserving the
  original 8px/24px ratio at every step.
- **No Playground story existed** — added, with `count`/`size`/`aria-label` genuinely live via
  `args`/`argTypes`. `activeIndex`/`onIndexChange` are wired through local Storybook-demo state
  (there's no uncontrolled variant to lean on, unlike Switch's `defaultChecked`-based Playground) so
  clicking/arrow-keying a dot in the canvas actually moves the position. `GallerySize` was renamed to
  `ManySlides` and converted from a fully-hardcoded `render` (which would have silently ignored the
  new shared Controls panel — the "render ignoring args" bug class) to one that still spreads `args`
  for `count`/`size`/`aria-label` while only hardcoding the genuinely non-controllable `getLabel`. A
  new `AllSizes` gallery story was added for the size scale, with only `size` itself suppressed from
  its Controls panel per the multi-instance-grid convention.
- Docs page (`Indicators.mdx`) built to the full template — visually verified section by section in
  a running Storybook instance (Playground live-control check including the `size` control, the
  Properties table's full prop list with no empty rows, both variant galleries, both Do/Don't
  Callouts, the Accessibility Callout, live token swatches for `bg.neutral`/`bg.neutral-hover`/
  `bg.brand` in the Design tokens section, and both RelatedCards — Icon, Image), confirmed across
  Purple/Emerald × Light/Dark.

Tests: 21 → 25 (added: the `role`-override regression test, default/custom `size`-class coverage,
and the out-of-range `activeIndex` dev-warning pair).

Self-verified: `pnpm build` on `@dbm-system/tokens` (new `--dbm-indicators-size-*` CSS vars
confirmed in `component-tokens.css`), `tsc --noEmit` (both the package and `.storybook`),
`eslint --max-warnings 0`, full Vitest suite (918 tests package-wide), and a real `tsup` package
build.

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own; awaiting that
confirmation before this entry (and `07-storybook-and-documentation-standards.md` §6's status table)
records a Finalized date.

**Follow-up, same day (2026-09-04), at explicit direction:** the inactive dot's fill (`bg.neutral`,
chosen above to fix the original contrast bug) read as visually too dark. Asked before changing it,
since the literal request — `bg.track`/`bg.track-hover` — would have reintroduced the same class of
bug this review had just fixed: `bg.track` is explicitly documented (`03-token-system-spec.md`) as a
deliberate exception that *fails* the WCAG 1.4.11 3:1 non-text floor (1.14:1 light / 1.40:1 dark
against `bg.surface`), accepted only for a passive, non-interactive indicator like `ProgressBar`'s
track — not for a real, clickable `<button>` a user needs to perceive. `bg.track-hover` also doesn't
exist as a token. Landed instead on `bg.track-strong` (gray.500/gray.400, 3.25:1/4.34:1 — already
documented in the token spec as intended for exactly this case: "used where the boundary must read
as real, e.g. `Switch`'s always-interactive track") for the base fill, with `bg.neutral` itself
reused as the hover state (one step more prominent, already verified, no new token needed). Updated:
`Indicators.module.css` (`.dot`/`.dot:hover`), `Indicators.mdx` (Accessibility bullet + both
`TokenRow` entries), and `03-token-system-spec.md`'s `bg.neutral`/`bg.track-strong` rows. No prop,
type, or test changes — purely a color-value swap between two already-existing semantic tokens, so
none of the checklist sections beyond Theming/Design quality are affected. Re-verified visually
across Purple/Emerald × Light/Dark; `tsc`/`eslint`/full Vitest suite/`tsup` build all re-confirmed
clean.

**Follow-up, same day (2026-09-04), at explicit direction: added `orientation` prop
(`"horizontal" | "vertical"`, default `"horizontal"`).** Matches Divider's own already-established
`orientation` prop pattern (`05-component-api-conventions.md`), applied to a new component rather
than a new convention. More than a CSS flip, as flagged before starting:
- `.root.vertical` switches to `flex-direction: column`; the active dot's pill elongation swaps from
  `width` to `height` (`.root.vertical .active`), preserving the same 3x-diameter ratio on whichever
  axis is actually active. `.dot`'s transition list gained `height` alongside the existing
  `width`/`background-color` so the swap animates smoothly regardless of orientation.
- Keyboard: `ArrowDown`/`ArrowUp` replace `ArrowRight`/`ArrowLeft` when vertical — only the
  axis-matching pair responds (confirmed live: the non-matching pair is a genuine no-op, not just
  visually irrelevant), matching how other orientation-aware composite widgets behave. `Home`/`End`
  are unconditional in both orientations, unchanged.
- **A real, caught-by-testing correctness finding: `aria-orientation` is not a supported ARIA
  attribute on `role="group"`.** The initial implementation set `aria-orientation={orientation}`
  unconditionally (reasoning, in hindsight wrong, from Divider's own `aria-orientation` usage on
  `role="separator"`, a role that *does* support it) — caught immediately by the existing jest-axe
  test (`aria-allowed-attr` violation), not by manual inspection. Removed rather than switching to a
  role that does support it (`toolbar`, `tablist`) — neither accurately describes a plain group of
  navigation buttons, and `role="group"` is otherwise the correct, already-tested semantic. Orientation
  is conveyed through actual arrow-key behavior and visual layout instead; documented as a deliberate
  omission (with the "why") in the Docs page's Accessibility section rather than left unexplained.
- Docs page updated: intro paragraph, Playground description, a new "Vertical orientation" Variants
  entry, a Usage-guidelines Do bullet, the Accessibility section's keyboard bullet plus the new
  `aria-orientation`-omission bullet above, and a vertical code example. `propOrder` updated
  (`orientation` after `size`). New `Vertical` gallery story added (its own `args` override, live
  `count`/`size`/`aria-label` still controllable). `orientation` added to the Playground's
  `argTypes`/`args` as a `select` control.
- No token additions — `flex-direction`/pill-axis are layout mechanics, not values needing a design
  token.

Tests: 25 → 28 (added: default/vertical orientation-class coverage, a vertical-mode jest-axe check,
and the ArrowDown/Up-navigates-while-ArrowRight/Left-is-a-no-op pair — mirroring, not replacing, the
existing horizontal keyboard tests).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(923 tests package-wide), a real `tsup` build, and live Storybook verification — vertical layout,
click-to-navigate, ArrowDown/Up working, ArrowRight/Left confirmed as a no-op via the Actions panel
call count, and the Docs page's new/updated sections all rendering correctly.

**Follow-up, 2026-09-05, at explicit direction: added a progress label (`showLabel`/`formatLabel`).**
Raised first as a feature-completeness question alongside three other candidates (loop navigation —
already implemented via the existing modulo wraparound; auto-advance — declined, since it requires
internal timer state that contradicts the component's deliberate fully-controlled design and drags
in WCAG 2.2.2 pause/stop requirements that really belong to the not-yet-built `Carousel`; and a
dedicated spacing prop — declined, since `style`/`className` already override the gap today and a
first-class prop would mostly duplicate that escape hatch). Progress label was the one with a
direct, strong precedent: mirrors `ProgressBar`'s own `showValueLabel`/`formatValueLabel` shape
exactly (`showLabel?: boolean`, `formatLabel?: (activeIndex, count) => ReactNode`, defaulting to
`` `${activeIndex + 1}/${count}` ``), including the identical "provided without the boolean" dev-mode
warning pattern (`hasWarnedUnusedFormatRef`).
- **Structural change: the component now always renders an outer wrapper `<div>`** around the
  existing `role="group"` element, with the label as an optional sibling `<span>` inside it —
  matching `ProgressBar`'s own root/track split (ref, `className`, and `{...props}` all still target
  the inner group element, never the wrapper, so this is invisible to any existing consumer's props
  or the exposed `ref`). The wrapper renders unconditionally (not only when `showLabel` is set) to
  keep the component's DOM shape stable across a `showLabel` toggle, rather than switching structure
  based on a prop value — deliberate, matching `ProgressBar`'s own precedent, confirmed to have zero
  visual effect when no label is shown (a single-child flex container is invisible either way).
- Label styling (`text.primary`, `font-family.primary`, `font-size.xs`, `font-weight.semibold`,
  `font-variant-numeric: tabular-nums`) copied directly from `ProgressBar.module.css`'s own
  `.valueLabel`, including the not-`aria-hidden` accessibility choice (the label is real, readable
  text, not marked decorative — same reasoning `ProgressBar` already settled on for its own value
  label).
- Vertical orientation composes cleanly with no extra work: the wrapper reuses the same `.vertical`
  modifier class as the inner group (a shared CSS-module class matched by two separate compound
  selectors, `.wrapper.vertical` and `.root.vertical`), so the label automatically sits below the
  column instead of beside the row — confirmed live.
- Docs page updated: `propOrder` (`showLabel`/`formatLabel` after `getLabel`), Playground
  description, `PlaygroundControls`' `exclude` list (`formatLabel`, a function prop), a new "With
  progress label" Variants entry, Do/Don't bullets, an Accessibility bullet, a code example, and 4
  new `Design tokens used` rows for the label's typography. New `WithProgressLabel` gallery story;
  `showLabel` added to the Playground's `argTypes`/`args` as a real boolean control, `formatLabel`
  set to `control: false` (function prop).

Tests: 28 → 32 (added: default-hidden, default-format-renders-as-sibling-not-child, custom
`formatLabel`, a jest-axe check with the label shown, and the warn-once/no-warn pair for
`formatLabel` without `showLabel`).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(929 tests package-wide), a real `tsup` build, and live Storybook verification — the label rendering
correctly in both orientations, and the Docs page's Properties table/Variants/Design-tokens sections
all confirmed live.

**Follow-up, 2026-09-05, at explicit direction: added `variant` (`"dots" | "outline" | "bars"`,
default `"dots"`).** Raised first as a feature-completeness question — a third variant option
("progress-bar style," a continuous track+fill) was also considered and declined: it changes the
interaction model itself (no discrete per-slide click targets, a different ARIA pattern entirely —
`role="slider"`, not a button group), and the passive-display version of it already exists in the
system as `ProgressBar` (`value={activeIndex + 1}`, `max={count}`) with zero new code needed — see
this file's own note above for the full reasoning. `outline`/`bars` were chosen instead because both
keep the *exact* existing behavior (controlled `activeIndex`, roving-tabindex keyboard nav,
`role="group"`) and only change the dot's own rendering — matching `05-component-api-conventions.md`
§2's `variant` convention (`Button`/`Tag`'s own shape), not the multi-library comparison this project
usually reaches for first (no comparable production component library ships a standalone
"Indicators" component to compare against — the precedent here is the broader pagination-indicator pattern in the wild,
Swiper.js/Stories-style UIs, named honestly as a weaker citation than the usual sibling-library gap).
- **`outline`:** inactive dots render as a hollow ring (`border.neutral-strong`, transparent fill)
  instead of the default solid `bg.track-strong` fill; hover intensifies to `border.strong` — both
  tokens already verified elsewhere for the identical "outline/selected ring" role (`border.strong`'s
  own token description literally names "Tag's outline/selected-solid-neutral rings"). The active dot
  stays solid `bg.brand` with `border-color: transparent`, keeping box dimensions identical to
  inactive across the transition (the project's global `box-sizing: border-box` reset means the new
  border doesn't inflate `--dot-size`, confirmed live via computed style rather than assumed).
- **`bars`:** every dot renders at the same elongated dimension (`calc(--dot-size * 3)` on whichever
  axis `orientation` puts the row/column along) — a deliberate behavior change *within* the variant,
  not just color: the existing "active dot elongates" mechanic doesn't apply here, since all bars are
  already at that width/height; only `background-color` (`bg.track-strong`/`bg.neutral` hover/
  `bg.brand` active — the same three tokens `dots` already uses) distinguishes the active one. `.dot`'s
  own `radius: full` already applies unconditionally, so bars get the same rounded/stadium ends as
  the existing active pill for free, no new radius token needed.
- Both variants compose cleanly with `orientation="vertical"` and `showLabel` with no extra wiring —
  confirmed live for all combinations (`bars` + `vertical` swaps to `height: calc(...)`/`width: var(
  --dot-size)` via a `.root.bars.vertical` compound selector, mirroring the existing `.root.vertical
  .active` pattern).
- Docs page updated: `propOrder` (`variant` after `orientation`), intro paragraph, Playground
  description, a new "All variants" Variants entry (mirroring `AllSizes`' own multi-instance-grid
  story pattern — only `variant` itself has its Controls-panel control suppressed, per the standing
  convention for that story shape), Do bullets naming when to reach for each, an Accessibility
  contrast bullet for the outline ring, a `bars` code example, and 3 new `Design tokens used` rows
  (`border.neutral-strong`, `border.strong`, `border-width.1`) plus updated per-token usage notes
  clarifying which variant(s) each existing token now serves. New `AllVariants` gallery story;
  `variant` added to the Playground's `argTypes`/`args` as a real `select` control.

Tests: 32 → 38 (added: default/outline/bars class coverage, jest-axe checks for both new variants,
and a functional check that `bars` still marks `aria-current` and supports click/keyboard navigation
identically to `dots` — confirming the variant only changed rendering, not behavior).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(935 tests package-wide), a real `tsup` build, and live Storybook verification — computed styles
checked directly (not just visually) for both variants' resting/hover/active states in every
combination with `orientation`, confirming the exact token values rendered match what was specified
rather than assuming from the CSS source alone.

**Follow-up, 2026-09-05, at explicit direction: `bars` variant — inactive bars are now thinner than
the active bar.** Previously every bar (active and inactive) rendered at the identical thickness
(`--dot-size` on the cross axis), differing only by fill color. Changed so every inactive bar is half
that thickness (`calc(--dot-size * 0.5)`) while the active bar stays at full `--dot-size` — the active
step now reads as more prominent from shape alone, color aside, closer to how Stories-style UIs
typically treat their active segment.
- Implemented as `.root.bars .dot` (thin base, both axes set — `height` for horizontal, `width` for
  vertical via the parallel `.root.bars.vertical .dot` rule) plus a same-specificity `.active`
  override placed later in source order to win the tie (`.root.bars .active` / `.root.bars.vertical
  .active`) — the identical cascade mechanism `.root.vertical .active` already relies on for the
  dots/outline variants' own active-elongation, just one compound class deeper. Verified by reading
  actual computed `width`/`height` in the browser for all 4 orientation×active-state combinations
  (not inferred from the CSS source alone) — e.g. horizontal `md`: inactive 24×4px, active 24×8px;
  vertical `md`: inactive 4×24px, active 8×24px.
- No new token — `0.5` is a calc() multiplier on the existing `--dot-size` custom property, matching
  the same pattern already established for the `3` (active elongation) and `4`/`0.5` (this fix)
  multipliers rather than requiring a new component-layer token step for a value that's a strict
  proportion of one that already exists.
- Docs page updated: intro paragraph and `IndicatorsProps`' own `variant` JSDoc (`bars` no longer
  described as "distinguished only by fill color"), and the story file's own `argTypes.variant`
  description, kept in sync with the JSDoc per the standing convention that both need to independently
  state the truth (docgen doesn't read one from the other).

No test changes — the existing `bars` functional test (`aria-current`, click/keyboard nav) and the
jest-axe check both already covered this variant generically; this was a pure CSS geometry change
with no new branchable behavior to assert beyond what computed-style inspection already confirmed
live.

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(935 tests package-wide, unchanged count), a real `tsup` build, and live Storybook verification with
direct computed-style reads confirming the exact pixel values above.

**Follow-up, 2026-09-05, two real bugs reported by the user in the `bars` variant — both root-caused
by live measurement (`getBoundingClientRect`, sampled through actual transitions), not guessed at
from reading the CSS.**

1. **Horizontal `bars`: the whole component visibly shifted down the first time activation moved
   away from index 0, never again afterward.** Root cause: `.wrapper`/`.root` are `display:
   inline-flex`, which defaults to `vertical-align: baseline` for how the box sits in its *own*
   parent's line — and a flex container's baseline is specifically derived from its *first* in-flow
   flex item. In horizontal `bars` mode, dot 0's own height changes (8px active → 4px inactive) the
   first time it stops being active, which shifts `.root`'s (and thus `.wrapper`'s) baseline, which
   shifts where the whole component sits in its parent. Once dot 0 is inactive, its height never
   changes again — hence a one-time shift, never repeating on subsequent clicks between any other
   pair of indices. Confirmed by measuring `getBoundingClientRect().top` directly: `47.5` → `49.5`
   after the first index-0 departure, then stable at `49.5` for every later transition. This
   generalizes beyond `bars`: vertical `dots`/`outline` has the identical latent issue (the active
   dot's height *does* change there too, 8px inactive → 24px active) even though it wasn't the one
   reported — the fix below is applied unconditionally, not scoped to `bars`, so it's covered too.
   **Fix:** `vertical-align: middle` on `.wrapper` — removes the dependency on any child's content
   baseline entirely, regardless of which variant/orientation/index is involved.
2. **Vertical `bars`: a brief left-right "shake" on every activation change, self-correcting back to
   the original position.** Different root cause, specific to `bars`: `.root`'s cross-axis size
   (width, in vertical/column mode) is intrinsic — "max of all children." During the CSS transition,
   the outgoing active bar's thickness shrinks (8→4px) while the incoming one grows (4→8px)
   simultaneously; since these are symmetric and cross paths, at the transition's midpoint *both* sit
   around 6px — briefly making the intrinsic max less than the settled 8px, so the container visibly
   narrows then widens again as the transition completes. Confirmed by sampling
   `getBoundingClientRect()` every 15ms through an entire transition. Only `bars` is affected: for
   `dots`/`outline`, the changing dimension is the *main* axis (elongation), which is sum-based, not
   max-based — exactly one item is always elongated at any instant, so the sum never fluctuates
   regardless of which one it is. **Fix:** lock `.root`'s cross-axis size explicitly to the full
   `--dot-size` for the `bars` variant (`.root.bars { height: ... }` for horizontal, `.root.bars.
   vertical { width: ...; height: auto }` for vertical) instead of leaving it to intrinsic sizing —
   the settled value is unchanged in every case (it already equaled `--dot-size` at rest), only the
   never-fluctuates-mid-transition guarantee is new.

Both fixes verified live via direct `getBoundingClientRect` reads (not just visual inspection): the
horizontal shift is gone (`top` identical across a baseline read, a click to index 1, and a further
click to index 3); the vertical width is sampled at 15ms intervals across an entire transition and
never moves off 8px. Two new regression tests added (`toHaveStyle` checks on `vertical-align` and the
locked cross-axis size) — genuine layout/geometry can't be asserted in jsdom (no real layout engine,
`getBoundingClientRect` always returns zeros there), but the underlying CSS declarations that *cause*
the fix can be, and were confirmed to actually resolve correctly rather than assumed from source.

Tests: 38 → 41 (three regression tests: wrapper `vertical-align`, bars horizontal cross-axis lock,
bars vertical cross-axis lock).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(938 tests package-wide), a real `tsup` build, and live browser reproduction of both original bugs
followed by direct measurement confirming both are resolved.

**Final review pass, 2026-09-05, ahead of a Finalized decision — re-ran the full
`06-engineering-standards.md` §9 checklist end to end against the component's current, accumulated
state** (five follow-ups deep since the original 2026-09-04 pass), rather than assuming everything
already checked once still holds.

**Fixed:**
- **No `play`-function interaction story existed anywhere in `Indicators.stories.tsx`.** A real,
  required gap per `07-storybook-and-documentation-standards.md` §2/§5 ("every interactive component
  gets at least one `play`-function story") and never added across any of the five prior passes on
  this component. Added `KeyboardInteraction` — a stateful story (fully-controlled components need
  their own local state to demonstrate real behavior, same pattern as `Playground`) whose `play`
  function clicks a non-adjacent dot, asserts `aria-current`/`onIndexChange` and the roving-tabindex
  swap, then arrow-key-navigates from there and asserts focus follows. Verified for real via
  `pnpm test:storybook` (the actual Vitest-browser runner that executes `play` functions, not just
  `tsc`/lint) — 327/327 storybook tests passing, this one included.

**Checked, found already correct (no change needed):**
- **Theming across all 4 brand/mode combinations for `outline`/`bars`** — both variants were only
  ever screenshotted in Purple/Light during their own review. Explicitly checked Purple/Dark,
  Emerald/Light, and Emerald/Dark live: the outline ring, its hover state, and the bars' thickness
  contrast all render correctly and visibly in every combination.
- **A "kitchen sink" combination never tested before** — `orientation="vertical"` + `variant="outline"`
  + `showLabel` together. Confirmed live via computed style: outline ring colors correct on the
  column, active dot solid, progress label renders as a sibling with the right text — no interaction
  bugs from combining three independently-shipped features.
- Full baseline-correctness re-verification (definition of done, prop patterns, `{...props}` ordering,
  zero hardcoded values, SSR safety, exported from `index.ts`, no `any`/suppressions) — all still hold
  exactly as the original pass left them; nothing regressed across the five follow-ups.

**Noted, not changed (a real tradeoff, not a defect):** `.dot`'s transitions animate `width`/`height`,
which `06-engineering-standards.md` §4 names as layout-triggering properties to avoid in favor of
`transform`/`opacity` where possible. This is, in hindsight, the underlying reason the two geometry
bugs above were even possible — a `transform: scale()`-based implementation would never have needed
the container's own intrinsic size to fluctuate in the first place. Not changed here: switching to
transform-based sizing is a real redesign (distorts `border-radius` under non-uniform scale, needs a
fixed-size box plus a separately-transformed inner element, changes the actual click-target size
question along with it — WCAG 2.5.8 territory, a separate concern of its own), not a drop-in fix, and
the concrete symptoms it could have caused are already independently resolved by the two locked-
geometry fixes above. Worth knowing if `Indicators` is revisited for a performance pass later; not
blocking here.

Tests: 41 → still 41 unit tests (the new coverage is a Storybook `play`-function story, run via
`test:storybook`, not a `Indicators.test.tsx` addition).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest unit
suite (938 tests package-wide) and the Storybook interaction suite (`pnpm test:storybook`, 327 tests
including the new `play` function), a real `tsup` build, and live verification of every combination
named above across all 4 brand/mode themes.

**Review complete.** Every `06-engineering-standards.md` §9 checklist section re-verified against the
component's current state, one real required gap found and closed, two untested-but-fine combinations
confirmed, and one non-blocking architectural tradeoff surfaced and explained rather than silently
redesigned.

**Finalized 2026-09-05** — per `06-engineering-standards.md` §9's own note, don't make further changes
to Indicators (code, stories, docs, or its tokens) without asking first.

## Accepted: shared-token change dropped the inactive dot below the 3:1 floor (flagged 2026-09-15, accepted 2026-11-26)

**Accepted by the maintainer 2026-11-26 as an informed exception: the fill stays `bg.track-strong` (1.72:1 light, 3.00:1 dark against `bg.surface`).** The Docs page's Contrast note, which said the fill was verified at 3:1, was corrected the same day to state the measured values and the reasons the exception holds. The text below is the 2026-09-15 finding, kept as history.

`bg.track-strong` — the token this component's own inactive-dot fill uses, chosen above specifically
*because* it was the compliant (≥3:1) alternative for "a real, clickable dot a user needs to
perceive," unlike a passive track — was moved at explicit direction from `gray.500`/`gray.400`
(3.25:1/6.08:1 against `bg.surface`, both AA) to `gray.300`/`gray.600` (1.72:1/~3.00:1). The request
was scoped to freeing this token up now that `Switch` no longer consumes it (see
[ADR-0016](../adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md)), not a
request to re-examine `Indicators` itself — but `Indicators` is the token's only remaining consumer,
so the new value applies here regardless of intent behind the request.

**Live-verified the consequence, not just computed it:** the inactive dot is now visibly much
fainter against `bg.surface` (light mode) than before this change. Light mode (1.72:1) is a real drop
below the 3:1 floor this component's own review deliberately required; dark mode (~3.00:1) sits
right at the line, functionally unchanged in practice.

**Not fixed here** — per `06-engineering-standards.md` §9's finalized-component rule, this needs the
user's own explicit direction before any further change lands, and the fix isn't obvious without
knowing intent: options include reverting `bg.track-strong` for this consumer specifically, giving
`Indicators` its own dedicated token (decoupling it from whatever `Switch`/`Slider` no longer need),
or accepting the new fainter value as an intentional, informed exception the way `bg.track` itself
already is. Flagging rather than guessing.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the earlier atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: every panel was generated from a story that holds its position in its own `useState`, so they printed `activeIndex={1}` frozen and `onIndexChange={() => {}}`; "Many slides" printed `getLabel={() => {}}`, hiding the one thing it demonstrates; and "All variants" / "All sizes" ran to 38 and 58 lines of the same boilerplate. Every story now sets `parameters.docs.source.code` to a snippet from the new `Indicators.snippets.ts`, each naming the reader's state in a comment and wiring `activeIndex` / `onIndexChange` to it, with `getLabel`'s real body written out; the Playground, "Vertical orientation" and "With progress label" stories build theirs from the live controls. The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.


## Post-Finalization change (2026-09-21, at explicit direction) — `variant="outline"` renamed `variant="outlined"`

A survey of the system's variant values found `outline` (`Tag`, `Indicators`) and `outlined` (`Card`, `EmptyState`, `Pagination`); `outlined` was chosen as the single spelling and is now a
rule (`05-component-api-conventions.md` §2). `IndicatorsVariant` is now `"dots" | "outlined" | "bars"`. **Earlier entries in this file use the old spelling `outline`; they are history and
were not rewritten.** Everything named after the variant moved with it: the `.outline` CSS class (now `.outlined`), the stories' option lists, the Docs page prose and examples, and the tests. **Breaking for a consumer** (`variant="outline"` is no longer valid) — the package is unpublished (`0.0.0`), so no migration is needed yet.

Under the three-question test in `06-engineering-standards.md` §9 this is a preference change to already-compliant surface confined to the component's own files, so a **partial
re-finalization**: re-verified — types and JSDoc, stories and Docs page, tests, and rendering. Rendering is unchanged, and provably so: with the rename reversed, all seven files
are byte-identical to what was committed, so no logic, style, token or behaviour changed. Not re-run, because nothing they cover was touched: the contrast and theming checks and the
feature-completeness pass. A first pass missed nothing here; the two class selectors that pattern skipped were in `Tabs`, not `Indicators`.

## Post-Finalization follow-up (2026-11-17, at explicit direction) — target size (WCAG 2.5.8)

Found while writing `Carousel`'s target-size check, which measured the buttons only. Measured here in a real browser at every size and variant, the steps are 4 to 12 px across and
the centre-to-centre spacing between inactive steps is 12, 14, 16, 18 and 20 px for `dots` and `outlined` (`xs` to `xl`), and 20, 26, 32, 38 and 44 px for `bars`. The criterion's spacing
exception needs 24 px, so `dots` and `outlined` fail at every size and `bars` only at `xs` (the earlier note that every step failed was too broad for `bars`).

Chosen, at the maintainer's direction, over widening the spacing: the **equivalent-control exception**. Widening each step to 24 px (a gap of `space-6` minus the step) kept the rule but made
`xs`, `sm` and `md` dots read as separate specks (seen side by side in a real browser), and `md` is `Carousel`'s default; an invisible 24 px hit area on top of the old gaps would make each
step's area cover its neighbour's centre, so a press on one dot would reach the next. The function the dots give (reaching any slide) is also on `Carousel`'s previous and next buttons (drawn unless `controls="hidden"`), which are at
least 24 × 24 px. It is a reading of the criterion, not a change to the component: a carousel is covered while those buttons are drawn, and **a standalone `Indicators` is not**, so the
JSDoc and the Docs page say so (provide a previous and next button of your own, or use `bars` from `sm` up). No style, token, prop or behaviour changed: by question 1 of the three-question test
(`06-engineering-standards.md` §9) this is wording, so the component stays Finalized. `Carousel`'s hidden `Checks` group gained `IndicatorsHaveAnEquivalentControl`, which draws all three
indicator looks under all three placements of the buttons and requires both buttons to be there and at least 24 × 24 px; it fails when they are hidden.
