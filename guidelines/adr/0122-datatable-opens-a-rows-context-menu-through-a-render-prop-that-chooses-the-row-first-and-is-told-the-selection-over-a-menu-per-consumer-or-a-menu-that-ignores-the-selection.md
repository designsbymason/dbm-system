# 0122 — `DataTable` opens a row's context menu through a render prop that chooses the row first and is told the selection, over a menu per consumer or a menu that ignores the selection

**Status:** Accepted · **Date:** 2026-10-24

## Context
Right-clicking a row is the shortcut people reach for in a table of records, and in a table that selects it has a rule everyone expects: the menu is about what is marked. A press on a row that isn't chosen should choose it alone, and a press on a row that is should keep the selection, so the menu acts on all of it. Left to each app, every table would write that rule, and write it a little differently. `DataTable` already holds the selection and renders every row ([ADR-0085](./0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md)), so it is the one place that can.

## Decision
- **`rowContextMenu(context)` returns `ContextMenu` items** for a row, where the context is `{ row, index, id, rows, count, allSelected }`. `rows` is the whole selection in table order when the row is part of it and just `row` otherwise; `count` is how many rows the menu acts on; with every row chosen across pages (`allSelected`, [ADR-0087](./0087-select-all-across-pages-is-a-state-of-its-own-for-a-table-that-holds-one-page-over-listing-ids-it-doesnt-have-or-an-inverted-selection.md)), `rows` is only the ones the table holds and `count` is the total.
- **A press on a row that isn't chosen chooses it alone first** (in a table with `selectionMode`, for a row that can be chosen), replacing the selection, and one on a chosen row keeps it. A table that doesn't select, and a row that can't be chosen, leave the selection alone.
- **Each row is a `ContextMenu` trigger** (`asChild` on the `Table.Row`), and its items are asked for only while its menu is open and through its exit, so a table of many rows holds a menu root per row and one set of items. The panel is named "Actions for" and the row's label (`labels.rowMenu`). The row carries `data-state="open"`, drawn as an outline from the stylesheet so it reads on a striped, hovered or chosen row and in forced colours.
- **The keyboard needs no extra tab stop.** The context-menu key opens it from whatever has focus in the row, a checkbox or a button, by bubbling to the row; `rowContextMenuKeys` names keys for a platform with no such key ([ADR-0120](./0120-contextmenu-is-opened-from-code-by-sending-radixs-trigger-a-contextmenu-event-through-a-controller-and-an-openonkeys-prop-over-rebuilding-the-trigger.md)).
- It is a shortcut, never the only way: the Docs page points at `rowActions` and the toolbar for the same actions.

## Alternatives considered
- **A `ContextMenu` the caller wraps each row in through a cell.** Rejected: a cell can't wrap its row, so the area would be one cell, and the selection rule would be the caller's.
- **A menu about the pressed row only, leaving the selection to the caller.** Rejected: it is the rule everyone then writes, and it is wrong in the common multi-select case if forgotten (a menu that says "Delete" over one row while three are marked).
- **One menu for the whole table, positioned by the row pressed.** Rejected: a press on a part of the table that isn't a row (a spacer, a detail row) couldn't keep the browser's own menu, since the trigger either handles the event or doesn't.
- **A prop to turn off choosing the row.** Not offered: no use found that the rule doesn't serve.

## Consequences
- `DataTable`'s JS grows by about 0.5KB (it already carries `Menu`'s item parts for its column menu), inside a budget raised to 32KB.
- `DataTable` is Finalized: the change is additive (two props and a label), with its own tests, real-browser check and Docs section.
- Rows that already press (`onRowClick`) work the same: the context menu does not reach the click.

## Related
`04-component-inventory.md` (DataTable row), ADR-0085, ADR-0087, ADR-0118, ADR-0120; `component-reviews/DataTable.md`.
