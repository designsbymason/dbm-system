import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, FocusEventHandler } from "react";
import type { InputSize } from "../../atoms/Input";
import type { DateFormat, DateGranularity } from "../../internal/date/dateEntry";
import type { CalendarSingleProps, CalendarWeekStart } from "../../molecules/Calendar";

export type DatePickerSize = InputSize;
/** The order the day, month and year segments are written in. */
export type DatePickerFormat = DateFormat;
/** What the field chooses: a whole date (`"YYYY-MM-DD"`), or only a month of a year (`"YYYY-MM"`). */
export type DatePickerGranularity = DateGranularity;
/** How the calendar is drawn: floating from the field, or spanning the visible screen (a phone, usually). */
export type DatePickerPresentation = "anchored" | "full-width";
/** Which side of the field the calendar opens on, its first choice. */
export type DatePickerSide = "top" | "bottom";
/** How the calendar lines up with the field along the side it opens on. */
export type DatePickerAlign = "start" | "center" | "end";

/** A quick choice in the calendar's panel: a button that picks one date. */
export interface DatePickerPreset {
  /** The button's text, such as "Tomorrow". */
  label: string;
  /**
   * The date it picks, as `"YYYY-MM-DD"` (`"YYYY-MM"` by month), or a function of today's date, so "next week" is
   * written once and stays right: `(today) => addDays(today, 7)`. A function is asked for only once today is known
   * (the `today` prop, or the browser's date after the first render).
   */
  value: string | ((today: string) => string);
}

/** When `onValueChange` is called: on every change, once a date is settled, or only when the person is done. */
export type DatePickerCommitOn = "change" | "complete" | "blur";

/**
 * Every piece of text `DatePicker` writes itself. Pass a partial object to translate any of it; the rest
 * stays English. The month and weekday names the calendar draws are its own `labels`, passed through
 * `calendarProps`.
 */
export interface DatePickerLabels {
  /** Name of the day segment. */
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
  /** Name of the button that clears the field. */
  clear: string;
  /** The form message for a date that is only partly filled. */
  incomplete: string;
  /** The form message for three numbers that are not a real date (the 31st of February). */
  invalid: string;
  /** The form message for a real date that is ruled out by `isDateDisabled` and has no reason of its own. */
  unavailable: string;
  /** The form message for a date before `min`, given the earliest allowed date written as the field writes it. */
  beforeMin: (earliest: string) => string;
  /** The form message for a date after `max`, given the latest allowed date written as the field writes it. */
  afterMax: (latest: string) => string;
  /** The name of the group of `presets` buttons. */
  presets: string;
  /** Said aloud when a date is chosen from the calendar or a preset, given the date written as the field writes it. */
  chosen: (date: string) => string;
}

/** The calendar props `DatePicker` leaves to `calendarProps`: everything but what it owns itself. */
export type DatePickerCalendarProps = Omit<
  Partial<CalendarSingleProps>,
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
  | "rounded"
  | "name"
  | "disabled"
  | "readOnly"
  | "autoFocus"
  | "dir"
  | "formatNumber"
  | "id"
>;

