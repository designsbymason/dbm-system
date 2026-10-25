import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { FormField } from "../../molecules/FormField";
import { DateRangePicker } from "./DateRangePicker";
import { dateRangePickerPlaygroundSnippet, dateRangePickerSnippets } from "./DateRangePicker.snippets";
import type { DateRangeValue } from "./DateRangePicker.types";

const meta: Meta<typeof DateRangePicker> = {
  title: "Organisms/Inputs/DateRangePicker",
  component: DateRangePicker,
  parameters: { layout: "padded" },
  // Core value props first, then the format and constraint props, then visual and state props, then the calendar and
  // form wiring, then advanced/escape-hatch props last (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Overall size, on the shared scale; both ends match Input's height at the same step.",
      table: { defaultValue: { summary: '"md"' } },
    },
    hasError: {
      control: "boolean",
      description:
        "Shows the error state on both ends: a danger-coloured border and aria-invalid. A date outside min/max, one ruled out by isDateDisabled, an end that breaks the range's limits and three numbers that are not a real date show it on their own end without this.",
      table: { defaultValue: { summary: "false" } },
    },
    granularity: {
      control: "select",
      options: ["day", "month"],
      description:
        'What the pair chooses: "day", whole dates as "YYYY-MM-DD", or "month", only months of a year as "YYYY-MM", with no day segments and a grid of months in the panel (the first month chosen is the start, the second the end). Every date prop is then written as "YYYY-MM". The range limits, numberOfMonths and calendarProps have no effect by month, and isDateDisabled and unavailableReason only flag a month in the field.',
      table: { defaultValue: { summary: '"day"' } },
    },
    value: {
      control: false,
      description: 'The range, as ["YYYY-MM-DD", "YYYY-MM-DD"]. "" stands for an end that is not chosen, so ["2026-10-05", ""] is a range in progress.',
    },
    defaultValue: {
      control: false,
      description: "The initial range for uncontrolled usage — ignored once value is provided.",
      table: { defaultValue: { summary: '["", ""]' } },
    },
    onValueChange: {
      control: false,
      description:
        'Called with the new [start, end] whenever either end changes. After the first date is chosen in the calendar it is called with [start, ""], and after the second with the whole range.',
    },
    commitOn: {
      control: "select",
      options: ["change", "complete", "blur"],
      description:
        '"change" reports every change. "complete" and "blur" hold what is chosen in the calendar until the range is whole or the calendar closes; each end\'s typing is held as DatePicker\'s commitOn describes. A preset and the clear button are never held.',
      table: { defaultValue: { summary: '"change"' } },
    },
    format: {
      control: "select",
      options: ["mdy", "dmy", "ymd"],
      description:
        'The order the segments of each end are written in: "mdy", "dmy" or "ymd". Chosen explicitly and never read from the browser\'s locale. The value is "YYYY-MM-DD" whichever is shown.',
      table: { defaultValue: { summary: '"mdy"' } },
    },
    separator: {
      control: "text",
      description: "The text drawn between the segments of an end. A typed separator character moves to the next segment.",
      table: { defaultValue: { summary: '"/"' } },
    },
    min: {
      control: "text",
      description: 'The earliest allowed date for either end, as "YYYY-MM-DD" or the word "today". The end can never be before the start, whatever this says.',
    },
    max: {
      control: "text",
      description: 'The latest allowed date for either end, as "YYYY-MM-DD" or the word "today".',
    },
    isDateDisabled: {
      control: false,
      description:
        'Rules out particular dates: weekends, holidays, booked days. Called with a date as "YYYY-MM-DD"; return true for one that is not available. A date it rules out is flagged and still reported, and the calendar disables it. Keep it cheap and pure.',
    },
    unavailableReason: {
      control: false,
      description:
        "Says why a date is not available: return a short reason for a date that cannot be chosen, and nothing for one that can. It is read out as part of the day's name, shown under the calendar while that day has focus or the pointer, and is the form message for a typed date.",
    },
    minRangeDays: {
      control: "number",
      description:
        "The fewest days a range may span, counting both ends. In the calendar the dates that would make the range shorter are unavailable once the start is chosen; a typed end that does so is flagged on the end.",
      table: { defaultValue: { summary: "1" } },
    },
    maxRangeDays: {
      control: "number",
      description:
        "The most days a range may span, counting both ends. In the calendar the dates that would make the range longer are unavailable once the start is chosen; a typed end that does so is flagged on the end.",
    },
    rangeSpansUnavailable: {
      control: "boolean",
      description: "Whether a range may run over an unavailable date. With false, the calendar stops the end at the first one and a typed end past one is flagged.",
      table: { defaultValue: { summary: "true" } },
    },
    presets: {
      control: false,
      description:
        'Quick choices shown as buttons under the calendar ("Last 7 days"): each is { label, value }, where value is a [start, end] pair or a function of today\'s date, and picks a whole range and closes the calendar. A preset outside min/max, unavailable or breaking a limit is disabled.',
    },
    numberOfMonths: {
      control: false,
      description: "How many months are on show side by side in the calendar, 1 to 4. Takes a breakpoint map. The default is one month on a phone and two from sm up.",
      table: { defaultValue: { summary: "{ base: 1, sm: 2 }" } },
    },
    weekStartsOn: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6],
      description: "The day each calendar week starts on, 0 (Sunday) to 6. Explicit, never read from the locale.",
      table: { defaultValue: { summary: "0" } },
    },
    today: {
      control: false,
      description:
        "Today's date as YYYY-MM-DD, for marking today in the calendar, min=\"today\" and the date presets. By default the browser's date is read after the first render, so nothing differs between a server and the browser.",
    },
    calendarProps: {
      control: false,
      description:
        "Any other Calendar prop for the calendar inside the panel: captionLayout, showWeekNumbers, getMarker, footer, labels (month and weekday names), size and the rest. The props DateRangePicker owns itself are not accepted here.",
    },
    side: {
      control: "select",
      options: ["bottom", "top"],
      description: "Which side of the pair the calendar opens on first; it flips to the other side when there is no room.",
      table: { defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "How the calendar lines up with the pair along that side. The calendar is anchored to the whole pair, not to the button.",
      table: { defaultValue: { summary: '"start"' } },
    },
    presentation: {
      control: "select",
      options: ["anchored", "full-width"],
      description:
        '"anchored" floats the calendar from the pair; "full-width" spans the visible screen (an on-screen keyboard counted), which suits a phone. Takes a breakpoint map like { base: "full-width", sm: "anchored" }. align has no effect while it is full width.',
      table: { defaultValue: { summary: '"anchored"' } },
    },
    container: {
      control: false,
      description:
        "The element the calendar's panel is drawn into, instead of the end of the page: a scrolling or transformed box that would clip it, an element inside a dialog or a shadow root, or a box that scopes a demo.",
      table: { defaultValue: { summary: "document.body" } },
    },
    showPicker: {
      control: "boolean",
      description: "Shows the button that opens the calendar. Turn it off for a pair that is only ever typed into. Alt+ArrowDown in a segment opens it too.",
      table: { defaultValue: { summary: "true" } },
    },
    open: {
      control: false,
      description: "The controlled open state of the calendar. Omit (along with defaultOpen) to manage it internally.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state of the calendar for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the calendar's new open state whenever it changes.",
    },
    clearable: {
      control: "boolean",
      description:
        "Shows one clear (×) button for the pair while either end has a date. Passing onClear turns it on too; clearable={false} turns it off whatever else is passed.",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: {
      control: false,
      description: "Called after the clear button has emptied both ends. Passing it also shows the button, unless clearable={false}.",
    },
    onFocus: {
      control: false,
      description:
        "Called when focus arrives in the pair from outside it. Moving between the ends, the buttons or into the calendar is not arriving, so it fires once per visit.",
    },
    onBlur: {
      control: false,
      description: "Called when focus leaves the pair for somewhere outside it (the calendar counts as part of the pair).",
    },
    disabled: {
      control: "boolean",
      description: "Disables the whole pair: no segment takes focus, the buttons are inert, and nothing changes.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description:
        "Marks both ends as required: a real form constraint, so a surrounding <form> will not submit while either end is empty. A half-filled or impossible date, and a date that breaks a rule, stop a submit too.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Makes the pair read-only: the segments can be focused and read but not changed, and the calendar and the clear button are hidden.",
      table: { defaultValue: { summary: "false" } },
    },
    autoFocus: {
      control: false,
      description:
        "Focuses the start's first segment when the pair mounts. (React's own autoFocus only works on a native form control, so this is done with a ref and an effect.)",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description:
        "The name a surrounding <form> submits the range under: two values under name[], start then end, through hidden date inputs that also hold the form validation.",
    },
    form: {
      control: false,
      description: "Associates the hidden form inputs with a <form> by id, when this is not inside it.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction of the calendar and the buttons. The segments are always drawn left to right.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: {
      control: false,
      description:
        "Every piece of text the pair writes itself — end and segment names, button names, form messages — for translation. Pass only the keys you want to change. Defaults: Start date, End date, Day, Month, Year, Empty, Choose dates, Choose a date range, Clear dates, Enter a complete date, This date doesn't exist, This date isn't available, Choose {date} or later, Choose {date} or earlier, a range of at least or at most {days} days, This range includes unavailable dates, Quick choices, Dates chosen: {start} to {end}.",
    },
    formatNumber: {
      control: false,
      description:
        'Writes a number in the digits you want shown: (n) => n.toLocaleString("ar-EG"). Used for the digits on screen, in the calendar and in what a screen reader hears. Never defaulted to a locale.',
    },
    "aria-label": {
      control: "text",
      description: "The pair's accessible name when there is no visible label to point aria-labelledby at. Applied to the group the two ends sit in.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points at the visible label that names the pair. A FormField passes this.",
    },
    "aria-describedby": {
      control: false,
      description: "Points at helper or error text. A FormField passes this.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the start's first segment — which is what a FieldLabel's htmlFor should point at, so clicking the label focuses the field. A FormField already does this.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every control has a real value (an empty string for the optional text props), so none renders as an inert "Set string" or
  // "Set boolean" placeholder; the defaults match the component's own.
  args: {
    size: "md",
    hasError: false,
    granularity: "day",
    commitOn: "change",
    format: "mdy",
    separator: "/",
    min: "",
    max: "",
    minRangeDays: 1,
    rangeSpansUnavailable: true,
    weekStartsOn: 0,
    side: "bottom",
    align: "start",
    presentation: "anchored",
    showPicker: true,
    defaultOpen: false,
    clearable: false,
    disabled: false,
    required: false,
    readOnly: false,
    dir: "ltr",
    name: "",
    "aria-label": "Stay",
    onValueChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof DateRangePicker>;

// The fixed-render stories below show one thing each; every control that render ignores is switched off.
const noControls = {
  granularity: { control: false },
  value: { control: false },
  defaultValue: { control: false },
  onValueChange: { control: false },
  commitOn: { control: false },
  format: { control: false },
  separator: { control: false },
  min: { control: false },
  max: { control: false },
  minRangeDays: { control: false },
  maxRangeDays: { control: false },
  rangeSpansUnavailable: { control: false },
  isDateDisabled: { control: false },
  unavailableReason: { control: false },
  presets: { control: false },
  numberOfMonths: { control: false },
  side: { control: false },
  align: { control: false },
  presentation: { control: false },
  container: { control: false },
  weekStartsOn: { control: false },
  today: { control: false },
  onFocus: { control: false },
  onBlur: { control: false },
  size: { control: false },
  hasError: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  required: { control: false },
  showPicker: { control: false },
  defaultOpen: { control: false },
  clearable: { control: false },
  onClear: { control: false },
  dir: { control: false },
  name: { control: false },
  "aria-label": { control: false },
} as const;

const stack = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--dbm-space-4)",
  alignItems: "flex-start",
} as const;

const stay: DateRangeValue = ["2026-10-05", "2026-10-09"];

// Stories that depend on the date work from the real one, so they stay true on any day. Plain "YYYY-MM-DD" arithmetic, as a
// reader's own code would write it.
const shiftDays = (date: string, days: number) => {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
};

/** Type each end, or open the calendar and choose the first and last date; drive every prop from the Controls panel. */
export const Playground: Story = {
  args: { maxRangeDays: 0 },
  argTypes: {
    maxRangeDays: {
      control: "number",
      description:
        "The most days a range may span, counting both ends. 0 here means no limit (the prop is left out). In the calendar the dates that would make the range longer are unavailable once the start is chosen.",
    },
  },
  // By month the pair takes "YYYY-MM": the demo range is cut to its months when the control is switched over.
  render: (args) => (
    <DateRangePicker
      {...args}
      maxRangeDays={args.maxRangeDays || undefined}
      defaultValue={args.granularity === "month" ? [stay[0].slice(0, 7), stay[1].slice(0, 7)] : stay}
    />
  ),
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => dateRangePickerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: dateRangePickerSnippets.sizes } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DateRangePicker key={size} size={size} aria-label={`Stay, ${size}`} defaultValue={stay} />
      ))}
    </div>
  ),
};

