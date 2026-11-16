import { HeartIcon, StarIcon, XIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Checkbox } from "./Checkbox";
import { checkboxPlaygroundSnippet, checkboxSnippets } from "./Checkbox.snippets";
import type { CheckboxProps } from "./Checkbox.types";

// The Controls panel can't natively drive an arbitrary component reference,
// so this maps a small curated set of real icons onto string keys via
// `argTypes.mapping` (same pattern as Button's `leadingIcon`/`trailingIcon`).
// "Default" maps to `undefined`, letting the component fall back to its own
// built-in glyph.
const checkIconMapping = {
  Default: undefined,
  Star: StarIcon,
  Heart: HeartIcon,
};
const indeterminateIconMapping = {
  Default: undefined,
  X: XIcon,
};
const checkIconControl = {
  control: "select" as const,
  options: Object.keys(checkIconMapping),
  mapping: checkIconMapping,
};
const indeterminateIconControl = {
  control: "select" as const,
  options: Object.keys(indeterminateIconMapping),
  mapping: indeterminateIconMapping,
};

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  id: "atoms-inputs-checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
  // Keys below are ordered to match the component's own `CheckboxProps`
  // declaration order (content prop → core visual props → behavioral/state
  // props → advanced/escape-hatch props last) — this is what actually
  // drives the rendered order of Storybook's raw per-story Controls panel
  // (confirmed 2026-08-24: that panel's row order comes from docgen's
  // extraction of the component's own Props type, not from this object's
  // key order in isolation — but keeping this object in the same order
  // keeps source and rendered output easy to reason about together, and
  // matters for any prop only declared here, not in the type file).
  argTypes: {
    children: { description: "Inline label rendered next to the checkbox." },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    hasError: {
      description:
        "Marks the checkbox as invalid, visually and via `aria-invalid`.",
    },
    // Deliberately excluded from the live controls: driving `checked` from
    // Controls without a real `onCheckedChange` wired back into `args`
    // would freeze the checkbox, since Radix always defers to a controlled
    // value over its own internal click handling. This Playground
    // demonstrates the uncontrolled path via `defaultChecked` instead.
    checked: { control: false, description: "The controlled checked state." },
    defaultChecked: {
      control: "radio",
      options: [false, true, "indeterminate"],
      description:
        "The initial checked state when uncontrolled — sets where the checkbox starts, not a live toggle. Click the checkbox itself in the canvas to change it, same as a real uncontrolled `<input defaultChecked>`.",
    },
    onCheckedChange: {
      description: "Called with the new checked state whenever it changes.",
    },
    icon: {
      ...checkIconControl,
      description:
        "Overrides the checked glyph (select 'Default' for the system's own check icon). Override sparingly — see the component's own JSDoc for the cross-product consistency caveat.",
    },
    indeterminateIcon: {
      ...indeterminateIconControl,
      description:
        "Overrides the indeterminate glyph (select 'Default' for the system's own dash icon). Same consistency caveat as `icon`.",
    },
    disabled: { description: "Disables the checkbox natively." },
    required: {
      description:
        "Marks the checkbox as required for HTML5 form validation, and sets aria-required.",
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the checkbox automatically on mount. Use sparingly.",
    },
    name: {
      control: "text",
      description:
        "Form field name — only meaningful inside a <form>, where Radix renders a hidden native input for real form submission.",
    },
    value: {
      control: "text",
      description:
        'Form field value submitted when checked, via that same hidden input. Defaults to "on".',
    },
    form: {
      control: false,
      description:
        "Associates the checkbox with a <form> by id, for use outside that form's own DOM subtree.",
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
      description:
        "Standard DOM id. Generated internally via `useId` when omitted.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // boolean"/"Set string" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    children: "Accept terms and conditions",
    size: "md",
    hasError: false,
    disabled: false,
    defaultChecked: false,
    required: false,
    name: "",
    value: "",
    "aria-label": "",
    onCheckedChange: fn(),
    // Cast, same as Button's `leadingIcon`/`trailingIcon` default args — this
    // is the Controls-panel select's option key, not `CheckboxProps["icon"]`
    // itself, hence the cast.
    icon: "Default" as unknown as CheckboxProps["icon"],
    indeterminateIcon: "Default" as unknown as CheckboxProps["indeterminateIcon"],
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => checkboxPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: checkboxSnippets.allSizes } } },
  // `size`/`children` are the whole point of this grid — each instance
  // intentionally varies both together (the size name doubles as its own
  // label), so no single control value could represent them. Defaulted to
  // `defaultChecked: true` here specifically so the filled state is
  // visible at every size out of the box — still a live, shared value via
  // `{...args}`, along with every other prop (`hasError`, `disabled`, ...).
  // Previously this story used a bare `render: () => (...)` that ignored
  // args entirely, making every control here a silent no-op.
  args: { defaultChecked: true },
  argTypes: { size: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Checkbox key={size} {...args} size={size}>
          Size {size}
        </Checkbox>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: checkboxSnippets.states } } },
  // Each row demonstrates a specific, fixed state combination — together,
  // `defaultChecked`/`checked`/`disabled`/`hasError`/`children` are what
  // define that row, so all five are pinned per instance rather than
  // controllable (same reasoning as Button's `WithIcons` story). `size`
  // (and any other prop) stays live and shared via `{...args}`.
  argTypes: {
    defaultChecked: { control: false },
    checked: { control: false },
    disabled: { control: false },
    hasError: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Checkbox
        {...args}
        defaultChecked={false}
        checked={undefined}
        disabled={false}
        hasError={false}
      >
        Unchecked
      </Checkbox>
      <Checkbox
        {...args}
        defaultChecked
        checked={undefined}
        disabled={false}
        hasError={false}
      >
        Checked
      </Checkbox>
      <Checkbox
        {...args}
        checked="indeterminate"
        defaultChecked={undefined}
        disabled={false}
        hasError={false}
      >
        Indeterminate
      </Checkbox>
      <Checkbox
        {...args}
        disabled
        defaultChecked={false}
        checked={undefined}
        hasError={false}
      >
        Disabled
      </Checkbox>
      <Checkbox {...args} disabled defaultChecked checked={undefined} hasError={false}>
        Disabled + checked
      </Checkbox>
      <Checkbox
        {...args}
        hasError
        defaultChecked={false}
        checked={undefined}
        disabled={false}
      >
        Error state
      </Checkbox>
    </div>
  ),
};

