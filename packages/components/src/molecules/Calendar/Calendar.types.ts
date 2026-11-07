import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * The size of the calendar, on the standard 5-step scale. It sets
 * the size of a day's square (the same step as `IconButton`, so a day is as tall as a `Button` of that size)
 * and of the text in it.
 */
export type CalendarSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * What choosing a date means.
 *
 * - `"single"` (the default) — one date.
 * - `"range"` — a first date and a last: the first choice is the start, the second the end, and a third
 *   starts a new range.
 * - `"multiple"` — any number of separate dates: choosing a date adds it, choosing it again takes it away.
 * - `"week"` — a whole week: choosing any of its days chooses the row, from the day the week starts on to the day
 *   before the next one. The value is the date the week starts on.
 */
export type CalendarMode = "single" | "range" | "multiple" | "week";

/** The day a week starts on, as `Date#getDay` counts: 0 is Sunday, 1 Monday, … 6 Saturday. */
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A chosen range: the first and the last date as `"YYYY-MM-DD"` strings, `""` for one not chosen yet. A range
 * whose start is chosen and end isn't, `["2026-10-05", ""]`, is a range in progress.
 */
export type CalendarRangeValue = readonly [start: string, end: string];

/**
 * How the month and year are shown above each grid.
 *
 * - `"label"` (the default) — as text: "October 2026".
 * - `"dropdown"` — as two select fields, one for the month and one for the year, so a far-off date is one choice
 *   away instead of many presses of the month buttons. With more than one month on show, only the first month gets the
 *   fields; the others keep their text.
 * - `"views"` — as a button: choosing it swaps the days for a grid of the year's twelve months, and choosing its year
 *   swaps that for a grid of years, so a far-off date is found by narrowing down — year, month, day. Only with one
 *   month on show; with more, the layout is `"label"`.
 */
export type CalendarCaptionLayout = "label" | "dropdown" | "views";

/** The colour of a day's marker dot. The same tones the system uses elsewhere, as `tone`. */
export type CalendarMarkerTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "highlight";

/** What `getMarker` returns for a day it wants to mark. */
export interface CalendarMarker {
  /**
   * The colour of the dot drawn under the day's number. On a chosen day the dot is drawn in the on-brand colour whatever
   * the tone, as every tone would be lost against the fill.
   * @default "brand"
   */
  tone?: CalendarMarkerTone;
  /**
   * Your own content for the day's marker slot — a price, a count, a small icon — drawn under the number instead of
   * the dot. It is purely visual (hidden from assistive technology): say what it means in `label`. Needs room: the
   * slot is as high as the text at the `xs` step, so use it from `lg` up, or keep the content to a dot-sized shape.
   */
  content?: ReactNode;
  /**
   * What the marker means, added to the day's accessible name ("…, 2 events"). Without it the marker is decorative. When `content`
   * shows text, start `label` with those same words ("$80"): the name then opens with the day's number and this label, so what is
   * on screen is in the name, in order (WCAG 2.5.3).
   */
  label?: string;
}

/** The facts about one day that its accessible name is built from. All plain numbers. */
export interface CalendarDayInfo {
  /** The year, for example `2026`. */
  year: number;
  /** The month, 1 (January) to 12. */
  month: number;
  /** The day of the month, from 1. */
  day: number;
  /** The day of the week, 0 (Sunday) to 6 (Saturday). */
  weekday: number;
}

/**
 * Every piece of text the component supplies itself — accessible names, the month and weekday names, and
 * the month heading. English by default; pass your own to translate them.
 */
