# 0200 — `DataTable.Pagination` gets an opt-in `centered` layout that goes to stacked rows below a container width, over compound footer parts, a window step or a page-built footer

**Status:** Accepted · **Date:** 2026-11-10

## Context
`DataTable.Pagination` draws the range and the page size select at the start and the page controls at the end, wrapping when there is no room. The Data Table List Page wanted another arrangement (the select at the start, the controls centred whatever the range says, the range at the end, and on a phone the controls first and the select and range at the two ends under them) and drew it by hand from `Select` and `Pagination`, with a status region of its own for a change of page size. A template that copies a component's job is a finding (`06` §9), and a second list page would copy it again. The hand-drawn footer's announcement turned out to be unnecessary: `DataTable` already announces a change of page size itself ("Showing 25 of 37 rows") when the part calls the table's `setPageSize`, which the part does and the page's own `Select` did not. [ADR-0199](./0199-tabletoolbar-gets-an-opt-in-filters-group-that-draws-its-filters-inline-and-as-one-bottom-sheet-below-a-container-width-over-a-per-filter-sheet-a-window-step-or-a-page-built-sheet.md) decided the same question for the filters: a container query on the bar's own width, over the window's.

## Decision
- **`DataTable.Pagination` takes `layout`**, `"split"` (today's, the default) or `"centered"`: the select at the start, the page controls centred, the range at the end, three columns whose outer two are equal so the controls stay centred whatever the range says. `showSummary` and `showPageSize` leave their column empty. Nothing changes for a footer that does not ask, so `DataTable` stays Finalized: the change is additive.
- **`collapseBelow`** (`"sm"`, `"md"`, `"lg"`, `"xl"` or `"never"`, default `"md"`, the same type and default as `TableToolbar.Filters`) applies to `centered`: below that width of the footer the controls take the first row and the select and the range sit at the two ends under them.
- **The switch is a container query on the footer's own width.** In `centered` the part draws a wrapper box that is the container (an element cannot query itself), and `className` and `style` go on that outermost box; in `split` the DOM is as it was. The whole table is not made a size container.
- **The announcement stays `DataTable`'s.** The part drives `table.setPageSize`, so a change of page size is announced with `labels.rowsShown`; a page that draws its own footer loses it, which is the reason to use the part.

## Alternatives considered
- **Compound parts for the footer** (`DataTable.PageSize`, `.Range`, the controls) placed by the app. Rejected: far more API and Docs for one arrangement, and each part would need the table's state through a hook the app already has.
- **A window `@media` for the narrow layout.** Rejected, as in ADR-0199: a table beside a sidebar is narrower than the window.
- **Making the `DataTable` root a size container.** Rejected: it would change the width behaviour of every table, whether or not it uses the layout.
- **Leaving the footer as page code.** Rejected: it duplicated `DataTable.Pagination` and lost its announcement.

## Consequences
- The page that adopts it drops its footer, the stylesheet for it and its status region, and its announcement reads "Showing 25 of 37 rows".
- A container query cannot take a custom length, so `collapseBelow` is a step; the list page's footer moves from 45rem to `md` (48rem), with its toolbar (ADR-0199).
- No new token and no dependency, so the bundle budgets hold.

## Related
`04-component-inventory.md` (DataTable), `component-reviews/DataTable.md`, `component-reviews/DataTableListPage.md`, ADR-0085, ADR-0199.
