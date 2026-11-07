# HoverCard

Molecule, Overlay & Disclosure category. Item 25 of the itemized molecule build order in
`04-component-inventory.md` — a rich preview that opens when the pointer rests on a link or keyboard
focus lands on it, wrapping Radix HoverCard (`@radix-ui/react-hover-card` ^1.1.23, new dependency).
Built 2026-10-03, **Finalized 2026-10-03** (declared by the user, after the feature-completeness round
below and its two follow-ups). Before declaring, a last read of the component's JSDoc found the root
doc block hadn't caught up with `Media`, `HoverCardProvider` and `disabled`; fixed (documentation only).

## What it is

A compound component, `HoverCard` + `HoverCard.Trigger` + `HoverCard.Content`, in `Popover`'s
shape. The root takes `open` / `defaultOpen` / `onOpenChange` and `openDelay` (300) / `closeDelay`
(300) — `openDelay` is shorter than Radix's own 700, at explicit direction (2026-10-03, after the first
push), since 700ms read as sluggish. `HoverCard.Trigger` is a link (Radix renders an `<a>`); `asChild` swaps
in the `Link` atom. `HoverCard.Content` takes `side` (default `top`, changed from `bottom` at the same direction; a breakpoint map too, resolved in JS by
`useResolvedResponsiveValue`, as `Popover` does), `align`, `sideOffset`, `alignOffset`,
`avoidCollisions`, `collisionPadding`, `collisionBoundary`, `hideWhenDetached`, `hideArrow`,
`container` and the four dismissal callbacks. It has the same elevated-surface chrome, arrow and
fade as `Popover`, and one new component token, `hover-card.max-width` (20rem, in
`component/hover-card.json`).

Added after the first round: `HoverCardProvider`, `disabled`, `size`, `HoverCard.Media` (see "Feature-completeness round").

Deliberately **not** exposed, matching `Popover`'s own scope: `forceMount`, `sticky`,
`arrowPadding`, `updatePositionStrategy` (traced through the whole `PopperContentProps` chain, per
the Radix-primitive prop audit, not just the first layer). No `showCloseButton`, `modal`, or
`aria-label`/`aria-labelledby`: a hover card has no dialog role and is never clicked.

## Design decisions made during the build

- **The card is supplementary, and the docs say so everywhere.** Read from Radix's own source, not
  assumed: it never opens for a touch pointer (`excludeTouch`), it has no role and no accessible
  name, nothing associates it with the trigger, and an effect sets `tabindex="-1"` on every
  tabbable element inside it, so its content cannot be reached by keyboard. So it is for sighted
  pointer and keyboard users only; anything in it must also be on the page the link opens. Where
  something has to be reachable, the answer is `Popover`; for a plain hint, `Tooltip`. The Docs
  page's Do/Don't and Accessibility sections state this, and a unit test pins the `tabindex="-1"`
  behaviour so a Radix change that alters it is noticed.
- **The built-in trigger is Radix's `<a>`, with a dev warning if it can't be focused.** An `<a>`
  with no `href` isn't in the tab order, so a keyboard user could never open the card. Rather than
  invent a different element, `HoverCard.Trigger` warns once in development when it renders a plain
  `<a>` with neither `href` nor `tabIndex` (it can't judge `asChild`, whose child may already be
  focusable). `href`, `target` and `rel` are redeclared for the Properties table.
- **The built-in trigger is underlined (dotted), not bare.** Found by looking at it, not by a
  check: the first stylesheet gave the trigger `color: inherit; text-decoration: none`, and in a
  sentence (the `PlainTrigger` story) it was indistinguishable from the surrounding text until it
  took focus — no cue at all, failing WCAG 1.4.1. It now keeps a dotted underline, and a
  real-browser story asserts the underline is there and the colour is inherited.
- **`sideOffset` stays 8.** The pointer has to cross the gap onto the card within `closeDelay`;
  Radix has no bridge across it. The prop's own JSDoc says to keep it small.
- **The root's Properties table comes from a hidden `HoverCardRoot.stories.tsx`** (ADR-0013's
  pattern, as `Trigger` and `Content` have). The Playground's meta has to carry `Content`'s props
  too (one render drives both), so a table built from it listed `side`, `align`… as root props and
  omitted `open`. Seen live. **`Popover`'s Docs page has the same shape of problem** (its root table
  lists the content props and no `open`) — noticed, deliberately not touched: it is Finalized.

## Findings