export interface CalendarLabels {
  /** The accessible name of the calendar as a whole. @default "Calendar" */
  calendar: string;
  /** The accessible name of the previous-month button. @default "Previous month" */
  previousMonth: string;
  /** The accessible name of the next-month button. @default "Next month" */
  nextMonth: string;
  /**
   * The twelve month names, January first, written in full. They make up the default heading and day names, so
   * translating these translates both.
   * @default ["January", "February", …, "December"]
   */
  months: readonly string[];
  /**
   * The twelve month names as they are drawn in the month field's closed button (`captionLayout="dropdown"`), January
   * first — short enough to leave room for the arrow beside them. The list it opens, and everything announced, uses the
   * full names in `months`, so keep each one the start of the full name.
   * @default ["Jan", "Feb", …, "Dec"]
   */
  monthsShort: readonly string[];
  /**
   * The seven weekday names, Sunday first (whichever day the week starts on), written in full. They name the
   * column headings and the days.
   * @default ["Sunday", "Monday", …, "Saturday"]
   */
  weekdays: readonly string[];
  /**
   * The seven weekday names as they are drawn in the column headings, Sunday first. Keep each one the start of
   * the full name in `weekdays`, so what a heading shows is part of what it is called.
   * @default ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
   */
  weekdaysShort: readonly string[];
  /**
   * The heading above the grid, and what is announced when the month changes, given the plain year and month
   * (1 to 12). Write the year with your own `formatNumber`.
   * @default `${months[month - 1]} ${year}`, the year written with `formatNumber`
   */
  monthYear: (year: number, month: number) => string;
  /**
   * The accessible name of a day, given the plain numbers. It should contain the number the day shows, as the
   * label-in-name rule expects, so write the day with your own `formatNumber`.
   * @default `${weekdays[weekday]}, ${months[month - 1]} ${day}, ${year}`, the day and year written with `formatNumber`
   */
  day: (info: CalendarDayInfo) => string;
  /** Added to the name of today's date. @default "today" */
  today: string;
  /** Added to the name of the first date of a range. @default "range start" */
  rangeStart: string;
  /** Added to the name of the last date of a range. @default "range end" */
  rangeEnd: string;
  /** The accessible name of the previous-year button in the month grid (`captionLayout="views"`). @default "Previous year" */
  previousYear: string;
  /** The accessible name of the next-year button in the month grid. @default "Next year" */
  nextYear: string;
  /** The accessible name of the previous-page button in the year grid. @default "Previous years" */
  previousYears: string;
  /** The accessible name of the next-page button in the year grid. @default "Next years" */
  nextYears: string;
  /**
   * The accessible name of the heading button over the days, which opens the month grid, given the heading as it is
   * drawn ("October 2026"). Keep the heading inside it, so what the button shows is part of what it is called.
   * @default `${heading}, choose a month`
   */
  openMonths: (heading: string) => string;
  /**
   * The accessible name of the heading button over the months, which opens the year grid, given the year as it is
   * drawn. Keep the year inside it.
   * @default `${year}, choose a year`
   */
  openYears: (year: string) => string;
  /**
   * The heading over the year grid, and what is announced when it opens, given its first and last year as drawn.
   * @default `${from} – ${to}`
   */
  yearsRange: (from: string, to: string) => string;
  /**
   * The accessible name of the month grid, and what is announced when it opens, given the year as drawn.
   * @default `Months of ${year}`
   */
  monthsView: (year: string) => string;
  /**
   * Announced when a week has been chosen (`mode="week"`), given the names of its first and last day.
   * @default `Week ${start} to ${end}`
   */
  weekChosen: (start: string, end: string) => string;
  /** The accessible name of the month field (`captionLayout="dropdown"`). @default "Month" */
  monthSelect: string;
  /** The accessible name of the year field (`captionLayout="dropdown"`). @default "Year" */
  yearSelect: string;
  /**
   * What is announced when the months on show change with more than one month showing, given the first and the last
   * month's headings (each already written by `monthYear`).
   * @default `${first} – ${last}`
   */
  monthRange: (first: string, last: string) => string;
  /** The text of the footer's button that goes to today (`showTodayButton`). @default "Today" */
  todayButton: string;
  /** The text of the footer's button that clears the choice (`clearable`). @default "Clear" */
  clearButton: string;
  /** The heading of the week-number column as it is drawn (`showWeekNumbers`). @default "Wk" */
  weekNumberShort: string;
  /** The accessible name of the week-number column. @default "Week number" */
  weekNumberColumn: string;
  /** The accessible name of a week's number, given the plain number. @default `Week ${number}`, written with `formatNumber` */
  weekNumber: (week: number) => string;
  /**
   * Announced when the start of a range has been chosen, given the chosen day's name (as `day` writes it).
   * @default `Range start ${day}`
   */
  rangeStartChosen: (day: string) => string;
  /**
   * Announced when the end of a range has been chosen, given the names of its two days.
   * @default `Range ${start} to ${end}`
   */
  rangeChosen: (start: string, end: string) => string;
  /**
   * Announced when a date is added to or taken from the chosen dates in `multiple` mode, given how many are chosen now.
   * @default `${count} dates selected` ("1 date selected" for one), the number written with `formatNumber`
   */
  datesChosen: (count: number) => string;
  /** The accessible name of the key (`showLegend`). @default "Key" */
  legend: string;
  /** The key's text for today's date. @default "Today" */
  legendToday: string;
  /** The key's text for the chosen date, or the two ends of a range. @default "Selected" */
  legendSelected: string;
  /** The key's text for the dates between the ends of a range. @default "In range" */
  legendRange: string;
  /** The key's text for dates that can't be chosen. @default "Unavailable" */
  legendUnavailable: string;
}

