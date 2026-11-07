import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { CSSProperties } from "react";
import { expect, userEvent, within } from "storybook/test";
import { useArgs } from "storybook/preview-api";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Calendar } from "./Calendar";
import { calendarPlaygroundSnippet, calendarSnippets } from "./Calendar.snippets";
import type { CalendarCaptionLayout, CalendarMode, CalendarRangeValue, CalendarSize, CalendarWeekStart } from "./Calendar.types";

// `Calendar`'s props are a union (a single date, or a range), so this meta has no `component` and its argTypes
// are written out here. The Playground is controlled: choosing a date in the canvas, or moving to another month,
// writes back to its control. The month and `today` are fixed so every demo shows the same page, whatever day it is.
interface PlaygroundArgs {
  mode: CalendarMode;
  value: string;
  start: string;
  end: string;
  month: string;
  min: string;
  max: string;
  weekStartsOn: CalendarWeekStart;
  showOutsideDays: boolean;
  numberOfMonths: number;
  captionLayout: CalendarCaptionLayout;
  dates: string;
  weekDate: string;
  maxSelected: number | "";
  showWeekNumbers: boolean;
  fixedWeeks: boolean;
  animated: boolean;
  name: string;
  showTodayButton: boolean;
  clearable: boolean;
  minRangeDays: number | "";
  maxRangeDays: number | "";
  rangeSpansUnavailable: boolean;
  yearRange: unknown;
  footer: unknown;
  getMarker: unknown;
  today: string;
  size: CalendarSize;
  rounded: boolean;
  showLegend: boolean;
  disabled: boolean;
  readOnly: boolean;
  announce: boolean;
  dir: "ltr" | "rtl";
  defaultValue: unknown;
  defaultMonth: unknown;
  onValueChange: unknown;
  onMonthChange: unknown;
  isDateDisabled: unknown;
  autoFocus: boolean;
  labels: unknown;
  formatNumber: unknown;
  "aria-label": string;
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allSizes: CalendarSize[] = ["xs", "sm", "md", "lg", "xl"];

// The stories show the real current month, with the real today marked: nothing here is fixed to a date. A demo that
// needs a particular day names it relative to this month (`inMonth(8)` is the 8th of it). The tests that look for a
// particular date, in the hidden stories below and in `Calendar.checks.stories.tsx`, fix theirs instead.
const now = new Date();
const MONTH = `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const inMonth = (day: number): string => `${MONTH}-${String(day).padStart(2, "0")}`;

// A fixed month for the hidden interaction tests, which name dates.
const FIXED_MONTH = "2026-10";
const FIXED_TODAY = "2026-10-14";

const labelled: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)", alignItems: "flex-start" };

// Every fixed-render story below ignores the Playground's own `args`, so each one suppresses every control it
// doesn't consume (a story-level `argTypes` entry merges over the meta-level one per key).
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  mode: { control: false },
  value: { control: false },
  start: { control: false },
  end: { control: false },
  month: { control: false },
  min: { control: false },
  max: { control: false },
  weekStartsOn: { control: false },
  showOutsideDays: { control: false },
  numberOfMonths: { control: false },
  captionLayout: { control: false },
  dates: { control: false },
  weekDate: { control: false },
  maxSelected: { control: false },
  showWeekNumbers: { control: false },
  fixedWeeks: { control: false },
  animated: { control: false },
  name: { control: false },
  showTodayButton: { control: false },
  clearable: { control: false },
  minRangeDays: { control: false },
  maxRangeDays: { control: false },
  rangeSpansUnavailable: { control: false },
  yearRange: { control: false },
  footer: { control: false },
  getMarker: { control: false },
  today: { control: false },
  size: { control: false },
  rounded: { control: false },
  showLegend: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  announce: { control: false },
  dir: { control: false },
  defaultValue: { control: false },
  defaultMonth: { control: false },
  onValueChange: { control: false },
  onMonthChange: { control: false },
  isDateDisabled: { control: false },
  autoFocus: { control: false },
  labels: { control: false },
  formatNumber: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Inputs/Calendar",
  parameters: { layout: "padded" },
  argTypes: {
    mode: {
      control: "radio",
      options: ["single", "range", "multiple", "week"],
      description:
        "What choosing a date means: one date (single), a first and a last (range) — the first choice is the start, the second the end, and a third starts again — any number of separate dates (multiple), where choosing a date adds it and choosing it again takes it away — or a whole week (week), where any day chooses its row. The value is a string for single, a [start, end] pair for range, a list of dates for multiple and the date a week starts on for week.",
      table: { defaultValue: { summary: "'single'" } },
    },
    value: {
      control: "text",
      if: { arg: "mode", eq: "single" },
      description:
        "The chosen date as \"YYYY-MM-DD\" (empty for none) — controlled, in single mode. Pair with onValueChange to update it, or the calendar will appear frozen. In range mode the value is a [start, end] pair of those strings instead, an end of \"\" while it is still to be chosen. (In the Playground, choosing a date in the canvas writes it back here.)",
    },
    defaultValue: {
      control: false,
      description:
        "The date (or, in range mode, the [start, end] range) an uncontrolled calendar starts with, which it then tracks itself. Ignored once value is also given.",
      table: { defaultValue: { summary: "''" } },
    },
    onValueChange: {
      control: false,
      description:
        "Called when a date is chosen, with it as \"YYYY-MM-DD\" — or, in range mode, called each time with the range so far: [start, \"\"] after the first choice and [start, end] after the second. Not called for the date already chosen, or when disabled, readOnly or the rules make a date unavailable.",
    },
    month: {
      control: "text",
      description:
        "The month on show, as \"YYYY-MM\" — controlled. Pair with onMonthChange to update it. Without it the calendar shows the chosen date's month, or defaultMonth, or the current month. (In the Playground, moving to another month writes it back here.)",
    },
    defaultMonth: {
      control: false,
      description: "The month an uncontrolled calendar starts on, as \"YYYY-MM\". Ignored once month is also given.",
    },
    onMonthChange: {
      control: false,
      description:
        "Called when the month on show changes — by the previous and next buttons, by Page Up and Page Down, or by moving onto a date in another month — with the new month as \"YYYY-MM\".",
    },
    min: {
      control: "text",
      description:
        "The earliest date that can be chosen, as \"YYYY-MM-DD\". Earlier dates are unavailable, the keys never move focus before it, and the previous-month button is unavailable once the month on show holds it.",
    },
    max: {
      control: "text",
      description: "The latest date that can be chosen, as \"YYYY-MM-DD\". The mirror of min.",
    },
    isDateDisabled: {
      control: false,
      description:
        "A rule for dates that can't be chosen, given a date as \"YYYY-MM-DD\" — weekends, holidays, days that are fully booked. They are dimmed and marked unavailable, and can still be moved onto with the keyboard, but not chosen. Together with min and max. Keep it cheap and pure: it is called for each of the 42 days on every render.",
    },
    weekStartsOn: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6],
      description:
        "The day a week starts on, 0 (Sunday) to 6 (Saturday). The columns, and Home and End, follow it. Explicit and never read from the browser's locale, so a server and a browser agree.",
      table: { defaultValue: { summary: "0" } },
    },
    showOutsideDays: {
      control: "boolean",
      description:
        "Shows the days of the neighbouring months that fill the first and last weeks, dimmed. They can be chosen, which moves the calendar to their month. With false those cells are empty.",
      table: { defaultValue: { summary: "true" } },
    },
    maxSelected: {
      control: { type: "number", min: 1, step: 1 },
      if: { arg: "mode", eq: "multiple" },
      description:
        "In multiple mode, the most dates that can be chosen. Once that many are, the others are unavailable (the chosen ones stay available, so one can be taken away). Ignored in the other modes.",
    },
    name: {
      control: false,
      description:
        "A field name, so the calendar submits with a surrounding form through hidden inputs: a single date as name (an empty string when none is chosen), a range as two values under name[] (start, then end, an empty string for an end not chosen), and several dates as one name[] for each. A disabled calendar submits nothing.",
    },
    showWeekNumbers: {
      control: "boolean",
      description:
        "Adds a column of week numbers before the days: the ISO 8601 number (1 to 53, weeks counted from the first one holding four days of the year) of the week each row is in, taken from the row's Thursday. They are not interactive.",
      table: { defaultValue: { summary: "false" } },
    },
    fixedWeeks: {
      control: "boolean",
      description:
        "Whether every month is drawn as six rows of days, so the grid keeps one height whichever month it shows (the default). With false a month is drawn as only the rows it needs, four to six, and what is below the calendar moves as the month changes.",
      table: { defaultValue: { summary: "true" } },
    },
    animated: {
      control: "boolean",
      description:
        "Slides and fades the months in when the month on show changes, in the direction of the change. It is off under the reader's reduced-motion preference whatever this is set to.",
      table: { defaultValue: { summary: "true" } },
    },
    numberOfMonths: {
      control: { type: "number", min: 1, max: 4, step: 1 },
      description:
        "How many months are on show side by side, 1 to 4 — two is the usual choice for a range that may cross a month. They wrap onto more than one row when the container is too narrow. The previous and next buttons move the first month on show by one, and month / defaultMonth / onMonthChange are the first month on show. Neighbouring months' days (showOutsideDays) are only drawn when one month is on show.",
      table: { defaultValue: { summary: "1" } },
    },
    captionLayout: {
      control: "radio",
      options: ["label", "dropdown", "views"],
      description:
        "How the month and year are shown above the grid: as text (label), as two select fields (dropdown), or as a button (views) that opens a grid of the year's months and then a grid of years, to jump to a far-off month or year. With more than one month on show, dropdown gives the fields to the first month only and views is the plain heading.",
      table: { defaultValue: { summary: "'label'" } },
    },
    yearRange: {
      control: false,
      description:
        "The first and last year the year field offers, as [from, to], with captionLayout=\"dropdown\". min and max, when set, narrow it further; the year on show is always offered. Left out, it is the hundred years before this year and the twenty after it.",
    },
    showTodayButton: {
      control: "boolean",
      description:
        "Adds a footer button that shows today's month and chooses today when it can be chosen (in range mode it is a choice like any other). It is aria-disabled until the clock is known, and when the calendar is disabled.",
      table: { defaultValue: { summary: "false" } },
    },
    clearable: {
      control: "boolean",
      description:
        "Adds a footer button that clears the choice (the date, or the whole range). It stays in the footer and becomes aria-disabled when nothing is chosen, or the calendar is readOnly or disabled, so keyboard focus is never lost when pressing it empties the calendar.",
      table: { defaultValue: { summary: "false" } },
    },
    footer: {
      control: false,
      description:
        "Your own content for the footer, below the grid and the key, after the built-in buttons: a note, a link, a row of presets. It is yours to label and to make accessible.",
    },
    getMarker: {
      control: false,
      description:
        "Marks a day with a dot, or with your own content, under its number — for events, bookings, prices. Called with a date as \"YYYY-MM-DD\" for each day drawn, on every render, so keep it cheap and pure. Return { tone, label, content }, or nothing for a day without a marker. A label is added to the day's accessible name; without one the marker is decorative.",
    },
    minRangeDays: {
      control: { type: "number", min: 1, step: 1 },
      if: { arg: "mode", eq: "range" },
      description:
        "In range mode, the fewest days a range may span, counting both ends: a range from the 5th to the 7th is 3 days. While the end is being chosen, the dates that would make the range shorter are unavailable. Ignored in single mode.",
      table: { defaultValue: { summary: "1" } },
    },
    maxRangeDays: {
      control: { type: "number", min: 1, step: 1 },
      if: { arg: "mode", eq: "range" },
      description:
        "In range mode, the most days a range may span, counting both ends. While the end is being chosen, the dates that would make the range longer are unavailable. Ignored in single mode.",
    },
    rangeSpansUnavailable: {
      control: "boolean",
      if: { arg: "mode", eq: "range" },
      description:
        "In range mode, whether a range may run over an unavailable date. With false, once the start is chosen every date after the first unavailable one is unavailable too — for a booking where a booked night can't be stepped over. Ignored in single mode.",
      table: { defaultValue: { summary: "true" } },
    },
    today: {
      control: "text",
      description:
        "Today's date as \"YYYY-MM-DD\", which is marked in the grid. Left out, the calendar reads the clock in the browser once it has mounted, so a server-rendered page and its first client render agree. (The stories fix it, so they look the same on any day.)",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The size of the calendar. A day is a square as tall as an IconButton of this step, and the calendar is seven of them wide (less, on a screen narrower than that).",
      table: { defaultValue: { summary: "'md'" } },
    },
    rounded: {
      control: "boolean",
      description:
        "Draws the days and both month buttons round: a circle for each day, the chosen days, today's ring and the focus ring, and round month buttons. The strip behind a range keeps its straight edges, so it still reads as one run.",
      table: { defaultValue: { summary: "false" } },
    },
    showLegend: {
      control: "boolean",
      description:
        "Shows a key below the calendar that says what each look means: the ring around today, the solid fill of a chosen date or the ends of a range, the soft fill between them (once a range is started) and the dimmed look of unavailable dates (when anything can be unavailable). It lists only the looks that are on screen, so with nothing chosen there is no Selected entry. Each entry is a small shape drawn the way the look is in the grid; the text is in labels. (Not called key, which React keeps for itself.)",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Makes every date and both month buttons unavailable. They stay focusable (aria-disabled, not natively disabled), so keyboard focus isn't lost.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description:
        "Shows the chosen date or range but doesn't let it change. Moving between months and moving focus over the dates still work.",
      table: { defaultValue: { summary: "false" } },
    },
    autoFocus: {
      control: false,
      description:
        "Moves keyboard focus to the date that Tab would land on, when the calendar mounts. A calendar is a grid of buttons, so React's own autoFocus has nothing to act on.",
      table: { defaultValue: { summary: "false" } },
    },
    announce: {
      control: "boolean",
      description:
        "Announces the new month to screen readers whenever it changes — \"November 2026\" — through a visually hidden status region. Set it to false if your own content already announces the change.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction the calendar is drawn in. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page. Under rtl the first day of the week is at the right, the month buttons and their arrows swap sides, and the left and right arrow keys follow the picture.",
      table: { defaultValue: { summary: "'ltr'" } },
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself. Any you leave out keep their English default. Keys: calendar, previousMonth, nextMonth, months (twelve names, January first), weekdays and weekdaysShort (seven names, Sunday first), monthYear (a function of the year and month), day (a function of the year, month, day and weekday), today, rangeStart and rangeEnd.",
    },
    formatNumber: {
      control: false,
      description:
        "How a day or a year is written, for a language or region whose numerals differ from the plain 5 and 2026: given a number, returns the text to show (the default is String). Used for every day, the year in the heading and, by the default labels, in the accessible names, so what a day shows is always contained in its name. For example new Intl.NumberFormat(\"ar-EG\").format. Your own labels functions are given the plain numbers.",
      // A function's source would stretch the Default column; the description states the default.
      table: { defaultValue: { summary: "" } },
    },
    "aria-label": {
      control: false,
      description: "An accessible name for the calendar. Defaults to labels.calendar (\"Calendar\").",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the calendar; takes the place of aria-label.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the outermost element. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or when a test or router needs a stable anchor.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    mode: "single",
    value: inMonth(6),
    month: MONTH,
    min: "",
    max: "",
    weekStartsOn: 0,
    showOutsideDays: true,
    numberOfMonths: 1,
    captionLayout: "label",
    maxSelected: "",
    showWeekNumbers: false,
    fixedWeeks: true,
    animated: true,
    showTodayButton: false,
    clearable: false,
    minRangeDays: "",
    maxRangeDays: "",
    rangeSpansUnavailable: true,
    today: "",
    size: "md",
    rounded: false,
    showLegend: false,
    disabled: false,
    readOnly: false,
    announce: true,
    dir: "ltr",
  },
  render: function PlaygroundRender(args) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    const shared = {
      month: args.month,
      onMonthChange: (month: string) => updateArgs({ month }),
      min: args.min || undefined,
      max: args.max || undefined,
      weekStartsOn: args.weekStartsOn,
      showOutsideDays: args.showOutsideDays,
      numberOfMonths: args.numberOfMonths,
      captionLayout: args.captionLayout,
      showWeekNumbers: args.showWeekNumbers,
      fixedWeeks: args.fixedWeeks,
      animated: args.animated,
      showTodayButton: args.showTodayButton,
      clearable: args.clearable,
      today: args.today || undefined,
      size: args.size,
      rounded: args.rounded,
      showLegend: args.showLegend,
      disabled: args.disabled,
      readOnly: args.readOnly,
      announce: args.announce,
      dir: args.dir,
    };
    if (args.mode === "week") {
      return (
        <Calendar
          {...shared}
          mode="week"
          value={args.weekDate}
          onValueChange={(weekStart) => updateArgs({ weekDate: weekStart })}
        />
      );
    }
    if (args.mode === "multiple") {
      const dates = args.dates
        .split(",")
        .map((date) => date.trim())
        .filter(Boolean);
      return (
        <Calendar
          {...shared}
          mode="multiple"
          maxSelected={args.maxSelected === "" ? undefined : Number(args.maxSelected)}
          value={dates}
          onValueChange={(next) => updateArgs({ dates: next.join(", ") })}
        />
      );
    }
    return args.mode === "range" ? (
      <Calendar
        {...shared}
        mode="range"
        minRangeDays={args.minRangeDays === "" ? undefined : Number(args.minRangeDays)}
        maxRangeDays={args.maxRangeDays === "" ? undefined : Number(args.maxRangeDays)}
        rangeSpansUnavailable={args.rangeSpansUnavailable}
        value={[args.start, args.end]}
        onValueChange={([start, end]) => updateArgs({ start, end })}
      />
    ) : (
      <Calendar {...shared} value={args.value} onValueChange={(value) => updateArgs({ value })} />
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Choose a date, step through the months, and drive every prop from the Controls panel. Choosing writes back to `value`. */
export const Playground: Story = {
  args: { start: inMonth(8), end: inMonth(12), dates: `${inMonth(6)}, ${inMonth(9)}, ${inMonth(16)}`, weekDate: inMonth(12) },
  // The range's two ends are Playground-only controls (in code the range is the value prop's pair), so they are
  // declared here, not on the meta, where the Properties table would list them as props.
  argTypes: {
    weekDate: {
      control: "text",
      if: { arg: "mode", eq: "week" },
      description:
        "The chosen week in week mode, written as the YYYY-MM-DD date it starts on. A Playground control only: in code it is the value prop.",
    },
    dates: {
      control: "text",
      if: { arg: "mode", eq: "multiple" },
      description:
        "The chosen dates in multiple mode, written as YYYY-MM-DD separated by commas. A Playground control only: in code they are the value prop, a list.",
    },
    start: {
      control: "text",
      if: { arg: "mode", eq: "range" },
      description:
        "The start of the chosen range, as \"YYYY-MM-DD\". A Playground control only: in code the range is the value prop's first entry.",
    },
    end: {
      control: "text",
      if: { arg: "mode", eq: "range" },
      description:
        "The end of the chosen range, as \"YYYY-MM-DD\", or empty while it is still to be chosen. A Playground control only: in code the range is the value prop's second entry.",
    },
  },
  // The snippet is built from the live controls — only the props that differ from their defaults.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => calendarPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.sizes } } },
  render: () => (
    <div style={row} data-testid="sizes">
      {allSizes.map((size) => (
        <div key={size} style={labelled}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <Calendar size={size} defaultMonth={MONTH} defaultValue={inMonth(6)} aria-label={`Size ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const calendars = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] [role=group]")];
    await expect(calendars.length).toBe(5);
    const days = calendars.map((calendar) => calendar.querySelector("button[data-date]")!.getBoundingClientRect());
    // A day is a square at every step, and each step is larger than the last.
    for (const [index, box] of days.entries()) {
      await expect(Math.abs(box.width - box.height)).toBeLessThan(1);
      if (index > 0) await expect(box.height).toBeGreaterThan(days[index - 1]!.height);
    }
  },
};

