# 0194 — `AppShell` owns the sticking of its banner, header and sticky footer in `scroll="page"`, because they share a grid with the sidebar, over delegating it to `Navbar` and `Affix` as `PageShell` does

**Status:** Accepted · **Date:** 2026-11-08

## Context
ADR-0188 left `PageShell`'s header to the `Navbar`'s `sticky` and to `Affix`, and removed the shell's own sticking, shadow and hiding. A review of `AppShell` under the same rule asked whether its sticky banner, header and footer, and its `scrolledEdge` shadow, are the same duplicated pattern.

## Decision
- **They are not, and they stay the shell's.** In `scroll="page"` the banner, the header, a sticky footer and the sidebar share one CSS grid. A sticky box only stays in view inside a grid area as tall as the shell, so the shell measures each part and gives it a row of that height (`useElementHeight`, the `--app-shell-*-height` properties, `useAppShell()`). `Navbar sticky` and `Affix` stick within their own parent, which in this grid is only as tall as the part, so they cannot do it; this was found when the shell was first built (the header scrolled away until the shell took over). `PageShell` has no grid and no sidebar, and its header is a direct child of one tall column, which is why its `Navbar` sticks itself.
- **The `Navbar` inside is still a real `Navbar`.** `AppShell.Header` is a slot (a `div`, or `as="header"`), not a bar. In `scroll="page"` a `Navbar` with `sticky` and `hideOnScroll` inside it works: the shell keeps the slot in view and the bar slides out inside it (a real-browser check holds it). In `scroll="content"` the header never scrolls, so they change nothing (a check holds that too).
- **`scrolledEdge`** marks content scrolling under a header that does not itself stick, the default `scroll="content"` case; `Navbar`'s shadow means "this bar is stuck". They use the same `shadow` tokens and mean different things, so the shell keeps its own.

## Alternatives considered
- **Delegating to `Navbar sticky` or `Affix`.** Rejected: they cannot span the grid.
- **A wrapper box around the header** (ADR-0188's finding): breaks sticking.
- **Moving `scrolledEdge` into `Navbar`.** Rejected: a different state, and `Navbar` in `scroll="content"` has nothing to stick.

## Consequences
- The two shells differ on purpose, and the Docs say why. Nothing in `AppShell` changes.

## Related
ADR-0182 (the layer ladder), ADR-0188; `component-reviews/AppShell.md`.