/** The props that single and range mode share. */
interface CalendarBaseProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "className" | "style" | "id" | "defaultValue" | "onChange" | "dir"
  > {
  /**
   * The month on show, as `"YYYY-MM"` — controlled. Pair with `onMonthChange` to update it, or the buttons and
   * keys that change month will appear frozen. Without it the calendar shows the chosen date's month, or the
   * month of `defaultMonth`, or the current month.
   */
  month?: string;
  /**
   * The month an *uncontrolled* calendar starts on, as `"YYYY-MM"`; it then tracks the month itself. Ignored
   * once `month` is also given.
   * @default the month of the chosen date, else the current month
   */
  defaultMonth?: string;
  /**
   * Called when the month on show changes — by the previous and next buttons, by Page Up and Page Down, or by
   * moving onto a date in another month — with the new month as `"YYYY-MM"`.
   */
  onMonthChange?: (month: string) => void;
  /**
   * The earliest date that can be chosen, as `"YYYY-MM-DD"`. Earlier dates are unavailable, the keys never move
   * focus before it, and the previous-month button is unavailable once the month on show holds it.
   */
  min?: string;
  /**
   * The latest date that can be chosen, as `"YYYY-MM-DD"`. The mirror of `min`.
   */
  max?: string;
  /**
   * A rule for dates that can't be chosen, given a date as `"YYYY-MM-DD"` — weekends, holidays, days that are
   * fully booked. They are drawn dimmed and marked unavailable, and can still be moved onto with the keyboard
   * (so the arrow keys never skip over them), but not chosen. Together with `min` and `max`.
   */
  isDateDisabled?: (date: string) => boolean;
  /**
   * The day a week starts on, 0 (Sunday) to 6 (Saturday). The columns, and Home and End, follow it. It is
   * explicit and never read from the browser's locale, so a server and a browser agree.
   * @default 0
   */
  weekStartsOn?: CalendarWeekStart;
  /**
   * Shows the days of the neighbouring months that fill the first and last weeks, dimmed. They can be chosen,
   * which moves the calendar to their month. With `false` those cells are left empty.
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Today's date as `"YYYY-MM-DD"`, which is marked in the grid. Left out, the calendar reads the clock in the
   * browser once it has mounted, so a server-rendered page and its first client render agree. Pass it to mark
   * another day as today, or to fix the date in a test or a screenshot.
   */
  today?: string;
  /**
   * The size of the calendar. A day is a square as tall as an `IconButton` of this step, and the calendar is
   * seven of them wide (less, on a screen narrower than that).
   * @default "md"
   */
  size?: CalendarSize;
  /**
   * How many months are on show side by side, 1 to 4 — two is the usual choice for a range that may cross a month. The
   * months wrap onto more than one row when the container is too narrow for them. The previous and next buttons move
   * the first month on show by one, and `month` / `defaultMonth` / `onMonthChange` are the first month on show.
   * Neighbouring months' days (`showOutsideDays`) are only drawn when one month is on show, as they would otherwise
   * appear twice.
   * @default 1
   */
  numberOfMonths?: number;
  /**
   * How the month and year are shown above the grid: as text, as two select fields, or as a button that opens a grid of
   * months and then of years, to jump to a far-off month or year. See `CalendarCaptionLayout`.
   * @default "label"
   */
  captionLayout?: CalendarCaptionLayout;
  /**
   * The first and last year the year field offers, with `captionLayout="dropdown"`. `min` and `max`, when set, narrow
   * it further; the year on show is always offered. Left out, it is the hundred years before this year and the twenty
   * after it.
   */
  yearRange?: readonly [from: number, to: number];
  /**
   * Adds a footer button that shows today's month and chooses today when it can be chosen (in range mode it is a
   * choice like any other). It is `aria-disabled` until the clock is known, and when the calendar is `disabled`.
   * @default false
   */
  showTodayButton?: boolean;
  /**
   * Adds a footer button that clears the choice (the date, or the whole range). It stays in the footer and becomes
   * `aria-disabled` when nothing is chosen, or the calendar is `readOnly` or `disabled`, so keyboard focus is never
   * lost when pressing it empties the calendar.
   * @default false
   */
  clearable?: boolean;
  /**
   * Your own content for the footer, below the grid and the key, after the built-in buttons: a note, a link, a row of
   * presets. It is yours to label and to make accessible.
   */
  footer?: ReactNode;
  /**
   * Marks a day with a dot, or with your own content, under its number — for events, bookings, prices. Called with a
   * date as `"YYYY-MM-DD"` for each day drawn, on every render, so keep it cheap and pure. Return nothing (or `false`)
   * for a day without a marker. See `CalendarMarker`.
   */
  getMarker?: (date: string) => CalendarMarker | false | null | undefined;
  /**
   * In range mode, the fewest days a range may span, counting both ends: a range from the 5th to the 7th is 3 days.
   * While the end is being chosen, the dates that would make the range shorter are unavailable. Ignored in single mode.
   * @default 1
   */
  minRangeDays?: number;
  /**
   * In range mode, the most days a range may span, counting both ends. While the end is being chosen, the dates that
   * would make the range longer are unavailable. Ignored in single mode.
   */
  maxRangeDays?: number;
  /**
   * In range mode, whether a range may run over an unavailable date. With `false`, once the start is chosen every date
   * after the first unavailable one is unavailable too — for a booking where a booked night can't be stepped over.
   * Ignored in single mode.
   * @default true
   */
  rangeSpansUnavailable?: boolean;
  /**
   * In `multiple` mode, the most dates that can be chosen. Once that many are, the others are unavailable (the chosen
   * ones stay available, so one can be taken away). Ignored in the other modes.
   */
  maxSelected?: number;
  /**
   * A field name, so the calendar submits with a surrounding `<form>` through hidden inputs: a single date as `name`
   * (an empty string when none is chosen), a range as two values under `name[]` (start, then end, an empty string for
   * an end not chosen), and several dates as one `name[]` for each. A `disabled` calendar submits nothing.
   */
  name?: string;
  /**
   * Adds a column of week numbers before the days: the ISO 8601 number (1 to 53, weeks counted from the first one
   * holding four days of the year) of the week each row is in, taken from the row's Thursday. They are not interactive.
   * @default false
   */
  showWeekNumbers?: boolean;
  /**
   * Whether every month is drawn as six rows of days, so the grid keeps one height whichever month it shows (the
   * default). With `false` a month is drawn as only the rows it needs, four to six, and what is below the calendar moves
   * as the month changes.
   * @default true
   */
  fixedWeeks?: boolean;
  /**
   * Slides and fades the months in when the month on show changes, in the direction of the change. It is off under the
   * reader's reduced-motion preference whatever this is set to.
   * @default true
   */
  animated?: boolean;
  /**
   * Draws the days and both month buttons round: a circle for each day, the chosen days, today's ring and the focus
   * ring, and round month buttons. The strip behind a range keeps its straight edges, so it still reads as one run.
   * @default false
   */
  rounded?: boolean;
  /**
   * Shows a key below the calendar that says what each look means: the ring around today, the solid fill of a chosen
   * date or the ends of a range, the soft fill between them (once a range is started) and the dimmed look of
   * unavailable dates (when anything can be unavailable). It lists only the looks that are on screen, so with nothing
   * chosen there is no "Selected" entry. Each entry is a small shape drawn the way the look is in the grid. The text is
   * in `labels`. (It could not be called `key`, which React keeps for itself and never passes to a component.)
   * @default false
   */
  showLegend?: boolean;
  /**
   * Makes every date and both month buttons unavailable. They stay focusable (they are `aria-disabled` rather
   * than natively disabled), so keyboard focus isn't lost.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the chosen date or range but doesn't let it change. Moving between months and moving focus over the
   * dates still work.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Moves keyboard focus to the date that Tab would land on, when the calendar mounts. As a calendar is a grid
   * of buttons, React's own `autoFocus` has nothing to act on.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Announces the new month to screen readers whenever the month on show changes — "November 2026" — through a
   * visually hidden status region. Set it to `false` if your own content already announces the change.
   * @default true
   */
  announce?: boolean;
  /**
   * The reading direction the calendar is drawn in. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page. Under
   * `"rtl"` the first day of the week is at the right, the month buttons and their arrows swap sides, and the
   * left and right arrow keys follow the picture.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
  /**
   * The text the component supplies itself — accessible names, month and weekday names, the heading. Any you
   * leave out keep their English default.
   */
  labels?: Partial<CalendarLabels>;
  /**
   * How a day or a year is written, for a language or region whose numerals differ from the plain 5 and 2026:
   * given a number, returns the text to show. Used for the number in every day, the year in the heading and, by
   * the default labels, in the accessible names, so what a day shows is always contained in its name. For example
   * `new Intl.NumberFormat("ar-EG").format`. Your own `labels` functions are given the plain numbers.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** An accessible name for the calendar. Defaults to `labels.calendar` ("Calendar"). */
  "aria-label"?: string;
  /** The id of an element that names the calendar; takes the place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Additional CSS classes, applied to the outermost element. */
  className?: string;
  /** Inline styles, merged onto the outermost element. */
  style?: CSSProperties;
  /** A DOM id, applied to the outermost element. */
  id?: string;
  /** Test identifier, rendered as the DOM `data-testid` attribute on the outermost element. */
  "data-testid"?: string;
}

