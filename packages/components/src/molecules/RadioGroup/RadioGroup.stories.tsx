import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { FieldError } from "../../atoms/FieldError";
import { Radio } from "../../atoms/Radio";
import { RadioGroup } from "./RadioGroup";
import { radioGroupPlaygroundSnippet, radioGroupSnippets } from "./RadioGroup.snippets";

const meta: Meta<typeof RadioGroup> = {
  title: "Molecules/Inputs/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "padded" },
  // Keys below are ordered to match the component's own `RadioGroupProps`
  // declaration order — same sequencing principle as every other
  // component's stories file (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    // Not a meaningful live-editable control for a group managing
    // structured Radio children — every story hardcodes its own children
    // in `render` (same reasoning as List's own `children` argType).
    children: { control: false, description: "The Radio elements this group manages." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size every Radio in this group inherits, unless it sets its own.",
    },
    // Deliberately excluded — same reasoning as Radio's own `checked`:
    // driving it from Controls without a real `onValueChange` wired back
    // would freeze the group, since Radix always defers to the controlled
    // value.
    value: { control: false, description: "The controlled selected value." },
    defaultValue: {
      control: "select",
      options: ["email", "sms", "phone"],
      description: "The initial selected value when uncontrolled.",
    },
    onValueChange: {
      control: false,
      description: "Called with the newly selected value whenever the selection changes.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the group as invalid, via aria-invalid on the group itself.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every Radio in the group at once.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Marks the group as required for real HTML5 form validation, and sets aria-required.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Form field name shared by every Radio in the group.",
    },
    form: {
      control: false,
      description: "Associates the group with a <form> by id, for use outside that form's own DOM subtree.",
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description:
        "Layout direction, and which arrow-key pair moves roving focus between options. Purely visual/keyboard — unrelated to text direction, see dir for that.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction, passed through to Radix RadioGroup. Left out, the nearest DirectionProvider's, then a Radix DirectionProvider's if the app has one, else left-to-right; not read from the page.",
    },
    loop: {
      control: "boolean",
      description: "Whether roving focus wraps from the last option back to the first.",
      table: { defaultValue: { summary: "true" } },
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the group — every role=radiogroup needs one.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points to the id of an existing, already-visible element to use as the group's accessible name instead.",
    },
    id: {
      control: false,
      description: "Standard DOM id. Rarely needed directly.",
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
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    size: "md",
    defaultValue: "email",
    hasError: false,
    disabled: false,
    required: false,
    name: "",
    orientation: "vertical",
    dir: "ltr",
    loop: true,
    "aria-label": "Contact method",
    onValueChange: fn(),
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="email">Email</Radio>
      <Radio value="sms">SMS</Radio>
      <Radio value="phone">Phone call</Radio>
    </RadioGroup>
  ),
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => radioGroupPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Orientation: Story = {
  name: "Vertical vs. horizontal",
  parameters: { docs: { source: { code: radioGroupSnippets.orientation } } },
  // `orientation` is the whole point of this comparison, fixed per
  // instance — every other prop stays live via `{...args}`.
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <RadioGroup {...args} aria-label="Contact method (vertical)" orientation="vertical">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="phone">Phone call</Radio>
      </RadioGroup>
      <RadioGroup {...args} aria-label="Contact method (horizontal)" orientation="horizontal">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="phone">Phone call</Radio>
      </RadioGroup>
    </div>
  ),
};

export const SizeCascade: Story = {
  name: "Size cascade, with a per-item override",
  parameters: { docs: { source: { code: radioGroupSnippets.sizeCascade } } },
  // `size` is the whole point of this comparison, fixed per instance —
  // every other prop stays live via `{...args}`.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <RadioGroup {...args} aria-label="Small" size="sm">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>
      <RadioGroup {...args} aria-label="Large" size="lg">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>
      <RadioGroup {...args} aria-label="Large group, one option overridden to xs" size="lg">
        <Radio value="email">Email</Radio>
        <Radio value="sms" size="xs">
          SMS (overridden to xs)
        </Radio>
      </RadioGroup>
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: radioGroupSnippets.states } } },
  // Each row demonstrates a specific, fixed state combination — same
  // reasoning as Radio's/Checkbox's own States stories.
  argTypes: {
    disabled: { control: false },
    hasError: { control: false },
    defaultValue: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <RadioGroup {...args} aria-label="No selection" defaultValue={undefined} disabled={false} hasError={false}>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>
      <RadioGroup {...args} aria-label="Default" defaultValue="email" disabled={false} hasError={false}>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>
      <RadioGroup {...args} aria-label="Disabled" defaultValue="email" disabled hasError={false}>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>
      <RadioGroup {...args} aria-label="One option individually disabled" defaultValue="email" disabled={false} hasError={false}>
        <Radio value="email">Email</Radio>
        <Radio value="sms" disabled>
          SMS (unavailable)
        </Radio>
      </RadioGroup>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        {/*
          hasError only sets aria-invalid on RadioGroup — there's no bordered
          box on a bare group for a visual treatment to live on (see the
          component's own JSDoc and the Docs page's Usage guidelines), so
          this row would be visually identical to "Default" without a paired
          FieldError. Pairing it is also the actual documented, correct
          real-world usage, not just a demo workaround.
        */}
        <RadioGroup {...args} aria-label="Error state" defaultValue={undefined} disabled={false} hasError>
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </RadioGroup>
        <FieldError>Please choose a contact method</FieldError>
      </div>
    </div>
  ),
};

export const ControlledSelectionSummary: Story = {
  name: "Controlled, with a live selection summary",
  parameters: { docs: { source: { code: radioGroupSnippets.controlled } } },
  // `value`/`onValueChange`/`children`/`defaultValue` are all driven by
  // this story's own local state (the whole point of the demo), so those
  // are excluded from the live controls — every other prop stays live via
  // `{...args}`.
  argTypes: {
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    children: { control: false },
  },
  render: function ControlledSelectionSummaryStory(args) {
    const [value, setValue] = useState<string>("email");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
        <RadioGroup {...args} value={value} onValueChange={setValue}>
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
          <Radio value="phone">Phone call</Radio>
        </RadioGroup>
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-sm)" }}>
          Selected: {value}
        </span>
      </div>
    );
  },
};

export const SelectInteraction: Story = {
  name: "Interaction: selects a different option on click",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: "Email" });
    const sms = canvas.getByRole("radio", { name: "SMS" });
    await expect(email).toHaveAttribute("aria-checked", "true");
    await expect(sms).toHaveAttribute("aria-checked", "false");

    await userEvent.click(sms);
    await expect(sms).toHaveAttribute("aria-checked", "true");
    await expect(email).toHaveAttribute("aria-checked", "false");
    await expect(args.onValueChange).toHaveBeenCalledWith("sms");
  },
};

export const ArrowKeyInteraction: Story = {
  name: "Interaction: arrow keys move focus and selection between options",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: "Email" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — same pattern as Collapse's/Radio's own
    // interaction stories.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await userEvent.tab();
    await expect(email).toHaveFocus();
    await pause(500);

    await userEvent.keyboard("{ArrowDown}");
    await pause(500);
    await userEvent.keyboard(" ");
    const sms = canvas.getByRole("radio", { name: "SMS" });
    await expect(sms).toHaveFocus();
    await expect(sms).toHaveAttribute("aria-checked", "true");
    await pause(500);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks every option",
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    for (const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toBeDisabled();
    }
    await userEvent.click(canvas.getByRole("radio", { name: "SMS" }));
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};
