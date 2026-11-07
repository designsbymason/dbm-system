# Slider — Storybook/component review findings

**Inputs & Forms:** Slider — initial build + full `06-engineering-standards.md` §9 review checklist
worked through (2026-09-15), item 7 in the itemized molecule-tier build order
(`04-component-inventory.md`). **Finalized 2026-09-15**, declared by the user; value-label alignment
revised 2026-09-25 (re-verified: design quality, responsiveness, functional verification). This file
records what was built, checked and found, oldest first; the entries after the Finalize are dated.

**New dependency: `@radix-ui/react-slider` (^1.4.7).** The first molecule in this system wrapping a
genuinely compound Radix primitive with no prior atom precedent (`Switch`/`Checkbox` wrap a single
Radix element; `Select` is the only other compound-primitive wrap so far) — added following the
same incremental "add the Radix package the component actually needs" pattern already established
(e.g. `@radix-ui/react-checkbox`/`-switch`/`-tooltip`/`-collapsible`, `01-vision-and-goals.md` Phase
4.75).

**Design choices made without an explicit ask (flagging the reasoning, not a fork-in-the-road
architecture decision on the scale of `NumberInput`'s/`Radio`'s own ADRs):**

- **`value`/`defaultValue`/`onValueChange`/`onValueCommit` are all plain numbers, not the array the
  underlying Radix primitive uses internally.** Radix's own `Slider.Root` always works in terms of
  `number[]` (to support multiple thumbs), but this component is explicitly the *single*-value case
  per `04-component-inventory.md`'s own row ("Single value" — `RangeSlider`, the dual-handle case,
  is a separate future component, item 17). Converting to/from a one-element array internally keeps
  the public API honest about what this component actually is, the same reasoning `NumberInput`
  applied converting `Input`'s string domain to a real `number`.
- **`onValueCommit` exposed as a first-class, separate prop from `onValueChange`** — a genuine Radix
  feature (fires once, on release/a completed keyboard step, vs. `onValueChange`'s continuous firing
  while dragging) worth surfacing directly rather than only informally documenting, since it's the
  obvious answer to "how do I avoid firing an expensive operation on every pixel of drag movement."
  Confirmed by reading the installed package's own source (`onStepKeyDown`'s `commit` flag) that
  keyboard-driven steps call it too, not just pointer release — verified via a dedicated test rather
  than assumed.
- **`orientation`/`inverted` exposed as plain passthrough booleans/enums to the Radix primitive** —
  low marginal implementation cost (Radix handles all the internal positioning math), named
  feature-completeness value (a vertical slider is a common, expected variant — e.g. a volume or
  brightness control in a vertical toolbar).
- **`showValue` renders the current value as inline text next to the control** — a named
  feature-completeness gap (seeing the current numeric value without a separate on-screen element)
  rather than an unrequested addition. Deliberately simple (plain `Text`, no floating tooltip-bubble
  positioning) to avoid the added complexity/positioning-edge-cases a hover/drag-following bubble
  would introduce for what's meant to be a straightforward molecule.
- **`required` was NOT added, despite `Switch`'s own precedent of exposing it.** Verified directly
  against the installed `@radix-ui/react-slider@1.4.7` type definitions before assuming parity with
  `Switch` — `Slider`'s own `SliderProps` interface has no `required` field at all (unlike
  `Switch`'s genuine Radix-provided one). Including it anyway would have been a real, confirmed type
  error at the `<SliderPrimitive.Root {...props}>` spread, not just a documentation nicety — caught
  by `tsc`, not asserted from memory of a sibling component's own shape.
