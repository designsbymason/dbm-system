# TableToolbar

Molecule, Data Display category. Item 28 of the itemized molecule build order in `04-component-inventory.md`, named
`TableToolbar` (one word) from 2026-10-03 to match `DataTable` and `TableOfContents`. The bar above a table of data: search,
filters, the filters currently applied, a result count and bulk actions. Built 2026-10-03, **Finalized 2026-10-04**
(declared by the user after the final review below). The decision is [ADR-0034](../adr/0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md).

## What it is

A compound component: `TableToolbar` (a named `role="group"`, with a `size` the parts read) plus `Row` (a wrapping row),
`Search` (sizes the search field), `Filter` (a `Popover` button with a count and a Clear, or showing its choice with `value`), `Filters` (an opt-in group of filters that are one button and a bottom `Drawer` below a width of the bar, [ADR-0199](../adr/0199-tabletoolbar-gets-an-opt-in-filters-group-that-draws-its-filters-inline-and-as-one-bottom-sheet-below-a-container-width-over-a-per-filter-sheet-a-window-step-or-a-page-built-sheet.md)), `ActiveFilters` (removable chips and
"Clear all"), `Summary` ("128 results", "12 of 128 results") and `Selection` (the bulk row). It owns no data: everything is
props and callbacks. The search field, the toolbars and the spacer are existing components placed in slots. Text the parts
write is a `labels` object and numbers go through `formatNumber` (ADR-0021). No new dependency; two component tokens
(`table-toolbar.search-min-width`, `.search-max-width`); a part's `size` defaults to the bar's.

## Decisions made during the build

- **Group, not toolbar, with real toolbars inside** (ADR-0034), the answer to the question raised before the build: a search
  field can't be in a toolbar. The tab order is the search field, each `Toolbar` once, then the chips; a test tabs through it and
  another types in the search field with the arrow keys, in jsdom and in Chromium.
