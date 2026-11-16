import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../CodeBlock/browserProtocol";
import { FormField } from "../FormField";
import { PinInput } from "./PinInput";
import { pinInputPlaygroundSnippet, pinInputSnippets } from "./PinInput.snippets";

const meta: Meta<typeof PinInput> = {
  title: "Components/PinInput",
  id: "molecules-inputs-pininput",
  component: PinInput,
  parameters: { layout: "padded" },
  // Content-ish props first (length, type), then the look, then behaviour and state, then the escape hatches last
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    length: {
      control: { type: "number", min: 1, max: 12 },
      description: "The number of characters in the code, drawn as one cell each.",
      table: { defaultValue: { summary: "6" } },
    },
    type: {
      control: "select",
      options: ["numeric", "alphanumeric", "text"],
      description:
        "Which characters are accepted. Anything else typed or pasted is dropped. `numeric` asks a phone for its number pad.",
      table: { defaultValue: { summary: "numeric" } },
    },
    transform: {
      control: "select",
      options: ["uppercase", "lowercase"],
      description: "Writes everything typed, pasted or passed in in one case. The value you are given back is the converted one.",
    },
    value: {
      control: false,
      description: "The controlled value, a plain string. Pair with onValueChange.",
    },
    defaultValue: {
      control: "text",
      description: "The initial value when uncontrolled.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: {
      control: false,
      description: "Called with the whole code each time it changes.",
    },
    onComplete: {
      control: false,
      description: "Called with the whole code when a change fills every cell. Not called for a value passed in.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The box of each cell, on the shared size scale. A cell is as tall as an Input or Button of the same step.",
      table: { defaultValue: { summary: "md" } },
    },
    groups: {
      control: false,
      description: "Splits the cells into groups of these sizes (`[3, 3]` for 123 456). The sizes should add up to length.",
    },
    separator: {
      control: false,
      description: "What is drawn between groups.",
      table: { defaultValue: { summary: "–" } },
    },
    placeholder: {
      control: "text",
      description: "A hint drawn in each empty cell: one character repeated, or one per cell. Decorative: not read out.",
    },
    mask: {
      control: "boolean",
      description: "Hides each character behind a dot, for a PIN rather than a code that arrives by text message.",
      table: { defaultValue: { summary: "false" } },
    },
    revealable: {
      control: "boolean",
      description: "Adds a button that shows and hides a masked code. Ignored without mask.",
      table: { defaultValue: { summary: "false" } },
    },
    revealed: {
      control: false,
      description: "Whether a masked code is showing. Pair with onRevealedChange.",
    },
    defaultRevealed: {
      control: false,
      description: "Whether a masked code starts showing, when uncontrolled.",
      table: { defaultValue: { summary: "false" } },
    },
    onRevealedChange: {
      control: false,
      description: "Called when the show/hide button is pressed, with whether the code is now showing.",
    },
    isLoading: {
      control: "boolean",
      description:
        "Shows that the code is being checked: a spinner after the cells, edits set aside (the field keeps focus and its value) and the state announced.",
      table: { defaultValue: { summary: "false" } },
    },
    hasError: {
      control: "boolean",
      description:
        "Marks the code as invalid, visually and with aria-invalid. The cells shake once when it turns on after the field is on the page, unless reduced motion is asked for.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the field and the show/hide button.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Stops editing without disabling the field: the cells can still be focused and read.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Makes the code required for form validation. A code that is started but short also fails validation.",
      table: { defaultValue: { summary: "false" } },
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling it live has nothing to show.
    autoFocus: {
      control: false,
      description: "Focuses the field on mount. Use sparingly.",
      table: { defaultValue: { summary: "false" } },
    },
    autoComplete: {
      control: false,
      description: "The browser's autofill hint. The default lets a phone offer a code that has just arrived by text message.",
      table: { defaultValue: { summary: "one-time-code" } },
    },
    name: {
      control: "text",
      description: "The name the code is submitted under in a surrounding form, as one string.",
    },
    labels: {
      control: false,
      description: 'Text this component writes itself, for translation: `{ reveal }`, the show/hide button\'s name. Defaults to `{ reveal: "Show code" }`.',
      table: { defaultValue: { summary: undefined } },
    },
    "aria-label": {
      control: "text",
      description: "The accessible name of the field when there is no visible label.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of the element that names the field.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of the helper or error text that describes the field.",
    },
    id: {
      control: false,
      description: "The id of the native input, so a FieldLabel's htmlFor can point at it.",
    },
    className: {
      control: false,
      description: "Extra classes, on the outermost box.",
    },
    style: {
      control: false,
      description: "Inline styles, on the outermost box.",
    },
    "data-testid": {
      control: false,
      description: "A test identifier, on the native input.",
    },
  },
  // Every controllable prop has an explicit value here, matching its real default
  // (07-storybook-and-documentation-standards.md §5).
  args: {
    length: 6,
    type: "numeric",
    transform: undefined,
    size: "md",
    defaultValue: "",
    placeholder: "",
    mask: false,
    revealable: false,
    isLoading: false,
    hasError: false,
    disabled: false,
    readOnly: false,
    required: false,
    name: "",
    "aria-label": "Verification code",
    onComplete: fn(),
  },
  render: (args) => <PinInput {...args} />,
};

