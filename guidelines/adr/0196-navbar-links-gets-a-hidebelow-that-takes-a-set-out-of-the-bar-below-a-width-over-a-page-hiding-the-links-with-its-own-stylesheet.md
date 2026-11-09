# 0196 — `Navbar.Links` gets a `hideBelow` that takes a set out of the bar below a width, over a page hiding the links with its own stylesheet

**Status:** Accepted · **Date:** 2026-11-08

## Context
A page with a navigation column (a documentation page: a `Sidebar` beside the page) offers the site's links in the sidebar's menu panel on a phone, so that one menu button opens one drawer with the site's links first and the sidebar's sections under them. The header must then show neither the links nor a menu button of its own. `Navbar.Action` can leave the bar below a width (`hideBelow`), but a set of `Navbar.Links` cannot: below `collapseBelow` it moves into the bar's own menu panel behind its own button, and with `collapseBelow="never"` it stays in the bar at every width.

## Decision
- **`Navbar.Links hideBelow`** (a breakpoint step, no default): the bar's copy of the set is out of the bar below that width (`display: none`, by the stylesheet, so a server render is right at first paint). The menu panel's copy is untouched, so a bar that hides its links sets `collapseBelow="never"` and then draws no menu button, which is the point. The Docs and the JSDoc say so.
- Nothing changes for a set without it.

- While centred or end-aligned links are out of the bar, the actions take the free room (`margin-inline-start: auto`), since the links no longer do.

## Alternatives considered
- **The page hides the links with its own class.** Rejected: every page that wants this would write the same media query, and the width would not match the `Navbar`'s own steps.
- **A way to give the menu panel other content (`Navbar.PanelContent`).** Rejected for now: the sidebar's links need the `Sidebar`'s context, which the `Navbar`'s panel does not have; the sidebar's own panel can draw the site's links first (`useSidebar().inPanel`), which needs nothing new.
- **`hideBelow` on `Navbar.Links` that also removes the panel's copy.** Rejected: one prop doing two things; `collapseBelow="never"` already means no panel.

## Consequences
- Additive: `Navbar` stays Finalized.

## Related
ADR-0187 (the second row and `scroll`), ADR-0195; `component-reviews/Navbar.md`, `component-reviews/DocumentationPage.md`.