- **Radix's trigger calls `preventDefault()` on `touchstart` — worked around, 2026-10-03.** Checked
  live, since a link that couldn't be tapped would be a real defect: React attaches `onTouchStart`
  as a passive listener, so the call is ignored (`defaultPrevented` stays `false`) and a tap still
  follows the link. The cost was a console error from Chrome — "Unable to preventDefault inside
  passive event listener invocation" — on each touch in development. First recorded as unfixable;
  then fixed at explicit direction: Radix composes its handler after the caller's and runs it only
  while `event.defaultPrevented` is false, so `HoverCard.Trigger` runs the caller's `onTouchStart`
  and then marks the synthetic event handled (a plain property assignment, never a
  `preventDefault()` call), which skips Radix's no-op. Nothing is lost — the call did nothing and a
  card never opens on touch. A unit test spies on `Event.prototype.preventDefault` (fails with the
  line removed), and in a real browser a dispatched `touchstart` makes zero `preventDefault` calls.
  The workaround leans on Radix's `composeEventHandlers` skipping a handler once the event reads as
  default-prevented; a Radix change to that would bring the console error back, and the test would
  not catch it (it would still see no `preventDefault` call from us), so recheck it on a Radix bump.
- **`data-state` on the trigger and content is set before Radix spreads the caller's props**, so a
  caller's own `data-state` would replace it (the bug class in `05` §3). Not guarded: it is a
  styling hook only, and this component's own CSS reads it from the content, where a caller has no
  reason to set it. Recomputing it would need the open state, which only Radix's context holds.
- **A standalone `HoverCard.Trigger` or `.Content` throws outside a `HoverCard`** (Radix's scoped
  context), which a story that only wanted to measure a style had to learn.
- **The arrow was first duplicated from `Popover`, then extracted (2026-10-03).** A second user is
  the point at which `06` §1 says to share it, and extracting it meant editing the Finalized
  `Popover`, so it waited for the user's go-ahead, which came the same day. Both now render
  `OverlayArrow` (`src/internal/OverlayArrow/`, not exported from the package), a `forwardRef`
  `<svg>` child for Radix's `Arrow asChild`, with the one stylesheet. `Popover`'s own change is
  recorded in `Popover.md`.

## Feature-completeness round, 2026-10-03 (at explicit direction, after the first push)

A gap pass listed four missing features and two unchecked environments; the user asked for the two
checks first, then all four features.

**The two checks**
- **Right to left: passes.** A real-browser check sets `dir="rtl"` on the document (where a real
  app sets it, and where the portaled card inherits it from) and measures: the card's computed
  direction is `rtl`, `align="start"` lines the card's right edge up with the link's, and
  `align="end"` its left edge. `side` stays physical, as Radix defines it (the card is on that side
  of the link in either direction). A `dir` set on an ancestor *below* `body` would not reach the
  card, since it is portaled to `body`; that is reasoned from how the DOM inherits, not measured, and
  is the same as `Popover`, with the library-wide answer still open (`01` §12, `05` §3).
- **Forced colours: one real defect, fixed.** Emulating `forced-colors: active` showed the card's
  border recoloured to `CanvasText`, but the arrow's SVG `stroke` kept its pale `border.default`,
  so the arrow's edge no longer met the card's (Chromium doesn't recolour SVG `fill`/`stroke`).
  The shared `OverlayArrow` now draws in `Canvas` / `CanvasText` under the media query, which also
  fixes `Popover`'s arrow (recorded in `Popover.md`). Standing convention added in `05` §6.

**The four features**
1. **`HoverCardProvider`** — shared timing, in `TooltipProvider`'s role. `openDelay`, `closeDelay`
   defaults for every card below it, and `skipDelayDuration` (300): while a card is open, and for
   that long after the last one closes, the next card opens at once, and only one card is ever
   open (the provider closes the previous one when another opens). It works by holding each card's
   open state in `HoverCard` itself rather than in Radix, so a card can be told to close and a
   disabled card can stay shut; Radix still gets a controlled `open`. A card's own props win over
   the provider's. A separate named export beside `HoverCard`, as `TooltipProvider` is beside
   `Tooltip`.
   - **Found by a test:** Radix runs its own close timer after the pointer leaves a trigger even
     when the provider has already closed that card, and reports it as a second
     `onOpenChange(false)`. Only a real change is passed on now (a ref of the current state).
   - Checked live in a real browser: moving from one name to the next, the second card is `open` and
     the first `closed` in the same mutation, with a 500ms `openDelay`.
2. **A bridge across `sideOffset`** — a transparent `::before` strip on the card, as long as the
   gap, so the pointer crossing it is still over the card and `closeDelay` never starts. The first
   version was wrong twice, each found by measuring the gap with `elementFromPoint`: **Radix adds the
   arrow's height to `sideOffset`** when it places the card (so the gap is the offset plus 5px, and
   the strip fell short beside the arrow), and the strip is positioned from the padding box, so it
   started one border-width inside the edge (and ended 1px short of the link). It is now the offset,
   plus the arrow when there is one, plus the border width. `left` and `right` are used on purpose
   for the two horizontal sides: Radix's `data-side` is physical. `ARROW_WIDTH`/`ARROW_HEIGHT` are
   passed to Radix explicitly so the 5 isn't an assumption about its default.