export const Range: Story = {
  name: "Choosing a range",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.range } } },
  render: function RangeRender() {
    const [range, setRange] = useState<CalendarRangeValue>([inMonth(8), inMonth(14)]);
    return (
      <div style={labelled}>
        <Calendar mode="range" defaultMonth={MONTH} value={range} onValueChange={setRange} aria-label="Stay" />
        <Text size="sm" color="secondary" data-testid="range-readout">
          {range[0] === "" ? "No dates chosen" : range[1] === "" ? `From ${range[0]}, choose the last day` : `${range[0]} to ${range[1]}`}
        </Text>
      </div>
    );
  },
};

export const WeekStart: Story = {
  name: "Weeks that start on Monday",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.weekStart } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          weekStartsOn=&#123;0&#125; (default)
        </Text>
        <Calendar defaultMonth={MONTH} aria-label="Sunday first" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          weekStartsOn=&#123;1&#125;
        </Text>
        <Calendar weekStartsOn={1} defaultMonth={MONTH} aria-label="Monday first" />
      </div>
    </div>
  ),
};

const isWeekend = (date: string): boolean => {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return weekday === 0 || weekday === 6;
};

export const Unavailable: Story = {
  name: "Unavailable dates",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.unavailable } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          min and max
        </Text>
        <Calendar defaultMonth={MONTH} min={inMonth(8)} max={inMonth(24)} aria-label="Within a window" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          isDateDisabled: no weekends
        </Text>
        <Calendar defaultMonth={MONTH} isDateDisabled={isWeekend} aria-label="Weekdays only" />
      </div>
    </div>
  ),
};

