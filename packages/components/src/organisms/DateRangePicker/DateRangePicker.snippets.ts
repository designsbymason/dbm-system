// The code shown under each story's "Show code" button on DateRangePicker's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object (or, for a
// story that reuses the Playground's render, just an `args` object) plus demo-only wiring, which can't be pasted
// anywhere. Each snippet here is the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type {
  DateRangePickerAlign,
  DateRangePickerCommitOn,
  DateRangePickerFormat,
  DateRangePickerGranularity,
  DateRangePickerPresentation,
  DateRangePickerSide,
  DateRangePickerSize,
} from "./DateRangePicker.types";

export const dateRangePickerSnippets = {
  basic: `<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} />`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — each end is as tall as an Input of the same size. */}
<DateRangePicker aria-label="Stay" size="lg" defaultValue={["2026-10-05", "2026-10-09"]} />`,

  formats: `{/* format: "mdy" (default) | "dmy" | "ymd" — the order each end's segments are written in. The value is "YYYY-MM-DD" either way. */}
<DateRangePicker aria-label="Stay" format="dmy" separator="." defaultValue={["2026-10-05", "2026-10-09"]} />`,

  byMonth: `{/* granularity="month": no day segments, a grid of months in the panel (the first month chosen is the start, the second the end),
    and the value is ["YYYY-MM", "YYYY-MM"]. The length limits and numberOfMonths have no effect by month. */}
<DateRangePicker
  aria-label="Billing period"
  granularity="month"
  min="today"
  presets={[{ label: "This year", value: (today) => [today.slice(0, 4) + "-01", today.slice(0, 4) + "-12"] }]}
/>`,

  limits: `{/* minRangeDays and maxRangeDays count both ends. The calendar disables the end dates that would break them, and a typed end
    that does is flagged with a message that says why. rangeSpansUnavailable={false} stops a range at the first unavailable date. */}
<DateRangePicker
  aria-label="Booking"
  min="today"
  minRangeDays={2}
  maxRangeDays={14}
  rangeSpansUnavailable={false}
  isDateDisabled={(date) => new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0}
/>`,

  reasons: `{/* unavailableReason: return why a date can't be chosen, or nothing. The day is disabled, the reason is part of its name,
    shown under the calendar and the form's message for a typed date.
    fullyBooked: your own Set of "YYYY-MM-DD" strings. */}
<DateRangePicker
  aria-label="Booking"
  unavailableReason={(date) => (fullyBooked.has(date) ? "Fully booked" : undefined)}
/>`,

  presets: `{/* presets: buttons under the calendar. A value is a [start, end] pair, or a function of today's date. One outside min and max,
    unavailable or breaking a limit is disabled. addDays: your own helper that adds days to a "YYYY-MM-DD" string. */}
<DateRangePicker
  aria-label="Report period"
  presets={[
    { label: "Last 7 days", value: (today) => [addDays(today, -6), today] },
    { label: "This year", value: ["2026-01-01", "2026-12-31"] },
  ]}
/>`,

  rounded: `{/* rounded draws the calendar's days (the chosen ones, today's ring and the focus ring) and its month buttons as circles,
    and by month the cells of the grid of months. The strip behind a range keeps its straight edges, and the fields keep their corners. */}
<DateRangePicker aria-label="Stay" rounded defaultValue={["2026-10-05", "2026-10-09"]} />`,

  months: `{/* numberOfMonths: 1 to 4 months side by side, or a breakpoint map. The default is one month on a phone and two from sm up. */}
<DateRangePicker aria-label="Stay" numberOfMonths={{ base: 1, md: 3 }} />`,

  calendar: `{/* calendarProps: any other Calendar prop for the calendar in the panel. weekStartsOn is DateRangePicker's own. */}
<DateRangePicker
  aria-label="Stay"
  weekStartsOn={1}
  calendarProps={{ showWeekNumbers: true, captionLayout: "views" }}
/>`,

  placement: `{/* side: "bottom" (default) | "top"; align: "start" (default) | "center" | "end". The panel is anchored to the whole pair. */}
<DateRangePicker aria-label="Stay" side="top" align="end" />`,

  fullWidth: `{/* presentation: "anchored" (default) | "full-width", which spans the visible screen. It takes a breakpoint map. */}
<DateRangePicker aria-label="Stay" presentation={{ base: "full-width", sm: "anchored" }} />`,

  commitOn: `{/* commitOn: when onValueChange is called.
    "change" (default): every change, the first date chosen in the calendar included ([start, ""]).
    "complete" and "blur": what is chosen in the calendar is held until the range is whole or the calendar closes.
    const [range, setRange] = useState(["", ""]); */}
