import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Checkbox } from "../../atoms/Checkbox";
import { Input } from "../../atoms/Input";
import { Textarea } from "../../atoms/Textarea";
import { CheckboxGroup } from "../CheckboxGroup";
import { RadioGroup } from "../RadioGroup";
import { Radio } from "../../atoms/Radio";
import { Select } from "../Select";
import { FormField } from "./FormField";
import { formFieldPlaygroundSnippet, formFieldSnippets } from "./FormField.snippets";

// Matches Input's/Select's own established "constrain the demo width"
// convention — a bare text field stretched to the full padded canvas width
// looks broken, not like a realistic form field.
const demoContainerStyle = {
  maxWidth: "20rem",
  marginInline: "auto",
} as const;

const meta: Meta<typeof FormField> = {
  title: "Components/FormField",
  id: "molecules-inputs-formfield",
  component: FormField,
  parameters: { layout: "padded" },
  // Ordered to match FormFieldProps' own declaration order (label,
  // children, helperText, error, required, disabled, size, id, className,
  // style, data-testid) — same sequencing principle as every other
  // component's stories file (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    label: {
      control: "text",
      description: "The field's visible label text, rendered via FieldLabel.",
    },
    // A function can't be driven by a Storybook control — every story
    // hardcodes its own render function instead (same reasoning as
    // RadioGroup's/CheckboxGroup's own `children` argType).
    children: {
      control: false,
      description: "Renders the control, receiving the computed field props to spread onto it.",
    },
    helperText: {
      control: "text",
      description: "Supplementary helper/hint text, hidden while error is set.",
    },
    error: {
      control: "text",
      description: "The validation error message — its presence alone marks the field invalid.",
    },
    required: {
      description: "Marks the label with a required-indicator asterisk, and required on the control.",
    },
    disabled: {
      description: "Disables the field as a whole — label, control, and helper/error text.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size for the FieldLabel, matching the control's own size scale. Inside a FieldGroup, defaults to the group's size.",
      table: { defaultValue: { summary: '"md"' } },
    },
    name: {
      control: false,
      description:
        "The name this field's value is submitted under, and the key a surrounding Form finds its error, rule and summary link by. Handed back in fieldProps.name.",
    },
    validate: {
      control: false,
      description:
        "This field's own rule, run by a surrounding Form on submit: receives the field's value and all the form's values, and returns the message to show. Needs name. Does nothing outside a Form.",
    },
    id: {
      control: false,
      description: "Overrides the auto-generated base id used to derive every sub-part's own id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for the outer wrapper.",
    },
    style: {
      control: false,
      description: "Inline styles for the outer wrapper.",
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
    label: "Email address",
    helperText: "We'll never share this with anyone else.",
    error: "",
    required: false,
    disabled: false,
    size: "md",
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <FormField {...args}>
        {(fieldProps) => <Input {...fieldProps} type="email" placeholder="you@example.com" />}
      </FormField>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof FormField>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => formFieldPlaygroundSnippet(context.args),
      },
    },
  },
};

export const WithDifferentControls: Story = {
  name: "Wrapping different control types",
  parameters: { docs: { source: { code: formFieldSnippets.withDifferentControls } } },
  argTypes: {
    label: { control: false },
    helperText: { control: false },
  },
  render: () => (
    <div
      style={{
        ...demoContainerStyle,
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-6)",
      }}
    >
      <FormField label="Email address" helperText="We'll never share this">
        {(fieldProps) => <Input {...fieldProps} type="email" placeholder="you@example.com" />}
      </FormField>
      <FormField label="Bio" helperText="Up to 280 characters">
        {(fieldProps) => <Textarea {...fieldProps} placeholder="Tell us about yourself" />}
      </FormField>
      <FormField label="Accept terms">
        {(fieldProps) => <Checkbox {...fieldProps}>I agree to the Terms of Service</Checkbox>}
      </FormField>
      <FormField label="Contact method">
        {(fieldProps) => (
          <RadioGroup {...fieldProps} defaultValue="email">
            <Radio value="email">Email</Radio>
            <Radio value="sms">SMS</Radio>
          </RadioGroup>
        )}
      </FormField>
      <FormField label="Interests">
        {(fieldProps) => (
          <CheckboxGroup {...fieldProps} defaultValue={["sports"]}>
            <Checkbox value="sports">Sports</Checkbox>
            <Checkbox value="music">Music</Checkbox>
          </CheckboxGroup>
        )}
      </FormField>
      <FormField label="Plan">
        {(fieldProps) => (
          <Select {...fieldProps} placeholder="Choose a plan" defaultValue="monthly">
            <Select.Option value="monthly">Monthly</Select.Option>
            <Select.Option value="annual">Annual</Select.Option>
          </Select>
        )}
      </FormField>
    </div>
  ),
};

