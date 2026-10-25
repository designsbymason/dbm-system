import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, FocusEventHandler } from "react";
import type { CalendarRangeProps, CalendarWeekStart } from "../../molecules/Calendar";
import type {
  DatePickerAlign,
  DatePickerCommitOn,
  DatePickerFormat,
  DatePickerPresentation,
  DatePickerSide,
  DatePickerSize,
} from "../DatePicker";

export type DateRangePickerSize = DatePickerSize;
/** The order the day, month and year segments of each end are written in. */
export type DateRangePickerFormat = DatePickerFormat;
/** When `onValueChange` is called: on every change, once a date is settled, or only when the person is done. */
export type DateRangePickerCommitOn = DatePickerCommitOn;
/** How the calendar is drawn: floating from the field, or spanning the visible screen (a phone, usually). */
export type DateRangePickerPresentation = DatePickerPresentation;
/** Which side of the field the calendar opens on, its first choice. */
export type DateRangePickerSide = DatePickerSide;
/** How the calendar lines up with the field along the side it opens on. */
export type DateRangePickerAlign = DatePickerAlign;

/** A range as `[start, end]`, each a `"YYYY-MM-DD"` string, `""` for an end that is not chosen. */
export type DateRangeValue = readonly [start: string, end: string];

/** A quick choice in the calendar's panel: a button that picks a whole range. */
export interface DateRangePreset {
  /** The button's text, such as "Last 7 days". */
  label: string;
  /**
   * The range it picks, as `["YYYY-MM-DD", "YYYY-MM-DD"]`, or a function of today's date, so "last 7 days" is
   * written once and stays right: `(today) => [addDays(today, -6), today]`. A function is asked for only once today
   * is known (the `today` prop, or the browser's date after the first render).
   */
  value: DateRangeValue | ((today: string) => DateRangeValue);
}

/**
 * Every piece of text `DateRangePicker` writes itself. Pass a partial object to translate any of it; the rest stays
 * English. The month and weekday names the calendar draws are its own `labels`, passed through `calendarProps`.
 */
export interface DateRangePickerLabels {
  /** Name of the start date's group of segments. */
  start: string;
  /** Name of the end date's group of segments. */
  end: string;
  /** Name of the day segment (of both ends). */
  day: string;
  /** Name of the month segment. */
  month: string;
  /** Name of the year segment. */
  year: string;
  /** What a screen reader hears for a segment with nothing in it. */
  empty: string;
  /** Name of the button that opens the calendar. */
  openPicker: string;
  /** Name of the calendar panel. */
  pickerName: string;
  /** Name of the button that clears both ends. */
  clear: string;
  /** The form message for a date that is only partly filled. */
  incomplete: string;
  /** The form message for three numbers that are not a real date (the 31st of February). */
  invalid: string;
  /** The form message for a real date that is ruled out by `isDateDisabled` and has no reason of its own. */
  unavailable: string;
  /** The form message for a date before `min` (or before the start), given the earliest allowed date as the field writes it. */
  beforeMin: (earliest: string) => string;
  /** The form message for a date after `max`, given the latest allowed date as the field writes it. */
  afterMax: (latest: string) => string;
  /** The form message for an end that makes the range shorter than `minRangeDays`, given that number of days. */
  tooShort: (days: number) => string;
  /** The form message for an end that makes the range longer than `maxRangeDays`, given that number of days. */
  tooLong: (days: number) => string;
  /** The form message for an end that makes the range run over an unavailable date, when `rangeSpansUnavailable` is `false`. */
  spansUnavailable: string;
  /** The name of the group of `presets` buttons. */
  presets: string;
  /** Said aloud when a range is chosen from the calendar or a preset, given both dates written as the field writes them. */
  chosen: (start: string, end: string) => string;
}

/** The calendar props `DateRangePicker` leaves to `calendarProps`: everything but what it owns itself. */
export type DateRangePickerCalendarProps = Omit<
  Partial<CalendarRangeProps>,
  | "mode"
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "min"
  | "max"
  | "isDateDisabled"
  | "weekStartsOn"
  | "today"
  | "showTodayButton"
  | "numberOfMonths"
  | "minRangeDays"
  | "maxRangeDays"
  | "rangeSpansUnavailable"
  | "clearable"
  | "name"
  | "disabled"
  | "readOnly"
  | "autoFocus"
  | "dir"
  | "formatNumber"
  | "id"
>;

