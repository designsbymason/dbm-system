import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { FormField } from "../FormField";
import { TagsInput } from "./TagsInput";
import { tagsInputPlaygroundSnippet, tagsInputSnippets } from "./TagsInput.snippets";

const meta: Meta<typeof TagsInput> = {
  title: "Components/TagsInput",
  id: "molecules-inputs-tagsinput",
  component: TagsInput,
  parameters: { layout: "padded" },
  // Content props first, then core visual props, then behavioural and state props, then the advanced and
  // escape-hatch props last (07 §4 item 3).
  argTypes: {
    defaultValue: {
      control: false,
      description: "The initial tags when uncontrolled, as an array of strings.",
      table: { defaultValue: { summary: "[]" } },
    },
    value: {
      control: false,
      description: "The tags, when you own them. Pair with onValueChange. See the Controlled story for a live demo.",
    },
    onValueChange: {
      control: false,
      description: "Called with the new array of tags each time one is added or removed.",
    },
    inputValue: {
      control: false,
      description: "The text typed but not yet made into a tag, when you own it. Pair with onInputValueChange.",
    },
    defaultInputValue: {
      control: false,
      description: "The initial pending text when uncontrolled.",
      table: { defaultValue: { summary: '""' } },
    },
    onInputValueChange: {
      control: false,
      description: "Called with the pending text as it changes: typed, pasted, cleared, or emptied by adding a tag.",
    },
    placeholder: {
      control: "text",
      description: "Shown while there are no tags; it goes once there is one.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the box, matching the shared size scale. The chips are one step smaller.",
      table: { defaultValue: { summary: "md" } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral", "info", "success", "warning", "highlight", "danger"],
      description: "The colour of every chip, from Tag's own tones.",
      table: { defaultValue: { summary: "brand" } },
    },
    variant: {
      control: "select",
      options: ["subtle", "solid", "outlined"],
      description: "The treatment of every chip, from Tag's own variants.",
      table: { defaultValue: { summary: "subtle" } },
    },
    separators: {
      control: false,
      description:
        "The strings that end a tag when typed or pasted. Enter always adds, and a paste is also split at line breaks and tabs.",
      table: { defaultValue: { summary: '[","]' } },
    },
    addOnBlur: {
      control: "boolean",
      description: "Makes a tag of the typed text when focus leaves the field, so a value typed but not confirmed is not lost.",
      table: { defaultValue: { summary: "true" } },
    },
    transform: {
      control: false,
      description: "Normalizes each piece before it is checked and added. A piece that comes out empty is dropped.",
      table: { defaultValue: { summary: "(raw) => raw.trim()" } },
    },
    validate: {
      control: false,
      description: "Checks a tag before it is added: return a message to refuse it, or nothing to accept it. See the Validation story.",
    },
    invalidBehavior: {
      control: "radio",
      options: ["refuse", "flag"],
      description:
        "What happens to a tag validate rejects: refuse keeps it out and leaves the text in the entry; flag adds it in the danger tone and stops a form submitting until it is fixed or removed.",
      table: { defaultValue: { summary: "refuse" } },
    },
    allowDuplicates: {
      control: "boolean",
      description: "Allows the same tag more than once. By default a repeat is refused with labels.duplicate.",
      table: { defaultValue: { summary: "false" } },
    },
    maxTags: {
      control: false,
      description: "The most tags the field holds. Adding more is refused with labels.maxReached.",
    },
    maxTagLength: {
      control: false,
      description: "The most characters a single tag may have (the entry's native maxLength).",
    },
    showCount: {
      control: "boolean",
      if: { arg: "maxTags", truthy: true },
      description: "Shows a live count/max after the tags. Only drawn when maxTags is set.",
      table: { defaultValue: { summary: "false" } },
    },
    overflow: {
      control: "radio",
      options: ["wrap", "collapse"],
      description:
        "What a long row does while the field is not in use: wrap onto further lines, or collapse to one line with as many chips as fit and a +N more button that follows the width. Every tag shows (and wraps) while the entry or a chip has focus.",
      table: { defaultValue: { summary: "wrap" } },
    },
    maxVisible: {
      control: false,
      description:
        "Collapses a long row while the field is not in use: only this many chips show, then a +N more button. Every tag shows while the entry or a chip has focus.",
    },
    clearable: {
      control: "boolean",
      description: "Shows a clear-all button after the tags once there are any.",
      table: { defaultValue: { summary: "false" } },
    },
    onTagAdd: {
      control: false,
      description: "Called for each tag as it is added, after onValueChange, with where it came from: enter, separator, blur or paste.",
    },
    onTagRemove: {
      control: false,
      description:
        "Called for each tag as it is removed, after onValueChange, with its position and what removed it: backspace, button, keyboard or clear.",
    },
    required: {
      control: "boolean",
      description: "Asks for at least one tag, and stops a surrounding form submitting with none.",
      table: { defaultValue: { summary: "false" } },
    },
    hasError: {
      control: "boolean",
      description: "Marks the field as invalid, visually and with aria-invalid on the entry.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the field: no typing, no removing, dimmed.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Shows the tags with no way to change them, without dimming. Still submitted under name.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Form field name. Each tag is submitted as its own value under it, through hidden inputs.",
    },
    form: {
      control: false,
      description: "Associates the submitted values with a <form> by id.",
    },
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill for the entry.",
    },
    inputMode: {
      control: false,
      description: "Hints which virtual keyboard a mobile device shows for the entry.",
    },
    enterKeyHint: {
      control: false,
      description: "What a phone's Enter key is labelled for the entry.",
      table: { defaultValue: { summary: "done" } },
    },
    spellCheck: {
      control: false,
      description: "Whether the browser checks the spelling of the entry. Turn it off for emails and handles.",
    },
    autoCapitalize: {
      control: false,
      description: "Whether a phone capitalizes what is typed: off for emails and handles.",
    },
    formatNumber: {
      control: false,
      description:
        "How the numbers in the default maxReached and pasted messages are written, for a language or region whose numerals differ.",
      table: { defaultValue: { summary: "(n) => String(n)" } },
    },
    labels: {
      control: false,
      description:
        "The text the component writes itself: remove, clear, added, removed, duplicate, tooLong, maxReached, pasted, required, flagged, invalid, more, less and chipsHint. An omitted or undefined entry keeps the English default.",
      table: { defaultValue: { summary: "—" } },
    },
    "aria-label": {
      control: "text",
      description: "Names the field for assistive tech, for the group and for the entry.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points to the id of a visible element to use as the name, typically a FieldLabel.",
    },
    "aria-describedby": {
      control: false,
      description: "Points to the id of helper or error text, applied to the group and the entry.",
    },
    id: {
      control: false,
      description: "DOM id of the entry input, so a label's htmlFor reaches it.",
    },
    className: {
      control: false,
      description: "Additional CSS classes, applied to the outer box.",
    },
    style: {
      control: false,
      description: "Inline styles, applied to the outer box.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier, applied to the entry input.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real default (07 §5).
  args: {
    defaultValue: ["design", "urgent"],
    placeholder: "Add a label",
    size: "md",
    tone: "brand",
    variant: "subtle",
    addOnBlur: true,
    invalidBehavior: "refuse",
    overflow: "wrap",
    allowDuplicates: false,
    showCount: false,
    clearable: false,
    required: false,
    hasError: false,
    disabled: false,
    readOnly: false,
    name: "",
    "aria-label": "Labels",
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <TagsInput {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof TagsInput>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => tagsInputPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
  // A tag limit has no default: it is given a demo value here (and a control) so the counter can be tried.
  args: { maxTags: 8 },
  argTypes: { maxTags: { control: "number" } },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: tagsInputSnippets.allSizes } } },
  // Each instance sets its own size, so no single control value could represent them.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "24rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <TagsInput key={size} {...args} size={size} aria-label={`Size ${size}`} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  parameters: { docs: { source: { code: tagsInputSnippets.controlled } } },
  // The story owns the tags, so the initial value has nothing to drive.
  argTypes: { defaultValue: { control: false } },
  render: function ControlledStory(args) {
    const [tags, setTags] = useState(["design", "urgent"]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "24rem" }}>
        <TagsInput {...args} defaultValue={undefined} value={tags} onValueChange={setTags} />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>{tags.length} tags: {tags.join(", ") || "—"}</span>
      </div>
    );
  },
};

