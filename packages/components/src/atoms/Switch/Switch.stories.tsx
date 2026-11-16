import { CheckIcon, MoonIcon, SunIcon, XIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Switch } from "./Switch";
import { switchPlaygroundSnippet, switchSnippets } from "./Switch.snippets";
import type { SwitchProps } from "./Switch.types";

// The Controls panel can't natively drive an arbitrary component reference,
// so this maps a small curated set of real icons onto string keys via
// `argTypes.mapping` (same pattern as Checkbox's `icon`/`indeterminateIcon`).
// "None" maps to `undefined`, letting the thumb render with no icon.
const checkedIconMapping = {
  None: undefined,
  Moon: MoonIcon,
  Check: CheckIcon,
};
const uncheckedIconMapping = {
  None: undefined,
  Sun: SunIcon,
  X: XIcon,
};
const checkedIconControl = {
  control: "select" as const,
  options: Object.keys(checkedIconMapping),
  mapping: checkedIconMapping,
};
const uncheckedIconControl = {
  control: "select" as const,
  options: Object.keys(uncheckedIconMapping),
  mapping: uncheckedIconMapping,
};

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  id: "atoms-inputs-switch",
  component: Switch,
  parameters: { layout: "padded" },
  // Keys below are ordered to match `SwitchProps`' own declaration order
  // (content prop → core visual props → behavioral/state props → advanced/
  // escape-hatch props last) — this is what drives the rendered order of
  // Storybook's raw per-story Controls panel (confirmed on Button/Checkbox:
  // that panel's row order comes from docgen's extraction of the
  // component's own Props type, not from this object's key order alone —
  // but keeping this object in the same order keeps source and rendered
  // output easy to reason about together).
  argTypes: {
    children: { description: "Inline label rendered next to the switch." },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    hasError: {
      description:
        "Marks the switch as invalid, visually (a danger-colored ring) and via `aria-invalid`.",
    },
    // Deliberately excluded from the live controls: driving `checked` from
    // Controls without a real `onCheckedChange` wired back into `args`
    // would freeze the switch, since Radix always defers to a controlled
    // value over its own internal click handling. This Playground
    // demonstrates the uncontrolled path via `defaultChecked` instead.
    checked: { control: false, description: "The controlled checked state." },
    defaultChecked: {
      description:
        "The initial checked state when uncontrolled — sets where the switch starts, not a live toggle. Click the switch itself in the canvas to change it, same as a real uncontrolled `<input defaultChecked>`.",
    },
    onCheckedChange: {
      description: "Called with the new checked state whenever it changes.",
    },
    checkedIcon: {
      ...checkedIconControl,
      description: "Icon shown inside the thumb while the switch is on.",
    },
    uncheckedIcon: {
      ...uncheckedIconControl,
      description: "Icon shown inside the thumb while the switch is off.",
    },
    loading: {
      description:
        "Shows a loading indicator in place of the thumb icon and blocks interaction while true.",
    },
    disabled: { description: "Disables the switch natively." },
    required: {
      description:
        "Marks the switch as required for HTML5 form validation, and sets aria-required.",
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the switch automatically on mount. Use sparingly.",
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
        "Associates the switch with a <form> by id, for use outside that form's own DOM subtree.",
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
    children: "Email notifications",
    size: "md",
    hasError: false,
    disabled: false,
    defaultChecked: false,
    loading: false,
    required: false,
    name: "",
    value: "",
    "aria-label": "",
    onCheckedChange: fn(),
    // Cast, same as Checkbox's `icon`/`indeterminateIcon` default args —
    // this is the Controls-panel select's option key, not
    // `SwitchProps["checkedIcon"]` itself, hence the cast.
    checkedIcon: "None" as unknown as SwitchProps["checkedIcon"],
    uncheckedIcon: "None" as unknown as SwitchProps["uncheckedIcon"],
  },
};

export default meta;

