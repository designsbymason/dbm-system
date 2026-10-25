// The code shown under each story's "Show code" button on DatePicker's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object (or, for a
// story that reuses the Playground's render, just an `args` object) plus demo-only wiring, which can't be pasted
// anywhere. Each snippet here is the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type {
  DatePickerAlign,
  DatePickerCommitOn,
  DatePickerFormat,
  DatePickerGranularity,
  DatePickerPresentation,
  DatePickerSide,
  DatePickerSize,
} from "./DatePicker.types";

export const datePickerSnippets = {
  basic: `<DatePicker aria-label="Start date" defaultValue="2026-10-03" />`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — each is as tall as an Input of the same size. */}
<DatePicker aria-label="Start date" size="lg" defaultValue="2026-10-03" />`,

  formats: `{/* format: "mdy" (default) | "dmy" | "ymd" — the order the segments are written in. The value is "YYYY-MM-DD" either way. */}
<DatePicker aria-label="Start date" format="dmy" separator="." defaultValue="2026-10-03" />`,

  range: `{/* min and max: a date outside them is flagged invalid (not refused), and the calendar disables the days it can't reach. */}
<DatePicker aria-label="Booking date" min="2026-10-05" max="2026-10-25" defaultValue="2026-10-30" />`,

  unavailable: `{/* isDateDisabled gets each date as "YYYY-MM-DD"; true rules it out. It is flagged (not refused) when typed,
    and the calendar disables the day. Keep it pure and cheap. */}
<DatePicker
  aria-label="Delivery date"
  defaultValue="2026-10-14"
  isDateDisabled={(date) => new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0}
/>`,

  relative: `{/* min and max can be the word "today": it follows the browser's date once the page has loaded (or the today prop). */}
<DatePicker aria-label="Appointment" min="today" />`,

  reasons: `{/* unavailableReason: return why a date can't be chosen, or nothing. The day is disabled, the reason is part of its name,
    shown under the calendar and the form's message for a typed date. */}
<DatePicker
  aria-label="Delivery date"
  unavailableReason={(date) => (fullyBooked.has(date) ? "Fully booked" : undefined)}
/>`,

  presets: `{/* presets: buttons under the calendar. A value is a date, or a function of today's date. One outside min and max is disabled. */}
<DatePicker
  aria-label="Due date"
  min="today"
  presets={[
    { label: "Today", value: (today) => today },
    { label: "New year", value: "2027-01-01" },
  ]}
/>`,

  month: `{/* granularity="month": no day segment, a grid of months in the panel, and the value is "YYYY-MM". */}
<DatePicker aria-label="Card expires" granularity="month" min="today" />`,

  placement: `{/* side: "bottom" (default) | "top"; align: "start" (default) | "center" | "end". The panel is anchored to the whole field. */}
<DatePicker aria-label="Start date" side="top" align="end" />`,

  fullWidth: `{/* presentation: "anchored" (default) | "full-width", which spans the visible screen. It takes a map like side does elsewhere. */}
<DatePicker aria-label="Start date" presentation={{ base: "full-width", sm: "anchored" }} />`,

  calendar: `{/* calendarProps: any other Calendar prop for the calendar in the panel. weekStartsOn and showTodayButton are
    DatePicker's own. */}
<DatePicker
  aria-label="Start date"
  weekStartsOn={1}
  showTodayButton
  calendarProps={{ showWeekNumbers: true, captionLayout: "views" }}
/>`,

  commitOn: `{/* commitOn: when onValueChange is called.
    "change" (default): every change. "complete": once a whole date has no digit still expected and the calendar is closed.
    "blur": once, when focus leaves, the calendar closes or Enter is pressed. */}
<DatePicker aria-label="Start date" commitOn="complete" onValueChange={setDate} />`,

  form: `{/* required, min, max and a half-filled field are real form constraints: the browser won't submit and says why. */}
<form onSubmit={save}>
  <DatePicker aria-label="Check-in" name="checkIn" required min="2026-10-01" />
  <Button type="submit">Save</Button>