- **`Filter` hands every prop to its button**, so `<Toolbar.Item><TableToolbar.Filter/></Toolbar.Item>` joins a toolbar's
  arrow-key order the way a `Select` does, with no change to `Toolbar`. It takes the toolbar's `variant` and `size` through the
  `ButtonGroup` context `Button` reads (and is `secondary` at the bar's size on its own). Its accessible name is "Status, 2
  active" with the visible word inside it (WCAG 2.5.3).
- **A `count` left `undefined` on `Summary` means "not known yet"**, so the count that arrives with the data is a first
  appearance and is not announced; `0` is a real count ("No results"). Without that every page load would announce.
- **Each live region stays in the page when its visible part is hidden** (`ActiveFilters` with no chips, `Selection` at zero),
  or "none" and "selection cleared" could never be announced; the visible part uses the `hidden` attribute, with an explicit
  `[hidden] { display: none }` because the class's own `display` would override it.
- **Focus is moved before a part disappears under it**: removing a chip from the keyboard focuses the chip now in its place (or
  the last, or, with none left, the nearest control before the chips); emptying the selection with focus in the row focuses the
  nearest control before the row (else the first after). A mouse press moves nothing. One small helper, `focusNearestOutside`, does
  the searching, within the bar.
- **Selection is its own row**, not a swap of the main row, and its fill is `bg.brand-subtle` with `text.primary` (13.46 to 15.05:1
  across the four themes, measured) and a real border so it is still a box in forced colours.
- **Names and counts are plain text.** `ActiveFilters` items are `{ id, label, group? }` with a string `label`, so a remove button
  can be named after the chip ("Remove filter: Status: Open").

## Review checklist (06 §9), run on 2026-10-03

- **Baseline**: strict types, no `any`; JSDoc on the bar, every part and every prop; `forwardRef` on every part; `className`, `style`,
  `id` and `data-testid` accepted; `{...props}` before the computed `role`, `aria-*` and `data-table-toolbar` (a test passes `role`
  and reads the result, for the bar and for `Selection`); no hardcoded value; dev warnings once for a missing name on the bar,
  a missing `label` on a filter, and a non-array `items`; SSR-safe (no browser access in render); survives `StrictMode` (a test);
  `labels` merged with `mergeDefined` and tested with `{ key: undefined }` on all four parts; bad numbers (negative, `NaN`,
  `Infinity`, missing) treated as none, not thrown at.
- **Composition checkpoints**: atom reuse (`Badge`, `Button`, `Tag`, `VisuallyHidden`, `Popover`, `Toolbar`, `SearchInput`,
  `Spacer`); consumed-atom defects: one found, below; Radix-prop audit for `Popover` (`open`/`defaultOpen`/`onOpenChange` and
  `align` exposed; the rest left to `Popover`); cross-part wiring (each group named; the popover named from the label); composed
  tab order tested in jsdom and Chromium; **no provider of its own**, so no nesting problem.
- **Accessibility**: jest-axe clean with the selection row showing and hidden, and with a filter panel open; the named dialog,
  `aria-expanded` and `aria-haspopup`; explicit `list`/`listitem` roles (lint disabled with the Safari reason, as `Pagination`
  does); three live regions that never announce a first appearance (tests for each, including "forgets the last count while
  unknown"); focus recovery (two jsdom tests with a `:focus-visible` stub, and a real-browser story on a live table).
- **Responsiveness / RTL / forced colours**: a real-browser story measures the wide layout (one line, search capped at 24rem,
  actions at the far end) and a 20rem container (nothing wider than the box, the filters below the search); another a phone
  viewport (no horizontal scroll); right-to-left (search and chips start at the right, the count at the left); forced colours
  (the bulk row keeps its border). Checked by eye at a real 640px viewport too.
- **Target size**: every control has a hit area of at least 24 × 24px at all five sizes. A chip's remove button draws a 12 to 20px
  glyph; this review found that was below the guideline's "at least 24 × 24" rule (`06` §9), and `Tag` now extends the button's hit
  area to 24px with an invisible pseudo-element (see `Tag.md`, 2026-10-03). The story probes points 11px either side of each remove
  button's centre with `elementFromPoint`, since the pseudo-element does not change the measured box.
- **Storybook**: Docs page in the 10-section template; a Playground that is the whole working bar; five Properties tables (the
  bar, and `Filter`, `ActiveFilters`, `Summary`, `Selection` on hidden docs-only stories per ADR-0013), every row with a
  description and a default; hand-written snippets under every story; hidden real-browser stories with a literal `!dev` tag; a docs
  test holds the token table to the stylesheet in both directions.
- **Verification run**: `pnpm lint`; `pnpm test` 5,371 and `pnpm test:storybook` 1,031 tests; `pnpm -r build`;
  `check-component-bundle-size` (TableToolbar 5.91KB JS / 2.89KB CSS gzipped, with `Popover`, `Tag` and `Toolbar`'s parts it composes);
  token coverage; `pnpm audit` (the one accepted advisory). Mutations that each failed a test: no chip focus recovery, no selection focus
  recovery, announcing a first appearance, a filter name that drops the count, the role replaceable by props.

## Found along the way

- **`Tag`'s remove button was under 24px at most sizes** (above): a finding in a Finalized atom, surfaced by the target-size story.
  Fixed 2026-10-03 at explicit direction by extending the hit area to 24px with a pseudo-element (see `Tag.md`).
- **A hidden subtree has no accessible name to a role query** (testing-library): a hidden `group` can't be found by
  `getByRole(..., { name })` even with `hidden: true`, so assertions about a hidden row read the `hidden` attribute. Applied in three
  tests; not a component defect.
- Adding `border-width` or `display` to a class that is also hidden by the `hidden` attribute needs an explicit `[hidden]` rule; both
  hidden parts have one (found by reading, then asserted by the hidden-row tests).

## Gaps named, not built

- **Sorting, pagination, column visibility, saved views and a filter builder** belong to `DataTable` or later; the bar knows nothing
  of columns.
- **`MultiSelect` and `Menu` as filter panels and an overflow menu**: neither exists yet; `Filter`'s panel takes any children so they
  can slot in.
- **A one-toolbar variant** (filters and actions in a single `Toolbar`) needs the `Toolbar` frame to share a row, which its
  `fullWidth` doesn't do; two toolbars with a `Spacer` between them is the supported layout.

## Post-review additions (2026-10-04, at explicit direction)

- **`Filter` `max`** (default 99): a count above it reads "99+" on the badge; the accessible name keeps the real number.
- **`Summary` `loading`**: a skeleton in the count's place (`aria-busy`, with `labels.loading` hidden for screen readers); nothing is
  announced while it is on, and the count that arrives is announced only if it differs from the last one announced.
- **xs count badge** is smaller (`table-toolbar.filter-count-size-xs`, 20px), set through `Badge`'s own custom properties on a wrapper.
- Fixes: a count no longer makes the filter button taller; the panel is at least as wide as its button; the panel's Clear is full
  width; "Clear all" is rounded and as tall as the chips; every default shows in the Properties tables.
- **Ideas not built**: ready-made checkbox-list/radio-list filter panels (wait for `MultiSelect`), a smaller badge at sm, and
  Safari/Firefox/touch checks (a pass for the whole `Toolbar` family before publishing).

## Final review (2026-10-04) — six findings, all fixed

Run before the user declares the component Finalized.

1. **The bulk row's count moved its neighbours** (8px per digit: "Select all N" moved 0, 8 and 16px going from 9 to 10 to 100 selected).
   Now tabular figures plus the width of the widest text it can show (`labels.selected` at `max(count, totalCount)`, drawn invisibly
   after it from a `data-widest` attribute, so no second copy of the text is in the page).
2. **The loading placeholder was 13.3px tall against 18px of text**, so the row jumped when the count arrived. The loading box now
   holds a line's height (`min-block-size: 1lh`).
3. **The placeholder vanished in forced colours** (`Skeleton` draws only a background). TableToolbar gives its own placeholder a
   `GrayText` outline there; the forced-colours story asserts it. `Skeleton` itself has the same gap and is a Finalized atom: flagged,
   not changed.
4. **The filter button widened as its count grew** (1.4px at 10, 7px at "99+"). The badge's wrapper now reserves a two-digit badge's
   width (its padding plus `2ch`, with tabular figures), so counts 1 to 99 are one width. "99+" is wider by design; a count appearing
   at all (0 to 1) still widens the button, since reserving that would leave a gap with nothing in it.
5. **A bar nested in another replaced its size with `md`.** A size left out now follows the outer bar's (`own ?? parent`), as
   `ButtonGroup`'s does; tested.
6. **The StrictMode test covered only `Selection`.** Now also `Summary` (including `loading`) and `ActiveFilters`: a first
   appearance is silent, a change is announced, and loading says nothing.

Real-browser story "Live text" measures 1, 9, 10 and 100 (and the loading height); each fix was undone on purpose to see its test
fail (the reserved width, the badge width, the loading height, the forced-colours outline, the nested size, the loading hold-back).

## Post-Finalization addition (2026-10-04, at explicit direction) — two layout examples

Two Docs-page examples with stories and snippets, no change to the component: **"Split above and below a Table"** (search, filters and chips
above; a second, named `TableToolbar` holding `Summary` below) and **"Selection in another place"** (`Selection` after the table, sticky at the
bottom of the scrolling box through its own `style`). Purely additive docs and stories, so the component stays Finalized. Checked in a
real browser: the sticky row stays at the box's bottom edge scrolled or not, and keyboard "Clear selection" from there moves focus to the nearest
control before it (the last row's checkbox), not the top of the document. Parts outside a root use size `md`; both examples say so.


## Post-Finalization follow-up (2026-10-17, at explicit direction) — "Select all" hands keyboard focus on when it goes away

`TableToolbar.Selection` hides its "Select all N" button once everything is chosen. Pressed from the keyboard, that dropped focus to the top of the
document: found in `DataTable`'s final review, with focus on the button, Enter, and `document.activeElement` ending as `<body>`, the very case
`06-engineering-standards.md` §9 names ("a control that has keyboard focus is never removed"). The row already did this for the whole row going away; the
button is now covered too: when it disappears and keyboard focus was on it (`:focus-visible`, so a mouse press is left alone, as for the row), focus
moves to "Clear selection", or, with no `onClear`, to the first of the bulk actions.

**Finalized status is unchanged.** Three-question test (`06-engineering-standards.md` §9): question 1, does it change the rendered or behavioural output of
anything that existed? Only where focus ends after a keyboard press that used to lose it. Question 2, is it correcting a genuine defect? Yes: the original pass
would have failed the focus line had it pressed the button from the keyboard, so it stays Finalized. Re-verified with four unit tests (focus lands on Clear
selection; on the first bulk action when there is none; a mouse press is left alone; nothing moves when the button goes away without having focus), the
`TableToolbar` suite (107 passing), and a real-browser check on `DataTable`'s server demo (Enter on "Select all 137" leaves focus on "Clear selection").

## Post-Finalization follow-up (2026-10-17, at explicit direction) — wording that called `DataTable` a future component

The component JSDoc, the Docs page intro, a snippet comment and the story kit's comment now say a `DataTable` (which draws the bar as `DataTable.Toolbar`) can sit under it,
instead of "a future `DataTable`". Wording only, so the component stays Finalized (question 1 of the three-question test, `06-engineering-standards.md` §9).

## Post-Finalization follow-up (2026-10-21, at explicit direction) — Label in Name
`TableToolbar.Filter`'s button showed "Status2" (no space before the badge) and named itself "Status, 2 active", which axe 4.14 reads as a mismatch. A space now separates them, and past `max` the name holds the badge's text and the real number ("Tags 99+, 1,284 active"). Two tests changed. See [ADR-0112](../adr/0112-an-interactive-controls-accessible-name-holds-its-visible-text-as-whole-words-in-order-over-a-name-that-only-means-the-same.md). A fix to a defect in a finalized component, not a change of preference, so it **stays finalized**.

## Decisions: the `Filters` group (planned 2026-11-09, approved by the maintainer with the recommendation on every decision)
Additive and opt-in, so `TableToolbar` stays Finalized; the new surface gets its own scoped mini-pass. The decision is [ADR-0199](../adr/0199-tabletoolbar-gets-an-opt-in-filters-group-that-draws-its-filters-inline-and-as-one-bottom-sheet-below-a-container-width-over-a-per-filter-sheet-a-window-step-or-a-page-built-sheet.md). It exists so the Data Table List Page's own `FiltersSheet` and `ChoiceFilter` can go.
- **Scope:** a `TableToolbar.Filters` part holding `TableToolbar.Filter`s: inline in a `Toolbar` above its step, one "Filters" button and one bottom `Drawer` below it. No data of its own (ADR-0034), no change for a bar that does not use it.
- **API:** `collapseBelow` (`"sm" | "md" | "lg" | "xl" | "never"`, default `"md"`), `onClearAll`, `labels` (`group`, `button`, `title`, `description`, `clearAll`, `done`; `mergeDefined`), `formatNumber`, the usual `aria-label`, `className`, `style`, `id`, `data-testid`. `Filter` gains `value` (the button shows the choice; named "Status: All") and `labelPlacement` (`"inside"` default, or `"before"`).
- **Switch:** a container query on the bar's own width (the bar is a size container only while it holds a `Filters`, by `:has`), over a window step or measuring. An open sheet closes if the bar grows past the step.
- **Finding the filters:** the group reads its direct children by type; a wrapped `Filter` is drawn inline and is not in the sheet (the Docs say so).
- **The sheet button** draws the summed count as a `Badge` (the list page's "(2)" text changes) and is named "Filters, 2 active", holding its visible word.
- **Tokens:** none new. **Bundle:** `TableToolbar` and `DataTable` carry `Drawer` once the compound is imported, so their budgets rise.
- **Checks planned, each broken once:** unit (labels with `undefined`, both forms in the DOM, summed counts, clear all, done, focus return, `{...props}` order), hydration under `StrictMode`; real browser (a pinned narrow bar where a real click opens the sheet at the bottom edge and window width, a choice made in it and the count following, the inline form above the step, a real-keys walk and focus return, growing the bar closing an open sheet, no page overflow, axe).
- **Then:** the list page drops `FiltersSheet`, `ChoiceFilter` and their styles (its threshold becomes `md`, 48rem), recorded in its review file.

## Built: the `Filters` group (2026-11-09), not yet reviewed
Built to the Decisions above, with two small departures: the group takes no `aria-label` (its inline toolbar is named by `labels.group`), and `Filter` gained two `labels` keys (`named`, `before`) with `value` and `labelPlacement`. Files: `TableToolbarFilters.tsx`, `tableToolbarContext.ts` and `safeCount.ts` (split out so the parts can share them), `TableToolbar.ssr.test.tsx`, the part's stories, snippets and Docs sections, and `FiltersDemo` in the story kit.
- **Found while building it:** jsdom applies the stylesheet, so the sheet's button, hidden while the bar is wide, has no accessible name in a unit test (the tests find it by its class and read its `aria-label`). The drawer's own close button is also named "Close", so a `labels.done` of "Close" meets two. A first version of a real-keys check assumed focus stays on a link after Enter; it does not (that is `TableOfContents`, unrelated).
- **Checks run:** 23 new unit tests (the `Filter` value forms, both forms in the DOM, the sheet's sections, summed counts, clear all, Done, focus return, `labels` with `undefined`, a wrapped filter left out, the ref and attributes, the warning, `StrictMode`, axe closed and open), a server render and hydration under `StrictMode`, and six real-browser checks (the inline form while wide with the sheet button not drawn, the sheet by a real click at the bottom edge and the window's width with a choice following into the button and focus returning, the sheet by real keys, an open sheet closing when the bar grows, and the value form). Broken once and failed: the close-on-grow observer (removed), and the narrow rule that hides the inline form.
- **Budgets:** `TableToolbar` 23.95KB JS and 10.81KB CSS (25KB and 11.5KB), `DataTable` 38.31KB and 14.16KB (40KB and 15KB), the notes in `scripts/check-component-bundle-size.mjs`.
- **Not verified:** a real phone, Safari and Firefox (container queries and `:has` are in all current ones), a screen reader reading the sheet, a table inside a flex row (the bar needs a width of its own, as the Docs say).
- **The review** (`/review-component`) comes before this is re-confirmed as Finalized.

## Review of the `Filters` group (2026-11-10), six findings fixed at explicit direction
- **The Filter Docs table** lacked `value` and `labelPlacement` (and listed `max` last, with a stale `labels` description); the Docs-only story and the order list now have them.
- **The sheet ignored a filter's `onClear` and `disabled`.** A section now offers the filter's own Clear (named "Clear Status", with its visible word first, from that filter's `labels.clear`) while some of it is applied; a disabled filter is drawn inline, disabled, and has no section.
- **Focus across the swap (the maintainer chose to hand it on).** Focus in the inline filters goes to the sheet's button when the bar narrows, and back to a filter when it widens; kept from the focus events (not read from `document.activeElement` at the change), and left alone if focus had moved on. A real-key check fails without it. This changes what [ADR-0199](../adr/0199-tabletoolbar-gets-an-opt-in-filters-group-that-draws-its-filters-inline-and-as-one-bottom-sheet-below-a-container-width-over-a-per-filter-sheet-a-window-step-or-a-page-built-sheet.md) accepted ("a resize hides a focused inline filter").
- **The ref** is merged once (`mergeRefs` in a `useMemo`), not recreated each render.
- **Right to left:** the toolbar inside `Filters` did not follow a right-to-left page (a `Toolbar` reads `dir` from its own prop or a `DirectionProvider`, not the page), found by the new check. `Filters` takes `dir` (resolved through `useDirection`) and gives it to its toolbar. The check, under a `DirectionProvider`: the name is at the start (right), the sheet's names at the right edge and their Clear at the left.
- **The inventory row and this file's "What it is"** name the new part and `Drawer`.
- Broken once and failed: the focus hand-off (its `focus()` call commented out) and the sheet heading row's direction. Not verified: a screen reader in the sheet, a real phone, Safari and Firefox, and the tablet width by eye.

