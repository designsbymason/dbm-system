import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { PasswordInput } from "./PasswordInput";
import { passwordInputPlaygroundSnippet, passwordInputSnippets } from "./PasswordInput.snippets";

const meta: Meta<typeof PasswordInput> = {
  title: "Components/PasswordInput",
  id: "molecules-inputs-passwordinput",
  component: PasswordInput,
  parameters: { layout: "padded" },
  // Ordered content-ish prop first (placeholder), then the slot prop, then
  // core visual/behavioral props, then advanced/escape-hatch props last —
  // same sequencing principle as Input's own stories file
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    placeholder: {
      control: "text",
      description: "Native placeholder text shown when the input is empty.",
    },
    prefix: {
      control: false,
      description: "Leading slot content — an icon, currency symbol, etc.",
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
    // `onChange` wired back into `args` would freeze the input, same
    // reasoning as Input's own `value`. The Playground demonstrates the
    // uncontrolled path via `defaultValue` instead.
    value: {
      control: false,
      description: "The controlled value.",
    },
    defaultValue: {
      control: "text",
      description: "The initial value when uncontrolled.",
    },
    onClear: {
      control: false,
      description:
        "Shows a clear (×) button after the show/hide toggle whenever the input has a value, calling this when it's clicked. See the \"With a clear button\" story for a live demo.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input (and its show/hide toggle) natively.",
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
      description:
        "Prevents editing without disabling the input — the show/hide toggle still works while read-only.",
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
    // Storybook iframe (real browser autofill/password-manager UI doesn't
    // trigger the same way here).
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill (e.g. 'current-password', 'new-password').",
    },
    maxLength: {
      control: "number",
      description: "Maximum number of characters the input accepts.",
    },
    showCount: {
      control: "boolean",
      description:
        "Shows a live current/max character count inline, before the show/hide toggle. Only renders when maxLength is also set.",
      table: { defaultValue: { summary: "false" } },
    },
    formatNumber: {
      control: false,
      description:
        "How the numbers in the showCount counter are written — both the current length and maxLength — for a language or region whose numerals or digit grouping differ from the plain 5 and 1234: given a number, returns the text to show. For example new Intl.NumberFormat(\"ar-EG\").format shows ٥/١٠. Only used while the counter is shown (showCount with maxLength); the native maxLength limit and the value itself are unaffected. Passed straight through to Input.",
      table: { defaultValue: { summary: "(count) => String(count)" } },
    },
    minLength: {
      control: false,
      description: "Minimum number of characters required for HTML5 form validation.",
    },
    pattern: {
      control: false,
      description: "A regular expression the value must match for HTML5 form validation.",
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
    placeholder: "Enter your password",
    size: "md",
    defaultValue: "",
    hasError: false,
    disabled: false,
    required: false,
    readOnly: false,
    maxLength: 200,
    showCount: false,
    name: "",
    "aria-label": "",
  },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <PasswordInput {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof PasswordInput>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => passwordInputPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: passwordInputSnippets.allSizes } } },
  // `size`/`placeholder` are the whole point of this grid — each instance
  // intentionally varies size, so no single control value could represent
  // them. `hasError`/`disabled` still stay live and shared via `{...args}`.
  argTypes: { size: { control: false }, placeholder: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "20rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <PasswordInput key={size} {...args} size={size} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: passwordInputSnippets.clearable } } },
  // `value`/`onChange`/`onClear` are all driven by this story's own local
  // state (the whole point of the demo), plus `placeholder` fixed per
  // instance — but `size`/`hasError`/`disabled` are still meaningful to
  // preview here and stay live via `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, same
  // controlled/uncontrolled-conflict fix as Input's own Clearable story —
  // this story sets its own controlled `value` below, and without this
  // override `{...args}` would still spread the Playground's own
  // `defaultValue: ""` onto the same underlying `<input>`.
  args: { defaultValue: undefined },
  argTypes: {
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: function ClearableStory(args) {
    const [value, setValue] = useState("hunter2");
    return (
      <div style={{ maxWidth: "20rem" }}>
        <PasswordInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
        />
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
        transform: (_code: string, context: StoryContext) => passwordInputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { hasError: true, defaultValue: "wrong-password" },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => passwordInputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true, defaultValue: "hunter2" },
};

export const ToggleVisibilityInteraction: Story = {
  name: "Interaction: toggling reveals and re-masks the value",
  args: { defaultValue: "hunter2" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue("hunter2");

    // Purely for human legibility when watching this replay in the
    // Interactions panel — the assertions themselves need none of these
    // pauses. Without them, both toggles happened back to back with no
    // visible gap, reading as a single flash rather than three distinct,
    // observable steps (same pattern as Radio's/RadioGroup's own
    // interaction stories).
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await expect(input).toHaveAttribute("type", "password");
    await pause(500);

    const showButton = canvas.getByRole("button", { name: "Show password" });
    await userEvent.click(showButton);
    await expect(input).toHaveAttribute("type", "text");
    await expect(canvas.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
    await pause(800);

    await userEvent.click(canvas.getByRole("button", { name: "Hide password" }));
    await expect(input).toHaveAttribute("type", "password");
    await pause(500);
  },
};

export const ClearButtonInteraction: Story = {
  name: "Interaction: clear button calls onClear and refocuses the input",
  args: { defaultValue: "hunter2", onClear: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue("hunter2");
    const clearButton = canvas.getByRole("button", { name: "Clear" });

    // Purely for human legibility — see ToggleVisibilityInteraction's own
    // comment for the full reasoning.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await pause(500);

    await userEvent.click(clearButton);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(input).toHaveFocus();
    await pause(600);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks both the input and the toggle",
  args: { disabled: true, defaultValue: "hunter2" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Purely for human legibility — see ToggleVisibilityInteraction's own
    // comment for the full reasoning.
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await expect(canvas.getByDisplayValue("hunter2")).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Show password" })).toBeDisabled();
    await pause(800);
  },
};
