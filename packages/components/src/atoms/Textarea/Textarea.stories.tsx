import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Textarea } from "./Textarea";
import { textareaPlaygroundSnippet, textareaSnippets } from "./Textarea.snippets";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  id: "atoms-inputs-textarea",
  component: Textarea,
  parameters: { layout: "padded" },
  // Ordered content-ish prop first (placeholder), then core visual props,
  // then Textarea's own sizing/behavioral props, then the native
  // passthrough props already in real use by this component today, then
  // the advanced/escape-hatch props last — mirrors Input.stories.tsx's
  // own ordering comment, and matches TextareaProps' own declared order
  // (guidelines/06-engineering-standards.md §9's prop-order convention).
  argTypes: {
    placeholder: {
      control: "text",
      description: "Native placeholder text shown when the textarea is empty.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the textarea as invalid, visually and via aria-invalid.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size and padding, matching the shared size scale.",
    },
    autoResize: {
      control: "boolean",
      description:
        "Grows the textarea's height to fit its content as the user types, instead of scrolling internally. Disables manual resizing (the resize prop is ignored) while enabled.",
    },
    resize: {
      control: "select",
      options: ["none", "vertical", "horizontal", "both"],
      description:
        "Which direction, if any, the user can manually resize the textarea by dragging its corner handle. Ignored when autoResize is true.",
    },
    rows: {
      control: "number",
      description:
        "Native row count controlling the textarea's initial/minimum height. Defaults to 3 here (the native browser default is 2).",
    },
    // `control: false` — same reasoning as `value` above: only meaningful
    // paired with `autoResize`, and driving both live from one shared
    // Playground would either leave them at a real default that spuriously
    // warns on every other story that doesn't also enable `autoResize`, or
    // leave them `undefined` and render as inert "Set number" placeholders
    // here specifically. The "Auto-resize (bounded)" story demonstrates
    // them properly wired instead.
    minRows: {
      control: false,
      description:
        "When autoResize is true, sets a minimum height in rows. Ignored when autoResize is false.",
    },
    maxRows: {
      control: false,
      description:
        "When autoResize is true, sets a maximum height in rows, beyond which the textarea scrolls internally instead of growing further. Ignored when autoResize is false.",
    },
    // `control: false` — a function prop with no live-editable
    // representation; fires on every native input event to recompute the
    // character count/auto-resize.
    onInput: {
      control: false,
      description: "Fires on every native input event.",
    },
    // `control: false` — driving `value` from Controls without a real
    // `onChange` wired back into `args` would freeze the textarea, since a
    // controlled value always wins over the user's own typing (same
    // reasoning as Input's own `value` control). The Playground
    // demonstrates the uncontrolled path via `defaultValue` instead.
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
        "Shows a clear (×) button in the top-inline-end corner whenever the textarea has a value, calling this when it's clicked. See the \"With a clear button\" story for a live demo — needs a real value/onChange wired up, which the Playground's own plain demo doesn't have.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the native textarea.",
    },
    required: {
      control: "boolean",
      description:
        "Marks the textarea as required for HTML5 form validation. Pair with a FieldLabel whose own required shows the matching visual asterisk.",
    },
    readOnly: {
      control: "boolean",
      description:
        "Prevents editing without disabling the textarea — still focusable/selectable, unlike disabled.",
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the textarea automatically on mount. Use sparingly.",
    },
    // `control: false` — has no visible effect inside an isolated
    // Storybook iframe (real browser autofill doesn't trigger the same
    // way here).
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill (e.g. 'on', 'off').",
    },
    // Live number control, defaulted generously (200) below rather than
    // left at the component's own `undefined` — a small default would
    // silently truncate whatever demo text someone types while trying
    // other props, and pairs with `showCount` right below so toggling
    // that on now actually shows something live. Matches Input's own
    // Playground reasoning for the identical prop.
    maxLength: {
      control: "number",
      description: "Maximum number of characters the textarea accepts.",
    },
    showCount: {
      control: "boolean",
      description:
        "Shows a live current/max character count below the textarea. Only renders when maxLength is also set.",
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
    name: {
      control: "text",
      description: "Form field name, submitted in the surrounding <form>'s data.",
    },
    // `control: false` — only meaningful paired with a real <form> whose
    // id it points to, which the Playground's own plain demo doesn't have.
    form: {
      control: false,
      description: "Associates the textarea with a <form> by id.",
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
        "Points to the id of a helper or error message associated with this textarea (e.g. a paired FieldHelperText or FieldError).",
    },
    id: {
      control: false,
      description: "Standard DOM id, applied to the native <textarea> element.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Applies to the wrapper (the visual textarea box).",
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
  // interactive control (guidelines/07-storybook-and-documentation-standards.md §5).
  // Ordered to match argTypes above.
  args: {
    placeholder: "Add a comment…",
    hasError: false,
    size: "md",
    autoResize: false,
    resize: "vertical",
    rows: 3,
    defaultValue: "",
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

type Story = StoryObj<typeof Textarea>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => textareaPlaygroundSnippet(context.args),
      },
    },
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: textareaSnippets.allSizes } } },
  // `size`/`placeholder` are the whole point of this grid — each instance
  // intentionally varies size (the size name doubles as its own label), so
  // no single control value could represent them. Every other prop
  // (`hasError`/`disabled`/etc.) still stays live and shared via
  // `{...args}`. Previously this story used a bare `render: () => (...)`
  // that ignored args entirely, making every control here a silent no-op
  // — the same bug class already fixed on Input's own identical story.
  argTypes: { size: { control: false }, placeholder: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "24rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Textarea
          key={size}
          {...args}
          size={size}
          placeholder={`Size ${size}`}
        />
      ))}
    </div>
  ),
};