export const OutsideDays: Story = {
  name: "Neighbouring months' days",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.outsideDays } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          showOutsideDays (default)
        </Text>
        <Calendar defaultMonth={MONTH} aria-label="With neighbours" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          showOutsideDays=&#123;false&#125;
        </Text>
        <Calendar showOutsideDays={false} defaultMonth={MONTH} aria-label="Month only" />
      </div>
    </div>
  ),
};

export const States: Story = {
  name: "Disabled and read-only",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.states } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          disabled
        </Text>
        <Calendar disabled defaultMonth={MONTH} defaultValue={inMonth(6)} aria-label="Disabled" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          readOnly
        </Text>
        <Calendar readOnly defaultMonth={MONTH} defaultValue={inMonth(6)} aria-label="Read only" />
      </div>
    </div>
  ),
};

export const Views: Story = {
  name: "Year and month views",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.views } } },
  render: () => (
    <div style={row}>
      <Calendar captionLayout="views" defaultMonth={MONTH} aria-label="Views" />
      <Calendar captionLayout="views" rounded size="lg" defaultMonth={MONTH} aria-label="Views, rounded and large" />
    </div>
  ),
};

export const Week: Story = {
  name: "A whole week",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.week } } },
  render: function WeekRender() {
    const [week, setWeek] = useState(inMonth(12));
    return (
      <div style={labelled}>
        <Calendar mode="week" weekStartsOn={1} defaultMonth={MONTH} value={week} onValueChange={setWeek} aria-label="Week" showWeekNumbers />
        <Text size="sm" color="secondary" data-testid="week-readout">
          Week starting {week}
        </Text>
      </div>
    );
  },
};