export default meta;

type Story = StoryObj<typeof PinInput>;

const builtSnippet = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => pinInputPlaygroundSnippet(context.args),
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: builtSnippet } },
  // "No conversion" is a Playground-only choice, not a value the prop takes.
  argTypes: { transform: { control: "select", options: ["none", "uppercase", "lowercase"], mapping: { none: undefined } } },
  args: { transform: "none" as never },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: pinInputSnippets.allSizes } } },
  // `size` is the whole point of this grid, so no single control value could represent it.
  argTypes: { size: { control: false } },
  args: { length: 4, defaultValue: "12" },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <PinInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Alphanumeric: Story = {
  name: "Letters and digits",
  parameters: { docs: { source: { code: pinInputSnippets.alphanumeric } } },
  argTypes: { type: { control: false }, length: { control: false } },
  args: { type: "alphanumeric", length: 8, defaultValue: "A7X9", "aria-label": "Invite code" },
};

export const Capitals: Story = {
  name: "In capitals",
  parameters: { docs: { source: { code: pinInputSnippets.capitals } } },
  argTypes: { type: { control: false }, transform: { control: false }, length: { control: false } },
  args: { type: "alphanumeric", transform: "uppercase", length: 6, defaultValue: "ab12", "aria-label": "Invite code" },
};

export const Grouped: Story = {
  name: "In groups",
  parameters: { docs: { source: { code: pinInputSnippets.grouped } } },
  argTypes: { length: { control: false } },
  args: { defaultValue: "482", length: 6 },
  render: (args) => <PinInput {...args} groups={[3, 3]} />,
};

export const Masked: Story = {
  name: "Masked, with a show button",
  parameters: { docs: { source: { code: pinInputSnippets.masked } } },
  argTypes: { mask: { control: false }, revealable: { control: false }, length: { control: false } },
  args: { mask: true, revealable: true, length: 4, defaultValue: "1234", "aria-label": "PIN" },
};

export const WithPlaceholder: Story = {
  name: "With a placeholder",
  parameters: { docs: { source: { code: pinInputSnippets.placeholder } } },
  argTypes: { placeholder: { control: false } },
  args: { placeholder: "○", defaultValue: "48" },
};

export const Verifying: Story = {
  name: "Verifying a code",
  parameters: { docs: { source: { code: pinInputSnippets.verifying } } },
  argTypes: { isLoading: { control: false }, hasError: { control: false }, onComplete: { control: false } },
  render: function VerifyingStory(args) {
    const [checking, setChecking] = useState(false);
    const [wrong, setWrong] = useState(false);
    return (
      <PinInput
        {...args}
        isLoading={checking}
        hasError={wrong}
        onValueChange={() => setWrong(false)}
        onComplete={(code) => {
          setChecking(true);
          // Stands in for a request: 123456 is the right code.
          setTimeout(() => {
            setChecking(false);
            setWrong(code !== "123456");
          }, 1200);
        }}
      />
    );
  },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: { docs: { source: builtSnippet } },
  args: { hasError: true, defaultValue: "123456" },
};

export const Disabled: Story = {
  parameters: { docs: { source: builtSnippet } },
  args: { disabled: true, defaultValue: "123" },
};

export const ReadOnly: Story = {
  name: "Read-only",
  parameters: { docs: { source: builtSnippet } },
  args: { readOnly: true, defaultValue: "123456" },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: pinInputSnippets.inFormField } } },
  argTypes: Object.fromEntries(
    ["length", "type", "size", "defaultValue", "placeholder", "mask", "revealable", "hasError", "disabled", "readOnly", "required", "name", "aria-label"].map((key) => [key, { control: false }]),
  ),
  render: () => (
    <FormField label="Verification code" helperText="We sent a 6-digit code to your phone.">
      {(fieldProps) => <PinInput {...fieldProps} />}
    </FormField>
  ),
};

export const OnComplete: Story = {
  name: "Submit when complete",
  parameters: { docs: { source: { code: pinInputSnippets.complete } } },
  argTypes: { onComplete: { control: false } },
  render: function OnCompleteStory(args) {
    const [message, setMessage] = useState("Type the code 123456.");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }}>
        <PinInput
          {...args}
          onComplete={(code) => setMessage(code === "123456" ? "Verified." : `${code} is not the code.`)}
          onValueChange={() => setMessage("Type the code 123456.")}
          hasError={message.endsWith("is not the code.")}
        />
        <span role="status">{message}</span>
      </div>
    );
  },
};