type Story = StoryObj<typeof Switch>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => switchPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: switchSnippets.allSizes } } },
  // `size`/`children` are the whole point of this grid — each instance
  // intentionally varies both together (the size name doubles as its own
  // label), so no single control value could represent them. Defaulted to
  // `defaultChecked: true` here specifically so the on state is visible at
  // every size out of the box — still a live, shared value via `{...args}`,
  // along with every other prop (`hasError`, `disabled`, `loading`, ...).
  // Previously this story used a bare `render: () => (...)` that ignored
  // args entirely, making every control here a silent no-op.
  args: { defaultChecked: true },
  argTypes: { size: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Switch key={size} {...args} size={size}>
          Size {size}
        </Switch>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: switchSnippets.states } } },
  // Each row demonstrates a specific, fixed state combination — together,
  // `defaultChecked`/`disabled`/`hasError`/`loading`/`children` are what
  // define that row, so all five are pinned per instance rather than
  // controllable (same reasoning as Checkbox's own States story). `size`
  // (and any other prop) stays live and shared via `{...args}`.
  argTypes: {
    defaultChecked: { control: false },
    disabled: { control: false },
    hasError: { control: false },
    loading: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Switch {...args} defaultChecked={false} disabled={false} hasError={false} loading={false}>
        Off
      </Switch>
      <Switch {...args} defaultChecked disabled={false} hasError={false} loading={false}>
        On
      </Switch>
      <Switch {...args} disabled defaultChecked={false} hasError={false} loading={false}>
        Disabled
      </Switch>
      <Switch {...args} disabled defaultChecked hasError={false} loading={false}>
        Disabled + on
      </Switch>
      <Switch {...args} hasError defaultChecked={false} disabled={false} loading={false}>
        Error state
      </Switch>
      <Switch {...args} loading defaultChecked={false} disabled={false} hasError={false}>
        Loading
      </Switch>
    </div>
  ),
};

export const WithThumbIcons: Story = {
  name: "With thumb icons",
  parameters: { docs: { source: { code: switchSnippets.withThumbIcons } } },
  argTypes: { checkedIcon: { control: false }, uncheckedIcon: { control: false } },
  args: {
    checkedIcon: MoonIcon as unknown as SwitchProps["checkedIcon"],
    uncheckedIcon: SunIcon as unknown as SwitchProps["uncheckedIcon"],
    children: "Dark mode",
    defaultChecked: true,
  },
};

export const IconOnly: Story = {
  name: "Without a label (aria-label required)",
  parameters: { docs: { source: { code: switchSnippets.iconOnly } } },
  // The whole point is demonstrating a label-less switch, so `children` is
  // deliberately dropped regardless of the shared Playground default —
  // every other prop stays live via `{...args}`.
  argTypes: { children: { control: false } },
  args: { "aria-label": "Airplane mode" },
  render: ({ children: _children, ...args }) => <Switch {...args} />,
};

export const ToggleInteraction: Story = {
  name: "Interaction: toggles on click",
  args: { children: "Email notifications" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Email notifications" });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks click",
  args: { children: "Email notifications", disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Email notifications" });
    await expect(toggle).toBeDisabled();
    // A disabled native button doesn't dispatch click events at all — this
    // confirms the browser itself is blocking interaction, not just that
    // our handler happens not to fire (same reasoning as Checkbox's
    // DisabledInteraction story).
    await userEvent.click(toggle);
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const SpaceKeyInteraction: Story = {
  name: "Interaction: focusable and toggles via Space",
  args: { children: "Email notifications" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Email notifications" });
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    // The WAI-ARIA switch pattern activates via Space, not Enter — unlike
    // Button, which is a native <button> where Enter is also expected.
    await userEvent.keyboard(" ");
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const LoadingInteraction: Story = {
  name: "Interaction: loading blocks click",
  args: { children: "Saving…", loading: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Saving…" });
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute("aria-busy", "true");
    await userEvent.click(toggle);
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};