export const Dropdowns: Story = {
  name: "Month and year fields",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.dropdowns } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          A birth date: the last 100 years
        </Text>
        <Calendar captionLayout="dropdown" yearRange={[now.getFullYear() - 100, now.getFullYear()]} max={`${now.getFullYear()}-12-31`} aria-label="Birth date" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          A window set by min and max
        </Text>
        <Calendar
          captionLayout="dropdown"
          defaultMonth={MONTH}
          min={inMonth(8)}
          max={`${now.getFullYear() + 1}-06-30`}
          aria-label="Within a window"
        />
      </div>
    </div>
  ),
};

export const TwoMonths: Story = {
  name: "Two months",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.twoMonths } } },
  render: function TwoMonthsRender() {
    const [range, setRange] = useState<CalendarRangeValue>([inMonth(24), ""]);
    return (
      <Calendar mode="range" numberOfMonths={2} defaultMonth={MONTH} value={range} onValueChange={setRange} aria-label="Stay" />
    );
  },
};

export const Footer: Story = {
  name: "Today, Clear and a footer of your own",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.footer } } },
  render: () => (
    <Calendar
      showTodayButton
      clearable
      defaultMonth={MONTH}
      defaultValue={inMonth(6)}
      footer={
        <Text size="xs" color="secondary">
          Times are in your timezone.
        </Text>
      }
      aria-label="Appointment"
    />
  ),
};