3. **`size` and `HoverCard.Media`** — `size` is the padding step on the standard scale (8, 12, 16,
   20, 24px, existing `space.*` tokens; `md` is the old fixed padding, so nothing changes by
   default). `HoverCard.Media` is a sub-part for an image or video across the top: negative margins
   cancel the content's padding on the top and sides (reading the same variable `size` sets), and its
   top corners are the card's radius less its border, so it sits inside the rounded corner.
   Chosen over a `padding="none"` flag because the point of removing padding is an edge-to-edge
   image, and a flag alone would leave the corners and the spacing below it to the caller. It
   assumes it is first; the docs say so. Measured at every size: padding, media edges against the
   card, radius.
4. **`disabled`** — never opens (pointer or focus), closes one that is open, trigger still a link;
   a disabled card doesn't warm the provider. A disabled card whose `open` is controlled `true`
   stays shut.

**Two smaller ideas, done the same day**
- **Only keyboard focus opens the card.** Radix opens it on any focus, including the one a click or
  a tap leaves on the link. A real-browser check with a synthetic touch tap (`Input.synthesizeTapGesture`, run locally)
  **confirmed the suspicion that a tap did open it**, contradicting the docs' "never opens on touch"
  (the earlier touch check only covered the touch pointer's hover, which Radix ignores). It is fixed
  by the same mechanism as the `touchstart` workaround: `HoverCard.Trigger` runs the caller's
  `onFocus`, and when the link doesn't match `:focus-visible` marks the event handled, which makes
  Radix skip its open. A browser that throws on the selector keeps Radix's open-on-any-focus. The
  tap check failed with the guard removed. **That tap check could not stay in the suite:** it needs
  screen coordinates, which depend on how the test page scales the story's frame, and it passed
  locally but missed the link on both CI images (found when CI failed after the push). The kept
  check focuses the link with `focus({ focusVisible: false })`, the same kind of focus a tap leaves,
  asserts it really isn't `:focus-visible`, and fails without the guard; the tap itself is no
  longer exercised. Unit tests stub `:focus-visible` (jsdom's depends on test
  order), and cover the caller's `onFocus` and the fallback. **The Tab half is not in that check:** a
  scripted or CDP-keyed Tab after a touch wasn't reliably `:focus-visible` in the test page, so
  keyboard opening is covered by the existing keyboard story and the unit test instead.
- **Async content is a docs pattern, not an API.** A "Loading its content when it opens" story and
  Docs example start a request from `onOpenChange` the first time the card opens, show a `Skeleton`,
  and keep the result. Its real-browser check found a real jump: the loaded content was 4px taller
  than the skeleton (a 24px and a 20px line against 44px of skeleton), so the card resized when
  the data arrived; the content now reserves `3rem` of height as well as its width, and the check
  compares the card's layout size before and after (not the drawn rectangle, which is scaled while
  the card fades in).

## Verified

- Unit: `HoverCard.test.tsx` has 52 tests, plus the Docs-page token guard and `OverlayArrow`'s own 2 — the open and close paths (mouse hover, keyboard focus and blur, Escape, the
  pointer crossing onto the card and a custom delay), both default delays with fake timers, a touch
  pointer not opening it, a pointer that leaves before `openDelay` elapsing, controlled and
  uncontrolled state, unmount clearing the timers, `StrictMode`, a responsive `side` with a live
  `matchMedia` change, the arrow, `container`, ref forwarding and pass-through on both parts,
  `asChild` with `Link` (no blocked click), the focus warning in all its cases, and axe closed and
  open (open scans the whole body, since the card is portaled; the page-level `region` rule is off
  because it is meaningless for a bare component); the provider (defaults and overrides, instant open while warm, the skip window and its end, `skipDelayDuration` 0, one card at a time, the controlled and disabled cases, `StrictMode` and unmount); `disabled`; `size`; and `Media`.
- **Several were broken on purpose to see them fail:** the default `openDelay` changed (the delay
  test failed), the `min(…, available-width)` cap removed (the phone-width story failed), the
  underline removed, the arrow's `vector-effect` removed, the `touchstart` marking removed, the
  bridge's `content` removed (all three bridge checks failed), the provider's warm check replaced
  with `false` (four provider tests failed) and `disabled` taken out (five failed).
