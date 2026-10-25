# DatePicker — review findings

Ninth organism, built 2026-10-17 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Finalized
2026-10-17** by the user, after the review pass (`/review-component DatePicker`) and its fixes (below), with the items under
"Open at the end of the review" accepted as open. What follows is what was decided and found while building it.

## Decisions
- A single date in three segments with a `Calendar` popover, an explicit `format`, and no range or time part: [ADR-0082](../adr/0082-datepicker-is-a-single-date-segmented-field-with-a-calendar-popover-and-an-explicit-format-over-a-masked-text-input-a-range-mode-or-a-date-time-field.md).
- The field's box is drawn exactly as `TimePicker`'s (its stylesheet's rules, with the AM/PM and wheel rules removed and a four-digit year segment added), so it matches `Input`'s height at every size and draws its focus ring on its own edge. `DatePicker` is in the field-focus-ring check list (`05` §6).
- The calendar is `Calendar` in single mode (or, by month, `Calendar`'s months grid: [ADR-0084](../adr/0084-datepicker-chooses-a-month-with-a-granularity-prop-that-reuses-calendars-months-grid-over-a-separate-monthpicker.md)); `min`, `max`, `isDateDisabled`, `weekStartsOn`, `showTodayButton` and `today` are `DatePicker`'s own props and everything else goes through `calendarProps` (the props the field owns are left out of its type).
- Segment entry is its own module (`internal/date/dateEntry.ts`, with its own tests), not shared with `TimePicker`'s; the reasons are in ADR-0082.
- Two component tokens, `date-picker.segment-width` and `date-picker.year-width` (`03` token table). No other new token; the panel's width is `Radix`'s available width, and the rule for it is doubled (`.panel.panel`) so it beats `Popover`'s `max-width` whatever order the stylesheets load in.
- Bundle: 15.85KB JS / 3.83KB CSS gzipped after the additions and fixes below, so an 18KB JS override with its reason in `check-component-bundle-size.mjs`.
- No new dependency.

## Shared hook
`useViewportRoom` moved from `Combobox`'s folder to `internal/` (approved by the maintainer) now that two components use it; a file move and one import, with no change to `Combobox`'s behaviour, API or output, so its Finalized status stands.

## Added after the first build (2026-10-17, at the maintainer's direction)
- **The panel is anchored to the whole field** with a trigger-less Radix anchor, and has `side`, `align` and a `presentation` (`"full-width"` spans the visible screen, with a map like `Combobox`'s): [ADR-0083](../adr/0083-datepicker-anchors-its-panel-to-the-whole-field-with-a-trigger-less-radix-anchor-and-offers-side-align-and-a-full-width-presentation-over-the-popover-molecule-and-its-button.md). This replaces the button-anchored panel, and the "starts left of a narrow field" finding below no longer applies. The button toggles the state itself; focus is handed back to it on close, except after a press elsewhere.
- **`presets`:** `{ label, value }` buttons in a named group under the calendar; a value is a date or a function of today's date; one outside `min`/`max` or unavailable is disabled.
- **`min="today"` and `max="today"`**, following the `today` prop or the browser's date once loaded (nothing is held back before, so a server render and the first client render agree).
- **`unavailableReason`:** a reason makes a date unavailable, is added to the day's accessible name (without a dot marker, which `getMarker` would draw), is shown on a reserved line under the calendar while that day has focus or the pointer, and is the form message for a typed date. A check measures that the panel does not change height as the reason appears.
- **Bound messages:** `beforeMin` and `afterMax` labels say the bound as the field writes dates (`"Choose 05.10.2026 or later"`).
- **`granularity="month"`:** [ADR-0084](../adr/0084-datepicker-chooses-a-month-with-a-granularity-prop-that-reuses-calendars-months-grid-over-a-separate-monthpicker.md). Month segment announced by name in both modes ("October"), from the calendar's own `months` labels.
- **Not done, on purpose:** the preset functions are not asked on a server (they need today); `isDateDisabled` and `unavailableReason` do not grey out the months grid.

## What was found while building it
- **Carrying a digit into the next segment lost it.** Typing "1" then "3" in the month finishes the month and carries the 3 into the day as a first digit; moving focus to the day fired the month's blur, which cleared the *shared* pending-digit state, so a following "1" started the day afresh instead of making 31. The blur now clears only its own segment's digits. (`TimePicker` clears pending state in the same way on blur; its carry case is exercised by a test that doesn't type a third digit, so it was not changed here.)
- **A separator key moves on whether or not a digit was typed**, as in a native date field; the "only after a digit" rule applies to pasted and inserted text, where `touched` is meaningful.
- **A programmatic `.click()` did not open the calendar in the preview, a real click did**; the real-browser checks use a real pointer through the DevTools Protocol, as `Dialog.checks.stories.tsx` does.
- **The panel measured wider than the field and was shifted by collision handling** when it was anchored to the button, so a field narrower than the 300px panel saw it start left of the field. Fixed by anchoring to the whole field (ADR-0083).
- **Field height is `Input`'s, not `Button`'s:** the field is 2px shorter than a `Button` of the same size (as `TimePicker`'s is). Copy and the check say `Input`.
- **Calendar day state is on the cell, not the button:** `aria-disabled` and `aria-selected` are on the `td`, so tests read the day's `closest("td")`.

## Review pass (2026-10-17) and its fixes
The §9 review (`/review-component DatePicker`) found twelve things; all are fixed.
- **Focus dropped to `<body>` after a keyboard-opened close** if an earlier opening had been closed by a press elsewhere (`interactedOutside` was reset only by the button). Reset on every opening, and focus now goes back to where the panel was opened from: the segment for `Alt`+`ArrowDown`, the button otherwise.
- **The day that is already chosen did nothing**: `Calendar` doesn't call `onValueChange` for an unchanged date, so the panel stayed open. The panel treats a press on it as a choice (reporting nothing, announcing it).
- **The five public types were not exported** (`DatePickerGranularity`, `DatePickerPreset`, `DatePickerPresentation`, `DatePickerSide`, `DatePickerAlign`); a test now uses them through `index.ts`.
- **A value that doesn't fit the granularity read as empty without a word.** A development warning now names it; the Playground story and its snippet cut the demo date to its month when `granularity` is switched.
- **The reason line went stale** across closing and reopening, and when focus moved to a preset or an arrow. It lives in the panel, so it starts empty on each opening, and anything that isn't a day clears it.
- **`container`** added (Radix-primitive prop audit), as `Combobox` has; the other layer props stay unexposed on purpose.
- **A chosen date is now announced** ("Date chosen: …", `labels.chosen`) through a status region in the page from the start, using the shared `useAnnouncement`; focus returns to a button whose name doesn't change, so nothing else said it.
- **The year a stepped empty year starts at** and the month grid's fallback used the UTC year while `today` is the local date; both use `today`, else the browser's date.
- **A development warning for `align` with a full-width panel**, as `Combobox` has.
- **`DatePicker.tsx` was 819 lines.** The value, draft and typing are `useDatePickerValue.ts`, the panel's contents are `DatePickerPanel.tsx`, and the component is the field, the keys and the layer.
- **Tests added:** both focus paths in jsdom and a real browser, the chosen day chosen again (mouse and Enter), the reason line's reopen, focus and pointer paths, the exported types, the value warning, `container`, the announcement, the year fallback and the `align` warning; the preset buttons' target size is in a real-browser check. The new tests were broken on purpose once to see them fail.
- ADR-0082's stale 16KB figure is amended.

## Checks run (2026-10-17)
- `pnpm lint` (ESLint, both typechecks): clean.
- Unit project: `DatePicker` 172 tests across the component, server render and hydration (11 variants each), the docs-token guard and `dateEntry` (30), all passing, plus `storySnippets.test.ts`.
- Chromium Storybook project: 28 stories for `DatePicker` and its checks, plus the two new field-focus-ring cases, all passing. The checks cover the panel's place, font and z-index, a real mouse choosing a day inside a `Dialog` and inside a `Popover`, text inserted all at once through `Input.insertText`, the field's width and segments not moving as digits are typed, 24×24px targets and Input-matching height at all five sizes, right-to-left order, a keyboard round trip, focus not pulled back after a click elsewhere, controlled round trip and forced colours. The height check was broken on purpose once to see it fail.
- Docs page opened in a running Storybook: 11 sections, 14 canvases, the Properties table with every default as written, no error display; dark mode with the Emerald brand looked at with the calendar open.
- `pnpm build` and `check-component-bundle-size`: within budget.

## Open at the end of the review
- `DatePicker` imports `CalendarPicker`, `calendarHelpers`, `buildLabels` and `Calendar`'s stylesheet from `Calendar`'s folder (ADR-0084); a change there needs a look here too.
- Not run: a screen-reader pass, a real phone's on-screen keyboard, Windows high-contrast mode (only Chromium's emulation), Firefox and Safari, light Emerald and a tablet width, and a fresh contrast measurement of the reason line and the preset buttons (both are existing token pairings).
- The related-card preview scales a `Calendar` to half size with a transform.
- Making the full-width presentation the default below `sm` waits for a real device ([ADR-0083](../adr/0083-datepicker-anchors-its-panel-to-the-whole-field-with-a-trigger-less-radix-anchor-and-offers-side-align-and-a-full-width-presentation-over-the-popover-molecule-and-its-button.md)).

## Icons at the input's own step, 2026-10-19 (visual change; stays Finalized)

At explicit direction, following `Input`'s own change (see [Input](Input.md)): the icons this component draws in the field are the same step as its `size` (`xs` 12px … `xl` 32px) instead of one step below it. The calendar and clear buttons' compensating margins are recomputed, with `space.2` of padding at `lg` and `xl` (was `space.3`) so the larger button stays inside the field's padding; the field is no taller than a plain `Input` (measured). A real-browser check in `Input.checks.stories.tsx` measures the icons at every size.

## Status region only with a calendar (2026-10-25, authorized fix; stays Finalized)

At explicit direction, while building [DateRangePicker](DateRangePicker.md): the empty `role="status"` region the field announces a chosen date in is drawn only when `showPicker` is on. With the calendar off nothing can be announced there, and two of them were an empty region apiece inside every `DateRangePicker`. Additive to what anyone hears or sees (the only change is a DOM node that never had text, gone when `showPicker={false}`), so it stays Finalized under the three-question test; one unit test checks it.

## `rounded`, 2026-10-25 (authorized addition; stays Finalized)

At explicit direction: a `rounded` prop (default `false`) draws the calendar's days and month buttons as circles, and the cells of the grid of months by month, by putting `Calendar`'s own `rounded` class on the months wrapper and passing the prop to its buttons. Only the panel changes; the field keeps its corners. It replaces `rounded` through `calendarProps`, whose type now leaves it out (unpublished, so no migration). Purely additive: no existing value renders differently, so the component stays Finalized, with the new surface's own mini-pass (JSDoc, Storybook control and Playground snippet, Docs line, two unit tests and a real-browser check of the radii, broken on purpose once to see it fail).