export const Separators: Story = {
  name: "Other separators",
  parameters: { docs: { source: { code: tagsInputSnippets.separators } } },
  args: { defaultValue: [], placeholder: "Type or paste emails", "aria-label": "Emails" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <TagsInput {...args} separators={[",", ";", " "]} />
    </div>
  ),
};

export const Limit: Story = {
  name: "Limited",
  parameters: { docs: { source: { code: tagsInputSnippets.limit } } },
  args: { maxTags: 5, defaultValue: ["a", "b", "c", "d"], placeholder: "Up to five" },
  argTypes: { maxTags: { control: "number" } },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <TagsInput {...args} maxTagLength={20} />
    </div>
  ),
};

export const Validation: Story = {
  parameters: { docs: { source: { code: tagsInputSnippets.validation } } },
  args: { defaultValue: [], placeholder: "Add an email", "aria-label": "Recipients" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <TagsInput
        {...args}
        spellCheck={false}
        autoCapitalize="off"
        validate={(tag) => (/^\S+@\S+\.\S+$/.test(tag) ? undefined : "Not an email address")}
      />
    </div>
  ),
};

export const Transform: Story = {
  name: "Normalizing each tag",
  parameters: { docs: { source: { code: tagsInputSnippets.transform } } },
  args: { defaultValue: [], placeholder: "Try #Design", "aria-label": "Topics" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <TagsInput {...args} transform={(raw) => raw.trim().replace(/^#/, "").toLowerCase()} />
    </div>
  ),
};

export const Flagging: Story = {
  name: "Flagging invalid tags",
  parameters: { docs: { source: { code: tagsInputSnippets.flagging } } },
  args: { invalidBehavior: "flag", defaultValue: ["ada@example.com", "not-an-email"], "aria-label": "Recipients", placeholder: "Add an email" },
  argTypes: { invalidBehavior: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <TagsInput
        {...args}
        spellCheck={false}
        autoCapitalize="off"
        validate={(tag) => (/^\S+@\S+\.\S+$/.test(tag) ? undefined : "Not an email address")}
      />
    </div>
  ),
};

export const WithCounter: Story = {
  name: "With a counter",
  parameters: playgroundSource,
  args: { maxTags: 5, showCount: true, defaultValue: ["design", "urgent"] },
  argTypes: { maxTags: { control: "number" } },
};

export const Collapsed: Story = {
  name: "Collapsing a long row",
  parameters: playgroundSource,
  // `maxVisible` has no value in the other stories, so its control is off there; here it is the point.
  argTypes: { maxVisible: { control: "number" } },
  args: {
    maxVisible: 3,
    defaultValue: ["design", "engineering", "accessibility", "urgent", "review", "qa", "launch"],
  },
};

export const FitToWidth: Story = {
  name: "Collapsing to fit the width",
  parameters: { docs: { source: { code: tagsInputSnippets.fitToWidth } } },
  // `overflow` is the point of this story, and the box can be dragged narrower or wider to see the count follow.
  argTypes: { overflow: { control: false } },
  args: {
    overflow: "collapse",
    defaultValue: ["design", "engineering", "accessibility", "urgent", "review", "qa", "launch", "marketing"],
  },
  render: (args) => (
    <div
      style={{
        width: "30rem",
        maxWidth: "100%",
        minWidth: "8rem",
        resize: "horizontal",
        overflow: "auto",
        padding: "var(--dbm-space-2)",
        border: "1px dashed var(--dbm-border-default)",
      }}
    >
      <TagsInput {...args} />
    </div>
  ),
};

export const Duplicates: Story = {
  name: "Allowing repeats",
  parameters: playgroundSource,
  args: { allowDuplicates: true, defaultValue: ["egg", "egg"], "aria-label": "Ingredients" },
};

export const Clearable: Story = {
  name: "With a clear-all button",
  parameters: playgroundSource,
  args: { clearable: true, defaultValue: ["design", "urgent", "review"] },
};

export const Tones: Story = {
  name: "Tone and variant",
  parameters: playgroundSource,
  args: { tone: "success", variant: "outlined" },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: playgroundSource,
  args: { hasError: true, defaultValue: ["design"] },
};

export const Disabled: Story = {
  parameters: playgroundSource,
  args: { disabled: true },
};

export const ReadOnly: Story = {
  name: "Read-only",
  parameters: playgroundSource,
  args: { readOnly: true, name: "labels" },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: tagsInputSnippets.inFormField } } },
  // The FormField supplies the id, the name and the descriptions.
  argTypes: { "aria-label": { control: false } },
  render: ({ "aria-label": _name, ...args }) => (
    <div style={{ maxWidth: "24rem" }}>
      <FormField label="Labels" helperText="Press Enter or type a comma to add one">
        {(fieldProps) => <TagsInput {...args} {...fieldProps} name="labels" />}
      </FormField>
    </div>
  ),
};

export const AddInteraction: Story = {
  name: "Interaction: Enter adds, a comma adds, Backspace removes the last",
  tags: ["!dev"],
  args: { defaultValue: [], onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const entry = canvas.getByRole("textbox");
    await userEvent.click(entry);
    await userEvent.keyboard("one{Enter}");
    await userEvent.keyboard("two,");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["one", "two"]);
    await userEvent.keyboard("{Backspace}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["one"]);
    await expect(canvas.queryByText("two")).toBeNull();
  },
};

export const RefusalInteraction: Story = {
  name: "Interaction: a repeat is refused and the text stays",
  tags: ["!dev"],
  args: { defaultValue: ["design"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("textbox"));
    await userEvent.keyboard("design{Enter}");
    await expect(canvas.getByRole("alert")).toHaveTextContent("design is already added");
    await expect((canvas.getByRole("textbox") as HTMLInputElement).value).toBe("design");
  },
};
