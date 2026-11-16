import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Fragment, useRef, useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { FormField } from "../FormField";
import { EditableText } from "./EditableText";
import type { EditableTextActions } from "./EditableText.types";
import { editableTextPlaygroundSnippet, editableTextSnippets } from "./EditableText.snippets";

const meta: Meta<typeof EditableText> = {
  title: "Components/EditableText",
  id: "molecules-inputs-editabletext",
  component: EditableText,
  parameters: { layout: "padded" },
  // The field and the committed value are kept by the component itself, so a changed `defaultValue`
  // control remounts it (an uncontrolled value would otherwise keep what it first mounted with).
  decorators: [
    (Story, context) => (
      <Fragment key={String(context.args.defaultValue)}>
        <Story />
      </Fragment>
    ),
  ],
  // Content-ish props first, then core visual props, then behavioural and state props, then the
  // advanced and escape-hatch props last (07 §4 item 3).
  argTypes: {
    defaultValue: {
      control: "text",
      description: "The initial committed value when uncontrolled.",
      table: { defaultValue: { summary: '""' } },
    },
    value: {
      control: false,
      description:
        "The committed value, when you own it. Pair with onValueChange. See the Controlled story for a live demo.",
    },
    onValueChange: {
      control: false,
      description:
        "Called with the new value when an edit is committed: Enter, the confirm button, or leaving the field under blurBehavior=commit. Never per keystroke, and not for a cancelled or unchanged edit.",
    },
    placeholder: {
      control: "text",
      description:
        "Shown in place of an empty value, as a button that can still be activated, and as the field's own placeholder.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Text size and padding, matching the shared size scale. The text and the field are the same height.",
      table: { defaultValue: { summary: "md" } },
    },
    multiline: {
      control: "boolean",
      description: "Edits in a Textarea that grows with its content. Enter adds a line and Ctrl or Cmd + Enter commits.",
      table: { defaultValue: { summary: "false" } },
    },
    inheritFont: {
      control: "boolean",
      description: "Takes the surrounding text's font size, family and weight, for a heading or a table cell.",
      table: { defaultValue: { summary: "false" } },
    },
    blurBehavior: {
      control: "radio",
      options: ["commit", "cancel"],
      description:
        "What happens to an edit when focus leaves the field: commit keeps it, cancel throws it away. A refused value keeps the field open.",
      table: { defaultValue: { summary: "commit" } },
    },
    activation: {
      control: "radio",
      options: ["click", "doubleClick"],
      description:
        "The gesture that starts editing. doubleClick suits a table cell; the keyboard still starts it with Enter or Space.",
      table: { defaultValue: { summary: "click" } },
    },
    showControls: {
      control: "boolean",
      description: "Shows a confirm and a cancel button beside the field, for touch screens, which have no Escape key.",
      table: { defaultValue: { summary: "false" } },
    },
    showEditIcon: {
      control: "boolean",
      description:
        "Shows a pencil after the text on hover and focus (always where there is no hover, and for an empty value).",
      table: { defaultValue: { summary: "true" } },
    },
    selectOnFocus: {
      control: "boolean",
      description: "Selects the whole value when the field opens, so typing replaces it.",
      table: { defaultValue: { summary: "true" } },
    },
    editing: {
      control: false,
      description:
        "Whether the field is showing, when you own it. A gesture asks through onEditingChange and leaves it alone until the prop changes.",
    },
    defaultEditing: {
      control: false,
      description: "Whether the field is showing at first, when uncontrolled. Does not move focus on mount.",
      table: { defaultValue: { summary: "false" } },
    },
    onEditingChange: {
      control: false,
      description: "Called when the component wants to start or stop editing, with the state it wants.",
    },
    required: {
      control: "boolean",
      description:
        "Refuses to commit an empty value, keeping the field open with labels.required. Does not stop a form submitting a value that was never edited.",
      table: { defaultValue: { summary: "false" } },
    },
    validateOn: {
      control: "radio",
      options: ["commit", "change"],
      description:
        "When required and validate are checked: as the edit ends (commit), or also as it is typed (change), showing the message while the draft is invalid.",
      table: { defaultValue: { summary: "commit" } },
    },
    enterKeyHint: {
      control: false,
      description:
        "What a phone's Enter key is labelled while editing. Unset it is Done for a single-line value, and the browser's own for multiline.",
    },
    spellCheck: {
      control: false,
      description: "Whether the browser checks the spelling of the field while editing. Turn it off for names and identifiers.",
    },
    autoCapitalize: {
      control: false,
      description: "Whether a phone capitalizes what is typed: off, words, sentences or characters.",
    },
    isLoading: {
      control: "boolean",
      description:
        "Shows the value as being saved: the field is set aside from editing without being disabled, a spinner shows, and Enter, Escape, the buttons and leaving do nothing. See the Saving story.",
      table: { defaultValue: { summary: "false" } },
    },
    showCount: {
      control: "boolean",
      if: { arg: "maxLength", truthy: true },
      description: "Shows a live current/max character count while editing. Only drawn when maxLength is set.",
      table: { defaultValue: { summary: "false" } },
    },
    formatNumber: {
      control: false,
      description:
        "How the numbers in the showCount counter are written, for a language or region whose numerals differ: given a number, returns the text to show.",
      table: { defaultValue: { summary: "(count) => String(count)" } },
    },
    onDraftChange: {
      control: false,
      description:
        "Called with the draft as it is typed, pasted or deleted while editing. Not called when the field opens or an edit is cancelled.",
    },
    renderValue: {
      control: false,
      description:
        "Draws the resting text from the value, for a currency, a date or a status, while the field edits the raw string. Used for a non-empty value only.",
    },
    actionRef: {
      control: false,
      description: "Receives { edit, commit, cancel } for starting or ending an edit from outside.",
    },
    validate: {
      control: false,
      description:
        "Checks a draft before it is committed: return a message to refuse it, or nothing to accept it. See the Validation story.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the value as invalid from outside, visually and (while editing) with aria-invalid.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents the text from being activated. It leaves the tab order and is drawn dimmed.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Shows the value as plain text with no way to edit it. Not dimmed, and still submitted under name.",
      table: { defaultValue: { summary: "false" } },
    },
    maxLength: {
      control: "number",
      description:
        "Maximum number of characters the field accepts. Needed for showCount's counter; unset, the field has no limit.",
    },
    minLength: {
      control: false,
      description: "Minimum number of characters the field asks for.",
    },
    inputMode: {
      control: false,
      description: "Hints which virtual keyboard a mobile device shows while editing.",
    },
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill while editing.",
    },
    minRows: {
      control: false,
      description: "The fewest rows the multi-line field shows. Only used with multiline.",
      table: { defaultValue: { summary: "1" } },
    },
    maxRows: {
      control: false,
      description: "The most rows the multi-line field grows to before it scrolls. Only used with multiline.",
    },
    name: {
      control: "text",
      description: "Form field name. The committed value is submitted under it through a hidden input.",
    },
    form: {
      control: false,
      description: "Associates the submitted value with a <form> by id.",
    },
    labels: {
      control: false,
      description:
        "The text the component writes itself: edit, confirm, cancel and required. An omitted or undefined entry keeps the English default.",
      table: { defaultValue: { summary: "—" } },
    },
    onFocus: {
      control: false,
      description: "Called once when focus arrives in the component, not for each move between its parts.",
    },
    onBlur: {
      control: false,
      description: "Called once when focus leaves the component as a whole, after any commit or cancel it caused.",
    },
    "aria-label": {
      control: "text",
      description:
        "What the value is, for assistive tech. It names the text's button together with the value, and the field while editing.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points to the id of a visible element to use as the name, typically a FieldLabel.",
    },
    "aria-describedby": {
      control: false,
      description: "Points to the id of helper or error text, applied to whichever of the button and the field is showing.",
    },
    id: {
      control: false,
      description: "DOM id of whichever of the text's button and the field is showing, so a label's htmlFor reaches it.",
    },
    className: {
      control: false,
      description: "Additional CSS classes, applied to the outer box in both modes.",
    },
    style: {
      control: false,
      description: "Inline styles, applied to the outer box in both modes.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier, applied to whichever of the text's button and the field is showing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real default (07 §5).
  args: {
    defaultValue: "Apollo",
    placeholder: "",
    size: "md",
    multiline: false,
    inheritFont: false,
    blurBehavior: "commit",
    activation: "click",
    showControls: false,
    showEditIcon: true,
    selectOnFocus: true,
    required: false,
    maxLength: 60,
    validateOn: "commit",
    isLoading: false,
    showCount: false,
    hasError: false,
    disabled: false,
    readOnly: false,
    name: "",
    "aria-label": "Project name",
  },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <EditableText {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof EditableText>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => editableTextPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: editableTextSnippets.allSizes } } },
  // Each instance sets its own size, so no single control value could represent them.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "20rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <EditableText key={size} {...args} size={size} aria-label={`Size ${size}`} defaultValue={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Multiline: Story = {
  parameters: { docs: { source: { code: editableTextSnippets.multiline } } },
  args: {
    multiline: true,
    placeholder: "Add notes",
    defaultValue: "Kick-off on Monday.\nBring the launch plan.",
    "aria-label": "Notes",
  },
};

