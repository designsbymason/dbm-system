# Drawer — review findings

Fourth organism, built 2026-10-11 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Finalized 2026-10-11**, with the items under "Open at Finalization" accepted as open: none changes the component.

## Decisions
- A sibling of `Dialog` and `AlertDialog` ([ADR-0053](../adr/0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md)) on the same Radix Dialog ([ADR-0052](../adr/0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)).
- Draws its header, body, footer, corner button and divided lines from the shared overlay sections, with its own panel ([ADR-0060](../adr/0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md)). That extraction was a separate refactor commit of `Dialog` and `AlertDialog` first.
- `side`, a responsive map, its own size tokens, no swipe yet: [ADR-0061](../adr/0061-drawer-is-attached-to-a-logical-side-that-can-change-with-the-screen-with-its-own-size-tokens-and-no-swipe-yet.md).

## What was found while building it
- **A real press after the entrance began landed where the button used to be.** The `Select`-in-a-drawer check passed for a dialog, whose entrance moves 8px, and failed here, where the panel slides its whole width. It now waits for the panel's animations to finish before pressing (the same rule `Dialog`'s measuring checks follow).
- **Every side class sets every property its geometry reads,** including the zeros, so a larger breakpoint's side replaces a smaller one's whole; a class that set only what differed left the base's margin in place.
- **The scrim is a flex box, so the panel is pinned by automatic margins, not by `inset`.** A non-modal drawer has no scrim and is fixed to the viewport with the same margins and explicit sizes doing the pinning.

## Checks run
- 69 unit tests, adapted from `Dialog`'s and extended for the side classes and a responsive map (role, name and description with no warning, controlled use, the close reasons, `busy`, `keepMounted`, nested overlays, `StrictMode`, a role that can't be replaced, axe), 20 server-render and hydration tests (ten variants, including `keepMounted` open and closed), and a Docs-token test that reads this stylesheet and the shared one.
- 38 real-browser checks (the first 19 from the build, then the second pass and the final review): each side flush to its edge at its size, rounding and border on the inner side only, right-to-left putting `start` on the right and sliding from it, a phone leaving a 3rem sliver that a real press closes, a responsive side as a bottom sheet on a phone and a side panel from `md`, the entrance moving from the edge, a real press on the scrim and focus returning, the page locked and Tab looping, a real mouse choosing a `Select` option inside it, a confirmation stacking and answering first, the lines following the scroll, the close button following a safe-area inset, the forced-colours and reduced-motion rules, `busy`, and `keepMounted` through a real close and reopen. The side-geometry check fails with the end side's margin removed.
- 9 sub-part stories for the Properties tables (ADR-0013), `pnpm lint`, the build, `check-guidelines` and the bundle-size check.