- Real browser (Chromium, the `storybook` project): hover opens and leaving closes, Tab opens and
  Escape closes with focus kept on the link, the card stays inside a phone's width and never past
  the 20rem cap, and the built-in trigger is underlined in its inherited colour. Hidden `!dev`
  stories, so none animates on the Docs page. Added in the second round: right to left, forced
  colours, the bridge on all four sides with and without an arrow, and padding and media edges at
  every size. One of them (right to left) was flaky until it told Radix the layout had changed after
  flipping the direction (a real app sets it before mounting).
- Live in Storybook: the Docs page (every template heading, three Properties tables with every
  Default filled and no empty description, the Playground controls, every "Show code" settled and
  pasteable), a real mouse hover and a real Tab, all four themes (computed surface, text, border,
  shadow and font resolve in each; `text.primary` on `bg.surface` is the pairing already measured
  there, so no new contrast pairing), and the plain trigger on the Docs page itself (where
  Storybook's own stylesheet could have restyled it; it didn't).
- Snippets typechecked against the real components, with a planted bad prop to prove the check bites.
- Whole package: `eslint`, both typechecks, `pnpm build`, the per-component bundle-size check
  (HoverCard 1.49KB JS / 0.82KB CSS gzipped), the Foundations token-coverage check, 4,795 unit tests,
  908 Storybook-project tests, the 8 visual-regression tests, and `pnpm audit` (only the already-
  accepted `braces` advisory).

## Not checked, or open

- **A real touch device.** The touch behaviour is asserted with a synthetic touch pointer and a
  dispatched `touchstart`; a physical tap on a phone was not tried.
- **Screen readers.** Nothing in the card is announced by design; this was reasoned from Radix's
  source, not heard through VoiceOver or NVDA.
- **A `dir` set below `body`.** Not measured (see above).
- **`pnpm audit` after the second round.** No dependency changed, so it was not re-run.

## Post-Finalization fix (2026-10-04, at explicit direction) — `HoverCardProvider` leaked a cool-down timer when it unmounted with a card open

Found by a CI run (one unhandled `window is not defined` from `HoverCardProvider.tsx`, in an otherwise green unit run). When the provider unmounts with a card
open, the provider's cleanup (which clears the cool-down timer) runs first and the card's own cleanup runs after it, calling `reportClosed`, which started a new
`skipDelayDuration` timer that nothing would ever clear. In the tests it was a *real* timer, since the file's `afterEach` restores real timers before React Testing Library
unmounts, and it could fire after the test environment was torn down. In an app it set state on an unmounted provider after 300ms: harmless, but a leak.

Fix: a ref set while the provider is unmounting (reset on every mount, so StrictMode's mount, unmount, remount leaves it right); `reportClosed` starts no timer then.
Two new tests, each shown to fail with its half of the fix removed: no timer is left after unmounting with a card open, and the cool-down still happens inside
StrictMode (the next card waits again). A defect fix with no change to rendering, API or any existing behaviour, so the component stays Finalized.


## Post-Finalization follow-up (2026-10-10, at explicit direction) — a flaky browser check made robust

`Focus that isn't keyboard focus … does not open the card` failed once in CI with focus on the body and the page showing only Storybook's loading shell, i.e. the story had been re-prepared during the check's fixed 250ms wait. The sequence (find the link, focus it, wait, assert) now retries as a whole inside `waitFor`, finding the link afresh each time. Mutation-checked: with `focusVisible: true` it still fails. Test file only; Finalized status unchanged.

## Post-Finalization follow-up (2026-10-10, at explicit direction) — the entrance scale is a token
The enter keyframes held `scale(0.96)` as a literal, the same one `Popover`, `HoverCard` and `Tooltip` shared. It is now `motion.scale.96`, a primitive added with `Dialog`'s `motion.scale.98`. The value is the same, so nothing renders differently. **Finalized status unchanged** — a CSS value moved to its token, no new props, behaviour or output. Its Docs page lists the token in "Design tokens used".

## Post-Finalization follow-up (2026-10-19, at explicit direction): its content is out of reach of a button group's settings
A `Button` or `IconButton` in this component's content took the settings of a `ButtonGroup`, a `Toolbar` or `Navbar.Actions` the overlay was opened from, because a React context crosses a portal (found in `Navbar`'s review: an `xs` bar's popover held `xs` buttons). The consumer's content is now wrapped in `ButtonGroupReset`, so it reads no group ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)). A defect fix with no change to the output outside a group, so `HoverCard` stays Finalized. `Navbar.overlays.test.tsx` holds it: the case for `HoverCard` fails when the wrapper is removed (checked for `Popover`).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): its portalled content sets `dir` from the nearest `DirectionProvider` when it has no `dir` of its own; with none, nothing changes. The whole panel, not only a scrolling body, then reads in the provider's direction. Covered by `DirectionProvider.consumers.test.tsx` and `DirectionProvider.checks.stories.tsx`. Finalized status is unchanged.
