# Toolbar

Molecule, Inputs & Forms category. Item 27 of the itemized molecule build order in
`04-component-inventory.md` (nominally ⚪, promoted ahead of its tier because `TableToolbar` builds on it).
A bar of actions that is one tab stop with arrow-key movement between its items, wrapping Radix
Toolbar (`@radix-ui/react-toolbar` ^1.1.19, new dependency). Built 2026-10-03, **Finalized 2026-10-03**
(declared by the user after the final review below and the three decisions that followed it). The decision is [ADR-0032](../adr/0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md).

## What it is

A compound component, `Toolbar` plus `Toolbar.Button`, `.IconButton`, `.ToggleGroup`, `.ToggleItem`, `.Item`,
`.Group`, `.Separator` and `.Spacer`. The root is a named `role="toolbar"`: `surface` (how the bar is drawn: `ghost`
default, `outlined`, `filled`), `variant` (every item's default look, `ghost` default), `size`,
`rounded`, `disabled`, `orientation` (a breakpoint map too), `dir`, `loop`, `fullWidth`, `align`, `overflow`
(`visible`/`wrap`/`scroll`), `sticky` (with `stickyOffset` and `scrollContainerRef`).
`Toolbar.Button` and `Toolbar.IconButton` are the atoms in the arrow-key order and take every prop of
theirs (a toggle is an icon button with `pressed`; `tooltip` labels it); `Toolbar.ToggleGroup` and
`Toolbar.ToggleItem` are a single or multiple choice in the order; `Toolbar.Item` puts any other single element
(a `Select`, a popover or menu trigger, a link) in the order; `Toolbar.Group` is a named cluster, `attached` to
fuse its buttons; `Toolbar.Separator` runs across the bar's direction;
`Toolbar.Spacer` is the `Spacer` atom. Settings reach the items through `ButtonGroup`'s context
(ADR-0025), merged with an enclosing group's. No new token: the stylesheet uses existing semantic and
primitive tokens only (the Docs page lists them, and a test keeps the list true). Adds 5.41KB JS / 2.95KB CSS gzipped
(budget 10KB; 2.41KB before the second round, which brought in `ToggleGroup`, `ButtonGroup` and `Affix`).

## Decisions made during the build

- **Wrapper parts, not automatic membership** (ADR-0032): a plain `Button` in a bar is just another tab stop,
  and the docs, a Do/Don't and a test say so.
- **`variant` is the items' look and `surface` is the bar's** (renamed 2026-10-03 from `itemVariant` and `variant`, at the
  user's go-ahead after a recommendation). The first version used `variant` for the bar (the name `Card` and `EmptyState` use for
  their own look) and `itemVariant` for the buttons, which made `Toolbar` the odd one out: in the group-style molecules
  `variant` is the controls' look (`ButtonGroup`'s buttons, `ToggleGroup`'s items, `Pagination`'s controls), so an agent
  writing `<Toolbar variant="secondary">` by analogy got a type error. The bar's three values keep the shared vocabulary
  (`ghost`/`outlined`/`filled`). A breaking rename against the first two pushes, accepted because the package is unpublished
  and `Toolbar` isn't Finalized. The story "Bar variants" became "Bar surfaces", and its snippet and docs heading with it.
- **`Divider` atom not reused for the separator.** The atom is a 100%-wide or 100%-high flex box with a
  label slot and its own responsive orientation, and sets its own `role` and `aria-orientation` after its spread
  props; the toolbar needs a fixed hairline whose orientation Radix already derives from the bar's. Radix's
  `Separator` with a few lines of CSS does that, and keeps the announced orientation correct by construction.
- **Bar width is its items' width unless `fullWidth`** (the same as `ButtonGroup`). The first version filled
  its container, which stretched a two-icon bar across the page in the stories; a `Toolbar.Spacer` needs the
  bar to have room to spare, so `fullWidth` is what the Spacer story and docs set.
