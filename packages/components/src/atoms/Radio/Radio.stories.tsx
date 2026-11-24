import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { RadioGroup } from "../../molecules/RadioGroup";
import { Radio } from "./Radio";
import { radioPlaygroundSnippet, radioSnippets } from "./Radio.snippets";

const meta: Meta<typeof Radio> = {
  title: "Components/Radio",
  id: "atoms-inputs-radio",
  component: Radio,
  parameters: { layout: "padded" },
  // Keys below are ordered to match the component's own `RadioProps`
  // declaration order (content prop → core visual props → behavioral/state
  // props → advanced/escape-hatch props last) — see Checkbox.stories.tsx
  // for the full reasoning behind matching this order.
  argTypes: {
    children: { description: "Inline label rendered next to the radio." },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    hasError: {
      description: "Marks the radio as invalid, visually and via aria-invalid.",
    },
    // Deliberately excluded from the live controls — same reasoning as
    // Checkbox's own `checked`: driving it from Controls without a real
    // `onCheckedChange` wired back would freeze the radio.
    checked: { control: false, description: "The controlled checked state." },
    defaultChecked: {
      control: "boolean",
      description:
        "The initial checked state when uncontrolled — sets where the radio starts, not a live toggle. Click the radio itself in the canvas to check it (it won't uncheck on a second click — see the component's own JSDoc).",
    },
    onCheckedChange: {
      description: "Called with `true` whenever the standalone radio becomes checked.",
    },
    disabled: { description: "Disables the radio natively." },
    required: {
      description:
        "Marks a standalone radio as required for HTML5 form validation, and sets aria-required.",
    },
    autoFocus: {
      control: false,
      description: "Focuses the radio automatically on mount. Use sparingly.",
    },
    name: {
      control: "text",
      description:
        "Form field name — only meaningful standalone, inside a <form>, where Radix renders a hidden native input for real form submission.",
    },
    value: {
      control: "text",
      description:
        'This radio\'s own value. Required, in practice, inside a RadioGroup. Standalone, defaults to "on" and only matters for real <form> submission.',
    },
    form: {
      control: false,
      description:
        "Associates a standalone radio with a <form> by id, for use outside that form's own DOM subtree.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible label announced by assistive tech when there's no visible `children` label.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    id: {
      control: false,
      description: "Standard DOM id. Generated internally via `useId` when omitted.",
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
    children: "Email",
    size: "md",
    hasError: false,
    disabled: false,
    defaultChecked: false,
    required: false,
    name: "",
    value: "",
    "aria-label": "",
    onCheckedChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Radio>;

/** Drive every prop live via the Controls panel below. Standalone — see "Inside a RadioGroup" below for the grouped case. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => radioPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: radioSnippets.allSizes } } },
  // `size`/`children` are the whole point of this grid — each instance
  // intentionally varies both together, so no single control value could
  // represent them. `defaultChecked: true` so the checked state is visible
  // at every size out of the box — still live via `{...args}`, along with
  // every other prop.
  args: { defaultChecked: true },
  argTypes: { size: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Radio key={size} {...args} size={size}>
          Size {size}
        </Radio>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: radioSnippets.states } } },
  // Each row demonstrates a specific, fixed state combination — same
  // reasoning as Checkbox's own States story.
  argTypes: {
    defaultChecked: { control: false },
    checked: { control: false },
    disabled: { control: false },
    hasError: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Radio {...args} defaultChecked={false} checked={undefined} disabled={false} hasError={false}>
        Unchecked
      </Radio>
      <Radio {...args} defaultChecked checked={undefined} disabled={false} hasError={false}>
        Checked
      </Radio>
      <Radio {...args} disabled defaultChecked={false} checked={undefined} hasError={false}>
        Disabled
      </Radio>
      <Radio {...args} disabled defaultChecked checked={undefined} hasError={false}>
        Disabled + checked
      </Radio>
      <Radio {...args} hasError defaultChecked={false} checked={undefined} disabled={false}>
        Error state
      </Radio>
    </div>
  ),
};

export const WithoutLabel: Story = {
  name: "Without a label (aria-label required)",
  parameters: { docs: { source: { code: radioSnippets.withoutLabel } } },
  argTypes: { children: { control: false } },
  args: { "aria-label": "Select row" },
  render: ({ children: _children, ...args }) => <Radio {...args} />,
};

export const InsideARadioGroup: Story = {
  name: "Inside a RadioGroup",
  parameters: { docs: { source: { code: radioSnippets.insideARadioGroup } } },
  // The real `RadioGroup` molecule, which owns the selection and the keyboard
  // navigation between its radios. The Playground's own args (size, hasError,
  // disabled) still reach each `Radio`; the group-level ones live on `RadioGroup`.
  argTypes: {
    checked: { control: false },
    defaultChecked: { control: false },
    onCheckedChange: { control: false },
    name: { control: false },
    required: { control: false },
    form: { control: false },
    value: { control: false },
    children: { control: false },
  },
  render: function InsideARadioGroupStory(args) {
    const [value, setValue] = useState("email");
    return (
      <RadioGroup aria-label="Contact method" value={value} onValueChange={setValue}>
        <Radio {...args} value="email">
          Email
        </Radio>
        <Radio {...args} value="sms">
          SMS
        </Radio>
        <Radio {...args} value="phone">
          Phone call
        </Radio>
      </RadioGroup>
    );
  },
};
export const ClickInteraction: Story = {
  name: "Interaction: checks on click, stays checked on a second click",
  args: { children: "Email" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio", { name: "Email" });
    await expect(radio).toHaveAttribute("aria-checked", "false");
    await userEvent.click(radio);
    await expect(radio).toHaveAttribute("aria-checked", "true");
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
    // A radio can't be unchecked by clicking itself again — real
    // radio-button semantics, unlike Checkbox.
    await userEvent.click(radio);
    await expect(radio).toHaveAttribute("aria-checked", "true");
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks click",
  args: { children: "Email", disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio", { name: "Email" });
    await expect(radio).toBeDisabled();
    await userEvent.click(radio);
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const SpaceKeyInteraction: Story = {
  name: "Interaction: focusable and toggles via Space",
  args: { children: "Email" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio", { name: "Email" });

    // Purely for human legibility when watching this replay in the
    // Interactions panel — the assertions themselves need none of these
    // pauses. Without them, focus and the Space-triggered check happened
    // back to back with no visible gap, reading as a single flash rather
    // than two distinct, observable steps (same pattern as Collapse's own
    // interaction stories).
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await userEvent.tab();
    await expect(radio).toHaveFocus();
    await pause(600);

    await userEvent.keyboard(" ");
    await expect(radio).toHaveAttribute("aria-checked", "true");
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
    await pause(800);
  },
};

// A circle drawn smaller than the 24 × 24px minimum target (12, 16 and 20px at xs, sm and md) has an invisible hit area of that size, so
// a press near it still lands on it. `getBoundingClientRect` can't see a pseudo-element, so points 11px either side of the centre are
// pressed with `elementFromPoint`; and the hit area must not take a press meant for the next circle in a stack.
export const HitAreaInteraction: Story = {
  name: "Hit area — interaction test",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Radio key={size} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio");
    for (const radio of radios) {
      const rect = radio.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      for (const [dx, dy] of [[-11, 0], [11, 0]] as const) {
        await expect(document.elementFromPoint(x + dx, y + dy)).toBe(radio);
      }
      // each circle answers at its own centre in a stack: one hit area doesn't cover the next circle
      await expect(document.elementFromPoint(x, y)).toBe(radio);
    }
    // and the circle is measured as it was: a larger hit area changed nothing visible
    await expect(Math.round((radios[0] as HTMLElement).getBoundingClientRect().width)).toBe(12);
  },
};
