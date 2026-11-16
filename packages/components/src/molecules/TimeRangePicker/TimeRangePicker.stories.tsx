import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Text } from "../../atoms/Text";
import { FormField } from "../FormField";
import { TimeRangePicker } from "./TimeRangePicker";
import { timeRangePickerPlaygroundSnippet, timeRangePickerSnippets } from "./TimeRangePicker.snippets";
import type { TimeRangeValue } from "./TimeRangePicker.types";

const meta: Meta<typeof TimeRangePicker> = {
  title: "Components/TimeRangePicker",
  id: "molecules-inputs-timerangepicker",
  component: TimeRangePicker,
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Overall size of both fields, on the shared scale.",
      table: { defaultValue: { summary: '"md"' } },
    },
    hasError: {
      control: "boolean",
      description: "Shows the error state on both ends. An end earlier than the start shows it on that end without this.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      control: false,
      description:
        "The range, as [start, end] 24-hour strings: [\"09:00\", \"17:30\"]. Use \"\" for an end with no time yet. Controlled: pair it with onValueChange.",
    },
    defaultValue: {
      control: "object",
      description: "The initial range for uncontrolled usage — ignored once value is provided.",
      table: { defaultValue: { summary: '["", ""]' } },
    },
    onValueChange: {
      control: false,
      description:
        "Called with the new [start, end] whenever either end changes. An end that is empty or still half-filled is \"\". An end earlier than the start is reported as typed and flagged invalid, not refused.",
    },
    commitOn: {
      control: "select",
      options: ["change", "complete", "blur"],
      description:
        "When onValueChange is called, for each end: on every change, once that end is settled, or when focus leaves it. See TimePicker.",
      table: { defaultValue: { summary: '"change"' } },
    },
    hourCycle: {
      control: "select",
      options: ["12", "24"],
      description:
        "\"12\" shows each end with an AM/PM segment; \"24\" does not. Chosen explicitly, never read from the locale.",
      table: { defaultValue: { summary: '"12"' } },
    },
    periodPosition: {
      control: "select",
      options: ["end", "start"],
      description: "In the 12-hour cycle, whether each end's AM/PM comes after the time (\"end\", 3:45 PM) or before it (\"start\", PM 3:45).",
      table: { defaultValue: { summary: '"end"' } },
    },
    showSeconds: {
      control: "boolean",
      description: "Shows a seconds segment on both ends, making each value \"HH:mm:ss\".",
      table: { defaultValue: { summary: "false" } },
    },
    step: {
      control: "number",
      description: "Minutes between the minute values either end accepts: 15 allows :00 :15 :30 :45.",
      table: { defaultValue: { summary: "1" } },
    },
    secondStep: {
      control: "number",
      description: "Seconds between the second values either end accepts, with showSeconds: 15 allows :00 :15 :30 :45.",
      table: { defaultValue: { summary: "1" } },
    },
    min: {
      control: "text",
      description: "The earliest time either end may be, as \"HH:mm\". The end's earliest is also the start.",
    },
    max: { control: "text", description: "The latest time either end may be, as \"HH:mm\"." },
    isTimeDisabled: {
      control: false,
      description:
        "Rules out particular times for either end, with the 24-hour string each end's value uses; return true for a time that isn't available. Flagged and still reported, as min/max are. See TimePicker.",
    },
    minDuration: {
      control: "number",
      description:
        "The shortest the range may be, in minutes. An end that makes it shorter is flagged and still reported, and the end's picker disables what would; with constrainStart so does the start's.",
    },
    maxDuration: {
      control: "number",
      description: "The longest the range may be, in minutes. Flagged and disabled as minDuration is.",
    },
    allowOvernight: {
      control: "boolean",
      description:
        "Lets the end be earlier than the start, meaning the next day: 22:00 to 02:00 is four hours. The value stays a pair of times of day. Equal times are a range of no length. The duration limits count across midnight.",
      table: { defaultValue: { summary: "false" } },
    },
    constrainStart: {
      control: "boolean",
      description:
        "Limits the start by the end as the end is by the start: a start after the end is flagged and the start's picker disables it, and the duration limits apply to it. With allowOvernight the start has no latest, only the duration limits apply.",
      table: { defaultValue: { summary: "false" } },
    },
    showPicker: {
      control: "boolean",
      description: "Shows each end's picker button.",
      table: { defaultValue: { summary: "true" } },
    },
    sharedPicker: {
      control: "boolean",
      description:
        "Replaces the two pickers with one: a single button after the end opens one popover holding the start's wheels and the end's side by side. Picks follow commitOn. Needs showPicker.",
      table: { defaultValue: { summary: "false" } },
    },
    openOnFocus: {
      control: "boolean",
      description:
        "Opens an end's picker when focus lands on one of its segments other than from another of its own segments. Moving from one end to the other opens the other's picker too.",
      table: { defaultValue: { summary: "false" } },
    },
    clearable: {
      control: "boolean",
      description:
        "Shows a clear (×) button while an end has something in it. Pass it to turn the button on without having anything to do when it is used; onClear also turns it on, and clearable={false} turns it off whatever else is passed. Clearing empties that end, calling onClear with which one.",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: {
      control: false,
      description:
        "Called, with which end, after a clear button has emptied that end. Passing it also shows the buttons, unless clearable={false}.",
    },
    onFocus: {
      control: false,
      description:
        "Called when focus arrives in the range from outside it. Moving between the two ends, their buttons or their pickers is not arriving, so it fires once per visit to the pair.",
    },
    onBlur: {
      control: false,
      description: "Called when focus leaves the range for somewhere outside it, for validating the pair once the person has left both ends.",
    },
    disabled: { control: "boolean", description: "Disables both ends.", table: { defaultValue: { summary: "false" } } },
    required: {
      control: "boolean",
      description:
        "Marks both ends as required: a form won't submit while either is empty, and a half-filled or unavailable end stops it too.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: { control: "boolean", description: "Makes both ends read-only.", table: { defaultValue: { summary: "false" } } },
    autoFocus: {
      control: false,
      description: "Focuses the start field's first segment on mount.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: false,
      description: "The name a surrounding <form> submits both values under — name[], as RangeSlider does — start first.",
    },
    form: { control: false, description: "Associates the hidden form inputs with a <form> by id." },
    labels: {
      control: false,
      description:
        "Every piece of text the fields write themselves, and the two end names (Start time, End time), for translation. Pass only the keys you want to change.",
    },
    formatNumber: {
      control: false,
      description: "Writes a number in the digits you want shown; see TimePicker. Never defaulted to a locale.",
    },
    "aria-label": { control: "text", description: "The range's accessible name when there is no visible label to point aria-labelledby at." },
    "aria-labelledby": { control: false, description: "Points at the visible label that names the range. A FormField passes this." },
    "aria-describedby": { control: false, description: "Points at helper or error text. A FormField passes this." },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the start field's first segment — what a FieldLabel's htmlFor should point at. A FormField does this.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every control has a real value (an empty string for the optional text props), so none renders as an inert "Set string"
  // placeholder; the defaults match the component's own.
  args: {
    size: "md",
    hasError: false,
    defaultValue: ["09:00", "17:30"],
    commitOn: "change",
    hourCycle: "12",
    periodPosition: "end",
    showSeconds: false,
    step: 1,
    secondStep: 1,
    min: "",
    max: "",
    // 0 and a full day (1440) are "no limit", so the number controls have real values instead of an inert "Set number".
    minDuration: 0,
    maxDuration: 1440,
    allowOvernight: false,
    constrainStart: false,
    showPicker: true,
    sharedPicker: false,
    openOnFocus: false,
    clearable: false,
    disabled: false,
    required: false,
    readOnly: false,
    "aria-label": "Opening hours",
    onValueChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof TimeRangePicker>;

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
  minDuration: { control: false },
  maxDuration: { control: false },
  allowOvernight: { control: false },
  constrainStart: { control: false },
  sharedPicker: { control: false },
  openOnFocus: { control: false },
  onFocus: { control: false },
  onBlur: { control: false },
  size: { control: false },
  hasError: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  required: { control: false },
  showPicker: { control: false },
  clearable: { control: false },
  onClear: { control: false },
  "aria-label": { control: false },
} as const;

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" } as const;

/** Type each end, step it, or open its picker; drive every prop from the Controls panel. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => timeRangePickerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const HourCycles: Story = {
  name: "12-hour and 24-hour",
  parameters: { docs: { source: { code: timeRangePickerSnippets.hourCycles } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="12" aria-label="Opening hours, 12-hour" defaultValue={["09:00", "17:30"]} />
      <TimeRangePicker hourCycle="24" aria-label="Opening hours, 24-hour" defaultValue={["09:00", "17:30"]} />
    </div>
  ),
};

export const Constrained: Story = {
  name: "The end can't be before the start",
  parameters: { docs: { source: { code: timeRangePickerSnippets.constrained } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="24" step={15} min="08:00" max="18:00" aria-label="Meeting" defaultValue={["14:00", "13:00"]} />
      <Text size="sm" color="secondary">
        The end is before the start, so it is flagged; open its picker to see the earlier times disabled.
      </Text>
    </div>
  ),
};

export const Overnight: Story = {
  name: "Overnight",
  parameters: { docs: { source: { code: timeRangePickerSnippets.overnight } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="24" allowOvernight aria-label="Night shift" defaultValue={["22:00", "06:00"]} />
      <Text size="sm" color="secondary">
        06:00 is before 22:00, so it is the next morning: an eight-hour range, and no end time is disabled.
      </Text>
    </div>
  ),
};

export const DurationLimits: Story = {
  name: "Duration limits",
  parameters: { docs: { source: { code: timeRangePickerSnippets.duration } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="24" step={15} minDuration={30} maxDuration={120} aria-label="Booking" defaultValue={["09:00", "09:15"]} />
      <Text size="sm" color="secondary">
        A booking is 30 minutes to two hours: 09:15 is too short, so the end is flagged, and its picker disables the
        times outside that window.
      </Text>
    </div>
  ),
};

export const ConstrainedStart: Story = {
  name: "The start limited by the end",
  parameters: { docs: { source: { code: timeRangePickerSnippets.constrainStart } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="24" constrainStart maxDuration={60} aria-label="Slot" defaultValue={["10:00", "13:00"]} />
      <Text size="sm" color="secondary">
        With constrainStart the start is held to the end too: 10:00 would make a three-hour range, so the start is flagged
        and its picker disables the starts outside the last hour.
      </Text>
    </div>
  ),
};

export const SharedPicker: Story = {
  name: "One shared picker",
  parameters: { docs: { source: { code: timeRangePickerSnippets.shared } } },
  argTypes: { ...noControls },
  render: () => <TimeRangePicker sharedPicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} />,
};

export const Controlled: Story = {
  name: "Controlled value",
  parameters: { docs: { source: { code: timeRangePickerSnippets.controlled } } },
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [range, setRange] = useState<TimeRangeValue>(["09:00", ""]);
    return (
      <div style={stack}>
        <TimeRangePicker aria-label="Opening hours" value={range} onValueChange={setRange} />
        <Text size="sm" color="secondary">
          Value: <code>{JSON.stringify(range)}</code>
        </Text>
      </div>
    );
  },
};

export const Clearable: Story = {
  name: "With clear buttons",
  parameters: { docs: { source: { code: timeRangePickerSnippets.clearable } } },
  argTypes: { ...noControls },
  render: () => <TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} clearable />,
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: timeRangePickerSnippets.formField } } },
  argTypes: { ...noControls },
  render: () => (
    <FormField label="Opening hours" helperText="In your local time">
      {(field) => <TimeRangePicker {...field} />}
    </FormField>
  ),
};
