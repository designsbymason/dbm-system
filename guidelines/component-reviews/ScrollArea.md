# ScrollArea

Molecule, Layout category. Item 24 of the itemized molecule build order in
`04-component-inventory.md` — a custom-styled scrollable region wrapping Radix ScrollArea
(`@radix-ui/react-scroll-area`, new dependency). Built 2026-09-29.

## What it is

A single (non-compound) component: `children` renders inside Radix's own `Viewport`, with one or
two token-driven overlay scrollbar(s) — `scrollbars` (`vertical` default / `horizontal` / `both`)
picks which axis (or axes) are actually offered; the other is clipped, not scrollable. `size` (the
standard 5-step scale) sets scrollbar thickness — originally mapped directly onto the existing
spacing tokens, revised (see the follow-up below) to a dedicated component-layer token,
4/6/8/10/12px. `variant` (`bordered` default /
`ghost`) follows `Table`'s own exact vocabulary and default. `scrollbarVisibility` (`auto` / `always`
/ `scroll` / `hover` default) and `scrollHideDelay` map straight onto Radix's own `type`/
`scrollHideDelay`. `maxHeight` is a convenience shortcut (`Table`'s own precedent) for the region's
block-axis size — without it, or an equivalent `style`/`className` rule, the region simply grows to
fit its content and never scrolls. `dir` defaults to `'ltr'` and isn't read from the page, matching
`Slider`/`Tabs`/`Accordion`/`RadioGroup`'s established convention; Radix positions the vertical
scrollbar and corner on the correct side automatically, so nothing else needed its own mirroring.

`ref` forwards to the outer frame (`Root`); `viewportRef` is a second, explicitly-named prop reaching
the real scrolling element (`Viewport`) for imperative scrolling/measurement. `onScroll` is
redeclared and routed to `Viewport` specifically, since a plain native `onScroll` on `Root` would
never fire — `Root` itself never scrolls. See [ADR-0028](../adr/0028-scrollarea-puts-native-props-on-the-outer-frame-and-routes-only-scroll-relevant-props-to-the-viewport.md)
for the full reasoning behind this split, which is the reverse of [ADR-0019](../adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md)'s
`Table` (there, native props go to the *inner* `<table>`; here, to the *outer* frame) — the two
aren't in tension, since each follows the same underlying rule (props go where the consumer already
means "the component"), just applied to a different DOM shape.

The keyboard-reachable-region pattern is `Table`'s own (`useScrollableRegion`), generalized to a
specific axis via a colocated `useIsScrollable` hook (`ScrollArea/useIsScrollable.ts`) rather than
touching `Table`, an already-Finalized component, to extract a shared version without asking first —
flagged below as a DRY opportunity, not acted on. `Viewport` gets `tabIndex={0}`, and — only
alongside a real name from `aria-label`/`aria-labelledby` — `role="region"`, both only while the
requested axis (or axes) actually overflow. No enlarged invisible pointer-target on the scrollbar
thumb (unlike `Slider`'s own thumb) — considered and deliberately not applied; see the CSS module's
own comment for the reasoning (a scrollbar thumb is a secondary affordance next to content with no
buffer around it, unlike an isolated slider thumb).

## Two real defects found only by live-browser measurement

Both invisible to `tsc`/`eslint`/`vitest` (jsdom has no real layout) — caught only once genuinely
measuring `getBoundingClientRect()`/`scrollHeight`/`clientHeight` in a real browser, per the standing
rule in `06-engineering-standards.md` §9.

1. **`maxHeight` didn't actually bound scrolling.** The first implementation gave `Root` a plain
   block box (`max-block-size` from `maxHeight`) and `Viewport { height: 100% }`. CSS percentage-height
   resolution requires the ancestor to have a real, definite `height` — `max-height` alone leaves
   `height` at `auto`, so `Viewport`'s `100%` silently fell back to its own content height instead of
   `Root`'s clamped box: confirmed live, `Viewport.clientHeight` measured 300px (the content's own
   height) against a `Root` whose own rendered height was genuinely 192px. Nothing ever overflowed,
   so no scrollbar ever had a reason to appear.