export const Formats: Story = {
  name: "Day, month and year orders",
  parameters: { docs: { source: { code: dateRangePickerSnippets.formats } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DateRangePicker format="mdy" aria-label="Stay, month first" defaultValue={stay} />
      <DateRangePicker format="dmy" separator="." aria-label="Stay, day first" defaultValue={stay} />
      <DateRangePicker format="ymd" separator="-" aria-label="Stay, year first" defaultValue={stay} />
    </div>
  ),
};

export const Limits: Story = {
  name: "Length limits and unavailable days",
  parameters: { docs: { source: { code: dateRangePickerSnippets.limits } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DateRangePicker
        aria-label="Booking"
        min="today"
        minRangeDays={2}
        maxRangeDays={14}
        rangeSpansUnavailable={false}
        isDateDisabled={(date) => new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0}
      />
      <Text size="sm" color="secondary">
        A booking of two to fourteen days that cannot run over a weekend: choose a start in the calendar and the dates that would break a limit are disabled; type an end
        that does and the field says why.
      </Text>
    </div>
  ),
};

export const UnavailableReasons: Story = {
  name: "Why a date is unavailable",
  parameters: { docs: { source: { code: dateRangePickerSnippets.reasons } } },
  argTypes: { ...noControls },
  render: function UnavailableReasonsStory() {
    const today = new Date().toISOString().slice(0, 10);
    const booked = shiftDays(today, 3);
    return (
      <div style={stack}>
        <DateRangePicker aria-label="Booking" unavailableReason={(date) => (date === booked ? "Fully booked" : undefined)} />
        <Text size="sm" color="secondary">
          Open the calendar and move to three days from today: the reason is read as part of the day&apos;s name and shown under the calendar.
        </Text>
      </div>
    );
  },
};

export const Presets: Story = {
  name: "Quick choices",
  parameters: { docs: { source: { code: dateRangePickerSnippets.presets } } },
  argTypes: { ...noControls },
  render: () => (
    <DateRangePicker
      aria-label="Report period"
      presets={[
        {
          label: "Last 7 days",
          value: (today) => [shiftDays(today, -6), today],
        },
        {
          label: "Last 30 days",
          value: (today) => [shiftDays(today, -29), today],
        },
        {
          label: "This year",
          value: (today) => [`${today.slice(0, 4)}-01-01`, `${today.slice(0, 4)}-12-31`],
        },
      ]}
    />
  ),
};

export const ByMonth: Story = {
  name: "Months only",
  parameters: { docs: { source: { code: dateRangePickerSnippets.byMonth } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DateRangePicker granularity="month" aria-label="Report period" defaultValue={["2026-03", "2026-06"]} />
      <DateRangePicker
        granularity="month"
        format="ymd"
        separator="-"
        aria-label="Billing period"
        min="today"
        presets={[
          { label: "This quarter", value: (today) => [today.slice(0, 7), today.slice(0, 7)] },
          { label: "This year", value: (today) => [`${today.slice(0, 4)}-01`, `${today.slice(0, 4)}-12`] },
        ]}
      />
    </div>
  ),
};

export const Months: Story = {
  name: "Months on show",
  parameters: { docs: { source: { code: dateRangePickerSnippets.months } } },
  argTypes: { ...noControls },
  render: () => <DateRangePicker aria-label="Stay" numberOfMonths={{ base: 1, md: 3 }} defaultValue={stay} />,
};

export const CalendarOptions: Story = {
  name: "Calendar options",
  parameters: { docs: { source: { code: dateRangePickerSnippets.calendar } } },
  argTypes: { ...noControls },
  render: () => <DateRangePicker aria-label="Stay" weekStartsOn={1} calendarProps={{ showWeekNumbers: true, captionLayout: "views" }} />,
};

export const Placement: Story = {
  name: "Side and alignment",
  parameters: { docs: { source: { code: dateRangePickerSnippets.placement } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={{ ...stack, paddingBlockStart: "var(--dbm-space-4)" }}>
      <DateRangePicker side="top" align="end" aria-label="Opens above, end-aligned" defaultValue={stay} />
    </div>
  ),
};

export const FullWidth: Story = {
  name: "Full width, for a phone",
  parameters: { docs: { source: { code: dateRangePickerSnippets.fullWidth } } },
  argTypes: { ...noControls },
  render: () => <DateRangePicker aria-label="Stay" presentation={{ base: "full-width", sm: "anchored" }} defaultValue={stay} />,
};

/** What `commitOn` holds back: each pair counts how often it has reported, and what it last said. */
function ReportingPair({ commitOn }: { commitOn: "change" | "complete" | "blur" }) {
  const [reports, setReports] = useState<string[]>([]);
  return (
    <div style={stack}>
      <DateRangePicker
        aria-label={`Stay, commitOn ${commitOn}`}
        defaultValue={stay}
        commitOn={commitOn}
        onValueChange={(next) => setReports((all) => [...all, next.join(" to ")])}
      />
      <Text size="sm" color="secondary">
        <code>{commitOn}</code>: {reports.length} {reports.length === 1 ? "report" : "reports"}, last{" "}
        <code>{reports.length === 0 ? "none yet" : JSON.stringify(reports.at(-1))}</code>
      </Text>
    </div>
  );
}

export const CommitTiming: Story = {
  name: "When it reports",
  parameters: { docs: { source: { code: dateRangePickerSnippets.commitOn } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <ReportingPair commitOn="change" />
      <ReportingPair commitOn="complete" />
      <ReportingPair commitOn="blur" />
    </div>
  ),
};

export const InAForm: Story = {
  name: "Required, in a form",
  parameters: { docs: { source: { code: dateRangePickerSnippets.form } } },
  argTypes: { ...noControls },
  render: function InAFormStory() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(new FormData(event.currentTarget).getAll("stay[]").join(" to "));
        }}
      >
        <DateRangePicker aria-label="Stay" name="stay" required min="2026-10-01" />
        <Button type="submit">Save</Button>
        <Text size="sm" color="secondary">
          {submitted === null ? "Submit it empty, half-filled or out of range: the browser stops it." : `Submitted ${submitted}`}
        </Text>
      </form>
    );
  },
};

export const States: Story = {
  name: "Error, disabled and read-only",
  parameters: { docs: { source: { code: dateRangePickerSnippets.states } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DateRangePicker hasError aria-label="Stay, error" defaultValue={stay} />
      <DateRangePicker disabled aria-label="Stay, disabled" defaultValue={stay} />
      <DateRangePicker readOnly aria-label="Stay, read-only" defaultValue={stay} />
    </div>
  ),
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: dateRangePickerSnippets.clearable } } },
  argTypes: { ...noControls },
  render: function ClearableStory() {
    const [value, setValue] = useState<DateRangeValue>(stay);
    return <DateRangePicker aria-label="Stay" value={value} onValueChange={setValue} clearable />;
  },
};

