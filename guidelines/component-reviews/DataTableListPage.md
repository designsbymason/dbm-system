# Data Table List Page — review findings

**Tier:** Template (a story-only example page, [ADR-0179](../adr/0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0184](../adr/0184-a-story-only-template-page-is-a-folder-of-stories-and-a-story-kit-in-templates-with-demo-controls-and-no-playground-over-a-shipped-component-or-a-separate-pages-tree.md)) · **Category:** Data pages · **Finalized:** ✅ 2026-11-07 (declared by the owner after the `/review-template` pass below)

Built 2026-11-07 as template #2 of the build order in `04-component-inventory.md`. A people directory in an `AppShell`: the count, the search and two filters in three columns, chips for the filters in force, sorting, paging, chosen rows with "select all across pages", bulk and row actions, a confirmed removal, and the states with nothing to show.

## Decisions
- **The page's state is its own, and the table is fully controlled.** A hook (`usePeopleList`) holds the filters, the sort, the page, the page size and the selection; a simulated request answers with one page and a count; `DataTable` gets `sortMode="manual"`, `totalCount` and every controlled pair. A change to a filter goes back to page 1 and clears the selection, since "all" and a chosen row belonged to the old filter.
- **Three empty cases, written differently:** no one yet (offers the first step), no one matching (offers to clear the filters) and a failed request (replaces the table, keeps the heading, is announced once and offers a retry).
- **Removing asks first**, says how many (singular for one), and says what happened in a toast; focus goes to the heading afterwards, only if it has fallen to the page.
- **Demo controls instead of a Playground** (how many people, how long a request takes, whether it fails), per ADR-0184.
- **No sticky table header.** The table's scroll frame scrolls sideways, which makes it the scroll container a sticky header would stick to, so a header would not stay in view while the main area scrolls. Not built, and not claimed.

