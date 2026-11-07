# Data table list page — review findings

**Tier:** Template (a story-only example page, [ADR-0179](../adr/0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0184](../adr/0184-a-story-only-template-page-is-a-folder-of-stories-and-a-story-kit-in-templates-with-demo-controls-and-no-playground-over-a-shipped-component-or-a-separate-pages-tree.md)) · **Category:** Data pages · **Finalized:** not yet (the maintainer's to declare)

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
- **Nothing under the toolbar shifts:** the table's columns are fixed shares of its width (`table-layout: fixed`, fixed widths for the checkbox and menu columns), the chips' row and the bulk actions' row keep their height while empty (hidden from the page and assistive technology, not removed), and the table keeps a minimum height. A real-browser check measures the filter buttons, the search, the table's width and its top while options are chosen with a real mouse and a row is chosen.
- **Found while checking it:** the page's one grid column took the table's 40rem floor as its width, so the page was wider than the main area on a tablet; the column is now `minmax(0, 1fr)`.
- **Status badges are `subtle`, and the row menu's button is `tertiary`.**
- **No right-to-left or Persian story or copy** (a template needs none): the visible story, its snippet and Docs section, the Persian words, and the checks that measured them are removed. The shell's own right-to-left behaviour is still guarded by `AppShell`'s hidden checks.
