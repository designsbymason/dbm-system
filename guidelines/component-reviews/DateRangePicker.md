# DateRangePicker — review findings

Sixteenth organism, built 2026-10-25 from the plan the maintainer approved (`/plan-component DateRangePicker`, decisions D1–D9 as recommended). **Not yet Finalized:** the §9 review pass (`/review-component DateRangePicker`) has not been run, and only the maintainer declares a component Finalized. What follows is what was decided and found while building it.

## Decisions
- Two `DatePicker` ends with `showPicker={false}`, one panel of its own anchored to the whole pair, a `[start, end]` value submitted as `name[]`, the range's limits as the end's own reason: [ADR-0129](../adr/0129-daterangepicker-is-two-datepicker-ends-with-one-range-panel-of-its-own-anchored-to-the-whole-pair-and-a-start-end-value-submitted-as-name-array-over-one-combined-field-a-range-mode-on-datepicker-or-a-panel-extracted-from-it.md).
- The calendar chooses the end when opened from the end, shows `[start, ""]` while the end is next, and holds picks by `commitOn`: [ADR-0130](../adr/0130-daterangepickers-calendar-chooses-the-end-when-opened-from-the-end-shows-start-only-while-the-end-is-next-and-holds-calendar-picks-by-commiton-over-restarting-on-every-opening-or-holding-nothing.md).
- `DatePicker` and `Calendar` were not edited. The panel's chrome is `DatePicker`'s stylesheet (imported, `05` §1), its reason-line logic and the anchor, focus hand-back and viewport-room code are written again in `DateRangePicker.tsx` and `DateRangePickerPanel.tsx`; extraction waits for a third consumer.
- No new token and no new dependency. `numberOfMonths` is resolved here (`{ base: 1, sm: 2 }`), so `Calendar` still takes a plain number.
- Bundle: 19.31KB JS / 4.80KB CSS gzipped, so a 22KB JS override with its reason in `check-component-bundle-size.mjs`.

## What was found while building it
- **`Calendar`'s range model needs no change for editing the end.** Handed a controlled `[start, ""]`, it takes the next date as the end and a date before the start as a new start, which is all ADR-0130's "choose the end" needs (the spike was reading `choose` and `ruleBounds` in `Calendar.tsx`, then the unit tests).
- **The ends need the calendar's month names.** `DatePicker` reads the month segment's spoken name from `calendarProps.labels.months`, so `DateRangePicker` forwards just `labels` to each end; a test found it (the month segment read "10" instead of the translated name).
- **A rerender with a new `defaultValue` does not change an uncontrolled pair**, so the unit tests for the length limits render each case on its own.
- **`Alt`+`ArrowDown` still bubbles from an end whose `showPicker` is off:** `DatePicker` calls `preventDefault` before checking `showPicker`, so the range's own group-level handler can't test `defaultPrevented`.
- **A phone check that only measured the panel's edges passed with the full-width form removed** (an anchored panel is shifted to the screen's edges anyway). It now also asserts the panel's computed `max-width` is `none`, and was broken on purpose to see it fail.

## Checks run (2026-10-25)
- `pnpm lint` (ESLint, both typechecks): clean.
- Unit project (whole package): 188 files, 10,316 tests, all passing; `DateRangePicker` is 154 of them across the component (74), server render and hydration (18 variants each), the docs-token guard and `dateRangeValue`.
- Chromium Storybook project (whole package): 285 files, 2,200 tests, all passing; 33 are `DateRangePicker`'s (18 stories and 13 checks). The checks cover the panel's place, font and z-index, a real mouse choosing a whole range inside a `Dialog`, text inserted all at once into each end through `Input.insertText`, the pair's width not moving as digits are typed, 24×24px targets and `Input`-matching height at all five sizes, one month on a phone and two beyond, a full-width panel on a phone, the reason line not changing the panel's height, right-to-left, a keyboard round trip from the end, focus after an outside press, and the presets' targets with a real mouse. Three of them were broken on purpose (the end-first rule, the side offset and the full-width class) and failed.
- Every snippet was typechecked as written against the real components in a throwaway file (a planted bad prop failed it).
- `pnpm build` and `check-component-bundle-size`: within budget.
- Docs page opened in a running Storybook: 11 sections, 18 canvases, the Properties table 48 rows with no empty description, no error display; the presets and limits stories looked at, the latter in dark mode with the Emerald brand, with the calendar open.

## Open (not run, for the review pass)
- A screen-reader pass, a real phone's on-screen keyboard and touch, Windows high-contrast mode (the ends are `DatePicker`'s and carry its forced-colours check; the range adds no colour of its own), Firefox and Safari, light Emerald and a tablet width.
- The full §9 checklist, including the feature-completeness pass, the Radix `Popover` prop audit and the theming sweep across all four themes.
- The pair renders three `role="status"` regions (one for each end, always empty, and its own); harmless to assistive technology, but worth a look in the review.
- The clear button shows while either end holds a complete date; a half-typed end is cleared with `Backspace`.
- `DateRangePicker` imports `DatePicker`'s stylesheet, its types and its `datePickerReason` helper, and `Calendar`'s `calendarHelpers` and `calendarLabels`; a change there needs a look here too.
