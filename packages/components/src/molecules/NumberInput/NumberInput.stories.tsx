import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { NumberInput } from "./NumberInput";
import { numberInputPlaygroundSnippet, numberInputSnippets } from "./NumberInput.snippets";

const meta: Meta<typeof NumberInput> = {
  title: "Components/NumberInput",
  id: "molecules-inputs-numberinput",
  component: NumberInput,
  parameters: { layout: "padded" },
  // Ordered content-ish prop first (placeholder), then the slot prop, then
  // core visual/behavioral props, then advanced/escape-hatch props last —
  // same sequencing principle as Input's/PasswordInput's own stories file
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    placeholder: {
      control: "text",
      description: "Native placeholder text shown when the input is empty.",
    },
    prefix: {
      control: false,
      description: "Leading slot content — an icon, unit label, etc.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size and padding, matching the shared size scale.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the input as invalid, visually and via aria-invalid.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — driving `value` from Controls without a real
    // `onValueChange` wired back would freeze the input, same reasoning
    // as Input's own `value`. The Playground demonstrates the
    // uncontrolled path via `defaultValue` instead.
    value: {
      control: false,
      description: "The controlled value, as a real number.",
    },
    defaultValue: {
      control: "number",
      description: "The initial value when uncontrolled.",
    },
    onValueChange: {
      control: false,
      description:
        "Called with the new value (a real number, or undefined if empty) whenever it changes — typing, the stepper, or the clear button.",
    },
    onChange: {
      control: false,
      description: "The raw native change event, fired only on direct typing. Prefer onValueChange.",
    },
    min: {
      control: "number",
      description: "Minimum allowed value — also bounds the decrement stepper button.",
    },
    max: {
      control: "number",
      description: "Maximum allowed value — also bounds the increment stepper button.",
    },
    step: {
      control: "number",
      description: "The amount each stepper click (or native arrow key) changes the value by.",
    },
    onClear: {
      control: false,
      description:
        "Shows a clear (×) button after the stepper whenever the input has a value, calling this when it's clicked. The value itself already resets via onValueChange — this is a supplementary notification, not required for the clear to work. See the \"With a clear button\" story for a live demo.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input and its stepper buttons natively.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description:
        "Marks the input as required for HTML5 form validation. Pair with a FieldLabel whose own required shows the matching visual asterisk.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Prevents editing without disabling the input — the stepper buttons are disabled too while read-only.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the input automatically on mount. Use sparingly.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — has no visible effect inside an isolated
    // Storybook iframe.
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill.",
    },
    // `control: false` — only affects which virtual keyboard a mobile
    // device shows, invisible in a desktop browser Storybook preview.
    inputMode: {
      control: false,
      description: "Hints which virtual keyboard a mobile device should show.",
    },
    name: {
      control: "text",
      description: "Form field name, submitted in the surrounding <form>'s data.",
    },
    // `control: false` — only meaningful paired with a real <form> whose
    // id it points to, which the Playground's own plain demo doesn't have.
    form: {
      control: false,
      description: "Associates the input with a <form> by id.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible label announced by assistive tech when there's no visible label (e.g. no paired FieldLabel).",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    "aria-describedby": {
      control: false,
      description:
        "Points to the id of a helper or error message associated with this input (e.g. a paired FieldHelperText or FieldError).",
    },
    id: {
      control: false,
      description: "Standard DOM id, applied to the native <input> element.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Applies to the wrapper (the visual input box).",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles. Applies to the wrapper, matching className's own target.",
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
    placeholder: "0",
    size: "md",
    defaultValue: 5,
    hasError: false,
    min: 0,
    max: 10,
    step: 1,
    disabled: false,
    required: false,
    readOnly: false,
    name: "",
    "aria-label": "",
    onValueChange: fn(),
  },
  render: (args) => (
    <div style={{ maxWidth: "12rem" }}>
      <NumberInput {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof NumberInput>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => numberInputPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: numberInputSnippets.allSizes } } },
  // `size` is the whole point of this grid — each instance intentionally
  // varies it, so no single control value could represent them.
  // `hasError`/`disabled` still stay live and shared via `{...args}`.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "12rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <NumberInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const NoBounds: Story = {
  name: "No min/max (unbounded)",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => numberInputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { min: undefined, max: undefined },
  argTypes: { min: { control: false }, max: { control: false } },
};

export const DecimalStep: Story = {
  name: "Decimal step",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => numberInputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { defaultValue: 1, min: 0, max: 5, step: 0.5 },
  argTypes: { step: { control: false } },
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: numberInputSnippets.clearable } } },
  // `value`/`onValueChange`/`onClear` are all driven by this story's own
  // local state (the whole point of the demo) — but `size`/`hasError`/
  // `disabled` are still meaningful to preview here and stay live via
  // `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, same
  // controlled/uncontrolled-conflict fix as Input's/PasswordInput's own
  // Clearable stories — this story sets its own controlled `value` below.
  args: { defaultValue: undefined },
  argTypes: {
    defaultValue: { control: false },
    onValueChange: { control: false },
  },
  render: function ClearableStory(args) {
    const [value, setValue] = useState<number | undefined>(5);
    return (
      <div style={{ maxWidth: "12rem" }}>
        {/* `onClear` itself doesn't need to reset `value` — clicking Clear
            already resets the field via `onValueChange` (the same path
            typing and the stepper both use), so passing `onClear` here is
            only what makes the clear button render at all (its own
            visibility is gated by `Boolean(onClear)`); a real consumer
            would use it for something beyond value-tracking, e.g. an
            analytics call. */}
        <NumberInput {...args} value={value} onValueChange={setValue} onClear={() => {}} />
      </div>
    );
  },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => numberInputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { hasError: true, defaultValue: 15 },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => numberInputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true, defaultValue: 5 },
};

export const StepperInteraction: Story = {
  name: "Interaction: stepper increments, decrements, and clamps at the bounds",
  args: { defaultValue: 9, min: 0, max: 10 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    const increment = canvas.getByRole("button", { name: "Increase value" });
    const decrement = canvas.getByRole("button", { name: "Decrease value" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — the assertions themselves need none of these
    // pauses (same pattern as Radio's/RadioGroup's/PasswordInput's own
    // interaction stories).
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await expect(input).toHaveValue(9);
    await pause(500);

    await userEvent.click(increment);
    await expect(input).toHaveValue(10);
    await expect(args.onValueChange).toHaveBeenCalledWith(10);
    await pause(500);

    // Already at max — clicking again clamps, doesn't overshoot to 11.
    await expect(increment).toBeDisabled();
    await pause(500);

    await userEvent.click(decrement);
    await userEvent.click(decrement);
    await expect(input).toHaveValue(8);
    await pause(500);
  },
};

export const ClearButtonInteraction: Story = {
  name: "Interaction: clear button calls onClear and refocuses the input",
  args: { defaultValue: 5, onClear: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    const clearButton = canvas.getByRole("button", { name: "Clear" });

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await pause(500);

    await userEvent.click(clearButton);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue(null);
    await pause(600);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks the input and both stepper buttons",
  args: { disabled: true, defaultValue: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await expect(canvas.getByRole("spinbutton")).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Increase value" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Decrease value" })).toBeDisabled();
    await pause(800);
  },
};