export const AutoResize: Story = {
  name: "Auto-resize",
  parameters: { docs: { source: { code: textareaSnippets.autoResize } } },
  // `autoResize`/`value`/`onChange`/`placeholder` are all driven by this
  // story's own local state/fixed setup (the whole point of the demo) —
  // but every other prop (`size`/`hasError`/`disabled`/etc.) still stays
  // live via `{...args}`. Previously this story used a bare
  // `render: () => (...)` that ignored args entirely.
  //
  // `defaultValue: undefined` overrides the meta-level default (same
  // controlled/uncontrolled conflict already found and fixed on Input's
  // own Clearable/CharacterCount stories) — this story sets its own
  // controlled `value` below, and without this override `{...args}`
  // would still spread the Playground's own `defaultValue: ""` onto the
  // same `<textarea>`, triggering React's real "both value and
  // defaultValue" console error. `defaultValue: { control: false }`
  // below is the other half of that same fix.
  args: { defaultValue: undefined },
  argTypes: {
    autoResize: { control: false },
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: function AutoResizeStory(args) {
    const [value, setValue] = useState("");
    return (
      <div style={{ maxWidth: "24rem" }}>
        <Textarea
          {...args}
          autoResize
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type multiple lines and watch it grow…"
        />
      </div>
    );
  },
};

export const BoundedAutoResize: Story = {
  name: "Auto-resize (bounded)",
  parameters: { docs: { source: { code: textareaSnippets.boundedAutoResize } } },
  // Feature-completeness addition (guidelines/06-engineering-standards.md
  // §9 finding): a bounded auto-grow range (`minRows`/`maxRows`) was a
  // real, concrete gap — this component's own `autoResize` was on/off-only
  // until now. Same
  // args/argTypes/defaultValue-conflict pattern as the plain Auto-resize
  // story above — `autoResize`/`minRows`/`maxRows`/`value`/`onChange`/
  // `placeholder` are all fixed/driven by local state (the whole point of
  // the demo); everything else stays live via `{...args}`.
  args: { defaultValue: undefined },
  argTypes: {
    autoResize: { control: false },
    minRows: { control: false },
    maxRows: { control: false },
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: function BoundedAutoResizeStory(args) {
    const [value, setValue] = useState("");
    return (
      <div style={{ maxWidth: "24rem" }}>
        <Textarea
          {...args}
          autoResize
          minRows={3}
          maxRows={6}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Grows up to 6 rows, then scrolls…"
        />
      </div>
    );
  },
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: textareaSnippets.clearable } } },
  // Feature-completeness addition (guidelines/06-engineering-standards.md
  // §9 finding): a clear button was a real, concrete gap — this
  // component's own `Input` sibling already has `onClear`, Textarea
  // didn't until now. `value`/`onChange`/`onClear`/`placeholder` are all
  // driven by this story's own local state/fixed setup (the whole point
  // of the demo) — every other prop still stays live via `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, the same
  // controlled/uncontrolled conflict already found and fixed elsewhere in
  // this file — this story sets its own controlled `value` below.
  args: { defaultValue: undefined },
  argTypes: {
    placeholder: { control: false },
    defaultValue: { control: false },
  },
  render: function ClearableStory(args) {
    const [value, setValue] = useState("Some existing text to clear…");
    return (
      <div style={{ maxWidth: "24rem" }}>
        <Textarea
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
          placeholder="Add a comment…"
        />
      </div>
    );
  },
};

