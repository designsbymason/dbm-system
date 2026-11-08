# 0187 — `Navbar` draws a trailing row that scrolls away after its header, and links that scroll in the bar with their own current look, over sticking every row or collapsing a second row into the menu

**Status:** Accepted · **Date:** 2026-11-07

## Context
A page often has a second row of navigation under the bar: the sections of a project, the categories of a shop. A shell had built its own for lack of one in `Navbar`, with its own current-link look, edge fades, scroll reveal, sticking and hide-on-scroll, which is a template-only copy of what `Navbar` does (`06-engineering-standards.md` §9). Three things stopped `Navbar` doing it. [ADR-0094](./0094-navbar-rows-share-one-header-and-one-menu-panel-the-root-draws-the-panel-and-links-portal-into-it-and-a-sticky-bar-sticks-above-its-leading-rows.md) lets only leading rows scroll away, since the header is the one sticky box. Every `Navbar.Links` is also copied into the phone menu, and a row of only links is removed below `collapseBelow`, so a second row of links would vanish on a phone instead of scrolling. And `currentVariant` and `rounded` are bar-wide, so the second row could not be a round, subtle look beside a bar that underlines.

## Decision
- **A `Navbar.Row` with `sticky={false}` at the end of a sticky bar is drawn after the `<header>`, as its sibling,** in a wrapper that carries the bar's root class, collapse class and direction. The header then sticks on its own while the row scrolls away under it. The page still has one banner; the row's own `<nav>` is a navigation landmark outside it, which is where a sub-navigation belongs. `className`, `style`, `ref` and `data-testid` stay on the `<header>`. A spike showed this works and that every existing `Navbar` test passed unchanged. This supersedes ADR-0094's clause that only leading rows can scroll away, and changes the one case ADR-0094 warned about: a trailing `sticky={false}` row used to stick and now scrolls away.
- **`Navbar.Links scroll`** keeps a set in the bar at every width. It is not copied into the menu panel, a row holding only such sets is not removed below `collapseBelow`, and a bar with only such sets draws no automatic menu button. The list scrolls sideways natively with no scrollbar, fades at the edge that has more links beyond it (the end edge is mirrored in right to left text; a fade never takes a click), scrolls the current link into view when the set mounts and when the current link changes, and honours `align`. Only `Navbar.Link`s are supported in such a set (a `Navbar.Group` or a `NavigationMenu` in it warns in development), since a floating list would be cut by the scroller.
- **`currentVariant` and `rounded` on `Navbar.Links`** set the look of that set's links and of a group in it, in place of the bar's. The menu panel's copy keeps the bar's. A bar can underline its main links and draw a second row as round, subtle pills.
- **No prop for a line under a row:** a row's own `variant="filled"` already draws none.
- **No new token:** the fade is `space.8` wide, as `Tabs`' is a spacing step, and the tint is the existing `bg.brand-subtle` with `text.brand`.

## Alternatives considered
- **`display: contents` on the `<header>` so rows stick on their own.** Rejected: a banner landmark on an element with that display has been dropped by some browsers, and the sibling needs no such trick.
- **Let every row choose to stick (a `sticky` on each).** Rejected: a sticky element sticks within its parent, which is as tall as its rows.
- **Collapse the second row's links into the menu like the first.** Rejected: a sub-navigation is a place the reader is, and burying it behind a button on a phone hides where they are.
- **`currentVariant` and `rounded` on `Navbar.Row`.** Rejected: a row can hold two sets that look different; the set is the unit that holds links.
- **A new template-only part in each shell.** Rejected: it is the duplicate this record removes.

## Consequences
- A bar whose last row had `sticky={false}` while the bar stuck now lets that row scroll away. Nothing is published, so no consumer is affected; the development warning that said it would stick goes.
- The `Navbar`'s root is a header plus, at most, one sibling wrapper: a consumer that wraps a `Navbar` expecting one element holds two.
- Bundle: the fades and the reveal are small; the budgets are re-run.

## Related
ADR-0091, ADR-0093, ADR-0094, ADR-0096; `06-engineering-standards.md` §9 (a template composes existing components); `component-reviews/Navbar.md`; `component-reviews/PageShell.md`.
