# 0131 — `DateRangePicker` chooses whole months with a `granularity` prop on `Calendar`'s months grid, edits the start from the start, requires both ends and clears by remounting the ends, over a separate month picker or always restarting

**Status:** Accepted · **Date:** 2026-10-25

## Context
[ADR-0129](./0129-daterangepicker-is-two-datepicker-ends-with-one-range-panel-of-its-own-anchored-to-the-whole-pair-and-a-start-end-value-submitted-as-name-array-over-one-combined-field-a-range-mode-on-datepicker-or-a-panel-extracted-from-it.md) and [ADR-0130](./0130-daterangepickers-calendar-chooses-the-end-when-opened-from-the-end-shows-start-only-while-the-end-is-next-and-holds-calendar-picks-by-commiton-over-restarting-on-every-opening-or-holding-nothing.md) left four gaps found on the day the component was built: periods of whole months (a billing period, a report from March to June) had no field, the start of a whole range could only be changed by restarting it, a start with no end (or the reverse) could be submitted, and the clear button ignored a half-typed end and left it in place.

## Decision
**`granularity="month"`, as `DatePicker` has it.** Each end is a month and a year, the value is `["YYYY-MM", "YYYY-MM"]`, and the panel is `Calendar`'s months grid (`CalendarPicker`, with its year and years views) in place of the days. The grid has no range model, so the pair applies the calendar's own rule to a choice: the first month is the start and the grid stays open, a later one is the end, an earlier one starts again. `min`, `max` and presets are months (a whole date is read as its month); `isDateDisabled` and `unavailableReason` only flag a month in a field, as in `DatePicker`. The length limits and `numberOfMonths` have no meaning by month and warn in development. The grid does not draw the months between the ends, since `Calendar`'s months grid has no marker for a chosen month; the fields show the picks.

**Opened with `Alt`+`ArrowDown` from the start of a whole range, the calendar chooses the start and keeps the end.** The date chosen becomes the start with the end unchanged, unless it is after the end or would break a length limit, in which case it starts a new range (the end next, as in ADR-0130). Opened from the button, or from a start with no end, nothing changes from ADR-0130. This replaces ADR-0130's "from the start, the first date chosen starts a new range".

**A range needs both ends.** Once one end holds a date the other is `required`, whether or not the pair is, so the browser refuses a half range and `aria-required` says so. A completely empty pair is allowed unless `required`.

**Clear empties both ends and what is half typed in them.** Each end is given a `key` that changes on clearing, so it starts afresh (an end whose value is already `""` cannot be told to drop its typed digits through `value`). The clear button shows while any segment holds anything, read from the segments themselves after each render, key and insertion in the pair.

## Alternatives considered
- **A separate month range picker.** Two components for one idea; the ends, the limits' absence, the form and the focus code would be copied.
- **Drawing a strip of months in the grid.** Needs a chosen-month marker in `Calendar`'s Finalized grid; deferred until there is a need.
- **Day limits expressed in months** (`minRangeMonths`). More API for a rare need; not added.
- **Always restarting on a press.** Kept for the button; the segment's own `Alt`+`ArrowDown` says which end is being edited, so it can mean that.
- **A range-level message for a half range.** The ends' own `required` gives the browser's message and the correct `aria-required` with no second validity path.
- **A clear button that only clears values.** Left a half-typed end in place, the one thing the person asked to remove.

## Consequences
- The months grid is reused through `Calendar`'s folder (`CalendarPicker`), so a change there needs a look here too.
- The browser's own text is the message for a missing end; `labels` cannot translate it.
- Every end is remounted on clearing, so a controlled `value` and an uncontrolled one behave the same.

## Related
[ADR-0129](./0129-daterangepicker-is-two-datepicker-ends-with-one-range-panel-of-its-own-anchored-to-the-whole-pair-and-a-start-end-value-submitted-as-name-array-over-one-combined-field-a-range-mode-on-datepicker-or-a-panel-extracted-from-it.md); [ADR-0130](./0130-daterangepickers-calendar-chooses-the-end-when-opened-from-the-end-shows-start-only-while-the-end-is-next-and-holds-calendar-picks-by-commiton-over-restarting-on-every-opening-or-holding-nothing.md); [ADR-0084](./0084-datepicker-chooses-a-month-with-a-granularity-prop-that-reuses-calendars-months-grid-over-a-separate-monthpicker.md); `component-reviews/DateRangePicker.md`.