export const CharacterCount: Story = {
  name: "With character count",
  parameters: { docs: { source: { code: textareaSnippets.characterCount } } },
  // `value`/`onChange`/`maxLength`/`showCount`/`placeholder` are all
  // driven by this story's own local state/fixed setup (the whole point
  // of the demo) — but every other prop (`size`/`hasError`/`disabled`/
  // etc.) still stays live via `{...args}`. Previously this story used a
  // bare `render: () => (...)` that ignored args entirely.
  //
  // `defaultValue: undefined` overrides the meta-level default, the same
  // controlled/uncontrolled conflict already found and fixed on Input's
  // own Clearable/CharacterCount stories — this story also sets its own
  // controlled `value` below, and without this override `{...args}`
  // would still spread the Playground's own `defaultValue: ""` onto the
  // same `<textarea>`. `defaultValue: { control: false }` below is the
  // other half of that same fix.
  //
  // `aria-label` added (found in review, matching Input's own identical
  // fix on its own CharacterCount story): this demo previously had no
  // associated label at all — a real, likely-genuine accessibility gap
  // flagged since 2026-08-16 (guidelines/01-vision-and-goals.md §12), not
  // a known/decided exemption like the disabled-state findings elsewhere.
  // The `a11y: { test: "todo" }` annotation that was masking it is
  // removed now that the actual gap is fixed.
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
      <div style={{ maxWidth: "24rem" }}>
        <Textarea
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
  parameters: { docs: { source: { code: textareaSnippets.characterCountLocale } } },
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
    <div dir="rtl" style={{ maxWidth: "24rem" }}>
      <Textarea {...args} defaultValue="مرحبا" maxLength={140} showCount formatNumber={new Intl.NumberFormat("ar-EG").format} aria-label="Bio" />
    </div>
  ),
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => textareaPlaygroundSnippet(context.args),
      },
    },
  },
  args: { hasError: true, defaultValue: "" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => textareaPlaygroundSnippet(context.args),
      },
    },
  },
  args: { disabled: true, defaultValue: "Can't edit this" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (fills container width)",
  parameters: { docs: { source: { code: textareaSnippets.narrowViewport } } },
  // `placeholder` is the whole point, fixed per instance — every other
  // prop (`size`/`hasError`/`disabled`/etc.) stays live via `{...args}`.
  // Previously this story used a bare `render: () => (...)` that ignored
  // args entirely — the same bug class already fixed on Input's own
  // identical story.
  //
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  argTypes: { placeholder: { control: false } },
  render: (args) => (
    <div style={{ width: "100%" }}>
      <Textarea {...args} placeholder="Full width on narrow screens" />
    </div>
  ),
};

export const TypingInteraction: Story = {
  name: "Interaction: typing updates value",
  args: { placeholder: "Comment", onInput: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText("Comment");
    await userEvent.type(textarea, "hello");
    await expect(textarea).toHaveValue("hello");
    await expect(args.onInput).toHaveBeenCalled();
  },
};

export const AutoResizeInteraction: Story = {
  name: "Interaction: typing multiple lines grows the textarea when autoResize is set",
  args: { autoResize: true, placeholder: "Type multiple lines…" },
  argTypes: { autoResize: { control: false }, placeholder: { control: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(
      "Type multiple lines…",
    ) as HTMLTextAreaElement;
    const initialHeight = textarea.getBoundingClientRect().height;
    await userEvent.type(
      textarea,
      "line one\nline two\nline three\nline four\nline five",
    );
    await expect(textarea.getBoundingClientRect().height).toBeGreaterThan(
      initialHeight,
    );
  },
};

export const BoundedAutoResizeInteraction: Story = {
  name: "Interaction: bounded auto-resize stops growing at maxRows and scrolls",
  args: {
    autoResize: true,
    minRows: 2,
    maxRows: 4,
    placeholder: "Bounded growth…",
  },
  argTypes: {
    autoResize: { control: false },
    minRows: { control: false },
    maxRows: { control: false },
    placeholder: { control: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(
      "Bounded growth…",
    ) as HTMLTextAreaElement;
    await userEvent.type(
      textarea,
      "one\ntwo\nthree\nfour\nfive\nsix\nseven\neight",
    );
    const heightAtMax = textarea.getBoundingClientRect().height;
    await userEvent.type(textarea, "\nnine\nten\neleven");
    // Height stays pinned at the maxRows ceiling once reached — it
    // doesn't keep growing for the extra lines typed after it.
    await expect(textarea.getBoundingClientRect().height).toBe(heightAtMax);
    // The excess content past maxRows scrolls internally instead — a
    // real overflow, not just a height that stopped changing.
    await expect(textarea.scrollHeight).toBeGreaterThan(
      textarea.clientHeight,
    );
  },
};

export const ClearButtonInteraction: Story = {
  name: "Interaction: clear button calls onClear and refocuses the textarea",
  args: { placeholder: "Comment", defaultValue: "hello", onClear: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText("Comment");
    const clearButton = canvas.getByRole("button", { name: "Clear" });

    await userEvent.click(clearButton);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    // `onClear` clearing the value is the caller's own responsibility (see
    // the component's own JSDoc) — this story's `args.onClear` is a bare
    // mock, so the value stays put; what's under test here is that the
    // click fires the callback and returns focus to the textarea, not
    // that clicking alone clears anything.
    await expect(textarea).toHaveFocus();
  },
};
