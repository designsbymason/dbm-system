import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { FormField } from "../FormField";
import { TimePicker } from "./TimePicker";
import { timePickerPlaygroundSnippet, timePickerSnippets } from "./TimePicker.snippets";

const meta: Meta<typeof TimePicker> = {
  title: "Components/TimePicker",
  id: "molecules-inputs-timepicker",
  component: TimePicker,
  parameters: { layout: "padded" },
  // Core value props first, then the format and constraint props, then visual and state props, then the picker and
  // form wiring, then advanced/escape-hatch props last (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Overall size, on the shared scale; its height matches Input and Button at the same step.",
      table: { defaultValue: { summary: '"md"' } },
    },
    hasError: {
      control: "boolean",
      description:
        "Shows the error state: a danger-coloured border and aria-invalid. A time outside min/max, or a minute off the step, shows it too without this.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      control: false,
      description:
        "The time, as a 24-hour string: \"14:30\", or \"14:30:00\" with showSeconds. \"\" or omitted for no time. While the field is only partly filled it is \"\".",
    },
    defaultValue: {
      control: "text",
      description: "The initial time for uncontrolled usage, as a 24-hour string — ignored once value is provided.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: {
      control: false,
      description:
        "Called with the new value whenever it changes: a complete time as \"HH:mm\" (or \"HH:mm:ss\"), or \"\" when a segment is cleared and the time is no longer complete.",
    },
    commitOn: {
      control: "select",
      options: ["change", "complete", "blur"],
      description:
        "When onValueChange is called. \"change\" reports every change, an in-between time and every wheel row included. \"complete\" waits until a whole time has no digit still expected and the picker is closed (or the field is emptied). \"blur\" reports once, when focus leaves, the picker closes, Enter is pressed or the clear button is used. Both held modes also report on blur. The segments always show the latest edit.",
      table: { defaultValue: { summary: '"change"' } },
    },
    hourCycle: {
      control: "select",
      options: ["12", "24"],
      description:
        "\"12\" shows an hour from 1 to 12 and an AM/PM segment; \"24\" shows 0 to 23. Chosen explicitly and never read from the browser's locale. The value is 24-hour either way.",
      table: { defaultValue: { summary: '"12"' } },
    },
    periodPosition: {
      control: "select",
      options: ["end", "start"],
      description:
        "In the 12-hour cycle, where the AM/PM segment goes: \"end\" for \"3:45 PM\", \"start\" for \"PM 3:45\". The picker's AM/PM wheel moves with it. Ignored with hourCycle=\"24\".",
      table: { defaultValue: { summary: '"end"' } },
    },
    showSeconds: {
      control: "boolean",
      description: "Shows a seconds segment (and a seconds wheel in the picker), and makes the value \"HH:mm:ss\".",
      table: { defaultValue: { summary: "false" } },
    },
    step: {
      control: "number",
      description:
        "Minutes between the minute values the field accepts: 15 allows :00 :15 :30 :45. The arrow keys move along the grid and the picker lists only those minutes; a typed minute off the grid is flagged invalid.",
      table: { defaultValue: { summary: "1" } },
    },
    secondStep: {
      control: "number",
      description:
        "Seconds between the second values the field accepts, when showSeconds is on: 15 allows :00 :15 :30 :45. Works as step does for minutes.",
      table: { defaultValue: { summary: "1" } },
    },
    min: {
      control: "text",
      description:
        "The earliest allowed time, as \"HH:mm\" (or \"HH:mm:ss\"). An earlier time is flagged invalid, not refused, and the picker disables the options before it.",
    },
    max: {
      control: "text",
      description:
        "The latest allowed time, as \"HH:mm\" (or \"HH:mm:ss\"). A later time is flagged invalid, not refused, and the picker disables the options after it.",
    },
    isTimeDisabled: {
      control: false,
      description:
        "Rules out particular times — a lunch break, a booked slot. Called with a time as the 24-hour string the value uses; return true for one that isn't available. A time it rules out is flagged invalid and still reported, and the picker disables a row when it leaves no available time to reach. Keep it cheap and pure.",
    },
    showPicker: {
      control: "boolean",
      description:
        "Shows the button that opens the picker: a popover of wheels to scroll or tap, with the chosen row in the middle. Turn it off for a field that is only ever typed into.",
      table: { defaultValue: { summary: "true" } },
    },
    openOnFocus: {
      control: "boolean",
      description:
        "Opens the picker when a segment receives focus, by Tab or a click, from outside the field or from its own buttons. Focus stays on the segment, so typing still works, and the segments stop asking a phone for its keyboard. Moving from one segment to the next never reopens it. Needs showPicker.",
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      control: false,
      description: "The controlled open state of the picker. Omit (along with defaultOpen) to manage it internally.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state of the picker for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the picker's new open state whenever it changes.",
    },
    clearable: {
      control: "boolean",
      description:
        "Shows a clear (×) button while any segment has something in it. Pass it to turn the button on without having anything to do when it is used; onClear also turns it on, and clearable={false} turns it off whatever else is passed. Clearing empties the field itself (the AM/PM segment goes back to AM).",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: {
      control: false,
      description:
        "Called after the clear button has emptied the field (the field empties itself first, so this is only a notification). Passing it also shows the button, unless clearable={false}.",
    },
    onFocus: {
      control: false,
      description:
        "Called when focus arrives in the field from outside it. Moving between the segments, the buttons or into the picker is not arriving, so it fires once per visit.",
    },
    onBlur: {
      control: false,
      description:
        "Called when focus leaves the field for somewhere outside it (the picker counts as part of the field). The usual place for validate-on-blur; with commitOn it fires after the held value has been reported.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the whole field: no segment takes focus, the picker button is inert, and nothing changes.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description:
        "Marks the field as required: aria-required on each segment, and a real form constraint, so a surrounding <form> won't submit while the field is empty. A half-filled field and a time outside min/max, off a step or ruled out by isTimeDisabled stop a submit too.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description:
        "Makes the field read-only: its segments can be focused and read but not changed, and the picker and the clear button are hidden.",
      table: { defaultValue: { summary: "false" } },
    },
    autoFocus: {
      control: false,
      description:
        "Focuses the first segment when the field mounts. (React's own autoFocus only works on a native form control, so this is done with a ref and an effect.)",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description:
        "The name a surrounding <form> submits the value under, through a hidden time input holding the 24-hour string (and \"\" while the field is empty or incomplete). The same input is what a form validates.",
    },
    form: {
      control: false,
      description: "Associates the hidden form input with a <form> by id, when this isn't inside it.",
    },
    labels: {
      control: false,
      description:
        "Every piece of text the field writes itself — segment names, AM and PM, and the button names — for translation. Pass only the keys you want to change. Defaults: Hour, Minute, Second, AM/PM, AM, PM, Empty, Choose time, Choose a time, Clear time, Enter a complete time, This time isn't available.",
    },
    formatNumber: {
      control: false,
      description:
        "Writes a number in the digits you want shown: (n) => n.toLocaleString(\"ar-EG\"). Used for the digits on screen, in the picker and in what a screen reader hears; typing digits of any script still works. Never defaulted to a locale.",
    },
    "aria-label": {
      control: "text",
      description:
        "The field's accessible name when there is no visible label to point aria-labelledby at. Applied to the group the segments sit in.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points at the visible label that names the field. A FormField passes this.",
    },
    "aria-describedby": {
      control: false,
      description: "Points at helper or error text. A FormField passes this.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the first segment (the hour) — which is what a FieldLabel's htmlFor should point at, so clicking the label focuses the field. A FormField already does this.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
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
    defaultValue: "09:30",
    commitOn: "change",
    hourCycle: "12",
    periodPosition: "end",
    showSeconds: false,
    step: 1,
    secondStep: 1,
    min: "",
    max: "",
    showPicker: true,
    openOnFocus: false,
    defaultOpen: false,
    clearable: false,
    disabled: false,
    required: false,
    readOnly: false,
    name: "",
    "aria-label": "Start time",
    onValueChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof TimePicker>;

// The fixed-render stories below show one thing each; every control that render ignores is switched off.
const noControls = {
  value: { control: false },
  defaultValue: { control: false },
  onValueChange: { control: false },
  commitOn: { control: false },
  hourCycle: { control: false },
  periodPosition: { control: false },
  showSeconds: { control: false },
  step: { control: false },
  secondStep: { control: false },
  min: { control: false },
  max: { control: false },
  isTimeDisabled: { control: false },
  openOnFocus: { control: false },
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
  name: { control: false },
  "aria-label": { control: false },
} as const;

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" } as const;

/** Type a time into the segments, step them with the arrow keys, or open the picker; drive every prop from the Controls panel. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => timePickerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: timePickerSnippets.sizes } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <TimePicker key={size} size={size} aria-label={`Start time, ${size}`} defaultValue="09:30" />
      ))}
    </div>
  ),
};

export const HourCycles: Story = {
  name: "12-hour and 24-hour",
  parameters: { docs: { source: { code: timePickerSnippets.hourCycles } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimePicker hourCycle="12" aria-label="Start time, 12-hour" defaultValue="17:45" />
      <TimePicker hourCycle="24" aria-label="Start time, 24-hour" defaultValue="17:45" />
    </div>
  ),
};

export const WithSeconds: Story = {
  name: "With seconds",
  parameters: { docs: { source: { code: timePickerSnippets.seconds } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimePicker hourCycle="24" showSeconds aria-label="Start time" defaultValue="17:45:30" />
      <TimePicker showSeconds aria-label="Start time, 12-hour" defaultValue="17:45:30" />
    </div>
  ),
};

export const MinuteStep: Story = {
  name: "Minute step",
  parameters: { docs: { source: { code: timePickerSnippets.step } } },
  argTypes: { ...noControls },
  render: () => <TimePicker hourCycle="24" step={15} aria-label="Appointment" defaultValue="10:15" />,
};

export const TimeRange: Story = {
  name: "Limited to a range",
  parameters: { docs: { source: { code: timePickerSnippets.range } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimePicker hourCycle="24" min="09:00" max="17:00" aria-label="Appointment, outside the range" defaultValue="18:30" />
      <Text size="sm" color="secondary">
        18:30 is after the 17:00 latest, so the field is flagged; open the picker to see the unreachable options disabled.
      </Text>
    </div>
  ),
};

export const SecondStep: Story = {
  name: "Second step",
  parameters: { docs: { source: { code: timePickerSnippets.secondStep } } },
  argTypes: { ...noControls },
  render: () => <TimePicker hourCycle="24" showSeconds secondStep={15} aria-label="Start time" defaultValue="10:15:30" />,
};

export const UnavailableTimes: Story = {
  name: "Unavailable times",
  parameters: { docs: { source: { code: timePickerSnippets.unavailable } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimePicker
        hourCycle="24"
        step={15}
        aria-label="Appointment"
        defaultValue="09:30"
        isTimeDisabled={(time) => time >= "12:00" && time < "13:00"}
      />
      <Text size="sm" color="secondary">
        Lunch, 12:00 to 13:00, is ruled out: open the picker and the 12 hour is disabled, and typing 12:30 flags the field.
      </Text>
    </div>
  ),
};

export const PeriodFirst: Story = {
  name: "AM/PM first",
  parameters: { docs: { source: { code: timePickerSnippets.periodFirst } } },
  argTypes: { ...noControls },
  render: () => <TimePicker periodPosition="start" aria-label="Start time" defaultValue="15:45" />,
};

export const OpenOnFocus: Story = {
  name: "Open on focus",
  parameters: { docs: { source: { code: timePickerSnippets.openOnFocus } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimePicker openOnFocus aria-label="Start time" defaultValue="09:30" />
      <Text size="sm" color="secondary">
        Click or Tab to a segment: the picker opens beside it, and typing still works.
      </Text>
    </div>
  ),
};

/** What `commitOn` holds back: each field counts how often it has reported, and what it last said. */
function ReportingField({ commitOn }: { commitOn: "change" | "complete" | "blur" }) {
  const [reports, setReports] = useState<string[]>([]);
  return (
    <div style={stack}>
      <TimePicker
        aria-label={`Start time, commitOn ${commitOn}`}
        hourCycle="24"
        commitOn={commitOn}
        onValueChange={(next) => setReports((all) => [...all, next])}
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
  parameters: { docs: { source: { code: timePickerSnippets.commitOn } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <ReportingField commitOn="change" />
      <ReportingField commitOn="complete" />
      <ReportingField commitOn="blur" />
    </div>
  ),
};

export const InAForm: Story = {
  name: "Required, in a form",
  parameters: { docs: { source: { code: timePickerSnippets.form } } },
  argTypes: { ...noControls },
  render: function InAFormStory() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("reminder")));
        }}
      >
        <TimePicker aria-label="Reminder" name="reminder" required hourCycle="24" min="08:00" max="20:00" />
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
  parameters: { docs: { source: { code: timePickerSnippets.states } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimePicker hasError aria-label="Start time, error" defaultValue="09:30" />
      <TimePicker disabled aria-label="Start time, disabled" defaultValue="09:30" />
      <TimePicker readOnly aria-label="Start time, read-only" defaultValue="09:30" />
    </div>
  ),
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: timePickerSnippets.clearable } } },
  argTypes: { ...noControls },
  render: function ClearableStory() {
    const [value, setValue] = useState("09:30");
    return <TimePicker aria-label="Start time" value={value} onValueChange={setValue} clearable />;
  },
};