- **The separator is `border.neutral`, not `border.default`.** In dark mode `border.default` against `bg.surface`
  is 1.40:1 and the first screenshot showed the rule almost gone; `border.neutral` reads clearly in both. It is
  decoration either way (WCAG 1.4.11 doesn't bind a divider). The outlined bar's own border stays
  `border.default`, as `Card`'s outlined variant has it.
- **Disabled items leave the arrow-key order** (Radix's behaviour, kept). WAI-ARIA allows disabled items to stay
  focusable; this is recorded in ADR-0032 and is a call for the user if they would rather override it.

## Follow-ups after the first push (2026-10-03, user review)

Toolbar was not yet declared Finalized then, so these are part of the build, not a reopening.

- **`align` added** (`start` default, `center`, `end`), answering "how do developers align the items once `fullWidth`
  gives the bar room?". `align` is the shared name for this (`Tabs`, `EmptyState`, `Divider`); it maps to
  `justify-content`, so it follows the reading direction, and does nothing while a `Toolbar.Spacer` takes the free
  space (to put some items at each end, use the spacer). `between` was left out: the spacer says it more clearly and
  works with groups. A real-browser story measures the gap before and after the items for all three values.
- **Focus ring drawn behind the next item (reported with a screenshot).** Flex items paint atomically in source order,
  so a later item's background covers the part of an earlier item's ring that overlaps it (the ring reaches a 4px offset plus a 2px line, 6px,
  past the item, and the gap is 4px). Fixed as `ButtonGroup` does it: the focused item is positioned (`position: relative`,
  `z-index: base`), which paints above static siblings. The same bug was in the first push, and the keyboard story
  (which checked the ring exists) could not see it; a new story asserts the ring reaches past the gap and that the
  focused item is positioned and its neighbour is not, and fails when the rule is removed. A screenshot of the fix
  could not be taken (the browser pane was hidden), so it rests on that computed-style check plus the user's own eyes.
- **"Show code" snippets re-read against each story, and rewritten to match.** Found: Item variants showed a "Save"
  primary button the story doesn't draw; Responsive left out `variant="secondary"` (then called `itemVariant`); RTL, Labelled and the Playground
  showed two icons where the stories draw three icons, a rule and a Link; Sizes and Rounded showed two icons; an unused
  `basic` snippet had no story. Each snippet now writes out exactly what its story renders (the shared demo bar is
  spelled out in every one), except where the story's own point is a set of values (Item variants, All sizes), which
  show one instance and name the others in a comment. Read back from the live Docs page after it settled (all 16
  panels present), and typechecked against the real components with a planted bad prop to prove the check bites.
  A guard that compares snippets to stories automatically wasn't built: the two can't be compared mechanically
  (the stories are components, the snippets text), so this stays a by-eye check at review time.

## Review checklist (06 §9), run on 2026-10-03

- **Baseline**: strict types, no `any`; JSDoc on the component, every prop and every part; `forwardRef` on every part
  (`Toolbar.Item` forwards to the element it wraps); `className`/`style`/`id`/`data-testid` on the root; `{...props}` spread before
  the computed `role`, `aria-orientation`, `data-orientation` on the root and the group's `role` (a test passes the
  same-named props and reads the result); no hardcoded value; dev warning once for a missing name, on the bar and
  on a group; SSR-safe (the only browser access is `useResolvedResponsiveValue`'s guarded `matchMedia`); survives
  `StrictMode` (a test); no `labels` object, so no `mergeDefined`.
- **Composition checkpoints**: sub-part completeness (each part has JSDoc, a ref and a native-props story or prose);
  atom reuse (`Button`, `IconButton`, `Spacer`; `Divider` considered, see above); Radix prop audit against
  `ToolbarProps`' whole chain (`orientation`, `dir`, `loop` exposed; `asChild` on the root not, since the bar is its own
  element); consumed atoms: no defect found, `Button` and `IconButton` unchanged; **nested providers tested both
  ways** (a bar inside a disabled `ButtonGroup`, a `ButtonGroup` inside a disabled bar keep the outer settings);
  cross-part wiring (group and bar names are separate, nothing to id-wire); **composed tab order tested** (one tab
  stop in, one out, focus returning to the last-used item, a plain `Button` skipped).
- **Accessibility**: jest-axe clean for the full bar, vertical, outlined, filled, disabled and link-item forms, and the
  browser project's a11y scan on every story; arrow keys, `Home`/`End`, `loop={false}`, vertical (up/down only),
  `dir="rtl"` (left goes forwards) all tested; **a disabled or loading item that held the tab stop** leaves the bar
  reachable (found by writing the test, then mutated to confirm it bites); target size measured at all five sizes in a real
  browser (≥ 24 × 24px); a pressed toggle is announced with `aria-pressed` and drawn with a filled icon, not colour alone.
- **Responsiveness / RTL / forced colours**: a phone-width story asserts the column and the resolved
  `aria-orientation`; a real-browser story checks the first item sits at the right in `dir="rtl"` and the arrow
  pointing left goes forwards. Forced colours: the separator is a background colour, which forced colours recolours,
  and an outlined bar's border is a real border, so no extra rule was needed (not separately emulated).
- **Design quality, looked at**: all sizes, groups and separators, the spacer, vertical, in light/purple and
  dark/emerald. Findings fixed above (full-width stretch, faint dark separator).
- **Storybook**: Docs page in the 10-section template; Playground first, every prop live; three Properties tables
  (root, `Toolbar.Item`, `Toolbar.Group`, the last two on hidden docs-only stories per ADR-0013) with every
  description and default present, checked in the running page; a hand-written snippet under every story's "Show code",
  typechecked against the real components with a planted bad prop to prove the check bites; a docs test holds the
  token table to the stylesheet in both directions; hidden real-browser stories for keyboard focus ring, RTL, layout
  (spacer pushes to the far end, the rule has size), target size, vertical, phone and pressed state.
- **Verification run**: `pnpm lint` (eslint, both typechecks), `pnpm test` 5,200 tests, `pnpm test:storybook` 990 tests,
  `pnpm -r build`, `check-component-bundle-size`, `check-foundations-token-coverage`, `pnpm audit` (the one accepted,
  documented advisory only). Mutation checks: breaking the vertical flex direction and the separator width failed three
  browser stories; dropping `disabled` from the roving item failed two unit tests.

## Found along the way (not component defects)

- **Adding a dependency while Storybook is running leaves its pre-bundle cache serving two copies of React** to the new
  package ("Invalid hook call … reading 'useMemo'" from `Toolbar`), though the Vitest browser run passes. A plain restart did
  not clear it; deleting `packages/components/node_modules/.cache/storybook` and restarting did. Worth knowing for the next
  new Radix package.
- `react-hooks/refs` rejects a "warn once" helper hook that reads a ref during render; the established inline form
  (as in `ButtonGroup`) passes, so the warning is written inline in each of the two places.
- Radix's `Separator` leaves `aria-orientation` off a horizontal one (the ARIA default), so a test asserts
  `data-orientation` for that case.

## Gaps named, not built

- **`Toolbar.ToggleGroup`**: a `ToggleGroup` in a toolbar is a second roving-focus group; Radix has a special part for
  it. Toggles are covered by `pressed` icon buttons for now.
- **Overflow menu** (items that don't fit collapse into a "…" menu): `wrap` and an `orientation` map cover narrow screens;
  an overflow menu needs the `Menu` organism.

## Second round: the review's feature gaps (2026-10-03, at explicit direction)

Seven items from the gap list, built the same day. Still not declared Finalized.

- **A `Select` or popover trigger in `Toolbar.Item` (gap 1) — verified, then tested, not changed.** A probe first: a
  `Select` and a `Popover.Trigger` both work through `Toolbar.Item` as it was: reached by the arrow keys, opened with
  `Enter`, focus returned on `Escape` or on choosing, arrows resuming along the bar. So the gap was the missing proof and
  docs, now unit tests (both), a story, a snippet and a Docs section. One limit, documented rather than fixed: in a vertical
  bar a `Select`'s own `ArrowUp`/`ArrowDown` open its list instead of moving along the bar (the trigger takes them).
- **`Toolbar.ToggleGroup` and `Toolbar.ToggleItem` (gap 2)**, [ADR-0033](../adr/0033-toolbar-togglegroup-is-togglegroup-with-its-own-roving-focus-turned-off.md):
  `ToggleGroup` gained a public `rovingFocus` prop (additive, see [ToggleGroup.md](ToggleGroup.md)) and the toolbar wraps it
  with its own size, rounded, orientation, dir and disabled. The first draft of the "one tab stop" test passed even with the
  group keeping its own roving focus (it only tabbed *into* the bar); a mutation showed it, and the tests now press `Tab` from the
  item before the group and expect to leave the bar, in jsdom and in Chromium.
- **`Toolbar.Group attached` (gap 3)** renders a `ButtonGroup`, so the fused look, separators and focus lift are not
  copied; the bar's settings reach it through the shared context, and the bar's orientation is passed down. A group with no
  name warns once from the component that renders it (`Toolbar.Group`, or `ButtonGroup` when attached).
- **`sticky` with `stickyOffset` and `scrollContainerRef` (gap 5)** composes `Affix` the way `Alert` does. A sticky bar gets a
  surface (`bg.surface`; a filled or outlined bar keeps its own) so what scrolls beneath doesn't show, the one-pixel marker is
  pulled up, and a shadow shows while stuck (light and dark pair, as `Card` and `Alert`). A real-browser story scrolls a box and
  checks `data-stuck`, the shadow and the stuck position.
- **`IconButton` `tooltip` (gap 7)**, an atom change: see [IconButton.md](IconButton.md).
- **`overflow` replaces the boolean `wrap` (gap 8).** `wrap` shipped in the first push; `visible`/`wrap`/`scroll` are mutually
  exclusive, and two booleans for them is the flag pile `06` §2 warns about, so it became one prop. This is a break against
  the first push, accepted because the package is unpublished and `Toolbar` isn't Finalized. `scroll` keeps one line (or one
  column) with a scroller, edge fades and start/end buttons: the bar sits in a frame that carries the surface (outlined, filled,
  sticky) and is the positioning parent for the fades and buttons, which must be outside the scroller. The buttons are for a
  pointer only: out of the tab order, `aria-hidden`, and a press never takes focus (so nothing loses focus when one disappears
  at the end), because the arrow keys already move along the bar and the bar scrolls the focused item into view (see "Final review"
  below: the browser alone does not), kept clear of the fade by `scroll-padding`. Inside the scroller the focus ring is drawn inside each item (`05` §6: a scrolling box cuts off
  a ring drawn outside it). Real-browser stories cover a row, a right-to-left row (the end is the left edge; `scrollLeft` goes negative), a column, the fade and
  button opacity (read after their transition), the 24px button size, and the last item scrolling fully into view.

### Checks added this round

Nested providers both ways stay tested; a `Toolbar.ToggleGroup` disabled by the bar or by itself leaves the order; the
scroll end detection and the button's direction (including reversed in right-to-left) are unit-tested by stubbing layout
rectangles, since jsdom has none; a tooltip adds no box (buttons with and without it are the same size, in Chromium) and
opens above its button; the attached group is fused (no gap, square meeting corners, round ends) and the bar stays one tab stop
through it. Mutations that each failed a test: the toggle group keeping its own roving focus, `attached` ignored, the sticky surface
removed, the scroll-end button never shown.

### Known limits and costs

- **`useScrollEdges` was first written here as a copy of `Tabs`' `useTabsOverflow`**; on the user's go-ahead the same day it was
  extracted into `primitives` and `Tabs` moved onto it (see [Tabs.md](Tabs.md)), with `Toolbar` using direct children and `Tabs`
  its `[role="tab"]`s.
- A scrolling **column** only responds when its container has a height; `align` has nothing to do in a scrolling bar's frame
  beyond what the scroller shows.
- A sticky **ghost** bar gets an opaque surface; a transparent sticky bar over scrolling content would be unreadable.
- Disabled items still can't be focused (Radix), and there is still no overflow *menu* (needs the `Menu` organism).

## Third round (2026-10-03): rename, hidden stories, and a `Select` defect it found

- **Rename**: see "`variant` is the items' look and `surface` is the bar's" above. Everything that named the props moved with it
  (types, stories, snippets, docs page, tests, the component's own `data-surface` attribute), and the snippets were re-checked
  against the real components.
- **The interaction-test stories were never hidden.** Each carried `tags: ["!dev"]`, but through a shared object spread
  (`...hidden`), and Storybook's indexer reads `tags` only from a literal property of the story, so all 16 stayed in the
  sidebar (the Docs page was unaffected, since it embeds only what it names). Found by reading `index.json` after the user
  reported how many Toolbar stories were showing. Each story now writes `tags: ["!dev"]` itself, and `src/storyTags.test.ts`
  scans every stories file: any story named "… — interaction test" must carry a literal `!dev` tag (no other component had the
  problem). Broken on purpose once to see it fail.
- **`Select`'s dropdown wrapped its selected option in a narrow trigger.** Found through the "A select and a popover" story:
  the dropdown was exactly the trigger's width, so a 78px trigger left the bold, checked "14 pt" row too narrow and it wrapped
  to a second line while its neighbours did not. A component defect, not the story's; fixed in `Select` ([Select.md](Select.md)).

## Final review before Finalizing (2026-10-03)

A full `06` §9 pass with fresh eyes, probing what had only been reasoned about. Five findings, all fixed; two more were put to
the user (the `Toolbar.ToggleGroup` default look and where `className`/`ref` land in scroll mode) and are not changed.

- **Arrow-key focus did not reliably bring an item into view in `overflow="scroll"`; the docs said it did.** A browser scrolls a
  focused element into view only when it is *completely* hidden, so an item cut off behind an edge fade stayed cut off (a probe
  stepping through eight items left one 8px and one 37px clipped with `scrollLeft` unchanged; only fully hidden items scrolled, and
  then centred). Fixed with a reveal-on-focus step like `Tabs`' `revealTab`: rectangle-based `scrollBy` (so it is right in
  right-to-left and never scrolls the page), keeping the bar's own `scroll-padding` (the fade's width) clear on each side, run after
  the browser's own scroll, and only for focus that lands inside the bar (a portaled `Select` list bubbles its focus through React
  too). Real-browser stories step through every item, forwards and back, in a row and in right-to-left, asserting each ends up fully
  inside and clear of the fades; both fail when the fix is removed. The vertical story passes with the fix removed, because
  Chromium scrolls a column natively in that geometry, so it is a guard rather than a proof for columns. Four places that said
  "the browser scrolls it into view" were corrected.