2. **The fix's own first attempt (`display: flex; flex-direction: column` on `Root`, `Viewport { flex: 1 }`)
   collapsed the region to near-zero instead.** `flex: 1` is shorthand for `flex-basis: 0%` — with no
   explicit `height` on `Root` (only `max-height`), the flex algorithm has nothing to grow *from*,
   so the container's own auto height resolved to almost nothing (confirmed live: `Root`'s rendered
   height measured 23.5px with content that should have needed 192px). Fixed by `flex: 1 1 auto`
   instead: `flex-basis: auto` restores content-based sizing as the starting point (a short list
   stays exactly as tall as its content), and `flex-shrink` still clamps it back down once `Root`'s
   own `max-height` actually engages — which is what makes it scroll. `min-height: 0`/`min-width: 0`
   on `Viewport` were needed either way, overriding flexbox's own default `min-size: auto`, which
   would otherwise stop `flex-shrink` from clamping below the content's natural size.

Both re-verified live afterward: a short-content case shrinks to fit with no wasted space (`Root`
measured 23.5px for one line), a tall-content case clamps to `maxHeight` and genuinely overflows
(`scrollHeight` 300 vs `clientHeight` 190), and a `scrollbars="both"` case with genuinely wide-and-tall
content (the original demo was only one line tall, not a real two-axis case — fixed in
`ScrollArea.stories.tsx`'s own `DemoWideTall`) clamps and overflows on both axes at once, with both
scrollbars and the corner tile rendering correctly on hover.

## A third finding: this environment can't verify native keyboard-triggered scrolling

The first interaction-test draft asserted that a simulated `PageDown` on a focused, genuinely-overflowing
region actually moved `scrollTop`. It failed — but so does the identical assertion against a plain,
unrelated `tabindex="0"; overflow: scroll` `<div>` built from scratch in the same live browser session,
confirming this is a limitation of synthetic key events in this automated environment, not a component
defect: the browser's own native default-action scrolling for a focused element apparently isn't
triggered by this harness's synthetic `keydown`/`keyup` pair, real user input aside. This matches
`Table`'s own test suite, which never asserts this either (checked before concluding). The interaction
test (`KeyboardScrollInteraction`) was rewritten to assert what's actually provable here — `tabIndex`,
focus, genuine overflow (`scrollHeight > clientHeight`), and that setting `scrollTop` directly moves the
content (proving `Viewport` really is the scrolling element) — while documenting why the
keyboard-specific claim was dropped, in the story's own comment.

## DRY opportunity flagged, not acted on

`useIsScrollable` (this component's folder) and `Table`'s own `useScrollableRegion` are near-identical
implementations of the same `useSyncExternalStore`-based overflow-detection technique, now used in two
places — the normal trigger for promoting a hook into `packages/utils` per `06-engineering-standards.md`
§1. Not done here: `Table` is already Finalized, and touching it (even in a zero-behavior-change way)
needs the user's go-ahead first per the standing Finalized-components rule. Worth a small follow-up
session if authorized: extract a shared, axis-parameterized version, have both components call it, and
re-verify `Table` stays Finalized under the three-question test (a pure internal refactor with zero
visible/API surface change — the same shape as `Divider`'s own `useResolvedResponsiveValue` extraction).

## Definition of done — checklist

- [x] Full TypeScript types, no `any`; JSDoc complete on the component and every prop
- [x] `forwardRef` to `Root`; `className`/`style`/`id`/`data-testid` accepted (on `Root`);
      `aria-label`/`aria-labelledby` redeclared (routed to `Viewport`, only while scrollable);
      `onScroll` redeclared and routed to `Viewport`; `dir` defaulted, not inherited
- [x] Zero hardcoded values — every value traces to a token (one new component-layer token family,
      `scroll-area.thickness.*`, added in the follow-up below)
- [x] Storybook: Docs page (`ComponentName.mdx`) first in the group, Playground second, full template
      (Intro, Playground, Properties, Variants gallery, Usage guidelines, Best practices,
      Accessibility, Code examples, Design tokens used, Related components)
- [x] Every visible story's "Show code" is a hand-written snippet (`ScrollArea.snippets.ts`), the
      Playground builds its own from live controls — both typechecked and exercised in
      `storySnippets.test.ts` (a dedicated `describe` block, matching `ButtonGroup`/`ToggleGroup`'s
      own precedent)
- [x] Properties table's Default column populated correctly for every prop with a real default
      (verified live — this component's `component: ScrollArea` meta shape, with every default
      expressed as a plain destructuring default, was not one of the three shapes known to break
      docgen's inference, and this was confirmed rather than assumed)
- [x] `ScrollArea.docs.test.ts` — the Design tokens table matches the stylesheet, checked by a test
      (18 tokens after the follow-up below, the `CodeBlock`/`Stat`/`DescriptionList` drift-guard pattern)
- [x] Unit tests (jsdom, `ScrollArea.test.tsx`, 22 tests) covering rendering, ref/viewportRef split,
      variant/size/scrollbars classes, `onScroll` routing, tabIndex/role appearing only once
      scrollable, `dir`, native prop passthrough, and jest-axe with zero violations (both scrollable
      and non-scrollable states)
- [x] Real-browser tests (`storybook` Vitest project, 8 stories) covering keyboard-reachability,
      genuine scrollability, and the fits-content/no-tab-stop case
- [x] Live-verified: hover-to-reveal scrollbar (default `scrollbarVisibility="hover"`), real wheel
      scrolling (vertical and horizontal), both scrollbars + corner together, dark mode, `dir="rtl"`
      (scrollbar/corner reposition automatically via Radix, confirmed scrolling still works), all 5
      sizes, `variant="ghost"` embedded in a `Card` with no doubled border
- [x] `pnpm --filter @dbm-system/components run check-component-bundle-size` — 0.95KB JS /
      0.43KB CSS gzipped, comfortably within budget (comparable to `Avatar`'s 1.88KB baseline)
- [x] Full package `lint`/`typecheck`/`build`/`test` clean (one pre-existing, unrelated flaky timeout
      in `CodeBlock.stories.test.ts`, confirmed passing in isolation, not caused by this change)

## Follow-up: five real defects found by the user, live in the shipped Storybook (2026-09-29)

After the initial commit, live use in Storybook surfaced issues the original review's own
verification pass missed — checking a hover-revealed scrollbar's *presence* and *proportional
sizing* were treated as one confirmation, when they're two independently-checkable things, and the
size-comparison "Sizes" story was never screenshotted with real content wide enough to reveal a
sizing bug. All five fixed same-day, re-verified live:

1. **No visible track, only a thumb.** The scrollbar lane had no background at all — fixed by
   giving `.scrollbar` `bg.track` (the same deliberately-faint token `Slider`/`ProgressBar`/`Switch`
   use for their own tracks, ADR-0016's reasoning applies identically here: the thumb carries the
   interactive affordance, the track is just a boundary guide).
2. **The thumb always rendered at the full track's length, in every orientation** — a real, more
   serious bug than #1, not just a styling gap. Root cause: `.thumb { flex: 1; }`. `.scrollbar` is
   `display: flex`, and giving the (sole) flex child its own `flex: 1` (shorthand for
   `flex-basis: 0%`, `flex-grow: 1`) makes it grow to fill the *entire* track along the main axis,
   completely discarding Radix's own proportional sizing (the `--radix-scroll-area-thumb-width`/
   `-height` CSS custom properties it computes and sets inline from how much of the content is
   actually visible). Confirmed live via `getBoundingClientRect()`: the thumb's rect exactly
   matched the scrollbar's own rect before the fix, and correctly showed ~63% (matching the real
   viewport/content ratio) after removing `flex` from `.thumb` — the default `align-items: stretch`
   still fills the thumb's cross-axis thickness with no `flex` property needed at all. This also
   explains the user's separate "extends beyond the container, gets cropped by the border while
   scrolling" report: a thumb that's always 100% of the track reads as clipped/overflowing the
   instant the track itself is inset even slightly from the frame's own edge.
3. **The scrollbar thickness scale read heavier than intended** (`size="md"`, the default, was
   12px). Revised to 4/6/8/10/12px (`xs`–`xl`) — thinner overall, and now needs its own
   component-layer token (`component/scroll-area.json`) since only two of the five steps still land
   on the shared spacing scale; see `03-token-system-spec.md`'s own "Component-layer tokens" entry.
4. **Demo content had no padding and touched the frame's border**, and used placeholder
   "activity log" strings rather than genuinely long-form text. Fixed in `ScrollArea.stories.tsx`
   only (never in the component itself, which stays an unopinionated wrapper, same as `Box`) — every
   demo now wraps its content in `padding: var(--dbm-space-4)`, and uses three lorem ipsum paragraphs
   (vertical-scroll demos) or five long `white-space: nowrap` lines built from the same placeholder
   copy (horizontal/both-axis demos).
5. **The Horizontal and Both-axes demos were artificially narrow** (`maxWidth: "20rem"`, ~320px)
   and didn't read as full, deliberate compositions the way Vertical's own full-canvas-width demo
   did. Fixed by removing the width cap entirely (the long nowrap lines overflow horizontally
   regardless of how wide the canvas is) and sizing Horizontal's own height to its content's natural
   height (no `maxHeight` at all — five lines, no vertical scrolling needed) rather than a guessed
   pixel value. Both-axes needed its own explicit, shorter `maxHeight` (`8rem`, down from the
   inherited `12rem` default): the five-line demo content's natural height landed just *under* 12rem,
   so at that height the story only ever demonstrated horizontal overflow — a real gap in the
   original story design, not just a cosmetic sizing choice, found by measuring rather than assuming
   the box would obviously overflow both ways.

A sixth issue reported alongside the other five — the Playground's `aria-label` control showing an
inert "Set string" placeholder instead of a real text field — was the same class of bug this
project has hit repeatedly (`06-engineering-standards.md` §9's Storybook checklist): an arg left
`undefined` in the Playground's own top-level `args` renders as a non-interactive placeholder.
Fixed by giving `"aria-label"` a real default (`"Scrollable content"`). That default's own second-
order effect was caught immediately by the real-browser test suite, not missed: the `Sizes` story
renders five `ScrollArea` instances side by side, and giving all five the identical inherited
`aria-label` produced five identically-named `role="region"` landmarks — a genuine
`landmark-unique` axe violation (`jest-axe`'s browser-mode equivalent), not a false positive. Fixed
by giving each size its own distinct label (`` `Scrollable content, size ${size}` ``).

Full re-verification after all five: `tsc`, `eslint --max-warnings 0`, the full unit + real-browser
(Chromium) test suites (5559 + hidden interaction stories, all passing), `pnpm build`, the
component bundle-size check (still 0.95KB JS / 0.45KB CSS, within budget), and the Foundations
token-coverage check (unaffected — no semantic token changed) all clean. Re-verified live in the
browser: track + proportionally-sized thumb in every orientation and both dark/light modes, the
Horizontal/Both/Sizes/Ghost stories' new content and sizing, and the `aria-label` control now a
real, editable text field.

## Second follow-up: track visibility, tone, and a genuine "both axes" demo (2026-10-02)

Five more changes, all at explicit direction:

1. **The scrollbar track defaults to transparent again** — reverting the first follow-up's own
   `bg.track` default, after live use showed a floating thumb with no track reads as the more
   expected overlay-scrollbar treatment. A new `showTrack?: boolean` prop (default `false`) opts
   back into the visible track; it affects only `.scrollbar`'s own background, never the thumb,
   which keeps its own styling regardless.
2. **A new `tone?: "neutral" | "brand"` prop** (default `"neutral"`) colors the thumb and, when
   `showTrack` is set, the track: `"brand"` uses `bg.brand`/`bg.brand-hover` for the thumb and
   `bg.brand-subtle` for the track — all three already-verified, existing semantic tokens, no new
   contrast check needed. Implemented as CSS custom properties defined once on `.toneBrand`
   (applied to the scrollbar element) and consumed via `var(--scroll-area-thumb-color, ...)`-style
   fallbacks on `.thumb`/`.showTrack` — the same "define per tone, consume generically" pattern
   `Table`'s own tone classes use, relying on ordinary custom-property inheritance from the
   scrollbar element down to its thumb child rather than a second class on the thumb itself.
   Verified live against both brand themes (Purple and Emerald) and both color modes — the brand
   tone correctly follows whichever brand is active, not a hardcoded purple.
3. **The demo content is no longer lorem ipsum.** Replaced with real, educational sentences about
   `ScrollArea` itself (what it is, how input/visibility work, its keyboard-accessibility model) —
   genuinely informative rather than placeholder text, and long enough (individually and combined)
   to overflow every demo's own bounds. One shared sentence array feeds both the wrapped-paragraph
   form (vertical-scroll demos) and the one-sentence-per-line nowrap form (horizontal/both-axis
   demos), so the two demo styles read as one real piece of writing rather than two disconnected
   placeholder snippets.
4. **A real defect, found as a direct consequence of fix #3:** the Playground's own `scrollbars="both"`
   previously showed only a horizontal scrollbar — its demo content's natural height landed just
   under the inherited 12rem default, so vertical content never actually overflowed. The new,
   longer educational content (seven sentences instead of five) comfortably exceeds 12rem on its
   own, so switching `scrollbars` to `"both"` in the Playground now genuinely demonstrates both
   axes without a separate, hidden height override — confirmed live via `scrollHeight`/`clientHeight`
   measurement before and after (`255 > 190` vertically, `1382 > 642` horizontally, at the
   Playground's own default `maxHeight`). The dedicated `Both axes` story's own previous `8rem`
   override (added in the first follow-up specifically to force this) was removed as no longer
   needed.
5. Added a `Tone` gallery story (neutral vs. brand, both with `showTrack` set so the track's own
   tint is visible too, not just the thumb) and extended the Playground's `argTypes`/`args`,
   `scrollAreaPlaygroundSnippet`, and `storySnippets.test.ts`'s own dedicated describe block for
   both new props.

A real mistake caught and fixed during this pass, not shipped: a first attempt at the new
`<TokenRow usage="...">` strings used backslash-escaped double quotes (`tone=\"brand\"`) — MDX
doesn't support that escape inside a JSX attribute (the same class of bug this project's own
guidelines already document, found originally on `Avatar`) and would have broken the whole Docs
page had it shipped. Caught before verifying live, fixed with single quotes instead
(`tone='brand'`).

Full re-verification: `tsc`, `eslint --max-warnings 0`, the full unit suite (5569 passing) and the
real-browser Chromium suite for `ScrollArea` specifically (9 stories, including the new `Tone`
story), `storySnippets.test.ts` (818 passing, including two new describe blocks for `showTrack`/
`tone`), `pnpm build`, and the component bundle-size check (1.01KB JS / 0.50KB CSS, a small
increase from the new props, still comfortably within budget) — all clean. Re-verified live: the
default transparent track, `showTrack` toggling a visible one, `tone="brand"` on both the thumb and
(with `showTrack`) the track, in both brand themes and both color modes, the Playground's `both`
scrollbars now showing genuine two-axis overflow, and the Docs page's Properties table and embedded
Playground panel both showing `showTrack`/`tone` in the correct position with correct defaults.

## Third follow-up: `showTrack`'s own hover/active opacity (2026-10-02)

At explicit direction: `showTrack`'s track now renders at half-opacity at rest, going fully opaque
the moment it's hovered or actively dragged — rather than one fixed opacity regardless of
interaction state.

A plain CSS `opacity` on `.scrollbar` itself was not an option: the thumb is a child of that same
element and would fade along with the track, which must stay fully opaque always. `color-mix()`
blends only `.scrollbar`'s own `background-color` toward transparent instead, leaving the thumb's
separate `background-color` declaration completely unaffected — `.showTrack`'s resting rule became
`color-mix(in srgb, var(--scroll-area-track-color, var(--dbm-bg-track)) calc(var(--dbm-opacity-50) * 100%), transparent)`,
with `.showTrack:hover, .showTrack:active` restoring the plain, fully-opaque `background-color`.

**New primitive token:** `opacity.50` (`other.json`) — the existing scale jumped `40` → `60` with
no half-opacity step; added to fill that gap rather than reusing an adjacent, numerically-wrong
step. Documented in `03-token-system-spec.md`'s `other.json` row.

**Why one selector pair covers "hovered or interacted with":** Radix sets pointer capture on the
scrollbar element at drag-start (confirmed in its own source), so `:hover` and `:active` both stay
true for the entire drag even if the pointer moves outside the scrollbar's visible bounds mid-drag
— there's no separate "actively dragging but not hovering" state to handle.

**No dedicated automated test added for the hover/active transition itself** — following this
project's own established precedent (`Breadcrumb`'s `ColourInteraction` story, which documents via
a comment that "Storybook's `userEvent` sends synthetic events, which never match `:hover`" rather
than attempting to force the state). The existing unit tests (`ScrollArea.test.tsx`) already cover
`showTrack`'s class application; the opacity/hover mechanism itself is pure CSS, verified live
instead (below).

Verified live in the browser (`Tone` story, both tones, both color modes): computed
`background-color` at rest resolves to the expected 0.5-alpha `color()` value for both the neutral
and brand tracks; hovering one scrollbar with real mouse coordinates flips only that element's own
background to fully opaque (`sb.matches(':hover')` → `true`), while the other, non-hovered
scrollbar stays at 0.5 alpha — confirming per-element scoping, not a global state leak; the thumb's
own `background-color` stays solid and unaffected in both the hovered and non-hovered cases.

Full re-verification: `tsc --noEmit` and `eslint --max-warnings 0` both clean; the full unit suite
(4695 passing, package-wide) and the full real-browser Chromium suite (875 passing, package-wide)
both clean — the docs-test drift guard (`ScrollArea.docs.test.ts`) initially caught the new
`--dbm-opacity-50` reference missing its `<TokenRow>` entry in the MDX, fixed by adding one; `pnpm
build` clean; the component bundle-size check (1.01KB JS / 0.56KB CSS, a small increase from the
new rule, still comfortably within budget); the Foundations token-coverage check unaffected (no
semantic token changed, only a new primitive).

**Addendum, same day:** also at explicit direction, `.showTrack` gained
`backdrop-filter: blur(var(--dbm-space-1))` — a frosted-glass effect behind the track, layered on
top of the half-opacity treatment above. Reuses `space.1` as the blur radius rather than adding a
dedicated blur token: `Backdrop`'s own `blur` prop already uses this exact token for this exact
purpose, an established, previously-reviewed choice, not a new one. Declared once, unconditionally,
on the base `.showTrack` rule — the `:hover`/`:active` rule only overrides `background-color`, so
the blur persists through every state the track is visible in, with no separate hover-state
declaration needed. `Backdrop`'s own code comments document a real pitfall this could have hit
(combining the CSS `opacity` property with `backdrop-filter` on the same element blends the whole
blurred element back with the sharp content behind it, visibly weakening the blur) — not applicable
here, since `.showTrack` never uses `opacity`, only a pre-mixed, already-opaque `color-mix()`
`background-color`.

Verified live: `getComputedStyle` on both tracks (`Tone` story) reports `backdrop-filter: blur(4px)`
at rest; confirmed via the stylesheet's own parsed `CSSRule` that the `:hover`/`:active` rule
touches only `background-color`, so the blur isn't being re-declared or dropped in those states.
Re-verified: `tsc --noEmit`, `eslint --max-warnings 0`, the full unit suite (4696 passing — one new
token reference, `space.1`, needed its own `<TokenRow>` in the MDX, caught immediately by the
docs-test drift guard and fixed) and the full real-browser Chromium suite (875 passing), `pnpm
build`, and the component bundle-size check (1.01KB JS / 0.58KB CSS, a small further increase,
still comfortably within budget) — all clean.

## Fourth follow-up: `overscrollBehavior` prop (2026-10-02)

Raised during a question about whether `ScrollArea` could conflict with the page's own native
scrollbar — it doesn't (Radix's `Viewport` runs real native `overflow: scroll`/`hidden`, scoped to
its own element, with the OS scrollbar hidden only there, confirmed by reading
`@radix-ui/react-scroll-area`'s own source), but the investigation surfaced a genuine, undecided
nuance: with no `overscroll-behavior` set, the browser's default scroll-chaining applies — reaching
the end of a `ScrollArea`'s content and continuing to scroll hands off to whatever scrolls behind it
(the page, a parent `ScrollArea`). At explicit direction, made configurable rather than silently
picking a default either way.

New prop: `overscrollBehavior?: "auto" | "contain"` (default `"auto"`, the platform's own default —
non-breaking, matches today's existing behavior with nothing set). `"contain"` stops the chain at
this region's own boundary, for a region that should read as its own sealed-off panel (a modal's
body, a nested list) rather than a transparent extension of whatever's behind it. Scoped to two
values, not the full three-value CSS property (`auto`/`contain`/`none`) — `"none"` additionally
suppresses the overscroll *glow/bounce* effect itself, not just the chaining, which wasn't part of
what was asked; the type is additive, so a third value can be added later without a breaking change
if a real need for it shows up.

Applied as a CSS Modules class (`.overscrollContain`, a plain `overscroll-behavior: contain`
declaration — no token involved, the same reasoning `touch-action: none` on `.scrollbar` already
gets no token either), toggled on Radix's own `Viewport` — the real native-scrolling element, not
`.root`, which never scrolls itself.

Verified live (Playground story): toggling the control applies the class and
`getComputedStyle(viewport).overscrollBehavior` resolves to `"contain"`; confirmed back to `"auto"`
at the default with no class applied. Full re-verification: `tsc --noEmit`, `eslint --max-warnings
0` both clean; the full unit suite (4699 passing — two new tests for the viewport's class
application, mirroring `showTrack`'s own pattern) and the full real-browser Chromium suite (875
passing) both clean; `storySnippets.test.ts` extended with a new describe-block case (writes the
attribute only at the non-default value, the same pattern `showTrack`/`tone` already follow); `pnpm
build` clean; the component bundle-size check (1.05KB JS / 0.59KB CSS, a small increase, still
comfortably within budget).

## Fifth follow-up: `useIsScrollable` extracted to `primitives` (2026-10-02)

Acts on the DRY opportunity flagged above, at explicit direction. `useIsScrollable` moved verbatim
to `packages/utils/src/hooks/useIsScrollable.ts` (exported from that package's own `index.ts`,
not re-exported from `@dbm-system/components`'s top-level index — it's an internal
implementation detail, not something a consumer calls directly, the same treatment
`useResolvedResponsiveValue` already gets). `ScrollArea.tsx` now imports it from
`@dbm-system/utils` instead of a local file; the local copy
(`ScrollArea/useIsScrollable.ts`) is deleted.

`Table`'s own `useScrollableRegion` now computes its `scrollable` value by calling
`useIsScrollable(containerRef, "both")` instead of its own local, near-identical
`useSyncExternalStore` logic — its separate `captionId` lookup (Table-specific, not a general
scroll-detection concern) stays local, unchanged. **`Table`'s finalized status is unchanged**: the
three-question test (`06-engineering-standards.md` §9), question 1 — does it change the
rendered/behavioral output of anything that already existed at finalization time — answers "no":
same return shape (`{ scrollable, captionId }`), same DOM, same semantics, same subscription
behavior (both `useSyncExternalStore` calls already ran their own independent `ResizeObserver`
subscription before this change, since React manages each call's subscription separately even when
given the same `subscribe` function reference — so the observer count is unchanged too). A pure
internal refactor, not a design decision.

Verified live in both consumers, not just via the test suite: `ScrollArea`'s `Vertical` story still
becomes a correctly tab-reachable, named `role="region"` once genuinely overflowing
(`scrollHeight`/`clientHeight` 387/190); `Table`'s `Sticky header` story, same check, same result
(716/286, `aria-label="Recent invoices"`). Full re-verification: `tsc --noEmit` and
`eslint --max-warnings 0` clean in both `primitives` and `components`; the full unit suite (4699
passing — identical count to before the refactor) and the full real-browser Chromium suite (875
passing — also identical) both clean, confirming zero behavioral drift in either consumer; `pnpm
build` clean in both packages; the component bundle-size check shows a genuine size *improvement*
from deduplication, not just no regression — `ScrollArea` 0.85KB JS (down from 1.05KB) and `Table`
2.34KB JS (down from its 2.57KB Finalized baseline), both still comfortably within budget; the
Foundations token-coverage check unaffected (no tokens touched).

## Final pre-Finalization review (2026-10-02)

A fresh, full pass against the `06-engineering-standards.md` §9 checklist — not just trusting the
prior rounds' own partial re-verifications, since five follow-ups had landed since the original
build. Two real gaps found, both fixed in this pass; everything else re-confirmed clean.

1. **No StrictMode test existed**, despite `useIsScrollable` genuinely subscribing from a mount-time
   effect (`useSyncExternalStore` + `ResizeObserver`) — the checklist's own StrictMode item applies.
   Added `"still detects overflow under StrictMode, which mounts, unmounts, and remounts in
   development"` to `ScrollArea.test.tsx`, mirroring `EmptyState`'s own precedent for this exact
   checklist item. Passes — expected, architecturally: unlike `EmptyState`'s original bug (a ref
   remembering "already did this" across the remount), `useSyncExternalStore`'s own subscription
   lifecycle has no such persistent flag to desync, so there was no actual defect here, just a
   missing proof the checklist calls for.
2. **The scrollbar thumb's sub-24×24px target size (WCAG 2.5.8) had never been explicitly recorded**
   — true at every `size` step, down to 4px at `xs`. Not a defect: wheel, trackpad, touch-dragging
   the content directly, and keyboard scrolling are all equivalent ways to scroll without needing to
   grab the thumb precisely, squarely 2.5.8's own "Equivalent" exception — but the checklist expects
   this reasoning on the record, not just implicit in the CSS module's own comment about why the
   thumb has no enlarged hit target. Added a bullet to `ScrollArea.mdx`'s Accessibility section
   spelling out the exception explicitly.

Everything else re-confirmed, not re-litigated:
- **Baseline correctness**: full "definition of done" re-verified; strict TypeScript, no `any`;
  JSDoc complete on every prop including the three added since the original build
  (`showTrack`/`tone`/`overscrollBehavior`); `forwardRef`/`className`/`style`/`id`/`data-testid` all
  present; `{...props}` ordering on `Root` and `{...regionProps}` ordering on `Viewport` both correct
  (dynamic ARIA attributes spread last, nothing after them to override); zero hardcoded values (the
  CSS module's few bare keywords — `touch-action: none`, `overscroll-behavior: contain`,
  `user-select: none` — are behavior keywords with no color/spacing/etc. character, not design
  values a token would express).
- **Feature completeness**: `showTrack`/`tone`/`overscrollBehavior` round out the prop surface since
  the original build; sizes/variants/states all use the shared scales, no one-off vocabulary.
- **Accessibility**: the thumb/track color pairings were already covered by `bg.neutral`/`bg.brand`'s
  own existing, already-verified contrast rows (`03-token-system-spec.md`) — no new pairing was
  introduced by `tone`, confirmed by re-reading rather than assumed; `bg.track` itself is an already-
  documented 1.4.11 exception (the thumb, not the track, carries the state). jest-axe passes with
  zero violations in both the scrollable and non-scrollable states.
- **Responsiveness**: re-verified live at a 375px mobile viewport (`Both axes` story) — the demo
  genuinely narrows and its content correctly overflows rather than breaking or overlapping.
- **Theming**: re-verified live in all four combinations (Purple/Emerald × Light/Dark) on the `Tone`
  story — computed thumb color on the `brand` scrollbar resolves to a genuine green
  (`rgb(165, 210, 201)`) under Emerald, not a hardcoded purple; the `showTrack` opacity/blur combo
  (`backdrop-filter: blur(4px)`, 0.5 alpha at rest) holds correctly in dark mode too.
- **Storybook documentation**: Docs page re-verified live (renders correctly, nothing broken by the
  five rounds of stories-file edits since original build); Properties table re-queried directly from
  the rendered DOM — all 19 props present with correct Value options, Description, and Default
  columns, including `overscrollBehavior`'s `auto` default; the native-prop disclaimer sentence and
  its `onWheel` code-example pairing both still present and matched.
- **Functional verification**: full suite re-run clean — `tsc --noEmit`, `eslint --max-warnings 0`,
  the full unit suite (4700 passing, +1 from the new StrictMode test), the full real-browser
  Chromium suite (875 passing), `pnpm build`, the component bundle-size check (0.85KB JS / 0.59KB
  CSS, within budget), and the Foundations token-coverage check — all clean.

## Finalized

**Finalized 2026-10-02.** Verified immediately before, on the final state (after the fifth follow-up
and the dedicated final review round above): `eslint` plus `tsc` clean, the `unit` project (53 tests
for `ScrollArea`; 4700 for the package), the real-browser `storybook` project (9 stories for
`ScrollArea`, including axe on every story and the two hidden interaction tests; 875 for the
package), `tsup` build, and every size and coverage check (`ScrollArea`: 0.85KB JS / 0.59KB CSS
gzipped, within budget; Foundations token coverage unaffected). Final surface: a single
(non-compound) component; `children` (required); `variant` (`bordered`/`ghost`); `size` (the shared
5-step scale); `scrollbars` (`vertical`/`horizontal`/`both`); `showTrack`; `tone`
(`neutral`/`brand`); `scrollbarVisibility` (`auto`/`always`/`scroll`/`hover`); `scrollHideDelay`;
`overscrollBehavior` (`auto`/`contain`); `maxHeight`; `dir`; `onScroll` and `viewportRef` (routed to
the real scrolling viewport, distinct from `ref`); the standard `aria-label`/`aria-labelledby`/`id`/
`className`/`style`/`data-testid` set — 19 props in total. Built on the shared `useIsScrollable`
hook (`packages/utils`, also backing `Table`'s own `useScrollableRegion`). Per
`06-engineering-standards.md` §9, don't make further changes to `ScrollArea` (code, stories, docs,
or its tokens) without asking first.

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`, else left to right, as before; the prop and its own value are unchanged. The `dir` JSDoc, the Controls description and the Docs line say so. Covered by `DirectionProvider.consumers.test.tsx`. Finalized status is unchanged: no behaviour changes without a provider, and the existing right-to-left checks were re-run.
