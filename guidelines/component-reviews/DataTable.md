# DataTable — review findings

Tenth organism, built 2026-10-17 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Finalized 2026-10-17** by the user, after two
`/review-component DataTable` passes (fourteen findings, then seven) and their fixes, and the five features and two recipes added between them ("Review pass",
"Added after the review" and "Final review pass" below), with the items under "Open at this point" accepted as open. What follows is what was decided, found and
verified, and what is known to be open. Per `06-engineering-standards.md` §9, further changes to `DataTable` (code, stories, docs or its tokens) need the user's
go-ahead first.

## Decisions
- A generic component fed `columns` and `data` that holds the interaction state, with `DataTable.Toolbar`, `.Selection` and
  `.Pagination` as direct children and `useDataTable()` for a caller's own parts; `sortMode` `client` or `manual`; the choice is a list of
  ids; a native table, not a `grid`: [ADR-0085](../adr/0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md).
- Rows are one line of a fixed height from tokens, an unpaged table with a `maxHeight` is drawn a window at a time, and paging and
  windowing exclude each other: [ADR-0086](../adr/0086-datatable-draws-fixed-height-rows-from-tokens-a-window-at-a-time-only-when-unpaged-over-measured-rows-or-windowing-inside-pages.md).
- `Table` grew `Table.Row` `selected` and `containerRef`, additive and approved with the plan ([Table.md](Table.md)).
- New component tokens, `data-table.row-height.{xs…xl}` (`2rem`, `2.5rem`, `2.75rem`, `3.5rem`, `4rem`), each just above the `IconButton` of
  its size. No new semantic token: a chosen row is `bg.brand-subtle` (the `brand` tone's own stripe), its hover `bg.brand-subtle-hover`.
- No new dependency. Bundle size is 24.62KB JS and 8.10KB CSS, because the bundle holds `Table`, `TableToolbar`, `Pagination`, `Select`, `Checkbox`, `Menu` and
  `Button`; budgets are 26KB and 9KB with the reason beside them in `check-component-bundle-size.mjs` (a `CSS_BUDGET_OVERRIDES_KB` was added).
- Defaults: `tone` is `brand` (a solid brand header, as a data table's header usually wants), and `DataTable.Pagination` is size `sm`, since the
  footer is secondary to the rows. Text is ordered with one `Intl.Collator("en")`, not the browser's locale, so a server and a browser agree
  (ADR-0021); a column that needs another language's order gives its own `compare`.
- Left out, as agreed: column reordering (the sortable hook of [ADR-0043](../adr/0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md)
  waits for `EditorTabs`), expandable rows, grouping, cell editing and saved views.

## What was found while building it
Real-browser checks caught each of these; none showed in a unit test.
- **A checkbox is smaller than the minimum target.** `Checkbox` at `xs` is 12px, so the select column failed the 24 × 24px rule. First
  patched in `DataTable`'s own stylesheet; the review asked for the fix at the atom, so it now lives in `Checkbox` ([Checkbox.md](Checkbox.md)). The
  check presses points 11px either side of the centre with `elementFromPoint`, since `getBoundingClientRect` can't see a pseudo-element.
- **An `IconButton` is taller than a row at `xs` and `sm`.** At those sizes the button is 30px and 39px, so a row with a menu was 31px
  and 40px against a 28px and 36px token, and the window's spacers would have drifted. The tokens became 32px and 40px, each just above its
  button, and the story kit's `RowMenu` takes the table's `size`. A row's actions button must be the table's own size.
- **A chosen row eases to its fill**, so a test that read its colour straight after the press saw it transparent. It waits for the colour.
- **A modal menu left open fails axe** (`aria-hidden-focus`) when a story ends; the check closes it.
- **A story's own `data` and `columns` args overwrote the demo's** (the toolbar story drew eight rows and "1–8 of 8") because the demo
  spread `args` last; the demos drop `data` and `columns` from what they spread, and a story that needs a setting sets it in `args`.
- **A same-tick double press loses one.** Two `click()`s in one task both read the selection from the same render, so the second
  overwrote the first. A person can't produce that; a script can. Not fixed: the setters take a value, as the rest of the library's do.
- **`react-hooks/set-state-in-effect`** rejected reading the row token into state after mount; it is read with `useSyncExternalStore` (a
  server and a hydrating render get `undefined`, so the first render is the same on both), which the server-render and hydration tests
  cover with a windowed table.
- **Stripes of a window.** `:nth-child` stripes shift when the first drawn row's position is odd, so the window starts on an even row with
  a hidden row after the leading spacer; a real-browser check scrolls to the end and asserts the stripe still follows the data row.

## Review pass (2026-10-17)
Fourteen findings, all fixed:
1. **The "server" story ran in client mode.** The demo spread the Playground's args after its own `sortMode`, `loading` and `totalCount`, so it showed
   "1–10 of 10" and never went busy. The demo now owns those and the story turns their controls off.
2. **A shared collator, fixed to English**, for the default text order (a 20,000-row sort went from 374ms to 28ms, and no longer depends on the browser's
   locale); a test with `localeCompare` reversed proves the order doesn't read it.
3. **A chosen row is told apart.** Its fill is `bg.brand-subtle-hover` (the `brand` tone's stripe is `bg.brand-subtle`, which the first fill
   matched), and the checkbox cell carries a marker in `border.brand` (held transparent in every row, so nothing moves; Canvas and Highlight in forced
   colours). `Table`'s selected fill changed with it ([Table.md](Table.md)).
4. **The unsorted arrow is `opacity.80`** (it was `opacity.60`: 2.74:1 on a neutral header in the light themes), and a check measures 3:1 against the
   brand and the neutral header in all four themes.
5. **The range's numbers are isolated** (U+2068 … U+2069), so "1–10 of 24" reads in order in right-to-left; a check measures the order.
6. **`DataTable.Pagination` takes `dir`** (default `ltr`, as every Radix-wrapping part) and gives it to the page size select.
7. **Component-level JSDoc with an example** on `DataTable`, and an example on each part.
8. **No false warning** for a sortable column without an accessor when sorting is manual.
9. **`Checkbox`'s hit area** fixed at the atom, through the three-question test.
10. **The sort is worked out from the rows alone**, so an inline `getRowId` or `isRowSelectable` doesn't sort again (a test counts `compare` calls); the
    duplicate-id warning is once per id.
11. **A cell cut by a width has its whole text as its `title`.**
12. **A Tones story**, and this file records the `brand` and `sm` defaults.
13. **Tests:** nested inside a cell, a pagination outside a table, spread order on `Selection` and `Pagination`, `formatNumber` and `labels` on the footer, Space on
    a row, the pinning props, the default tone, and a manual-mode warning.
14. **Real-browser checks** for right to left (column order, figure alignment, the range, the select's `dir`), forced colours (the marker, the sort
    button), a phone width (no page overflow, the table scrolls in its frame, the footer stacks), the marker taking no room, and the arrow's contrast.

One pitfall found writing the checks: a probe element made inside a `waitFor` callback changes the document and re-runs the callback forever
(06 §9 names it); the forced-colours check hung until the colours were resolved outside the callback.

## Added after the review (2026-10-17)
Five gaps named by the review's follow-up, built in this order:
- **`DataTable.ColumnMenu`:** a `Button` and a `Menu` of one checkbox item per column, reading and setting the hidden columns; the last column drawn can't be turned
  off, and says why.
- **Sorting by several columns:** a press with Shift held adds a column to the sort, turns it round, then takes it off, where a plain press makes it the only
  one (`multiSort`, on by default). The columns show their order, the button says "sort order 2" after the heading, and the announcement lists every column.
  The sort was already a list, so nothing about `sort` changed.
- **Select all across pages:** `allSelected` for a `manual` table with a `totalCount` ([ADR-0087](../adr/0087-select-all-across-pages-is-a-state-of-its-own-for-a-table-that-holds-one-page-over-listing-ids-it-doesnt-have-or-an-inverted-selection.md)).
- **Several pinned columns:** `Table` pins a number of columns, measured from the header ([ADR-0089](../adr/0089-table-pins-a-number-of-columns-by-measuring-the-header-over-fixed-offsets-or-a-sticky-column-per-part.md),
  [Table.md](Table.md)); `DataTable` counts data columns and pins the checkbox and actions columns beside them, so `stickyFirstColumn` now keeps the name beside
  its checkbox.
- **Column sizes:** `resizable`, a focusable separator at each heading's edge, `columnWidths`, a `maxWidth`, and `selectionColumnWidth` and `actionsColumnWidth`
  ([ADR-0088](../adr/0088-datatable-columns-are-resized-with-a-focusable-separator-at-the-heading-edge-and-widths-are-pixels-the-caller-can-keep-over-a-resize-observer-layout-or-percentage-widths.md)).

Found while building them:
- **A hint inside a heading is part of its name.** The first handle drew its keys' hint inside the `<th>`, and a header cell's name comes from its content, so
  "Name" became "Name Arrow keys resize…". The hint is drawn once, outside the table's cells, and a heading with a handle is named by `aria-label`.
- **A resize can't narrow a column past its minimum**, so a keyboard check that pressed "narrower" at the minimum measured no change; the check now presses the
  widening key from there and back.
- **Storybook's `userEvent.click` and `userEvent.keyboard` don't share a keyboard,** so a Shift pressed in one was not held by the other; a check that
  needs a modifier uses one `userEvent.setup()`.
- **A hover-sized check can't see what a probe-in-`waitFor` does** (06 §9): the forced-colours check keeps resolving colours outside its callback.

## Expandable rows, a density toggle and saved views (2026-10-17)
- **Expandable rows** are built into the table ([ADR-0090](../adr/0090-datatable-opens-a-rows-detail-in-a-row-of-its-own-under-it-with-an-expand-column-and-no-windowing-over-a-nested-table-or-a-side-panel.md)):
  `renderExpandedRow`, `expanded` / `defaultExpanded` / `onExpandedChange`, `expandMode`, `isRowExpandable`, a column of expand buttons after the checkboxes, and a detail row
  under an open one. A table with them is never windowed and sets no row count or index.
- **A density toggle and saved views are recipes on the Docs page, not features:** `size` already sets the type, padding and row height together, so a density toggle is
  a piece of the caller's state, and a saved view is a plain object of the table's own controlled state (`sort`, `hiddenColumns`, `columnWidths`, `pageSize`, `size`), so
  there is nothing to add to the table and nowhere for it to store them. Each has a demo story, a "Show code" snippet and a real-browser check that the demo does what the
  recipe says (a size per choice and rows of exactly that height; choosing a view hands its state back and saving copies the current state).
- Found while building: a detail row between a row and the next breaks `:nth-child` stripes (two rows are added, a hidden one and the detail, to keep the parity), the
  table's last-row rule needs the detail to be the last child (the hidden row goes *before* it), `aria-controls` on a closed row points at nothing so it is set only while
  open, and the row count can't be kept right across pages, so it is left off.

## Final review pass (2026-10-17)
Seven findings, all fixed:
1. **"Select all" dropped keyboard focus** when it went away. Fixed at its source, in `TableToolbar.Selection` ([TableToolbar.md](TableToolbar.md)); a real-browser check
   presses it from the keyboard in the server demo.
2. **A resize handle's line is `opacity.80`**, not `opacity.40` (1.9–3.0:1 on the brand and neutral headers, all four themes): the contrast check now measures the
   handle as well as the sort arrow.
3. **The server-render and hydration test covers the newer features:** an open row (also paged), resizable with widths and the added columns' widths, several
   pinned columns, a sort by several columns, every row of a server table chosen, the column menu, and all of them together.
4. **StrictMode and cleanup:** a table that expands, resizes, pins and holds the column menu works under `<StrictMode>`, and a drag is let go of when the table is
   removed in the middle of it, when the pointer is let go, and when the gesture is cancelled (the unmount test fails with the cleanup removed).
5. **Forced colours** is asserted for the newer parts: the open row's joined divider is the page's colour, the resize handle's line is drawn in the heading's own
   colour, and the last pinned column keeps its divider.
6. **The expanded-row demo uses the `ghost` `DescriptionList`**, so it isn't a box inside a box.
7. This file: the open list is current, and the numbers.

## Verified
- `eslint`, `tsc` and the Storybook `tsc`: clean. The `unit` project: 8724 passing. The `storybook` project in a real browser: 1818
  passing (225 files), including twenty-two hidden checks for this component and one for `Checkbox`. `pnpm build`, `pnpm check-component-bundle-size` and
  `pnpm check-guidelines`: clean.
- Unit: sort, selection, paging and their pure helpers; the controlled/uncontrolled pairs wired to state; shift ranges; single mode;
  non-selectable rows; manual mode; the live-region announcement; `aria-rowcount` and `aria-rowindex`; `onRowClick` (and a control in the row not
  reaching it); windowing, including turning it off; warnings; `labels: { x: undefined }`; `StrictMode`; `jest-axe` in four states; server render
  and hydration of eleven variants.
- Real browser: every row at every size is exactly its token's height (with a selection column and a menu in the row); a 5,000-row table draws
  fewer than 80 rows, its scroll height is 5,000 rows, the last row can be reached, and its stripes follow the data after a long scroll; a cell with
  a `width` is cut with an ellipsis and its row keeps its height; every control is at least 24 × 24px at every size; sorting from the keyboard leaves
  focus on the heading's button, with its ring inside the box; the Tab order runs toolbar, header, rows, footer; a row's menu opens above the
  scrolling table and is chosen with a real pointer; a chosen row has its fill and keeps it through a sort.
- Looked at in Storybook: the Docs page (13 canvases, no errors, every Properties row has a description), the toolbar story with a selection in
  Purple light, and the selection story in Emerald dark.

## Open at this point
Not verified, and none of it should be assumed:
- **Emerald light** was looked at on screen for the expandable-rows story only (and its contrast measured everywhere); the other new stories were seen in Purple light, Purple dark and Emerald dark.
- **Resizing and the headers' tab stops.** Each resizable column adds a tab stop (it is opt-in, and said so on the Docs page); a table with many resizable columns was
  not walked by hand with a screen reader.
- **Several pinned columns with a spanning cell.** A cell that spans columns in the first pinned columns is not pinned and shifts the others out of their columns;
  the prop's JSDoc says so, and no check pins it.
- **Windowed rows and focus.** A row scrolled out of a windowed table takes its controls out of the page, so Tab can't reach them and find-in-page
  can't see them; the Docs page says so, and the consequence is recorded in ADR-0086.
- **Widths between the extremes.** The phone check is at 375px and the others at the desktop width; the steps in between were not asserted.
- **Hand-driven keyboard and screen reader use.** The Tab order and the sort keys are asserted in a real browser, but no screen reader was run.
- **Expandable rows, column reordering, density and saved views, export, footer aggregates and column-level filters** are not built.

## Post-Finalization addition (2026-10-24, at explicit direction): `rowContextMenu`
A row can open a context menu: `rowContextMenu(context)` returns `ContextMenu` items, is told the row and the rows it acts on, and chooses a row that isn't chosen alone first, while a press on a chosen row keeps the selection (`rowContextMenuKeys` names extra keys; [ADR-0122](../adr/0122-datatable-opens-a-rows-context-menu-through-a-render-prop-that-chooses-the-row-first-and-is-told-the-selection-over-a-menu-per-consumer-or-a-menu-that-ignores-the-selection.md)). Purely additive, so `DataTable` stays Finalized (`06` §9 step 1, "no"); the new surface got its own pass: JSDoc, a `rowMenu` label, 14 unit tests (right-click, the row chosen alone, a chosen row keeping the selection in table order, `allSelected`, a sorted table, labels, the keys, the items drawn only while open, pressing rows, a controlled table, axe), a server-render variant, a real-browser check with a real right-click (one row chosen, the row marked and outlined, the panel above the table), a story, a snippet, a Docs section and Accessibility bullet and two token rows (the outline), and a look at it in Storybook.
The bundle grew to 26.97KB of JS against the 26KB budget (a row menu brings `ContextMenu`, which draws `Menu`'s item parts the column menu already carries), so the JS budget is 32KB and the CSS budget 10KB.
Not verified: the context-menu key and a long press on a real device, a screen reader's reading of the row's menu, and a table of thousands of rows with a menu open (windowed rows hold one menu root each).