- **The separator was invisible in forced colours.** It is a 1px background, which forced colours replaces with the page's
  (measured: white on white). Fixed with a `@media (forced-colors: active)` rule naming a system colour; a filled bar and a stuck
  sticky bar, which are told from the page by fill and shadow alone, get a one-pixel outline in its place; the edge fades (backgrounds)
  are dropped, and the scroll buttons, real controls, remain. A story emulates forced colours in Chromium and checks all three. The
  story that had been named "Pressed and separator, themes" never emulated anything; renamed to what it checks.
- **`Toolbar.Separator` let `role` and `aria-orientation` props replace its own** (`05` §3's bug class; Radix sets them before
  spreading). Set after the spread, from the bar's orientation (a horizontal separator leaves `aria-orientation` off, the ARIA
  default). Tested with both orientations; fails when removed.
- **Tooltips in a bar did not share a skip delay.** Each icon button's `Tooltip` made its own provider, so moving from one icon to
  the next waited the full delay again. The bar now wraps its content in a `TooltipProvider` with a standalone tooltip's own delays
  (700ms, 300ms skip), unless an app's `TooltipProvider` is already in charge, which then wins. Two tests, each failing under its own
  mutant (no provider; a provider always nested). The first closes the opened tooltip with `Escape` and hovers the next, since
  Radix's pointer-grace area never resolves in jsdom.