<DateRangePicker aria-label="Stay" commitOn="complete" onValueChange={setRange} />`,

  form: `{/* required, min, max and the range limits are real form constraints: the browser won't submit and says why.
    The two ends are submitted as stay[], start then end. save: your own submit handler. */}
<form onSubmit={save}>
  <DateRangePicker aria-label="Stay" name="stay" required min="2026-10-01" />
  <Button type="submit">Save</Button>
</form>`,

  states: `<DateRangePicker aria-label="Stay" hasError defaultValue={["2026-10-05", "2026-10-09"]} />
<DateRangePicker aria-label="Stay" disabled defaultValue={["2026-10-05", "2026-10-09"]} />
<DateRangePicker aria-label="Stay" readOnly defaultValue={["2026-10-05", "2026-10-09"]} />`,

  clearable: `{/* clearable shows one clear button for the pair while either end has a date. Pass onClear as well if you want to be told.
    const [range, setRange] = useState(["2026-10-05", "2026-10-09"]); */}
<DateRangePicker aria-label="Stay" value={range} onValueChange={setRange} clearable />`,

  withoutPicker: `{/* showPicker={false} drops the button and the calendar: a pair that is only ever typed into. */}
<DateRangePicker aria-label="Stay" showPicker={false} defaultValue={["2026-10-05", "2026-10-09"]} />`,

  controlled: `{/* const [range, setRange] = useState(["2026-10-05", "2026-10-09"]); — onValueChange gets [start, ""] once only the start is chosen. */}
<DateRangePicker aria-label="Stay" value={range} onValueChange={setRange} />`,

  formField: `<FormField label="Stay" helperText="Check-in and check-out">
  {(field) => <DateRangePicker {...field} />}
</FormField>`,

  translated: `{/* labels: every word the pair writes. formatNumber: the digits shown, picked and announced.
    The month and weekday names are the calendar's own, through calendarProps.labels. */}
<DateRangePicker
  aria-label="الإقامة"
  dir="rtl"
  format="dmy"
  defaultValue={["2026-10-05", "2026-10-09"]}
  labels={{ start: "من", end: "إلى", day: "اليوم", month: "الشهر", year: "السنة", openPicker: "اختر التواريخ", pickerName: "اختر فترة", clear: "مسح" }}
  formatNumber={(n) => n.toLocaleString("ar-EG", { useGrouping: false })}
  clearable
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DateRangePickerPlaygroundSnippetArgs {
  granularity?: DateRangePickerGranularity;
  side?: DateRangePickerSide;
  align?: DateRangePickerAlign;
  presentation?: DateRangePickerPresentation;
  commitOn?: DateRangePickerCommitOn;
  format?: DateRangePickerFormat;
  separator?: string;
  min?: string;
  max?: string;
  minRangeDays?: number;
  maxRangeDays?: number;
  rangeSpansUnavailable?: boolean;
  weekStartsOn?: number;
  rounded?: boolean;
  size?: DateRangePickerSize;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  showPicker?: boolean;
  clearable?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around
 * a small real pair. A pair needs an accessible name, so the `aria-label` is always written.
 */
export function dateRangePickerPlaygroundSnippet(args: DateRangePickerPlaygroundSnippetArgs): string {
  const byMonth = args.granularity === "month";
  const attributes: string[] = ['aria-label="Stay"', byMonth ? 'defaultValue={["2026-10", "2026-10"]}' : 'defaultValue={["2026-10-05", "2026-10-09"]}'];
  if (byMonth) attributes.push('granularity="month"');
  if (args.commitOn && args.commitOn !== "change") attributes.push(`commitOn="${args.commitOn}"`);
  if (args.format && args.format !== "mdy") attributes.push(`format="${args.format}"`);
  if (args.separator && args.separator !== "/") attributes.push(`separator="${args.separator}"`);
  if (args.min) attributes.push(`min="${args.min}"`);
  if (args.max) attributes.push(`max="${args.max}"`);
  if (args.minRangeDays !== undefined && args.minRangeDays > 1) attributes.push(`minRangeDays={${args.minRangeDays}}`);
  if (args.maxRangeDays !== undefined && args.maxRangeDays > 0) attributes.push(`maxRangeDays={${args.maxRangeDays}}`);
  if (args.rangeSpansUnavailable === false) attributes.push("rangeSpansUnavailable={false}");
  if (args.weekStartsOn !== undefined && args.weekStartsOn !== 0) attributes.push(`weekStartsOn={${args.weekStartsOn}}`);
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
  return `<DateRangePicker ${attributes.join(" ")} />`;
}