export const IconOnly: Story = {
  name: "Without a label (aria-label required)",
  parameters: { docs: { source: { code: checkboxSnippets.iconOnly } } },
  // The whole point is demonstrating a label-less checkbox, so `children`
  // is deliberately dropped regardless of the shared Playground default —
  // every other prop stays live via `{...args}`.
  argTypes: { children: { control: false } },
  args: { "aria-label": "Select row" },
  render: ({ children: _children, ...args }) => <Checkbox {...args} />,
};

export const CustomIcons: Story = {
  name: "Custom check/indeterminate icons",
  parameters: { docs: { source: { code: checkboxSnippets.customIcons } } },
  // `icon`/`indeterminateIcon` are the whole point here, fixed per instance
  // so the comparison against the default glyph is visible side by side —
  // `size`/`hasError`/`disabled` still stay live via `{...args}`.
  argTypes: {
    icon: { control: false },
    indeterminateIcon: { control: false },
    defaultChecked: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Checkbox {...args} defaultChecked>
        Default check icon
      </Checkbox>
      <Checkbox {...args} defaultChecked icon={StarIcon}>
        Custom check icon (Star)
      </Checkbox>
      <Checkbox {...args} checked="indeterminate" indeterminateIcon={XIcon}>
        Custom indeterminate icon (X)
      </Checkbox>
    </div>
  ),
};