## What was found while building it
- **A defect in the Finalized `Table`/`DataTable`:** the visually hidden name of the row-actions column is an absolutely positioned span whose containing block was outside the scroll frame, so the frame did not clip it and a table wider than the window made the page scroll sideways (773px in a 375px window). Fixed with `position: relative` on `Table`'s scroll frame, with the maintainer's go-ahead (a defect fix, question 2 of the three-question test, so both stay Finalized); a real-browser check in `DataTable.checks.stories.tsx` fails without it (2000px against 1200px) and the page's tablet and phone checks failed without it too. Recorded in [Table.md](Table.md) and [DataTable.md](DataTable.md).
- **Heading order:** `EmptyState.Title` draws an `h3`, which skips a level after the page's `h1` (axe `heading-order`); the page sets `level={2}`.
- **Plural:** "Remove 1 people?" from a bulk removal of one; the English copy handles one.
- **A nameless duplicate:** the filter toolbar and the table toolbar had the same accessible name; the filters are named "Filters".
- **Selected rows in forced colours** are told apart by their checkbox alone (a row's fill is dropped). That is enough (the state is not conveyed by colour), so the check asserts the mark and not the row.

## Checks run
- Unit and axe (jsdom): the first page and its count, placeholder rows, a filter change going back to page 1 and dropping the selection, chips removed one at a time and all at once, a sort through the request, a confirmed removal (cancel and confirm, the heading focused), select all across pages and its confirmation, the three empty cases, a retry, the singular, `StrictMode`, axe loaded, empty and failed, and the template's landmarks and `lang`/`dir`.
- Server render with `window` and `document` removed, and `hydrateRoot` over the server HTML with recoverable errors collected, under `StrictMode`.
- Real browser (hidden checks): desktop, tablet and phone layouts at pinned widths (the page never scrolls sideways, the table scrolls in its own frame, the header button and the bulk actions stay on screen), forced colours, print (the sidebar left out, the whole table laid out), a row's menu and the confirmation chosen with a real mouse inside the shell (each the top element at its point, the row gone, focus on the heading) and a filter opened and closed with real keys.
- Real input in the browser pane: a real click on a row's checkbox, the bulk "Remove" and the confirmation removed a person, said so in a toast and left focus on the heading; all four themes were looked at on the stories and the Docs page; every "Show code" on the Docs page was opened and read.
- The snippets were typechecked as real code against the components (with a planted bad prop to prove the check bites) and checked by `storySnippets.test.ts`.
- Breaking the fix once: with `position: relative` removed, the DataTable check and the page's tablet and phone checks fail; restored.

## Not verified
- **A real phone, Safari and Firefox.** Everything was run in Chromium, with the phone width emulated.
- **A screen reader** reading the result count, the chips' announcement, the error message and the focus move after a removal.
- **A real printer.** Print is checked by emulating the media type.
- **Throttled or very slow requests,** and a removal that fails (the page's removal always succeeds).
- **A table of thousands of rows** and the table's windowing inside the shell (the page is paged).
- **The Docs page's "Properties" section** is two reference tables, not a props table (ADR-0184); the Controls panel drives only the demo's three controls.

## Revised 2026-11-07 (at explicit direction)
- **The toolbar follows the Getting started component list:** three columns (the count, the search taking what is left, the filters), each filter's name as plain text before a button of a fixed width that shows only the choice ("All", the one choice, "2 selected") with the chevron at the end and no leading icon, and a panel of checkboxes headed by "All" (so the department filter is multiple-choice too). Under 45rem the filters and then the search take a line each. Its own stylesheet (`DataTableListPage.module.css`, with a docs-token test) holds this; the rules that must beat a component's own class are written under `.toolbar` and `.table`, and the parts are reached by `className`, not by their hashed class names.
- **Nothing beside or inside the table shifts:** the table's columns are fixed shares of its width (`table-layout: fixed`, fixed widths for the checkbox and menu columns) and the table and its footer keep a minimum height. A real-browser check measures the filter buttons, the search and the table's width while options are chosen with a real mouse.
- **Found while checking it:** the page's one grid column took the table's 40rem floor as its width, so the page was wider than the main area on a tablet; the column is now `minmax(0, 1fr)`.
- **Status badges are `subtle`, and the row menu's button is `tertiary`.**
- **No right-to-left or Persian story or copy** (a template needs none): the visible story, its snippet and Docs section, the Persian words, and the checks that measured them are removed. The shell's own right-to-left behaviour is still guarded by `AppShell`'s hidden checks.

## Revised again 2026-11-07 (at explicit direction)
- **No blank line between the toolbar and the table.** The chips and the bulk actions share one line under the toolbar's first line (chips at the start, bulk actions at the end) and the line is there only while one of them is. A line reserved for them (tried first, so the table would not jump down when a filter or row is chosen) was 48px of blank space most of the time; the table now moves down by one line when a filter is set or a row chosen, which is the trade for no blank space. A real-browser check measures the gap.
- **Phone toolbar:** a stack of the search, then the two filters side by side (each name above its button, both buttons the same width), then the count; the chips and the bulk actions a line each. A check pins a phone width and compares the buttons' widths and positions.
- **Footer** drawn from the page's own state, not `DataTable.Pagination`: rows per page and then the range ("1–10 of 137") at the start, the page controls centred (a three-column grid whose third column is empty), and on a phone the controls first and the rows per page and range under them. `DataTable.Pagination` is unchanged (range before the select, controls at the end), so no Finalized component was touched. A check measures the order, the gap and the centring, before and after changing the page size.
- **Getting started page:** the Templates table no longer takes the Components table's 37.5rem minimum height (a modifier class on the components table only), which left a blank gap before "For AI agents".
- **Suggested, not done:** a sticky toolbar while the table scrolls, a "Filters" button that opens the two filters in a sheet on a phone, and cards instead of a sideways-scrolling table at phone width.

## Revised a third time 2026-11-07 (at explicit direction)
- **Phone filters in a bottom sheet:** below 45rem the two inline filters are not drawn; the toolbar is the search box and a "Filters" button (it says "Filters (2)" while two are in force) that opens a bottom `Drawer` with both filters as sections of checkboxes headed by "All", and "Clear all" and "Done". The sheet and the inline popovers share one component for the choices and one state. Checks: a pinned phone width, a real click opening the sheet, the sheet at the bottom edge and the window's width, choosing in it, and the list and the button following.
- **Footer:** the rows-per-page button is a fixed small width (5rem) at the start, the page controls are centred, and the range is right-aligned at the end; on a phone the controls come first and the button and the range sit at the two ends under them.
- **Getting started page:** a template outside the Shells group (an example page, not a component) has an asterisk after its name in the Templates table only, read as "(example page)" to a screen reader, and a note under the table says what it means; the Components table is unchanged.
- **Found while testing:** inside jsdom the stylesheet hides the phone button from the accessibility tree, so a unit test finds it by its text; the phone check asks `checkVisibility()` of the inline filters' toolbar, because the class that hides them is on its frame.

## Getting started follow-ups (2026-11-07, at explicit direction)
- The asterisk is after the name, and which templates get it is no longer read from the group: the page's stories carry `tags: ["example-page"]` (Storybook copies the tag onto the Docs entry, which the block reads), and a unit test fails a template that is not exported from the package and lacks the tag, or is exported and has it. Broken once (tag removed) to see it fail.
- The components table's toolbar on a phone (Getting started, Storybook-only, no component changed) is one line: the count at the start and, right-aligned, a group of three icon buttons (Tier, Category, search). Tier and Category open the same checkboxes as the toolbar's filters in a popover; search opens a popover with the search box, focused. A button is named by its choice ("Tier: Atoms", "Search components: sidebar") and takes the secondary look while in use. The toolbar's own search box and filters are not drawn at that width (and the icon group is not drawn above it). Hidden checks (`src/guides/GettingStarted.checks.stories.tsx`, drawing the block from a small index passed in) pin a phone width and assert the one line, the order, the right alignment, the search box taking focus and narrowing the list, and a filter choice; one asserts the group is absent on a desktop. An earlier stack (search, then the two filters side by side) was replaced by this at the maintainer's direction.
- **Found while checking it:** the table's links (`text.link`, 4.71:1 on white) measure 4.49:1 on the striped rows in the light themes, a hair under 4.5:1; the links now use `text.brand`. Docs-only chrome.
- **Getting started, later 2026-11-07:** the phone icon buttons are the `ghost` variant (neutral at rest, `brand` tone while a filter or search is in use), each Tier and Category panel starts with the filter's name since the button has only an icon, and the Templates table shows a long name in full on a phone: the row-header cell's ellipsis is replaced by wrapping (a docs rule scoped to that table), so the asterisk stays visible. A hidden check measures a wrapped name and its asterisk and fails with the ellipsis back.

## Renamed and reviewed (2026-11-07, at explicit direction)
- **Named** "Data Table List Page" (Title Case; a page ends with "Page", see `04-component-inventory.md`). It was renamed to "Data Table List" for a short while, at the maintainer's direction, and the word "Page" was put back the same day: the story title, the folder (`templates/DataTableListPage`), its files, this file, the Getting started row and the Docs ids follow the name.
- **Docs page tables:** the three reference tables (the state, the table's props, the keys) take a `firstColumnWidth` (20rem) on `ReferenceTable`, so their first columns are the same width and line up as the reader scrolls.
- **Review pass, fixed:**
  1. **Clear filters left the search text in the box** while the list showed everyone (the box was uncontrolled with a default value). The search is now controlled, the list follows the text after a pause (300ms), emptying or clearing applies at once, and a test asserts it.
  2. **A change of rows per page was silent** (the footer replaced `DataTable.Pagination`, which announces it, and `Pagination` announces only a change of page): the footer now says "Rows per page: 25. 1–25 of 37" in a status region; a test asserts it.
  3. **The Docs import list** left out the components the page now uses (`Checkbox`, `CheckboxGroup`, `Drawer`, `Pagination`, `Select`).
- **Review pass, checked and found right:** a real-key run of a row's menu and the confirmation (Enter, arrows, Tab to Remove, Enter; focus on the heading afterwards), the filter sheet handing focus back to its button, every announcement the Docs page claims (the count, the filters in force and the selection by `TableToolbar`, a sort by `DataTable`, a page by `Pagination`), landmarks and heading order (axe on every state), the four themes, forced colours, print, hydration and `StrictMode`. The small hit areas measured (a 20px checkbox, a 12px chip button) are the Finalized components' own, extended by their hit areas.
- **Still not verified:** a real phone, Safari and Firefox, a screen reader and a real printer; a failing removal; a table of thousands of rows. Not Finalized: that is the maintainer's to declare.

## First `/review-template` run (2026-11-07), fixed at explicit direction
- **The "filtered" snippet said the count reads "12 of 137"**; the page passes only `count`, so it reads "6 results". The snippet comment now says so.
- **The sidebar highlighted Home on a People page** (breadcrumb Home > People, with a Team item in the sidebar): the page now sets `sidebarCurrent="team"` (see [AppShell.md](AppShell.md)).
- **The snippet typecheck is a script** (`pnpm check-snippets`, with this page's `DataTableListPage.snippetScope.txt`), where it had been a scratch file outside the repo; it fails on a wrong prop value and on a check that no longer bites.
- **Left for the maintainer:** the blank space between a short table and its footer (the footer is kept at the bottom of the table's minimum height so it does not jump), and the Storybook bundle budget (23,488KB of 24,000KB; the maintainer then raised the total to 26,000KB).

## Finalized (2026-11-07)
Declared Finalized by the owner after the first `/review-template` pass and its fixes. Accepted as it stands: the blank space between a short table and its footer (the footer stays at the bottom of the table's minimum height so it does not jump). Still not verified: a real phone, Safari and Firefox, a screen reader, a real printer, a failing removal, and a table of thousands of rows. A later change to this page follows the Finalized rules of `06-engineering-standards.md` §9.


## Post-Finalization: second `/review-template` run (2026-11-09), fixed at explicit direction
Defect and compliance fixes only (question 2 of the three-question test), so it stays Finalized.
- **The breadcrumb is `PageHeader.Breadcrumbs`**, inside the `PageHeader`, where it had been drawn beside it.
- **Two words moved into the page's copy:** the search box's placeholder and the filter panel's name.
- **A misindented line** (`totalCount`) is fixed.
- **The filters are `TableToolbar.Filters`** ([ADR-0199](../adr/0199-tabletoolbar-gets-an-opt-in-filters-group-that-draws-its-filters-inline-and-as-one-bottom-sheet-below-a-container-width-over-a-per-filter-sheet-a-window-step-or-a-page-built-sheet.md)): `FiltersSheet` and `ChoiceFilter` and their styles are gone, each filter is a `TableToolbar.Filter` with a `value` and `labelPlacement="before"`, and the "Filters" button draws its count as a `Badge` (named "Filters, 2 active"). The narrow layout's step is now the bar's 48rem (a container query cannot take a custom length), where it was 45rem. Unit, snippets and the real-browser checks follow (the phone check reads the button by its new name).
- **Open, with the maintainer:** the footer is drawn by hand beside `DataTable.Pagination` (to be planned next).