/** `Calendar` choosing one date. */
export interface CalendarSingleProps extends CalendarBaseProps {
  /**
   * What choosing a date means. A single date is the default.
   * @default "single"
   */
  mode?: "single";
  /**
   * The chosen date as `"YYYY-MM-DD"`, `""` for none — controlled. Pair with `onValueChange` to update it, or
   * the calendar will appear frozen. A value that isn't a real date reads as none, with a warning in
   * development.
   */
  value?: string;
  /**
   * The date an *uncontrolled* calendar starts with, as `"YYYY-MM-DD"`; it then tracks the choice itself.
   * Ignored once `value` is also given.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Called when a date is chosen, with it as `"YYYY-MM-DD"`. Not called for the date that is already chosen,
   * or when `disabled`, `readOnly` or the rules make the date unavailable.
   */
  onValueChange?: (value: string) => void;
}

/** `Calendar` choosing a first and a last date. */
export interface CalendarRangeProps extends CalendarBaseProps {
  /** Chooses a range: the first date is the start, the second the end. */
  mode: "range";
  /**
   * The chosen range as `[start, end]` of `"YYYY-MM-DD"` strings, `""` for an end not chosen yet — controlled.
   * Pair with `onValueChange`. A range whose end is before its start is shown as it is.
   */
  value?: CalendarRangeValue;
  /**
   * The range an *uncontrolled* calendar starts with. Ignored once `value` is also given.
   * @default ["", ""]
   */
  defaultValue?: CalendarRangeValue;
  /**
   * Called each time a date is chosen, with the range so far: `[start, ""]` after the first choice and
   * `[start, end]` after the second. A choice before the start of a range in progress replaces the start.
   */
  onValueChange?: (value: [start: string, end: string]) => void;
}

