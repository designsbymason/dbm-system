import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Select } from "./Select";
import { selectPlaygroundSnippet, selectSnippets } from "./Select.snippets";

// `Select`'s own `.trigger` CSS sets `width: 100%`, filling its container
// by design (the same convention `Input` uses) — every story below
// constrains and centers that container instead of letting the canvas's
// own full padded width stretch the demo edge-to-edge, matching
// `Input.stories.tsx`'s own `maxWidth: "20rem"` convention (found and
// fixed 2026-09-14, user-requested).
const demoContainerStyle = {
  maxWidth: "20rem",
  marginInline: "auto",
} as const;

const DemoOptions = () => (
  <>
    <Select.Option value="primary">Primary</Select.Option>
    <Select.Option value="secondary">Secondary</Select.Option>
    <Select.Option value="tertiary">Tertiary</Select.Option>
    <Select.Option value="ghost">Ghost</Select.Option>
    <Select.Option value="destructive">Destructive</Select.Option>
  </>
);

const meta: Meta<typeof Select> = {
  title: "Molecules/Inputs/Select",
  component: Select,
  parameters: { layout: "padded" },
  // Ordered to match SelectProps' own declaration order (value,
  // defaultValue, onValueChange, onClear, placeholder, size, hasError,
  // disabled, name, required, open, defaultOpen, onOpenChange, dir, form,
  // autoComplete, side, align, asChild, trigger, children, aria-label,
  // aria-labelledby, aria-describedby, id, className, style, data-testid)
  // — same sequencing principle the Properties table uses
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    // `control: false` — driving `value` from Controls without a real
    // `onValueChange` wired back into `args` would freeze the select,
    // since a controlled value always wins over the user's own selection
    // (same reasoning as Input's own `value` argType). The Playground
    // demonstrates the uncontrolled path via `defaultValue` instead; the
    // dedicated `Controlled` story below demonstrates the real controlled
    // pattern with its own local state.
    value: {
      control: false,
      description: "The controlled selected value.",
    },
    defaultValue: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The initial selected value when uncontrolled.",
    },
    onValueChange: {
      control: false,
      description: "Called with the new value whenever the selection changes.",
    },
    // `control: false` — same reasoning as `onValueChange` above; the
    // dedicated `Clearable` story below demonstrates it with a real
    // handler instead.
    onClear: {
      control: false,
      description:
        "Shows a clear button in place of the caret whenever a value is selected. No effect when asChild is set.",
    },
    placeholder: {
      control: "text",
      description:
        "Shown in the trigger when nothing is selected. No effect when asChild is set.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Visual size of the trigger.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the select as invalid, visually and via aria-invalid.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the select entirely.",
    },
    name: {
      control: "text",
      description: "Name submitted with the enclosing form.",
    },
    required: {
      control: "boolean",
      description: "Marks the field as required for native form validation.",
    },
    // `control: false` — same reasoning as `value` above: driving the
    // controlled `open` state without a real `onOpenChange` wired back
    // would freeze the dropdown open or closed. `defaultOpen` demonstrates
    // the uncontrolled path instead.
    open: {
      control: false,
      description: "The controlled open state of the dropdown.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state when uncontrolled.",
    },
    onOpenChange: {
      control: false,
      description: "Called whenever the dropdown opens or closes.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, passed through to Radix Select. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
    },
    form: {
      control: "text",
      description: "Associates the field with a <form> by id, for use outside one.",
    },
    autoComplete: {
      control: "text",
      description:
        "Native autocomplete hint, passed through to Radix Select's own hidden native <select> — not the visible trigger.",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Which side of the trigger the dropdown opens on.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment along the chosen side.",
    },
    // `control: false` for both — `trigger` needs a real `ReactElement`, not
    // something a Storybook control can produce, and `asChild` alone
    // (without a matching `trigger`) would just show the dev-mode warning
    // and nothing else. See the dedicated `CustomTrigger` story below.
    asChild: {
      control: false,
      description: "Renders the trigger as a single provided element (Radix Slot).",
    },
    trigger: {
      control: false,
      description: "The custom trigger element used when asChild is set.",
    },
    children: {
      control: false,
      description: "<Select.Option> elements.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible name — required unless a visible label is associated via aria-labelledby or a native label/id pair.",
    },
    "aria-labelledby": {
      control: false,
      description: "References the id of an element that labels this select.",
    },
    "aria-describedby": {
      control: false,
      description: "References the id of an element that describes this select.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Auto-generated via useId when omitted — pass your own when another element's aria-labelledby/aria-describedby needs to point at this component, or a test/router needs a stable anchor.",
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
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value matching its real,
  // effective default — including `dir`, which has no destructuring-level
  // default in `Select.tsx` (passed straight through to Radix `Root`,
  // which falls back to the ambient document direction when omitted) but
  // *does* have a real, standard resolved value (`'ltr'`) worth showing
  // rather than leaving the control at "Choose option..." while nothing
  // about the canvas actually contradicts it — same "control must match
  // what's genuinely in effect" reasoning as List's own `as`/`marker` fix
  // (found and fixed 2026-09-14, user-reported). `name`/`form`/
  // `autoComplete` get `""`, not `undefined` — genuinely optional
  // escape-hatch props with no default *value* to show, but a `text`
  // control gates on `undefined` exactly like a `number` control does
  // (see `GridItem.stories.tsx`'s own `parseNumberArg` comment for the
  // full mechanism) — showing "Set string" instead of a real, always-
  // editable input, the second bug reported alongside this one.
  // `defaultValue`/`placeholder` still have no true default (genuinely
  // unset shows the placeholder, and the canvas agrees) and stay unset/a
  // sensible demo value respectively, per 06-engineering-standards.md §9.
  args: {
    "aria-label": "Variant",
    placeholder: "Choose a variant",
    size: "md",
    hasError: false,
    disabled: false,
    name: "",
    required: false,
    defaultOpen: false,
    dir: "ltr",
    form: "",
    autoComplete: "",
    side: "bottom",
    align: "start",
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Select {...args}>
        <DemoOptions />
      </Select>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => selectPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => selectPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Select {...args}>
        <DemoOptions />
      </Select>
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: selectSnippets.allSizes } } },
  // `size` is the deliberate varying axis (one instance per size, so no
  // single control value could represent "all of them" — per
  // 06-engineering-standards.md §9's multi-instance-gallery exception).
  // `defaultValue` disabled too — fixed to "md" so every instance starts
  // populated (this story is about comparing sizes, not exploring
  // selection), and this story's own children ("sm"/"md"/"lg") are a
  // completely different value set from the shared meta-level
  // `defaultValue` argType's options (the 5-variant demo set) — leaving it
  // live would silently show a blank selection for any of those 5 values,
  // since none of them exist in these three options (found and fixed
  // 2026-09-14, user-reported: the control read "Choose option..." while
  // every instance visibly showed "Medium", a real control/canvas
  // mismatch — root cause traced to this options-list mismatch, not a
  // missing default). Every other prop stays live, shared across all five.
  argTypes: { size: { control: false }, defaultValue: { control: false } },
  args: { defaultValue: "md" },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        ...demoContainerStyle,
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Select key={size} {...args} aria-label={`Size ${size}`} size={size}>
          <Select.Option value="sm">Small</Select.Option>
          <Select.Option value="md">Medium</Select.Option>
          <Select.Option value="lg">Large</Select.Option>
        </Select>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: selectSnippets.states } } },
  // `hasError`/`disabled` are the deliberate varying axes here (each of
  // the four instances demonstrates a different fixed combination) — same
  // multi-instance-gallery exception as `AllSizes` above. `defaultValue`
  // disabled too — only the "Filled" instance actually uses it, and even
  // then with its own hardcoded `"primary"` override, not the shared arg
  // (the other three stay empty by design); leaving the shared control
  // live would make three of the four instances respond to it while the
  // fourth silently doesn't, an inconsistency not worth the confusion for
  // a story about comparing fixed visual states. Every other prop (size,
  // placeholder, etc.) stays live, shared across all four.
  argTypes: {
    hasError: { control: false },
    disabled: { control: false },
    defaultValue: { control: false },
  },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        ...demoContainerStyle,
      }}
    >
      <Select {...args} aria-label="Empty">
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select {...args} aria-label="Filled" defaultValue="primary" placeholder={undefined}>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select {...args} aria-label="Disabled" disabled>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select {...args} aria-label="Error state" hasError>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
    </div>
  ),
};