export const WithControls: Story = {
  name: "With confirm and cancel buttons",
  parameters: { docs: { source: { code: editableTextSnippets.controls } } },
  args: { showControls: true },
};

export const DoubleClick: Story = {
  name: "Double click to edit",
  parameters: { docs: { source: { code: editableTextSnippets.doubleClick } } },
  args: { activation: "doubleClick", defaultValue: "Ada Lovelace", "aria-label": "Owner" },
};

export const CancelOnBlur: Story = {
  name: "Cancel on blur",
  parameters: { docs: { source: { code: editableTextSnippets.cancelOnBlur } } },
  args: { blurBehavior: "cancel", showControls: true },
};

export const Validation: Story = {
  parameters: { docs: { source: { code: editableTextSnippets.validation } } },
  // `validate` is this story's own; the rest stay live through args.
  args: { required: true },
  argTypes: { required: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <EditableText
        {...args}
        validate={(draft) => (draft.length > 20 ? "Keep it under 20 characters" : undefined)}
      />
    </div>
  ),
};

export const ValidateOnChange: Story = {
  name: "Validating as it is typed",
  parameters: { docs: { source: { code: editableTextSnippets.validateOnChange } } },
  args: { validateOn: "change", defaultValue: "ada", spellCheck: false, autoCapitalize: "off", "aria-label": "Username" },
  argTypes: { validateOn: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <EditableText
        {...args}
        validate={(draft) => (/^[a-z0-9_]{3,}$/.test(draft) ? undefined : "Use at least 3 letters, digits or underscores")}
      />
    </div>
  ),
};

