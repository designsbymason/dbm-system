import { MagnifyingGlassIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Icon } from "../Icon";
import { Input } from "./Input";
import { inputPlaygroundSnippet, inputSnippets } from "./Input.snippets";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  id: "atoms-inputs-input",
  component: Input,
  parameters: { layout: "padded" },
  // Ordered content-ish prop first (placeholder, the closest thing this
  // component has to visible content), then the slot props, then core
  // visual/behavioral props, then advanced/escape-hatch props last — the
  // same sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    placeholder: {
      control: "text",
      description: "Native placeholder text shown when the input is empty.",
    },
    // `control: false` — `ReactNode` is too open-ended for a live
    // Storybook control (unlike a bounded icon/enum union); the dedicated
    // "With prefix icon"/"With suffix text" stories below demonstrate
    // these instead. Matches every other reviewed component's established
    // precedent for props that only mean something wired up in real
    // consuming code.
    prefix: {
      control: false,
      description: "Leading slot content — an icon, currency symbol, etc.",
    },
    suffix: {
      control: false,
      description: "Trailing slot content.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size and padding, matching the shared size scale.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the input as invalid, visually and via aria-invalid.",
    },
    // The curated option list matches this component's own JSDoc: the
    // plain text-like types it's actually intended for, plus password/
    // number (genuine native behavior, but see PasswordInput/NumberInput
    // in the component notes) — not the full native HTMLInputTypeAttribute
    // union (color/range/file/date/etc.), which don't make sense rendered
    // through this component's own wrapper/affix/clear-button chrome.
    type: {
      control: "select",
      options: ["text", "email", "tel", "url", "search", "password", "number"],
      description:
        "The kind of value this input collects. See the component's own JSDoc for which types this atom is actually intended for vs. which get their own dedicated molecule later.",
    },
    // `control: false` — driving `value` from Controls without a real
    // `onChange` wired back into `args` would freeze the input, since a
    // controlled value always wins over the user's own typing (same
    // reasoning as Checkbox's own `checked`). The Playground demonstrates
    // the uncontrolled path via `defaultValue` instead.
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
        "Shows a clear (×) button after suffix whenever the input has a value, calling this when it's clicked. See the \"With a clear button\" story for a live demo — needs a real value/onChange wired up, which the Playground's own plain demo doesn't have.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the native input.",
    },
    required: {
      control: "boolean",
      description:
        "Marks the input as required for HTML5 form validation. Pair with a FieldLabel whose own required shows the matching visual asterisk.",
    },
    readOnly: {
      control: "boolean",
      description:
        "Prevents editing without disabling the input — still focusable/selectable, unlike disabled.",
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the input automatically on mount. Use sparingly.",
    },
    // `control: false` — has no visible effect inside an isolated
    // Storybook iframe (real browser autofill/password-manager UI doesn't
    // trigger the same way here).
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill (e.g. 'email', 'current-password', 'off').",
    },
    // Live number control, defaulted generously (200) below rather than
    // left at the component's own `undefined` default — a small default
    // would silently truncate whatever placeholder/demo text someone
    // types while trying other props. Paired with `showCount` right
    // below, so toggling that on now actually shows something live here.
    maxLength: {
      control: "number",
      description: "Maximum number of characters the input accepts.",
    },
    showCount: {
      control: "boolean",
      description:
        "Shows a live current/max character count inline, after suffix. Only renders when maxLength is also set.",
    },
    formatNumber: {
      control: false,
      description:
        "How the numbers in the showCount counter are written — both the current length and maxLength — for a language or region whose numerals or digit grouping differ from the plain 5 and 1234: given a number, returns the text to show. For example new Intl.NumberFormat(\"ar-EG\").format shows ٥/١٠. Only used while the counter is shown (showCount with maxLength); the native maxLength limit and the value itself are unaffected.",
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
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean"/"Set object" placeholder instead of a live,
  // interactive control (see guidelines/07-storybook-and-documentation-standards.md
  // §5).
  args: {
    placeholder: "Enter text",
    size: "md",
    type: "text",
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
};

export default meta;

type Story = StoryObj<typeof Input>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => inputPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: inputSnippets.allSizes } } },
  // `size`/`placeholder` are the whole point of this grid — each instance
  // intentionally varies size (the size name doubles as its own label), so
  // no single control value could represent them. `hasError`/`disabled`
  // still stay live and shared via `{...args}`. Previously this story used
  // a bare `render: () => (...)` that ignored args entirely, making every
  // control here a silent no-op.
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
        <Input key={size} {...args} size={size} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const WithPrefixIcon: Story = {
  name: "With prefix icon",
  parameters: { docs: { source: { code: inputSnippets.withPrefixIcon } } },
  // `prefix`/`placeholder` are the whole point here, fixed per instance —
  // `size`/`hasError`/`disabled` stay live via `{...args}`.
  argTypes: { prefix: { control: false }, placeholder: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <Input
        {...args}
        prefix={<Icon icon={MagnifyingGlassIcon} />}
        placeholder="Search"
      />
    </div>
  ),
};