</form>`,

  states: `<DatePicker aria-label="Start date" hasError defaultValue="2026-10-03" />
<DatePicker aria-label="Start date" disabled defaultValue="2026-10-03" />
<DatePicker aria-label="Start date" readOnly defaultValue="2026-10-03" />`,

  clearable: `{/* clearable shows the clear button while there is something to clear. Pass onClear as well if you want to be told.
    const [value, setValue] = useState("2026-10-03"); */}
<DatePicker aria-label="Start date" value={value} onValueChange={setValue} clearable />`,

  withoutPicker: `{/* showPicker={false} drops the button and the calendar: a field that is only ever typed into. */}
<DatePicker aria-label="Start date" showPicker={false} defaultValue="2026-10-03" />`,

  controlled: `{/* const [date, setDate] = useState("2026-10-03"); — onValueChange gets "" while the date is incomplete or not real. */}
<DatePicker aria-label="Start date" value={date} onValueChange={setDate} />`,

  formField: `<FormField label="Birthday" helperText="Month, day, year">
  {(field) => <DatePicker {...field} />}
</FormField>`,

  translated: `{/* labels: every word the field writes. formatNumber: the digits shown, picked and announced.
    The month and weekday names are the calendar's own, through calendarProps.labels. */}
<DatePicker
  aria-label="تاريخ البدء"
  dir="rtl"
  format="dmy"
  defaultValue="2026-10-03"
  labels={{ day: "اليوم", month: "الشهر", year: "السنة", openPicker: "اختر التاريخ", pickerName: "اختر تاريخًا", clear: "مسح" }}
  formatNumber={(n) => n.toLocaleString("ar-EG", { useGrouping: false })}
  clearable
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DatePickerPlaygroundSnippetArgs {
  defaultValue?: string;
  granularity?: DatePickerGranularity;
  side?: DatePickerSide;
  align?: DatePickerAlign;
  presentation?: DatePickerPresentation;
  commitOn?: DatePickerCommitOn;
  format?: DatePickerFormat;
  separator?: string;
  min?: string;
  max?: string;
  weekStartsOn?: number;
  showTodayButton?: boolean;
  rounded?: boolean;
  size?: DatePickerSize;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  showPicker?: boolean;
  clearable?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around
 * a small real field. A field needs an accessible name, so the `aria-label` is always written.
 */
export function datePickerPlaygroundSnippet(args: DatePickerPlaygroundSnippetArgs): string {
  const attributes: string[] = ['aria-label="Start date"'];
  // A field chosen by month takes "YYYY-MM", so a whole demo date is cut to its month.
  const initial = args.granularity === "month" ? args.defaultValue?.slice(0, 7) : args.defaultValue;
  if (initial) attributes.push(`defaultValue="${initial}"`);
  if (args.granularity && args.granularity !== "day") attributes.push(`granularity="${args.granularity}"`);
  if (args.commitOn && args.commitOn !== "change") attributes.push(`commitOn="${args.commitOn}"`);
  if (args.format && args.format !== "mdy") attributes.push(`format="${args.format}"`);
  if (args.separator && args.separator !== "/") attributes.push(`separator="${args.separator}"`);
  if (args.min) attributes.push(`min="${args.min}"`);
  if (args.max) attributes.push(`max="${args.max}"`);
  if (args.weekStartsOn !== undefined && args.weekStartsOn !== 0) attributes.push(`weekStartsOn={${args.weekStartsOn}}`);
  if (args.showTodayButton) attributes.push("showTodayButton");
  if (args.rounded) attributes.push("rounded");
  if (args.side && args.side !== "bottom") attributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (args.presentation && args.presentation !== "anchored") attributes.push(`presentation="${args.presentation}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.required) attributes.push("required");
  // `showPicker` defaults to true, so it only needs writing when it's off.
  if (args.showPicker === false) attributes.push("showPicker={false}");
  if (args.clearable) attributes.push("clearable");
  return `<DatePicker ${attributes.join(" ")} />`;
}
