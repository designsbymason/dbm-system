# 0130 — `DateRangePicker`'s calendar chooses the end when it is opened from the end, shows the start alone while the end is next, and holds calendar picks by `commitOn`, over restarting the range on every opening or holding nothing

**Status:** Accepted · **Date:** 2026-10-25 · "opened from the start, the first date chosen starts a new range" is superseded by [ADR-0131](./0131-daterangepicker-chooses-months-edits-the-start-from-the-start-requires-both-ends-and-clears-by-remounting-over-a-separate-month-picker-or-restarting.md); the rest stands

## Context
`Calendar`'s range model has no notion of an end to edit: the first choice is the start, the second the end, a third starts again, and an earlier choice replaces the start. Opened over a whole range, a press on a date would always restart it, so correcting only the end meant retyping it. And each choice in the calendar is a change of value that `commitOn` is meant to be able to hold ([ADR-0031](./0031-timerangepicker-keeps-a-pair-of-times-of-day-and-judges-length-through-the-ends-own-rules.md): picks follow `commitOn`).

## Decision
**Opened from a segment of the end (`Alt`+`ArrowDown`) with a whole start, the calendar chooses the end.** The range handed to `Calendar` is `[start, ""]`, so its own model takes the next date as the end (or a date before the start as a new start), the start keeps its value, and nothing is reported until a date is chosen. Closing it without a choice changes nothing. Opened from the button or from the start, it shows the range as it stands and the first date chosen starts a new one.

**After the first date of a new range is chosen,** the calendar stays open with `[start, ""]` and the end is next, as `Calendar` reports it; the second date completes the range, announces it ("Dates chosen: … to …") and closes the panel, returning focus to where it was opened from.

**`commitOn` holds calendar picks.** With `"change"` each pick is reported (`[start, ""]` and then the whole range). With `"complete"` or `"blur"` the picks are held, shown in the fields and the calendar meanwhile, and reported when the range is whole or the calendar closes, whichever comes first; a preset and the clear button are decisions and never held. A range set from outside while picks are held wins over them.

## Alternatives considered
- **Always restart on a press.** One rule, but correcting an end needs the start chosen again, and the keyboard shortcut from the end would say one thing and do another.
- **Two calendars, or a toggle for which end is being chosen.** More surface for a gesture the end field already says by being where the person was.
- **Reporting nothing until the range is whole, whatever `commitOn` says.** A form bound to the value would not see a start until an end exists, and an owner that wants to react to the start (to set a limit on the end) could not.
- **Holding nothing.** The pair would report each pick even when asked to wait, unlike every field it is built from.

## Consequences
- A start chosen alone is reported as `[start, ""]` under `commitOn="change"`, which drops the previous end; the Docs page says so.
- The held picks are flushed from an effect on the calendar closing, so a controlled `open` that closes the panel from outside flushes them too.

## Related
[ADR-0129](./0129-daterangepicker-is-two-datepicker-ends-with-one-range-panel-of-its-own-anchored-to-the-whole-pair-and-a-start-end-value-submitted-as-name-array-over-one-combined-field-a-range-mode-on-datepicker-or-a-panel-extracted-from-it.md); [ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md); `component-reviews/DateRangePicker.md`.