export const InheritFont: Story = {
  name: "Inheriting the font",
  parameters: { docs: { source: { code: editableTextSnippets.inheritFont } } },
  args: { inheritFont: true, size: "lg", defaultValue: "Quarterly plan", "aria-label": "Page title" },
  // A styled `div`, not a real `h2`: a heading element here would also join the Docs page's table of contents.
  render: (args) => (
    <div style={{ fontSize: "var(--dbm-font-size-3xl)", fontWeight: 700, maxWidth: "28rem" }}>
      <EditableText {...args} />
    </div>
  ),
};

export const Placeholder: Story = {
  name: "Empty, with a placeholder",
  parameters: { docs: { source: { code: editableTextSnippets.placeholder } } },
  args: { defaultValue: "", placeholder: "Add a nickname", "aria-label": "Nickname" },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: { docs: { source: { code: editableTextSnippets.errorState } } },
  args: { hasError: true },
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: editableTextSnippets.disabled } } },
  args: { disabled: true },
};

export const ReadOnly: Story = {
  name: "Read-only",
  parameters: { docs: { source: { code: editableTextSnippets.readOnly } } },
  args: { readOnly: true, name: "project" },
};

export const Saving: Story = {
  parameters: { docs: { source: { code: editableTextSnippets.saving } } },
  // This story owns the value, whether the field is open, and the saving flag.
  argTypes: { defaultValue: { control: false }, isLoading: { control: false } },
  render: function SavingStory(args) {
    const [value, setValue] = useState("Apollo");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const pending = useRef(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "20rem" }}>
        <EditableText
          {...args}
          defaultValue={undefined}
          value={value}
          editing={editing}
          // Asked to close at the same moment as the commit: stay open until the request answers.
          onEditingChange={(next) => {
            if (!next && pending.current) return;
            setEditing(next);
          }}
          isLoading={saving}
          onValueChange={(next) => {
            pending.current = true;
            setSaving(true);
            setTimeout(() => {
              pending.current = false;
              setValue(next);
              setSaving(false);
              setEditing(false);
            }, 1500);
          }}
        />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>Saved: {value}</span>
      </div>
    );
  },
};