## Second pass: the four named gaps (2026-10-11)
- **`onOpenChangeComplete`** ([ADR-0062](../adr/0062-overlays-report-when-they-have-finished-opening-and-closing-through-onopenchangecomplete.md)), shared with the other overlays.
- **A `size` that is a CSS length or pixels**, through the panel's own `--drawer-size`; a step is still a class and a token. A length `CSS.supports` rejects warns in development.
- **Swipe-to-dismiss and a grab handle** ([ADR-0063](../adr/0063-drawer-gets-swipe-to-dismiss-from-its-handle-and-header-a-size-that-can-be-a-length-and-a-back-button-recipe.md)): a touch or a pen drags from the handle or the header, the panel follows through custom properties, and the exit starts from where it was left.
- **A Back-button recipe** in the Docs, not a prop.
- **Found by the checks:** the settle-back left `data-settling` on the panel when it was released where it began (no transition runs, so `transitionend` never came), and reduced motion has the same shape; it now watches the panel's actual transitions. Also `CSS.supports` is absent in jsdom, so the size warning guards for it.
- **Checks added:** 12 real-browser checks (a long drag closing with the reason, a short one settling back with nothing left on the panel, the panel following the finger and not past its edge, a mouse and a drag away from the edge doing nothing, right-to-left, the bottom sheet's handle and its drag, no handle on a side drawer, a busy drawer not swipeable, the panel still in the page when a close starts, and a length and a pixel size). The swipe check fails with dismissal disabled.
- **A mouse can drag the handle (and only the handle)**, with a `grab` cursor and no text selection while it drags; a drag of the header stays touch and pen only. Checked with a real mouse through the Chrome DevTools Protocol, and the check fails if the header is let through.
- **Not verified:** a real finger. The events are dispatched; the interplay with a scrolling body and the browser's own edge gestures is unseen.

## Final review pass
Eight findings, all fixed:
1. **A swiped drawer whose owner keeps it open was left displaced.** The offset is kept for the exit animation, but a controlled drawer that declines to close has no exit, so the panel stayed where the finger put it (280px, in the probe). It now checks, two frames after asking to close, whether the panel is still open and settles back like a short drag does. A check with a refusing owner fails without it.
2. **The drag wrote inherited custom properties on every move,** re-resolving every descendant's style each time. The panel's own `transform` is written during the drag; the two properties the exit reads are set once, at release.
3. **`showHandle` was a dead control** for the default side. It is offered while `side` is `bottom` (a condition takes one value; a `top` drawer takes the prop all the same).
4. **A non-modal drawer's geometry is checked in a real browser:** each side flush to its edge, fixed with no scrim, the page behind it pressable with a real mouse.
5. **The close button's target size is measured** (at least 24 by 24).
6. **The handle pill measured 2.32:1 in Purple light** with `border.neutral`, under the 3:1 floor (decorative, but it is the cue for the gesture). It now uses `icon.secondary`, and a check asserts at least 3:1 against the panel in all four themes.
7. **The header and handle are offered to a touch only while the gesture is available** (not with `swipeToDismiss={false}`, not while `busy`), so they no longer take the `touch-action` and the grab cursor for nothing.
8. **This file** is current.

## Open at Finalization
- Touch and iOS behaviour (scroll lock, `keepMounted`'s move), and the safe-area insets on a real device: a desktop reports none, so they are asserted from the stylesheet and a stood-in inset, not seen.
- The Docs page and the four themes have not been looked at live in a running Storybook (the Browser pane was not displayed).
- Snap points for a bottom sheet, a resizable docked inspector and a push mode are not built (ideas, not decided against).

## Post-Finalization follow-up (2026-10-11, at explicit direction) — focus returns to what opened it
A Drawer opened from state (`open`, with no `Drawer.Trigger`) closed with focus on the page's `body`, because Radix returns focus only to its own trigger. It now remembers the element that had focus as it opened and returns it there on close, unless the caller prevented `onCloseAutoFocus` or the element is gone ([ADR-0067](../adr/0067-overlays-return-focus-to-the-element-that-opened-them-when-they-have-no-trigger-and-a-closing-scrim-lets-presses-through.md)). A defect fix under the finalization test (it violated the return-focus guidance, and changes nothing for a dialog with a trigger); re-verified: accessibility and functional verification. Tests: two unit tests (returns it; a prevented `onCloseAutoFocus` is left alone).

## Post-Finalization follow-up (2026-10-19, at explicit direction): its content is out of reach of a button group's settings
A `Button` or `IconButton` in this component's content took the settings of a `ButtonGroup`, a `Toolbar` or `Navbar.Actions` the overlay was opened from, because a React context crosses a portal (found in `Navbar`'s review: an `xs` bar's popover held `xs` buttons). The consumer's content is now wrapped in `ButtonGroupReset`, so it reads no group ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)). A defect fix with no change to the output outside a group, so `Drawer` stays Finalized. `Navbar.overlays.test.tsx` holds it: the case for `Drawer` fails when the wrapper is removed (checked for `Popover`).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`; with none, nothing changes. Its body is a `ScrollArea`, which reads the provider, so the old 'body stays left to right in a right-to-left panel' defect is gone when a provider is present. The `dir` JSDoc, the Controls description and the Docs text say so; a unit test and a real-browser check (`DirectionProvider.checks.stories.tsx`) set the direction only with a provider. Finalized status is unchanged.

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): its portalled content sets `dir` from the nearest `DirectionProvider` when it has no `dir` of its own; with none, nothing changes. The whole panel, not only a scrolling body, then reads in the provider's direction. Covered by `DirectionProvider.consumers.test.tsx` and `DirectionProvider.checks.stories.tsx`. Finalized status is unchanged.