const events: Record<number, { tone: "info" | "success" | "warning" | "danger"; label: string }> = {
  3: { tone: "info", label: "1 event" },
  12: { tone: "success", label: "Confirmed" },
  18: { tone: "warning", label: "2 events" },
  25: { tone: "danger", label: "Fully booked" },
};

export const Markers: Story = {
  name: "Markers on days",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.markers } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          A dot in a tone
        </Text>
        <Calendar
          defaultMonth={MONTH}
          defaultValue={inMonth(12)}
          getMarker={(date) => {
            const marker = events[Number(date.slice(8))];
            return date.startsWith(MONTH) && marker ? marker : undefined;
          }}
          aria-label="Events"
        />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          Your own content, at size lg
        </Text>
        <Calendar
          size="lg"
          defaultMonth={MONTH}
          showOutsideDays={false}
          getMarker={(date) =>
            date.startsWith(MONTH) && Number(date.slice(8)) % 5 === 0
              ? { content: <span>${Number(date.slice(8)) * 4}</span>, label: `$${Number(date.slice(8)) * 4}` }
              : undefined
          }
          aria-label="Prices"
        />
      </div>
    </div>
  ),
};

export const RangeLimits: Story = {
  name: "Range limits",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.rangeLimits } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          At least 3 days, at most 7
        </Text>
        <Calendar mode="range" minRangeDays={3} maxRangeDays={7} defaultMonth={MONTH} defaultValue={[inMonth(8), ""]} aria-label="Stay of 3 to 7 days" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          rangeSpansUnavailable=&#123;false&#125;, the 15th booked
        </Text>
        <Calendar
          mode="range"
          rangeSpansUnavailable={false}
          isDateDisabled={(date) => date === inMonth(15)}
          defaultMonth={MONTH}
          defaultValue={[inMonth(8), ""]}
          aria-label="Cannot step over a booked night"
        />
      </div>
    </div>
  ),
};