export const DisabledOption: Story = {
  name: "Disabled option",
  parameters: { docs: { source: { code: selectSnippets.disabledOption } } },
  // `defaultValue`'s own options overridden to match this story's actual
  // three children (the shared meta-level options list is the 5-variant
  // demo set, which doesn't apply here) — kept live, not disabled, since
  // trying `defaultValue="secondary"` (the disabled option) is itself a
  // legitimate, interesting thing to explore in this specific story.
  argTypes: {
    defaultValue: { control: "select", options: ["primary", "secondary", "tertiary"] },
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Select {...args}>
        <Select.Option value="primary">Primary</Select.Option>
        <Select.Option value="secondary" disabled>
          Secondary (unavailable)
        </Select.Option>
        <Select.Option value="tertiary">Tertiary</Select.Option>
      </Select>
    </div>
  ),
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: selectSnippets.clearable } } },
  // Unlike `Input`'s own `onClear` (which needs a real controlled
  // `value`/`onChange` to actually reset what's displayed — see that
  // component's own "With a clear button" story), `Select` fully resets
  // its own selection back to the placeholder on `onClear` even with only
  // `defaultValue` (uncontrolled) — no local state needed for this demo.
  // `defaultValue`'s own control stays live and interactive here (unlike
  // `LongList`/`AllSizes` below) since it's exactly this story's own
  // point: pick a starting value, then clear it.
  //
  // `args.defaultValue` seeds a real starting selection (found and fixed
  // 2026-09-14, user-reported): previously left unset, so this gallery
  // entry rendered with nothing selected and no clear button visible at
  // all until a reader manually opened the dropdown and picked an option
  // — unlike `Input`'s own identically-named story, which seeds its local
  // state with a real value for exactly this reason. A "Variants/states
  // gallery" entry is meant to show its feature at a glance
  // (07-storybook-and-documentation-standards.md §4 item 4), not require
  // interaction first.
  args: { defaultValue: "primary" },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Select {...args} onClear={() => {}}>
        <DemoOptions />
      </Select>
    </div>
  ),
};

