# 0185 — `TopNavShell` is its own small compound shell, with two helpers extracted from `AppShell` to `internal/`, over `AppShell` without a sidebar or a wrapper around it

**Status:** Accepted · **Date:** 2026-11-07

## Context
The inventory plans a top-nav application shell: a page frame with a sticky header and no sidebar. `AppShell` can already draw a shell with only a header, a main area and a footer, but its API is built around a sidebar (a rail, a resize handle, a remembered layout, an aside, a header span), so an app with no sidebar would meet about thirty props where it needs about six, and an agent composing it has more ways to call it wrongly. A second shell also needs two things `AppShell` already does well: handing focus to the new page and announcing it when the router changes, and the thin loading strip along the main area's top edge.

## Decision
- **`TopNavShell` is its own compound component** in `src/templates/TopNavShell/`, exported from the package: `TopNavShell` with `.SkipLink`, `.Banner`, `.Header`, `.SubNav`, `.Main`, `.Content` and `.Footer`. The page scrolls as a whole; the shell owns the sticky header slot (the `Navbar` inside it does not set its own `sticky`), draws a shadow under it while the page is scrolled, keeps the footer at the window's bottom on a short page, and prints as `AppShell` does ([ADR-0183](./0183-appshell-prints-the-page-without-its-navigation-chrome-over-printing-the-screen-layout-or-leaving-print-to-each-app.md)). Its banner scrolls away (it is not sticky), so the shell measures nothing.
- **The two shared helpers move to `src/internal/`**, as `05` §1 says shared code does at the second consumer: the page-change handling (`usePageChange`: focus to `<main>`, a polite announcement of the title, quiet on first render and under `StrictMode`) and the main area's loading strip (`MainBusy`). `AppShell` imports them; its behaviour does not change, and its tests, hydration, `StrictMode` and print checks are rerun.
- **`internal/` is for shared code that ships; `templates/_shared/` is for what several templates' story kits share** (demo data, a demo helper). `05` §1 says both.

## Alternatives considered
- **`AppShell` with no sidebar, documented as the top-nav shell.** Nothing new to maintain, but the dead surface (rail, resize, persist, aside) is what an agent would have to ignore, and nothing would say a top-nav app is a first-class case.
- **A thin `TopNavShell` that renders an `AppShell`.** No duplicated logic, but every top-nav app would pay `AppShell`'s bundle (about 29KB, much of it the sidebar's provider) for features it does not use.
- **Copying the two helpers and logging the debt.** Avoids touching a Finalized component, but the project's own rule is to share at the second consumer, and the copies would drift.

## Consequences
- A second shell exists, so the next shell (a docs shell, a marketing shell) can follow the same shape and use the same two helpers.
- `AppShell`'s code changes without its behaviour changing: a refactor of a Finalized component, with the maintainer's go-ahead (given with this plan) and a re-run of its checks.
- Both shells must keep the same page-change and loading behaviour: a change to one is a change to the helper.

## Related
`04-component-inventory.md` (Templates), `05-component-api-conventions.md` §1, [ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0180](./0180-appshell-grows-an-aside-a-header-span-safe-area-insets-a-public-hook-and-page-change-props-with-the-aside-a-drawer-by-default-over-hiding-it-or-stacking-it.md), ADR-0182, ADR-0183.