export const Multiple: Story = {
  name: "Several dates",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.multiple } } },
  render: function MultipleRender() {
    const [dates, setDates] = useState<string[]>([inMonth(6), inMonth(9)]);
    return (
      <div style={labelled}>
        <Calendar mode="multiple" maxSelected={4} defaultMonth={MONTH} value={dates} onValueChange={setDates} aria-label="Days off" showLegend />
        <Text size="sm" color="secondary" data-testid="multiple-readout">
          {dates.length === 0 ? "No dates chosen" : `${dates.length} of 4: ${dates.join(", ")}`}
        </Text>
      </div>
    );
  },
};

export const WeekNumbers: Story = {
  name: "Week numbers",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.weekNumbers } } },
  render: () => (
    <div style={row}>
      <Calendar showWeekNumbers weekStartsOn={1} defaultMonth={MONTH} aria-label="Weeks, Monday first" />
      <Calendar showWeekNumbers numberOfMonths={2} defaultMonth={MONTH} aria-label="Weeks, two months" />
    </div>
  ),
};

export const FlexibleWeeks: Story = {
  name: "Only the rows a month needs",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.flexibleWeeks } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          fixedWeeks (default): six rows
        </Text>
        <Calendar defaultMonth="2026-02" aria-label="Six rows" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          fixedWeeks=&#123;false&#125;: four rows
        </Text>
        <Calendar fixedWeeks={false} defaultMonth="2026-02" aria-label="Only the rows needed" />
      </div>
    </div>
  ),
};