export const LongList: Story = {
  name: "Long list (scroll buttons)",
  parameters: { docs: { source: { code: selectSnippets.longList } } },
  // `defaultValue` disabled — the shared meta-level options list (the
  // 5-variant demo set) doesn't match this story's own 30 country values,
  // and the story's own point (scroll buttons on a long list) doesn't
  // need selection exploration to demonstrate.
  argTypes: { defaultValue: { control: false } },
  args: { "aria-label": "Country", placeholder: "Choose a country" },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Select {...args}>
        {[
          "Argentina", "Australia", "Belgium", "Brazil", "Canada", "Chile",
          "Denmark", "Egypt", "Finland", "France", "Germany", "Greece",
          "India", "Indonesia", "Ireland", "Italy", "Japan", "Kenya",
          "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway",
          "Poland", "Portugal", "Spain", "Sweden", "Switzerland",
          "United Kingdom", "United States",
        ].map((country) => (
          <Select.Option key={country} value={country}>
            {country}
          </Select.Option>
        ))}
      </Select>
    </div>
  ),
};

export const SideAndAlign: Story = {
  name: "side/align (dropdown placement)",
  parameters: { docs: { source: { code: selectSnippets.sideAndAlign } } },
  args: { side: "right", align: "start" },
  render: (args) => (
    <div style={{ paddingBlock: "var(--dbm-space-16)", ...demoContainerStyle }}>
      <Select {...args}>
        <DemoOptions />
      </Select>
    </div>
  ),
};

export const CustomTrigger: Story = {
  name: 'asChild + trigger (custom trigger element)',
  parameters: { docs: { source: { code: selectSnippets.customTrigger } } },
  // `asChild`/`trigger` stay disabled at the meta level (no Storybook
  // control can produce a real `ReactElement`) — this story demonstrates
  // them with a real, hardcoded custom trigger instead. Select's own
  // built-in trigger chrome (background/border/color, size, error classes)
  // is deliberately NOT applied in `asChild` mode (see `Select.tsx`'s own
  // comment) — the custom trigger brings its own full styling, here `Button`
  // itself, unmodified: no `style` override needed, since there's no longer
  // a competing `.trigger` class to win over. `placeholder` has no effect
  // either (see that argType's own comment).
  argTypes: { placeholder: { control: false } },
  args: { placeholder: undefined },
  render: (args) => (
    // `justifyContent: "center"` in addition to `demoContainerStyle`'s own
    // `marginInline: auto` — `Button` is fit-content by default (no
    // Select-owned `width: 100%` applies to it anymore), so centering just
    // the outer container isn't enough to center the (much narrower) button
    // itself within it.
    <div style={{ display: "flex", justifyContent: "center", ...demoContainerStyle }}>
      <Select
        {...args}
        asChild
        trigger={<Button variant="primary">Open the custom trigger</Button>}
      >
        <DemoOptions />
      </Select>
    </div>
  ),
};

