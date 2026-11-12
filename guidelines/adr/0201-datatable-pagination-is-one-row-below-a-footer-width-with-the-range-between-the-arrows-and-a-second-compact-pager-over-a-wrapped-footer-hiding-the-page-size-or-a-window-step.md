# 0201 — `DataTable.Pagination` is one row below a footer width, with the range between the arrows and a second compact pager, over a wrapped footer, hiding the page size or a window step

**Status:** Accepted · **Date:** 2026-11-11

## Context
The footer holds three things: the page size select, the range ("1–10 of 87") and the page controls. Measured at 375px (a 343px footer) they need about 350px, so on a phone the split layout wrapped the controls under the range and the select (two rows) and the centred layout, below its `collapseBelow` step ([ADR-0200](./0200-datatable-pagination-gets-an-opt-in-centered-layout-that-goes-to-stacked-rows-below-a-container-width-over-compound-footer-parts-a-window-step-or-a-page-built-footer.md)), stacked the controls over the select and the range, and the Data Table List Page, which asks for the numbered pager, wrapped that too: three rows. The footer should be one row on a phone.

## Decision
- **`DataTable.Pagination` takes `compactBelow`** (`"sm"`, `"md"`, `"lg"`, `"xl"` or `"never"`, default `"sm"`, the same steps as `collapseBelow`). Below that width of the footer, in both layouts, it is one row: the page size at the start, then the page controls with the range between the arrows ("‹ 1–10 of 87 ›"); the page numbers, "Page 1 of 9" and the separate range are not drawn. About 225px, so it fits down to 320px. From the step up nothing changes. The default is on, so a phone gets one row without opting in; `"never"` keeps the footer as it was and draws only one pager. With `showSummary` off the controls between the arrows read "Page 1 of 9".
- **The switch is a container query on the footer's own width**, as in ADR-0199 and ADR-0200. Both layouts now draw a box around the footer that is the container, and it takes `className`, `style`, `id` and `data-testid` (the split layout's DOM gains the box, as the centred layout's did).
- **A second pager, always compact, whose summary is the range.** A container query cannot change what is drawn, so the part renders two `Pagination`s: the one it drew before and an always-compact one whose `labels.summary` returns the range, which is also what is announced when the page changes ("11–20 of 87"). CSS draws one at a time. The compact one is hidden by an **inline `display: none`** that the stylesheet overrides below the step with `!important`, so a render without the stylesheet, a server render, a print and a test in jsdom see only the numbered one in the accessibility tree; the hidden one is out of the tab order and the accessibility tree by `display: none`. `Pagination` itself does not change.
- **Keyboard focus survives the step.** A control that has focus in the pager being hidden would drop to the top of the document, so the part watches its box and, once its width has crossed the step and focus has gone, moves focus to the control with the same name in the other pager (Previous, Next, First, Last) or, for a page number, to Next. The box's focus events say which control had it (not read at the moment of the change).
- **The Data Table List Page needs no change**: it keeps `compact="never"` for its wide numbered pager and picks up the one-row form on a phone.

## Alternatives considered
- **Leave the footer to wrap, or stack in two or three rows.** What it did; rejected as the thing to fix.
- **Hide the page size select on narrow footers.** Smaller API, but the rows-per-page control is lost on a phone, and the list page's numbered pager would still wrap.
- **Keep "Page 1 of 9" between the arrows and hide the range** (about 258px). Smaller, with nothing hidden but the total, but the range is what the footer says in every other width.
- **A window step.** Rejected, as in ADR-0199 and ADR-0200: a table beside a sidebar is narrower than the window.
- **One pager switched by `Pagination`'s own `compact="container"`.** It measures its own row in JavaScript, not the footer's width, and the range between the arrows would need the pager's state, which the footer cannot read.
- **Measuring in JavaScript and drawing only the form that fits.** Draws the wrong form on the server and until the first measurement.

## Consequences
- The footer's range text is in the page twice (once behind `display: none`): a text query in a test finds both, so a test reads the drawn one (`DataTable.test.tsx`, the real-browser checks and the list page's own checks were changed to). The accessibility tree has one.
- A footer wider than the step draws the second pager and does nothing with it; `compactBelow="never"` avoids that.
- The split layout's DOM changes (a box around it, holding the attributes), so a style written against its root element moves to the box.
- No new token and no dependency; the step widths are written out in the stylesheet, as for `collapseBelow`.

## Related
`04-component-inventory.md` (DataTable), `component-reviews/DataTable.md`, `component-reviews/DataTableListPage.md`, [ADR-0200](./0200-datatable-pagination-gets-an-opt-in-centered-layout-that-goes-to-stacked-rows-below-a-container-width-over-compound-footer-parts-a-window-step-or-a-page-built-footer.md), ADR-0199.