export const InAForm: Story = {
  name: "In a form",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.form } } },
  render: function InAFormRender() {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(
            [...data.entries()].map(([key, value]) => `${key}=${String(value)}`).join("  "),
          );
        }}
        style={labelled}
      >
        <Calendar name="arrival" defaultMonth={MONTH} defaultValue={inMonth(8)} aria-label="Arrival" />
        <Calendar name="stay" mode="range" defaultMonth={MONTH} defaultValue={[inMonth(10), inMonth(13)]} aria-label="Stay" />
        <Button type="submit" size="sm">
          Submit
        </Button>
        <Text size="sm" color="secondary" data-testid="submitted">
          {submitted === "" ? "Nothing submitted yet" : submitted}
        </Text>
      </form>
    );
  },
};

export const Rounded: Story = {
  name: "Rounded",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.rounded } } },
  render: () => (
    <div style={row}>
      <Calendar rounded defaultMonth={MONTH} defaultValue={inMonth(6)} aria-label="Rounded" />
      <Calendar
        rounded
        mode="range"
        defaultMonth={MONTH}
        defaultValue={[inMonth(8), inMonth(12)]}
        aria-label="Rounded range"
      />
    </div>
  ),
};

export const Legend: Story = {
  name: "With a key",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.legend } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          A single date
        </Text>
        <Calendar showLegend defaultMonth={MONTH} defaultValue={inMonth(6)} aria-label="Single, with a key" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          A range, with unavailable dates
        </Text>
        <Calendar
          showLegend
          mode="range"
          defaultMonth={MONTH}
          defaultValue={[inMonth(8), inMonth(12)]}
          isDateDisabled={isWeekend}
          aria-label="Range, with a key"
        />
      </div>
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled value and month",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.controlled } } },
  render: function ControlledRender() {
    const [value, setValue] = useState(inMonth(20));
    const [month, setMonth] = useState(MONTH);
    return (
      <div style={labelled}>
        <Calendar value={value} onValueChange={setValue} month={month} onMonthChange={setMonth} aria-label="Appointment" />
        <Text size="sm" color="secondary" data-testid="controlled-readout">
          Chosen: {value} · showing {month}
        </Text>
      </div>
    );
  },
};

