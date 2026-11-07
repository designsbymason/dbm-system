# 0186 — The top-nav shell is renamed `PageShell`, over keeping `TopNavShell` or renaming `AppShell` as well

**Status:** Accepted · **Date:** 2026-11-07

## Context
[ADR-0185](./0185-topnavshell-is-its-own-small-compound-shell-with-two-helpers-extracted-from-appshell-to-internal-over-appshell-without-a-sidebar-or-a-wrapper-around-it.md) named the second shell `TopNavShell`. The name says "a shell for the top navigation", but the component frames the whole page: a skip link, a banner, a header slot, the one `<main>`, a footer, page-change handling and a loading state. The navigation is a `Navbar` the app puts in it, and the shell's own header work is being moved onto that `Navbar` (the restructure plan in `component-reviews/PageShell.md`), so the name described the least of what the shell does. Nothing is published, so a rename costs only the files it touches.

## Decision
- **The shell is `PageShell`**: its folder, files, exports, Storybook titles (`Templates/Application shells/PageShell`), CSS custom properties (`--page-shell-*`) and review file all use that name. Its behaviour does not change in this step.
- **`AppShell` keeps its name.** It is Finalized, "app" is the name people reach for, and renaming both would cost more than the confusion it removes.
- **Each shell's Docs open with one line saying which to choose:** a sidebar means `AppShell`, none means `PageShell` (`04-component-inventory.md`).
- **ADR-0185 is not edited.** It keeps its title and filename as the record of the first decision; this record supersedes the name only, and the decisions in it stand until a later record changes them.

## Alternatives considered
- **Keep `TopNavShell`.** Rejected: the name points at one slot, and the shell will no longer draw that slot's behaviour itself.
- **`SiteShell`, `HeaderShell`.** Rejected: `SiteShell` suggests a content site, and `HeaderShell` describes the header, not the frame.
- **`DashboardShell` or `SidebarShell` for `AppShell`.** Rejected for now: "dashboard" names a kind of page (and a dashboard page template is planned), and renaming a Finalized component for symmetry can wait until the pair is seen side by side.

## Consequences
- Any code or note that names `TopNavShell` is stale; the ADR index and ADR-0185 keep the old name only as history.
- The package's public exports change before anything is published, so no consumer is affected.

## Related
ADR-0179, ADR-0184, ADR-0185; `04-component-inventory.md` (Templates); `component-reviews/PageShell.md`.