export const WithCounter: Story = {
  name: "With a character counter and a live draft",
  parameters: { docs: { source: { code: editableTextSnippets.counter } } },
  args: { multiline: true, maxLength: 160, showCount: true, defaultValue: "Builds rockets.", "aria-label": "Bio" },
  argTypes: { showCount: { control: false } },
  render: function CounterStory(args) {
    const [draft, setDraft] = useState("");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "20rem" }}>
        <EditableText {...args} onDraftChange={setDraft} />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>Draft: {draft || "—"}</span>
      </div>
    );
  },
};

export const FormattedValue: Story = {
  name: "Formatted value",
  parameters: { docs: { source: { code: editableTextSnippets.formattedValue } } },
  args: { defaultValue: "1250", "aria-label": "Price", inputMode: "decimal" },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <EditableText {...args} renderValue={(raw) => `$${Number(raw).toFixed(2)}`} />
    </div>
  ),
};

export const FromOutside: Story = {
  name: "Started from outside",
  parameters: { docs: { source: { code: editableTextSnippets.actionRef } } },
  render: function FromOutsideStory(args) {
    const actions = useRef<EditableTextActions>(null);
    return (
      <div style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "center", maxWidth: "24rem" }}>
        <div style={{ flex: "1 1 auto" }}>
          <EditableText {...args} actionRef={actions} />
        </div>
        <Button variant="secondary" size="sm" onClick={() => actions.current?.edit()}>
          Rename
        </Button>
      </div>
    );
  },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: editableTextSnippets.inFormField } } },
  // The FormField supplies the id, the name and the descriptions.
  argTypes: { "aria-label": { control: false } },
  render: ({ "aria-label": _name, ...args }) => (
    <div style={{ maxWidth: "20rem" }}>
      <FormField label="Project name" helperText="Shown on the dashboard">
        {(fieldProps) => <EditableText {...args} {...fieldProps} />}
      </FormField>
    </div>
  ),
};

export const Controlled: Story = {
  parameters: { docs: { source: { code: editableTextSnippets.controlled } } },
  // The story owns the value and whether the field is open, so those controls have nothing to drive.
  argTypes: { defaultValue: { control: false } },
  render: function ControlledStory(args) {
    const [value, setValue] = useState("Apollo");
    const [editing, setEditing] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "20rem" }}>
        <EditableText
          {...args}
          defaultValue={undefined}
          value={value}
          onValueChange={setValue}
          editing={editing}
          onEditingChange={setEditing}
        />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>
          Saved: {value} ({editing ? "editing" : "not editing"})
        </span>
      </div>
    );
  },
};

export const CommitInteraction: Story = {
  name: "Interaction: click, type and Enter commits once",
  tags: ["!dev"],
  args: { defaultValue: "Apollo", onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Project name/ }));
    const field = canvas.getByRole("textbox");
    await expect(field).toHaveFocus();
    await userEvent.keyboard("Gemini{Enter}");
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith("Gemini");
    await expect(canvas.getByRole("button", { name: /Gemini/ })).toHaveFocus();
  },
};

export const CancelInteraction: Story = {
  name: "Interaction: Escape throws the edit away",
  tags: ["!dev"],
  args: { defaultValue: "Apollo", onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Project name/ }));
    await userEvent.keyboard("Gemini{Escape}");
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole("button", { name: /Apollo/ })).toHaveFocus();
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled cannot be activated",
  tags: ["!dev"],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /Project name/ })).toBeDisabled();
  },
};
