# 0195 — `Sidebar`'s `stickyOffset` takes any CSS length as well as a spacing step, over a custom property written in `style` or a second prop

**Status:** Accepted · **Date:** 2026-11-08

## Context
A `Sidebar` that sticks sits under a sticky `Navbar`, and `stickyOffset` is how far down it sticks. It took only a step of the spacing scale (`SpaceValue`), which fits a bar whose height is a step but not one measured in the page: `PageShell` publishes its header's measured height as `--page-shell-header-height` (for its own sticky aside), and a docs page that puts a `Sidebar` at the start of a `PageShell.Body` could not pass it. A spike showed the sidebar then stuck at the top of the window, behind the bar, and that the only way round was to override the sidebar's internal custom property (`--sidebar-sticky-offset`) in `style`, an implementation detail.

## Decision
- **`stickyOffset` is `SpaceValue | string`:** a spacing step as before (`4` is `var(--dbm-space-4)`), or any CSS length (`"var(--page-shell-header-height, 0px)"`, `"3.5rem"`), written as it is. Nothing changes for a number, including the default `0`.
- The Docs say what it is for, with the `PageShell` header's property as the example. No new token and no new prop.

## Alternatives considered
- **Documenting `--sidebar-sticky-offset` as public.** Rejected: it makes a stylesheet detail the API, and a prop is what the Controls, the types and the manifest show.
- **A second prop (`stickyOffsetLength`).** Rejected: two props for one value, and a rule for which wins.
- **Leaving the recipe to override the property.** Rejected: a page that apps copy would rely on an undocumented internal.

## Consequences
- Additive: every existing use is unchanged, so `Sidebar` stays Finalized. The Controls panel keeps its select of steps; a length is for code.

## Related
ADR-0189 (`PageShell`'s sticky aside and `--page-shell-header-height`), ADR-0190; `component-reviews/Sidebar.md`, `component-reviews/DocumentationPage.md`.