export interface DateRangePickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role" | "onFocus" | "onBlur" | "dir"> {
  /**
   * Overall size, on the shared scale; both ends match `Input`'s height at the same step.
   * @default 'md'
   */
  size?: DateRangePickerSize;
  /**
   * Shows the error state on both ends: a danger-coloured border and `aria-invalid`. A date outside `min`/`max`, one
   * ruled out by `isDateDisabled`, an end that breaks the range's limits, and three numbers that are not a real date
   * show it on their own end without this.
   * @default false
   */
  hasError?: boolean;
  /**
   * The range, as `["YYYY-MM-DD", "YYYY-MM-DD"]`. `""` stands for an end that is not chosen, so `["2026-10-05", ""]`
   * is a range in progress. While an end is only partly filled, or holds numbers that are not a real date, it is `""`.
   */
  value?: DateRangeValue;
  /**
   * The initial range for uncontrolled usage. Ignored once `value` is provided.
   * @default ["", ""]
   */
  defaultValue?: DateRangeValue;
  /**
   * Called with the new `[start, end]` whenever either end changes. After the first date is chosen in the calendar it is
   * called with `[start, ""]`, and after the second with the whole range. See `commitOn` to hold the report back.
   */
  onValueChange?: (value: [start: string, end: string]) => void;
  /**
   * When `onValueChange` is called. `"change"` reports every change. `"complete"` and `"blur"` hold what is chosen in the
   * calendar until the range is whole or the calendar closes; each end's typing is held as `DatePicker`'s `commitOn`
   * describes. A preset and the clear button are decisions, never held.
   * @default 'change'
   */
  commitOn?: DateRangePickerCommitOn;
  /**
   * The order the segments of each end are written in: `"mdy"`, `"dmy"` or `"ymd"`. Chosen explicitly, never read from
   * the browser's locale. The value is `"YYYY-MM-DD"` whichever is shown.
   * @default 'mdy'
   */
  format?: DateRangePickerFormat;
  /**
   * The text drawn between the segments of an end.
   * @default '/'
   */
  separator?: string;
  /**
   * The earliest allowed date for either end, as `"YYYY-MM-DD"` or the word `"today"`. The end can never be before the
   * start, whatever this says.
   */
  min?: string;
  /** The latest allowed date for either end, as `"YYYY-MM-DD"` or the word `"today"`. */
  max?: string;
  /**
   * Rules out particular dates: weekends, holidays, booked days. Called with a date as `"YYYY-MM-DD"`; return `true`
   * for one that is not available. A date it rules out is flagged and still reported, and the calendar disables it.
   * Keep it cheap and pure.
   */
  isDateDisabled?: (date: string) => boolean;
  /**
   * Says why a date is not available: return a short reason for a date that cannot be chosen, and nothing for one that
   * can. It is read out as part of the day's name, shown under the calendar while that day has focus or the pointer,
   * and is the form message for a typed date.
   */
  unavailableReason?: (date: string) => string | null | undefined | false;
  /**
   * The fewest days a range may span, counting both ends. In the calendar the dates that would make the range shorter
   * are unavailable once the start is chosen; a typed end that does so is flagged on the end.
   * @default 1
   */
  minRangeDays?: number;
  /**
   * The most days a range may span, counting both ends. In the calendar the dates that would make the range longer are
   * unavailable once the start is chosen; a typed end that does so is flagged on the end.
   */
  maxRangeDays?: number;
  /**
   * Whether a range may run over an unavailable date. With `false`, the calendar stops the end at the first one and a
   * typed end past one is flagged.
   * @default true
   */
  rangeSpansUnavailable?: boolean;
  /** Quick choices shown as buttons under the calendar ("Last 7 days"): each picks a whole range and closes the calendar. */
  presets?: readonly DateRangePreset[];
  /**
   * How many months are on show side by side in the calendar, 1 to 4. Takes a breakpoint map.
   * @default { base: 1, sm: 2 }
   */
  numberOfMonths?: Responsive<number>;
  /**
   * The day each calendar week starts on, `0` (Sunday) to `6`. Explicit, never read from the locale.
   * @default 0
   */
  weekStartsOn?: CalendarWeekStart;
  /**
   * Today's date as `"YYYY-MM-DD"`, for marking today in the calendar, `min="today"` and the date presets. By default
   * the browser's date is read after the first render, so nothing differs between a server and the browser.
   */
  today?: string;
  /**
   * Any other `Calendar` prop for the calendar inside the panel: `captionLayout`, `showWeekNumbers`, `getMarker`,
   * `footer`, `labels` (month and weekday names), `size` and the rest. The props `DateRangePicker` owns itself are not
   * accepted here.
   */
  calendarProps?: DateRangePickerCalendarProps;
  /**
   * Which side of the field the calendar opens on first; it flips to the other side when there is no room.
   * @default 'bottom'
   */
  side?: DateRangePickerSide;
  /**
   * How the calendar lines up with the pair along that side. The calendar is anchored to the whole pair, not the button.
   * @default 'start'
   */
  align?: DateRangePickerAlign;
  /**
   * `"anchored"` floats the calendar from the pair; `"full-width"` spans the visible screen (an on-screen keyboard
   * counted), which suits a phone. Takes a breakpoint map: `{ base: "full-width", sm: "anchored" }`.
   * @default 'anchored'
   */
  presentation?: Responsive<DateRangePickerPresentation>;
  /**
   * The element the calendar's panel is drawn into, instead of the end of the page: a scrolling or transformed box that
   * would clip it, an element inside a dialog or a shadow root, or a box that scopes a demo.
   * @default document.body
   */
  container?: HTMLElement | null;
  /**
   * Shows the button that opens the calendar. Turn it off for a pair that is only ever typed into.
   * @default true
   */
  showPicker?: boolean;
  /** The controlled open state of the calendar. Omit (along with `defaultOpen`) to manage it internally. */
  open?: boolean;
  /**
   * The initial open state of the calendar for uncontrolled usage. Ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called with the calendar's new open state whenever it changes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Shows one clear (×) button for the pair while either end has a date. Passing `onClear` turns it on too;
   * `clearable={false}` turns it off whatever else is passed.
   * @default false
   */
  clearable?: boolean;
  /** Called after the clear button has emptied both ends. Passing it also shows the button, unless `clearable={false}`. */
  onClear?: () => void;
  /** Called when focus arrives in the pair from outside it. Moving between the ends, the buttons or the calendar is not arriving. */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /** Called when focus leaves the pair for somewhere outside it (the calendar counts as part of the pair). */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /**
   * Disables the whole pair: no segment takes focus, the buttons are inert, and nothing changes.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks both ends as required: a real form constraint, so a surrounding `<form>` will not submit while either end is
   * empty. A half-filled or impossible date, and a date that breaks a rule, stop a submit too, with a message that says
   * which.
   * @default false
   */
  required?: boolean;
  /**
   * Makes the pair read-only: the segments can be focused and read but not changed, and the calendar and the clear
   * button are hidden.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the start's first segment when the pair mounts. (React's own `autoFocus` only works on a native form
   * control, so this is done with a ref and an effect.)
   * @default false
   */
  autoFocus?: boolean;
  /**
   * The name a surrounding `<form>` submits the range under: two values under `name[]`, start then end (`""` for an end
   * that is empty or incomplete).
   */
  name?: string;
  /** Associates the hidden form inputs with a `<form>` by id, when this is not inside it. */
  form?: string;
  /**
   * Text direction of the calendar and the buttons. The segments are always drawn left to right.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Every piece of text the pair writes itself, for translation. Pass only the keys you want to change.
   * @default { start: 'Start date', end: 'End date', day: 'Day', month: 'Month', year: 'Year', empty: 'Empty', openPicker: 'Choose dates', pickerName: 'Choose a date range', clear: 'Clear dates', incomplete: 'Enter a complete date', invalid: "This date doesn't exist", unavailable: "This date isn't available", beforeMin: (earliest) => `Choose ${earliest} or later`, afterMax: (latest) => `Choose ${latest} or earlier`, tooShort: (days) => `Choose a range of at least ${days} days`, tooLong: (days) => `Choose a range of at most ${days} days`, spansUnavailable: "This range includes unavailable dates", presets: 'Quick choices', chosen: (start, end) => `Dates chosen: ${start} to ${end}` }
   */
  labels?: Partial<DateRangePickerLabels>;
  /**
   * Writes a number in the digits you want shown: `(n) => n.toLocaleString("ar-EG")`. Used for the digits on screen, in
   * the calendar and in what a screen reader hears. Never defaulted to a locale.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * The pair's accessible name when there is no visible label to point `aria-labelledby` at. Applied to the group the
   * two ends sit in.
   */
  "aria-label"?: string;
  /** Points at the visible label that names the pair. A `FormField` passes this. */
  "aria-labelledby"?: string;
  /** Points at helper or error text. A `FormField` passes this. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the **start's first segment** — which is what a `FieldLabel`'s `htmlFor` should point
   * at, so clicking the label focuses the field. A `FormField` already does this.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