- **The scroll buttons showed no hover on a `filled` bar** (their hover fill, `bg.neutral-subtle`, is the bar's own fill); one step
  on (`bg.neutral-subtle-hover`) there. A synthetic pointer never matches `:hover`, so the story reads the stylesheet rule.

Also checked clean: jest-axe in six modes (plain, scroll, sticky, scroll+sticky column, wrap in right-to-left, disabled), all under
StrictMode; every icon, toggle and select target at least 24 × 24px at all five sizes; a disabled bar disables a `Select` inside
`Toolbar.Item` (Radix hands `disabled` down through the slot); the dark/emerald toggle group.

Not covered: only Chromium was run (the hidden scrollbar and `:dir()` are untested in Safari and Firefox), and real touch scrolling.
`Select` and `IconButton` differ by 1px at `xl` (60 and 61), which predates this component.

## Decisions after the final review (2026-10-03, at the user's go-ahead)

- **`Toolbar.ToggleGroup` defaults to `variant="subtle"`** (a plain `ToggleGroup` stays `outlined`; an explicit `variant` still wins).
  Bordered toggle items read heavy beside a bar's ghost items, and every story had been overriding it. The stories and snippets
  now show the default and no longer write `variant="subtle"`; the Docs page says the default differs from `ToggleGroup`'s.
- **`overflow` defaults to `scroll`** (was `visible`): a bar that doesn't fit scrolls instead of spilling out of its container. A bar
  that fits looks and behaves as before, but it is now always a framed scroller: its surface classes are on the frame, it has
  scroll buttons that appear only when there is more, and its focus rings are drawn *inside* each item (a scrolling box cuts off a
  ring drawn outside it), where `wrap` and `visible` keep the usual outside ring. All 46 real-browser stories passed unchanged under
  the new default; four unit tests that had assumed the bar carries the surface classes were reworked to check both modes.
  `wrap` and `visible` remain, written out explicitly.
- **Where `className` and `style` land** was decided as "document only" while `visible` was the default. With `scroll` the default
  it would have put every consumer's margin or width *inside* the frame, so they now go on the **outermost box** (the toolbar
  element, or the frame while it scrolls) and behave the same whatever `overflow` is; `ref`, `id`, `data-testid` and the `aria-*`
  props stay on the element that is the `toolbar`. Documented on the props and the Docs page, and tested in both modes. A small
  step beyond the recorded decision, taken because the default change altered its premise; easy to revert to inner-bar-only.
