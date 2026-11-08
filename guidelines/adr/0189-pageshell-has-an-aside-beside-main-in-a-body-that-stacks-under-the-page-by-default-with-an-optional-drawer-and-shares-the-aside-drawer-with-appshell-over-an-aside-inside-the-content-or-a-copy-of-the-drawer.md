# 0189 — `PageShell` has an aside beside `main` in a `Body` that stacks under the page by default, with an optional drawer shared with `AppShell`, over an aside inside the content or a copy of the drawer

**Status:** Accepted · **Date:** 2026-11-07

## Context
A content page often has a second column: a table of contents, filters, related links, a details panel. `PageShell` had only `Main`. An aside is a `complementary` landmark, so it cannot sit inside `<main>`, which means it cannot sit inside `PageShell.Content` (the page's width and padding live there). `AppShell` already has an aside that becomes a `Drawer` below a width, opened from a toggle, with the drawer's focus return and its close-on-resize logic; a template composes existing code and builds no pattern of its own (`06-engineering-standards.md` §9), so the new aside reuses that.

## Decision
- **`PageShell.Body`** is the page's width and padding (`Content`'s `size`, `paddingInline` and `paddingBlock`) and a two-column grid holding `PageShell.Main` and `PageShell.Aside`. A page with no aside keeps `Content` inside `Main`, as before; a page with one puts `Body` around `Main` and `Aside` and no `Content`, so nothing is padded twice.
- **`PageShell.Aside`** is an `<aside>` beside `<main>`: `side` (`end` by default, or `start`; the layout follows the DOM order the writer chose and nothing reorders by CSS), `width` (a CSS length, default the existing `app-shell.aside-width` token), `sticky` (it stays in view under the header while the page scrolls, and scrolls inside itself when taller than the window, a tab stop while it does), `stickyOffset`, `collapse` (`stack`, the default: below the step it drops under `Main` as a block, in DOM order, with no state; or `drawer`: it leaves the page and its children are drawn in a `Drawer`), `collapseBelow` (a breakpoint step, `lg` by default), `labels` and the landmark's name (a development warning when it has none).
- **`PageShell.AsideToggle`** opens the drawer from anywhere in the page, and shows only below the step and only with `collapse="drawer"`. Its state is on the root (`asideOpen`, `defaultAsideOpen`, `onAsideOpenChange`), as `AppShell`'s is.
- **Sticky under the header:** the root publishes `--page-shell-header-height`, measured from the first direct `<header>` child (a `Navbar`'s, whose trailing row is outside it), and `stickyOffset` defaults to it plus nothing. A bar whose height changes (leading rows that scroll away, `hideOnScroll`) is the app's to pass as `stickyOffset`.
- **The drawer is shared:** its `Drawer` content, the focus return to the toggle (only if focus is still in the drawer or has fallen to the page) and the rule that a drawer left open closes when the window grows past the step move to `src/internal/` with the breakpoint table, and `AppShell.Aside` uses them. This is a behaviour-preserving change to a Finalized component, confirmed by the maintainer, with its tests and checks unchanged.
- **No new token.**

## Alternatives considered
- **The aside inside `Content`.** Rejected: `Content` is inside `<main>`, and an aside inside `main` is not a sibling landmark.
- **Reorder by CSS for `side="start"`.** Rejected: the visual and the tab order would differ.
- **A copy of the drawer in `PageShell`.** Rejected: the duplicate this record removes.
- **A drawer by default.** Rejected: it needs state and a toggle for every page; a stack is right for a table of contents or related links, and the drawer is the opt-in for filters and details.

## Consequences
- A page with an aside changes its wrapper (`Body` for `Content`); a page without is unchanged.
- `AppShell`'s aside code is refactored; its Docs and API do not change.

## Related
ADR-0180 (`AppShell`'s aside), ADR-0188; `06-engineering-standards.md` §9; `component-reviews/PageShell.md`.
