# 0188 — `PageShell` leaves its header to `Navbar` and `Affix` and keeps only page-level parts, over owning the header slot's sticking, shadow and hiding

**Status:** Accepted · **Date:** 2026-11-07

## Context
[ADR-0185](./0185-topnavshell-is-its-own-small-compound-shell-with-two-helpers-extracted-from-appshell-to-internal-over-appshell-without-a-sidebar-or-a-wrapper-around-it.md) made the shell own the sticky header slot, so the `Navbar` inside it was left without its own `sticky`, and the shell drew the scrolled shadow, a hide-on-scroll, a sub-navigation row and its sticking. Each of those is something `Navbar` and `Affix` already do, and [ADR-0187](./0187-navbar-draws-a-trailing-row-that-scrolls-away-after-its-header-and-links-that-scroll-in-the-bar-with-their-own-current-look-over-sticking-every-row-or-collapsing-a-second-row-into-the-menu.md) gave `Navbar` the second row it lacked. A template composes existing components and builds no pattern of its own (`06-engineering-standards.md` §9). A wrapper around the bar also cannot stay: a sticky element sticks within its parent, so a slot as tall as the bar would stop `Navbar sticky` sticking, and a trailing row that scrolls away needs the bar to be a direct child of a tall column.

## Decision
- **The header is whatever the app puts first in the shell, a `Navbar` by default, sticking by its own `sticky`** (with its shadow, `hideOnScroll`, `stickyOffset` and a second row of links), and a custom header sticks by composing `Affix` (`<Affix asChild><header>…</header></Affix>`, a shadow from `onStickyChange` or `data-stuck`). `PageShell.Header`, `PageShell.SubNav` and `PageShell.SubNavLink` are removed, and so are the root's `stickyHeader` and `scrolledEdge`, the shell's scroll listener and `Footer`'s `variant`.
- **The shell keeps the page-level parts:** `SkipLink` (the atom), `Banner`, `Main` (with `busy`), `Content` (with `width`), `PageHeader` (until it becomes a component), `Footer` (a plain slot), page-change handling, `documentTitle`, and the frame (a column at least as tall as the window, the side and bottom safe-area insets, print).
- **The notch's top inset is published, not applied:** the root sets `--page-shell-safe-top` (and the other three), and a header that sticks under a notch pads itself with it (`<Navbar sticky style={{ paddingBlockStart: "var(--page-shell-safe-top)" }}>`). The shell cannot pad a header it does not wrap.
- **No `Affix` change:** `Affix` already sticks any element (`asChild`, `offset`, `scrollContainerRef`) and reports the stuck state for a shadow. It has no hide-on-scroll and no safe-area offset; a custom header that needs the first uses `Navbar`, and the second is the recipe above.

## Alternatives considered
- **Keep a thin `PageShell.Header` slot.** Rejected: any wrapper box breaks `Navbar sticky` and a trailing row that scrolls away; `display: contents` on it would put the banner landmark at risk for nothing the slot adds.
- **Keep the shell's own sticking for any header.** Rejected: it is the duplicate of `Navbar` and `Affix` this record removes.
- **Extend `Affix` with a shadow, a hide-on-scroll and a safe-area offset.** Rejected for now: it is Finalized, and the recipe and `Navbar` cover every need the first template had.

## Consequences
- Anything written against `TopNavShell`/`PageShell`'s header parts changes before anything is published: nothing is affected.
- A shell with no header at all, or with one that does not stick, is just a shell without one.

## Related
ADR-0094, ADR-0185, ADR-0186, ADR-0187; `06-engineering-standards.md` §9; `component-reviews/PageShell.md`.
