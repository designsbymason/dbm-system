# 0199 — `TableToolbar` gets an opt-in `Filters` group that draws its filters inline and as one bottom sheet below a container width, over a per-filter sheet, a window step or a page-built sheet

**Status:** Accepted · **Date:** 2026-11-09

## Context
A bar of popover filter buttons has no room on a phone. The Data Table List Page built its own answer: below a width the two filters leave the bar and a "Filters" button opens one bottom `Drawer` holding both as sections, with "Clear all" and "Done" (`FiltersSheet`), and a `ChoiceFilter` that puts the filter's name before a button showing the choice. Both are page code beside `TableToolbar.Filter`, which a second list page would copy. [ADR-0034](./0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md) makes the bar a stateless group of parts that owns no data, and says a part grows when a consumer finds a seam missing. `Navbar` and `Sidebar` ([ADR-0091](./0091-navbar-collapses-by-a-css-breakpoint-and-draws-its-links-in-the-bar-and-in-the-menu-panel-over-measuring-its-width-or-writing-two-lists.md), [ADR-0105](./0105-sidebar-is-drawn-on-the-page-and-in-a-drawer-panel-below-a-css-step-and-the-panel-is-never-a-rail-over-measuring-its-width-or-moving-one-rendered-copy.md)) draw one set of children in two forms by a CSS step on the window.

## Decision
- **A new part, `TableToolbar.Filters`, holds `TableToolbar.Filter`s.** Above its step it draws them in a `Toolbar` (it wraps each in `Toolbar.Item` itself); below it, one "Filters" button (a `Badge` with the sum of the filters' `count`, named "Filters, 2 active") opens a bottom `Drawer` with each filter as a titled section (its `label` as an `h3`, its `children` as they are), "Clear all" (`onClearAll`, while any `count` is above zero) and "Done". Nothing changes for a bar that does not use it, so `TableToolbar` stays Finalized: the change is additive.
- **The switch is a container query on the bar's own width**, `collapseBelow` of `"sm"`, `"md"`, `"lg"`, `"xl"` or `"never"` (default `"md"`), the token breakpoints' widths. The bar becomes a size container only while it holds a `Filters` (`:has`). It is the bar's width that decides, since a table in an `AppShell` is far narrower than the window. Nothing is measured to draw, so a server render is right at first paint. An open sheet closes if the bar grows past the step (a `ResizeObserver` that runs only while it is open).
- **The group finds its filters by reading its direct children by type**, as `Navbar` finds its links. A `Filter` wrapped in another component is drawn inline and is not in the sheet, which the Docs say. The sheet's copy of a filter's controls is mounted only while the sheet is open.
- **`Filter` gains two optional props** (and two `labels` keys, `named` and `before`)**:** `value` (the button shows the choice, "All" or "2 selected", and is named "Status: All") and `labelPlacement` (`"inside"`, the default, or `"before"`, the name drawn as plain text before the button). Together they draw what the list page's `ChoiceFilter` drew.
- **The words are a `labels` object** (`group`, `button`, `activeCount`, `title`, `description`, `clearAll`, `done`), merged with `mergeDefined`, and counts go through `formatNumber` ([ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)).

## Alternatives considered
- **A `presentation` map on each `Filter`** (the guidelines' pattern for a floating panel with a touch form). Rejected for now: two filters would be two sheets, and the page needs one sheet with both. It can still be added later, additively.
- **A window step**, as `Navbar` and `Sidebar` have. Rejected: it follows the window, so a table beside a sidebar would keep its inline filters at widths where they do not fit.
- **Measuring the bar in JavaScript for any length.** Rejected, as in ADR-0091: a first paint that differs from the measured one, for a width the author knows. The cost is steps instead of any length.
- **Each filter registering itself with the group.** Rejected: more state and renders for a limit (a wrapped filter is not found) the Docs can state.
- **Leaving the sheet as page code.** Rejected: a second list page would copy it, which is the finding that made the template rule.

## Consequences
- `TableToolbar`, and so `DataTable`, carry `Drawer` in their bundles once the compound is imported, so their budgets in the bundle check rise.
- A container query cannot take a custom length, so the list page's 45rem becomes `md` (48rem).
- The sheet's focus, scrim, scroll lock and `Escape` are `Drawer`'s; a window resize across the step hides a focused inline filter with the rest of the form, as any responsive layout does.

## Related
`04-component-inventory.md` (item 28), `component-reviews/TableToolbar.md`, `component-reviews/DataTableListPage.md`, ADR-0034, ADR-0053, ADR-0061, ADR-0091, ADR-0105, ADR-0021.