export const WithoutPicker: Story = {
  name: "Without the picker",
  parameters: { docs: { source: { code: timePickerSnippets.withoutPicker } } },
  argTypes: { ...noControls },
  render: () => <TimePicker showPicker={false} aria-label="Start time" defaultValue="09:30" />,
};

export const Controlled: Story = {
  name: "Controlled value",
  parameters: { docs: { source: { code: timePickerSnippets.controlled } } },
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [time, setTime] = useState("09:30");
    return (
      <div style={stack}>
        <TimePicker aria-label="Start time" value={time} onValueChange={setTime} />
        <Text size="sm" color="secondary">
          Value: <code>{time === "" ? '""' : time}</code>
        </Text>
      </div>
    );
  },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: timePickerSnippets.formField } } },
  argTypes: { ...noControls },
  render: () => (
    <FormField label="Reminder" helperText="In your local time">
      {(field) => <TimePicker {...field} />}
    </FormField>
  ),
};

export const Translated: Story = {
  name: "Translated, with its own digits",
  parameters: { docs: { source: { code: timePickerSnippets.translated } } },
  argTypes: { ...noControls },
  render: () => (
    <div dir="rtl">
      <TimePicker
        aria-label="وقت البدء"
        defaultValue="21:05"
        labels={{
          hour: "الساعة",
          minute: "الدقيقة",
          period: "ص/م",
          am: "ص",
          pm: "م",
          openPicker: "اختر الوقت",
          pickerName: "اختر وقتًا",
          clear: "مسح",
        }}
        formatNumber={(n) => n.toLocaleString("ar-EG")}
        clearable
      />
    </div>
  ),
};

// The stories below are hidden from the sidebar and the Docs page (`!dev`): they change the field's state (typing,
// opening the picker), so shown they would animate and settle somewhere unexpected — but they still run as tests.

export const TypeATime: Story = {
  name: "Type a time, step it, clear a segment — interaction test",
  tags: ["!dev"],
  args: { defaultValue: "" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("spinbutton", { name: "Hour" }));
    await userEvent.keyboard("0930p");
    await expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveValue("09");
    await expect(canvas.getByRole("spinbutton", { name: "Minute" })).toHaveValue("30");
    await expect(canvas.getByRole("spinbutton", { name: "AM/PM" })).toHaveValue("PM");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("21:30");
    await userEvent.click(canvas.getByRole("spinbutton", { name: "Minute" }));
    await userEvent.keyboard("{ArrowUp}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("21:31");
    await userEvent.keyboard("{Backspace}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("");
  },
};