export const CustomOptionRow: Story = {
  name: "Custom option row (Select.Option asChild)",
  parameters: { docs: { source: { code: selectSnippets.customOptionRow } } },
  // `defaultValue` disabled — the shared meta-level options list (the
  // 5-variant demo set) doesn't match this story's own framework values.
  argTypes: { defaultValue: { control: false } },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Select {...args} aria-label="Framework" placeholder="Choose a framework">
        {[
          { value: "react", label: "React", description: "UI library" },
          { value: "vue", label: "Vue", description: "Progressive framework" },
          { value: "svelte", label: "Svelte", description: "Compiler-based" },
        ].map(({ value, label, description }) => (
          // `asChild` replaces the built-in single-line option row with
          // this fully custom two-line one — `textValue` is required here
          // (Select.Option warns without it): it's what typeahead search
          // matches against, and what the trigger shows once this option
          // is selected, since the trigger can't reasonably display this
          // whole custom row (see Select.Option's own `asChild` doc).
          <Select.Option key={value} value={value} asChild textValue={label}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>{label}</span>
              <span
                style={{
                  color: "var(--dbm-text-tertiary)",
                  fontSize: "var(--dbm-font-size-xs)",
                }}
              >
                {description}
              </span>
            </div>
          </Select.Option>
        ))}
      </Select>
    </div>
  ),
};

export const Controlled: Story = {
  parameters: { docs: { source: { code: selectSnippets.controlled } } },
  // `defaultValue` disabled — `value` (this story's own local state) is
  // already controlling the selection; passing both at once is the exact
  // controlled/uncontrolled conflict `Select.mdx`'s own "Don't" list warns
  // against, so it must never reach the component here regardless of the
  // shared arg. Every other prop (size, hasError, placeholder, etc.)
  // stays genuinely live via `{...args}` — found and fixed 2026-09-14,
  // user-reported: this story's own render previously ignored `args`
  // entirely (a bare hardcoded `<Select>`), so every one of its controls
  // was a silent no-op — the same "story ignores its own args" bug class
  // Grid's/List's own reviews already found and fixed elsewhere.
  argTypes: { defaultValue: { control: false } },
  render: function ControlledStory(args) {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--dbm-space-2)",
          ...demoContainerStyle,
        }}
      >
        <Select
          {...args}
          defaultValue={undefined}
          value={value}
          onValueChange={setValue}
        >
          <Select.Option value="primary">Primary</Select.Option>
          <Select.Option value="secondary">Secondary</Select.Option>
        </Select>
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-sm)" }}>
          Selected: {value ?? "none"}
        </span>
      </div>
    );
  },
};

// A narrow trigger: the dropdown is at least as wide as it, but grows to fit the longest option rather than wrapping a
// bold, checked one onto a second line (the dropdown used to be exactly the trigger's width). Hidden: a real-browser
// measurement, run as a test only.
export const NarrowTriggerInteraction: Story = {
  name: "Narrow trigger — interaction test",
  tags: ["!dev"],
  render: () => (
    <div style={{ width: "4.5rem" }}>
      <Select aria-label="Font size" size="sm" defaultValue="14">
        <Select.Option value="12">12 pt</Select.Option>
        <Select.Option value="14">14 pt</Select.Option>
        <Select.Option value="18">18 pt</Select.Option>
        <Select.Option value="long">Twenty-four point, large print</Select.Option>
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "Font size" });
    await userEvent.click(trigger);
    const listbox = await within(document.body).findByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    await waitFor(() => expect(options.length).toBe(4));
    // No short option wraps: the 12, 14 (checked, bold) and 18 rows are all one line, the same height.
    const heights = options.slice(0, 3).map((option) => Math.round(option.getBoundingClientRect().height));
    await expect(new Set(heights).size).toBe(1);
    // The panel is at least as wide as the trigger, and wide enough for its longest option's text.
    const content = listbox.closest("[data-radix-popper-content-wrapper]")!.firstElementChild as HTMLElement;
    await expect(content.getBoundingClientRect().width).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().width - 1);
    for (const option of options) await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
    await userEvent.keyboard("{Escape}");
  },
};