export const WithoutPicker: Story = {
  name: "Without the calendar",
  parameters: {
    docs: { source: { code: dateRangePickerSnippets.withoutPicker } },
  },
  argTypes: { ...noControls },
  render: () => <DateRangePicker showPicker={false} aria-label="Stay" defaultValue={stay} />,
};

export const Controlled: Story = {
  name: "Controlled value",
  parameters: {
    docs: { source: { code: dateRangePickerSnippets.controlled } },
  },
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [range, setRange] = useState<DateRangeValue>(stay);
    return (
      <div style={stack}>
        <DateRangePicker aria-label="Stay" value={range} onValueChange={setRange} />
        <Text size="sm" color="secondary">
          Value: <code>{JSON.stringify(range)}</code>
        </Text>
      </div>
    );
  },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: dateRangePickerSnippets.formField } } },
  argTypes: { ...noControls },
  render: () => (
    <FormField label="Stay" helperText="Check-in and check-out">
      {(field) => <DateRangePicker {...field} />}
    </FormField>
  ),
};

export const Translated: Story = {
  name: "Translated, with its own digits",
  parameters: {
    docs: { source: { code: dateRangePickerSnippets.translated } },
  },
  argTypes: { ...noControls },
  render: () => (
    <div dir="rtl">
      <DateRangePicker
        aria-label="الإقامة"
        dir="rtl"
        format="dmy"
        defaultValue={stay}
        labels={{
          start: "من",
          end: "إلى",
          day: "اليوم",
          month: "الشهر",
          year: "السنة",
          openPicker: "اختر التواريخ",
          pickerName: "اختر فترة",
          clear: "مسح",
        }}
        formatNumber={(n) => n.toLocaleString("ar-EG", { useGrouping: false })}
        clearable
      />
    </div>
  ),
};