const spanishLabels = {
  calendar: "Calendario",
  previousMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  weekdaysShort: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
  today: "hoy",
  monthYear: (year: number, month: number) =>
    `${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][month - 1]} de ${year}`,
  day: ({ year, month, day, weekday }: { year: number; month: number; day: number; weekday: number }) =>
    `${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][weekday]}, ${day} de ${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][month - 1]} de ${year}`,
};

export const Labels: Story = {
  name: "In another language",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.labels } } },
  render: () => <Calendar weekStartsOn={1} defaultMonth={MONTH} labels={spanishLabels} defaultValue={inMonth(6)} />,
};

export const Locale: Story = {
  name: "Numbers in your own locale",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.locale } } },
  render: () => (
    <Calendar
      defaultMonth={MONTH}
     
      defaultValue={inMonth(6)}
      formatNumber={new Intl.NumberFormat("ar-EG", { useGrouping: false }).format}
      aria-label="Arabic-Indic digits"
    />
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.rightToLeft } } },
  render: () => (
    <Calendar
      dir="rtl"
      mode="range"
      weekStartsOn={6}
      defaultMonth={MONTH}
     
      defaultValue={[inMonth(8), inMonth(12)]}
      labels={{
        calendar: "التقويم",
        previousMonth: "الشهر السابق",
        nextMonth: "الشهر التالي",
        months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
        weekdays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
        weekdaysShort: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
      }}
    />
  ),
};

// Runs the choosing and the keyboard in a real browser without making the visible stories animate: Storybook plays a
// story's `play` whenever it is opened, so a play that changes what a story shows would leave the demo on a different
// state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const ChoosingInteraction: Story = {
  name: "Choosing a date — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: function ChoosingRender() {
    const [value, setValue] = useState("");
    return (
      <div style={labelled}>
        <Calendar defaultMonth={FIXED_MONTH} today={FIXED_TODAY} value={value} onValueChange={setValue} />
        <span data-testid="chosen">{value}</span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Tuesday, October 20, 2026" }));
    await expect(canvas.getByTestId("chosen")).toHaveTextContent("2026-10-20");
    await userEvent.click(canvas.getByRole("button", { name: "Next month" }));
    await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
  },
};

export const RangeInteraction: Story = {
  name: "Choosing a range — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: function RangeInteractionRender() {
    const [range, setRange] = useState<CalendarRangeValue>(["", ""]);
    return (
      <div style={labelled}>
        <Calendar mode="range" defaultMonth={FIXED_MONTH} today={FIXED_TODAY} value={range} onValueChange={setRange} aria-label="Stay" />
        <Text size="sm" color="secondary" data-testid="range-readout">
          {range[0] === "" ? "No dates chosen" : range[1] === "" ? `From ${range[0]}, choose the last day` : `${range[0]} to ${range[1]}`}
        </Text>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Thursday, October 22, 2026/ }));
    await expect(canvas.getByTestId("range-readout")).toHaveTextContent("From 2026-10-22");
    await userEvent.click(canvas.getByRole("button", { name: /^Tuesday, October 27, 2026/ }));
    await expect(canvas.getByTestId("range-readout")).toHaveTextContent("2026-10-22 to 2026-10-27");
  },
};

export const KeyboardInteraction: Story = {
  name: "Moving with the keyboard — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <Calendar defaultMonth={FIXED_MONTH} today={FIXED_TODAY} aria-label="Keyboard" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: /^Wednesday, October 14, 2026/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await expect(canvas.getByRole("button", { name: /^Thursday, October 22, 2026/ })).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^Sunday, November 22, 2026/ })).toHaveFocus();
  },
};