- Each of the three has a test that fails on its mutant (toggle default back to `outlined`; `className` on the inner bar;
  default back to `visible`).

## Finalized, 2026-10-03

Declared by the user after the final review and its three follow-up decisions (subtle toggle-group default, `scroll` as the
default `overflow`, `className`/`style` on the outermost box). State at declaration: lint clean; 5,274 unit and 1,011 real-browser
tests passing; build, per-component bundle budget (Toolbar 5.48KB JS / 3.01KB CSS gzipped) and token coverage clean; CI green on
`main`. The decisions are [ADR-0032](../adr/0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md)
and [ADR-0033](../adr/0033-toolbar-togglegroup-is-togglegroup-with-its-own-roving-focus-turned-off.md). The consumed or extended
components (`IconButton`, `ToggleGroup`, `Select`, `Tabs`) each stayed Finalized through the three-question test; their own review
files hold the entries. Not covered, and not claimed: Safari and Firefox, and real touch scrolling.

Later changes get a dated entry here, and go through `06-engineering-standards.md` §9's Finalized rules (ask first, then the
three-question test).

## Post-Finalization follow-up (2026-10-10, at explicit direction) — a flaky browser check made robust

`Forced colours — interaction test` failed once in CI waiting for `data-stuck` after setting `scrollTop = 200` once at the start: a scroll position set before layout settles is clamped to 0 and never retried, and the stuck state arrives later through an `IntersectionObserver`. The assignment now happens inside the `waitFor`, so it retries. Test file only; Finalized status unchanged.