// The stories below are hidden from the sidebar and the Docs page (`!dev`): they change the pair's state (typing,
// opening the calendar), so shown they would animate and settle somewhere unexpected — but they still run as tests.

export const TypeARange: Story = {
  name: "Type both ends — interaction test",
  tags: ["!dev"],
  args: { defaultValue: ["", ""] },
  render: (args) => <DateRangePicker {...args} defaultValue={["", ""]} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const start = within(canvas.getByRole("group", { name: "Start date" }));
    const end = within(canvas.getByRole("group", { name: "End date" }));
    await userEvent.click(start.getByRole("spinbutton", { name: "Month" }));
    await userEvent.keyboard("10052026");
    await userEvent.click(end.getByRole("spinbutton", { name: "Month" }));
    await userEvent.keyboard("10092026");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["2026-10-05", "2026-10-09"]);
  },
};

export const ChooseInTheCalendar: Story = {
  name: "Open the calendar and choose a range — interaction test",
  tags: ["!dev"],
  render: (args) => <DateRangePicker {...args} today="2026-10-01" />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose dates" }));
    const find = (date: string) =>
      waitFor(() => {
        const found = document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`);
        if (!found) throw new Error("the calendar has not opened");
        return found;
      });
    await userEvent.click(await find("2026-10-12"));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["2026-10-12", ""]);
    await userEvent.click(await find("2026-10-15"));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["2026-10-12", "2026-10-15"]);
  },
};