/** `Calendar` choosing any number of separate dates. */
export interface CalendarMultipleProps extends CalendarBaseProps {
  /** Chooses any number of dates: choosing one adds it, choosing it again takes it away. */
  mode: "multiple";
  /**
   * The chosen dates, each `"YYYY-MM-DD"` — controlled. Pair with `onValueChange`. Dates that are not real, and repeats,
   * are left out, with a warning in development. Order does not matter; they are reported in date order.
   */
  value?: readonly string[];
  /**
   * The dates an *uncontrolled* calendar starts with. Ignored once `value` is also given.
   * @default []
   */
  defaultValue?: readonly string[];
  /**
   * Called each time a date is added or taken away, with all the chosen dates in date order.
   */
  onValueChange?: (value: string[]) => void;
}

/** `Calendar` choosing a whole week. */
export interface CalendarWeekProps extends CalendarBaseProps {
  /** Chooses a whole week: any of its days chooses the row. */
  mode: "week";
  /**
   * The chosen week as the date it starts on, `"YYYY-MM-DD"`, `""` for none — controlled. A date that is not a week's
   * first day is read as the week it is in. Pair with `onValueChange`.
   */
  value?: string;
  /**
   * The week an *uncontrolled* calendar starts with, as any date in it. Ignored once `value` is also given.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Called when a week is chosen, with the date it starts on (the first day of its row, by `weekStartsOn`). Not called
   * for the week already chosen. A week can be chosen by any of its available days.
   */
  onValueChange?: (weekStart: string) => void;
}

/** The props of `Calendar`: single-date props, or — with `mode` set — the props of that mode. */
export type CalendarProps = CalendarSingleProps | CalendarRangeProps | CalendarMultipleProps | CalendarWeekProps;