export const WithSuffix: Story = {
  name: "With suffix text",
  parameters: { docs: { source: { code: inputSnippets.withSuffix } } },
  // `suffix`/`placeholder` are the whole point here, fixed per instance —
  // `size`/`hasError`/`disabled` stay live via `{...args}`.
  argTypes: { suffix: { control: false }, placeholder: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <Input {...args} suffix="@example.com" placeholder="username" />
    </div>
  ),
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: inputSnippets.clearable } } },
  // `value`/`onChange`/`onClear` are all driven by this story's own local
  // state (the whole point of the demo), plus `prefix`/`placeholder` fixed
  // per instance — but `size`/`hasError`/`disabled` are still meaningful
  // to preview here and stay live via `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default (found in
  // review, 2026-08-29) — this story sets its own controlled `value`
  // below, and without this override `{...args}` would still spread the
  // Playground's own `defaultValue: ""` onto the same `<input>`,
  // triggering React's real "both value and defaultValue" console error
  // (a controlled/uncontrolled conflict, not just a cosmetic warning).
  // `defaultValue: { control: false }` below is the other half of that
  // same fix (found in review, 2026-08-29) — the arg above being
  // `undefined` on its own renders as an inert "Set string" placeholder
  // instead of a "–", the exact violation this checklist item exists to
  // catch; `defaultValue` genuinely doesn't apply to this story (a
  // controlled `value` always wins over it) so "–" is the honest value.
  args: { defaultValue: undefined },
  argTypes: {
    prefix: { control: false },
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: function ClearableStory(args) {
    const [value, setValue] = useState("Search term");
    return (
      <div style={{ maxWidth: "20rem" }}>
        <Input
          {...args}
          prefix={<Icon icon={MagnifyingGlassIcon} />}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
          placeholder="Search"
        />
      </div>
    );
  },
};

export const CharacterCount: Story = {
  name: "With character count",
  parameters: { docs: { source: { code: inputSnippets.characterCount } } },
  // `value`/`onChange` are driven by this story's own local state (the
  // whole point of the demo), `maxLength`/`showCount`/`placeholder` fixed
  // per instance — but `size`/`hasError`/`disabled` still stay live via
  // `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, same
  // controlled/uncontrolled conflict already found and fixed on the
  // Clearable story above — this story also sets its own controlled
  // `value` below, and without this override `{...args}` would still
  // spread the Playground's own `defaultValue: ""` onto the same
  // `<input>`. `defaultValue: { control: false }` below is the other
  // half — same reasoning as Clearable's own fix.
  args: { defaultValue: undefined },
  argTypes: {
    maxLength: { control: false },
    showCount: { control: false },
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: function CharacterCountStory(args) {
    const [value, setValue] = useState("Getting started…");
    return (
      <div style={{ maxWidth: "20rem" }}>
        <Input
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={140}
          showCount
          aria-label="Bio"
          placeholder="Tell us about yourself"
        />
      </div>
    );
  },
};

export const CharacterCountLocale: Story = {
  name: "Character count in your locale",
  parameters: { docs: { source: { code: inputSnippets.characterCountLocale } } },
  // `formatNumber` writes the counter's numbers the way a language or region does — here Arabic-Indic digits, in a
  // right-to-left container. Uncontrolled, so typing updates the count. `maxLength`/`showCount`/`formatNumber` and the
  // starting text are pinned; `size`/`hasError`/`disabled` stay live via `{...args}`.
  argTypes: {
    maxLength: { control: false },
    showCount: { control: false },
    formatNumber: { control: false },
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: (args) => (
    <div dir="rtl" style={{ maxWidth: "20rem" }}>
      <Input {...args} defaultValue="مرحبا" maxLength={140} showCount formatNumber={new Intl.NumberFormat("ar-EG").format} aria-label="Bio" />
    </div>
  ),
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => inputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { hasError: true, placeholder: "Email", defaultValue: "not-an-email" },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => inputPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true, placeholder: "Disabled" },
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (fills container width)",
  parameters: { docs: { source: { code: inputSnippets.narrowViewport } } },
  // `placeholder` is the whole point, fixed per instance — `size`/
  // `hasError`/`disabled` stay live via `{...args}`. Previously this story
  // used a bare `render: () => (...)` that ignored args entirely.
  // `parameters.chromatic` removed (2026-08-29, review finding) — Chromatic
  // is a paid SaaS visual-regression tool this project deliberately chose
  // not to use (02-tech-stack-and-structure.md picked Playwright's own
  // self-hosted screenshot testing specifically to avoid it). The
  // parameter was inert here (Chromatic itself was never installed/
  // configured), but misleading — narrow-viewport verification for this
  // story is the Storybook viewport toolbar addon, the actual mechanism
  // this project uses (06-engineering-standards.md §9's own Responsiveness
  // checklist item), not a per-story Chromatic-specific parameter.
  argTypes: { placeholder: { control: false } },
  render: (args) => (
    <div style={{ width: "100%" }}>
      <Input {...args} placeholder="Full width on narrow screens" />
    </div>
  ),
};

export const TypingInteraction: Story = {
  name: "Interaction: typing updates value and reveals the clear button",
  args: { placeholder: "Search", onClear: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Search");
    await expect(
      canvas.queryByRole("button", { name: "Clear" }),
    ).not.toBeInTheDocument();

    await userEvent.type(input, "hello");
    await expect(input).toHaveValue("hello");
    await expect(canvas.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  },
};

export const ClearButtonInteraction: Story = {
  name: "Interaction: clear button calls onClear and refocuses the input",
  args: { placeholder: "Search", defaultValue: "hello", onClear: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Search");
    const clearButton = canvas.getByRole("button", { name: "Clear" });

    await userEvent.click(clearButton);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    // `onClear` clearing the value is the caller's own responsibility (see
    // the component's own JSDoc) — this story's `args.onClear` is a bare
    // mock, so the value stays put; what's under test here is that the
    // click fires the callback and returns focus to the input, not that
    // clicking alone clears anything.
    await expect(input).toHaveFocus();
  },
};