export const SelectAllPattern: Story = {
  name: "Select-all / indeterminate pattern",
  parameters: { docs: { source: { code: checkboxSnippets.selectAllPattern } } },
  // `checked`/`onCheckedChange`/`defaultChecked`/`children` are all driven
  // by this story's own local state (the whole point of the demo), so
  // those are excluded from the live controls — but `size`/`hasError`/
  // `disabled` are still meaningful to preview across the whole pattern
  // and stay live via `{...args}`.
  argTypes: {
    checked: { control: false },
    defaultChecked: { control: false },
    children: { control: false },
  },
  render: function SelectAllStory(args) {
    const [items, setItems] = useState([false, false, false]);
    const checkedCount = items.filter(Boolean).length;
    const allChecked = checkedCount === items.length;
    const someChecked = checkedCount > 0 && !allChecked;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        <Checkbox
          {...args}
          checked={someChecked ? "indeterminate" : allChecked}
          onCheckedChange={(checked) =>
            setItems(items.map(() => checked === true))
          }
        >
          Select all
        </Checkbox>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--dbm-space-2)",
            paddingInlineStart: "var(--dbm-space-6)",
          }}
        >
          {items.map((checked, index) => (
            <Checkbox
              {...args}
              key={index}
              checked={checked}
              onCheckedChange={(value) =>
                setItems(items.map((v, i) => (i === index ? value === true : v)))
              }
            >
              Item {index + 1}
            </Checkbox>
          ))}
        </div>
      </div>
    );
  },
};

export const ClickInteraction: Story = {
  name: "Interaction: toggles on click",
  args: { children: "Accept terms" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Accept terms" });
    await expect(checkbox).toHaveAttribute("aria-checked", "false");
    await userEvent.click(checkbox);
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks click",
  args: { children: "Accept terms", disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Accept terms" });
    await expect(checkbox).toBeDisabled();
    // A disabled native button doesn't dispatch click events at all — this
    // confirms the browser itself is blocking interaction, not just that
    // our handler happens not to fire (same reasoning as Button's
    // DisabledInteraction story).
    await userEvent.click(checkbox);
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const SpaceKeyInteraction: Story = {
  name: "Interaction: focusable and toggles via Space",
  args: { children: "Accept terms" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Accept terms" });
    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    // The WAI-ARIA checkbox pattern activates via Space, not Enter — unlike
    // Button, which is a native <button> where Enter is also expected.
    await userEvent.keyboard(" ");
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

// A box drawn smaller than the 24 × 24px minimum target (12, 16 and 20px at xs, sm and md) has an invisible hit area of that size, so
// a press near it still lands on it. `getBoundingClientRect` can't see a pseudo-element, so points 11px either side of the centre are
// pressed with `elementFromPoint`; and the hit area must not take a press meant for the next box in a stack.
export const HitAreaInteraction: Story = {
  name: "Hit area — interaction test",
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Checkbox key={size} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const boxes = within(canvasElement).getAllByRole("checkbox");
    for (const box of boxes) {
      const rect = box.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      for (const [dx, dy] of [[-11, 0], [11, 0]] as const) {
        await expect(document.elementFromPoint(x + dx, y + dy)).toBe(box);
      }
      // vertically, stacked 8px apart: the point inside this box's own 24px square is this box, not its neighbour
      await expect(document.elementFromPoint(x, y)).toBe(box);
    }
    // an xs box and its neighbour's centre: each answers at its own centre, so one hit area doesn't cover another box
    const [first, second] = boxes as [HTMLElement, HTMLElement];
    const centre = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return [rect.left + rect.width / 2, rect.top + rect.height / 2] as const;
    };
    await expect(document.elementFromPoint(...centre(first))).toBe(first);
    await expect(document.elementFromPoint(...centre(second))).toBe(second);
    // and the box is measured as it was: a larger hit area changed nothing visible
    await expect(Math.round(first.getBoundingClientRect().width)).toBe(12);
  },
};