## Post-Finalization follow-up (2026-10-11, at explicit direction) — the same check failed again
`Forced colours — interaction test` timed out in CI a second time (ubuntu-24.04 only, the other image passed; not reproducible locally in ten runs, plain and under load), after the 2026-10-10 change had moved the `scrollTop` assignment inside the wait. That change repeated the *same* assignment, which makes no scroll and so no new `IntersectionObserver` entry once a first reading has been taken before layout settled. Each attempt now returns to the top and scrolls down again (up to four, about a second each), and the final assertion still fails loudly: with `sticky` turned off the test fails in about five seconds with the `data-stuck` assertion. Test file only; Finalized status unchanged.

## Post-Finalization follow-up (2026-10-12, at explicit direction) — an overflow menu
The gap this file named ("an overflow menu needs the `Menu` organism"). `overflow="menu"` keeps a horizontal bar on one line and moves the items that don't fit, from the end, into a "more" `Menu` ([ADR-0068](../adr/0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md)). New surface: the `overflow="menu"` value, `pinned` on `Toolbar.Button`, `Toolbar.IconButton`, `Toolbar.Group` and `Toolbar.ToggleGroup`, and `labels` (`overflow`: "More actions"). Additive, so the component stays Finalized under the finalization test, with a scoped mini-pass: JSDoc, a Docs variant and Properties rows, 11 unit tests, one real-browser check and the bundle budget.
- **Measured collapse:** items are measured at their natural width, then hidden from the end until the rest and the more button fit; never a `pinned` item, a `Toolbar.Item`, a spacer, or the item that has keyboard focus (a measured collapse never removes the control that has it).
- **Parts register themselves** with the bar, so the menu is built from their latest props when it opens; a toggle's state is read from the DOM, so an uncontrolled one is right. Choosing a menu item presses the real, hidden item.
- **Cost:** `Toolbar` imports `Menu` (a molecule using an organism, which `05` doesn't forbid) and its isolated bundle goes from about 5.7KB to 11.1KB gzipped JS; its own budget is 12KB.
- **Found while building it:** a hidden element has no accessible name to a role query, so the unit tests find parts by text; Radix's roving focus skips an item it can't focus (`display: none`) and the bar's own root takes focus on `Tab`, so a hidden tab stop does not trap the keyboard.
- **Found after:** the first version made the bar fill its container in this mode, which showed as the bar going full width when `overflow` was switched to `menu` in the Playground with `fullWidth` off. It is now as wide as its items up to its container, like every other mode, and the bar watches its container too, since a bar only as wide as what it shows doesn't change size when the container grows and the hidden items would not have come back.
- **Not verified:** a bar resized by dragging in a real touch browser, and right-to-left (the measuring is direction-agnostic and the menu takes `dir`, but it is not checked there).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`, else left to right, as before; the prop and its own value are unchanged. The `dir` JSDoc, the Controls description and the Docs text say so. A unit test next to the existing right-to-left one wraps the same fixture in a provider. Finalized status is unchanged: nothing changes without a provider, and the existing right-to-left tests and checks were re-run.