export const Controlled: Story = {
  name: "Controlled",
  parameters: { docs: { source: { code: pinInputSnippets.controlled } } },
  argTypes: { defaultValue: { control: false } },
  args: { defaultValue: undefined },
  render: function ControlledStory(args) {
    const [code, setCode] = useState("12");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }}>
        <PinInput {...args} value={code} onValueChange={setCode} />
        <Button variant="tertiary" size="xs" onClick={() => setCode("")}>
          Clear
        </Button>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// Hidden stories: interaction and real-browser checks. They run as tests and appear in neither the sidebar nor the
// Docs page.
// ---------------------------------------------------------------------------------------------------------------------

export const TypeAndCompleteInteraction: Story = {
  name: "Typing fills the cells and completes — interaction test",
  tags: ["!dev"],
  args: { length: 4, onValueChange: fn(), onComplete: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Verification code");
    await userEvent.type(input, "1a2b34");
    await expect(input).toHaveValue("1234");
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).toHaveBeenCalledWith("1234");
    // A full code has no empty cell: the next character replaces the last one.
    await userEvent.keyboard("9");
    await expect(input).toHaveValue("1239");
    await expect(args.onComplete).toHaveBeenLastCalledWith("1239");
  },
};

export const RejectedKeyInteraction: Story = {
  name: "A rejected key changes nothing — interaction test",
  tags: ["!dev"],
  args: { length: 4, type: "numeric" },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Verification code") as HTMLInputElement;
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-cell]"));
    await userEvent.click(input);
    await waitFor(() => expect(cells[0]).toHaveAttribute("data-active", "true"));
    await userEvent.keyboard("a");
    // Still on the first, still empty, and the next cell hasn't lit up.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(input).toHaveValue("");
    await expect(cells[0]).toHaveAttribute("data-active", "true");
    await expect(cells[1]).toHaveAttribute("data-active", "false");
    await userEvent.keyboard("7");
    await expect(input).toHaveValue("7");
    await expect(cells[1]).toHaveAttribute("data-active", "true");
  },
};

export const PasteInteraction: Story = {
  name: "Pasting a code — interaction test",
  tags: ["!dev"],
  args: { onComplete: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Verification code");
    await userEvent.click(input);
    await userEvent.paste("482-916");
    await expect(input).toHaveValue("482916");
    await expect(args.onComplete).toHaveBeenCalledWith("482916");
  },
};

export const TabInSelectsFirstEmptyCellInteraction: Story = {
  name: "Tabbing in lands on the first empty cell — interaction test",
  tags: ["!dev"],
  args: { defaultValue: "12", length: 4 },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Verification code") as HTMLInputElement;
    await userEvent.tab();
    await expect(input).toHaveFocus();
    // The browser selects all of an input's text on a Tab; the field puts the selection on the first empty cell.
    await waitFor(() => expect(input.selectionStart).toBe(2));
    await expect(input.selectionEnd).toBe(2);
    await expect(canvasElement.querySelectorAll("[data-cell]")[2]).toHaveAttribute("data-active", "true");
  },
};

export const InsertTextInteraction: Story = {
  name: "Text inserted all at once (an SMS autofill) — interaction test",
  tags: ["!dev"],
  args: { onComplete: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Verification code") as HTMLInputElement;
    input.focus();
    // One `input` event with the whole string and no key events, as a phone's keyboard or an autofill sends it.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "123456");
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "123456", inputType: "insertText" }));
    await waitFor(() => expect(input).toHaveValue("123456"));
    await expect(args.onComplete).toHaveBeenCalledWith("123456");
  },
};

export const ClickCellInteraction: Story = {
  name: "Clicking a cell moves to it — interaction test",
  tags: ["!dev"],
  args: { defaultValue: "1234", length: 6 },
  play: async ({ canvasElement }) => {
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-cell]"));
    const input = within(canvasElement).getByLabelText("Verification code") as HTMLInputElement;
    const box = (cells[1] as HTMLElement).getBoundingClientRect();
    await userEvent.pointer({ keys: "[MouseLeft]", target: input, coords: { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 } });
    await waitFor(() => expect(cells[1]).toHaveAttribute("data-active", "true"));
    // The character in that cell is the one selected, so typing overwrites it.
    await userEvent.keyboard("9");
    await expect(input).toHaveValue("1934");
  },
};