export interface DatePickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role" | "onFocus" | "onBlur" | "dir"> {
  /**
   * Overall size, on the shared scale; its height matches `Input` at the same step.
   * @default 'md'
   */
  size?: DatePickerSize;
  /**
   * Shows the error state: a danger-coloured border and `aria-invalid`. A date outside `min`/`max`, one ruled
   * out by `isDateDisabled`, and three numbers that are not a real date show it too without this.
   * @default false
   */
  hasError?: boolean;
  /**
   * What the field chooses: `"day"`, a whole date as `"YYYY-MM-DD"`, or `"month"`, only a month of a year as
   * `"YYYY-MM"`, with no day segment and a grid of months to pick from. Every date prop (`value`, `min`, `max`,
   * `presets`, `isDateDisabled`) is then written, or given, as `"YYYY-MM"`. `isDateDisabled` only flags a month
   * in the field, since the grid can only disable what `min` and `max` rule out.
   * @default 'day'
   */
  granularity?: DatePickerGranularity;
  /**
   * The date, as `"YYYY-MM-DD"` (`"YYYY-MM"` with `granularity="month"`). Use `""` (or leave it out) for no
   * date. While the field is only partly filled, or holds numbers that are not a real date, the value is `""`.
   * A string that is not a real date reads as empty.
   */
  value?: string;
  /**
   * The initial date for uncontrolled usage, as `"YYYY-MM-DD"` (`"YYYY-MM"` by month). Ignored once `value` is provided.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Called with the new value whenever it changes: a real date as `"YYYY-MM-DD"`, or `""` when a segment is
   * cleared and the date is no longer complete. See `commitOn` to hold the report back while someone types.
   */
  onValueChange?: (value: string) => void;
  /**
   * When `onValueChange` is called. `"change"` reports every change (a year typed one digit at a time reports
   * each date it passes through). `"complete"` waits until no digit is still expected and the calendar is
   * closed, or the field is emptied. `"blur"` reports once, when focus leaves, the calendar closes or `Enter` is
   * pressed. A day chosen in the calendar and the clear button are decisions, never held. The segments always
   * show the latest edit.
   * @default 'change'
   */
  commitOn?: DatePickerCommitOn;
  /**
   * The order the segments are written in: `"mdy"` (month, day, year), `"dmy"` or `"ymd"`. Chosen explicitly
   * and never read from the browser's locale, so a server and a browser draw the same field. The value is
   * `"YYYY-MM-DD"` whichever is shown.
   * @default 'mdy'
   */
  format?: DatePickerFormat;
  /**
   * The text drawn between the segments.
   * @default '/'
   */
  separator?: string;
  /**
   * The earliest allowed date, as `"YYYY-MM-DD"` or the word `"today"`. An earlier date is flagged invalid, not
   * refused, and the calendar disables the days before it; the form message says what the earliest date is.
   * `"today"` follows `today`, or the browser's date once the page has loaded (nothing is held back before then).
   */
  min?: string;
  /**
   * The latest allowed date, as `"YYYY-MM-DD"` or the word `"today"`. A later date is flagged invalid, not
   * refused, and the calendar disables the days after it; the form message says what the latest date is.
   */
  max?: string;
  /**
   * Rules out particular dates: weekends, holidays, booked days. Called with a date as `"YYYY-MM-DD"`;
   * return `true` for one that is not available. A date it rules out is flagged invalid and still reported,
   * and the calendar disables it. Keep it cheap and pure.
   */
  isDateDisabled?: (date: string) => boolean;
  /**
   * Says why a date is not available: return a short reason (`"Fully booked"`) for a date that cannot be chosen, and
   * nothing for one that can. A date with a reason is unavailable as if `isDateDisabled` had ruled it out. The reason
   * is read out as part of the day's name in the calendar, shown under the calendar while that day has focus or the
   * pointer, and is the form message for a typed date. Keep it cheap and pure.
   */
  unavailableReason?: (date: string) => string | null | undefined | false;
  /**
   * Quick choices shown as buttons under the calendar ("Tomorrow", "Next week"): each picks one date and closes
   * the calendar. A preset whose date is outside `min`/`max` or unavailable is disabled.
   */
  presets?: readonly DatePickerPreset[];
  /**
   * The day each calendar week starts on, `0` (Sunday) to `6`. Explicit, never read from the locale.
   * @default 0
   */
  weekStartsOn?: CalendarWeekStart;
  /**
   * Shows a "Today" button in the calendar that chooses today's date.
   * @default false
   */
  showTodayButton?: boolean;
  /**
   * Draws the calendar's days and month buttons round: a circle for each day, the chosen days, today's ring and the focus
   * ring, and round month buttons (including the grid of months). Only the panel changes; the field itself keeps its corners.
   * @default false
   */
  rounded?: boolean;
  /**
   * Today's date as `"YYYY-MM-DD"`, for marking today in the calendar, `min="today"`, the date presets and starting
   * an empty year at this year. By default the browser's date is read after the first render, so nothing differs between a server
   * and the browser.
   */
  today?: string;
  /**
   * Any other `Calendar` prop for the calendar inside the panel (by day): `numberOfMonths`, `captionLayout`,
   * `showWeekNumbers`, `getMarker`, `footer`, `labels` (month and weekday names), `size` and the rest. The
   * props `DatePicker` owns itself (`value`, `min`, `max`, `isDateDisabled`, `weekStartsOn`, `today`,
   * `showTodayButton`, `rounded`) are not accepted here.
   */
  calendarProps?: DatePickerCalendarProps;
  /**
   * Which side of the field the calendar opens on first; it flips to the other side when there is no room.
   * @default 'bottom'
   */
  side?: DatePickerSide;
  /**
   * How the calendar lines up with the field along that side: its start edge, its centre or its end edge. The
   * calendar is anchored to the whole field, not to the button.
   * @default 'start'
   */
  align?: DatePickerAlign;
  /**
   * `"anchored"` floats the calendar from the field; `"full-width"` spans the visible screen (an on-screen keyboard
   * counted), which suits a phone. Takes a breakpoint map like `side` does elsewhere:
   * `{ base: "full-width", sm: "anchored" }`. `align` has no effect while it is full width.
   * @default 'anchored'
   */
  presentation?: Responsive<DatePickerPresentation>;
  /**
   * The element the calendar's panel is drawn into, instead of the end of the page: a scrolling or transformed box
   * that would clip it, an element inside a dialog or a shadow root, or a box that scopes a demo.
   * @default document.body
   */
  container?: HTMLElement | null;
  /**
   * Shows the button that opens the calendar. Turn it off for a field that is only ever typed into.
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
   * Shows a clear (×) button while any segment has something in it. Passing `onClear` turns it on too;
   * `clearable={false}` turns it off whatever else is passed.
   * @default false
   */
  clearable?: boolean;
  /** Called after the clear button has emptied the field. Passing it also shows the button, unless `clearable={false}`. */
  onClear?: () => void;
  /**
   * Called when focus arrives in the field from outside it. Moving between the segments, the buttons or into
   * the calendar is not arriving, so it fires once per visit.
   */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /**
   * Called when focus leaves the field for somewhere outside it (the calendar counts as part of the field).
   * With `commitOn` it fires after the held value has been reported.
   */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /**
   * Disables the whole field: no segment takes focus, the buttons are inert, and nothing changes.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the field as required: `aria-required` on each segment, and a real form constraint, so a surrounding
   * `<form>` will not submit while the field is empty. A half-filled field, an impossible date and a date
   * outside `min`/`max` or ruled out by `isDateDisabled` stop a submit too, with the `incomplete`, `invalid` and
   * `unavailable` labels as the message. That check lives on a hidden date input that holds the value, which is
   * what is submitted under `name`.
   * @default false
   */
  required?: boolean;
  /**
   * Makes the field read-only: its segments can be focused and read but not changed, and the calendar and the
   * clear button are hidden.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the first segment when the field mounts. (React's own `autoFocus` only works on a native form
   * control, so this is done with a ref and an effect.)
   * @default false
   */
  autoFocus?: boolean;
  /**
   * The name a surrounding `<form>` submits the value under, through a hidden date input holding
   * `"YYYY-MM-DD"` (and `""` while the field is empty or incomplete). The input is also what a form validates.
   */
  name?: string;
  /** Associates the hidden form input with a `<form>` by id, when this is not inside it. */
  form?: string;
  /**
   * Text direction of the calendar and the field's buttons. The segments are always drawn left to right,
   * whatever the page, since a date's numbers read in the order its format gives.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Every piece of text the field writes itself — segment names and the button names — for translation.
   * Pass only the keys you want to change.
   * @default { day: 'Day', month: 'Month', year: 'Year', empty: 'Empty', openPicker: 'Choose date', pickerName: 'Choose a date', clear: 'Clear date', incomplete: 'Enter a complete date', invalid: "This date doesn't exist", unavailable: "This date isn't available", beforeMin: (earliest) => `Choose ${earliest} or later`, afterMax: (latest) => `Choose ${latest} or earlier`, presets: 'Quick choices', chosen: (date) => `Date chosen: ${date}` }
   */
  labels?: Partial<DatePickerLabels>;
  /**
   * Writes a number in the digits you want shown: `(n) => n.toLocaleString("ar-EG")`. Used for the digits on
   * screen, in the calendar and in what a screen reader hears; typing digits of any script still works. Never
   * defaulted to a locale.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * The field's accessible name when there is no visible label to point `aria-labelledby` at. Applied to the
   * group the segments sit in.
   */
  "aria-label"?: string;
  /** Points at the visible label that names the field. A `FormField` passes this. */
  "aria-labelledby"?: string;
  /** Points at helper or error text. A `FormField` passes this. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the **first segment** — which is what a `FieldLabel`'s `htmlFor` should point
   * at, so clicking the label focuses the field. A `FormField` already does this.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