- **Track thickness reuses `ProgressBar`'s own already-established height scale verbatim** (via its
  exact `space.*`/`calc()` values) rather than inventing a new component-layer token file — both are
  "thin bar whose thickness scales by size" components, and no new pixel value was actually needed
  (`03-token-system-spec.md`'s own "prefer an existing scale" ordering). Thumb diameter reuses the
  shared `icon-size.*` scale directly for the same reason — a real, measured coincidence (12/16/20/
  24/32px already reads as a natural thumb-diameter progression).
- **Shadows use the fixed `--dbm-shadow-light-*`/`--dbm-shadow-dark-*` primitive pair** (not a
  reactive semantic token, since none exists for elevation) via the same `[data-theme$="-dark"]`
  attribute-selector override already established on `Select`'s own dropdown `.content` — confirmed
  by reading that component's CSS first rather than guessing a token name, after an initial
  (incorrect) draft referenced a non-existent `--dbm-shadow-sm`/`--dbm-shadow-md` that would have
  silently resolved to nothing.

**Baseline correctness:** Full TypeScript strict mode, no `any`. JSDoc complete on the component and
every prop. `forwardRef` to the primitive's own root `<span>` element. `className`/`style` apply to
the root; `id`/`autoFocus`/`data-testid`/the accessible-name and `aria-invalid` attributes are
deliberately routed to the Thumb instead — the actual `role="slider"` element assistive tech
inspects, not the plain positioning wrapper around it (confirmed by reading the installed package's
real rendered DOM directly, not assumed from its type definitions: the thumb's own `role="slider"`
sits inside an *additional* Radix-internal positioning `<span>`, one level deeper than Root, so
naive `slider.parentElement`-style assumptions about the DOM shape were wrong and had to be
corrected — see Functional verification below). No hardcoded values — every visual choice traces to
an existing token (see above). No console noise, no silent catches. SSR-safe — no module-scope or
render-time `window`/`document` access.

**Consumed-atom defect handling (`06-engineering-standards.md` §9 checkpoint):** none found — `Text`
(used for `showValue`'s label) needed no changes; this review did catch and fix its own incorrect
assumption about `Text`'s color prop being named `tone` (it's `color`), caught by `tsc` before ever
reaching a live check, not a real atom defect.

**Accessibility:** Renders `role="slider"` (WAI-ARIA slider pattern) with live
`aria-valuenow`/`aria-valuemin`/`aria-valuemax`, plus optional `aria-valuetext` for a
human-readable alternative to the raw number. `aria-invalid` set automatically while `hasError`. A
dev-mode console warning fires once with no `aria-label`/`aria-labelledby`, matching `Switch`'s own
established pattern. `Tab` focuses the thumb; arrow keys/Page Up/Page Down/Home/End move it, all via
Radix's own keyboard handling — verified directly rather than assumed (see tests). A `disabled`
slider is unreachable by `Tab` and ignores keyboard input entirely (verified). jest-axe clean across
default/error/disabled/`showValue` states.

**Responsiveness/Theming:** No component-specific breakpoint logic. Live-verified in a running
Storybook instance across all 4 theme combinations via direct CSSOM/token inspection (not just
reasoned about from the code) — confirmed `bg.brand` (range fill), `bg.track` (track), `bg.surface`
(thumb), and both shadow tokens all resolve correctly in Purple/Emerald × Light/Dark, plus the
`hasError` danger-colored range/thumb ring in the default theme. One real methodology pitfall hit
and corrected during this check: reading `getComputedStyle` immediately after changing `data-theme`
via script returned a stale value in this environment until a reflow was forced (`el.offsetHeight`)
first — not a rendering bug, but worth noting since it briefly looked like one before being
diagnosed and re-verified correctly.

**Storybook documentation:** `Slider.mdx` Docs page (first in its sidebar group), full template —
Intro, Playground, Properties table (`propOrder` sequenced content→visual→behavioral→escape-hatch),
a Variants gallery (All sizes, Vertical, With the live value shown, Custom min/max/step, Error
state, Disabled, Controlled-with-onValueCommit), Usage guidelines, Best practices, Accessibility,
Code examples (including a genuine native-prop example per the standing requirement), Design tokens
used, Related components (cross-linking `NumberInput`, `FieldLabel`, `FieldHelperText`, `FieldError`,
`FormField`). Two `play`-function interaction stories (keyboard stepping + Home/End, disabled blocks
input) with generous leading/inter-step pauses from the start, matching the pacing convention
established after `SearchInput`'s own user-reported fix — not something this component had to
retrofit. Every prop's Controls-panel control is genuinely interactive or has a stated
`control: false` reason. Visually verified live in a running Storybook instance (not just `tsc`),
including the Playground rendering correctly and the sidebar taxonomy
(`Molecules/Inputs/Slider`) matching `07-storybook-and-documentation-standards.md` §3.

**Functional verification:** `Slider.test.tsx` (20 tests) covers rendering at `min` by default,
`defaultValue`, custom `min`/`max`/`step`, arrow-key increment/decrement calling `onValueChange`,
Home/End jumping to the extremes, `onValueCommit` firing on a completed keyboard step (distinct from
`onValueChange`), fully controlled usage, `disabled` blocking keyboard input, `aria-invalid` via
`hasError`, `showValue`'s live text, size classes, vertical orientation, `aria-valuetext`
passthrough, the hidden native input rendering only inside a real `<form>` (not merely when `name`
is set — a real, verified Radix behavior, not assumed), ref forwarding, the no-accessible-name dev
warning, and jest-axe across 4 states. Three tests initially failed on first run from an incorrect
assumption about the rendered DOM shape (see Baseline correctness above) — fixed by inspecting the
actual DOM directly rather than guessing a second time, not by loosening the assertions. Full
package self-verification: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest `unit`
(1305/1305 whole package) and `storybook` (454/454 whole package, including this component's own 10
story tests) all clean; `tsup` build and `check-component-bundle-size` clean (1.72KB JS / 1.04KB CSS
gzipped, well within budget); `check-foundations-token-coverage` clean.

**Feature completeness:** Named gap comparisons made explicit above (`onValueCommit`,
`orientation`/`inverted`, `showValue`) rather than an unscoped "make it fancier" pass — each traces
to a concrete, stated rationale, per the §9 scope-creep guardrail. `required` was deliberately *not*
added after verifying it isn't a real capability of the underlying primitive, rather than copying
`Switch`'s own prop list on the assumption that every Radix form-control wrapper shares the same
surface.

**Post-build fixes (2026-09-15, user-reported, before the final review pass):**

1. **The thumb was hard to see** — a plain white circle distinguished from the page only by a soft
   shadow. Fixed by adding a `border.brand` (danger when `hasError`) border around it — a real,
   visible ring that also reads as a deliberate, on-brand handle rather than a generic dot. The
   previous `hasError` treatment (a box-shadow ring) was simplified to a plain border-color swap now
   that a real border already exists, avoiding a doubled-up ring look.
2. **The vertical orientation demo appeared to render only the thumb, no track.** Direct DOM/rect
   inspection showed the track was actually rendering correctly, at the right size and position — the
   real issue was contrast, not layout: `bg.track` (what `.track` used) is documented as a
   deliberate, sub-3:1 exception for a *passive* progress indicator's own empty portion
   (`03-token-system-spec.md`), not a token built for an interactive control's own draggable hit
   area. A thin, low-contrast vertical line is far harder to spot than the same low contrast on a
   wide horizontal bar, which is why this read as "missing" specifically in the vertical story.
   Fixed by switching `.track` to `bg.track-strong` — the token spec's own already-established
   choice for exactly this "boundary must read as real" case (`Switch`'s own always-interactive
   track, `Indicators`' inactive-dot fill). Re-verified via direct computed-style inspection in both
   orientations, not just visually.

Re-verified after both fixes: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest
`unit` (20/20 this component) and `storybook` (10/10 this component) clean.

**Feature-completeness questions raised and resolved (2026-09-15, user-asked):** presented four
open questions back to the user rather than deciding unilaterally, since one of them was a real
fork affecting the documented build-order plan, not just this component's own surface:

1. **Min/max end labels — add.** New `showMinMaxLabels` prop.
2. **Hover/drag value tooltip — add, reusing the `Tooltip` atom.** New `showValueTooltip` prop.
3. **Step tick marks — add now** (the other option offered was deferring). New `showTicks` +
   `tickInterval` props.
4. **Two-thumb range mode — keep separate.** Confirmed: stays the future `RangeSlider` component (built 2026-09-25, see [RangeSlider.md](RangeSlider.md))
   already planned in `04-component-inventory.md` (item 17, "extends Slider"), not folded into
   `Slider` itself via a variant prop. No change made to this component or the inventory as a
   result — this only rules out an alternative, it doesn't require any action now.

**Implementation notes for the three added features:**

- **`showValueTooltip`** wraps the `Thumb` in the already-Finalized `Tooltip` atom
  (`delayDuration={0}`, since the standalone 400ms default is tuned for discoverability hints, not
  a value readout that should track a drag immediately) — relies on `Tooltip`'s own native
  hover/focus triggers rather than custom drag-tracking state; the thumb visually tracks the
  pointer throughout a drag, so hover stays naturally engaged for its whole duration. Content
  prefers `aria-valuetext` when set, falling back to the raw number.
- **`showMinMaxLabels`** renders `min`/`max` as `Text` — a plain row below the track for horizontal;
  absolutely-positioned overlays for vertical (see the real bug this required fixing, below).
- **`showTicks`/`tickInterval`** render small `aria-hidden` dots inside `Track`, computed inclusive
  of both `min` and `max` (the last real tick always lands exactly at `max`, even when the range
  doesn't divide evenly by `tickInterval`, rather than being silently dropped). A plain `bg.surface`
  fill was used for every tick regardless of fill-position, deliberately simpler than per-tick
  recoloring based on whether the filled range covers it — reads adequately against both the track
  and the range without that added complexity.

**A real, found-and-fixed layout bug: vertical + `showMinMaxLabels` initially rendered a 0-height
slider.** The first implementation nested `Slider.Root` (which sizes itself via `height: 100%`,
resolved against whatever explicit height the caller passes via `style`) inside a new wrapper span
intended to "shrink-wrap" around it with no height of its own. That's not how CSS percentage
heights work: a percentage height only resolves against an ancestor with a genuine, explicit
height — an auto-sized wrapper doesn't retroactively gain one just because its only child wants to
be "100%" of it, so Root's own height collapsed to 0. Found live, not caught by `tsc`/`eslint`/unit
tests (jsdom doesn't lay out real percentage-height chains meaningfully) — only visible by actually
rendering the vertical + min/max-labels story and looking at it, which is exactly why the review
checklist requires live Storybook verification, not just a clean typecheck. Fixed by moving the
explicit `style` (the real height) to the wrapper instead, in that one specific composition only —
every other case (no wrapper, i.e. `showMinMaxLabels` unset) is unaffected and keeps receiving
`style` directly on Root, unchanged. Re-verified via direct `getBoundingClientRect()` inspection
after the fix, both in the standalone story and embedded in the full Docs page (0 zero-height
vertical roots found across all 65 `Slider` instances rendered on that page).

Full re-verification after all of the above: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` (1316/1316 whole package, up from 1305) and `storybook` (459/459
whole package, up from 454) all clean; `tsup` build and `check-component-bundle-size` clean
(2.34KB JS / 1.38KB CSS gzipped, up from 1.72KB/1.04KB, still well within budget);
`check-foundations-token-coverage` clean. `Slider.test.tsx` now 31 tests (was 20); `Slider.stories.tsx`
now 15 stories (was 10), including new Canvases for each feature plus a combined
"Every decoration combined" story and a "Vertical, with min/max labels" story exercising the fixed
layout directly.

**Second post-build fix round (2026-09-15, user-reported) — one revert, one root-cause correction,
and three real bugs found and fixed:**

1. **Track reverted to `bg.track`.** The user's original vertical-track visibility report turned out
   to be a pure layout bug (below), not a contrast issue — the `bg.track` → `bg.track-strong` swap
   from the first fix round was solving the wrong problem. Reverted; the semantic-fit reasoning in
   that first round's own entry no longer applies and shouldn't be treated as settled guidance.
2. **The real vertical-visibility bug: any wrapping layer added for `showValue`/`showMinMaxLabels`
   broke `Root`'s own percentage height.** The user's clarification ("I only see the thumb") pointed
   at the actual mechanism: `Slider`'s own `style` prop is commonly a *percentage* itself (e.g. the
   `Vertical` story's `style={{ height: "100%" }}`), resolved against whatever real-heighted
   ancestor the caller's own markup provides. The first fix round only patched this for the
   `showMinMaxLabels`-vertical case (moving `style` to that one wrapper); the identical bug still hit
   plain `showValue`-vertical (no min/max labels) — confirmed live, user-reported ("the track
   disappears and I only see the thumb and value" when toggling `showValue` on in the vertical
   story) — and would have hit the combined case too. Fixed generally: `verticalNeedsWrapper` now
   introduces one consistent outer `.verticalStyleHost` that always receives the real `style`
   whenever *any* vertical wrapping happens, with every layer inside it (`.wrapperVertical`,
   `.minMaxWrapperVertical`, `Root`'s own vertical rule) using a plain `height: 100%` to form an
   unbroken chain back down — rather than the previous case-by-case redirection, which was exactly
   what left this gap. Also added a real, absolute `min-height` floor (`space.32`) to `Root`'s own
   vertical rule as a defensive fallback — found via a *third* instance of this exact class of bug
   (the Playground story's own plain demo wrapper sets no height at all, so switching `orientation`
   to "vertical" there rendered only the thumb) — so a `Slider` with zero sizing at all still renders
   usably instead of collapsing, matching "a component should render something reasonable with zero
   props" (05-component-api-conventions.md §3). The Playground's own `render` was also given a real
   height specifically when vertical is selected, for a better demo regardless of the floor.
3. **A real, confirmed ordering bug: horizontal `showValue` + `showMinMaxLabels` together vertically
   centered the value against the wrong box.** The first fix round's own comment *claimed* the
   composition order had been swapped to fix this, but the actual code still applied
   `showMinMaxLabels` first (inner) and `showValue` second (outer) — the exact bug the comment
   described fixing was still present, caught only because the user attached a screenshot and
   because a new structural test (`valueRow?.contains(minMaxRow)` must be `false`) was added and
   initially failed against the actual code, not just the comment. Genuinely fixed this time,
   verified both by that test and live: `showValue` now wraps *before* `showMinMaxLabels` for
   horizontal (so the min/max row is always outermost, below everything), while vertical keeps the
   opposite order deliberately — its own min/max wrapper is pure absolutely-positioned overlays that
   consume no real space, so it must wrap bare `Root` first for that non-consumption property to
   hold; wrapping an already-`showValue`-wrapped box there would let it anchor to the wrong,
   taller box instead.
4. **First and last tick marks (at exactly `min`/`max`) are now excluded from what renders,** at the
   user's request — computed via a `visibleTicks` filter over the same inclusive `ticks` array
   (kept, unfiltered, as the semantic source of "every real tick" a future need might still want),
   rather than changing the generation loop itself.
5. **The value tooltip closing mid-drag was a real bug, not a misconfiguration.** Relying on Radix
   Tooltip's own uncontrolled hover/focus triggers (the first round's design) turned out to be
   insufficient: Radix Tooltip treats a `pointerdown` on its trigger as a dismiss signal, closing the
   tooltip the instant a drag begins even though the pointer never left the thumb. Fixed by tracking
   hover/press/focus explicitly (`onPointerEnter`/`Leave`, `onPointerDown`/`Up`/`Cancel`,
   `onFocus`/`Blur`) and driving `Tooltip`'s `open` prop from their combination — confirmed via a
   real drag interaction live (the tooltip's own value updated continuously through the drag) and
   via two new tests. One test-writing detour worth recording: a pointerdown/pointerup sequence on
   the thumb genuinely leaves it focused afterward (confirmed directly via `document.activeElement`)
   — correct, expected behavior for an interactive control, not a bug — so the regression test needed
   an explicit `blur` to fully close the tooltip, not `pointerLeave` alone.

Re-verified after all of the above: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest
`unit` (1320/1320 whole package, up from 1305) and `storybook` (459/459 whole package, up from 454)
all clean; `tsup` build and `check-component-bundle-size` clean (2.51KB JS / 1.40KB CSS gzipped,
still within budget). `Slider.test.tsx` now 35 tests (was 20 before this round). Every fix
live-verified in a running Storybook instance — including the two cases where the *first* round's
own reasoning turned out to be wrong (track contrast; the "already swapped" composition order) —
underscoring why this checklist requires live verification rather than trusting a clean typecheck or
a confident-sounding comment.

**Third post-build fix round (2026-09-15, user-reported with screenshots) — two more real layout
bugs, both specifically in the `showValue` + `showMinMaxLabels` *combination*, each fixed with a
different mechanism:**

1. **Horizontal: `max` ended up aligned with the value label, not the slider's own end.** The second
   round's nested-flex fix got the *vertical centering* right but missed this: `showMinMaxLabels`'s
   own `width: 100%` row was sized against whatever `control` already was when it wrapped — which,
   once `showValue` had already wrapped it first, was the *combined* [slider + value label] row, not
   the slider alone. `justify-content: space-between` then spread `min`/`max` across that wider
   combined width instead of just the track's own. Fixed by replacing the nested-flex approach for
   this *specific combination* with a dedicated CSS Grid layout (`.combinedWrapper`): the slider and
   the min/max row share one grid column (sized to the slider), with the value label in an adjacent
   column — so the min/max row's width is structurally tied to the slider's own, independent of
   whatever the value label's width happens to be. The single-feature cases (`showValue` or
   `showMinMaxLabels` alone) were already correct and are untouched. Verified live with a direct
   pixel measurement, not just visually: the track's own right edge and the `max` label's right edge
   now compute to the exact same value (0px difference).
2. **Vertical: the value label visually overlapped the min label.** `showMinMaxLabels`'s own "min"
   overlay (vertical) hangs below `Root`'s real box without consuming any normal-flow space — a
   deliberate design from the first round, so it wouldn't affect `Root`'s own height. That same
   property meant `showValue`'s row (wrapped outside it) had no way to know it needed extra
   clearance: the value label landed right at `Root`'s own bottom edge, exactly where the invisible-
   to-layout "min" overlay was also rendering. Fixed with a conditional extra top margin
   (`.valueClearsMinMaxOverlay`, added to the value label's own class only when
   `showMinMaxLabels` is also set) sized to actually clear the overlay's own offset plus its own text
   height — a measured, live-verified value (confirmed via direct `getBoundingClientRect()`
   inspection: a clean 20px gap between the two labels, not just "no longer complains" from a
   screenshot glance).

Both required a new test verifying the actual structural/class-based mechanism (grid-column
equality for the horizontal fix; the conditional clearance class for the vertical one) rather than a
literal pixel value neither jsdom nor a computed-style assertion could meaningfully check.

Re-verified after both fixes: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest
`unit` (1322/1322 whole package, up from 1320) and `storybook` (459/459 whole package, unchanged —
no new stories needed) all clean; `tsup` build and `check-component-bundle-size` clean (2.61KB JS /
1.48KB CSS gzipped, still within budget). `Slider.test.tsx` now 37 tests (was 35). Both fixes
live-verified with real pixel measurements in a running Storybook instance, not just visual
inspection — this component's own history in this session is a good argument for why that
measurement step matters: a screenshot alone could plausibly have looked "close enough" for the
horizontal case despite the underlying width still being wrong.

## Fourth post-build fix round (2026-09-14)

User-reported: "when I hover and/or drag the thumb, the tooltip is displayed. When I stop
interacting with the thumb, the tooltip continues to display until I click or tap outside/away from
the slider."

Root cause: the third round's tooltip logic (`tooltipOpen = isThumbHovering || isThumbPressed ||
isThumbFocused`) treated *any* DOM focus on the thumb as a reason to keep the tooltip open — but a
`pointerdown`/`pointerup` click on a focusable element genuinely leaves it DOM-focused afterward
(confirmed in the second round's own debugging), with nothing but an unrelated `blur` (typically
triggered by clicking elsewhere) able to clear `isThumbFocused` again. So a drag-then-release left
the tooltip pinned open via leftover click-focus, exactly as reported.

Considered using the CSS `:focus-visible` pseudo-class to distinguish genuine keyboard focus from
this click-residual focus, since that's precisely the distinction it exists for. Investigated with a
throwaway debug test rather than assuming: `element.matches(':focus-visible')` correctly returned
`true` after `userEvent.tab()`, but *also* returned `true` after a plain `fireEvent.pointerDown`/
`fireEvent.pointerUp` sequence — which a real browser should not do for a mouse click on a
non-text-input element. jsdom's implementation doesn't actually track input modality, so it can't be
trusted here (and testing against it would just encode the same wrong assumption). Rejected in favor
of an explicit mechanism.

**Fix**: a `wasPointerDownRef` ref, set `true` in the thumb's `onPointerDown` and reset to `false` in
its `onBlur`; `onFocus` now only sets `isThumbFocused(true)` when `!wasPointerDownRef.current`. This
exploits the real, standard browser event order for a click on a focusable element
(`pointerdown → focus → pointerup`) to distinguish "focus that just arrived from a click" (ignored)
from "focus that arrived any other way — Tab, programmatic `.focus()`" (still opens the tooltip, as
it should for keyboard users). Hover/press behavior (`isThumbHovering`/`isThumbPressed`) is
unchanged — dragging still keeps the tooltip open and live-updating throughout.

`Slider.test.tsx`'s tooltip-persistence tests were split to match: one confirming press+release still
keeps the tooltip open (ends at `pointerUp`, no longer asserting anything about what happens after);
a new one confirming the tooltip now closes on `pointerLeave` alone despite the thumb still being
genuinely DOM-focused from the preceding click; and the keyboard-focus test rewritten to drive real
Tab focus via `userEvent.tab()` (previously a bare `fireEvent.focus()`, which doesn't exercise this
new pointerdown-gating logic at all) confirming genuine keyboard focus still opens the tooltip.

Live-verified in a running Storybook instance (not just the jsdom tests, given this round's whole
premise was that jsdom's own modality tracking can't be trusted): dragged the thumb across the
track — tooltip stayed open with a live-updating value throughout the drag — then moved the mouse
away after releasing, with no further click; the tooltip disappeared immediately via its own
`pointerleave`-driven close, with no click-elsewhere needed. Separately confirmed Tab-focusing the
thumb (no mouse interaction at all) still opens the tooltip correctly.

Re-verified after the fix: `pnpm run lint` (eslint + `tsc` + `.storybook` `tsc`), full Vitest `unit`
(1323/1323 whole package) and `storybook` (459/459 whole package) projects, `pnpm run build`, and
`check-component-bundle-size` (2.63KB JS / 1.48KB CSS, still within budget) all clean.

## Final review pass (2026-09-15)

Full `06-engineering-standards.md` §9 checklist run end to end — baseline correctness, feature
completeness, accessibility, responsiveness, design quality, theming, Storybook documentation, and
functional verification — ahead of finalization. Findings, most severe first:

1. **Accessibility defect: the unfilled track's color fails the token spec's own contrast rule for
   an always-interactive control.** `03-token-system-spec.md` draws an explicit line between
   `bg.track` (a deliberate sub-3:1 exception, but *only* accepted for a passive, non-interactive
   indicator like `ProgressBar`/`ProgressCircle`) and `bg.track-strong` ("used where the boundary
   must read as real, e.g. `Switch`'s always-interactive track"). `Slider.module.css` was using the
   plain `bg.track` — reverted there mid-session (see "Second post-build fix round" above) at
   explicit user direction, but that revert was chasing a different bug (the vertical height
   collapse) and landed on a value the token spec itself says shouldn't apply to an always-interactive
   control like this one. Measured directly: `bg.track` computes to 1.14:1 (light) / 1.40:1 (dark)
   against `bg.surface`, both well under the 3:1 non-text floor; confirmed visually in a live
   Storybook instance — the unfilled track was nearly invisible against a white page. **Fixed**:
   restored `background-color: var(--dbm-bg-track-strong)`, matching `Switch`'s own precedent for
   exactly this "always-interactive boundary" case. This is being called out explicitly, not applied
   quietly, since it reverses a specific instruction from earlier in the session — but per
   `CLAUDE.md`'s "accessibility is not optional," a confirmed sub-floor contrast value on an
   interactive control's own boundary is a defect regardless of how it got there.
2. **Inconsistent value display: `showValue`'s persistent label ignored `aria-valuetext`, while
   `showValueTooltip`'s tooltip already preferred it.** A slider using `aria-valuetext="Medium"` on a
   1–3 scale with `showValue` on would show the raw number ("2") in-page while a tooltip (if also
   enabled) showed "Medium" and assistive tech announced "Medium" — three different presentations of
   the same value. **Fixed**: introduced a shared `displayValue = ariaValueText || currentValue`,
   used by the tooltip and all three `showValue` label branches (vertical, horizontal-combined,
   horizontal-only) alike. Verified live: `showValue` now shows "Medium," not "2," when both are set.
   `showValue`'s own JSDoc updated to document the same `aria-valuetext` preference `showValueTooltip`
   already documented.
3. **Docs page (`Slider.mdx`) was missing several tokens the component actually uses.** An audit of
   every `--dbm-*` reference in `Slider.module.css` against "Design tokens used" found the four thumb
   elevation shadow tokens (`shadow.light.sm`/`shadow.dark.sm`/`shadow.light.md`/`shadow.dark.md`),
   `space.2` (the value-label gap), `space.8` (the vertical min-overlay clearance), and `space.32`
   (the vertical min-height floor) all undocumented — the `bg.track-strong` row itself was already
   correct (the doc was right; the CSS was wrong, per finding 1). **Fixed**: added the missing
   `TokenRow` entries, matching this file's own existing exhaustive-documentation precedent.
4. **Missing regression coverage for `aria-labelledby`/`aria-describedby` forwarding.** Both are
   documented props passed through to the thumb, but neither had a dedicated test proving it.
   **Fixed**: added one test per prop, plus a test locking in finding 2's fix.
5. **Minor: `tickInterval`'s Playground default (`10`) doesn't match its real destructuring default
   (`= step`, i.e. `1` here) — a deliberate demo-usability call (a literal `1` across a 0–100 range
   would render 100 illegible ticks the moment `showTicks` is toggled on), left undocumented as
   intentional. **Fixed**: added a one-line comment in `Slider.stories.tsx` explaining the deviation,
   matching how other deliberate arg/default mismatches are documented elsewhere in this codebase.

No other checklist gaps found: feature-completeness pass against comparable slider implementations
found nothing missing beyond what's already deferred by design (range/two-thumb mode → future
`RangeSlider`, per the second post-build round's own decision); atom reuse (`Text`, `Tooltip`),
Radix-prop audit, SSR safety, keyboard/tab order, cross-brand and light/dark theming (Purple and
Emerald, both modes, live-verified), and responsiveness (375px mobile width, both a horizontal
fully-decorated story and the vertical + min/max story) all already held.

Re-verified after all five fixes: `pnpm run lint` (eslint + `tsc` + `.storybook` `tsc`), full Vitest
`unit` (1326/1326 whole package, up from 1323) and `storybook` (459/459, `Slider.mdx`'s own indexing
re-confirmed working after a syntax slip mid-fix) projects, `pnpm run build`, and
`check-component-bundle-size` (2.64KB JS / 1.48KB CSS, still within budget) all clean. Both visual
fixes (track contrast, `showValue`'s `aria-valuetext` preference) re-confirmed live in a running
Storybook instance, not just from the code.

## Post-review fix: value label font size didn't scale with slider size (2026-09-15)

User-reported: the `showValue` label's font size read fine at `xs`/`sm`/`md` but looked
disproportionately small next to `lg`/`xl`'s own larger thumb (24px/32px) and thicker track — a
fixed `Text size="sm"` regardless of the slider's own `size`.

Fixed with a `valueTextSize: Record<SliderSize, TextSize>` lookup (mirroring the existing
`sizeClass` lookup's own shape), applied to all three `showValue` label branches (vertical,
horizontal-combined, horizontal-only) — not the min/max labels or the tooltip's own content, which
weren't part of the report and stay unchanged. `xs`/`sm`/`md` unchanged (still `"sm"`, i.e.
`font-size-sm`, per the user's own explicit confirmation those three already read fine); `lg` steps
up to `"base"` (`font-size-base`, 16px) and `xl` to `"md"` (`font-size-md`, ~19–20px) — a graduated
increase matching how each size's own thumb diameter (24px, 32px) steps further ahead of `md`'s own
20px. Live-verified in Storybook across all five sizes, plus the horizontal fully-decorated and
vertical + min/max combinations at `xl` specifically, to confirm the larger text doesn't overlap or
misalign the grid/overlay layouts finding rounds 3–4 fixed. Added a dedicated regression test
locking in the per-size mapping (`Slider.test.tsx`).

No token gap: the value label already composes the `Text` atom rather than setting `font-size`
directly in `Slider.module.css`, so this is Slider choosing which of `Text`'s own existing
`font-size` tokens to request per size — not a new token or a hardcoded value — consistent with how
this component's own "Design tokens used" section doesn't re-list tokens a composed atom
(`Tooltip`) already resolves internally.

Re-verified: `pnpm run lint`, full Vitest `unit` (1327/1327) and `storybook` (459/459) projects,
`pnpm run build`, and `check-component-bundle-size` (2.66KB JS / 1.48KB CSS, still within budget)
all clean.

## Track color reverted from `bg.track-strong` back to `bg.track` (2026-09-15)

The final review above (finding 1) restored `bg.track-strong` on the reasoning that an
always-interactive control's track "must read as real." Revisited the same day after a direct
question about whether that rule was actually correct: checking several comparable production
sliders found the majority don't hold their own track to 3:1 either, and WCAG 1.4.11 itself targets
whichever element conveys a control's boundary/state — for `Slider`, that's the thumb and the filled
range, not the passive groove behind them. Reverted to `bg.track`, and applied the identical
reasoning to `Switch`'s own unchecked track (see `guidelines/component-reviews/Switch.md`'s own
entry — `Switch` is Finalized, so that change went through `06-engineering-standards.md` §9's
re-finalization test explicitly). Full reasoning, and the general principle this generalizes to any
future track-having component: [ADR-0016](../adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md).

Changed: `Slider.module.css`'s `.track` rule back to `background-color: var(--dbm-bg-track)`.
`Slider.mdx`'s Accessibility callout and its `bg.track`/`bg.track-strong` `TokenRow` updated to match
and to state the exception explicitly (deliberate sub-3:1, not an oversight) rather than the earlier
(now-superseded) "checked against real WCAG contrast ratios" phrasing, which was accurate for
`bg.track-strong` but would have been wrong left as-is against the reverted `bg.track`.

Re-verified: `pnpm run lint`, full Vitest `unit` (1327/1327) and `storybook` (459/459) projects,
`pnpm run build`, and `check-component-bundle-size` (2.66KB JS / 1.48KB CSS, still within budget) all
clean. Live-verified in Storybook: the track is visibly fainter again, matching its pre-review-round
appearance, with the thumb (bordered, per the earlier round-1 fix) still clearly anchoring the
control.

## Follow-up shared-token change: `bg.track` light value moved `gray.100` → `gray.200` (2026-09-15)

Same day as the track-color revert above, at explicit direction: `bg.track`'s own light-mode
primitive mapping moved from `gray.100` (1.14:1 against `bg.surface`) to `gray.200` (1.35:1) — still
a deliberate sub-3:1 exception, not a compliance claim — once several comparable production
sliders/switches were checked and this token's own faintness (shared with `Switch`, per
[ADR-0016](../adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md)) read
as more subtle than typical. Dark value (`gray.800`, 1.40:1) unchanged. No change to
`Slider.module.css` itself — it already referenced `bg.track` by name from the prior revert. Full
detail and the shared-token rationale: `03-token-system-spec.md`'s `bg.track` row.

Re-verified: `pnpm run lint`, full Vitest `unit` (1327/1327) and `storybook` (459/459) projects,
`pnpm run build`, `check-component-bundle-size`, and `check-foundations-token-coverage` all clean.
Live-verified in Storybook: the track now reads marginally more visible than the pre-review
appearance while still clearly reading as a passive groove behind the thumb.

## Follow-up shared-token change: dark `bg.track` moved `gray.800` → `gray.700` (2026-09-15)

Same day, at explicit direction: `bg.track`'s dark-mode mapping moved from `gray.800` (1.40:1
against `bg.surface`) to `gray.700` (2.05:1) — still short of 3:1, but a real step up, matching the
same-day light-mode bump. No change to `Slider.module.css` itself. Re-verified live in Storybook
(dark mode, both brands): the track now reads clearly against the surface. Full detail:
`03-token-system-spec.md`'s `bg.track` row.

Re-verified: `pnpm run lint`, full Vitest `unit` (1327/1327) and `storybook` (459/459) projects,
`pnpm run build`, `check-component-bundle-size`, and `check-foundations-token-coverage` all clean.

**Finalized 2026-09-15** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Slider (code, stories, docs, or its tokens) without asking first.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: every snippet spelled out about twenty props, nearly all defaults (`showTicks={false}`, `inverted={false}`, `aria-valuetext=""`, `tickInterval={10}`) and two no-op handlers, so eight one-arg stories ("With the live value shown", "With a value tooltip", "With min/max labels", "With tick marks", "Every decoration combined", "Custom min/max/step", "Error state", "Disabled") hid their one prop among the rest; and "Controlled, with onValueCommit" froze `value={50}` and the text "Live: 50 · Committed: 50". Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `Slider.snippets.ts`; the one-arg and vertical stories use the Playground's builder (`showValueTooltip` on its own; `tickInterval` only when ticks are on and it differs from `step`; a vertical slider shown in a container with a height), and the controlled example shows the two states and what `onValueCommit` is for. All snippets and Playground combinations were typechecked against the real types (the controlled ones with the real `useState` lines, so the state handlers' types were checked too). **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.

## Post-Finalization follow-up (2026-09-20, at explicit direction) — `formatNumber`

Asked for after an audit of the Finalized components for numbers they display (see [ADR-0021](../adr/0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)). `Slider` shows numbers in four places with no way to change how they are written: the value (`showValue`, `showValueTooltip`) and the `min`/`max` labels (`showMinMaxLabels`); the only override was a fixed `aria-valuetext` string, which can't follow a value that changes unless the consumer controls it and rebuilds the string on every change.

- **`formatNumber?: (value: number) => string`** (default `String`) writes the value label, the tooltip, and all six `min`/`max` label sites (vertical, horizontal with and without the value label). Because it is a function of the number it also covers units (`50%`, `$50`), which `aria-valuetext` alone never could without controlled mode. Named as [ADR-0021](../adr/0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md) names it, for predictability across components, though on a slider it is a little narrower than the job.
- **What is announced follows what is shown.** With a formatter and no `aria-valuetext`, the thumb's `aria-valuetext` becomes the formatted number (so a screen reader says `٥٠` or `50%`, not `50`), and updates as the value changes. An `aria-valuetext` the consumer passes still wins everywhere — the label, the tooltip, the announcement — as it always did; the `min`/`max` labels still use the formatter. With no formatter nothing changes at all: the plain number, and no `aria-valuetext` attribute unless one was passed (an empty one behaves as before).
- **Plain numbers where a number isn't display:** `onValueChange`, `onValueCommit`, `aria-valuenow`, and the hidden form input's value. Tick marks show no number.
- **Finalized status unchanged.** Under the `06-engineering-standards.md` §9 three-question test this is purely additive: an optional prop that changes nothing when unset. The new surface got its own scoped pass: JSDoc, 14 unit tests (unchanged when unset; the label, tooltip, each min/max layout; the announcement and that it follows changes; your own `aria-valuetext` winning; callbacks and the form value plain; a real Arabic locale and a German decimal; a unit; axe), a "Numbers in your own locale" Docs story with a hand-written snippet typechecked against the real component (a planted `formatNumber={5}` is rejected), a Properties row and default, an accessibility bullet and a code example. Mutation-checked: ignoring the formatter for the value/tooltip, for each of the six `min`/`max` sites individually, for `aria-valuetext`, letting it override a consumer's `aria-valuetext`, and setting `aria-valuetext` even with no formatter each fail a test. Live-checked (Arabic digits, `60%`, `0,5`; the thumb's `aria-valuetext` matches what is shown). One observation, not a defect: the design font has no Arabic-Indic digits, so the browser falls back to a system font and they look small at the `xs` min/max size.

## Internal refactor for `RangeSlider`, 2026-09-25 (no visible change; stays Finalized)

At explicit direction (the "extract shared internals" option), `Slider`'s layout logic moved into `Slider/sliderShared.tsx` — the size classes, the six `showValue` / `showMinMaxLabels` / vertical layouts, the tick marks, and the thumb-tooltip hover/press/focus state (`useThumbTooltip`) — so `RangeSlider` uses the same code instead of a copy. `Slider.tsx` went from 432 to 242 lines; its rendered DOM, props, CSS and behaviour are unchanged. Under `06-engineering-standards.md` §9's three-question test nothing that existed changed output, so it stays Finalized. Evidence: all 56 unit tests and every browser story passed unchanged before and after, and `tsc`/`eslint` are clean. The explanatory comments that carried the reasoning for each layout (the grid for `showValue` + `showMinMaxLabels`, the vertical height chain, the tooltip's press/focus tracking) moved with the code.

**Found while building `RangeSlider`** (details in [RangeSlider.md](RangeSlider.md)): two defects, fixed the same day at explicit direction (below), and the right-to-left question, since decided (last section). A third defect, reported afterwards, is fixed in the sections between.

## Two defect fixes, 2026-09-25 (stays Finalized)

Both correct something that already broke an existing requirement, so under `06-engineering-standards.md` §9's three-question test (question 2: a genuine defect) `Slider` stays Finalized without a re-review.

- **`autoFocus` never focused the thumb.** React only focuses a `button`, `input`, `select` or `textarea` on mount, and a Radix thumb is a `span`, so the prop forwarded to it did nothing since the component was built (confirmed before the fix: a mounted `<Slider autoFocus>` did not have focus). The thumb now takes a ref and an effect focuses it when `autoFocus` is set (the `eslint-disable` that silenced the lint rule on the old prop is gone). Two unit tests: it has focus after mount, and nothing does without the prop.
- **The thumb's pointer and touch target was 12, 16 and 20px at `xs`, `sm` and `md`,** under the 24px minimum of WCAG 2.5.8 (`06` §9, added after this component was reviewed). A transparent `::before` on `.thumb`, `max(100%, space.6)` square and centred, grows the area that grabs the thumb to at least 24px without changing what is drawn (measured live: still 20 × 20 at `md`; an 11px offset lands on the thumb, 13px does not). No new token: `space.6` is 24px. It is in the shared stylesheet, so `RangeSlider` gets it too. A hidden real-browser story samples 11px from the thumb's centre in four directions at every size and both orientations; it fails with the floor removed (checked). A real mouse drag started in the enlarged zone moves the thumb. The Docs page gained a `space.6` token row and an Accessibility line.

## The value label resized the track, 2026-09-25 (defect fix; stays Finalized)

User-reported on `RangeSlider` and `Slider` with `showValue`: dragging a thumb so the value went from one digit to two to three changed the track's width in horizontal orientation, and shifted it sideways in vertical. Reproduced first, measured in a real browser: the track was 232px at 0 and 99 and 224px at 100.

**Cause:** `.value` was as wide as its own text (`min-width: 2ch`, `flex-shrink: 0`). Beside the track that takes width from it; below a vertical track the stack is centred, so a wider label re-centred the whole column.

**Fix:** the label reserves the width of the widest text it can show. `.value::before` is generated content read from a `data-sizer` attribute (one candidate per line, `white-space: pre`, `visibility: hidden`, `height: 0`), so the label is as wide as its widest line and adds no DOM text for a screen reader or a test to find. The candidates are the current text plus the two ends and one step in from each (`widestValueCandidates`: with a step of 0.01, 0.99 is wider than the end 1), formatted by `formatNumber`; `RangeSlider` uses the range at its widest, from the widest number at both ends ("0 – 100"). One place, the shared layout, so both components and all four layouts (value beside, value below, value with min/max labels, horizontal and vertical) are fixed together.

**Trade-off, stated:** the track is now permanently as narrow as it used to be at three digits (8px less than it was at one or two), which is the price of not moving. **A custom `aria-valuetext` of varying length can't be known ahead**, so the label takes the width of the longest text it has shown (the current text is always one of the candidates).

**Responsive:** unchanged and measured — the slider still fills its container, and the track follows it (224, 160 and 96px in containers of 16, 12 and 8rem), with the same width at 0, 99 and 100 in each.

**Verified:** a hidden real-browser story per component measures the track's position and size at 5, 0, 100 and 99 (and `[5, 50]` → `[0, 80]` → `[0, 100]` → `[0, 99]` for the range) in horizontal and vertical, with the value alone and with the min/max labels; it fails (the track 8px narrower) when the sizer is removed and passes with it. Live: the vertical range slider's track stayed at 90.8px in every state. Full pipeline re-run.

## Value label alignment, 2026-09-25 (deliberate preference change, at explicit direction)

With the label now a fixed width (previous section) its text no longer filled it, and `text-align: end` left the spare width between the track and the text. At explicit direction: **beside a horizontal track the text is start-aligned** (it sits next to the track, the spare width on its far side), and **below a vertical track it is centred** (`.wrapperVertical .value`), so the track stays over the middle of the number. Measured live: horizontal, the text starts 8px after the track and flush at the label's start; vertical, the text's centre, the label's centre and the track's centre are the same pixel (94.8). Both apply to `Slider` and `RangeSlider` (shared stylesheet).

This changes how existing output renders, and it is a preference on something already compliant, so under `06-engineering-standards.md` §9's three-question test it is a partial re-finalization of the touched sections, not a defect fix: **re-verified — design quality, responsiveness, functional verification** (the two stable-track stories now also assert the alignment in both orientations; they fail with the old alignment, checked). Accessibility and theming are untouched (no colour, semantic or focus change). Finalized 2026-09-15, alignment revised 2026-09-25.

## Right to left: a `dir` prop, 2026-09-25 (additive plus a defect fix; stays Finalized)

At explicit direction (option C). `Slider` now takes `dir?: "ltr" | "rtl"` (default `"ltr"`), like `Tabs`, `Accordion` and `RadioGroup`: passed to Radix (which mirrors the thumb, fill and ticks and flips the arrow keys) and set on every layout wrapper so the value and min/max labels sit on the mirrored sides. Not inherited from the page — left out inside a right-to-left page the slider stays left-to-right, labels included. **The defect:** before this the min/max labels sat outside Radix's root, followed the page direction, and came out backwards in a right-to-left page ("0" under the maximum end; measured). **Also fixed:** four `translate(-50%)` centring rules (ticks, vertical min/max labels, the 24px hit area) were half their width off-centre in a right-to-left context, each now has a `:dir(rtl)` override. Under `06-engineering-standards.md` §9's three-question test: an optional prop with an unchanged default (additive, question 1) plus a real defect (question 2), so it stays Finalized; the new surface got its own scoped pass — JSDoc, unit tests, a real-browser geometry story (which fails when each of the three parts is broken, checked), a Docs section and Playground control. Full record and reasoning: [RangeSlider.md](RangeSlider.md).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`, else left to right, as before; the prop and its own value are unchanged. The `dir` JSDoc, the Controls description and the Docs line say so. Covered by `DirectionProvider.consumers.test.tsx`. Finalized status is unchanged: no behaviour changes without a provider, and the existing right-to-left checks were re-run.