export const SizeMatchesButtonCheck: Story = {
  name: "A cell is as tall as a Button of the same size — interaction test",
  tags: ["!dev"],
  args: { length: 2 },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "center" }}>
          <PinInput {...args} size={size} aria-label={`PIN ${size}`} />
          <Button size={size} data-size={size}>
            Button
          </Button>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const cell = within(canvasElement).getByLabelText(`PIN ${size}`).closest("div")?.parentElement?.querySelector("[data-cell]") as HTMLElement;
      const button = canvasElement.querySelector(`[data-size='${size}']`) as HTMLElement;
      const cellBox = cell.getBoundingClientRect();
      await expect(Math.abs(cellBox.height - button.getBoundingClientRect().height)).toBeLessThan(1);
      await expect(Math.abs(cellBox.width - cellBox.height)).toBeLessThan(1);
    }
  },
};

export const NarrowContainerCheck: Story = {
  name: "Shrinks to a narrow container without overflowing — interaction test",
  tags: ["!dev"],
  args: { length: 8, size: "xl", mask: true, revealable: true, groups: [4, 4] },
  render: (args) => (
    <div data-box="" style={{ inlineSize: "17rem", border: "1px solid transparent" }}>
      <PinInput {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-box]") as HTMLElement;
    const boxRect = box.getBoundingClientRect();
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    for (const cell of canvasElement.querySelectorAll<HTMLElement>("[data-cell]")) {
      const rect = cell.getBoundingClientRect();
      await expect(rect.right).toBeLessThanOrEqual(boxRect.right + 0.5);
      await expect(Math.abs(rect.width - rect.height)).toBeLessThan(1);
      // Still a target of at least 24 CSS pixels (WCAG 2.5.8).
      await expect(rect.width).toBeGreaterThanOrEqual(24);
    }
  },
};

export const ForcedColorsCheck: Story = {
  name: "The active cell and caret survive forced colours — interaction test",
  tags: ["!dev"],
  args: { length: 3 },
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const input = within(canvasElement).getByLabelText("Verification code");
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await userEvent.click(input);
      const active = canvasElement.querySelector("[data-active='true']") as HTMLElement;
      await expect(active).not.toBeNull();
      // A focus outline is kept, and the caret is drawn in a system colour rather than a background that vanishes.
      await expect(getComputedStyle(active).outlineStyle).toBe("solid");
      await expect(parseFloat(getComputedStyle(active).outlineWidth)).toBeGreaterThan(0);
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.appendChild(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      const caret = active.querySelector("[class*='caret']") as HTMLElement;
      await expect(getComputedStyle(caret).backgroundColor).toBe(canvasText);
    } finally {
      await emulate("none");
    }
  },
};

export const ShakeCheck: Story = {
  name: "The cells shake once when an error appears, and then stop — interaction test",
  tags: ["!dev"],
  args: { length: 3 },
  render: function ShakeStory(args) {
    const [wrong, setWrong] = useState(false);
    return (
      <>
        <PinInput {...args} hasError={wrong} />
        <Button onClick={() => setWrong(true)}>Reject</Button>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelector("[data-cell]")!.parentElement!.parentElement as HTMLElement;
    await expect(cells.getAnimations().length).toBe(0);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(cells.getAnimations().some((animation) => (animation as CSSAnimation).animationName.includes("shake"))).toBe(true));
    // It moves sideways while it runs, and doesn't move anything else.
    // It ends by itself and the class is gone.
    await waitFor(() => expect(cells.getAnimations().length).toBe(0), { timeout: 2000 });
    await expect(cells.className).not.toContain("shake");
  },
};

export const LoadingDoesNotMoveCellsCheck: Story = {
  name: "Starting to load doesn't move the cells — interaction test",
  tags: ["!dev"],
  args: { length: 4, defaultValue: "1234" },
  render: function LoadingStory(args) {
    const [loading, setLoading] = useState(false);
    return (
      <div style={{ inlineSize: "30rem" }}>
        <PinInput {...args} isLoading={loading} />
        <Button onClick={() => setLoading(true)}>Verify</Button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector("[data-cell]") as HTMLElement;
    const before = first.getBoundingClientRect();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(within(canvasElement).getByRole("status")).toHaveTextContent("Verifying code"));
    const after = first.getBoundingClientRect();
    await expect(after.left).toBe(before.left);
    await expect(after.width).toBe(before.width);
    const input = within(canvasElement).getByLabelText("Verification code") as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard("9");
    await expect(input).toHaveValue("1234");
  },
};

export const LeftToRightCheck: Story = {
  name: "Stays left to right in a right-to-left page — interaction test",
  tags: ["!dev"],
  args: { length: 3, defaultValue: "123" },
  render: (args) => (
    <div dir="rtl">
      <PinInput {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-cell]"));
    await expect(cells.map((cell) => cell.textContent)).toEqual(["1", "2", "3"]);
    await expect(cells[0]!.getBoundingClientRect().left).toBeLessThan(cells[2]!.getBoundingClientRect().left);
  },
};