export const States: Story = {
  // Each row demonstrates a specific, fixed state combination — same
  // reasoning as RadioGroup's/CheckboxGroup's own States stories.
  //
  // Known finding (established 2026-08-16, adding @storybook/addon-vitest):
  // the "Disabled" row's FieldHelperText measures 2.32:1 against bg.surface,
  // below the 4.5:1 AA text floor — but this is the already-decided,
  // WCAG-exempt disabled-state pairing computed in
  // 03-token-system-spec.md's Phase 17 (WCAG 2.1 excludes inactive/disabled
  // UI components from 1.4.3), not a new defect — the same known finding
  // already annotated on FieldHelperText's/FieldLabel's/FieldError's/Text's
  // own "Disabled"/"All colors" stories, surfacing here for the first time
  // because this is the first story to exercise FieldHelperText's disabled
  // state via aria-describedby rather than a native disabled control's own
  // <label for> (which axe already exempts on its own). See
  // guidelines/01-vision-and-goals.md §12.
  parameters: { a11y: { test: "todo" }, docs: { source: { code: formFieldSnippets.states } } },
  argTypes: {
    helperText: { control: false },
    error: { control: false },
    required: { control: false },
    disabled: { control: false },
  },
  render: (args) => (
    <div
      style={{
        ...demoContainerStyle,
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-6)",
      }}
    >
      <FormField {...args} label="Default" helperText="We'll never share this">
        {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
      </FormField>
      <FormField {...args} label="Required" helperText="We'll never share this" required>
        {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
      </FormField>
      <FormField
        {...args}
        label="Error"
        helperText="We'll never share this"
        error="Enter a valid email address"
      >
        {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
      </FormField>
      <FormField {...args} label="Disabled" helperText="We'll never share this" disabled>
        {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
      </FormField>
    </div>
  ),
};

export const ControlledWithLiveValidation: Story = {
  name: "Controlled, with live validation",
  parameters: { docs: { source: { code: formFieldSnippets.controlledWithLiveValidation } } },
  argTypes: {
    label: { control: false },
    helperText: { control: false },
    error: { control: false },
  },
  render: function ControlledWithLiveValidationStory(args) {
    const [value, setValue] = useState("");
    const error = value.length > 0 && !value.includes("@") ? "Enter a valid email address" : undefined;
    return (
      <div style={demoContainerStyle}>
        <FormField {...args} label="Email address" helperText="We'll never share this" error={error}>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="email"
              placeholder="you@example.com"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
        </FormField>
      </div>
    );
  },
};

export const WiringInteraction: Story = {
  name: "Interaction: label, control, and helper text are correctly wired",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Email address" });
    // The accessible name above already proves aria-labelledby resolved
    // correctly — Testing Library's role query only matches by computed
    // accessible name, not raw DOM structure.
    const describedbyId = input.getAttribute("aria-describedby");
    await expect(describedbyId).toBeTruthy();
    const helperText = canvasElement.querySelector(`#${describedbyId}`);
    await expect(helperText).toHaveTextContent("We'll never share this with anyone else.");
  },
};

export const ClickLabelInteraction: Story = {
  name: "Interaction: clicking the label focuses the control",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Email address");
    const input = canvas.getByRole("textbox", { name: "Email address" });
    await userEvent.click(label);
    await expect(input).toHaveFocus();
  },
};
