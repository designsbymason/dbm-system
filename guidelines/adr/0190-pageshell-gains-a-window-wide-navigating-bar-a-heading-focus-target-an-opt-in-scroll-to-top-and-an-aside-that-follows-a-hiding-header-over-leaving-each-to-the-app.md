# 0190 — `PageShell` gains a window-wide navigating bar, a heading focus target, an opt-in scroll to top and an aside that follows a hiding header, over leaving each to the app

**Status:** Accepted · **Date:** 2026-11-08

## Context
Four things every app with `PageShell` ended up writing itself: a sticky aside that stays clear of a `Navbar` which slides away (`hideOnScroll`) rather than at a fixed offset; moving focus to the page's heading, not the whole `<main>`, after a page change; scrolling the window to the top on a page change; and a loading bar for the window while the router is between pages (`busy` only draws along the top of `<main>`, which is not there yet).

## Decision
- **The aside follows a hiding header.** `Navbar` draws `data-away` on its `<header>` while its bar is slid out of view (additive; nothing it draws changes). The shell reads it with the observer it already has on the header, and publishes `--page-shell-header-height` as zero while it is set; a sticky aside's `top` eases with the motion tokens (none under reduced motion). No scroll listener.
- **`focusTarget`** on the root: `"main"` (default, as before) or `"heading"`, which focuses the first `h1` inside `<main>` (made focusable for the moment) and falls back to `<main>`. The announcement is unchanged.
- **`scrollToTopOnChange`** on the root, default `false`: the window scrolls to the top (instantly) on a page change. It is an optional parameter of the shared `usePageChange`, which `AppShell` does not pass, so `AppShell` is unchanged.
- **`navigating`** on the root: the same loading bar `busy` draws (`MainBusy`), fixed along the top of the window above the header, with the same polite "Loading" announcement. `busy` stays for a page that is reloading its content.
- **No new token and no new component.** A table of contents in the aside is the existing `TableOfContents`; the dismissible banner, the not-found and error pages and the full-bleed section are Docs recipes over existing components.
- **Deferred:** a hide-and-show toggle for the aside on a wide window, with remembered state (persisting an open drawer across a reload was rejected: an overlay must not reopen on load).

## Alternatives considered
- **A scroll listener measuring the header's visible height.** Rejected: work on every scroll for what one attribute says.
- **A route-progress part (`PageShell.Progress`).** Rejected: a prop on the root reuses the bar and the announcement already there.
- **Always focus the heading.** Rejected: a page with no `h1` or an app that chose `main` would change behaviour.

## Consequences
- All additive: an app that sets none of them sees no change; `PageShell` and `Navbar` stay Finalized, each addition with its own scoped checks.

## Related
ADR-0188, ADR-0189; `component-reviews/PageShell.md`.
