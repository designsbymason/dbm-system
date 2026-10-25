# 0129 — `DateRangePicker` is two `DatePicker` ends with one range panel of its own, anchored to the whole pair, and a `[start, end]` value submitted as `name[]`, over one combined field, a range mode on `DatePicker` or a panel extracted from it

**Status:** Accepted · **Date:** 2026-10-25

## Context
[ADR-0082](./0082-datepicker-is-a-single-date-segmented-field-with-a-calendar-popover-and-an-explicit-format-over-a-masked-text-input-a-range-mode-or-a-date-time-field.md) left a range to `DateRangePicker`, which "composes this field or shares its segments", and [ADR-0031](./0031-timerangepicker-keeps-a-pair-of-times-of-day-and-judges-length-through-the-ends-own-rules.md) did the same for times: two fields, one value, and each end's own rules doing the judging. `Calendar` already chooses a range ([ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md)). Three forks were open: one field or two, whose panel it is, and what a form receives.

## Decision
**Two `DatePicker`s with `showPicker={false}`, joined by a dash.** Each end is a whole `DatePicker`, so segments, typing, paste, `format`, `separator`, `min`, `max`, `isDateDisabled`, `unavailableReason`, the hidden validated input, the focus ring on the field's own edge and the sizes are the ones that component already has and tests. The value is `[start, end]` of `"YYYY-MM-DD"` strings, `""` for an end not chosen (`["2026-10-05", ""]` is a range in progress), the shape `Calendar`'s range mode reports.

**The end can't be before the start; the start isn't held to the end.** The start narrows the end's `min`, so an end before it is flagged on that end and still reported, as `DatePicker` flags a date outside `min`. The start is left free, since flagging it would fire whenever the end is half typed (ADR-0031's reasoning, unchanged).

**The range's limits are the end's own `unavailableReason`.** `minRangeDays`, `maxRangeDays` and `rangeSpansUnavailable` are handed to the calendar and, once the start is whole, also turned into a reason on the end ("Choose a range of at most 14 days"), so the field, its form message and `aria-invalid` follow with no second validity path. The app's own reason for a date wins over a limit's.

**One panel of its own, anchored to the whole pair.** A Radix `Popover` with a trigger-less `Anchor` around the pair ([ADR-0083](./0083-datepicker-anchors-its-panel-to-the-whole-field-with-a-trigger-less-radix-anchor-and-offers-side-align-and-a-full-width-presentation-over-the-popover-molecule-and-its-button.md)) holds a `Calendar` in range mode, a reason line and range `presets` (`[start, end]`, or a function of today). `side`, `align`, `presentation`, `container` and the open state are `DatePicker`'s. The button after the end is the pair's own `IconButton`, as `TimeRangePicker`'s shared picker is, with one clear button for both ends. The panel's classes are `DatePicker`'s (the later component imports the earlier one's stylesheet, `05` §1). `numberOfMonths` takes a breakpoint map, one month on a phone and two beyond it.

**A form receives two values under `name[]`,** start then end, each from its end's hidden date input (`RangeSlider`'s and `Calendar`'s way), so `required`, a half-filled end, a date outside the bounds and a broken limit refuse a submit with a message that says which.

## Alternatives considered
- **One combined field with a single box.** One border and one focus ring, but it needs the segments, typing and validation of `DatePicker` rebuilt or extracted, which reopens a Finalized component for a look. Two fields reuse all of it and match `TimeRangePicker`.
- **A `mode="range"` on `DatePicker`.** Rejected in ADR-0082: two ends, two fields and a different report.
- **Extracting the panel logic (anchor, focus hand-back, viewport room) into `internal/` now.** It is the second consumer, and `05` §1 extracts at the third unless the third is certain; none is. The about 120 lines are written again here and the shared hook (`useViewportRoom`) is already in `internal/`. Extract when a third floating field needs them.
- **A range-level validity check.** A second flagging, messaging and form path to keep in step with the ends'; routing limits through the end's reason costs one function.
- **A value that is a single string** (`"2026-10-05/2026-10-09"`). Needs parsing and breaks `name[]` submission as plain dates.

## Consequences
- The bundle holds `DatePicker` and so `Calendar`: 19.31KB of JS, a 22KB override in `check-component-bundle-size.mjs`.
- No new token and no new dependency.
- The clear button shows while either end holds a complete date; an end that is only half typed is cleared with `Backspace`.
- A change to `DatePicker`'s props or its panel's classes needs a look here too.

## Related
`04-component-inventory.md` (`DateRangePicker`); `05-component-api-conventions.md` §1 and §3; [ADR-0130](./0130-daterangepickers-calendar-chooses-the-end-when-opened-from-the-end-shows-start-only-while-the-end-is-next-and-holds-calendar-picks-by-commiton-over-restarting-on-every-opening-or-holding-nothing.md); `component-reviews/DateRangePicker.md`.
