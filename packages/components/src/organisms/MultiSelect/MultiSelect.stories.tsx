import { CheckCircleIcon, GlobeIcon, WarningIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { FormField } from "../../molecules/FormField";
import { MultiSelect } from "./MultiSelect";
import type { MultiSelectController, MultiSelectOption, MultiSelectProps } from "./MultiSelect.types";
import { multiSelectPlaygroundSnippet, multiSelectSnippets } from "./MultiSelect.snippets";
import { SearchingMultiSelect, countries, manyOptions, people, plans } from "./MultiSelectStoryKit";

// The Playground-only "None" choice for `highlightTone`: a story key, typed as the prop so it can be an arg.
const NONE = "none" as unknown as MultiSelectProps["highlightTone"];

const meta: Meta<typeof MultiSelect> = {
  title: "Organisms/Inputs/MultiSelect",
  component: MultiSelect,
  parameters: { layout: "padded" },
  // Content props first, then core visual props, then behavioural and state props, then the advanced and
  // escape-hatch props last (07 §4 item 3).
  argTypes: {
    options: {
      control: false,
      description:
        "The choices: an array of { value, label, textValue?, description?, icon?, disabled?, keywords?, group? }. Options with the same group are listed together under its heading.",
      table: { defaultValue: { summary: "[]" } },
    },
    value: {
      control: false,
      description:
        "The chosen values, as an array of option values, when you own them. Pair with onValueChange. A value with no option shows the value itself as its chip.",
    },
    defaultValue: {
      control: false,
      description: "The chosen values when uncontrolled.",
      table: { defaultValue: { summary: "[]" } },
    },
    onValueChange: {
      control: false,
      description:
        "Called with the new array of values and { source, option } when an option is added or removed. source is select, deselect, remove, clear, selectAll or create.",
    },
    inputValue: {
      control: false,
      description: "The text typed to narrow the list, when you own it. Pair with onInputValueChange.",
    },
    defaultInputValue: {
      control: false,
      description: "The typed text when uncontrolled.",
      table: { defaultValue: { summary: '""' } },
    },
    onInputValueChange: {
      control: false,
      description:
        "Called with the text and why it changed: input (typing), select (a choice cleared it), clear or reset. Fetch on input and ignore the rest.",
    },
    placeholder: {
      control: "text",
      description: "Shown while nothing is chosen and nothing is typed. Once there is a chip it goes.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the box, matching TagsInput's scale. The chips are one step smaller, and it also sets the height of the rows.",
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
      description: "The look of every chip, from Tag's own variants.",
      table: { defaultValue: { summary: "subtle" } },
    },
    overflow: {
      control: "radio",
      options: ["wrap", "collapse"],
      description:
        "What a closed field does with chips that do not fit: wrap onto more lines, or collapse to one line with as many chips as fit and a +N more button. It always shows every chip while it is in use.",
      table: { defaultValue: { summary: "wrap" } },
    },
    renderValue: {
      control: false,
      description:
        "Draws each chip's content yourself (an avatar and a name). Receives the option, or undefined for a value with no option, and the value. The tooltip, the remove button's name and the announcements still use the option's label.",
    },
    reorderable: {
      control: "boolean",
      description:
        "Lets chips be moved: drag one with a pointer or a finger, or press Space on its remove button, move it with the arrow keys and press Space to drop it (Escape cancels). Alt with an arrow key moves a chip one place. The order is what is submitted.",
      table: { defaultValue: { summary: "false" } },
    },
    maxVisible: {
      control: false,
      description: "The most chips shown while the field is idle; the rest are behind a +N more button. With overflow=collapse it is an upper limit on the number that fit.",
    },
    filter: {
      control: false,
      description:
        "How typing narrows the options: a function that decides for one option, or false to show options as given (when you filter or fetch yourself). The default matches every word, in any order, ignoring case and accents.",
      table: { defaultValue: { summary: "—" } },
    },
    autoHighlight: {
      control: "boolean",
      description: "Highlights the first match as the person types, so Enter chooses it. Off by default with allowCustomValue, where Enter commits what was typed.",
      // Two values (one with allowCustomValue), so the cell shows "—" and the description says which.
      table: { defaultValue: { summary: "—" } },
    },
    closeOnSelect: {
      control: "boolean",
      description: "Closes the list after each choice. By default it stays open so several can be chosen in a row.",
      table: { defaultValue: { summary: "false" } },
    },
    maxSelected: {
      control: false,
      description:
        "The most options that can be chosen. Once reached, the options not chosen are disabled with labels.limitReached as the reason.",
    },
    minSelected: {
      control: false,
      description: "The fewest options a form accepts. Only a form's validation reads it; a person can still remove chips below it.",
    },
    selectAll: {
      control: "boolean",
      description:
        "Adds a first row that chooses every enabled option the list shows (the matches, while text is typed), and removes them again. It stops at maxSelected.",
      table: { defaultValue: { summary: "false" } },
    },
    onSelectAll: {
      control: false,
      description:
        "Answers the Select all row for a list the page holds more of than is loaded: called with the typed text and the enabled options loaded now, it returns the options (or values) to choose, or a promise of them. The row waits meanwhile and only ever adds. Needs selectAll.",
    },
    selectGroups: {
      control: "boolean",
      description:
        "Adds a row under each group's heading that chooses every enabled option of that group the list shows, or removes them again when all are chosen. Stops at maxSelected.",
      table: { defaultValue: { summary: "false" } },
    },
    allowCustomValue: {
      control: "boolean",
      description:
        "Lets typed text be a chip of its own when it names no option: Enter with no option highlighted, a separator, a paste of several or leaving the field makes it a value. Text that is exactly an option's label chooses that option. A repeat, a refused value and one past maxSelected are refused with a message.",
      table: { defaultValue: { summary: "false" } },
    },
    separators: {
      control: false,
      description: "The characters that end a typed value with allowCustomValue: typing one, or pasting text with one (or a line break), makes a chip of what came before it.",
      table: { defaultValue: { summary: '[","]' } },
    },
    validate: {
      control: false,
      description: "Checks a typed value before it becomes a chip (allowCustomValue): return a message to refuse it, or nothing to accept it.",
    },
    clearable: {
      control: "boolean",
      description: "Shows a clear button while something is chosen or typed, which empties both.",
      table: { defaultValue: { summary: "true" } },
    },
    onClear: {
      control: false,
      description: "Called when the clear button is pressed, after the values and text have been emptied.",
    },
    loading: {
      control: "boolean",
      description: "Shows that options are on their way: a spinner in the field, and a Loading row while there are none to show.",
      table: { defaultValue: { summary: "false" } },
    },
    error: {
      control: "boolean",
      description: "Shows labels.error in a note under the options, and announces it. Fetching, and what an error means, is yours.",
      table: { defaultValue: { summary: "false" } },
    },
    emptyContent: {
      control: false,
      description: "Replaces the No results row with content of your own while no option matches.",
    },
    highlightTone: {
      control: "select",
      options: ["warning", "highlight", "success", "info", "danger"],
      description:
        "Adds colour (a background and a text colour) to the matched text in each label, from Highlight's tones. By default the match is only bold.",
      table: { defaultValue: { summary: "—" } },
    },
    onCreate: {
      control: false,
      description:
        "Offers a Create row at the end of the list while the typed text names no option. Called with the text when it is chosen: return the new option to have it chosen, nothing if you are handling it yourself, or a promise of either.",
    },
    renderOption: {
      control: false,
      description:
        "Draws an option's row yourself. Receives the option and whether it is highlighted and selected. Rows have a fixed height, so the content must fit.",
    },
    open: {
      control: false,
      description: "Whether the list is open, when you own it. Pair with onOpenChange.",
    },
    defaultOpen: {
      control: false,
      description: "Whether the list starts open when uncontrolled.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called whenever the list opens or closes.",
    },
    openOnFocus: {
      control: "boolean",
      description:
        "Opens the list when the entry gets focus. By default it opens on typing, on a press of the field or the toggle button, and on the arrow keys.",
      table: { defaultValue: { summary: "false" } },
    },
    hasError: {
      control: "boolean",
      description: "Marks the field as invalid, visually and with aria-invalid.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the field: no typing, no list, no removing, and the values are not submitted.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Stops the values being changed without disabling the field: the chips stay, with no remove buttons, the list does not open, and the values are still submitted.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Asks for at least one choice, and stops a surrounding form submitting without one.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Form field name. Each chosen value is submitted as its own entry under it.",
    },
    form: {
      control: false,
      description: "Associates the field with a <form> by id, for use outside one.",
    },
    autoFocus: {
      control: false,
      description: "Focuses the entry on mount. Use sparingly.",
      table: { defaultValue: { summary: "false" } },
    },
    inputMode: {
      control: false,
      description: "Hints which virtual keyboard a mobile device shows.",
    },
    enterKeyHint: {
      control: false,
      description: "What a phone's Enter key is labelled while the entry has focus.",
    },
    spellCheck: {
      control: false,
      description: "Whether the browser checks the spelling of the typed text. Turn it off for ids, codes and handles.",
    },
    autoComplete: {
      control: false,
      description: "The browser's own autofill hint. Off by default, since the list is the suggestion.",
      table: { defaultValue: { summary: "off" } },
    },
    container: {
      control: false,
      description:
        "The element the list is drawn inside, instead of the end of the page. Use it where a host confines its layers (a Dialog or Popover with its own container, a shadow root).",
    },
    presentation: {
      control: "select",
      options: ["anchored", "full-width"],
      description:
        "How the list is drawn: anchored (under the field, as wide as it) or full-width (across the visible screen, above or below the field, whichever has room once an on-screen keyboard is counted). Takes a map to change with the screen, such as { base: full-width, sm: anchored }.",
      table: { defaultValue: { summary: "anchored" } },
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Which side of the field the list opens on; it moves to the other side when there is no room.",
      table: { defaultValue: { summary: "bottom" } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment of the list along the chosen side.",
      table: { defaultValue: { summary: "start" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "Text direction of the field and its list. It is not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    formatNumber: {
      control: false,
      description:
        "How the numbers in the default announcements and the +N more button are written, for a language or region whose numerals differ. Plain String when left out.",
      table: { defaultValue: { summary: "—" } },
    },
    labels: {
      control: false,
      description:
        "The text the component writes itself: clear, toggle, remove, noResults, results, added, removed and the rest. An omitted or undefined entry keeps the English default.",
      table: { defaultValue: { summary: "—" } },
    },
    controllerRef: {
      control: false,
      description: "Receives an object that opens, closes, clears and focuses the field from code. Its identity never changes.",
    },
    "aria-label": {
      control: "text",
      description: "Names the field for assistive tech. The list takes the same name.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points to the id of a visible element to use as the name, typically a FieldLabel.",
    },
    "aria-describedby": {
      control: false,
      description: "Points to the id of helper or error text.",
    },
    "aria-invalid": {
      control: false,
      description: "Marks the entry as invalid for assistive technology. Also set by hasError.",
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
    options: countries,
    placeholder: "Search countries",
    size: "md",
    tone: "brand",
    variant: "subtle",
    overflow: "wrap",
    autoHighlight: true,
    closeOnSelect: false,
    reorderable: false,
    selectAll: false,
    selectGroups: false,
    allowCustomValue: false,
    clearable: true,
    loading: false,
    error: false,
    openOnFocus: false,
    hasError: false,
    disabled: false,
    readOnly: false,
    required: false,
    name: "",
    presentation: "anchored",
    side: "bottom",
    align: "start",
    dir: "ltr",
    "aria-label": "Countries",
  },
  // The list opens below the field, so the story reserves room for it rather than letting it overlap the page.
  render: (args) => (
    <div style={{ maxWidth: "26rem", minHeight: "22rem" }}>
      <MultiSelect {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof MultiSelect>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => multiSelectPlaygroundSnippet(context.args),
    },
  },
};

const inStage = (node: React.ReactNode) => <div style={{ maxWidth: "26rem", minHeight: "22rem" }}>{node}</div>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
  // "None" is a choice only here: leaving highlightTone out is what the prop's default does. A limit has no
  // default, so it is given a demo value (and a control) for the list to show.
  argTypes: {
    highlightTone: {
      control: "select",
      options: ["none", "warning", "highlight", "success", "info", "danger"],
      mapping: { none: undefined },
    },
    maxSelected: { control: "number" },
  },
  // The control's "none" key is mapped to undefined above, which the prop's type doesn't name.
  args: { highlightTone: NONE, maxSelected: 8 },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: multiSelectSnippets.allSizes } } },
  // Each instance sets its own size, so no single control value could represent them.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "26rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <MultiSelect key={size} {...args} size={size} aria-label={`Size ${size}`} placeholder={`Size ${size}`} defaultValue={["ca"]} />
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  parameters: { docs: { source: { code: multiSelectSnippets.controlled } } },
  render: function ControlledStory(args) {
    const [chosen, setChosen] = useState<string[]>(["ca", "us"]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "26rem", minHeight: "22rem" }}>
        <MultiSelect {...args} value={chosen} onValueChange={setChosen} />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>Values: {chosen.length > 0 ? chosen.join(", ") : "—"}</span>
      </div>
    );
  },
};

export const CloseOnSelect: Story = {
  name: "Closing the list after each choice",
  parameters: { docs: { source: { code: multiSelectSnippets.closeOnSelect } } },
  args: { closeOnSelect: true },
};

/** Choose several in a row, and take one out again. */
export const ChooseSeveralInteraction: Story = {
  name: "Choosing several — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const field = within(canvasElement).getByRole("combobox");
    await userEvent.click(field);
    await userEvent.click(await body.findByRole("option", { name: "Brazil" }));
    await userEvent.click(await body.findByRole("option", { name: "Chile" }));
    await expect(body.getByRole("list", { name: "Selected options" })).toHaveTextContent("BrazilChile");
    // choosing a chosen option takes it out again
    await userEvent.click(await body.findByRole("option", { name: "Brazil" }));
    await waitFor(() => expect(body.getByRole("list", { name: "Selected options" })).not.toHaveTextContent("Brazil"));
    // the keyboard reaches a chip, and a second Backspace removes it
    await userEvent.keyboard("{Escape}{Backspace}");
    await expect(body.getByRole("button", { name: "Remove Chile" })).toHaveFocus();
    await userEvent.keyboard("{Backspace}");
    await waitFor(() => expect(body.queryByRole("button", { name: "Remove Chile" })).toBeNull());
  },
};

export const Groups: Story = {
  name: "Groups",
  parameters: { docs: { source: { code: multiSelectSnippets.groups } } },
  args: { options: plans.map(({ description: _description, disabled: _disabled, ...option }) => option), "aria-label": "Plans", placeholder: "Choose plans" },
};

export const Rich: Story = {
  name: "Descriptions, icons and unavailable options",
  parameters: { docs: { source: { code: multiSelectSnippets.rich } } },
  args: {
    options: plans.map((option) => ({ ...option, group: undefined, icon: option.disabled ? undefined : GlobeIcon })),
    "aria-label": "Plans",
    placeholder: "Choose plans",
  },
};

export const MaxSelected: Story = {
  name: "A limit",
  parameters: { docs: { source: { code: multiSelectSnippets.maxSelected } } },
  argTypes: { maxSelected: { control: "number" } },
  args: {
    maxSelected: 3,
    defaultValue: ["bug", "design"],
    options: [
      { value: "bug", label: "Bug" },
      { value: "design", label: "Design" },
      { value: "docs", label: "Docs" },
      { value: "perf", label: "Performance" },
      { value: "a11y", label: "Accessibility" },
    ],
    "aria-label": "Labels",
    placeholder: "Up to three labels",
  },
};

export const SelectAll: Story = {
  name: "A Select all row",
  parameters: { docs: { source: { code: multiSelectSnippets.selectAll } } },
  args: { selectAll: true, options: people.filter((person) => !person.disabled), "aria-label": "Teams", placeholder: "Choose people" },
};

export const SelectAllInteraction: Story = {
  ...SelectAll,
  name: "A Select all row — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await userEvent.click(within(canvasElement).getByRole("combobox"));
    await userEvent.click(await body.findByRole("option", { name: "Select all" }));
    await expect(body.getAllByRole("button", { name: /^Remove / })).toHaveLength(6);
    await userEvent.click(await body.findByRole("option", { name: "Deselect all" }));
    await waitFor(() => expect(body.queryAllByRole("button", { name: /^Remove / })).toHaveLength(0));
  },
};

export const PerOption: Story = {
  name: "A tone, an icon or content for each chip",
  parameters: { docs: { source: { code: multiSelectSnippets.perOption } } },
  // The story owns the options and how each chip is drawn.
  argTypes: { options: { control: false }, tone: { control: false } },
  args: { "aria-label": "Assignees", placeholder: "Assign people" },
  render: (args) =>
    inStage(
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
        <MultiSelect
          {...args}
          aria-label="Status"
          placeholder="Choose statuses"
          options={[
            { value: "done", label: "Done", tone: "success", chipIcon: CheckCircleIcon },
            { value: "blocked", label: "Blocked", tone: "danger", chipIcon: WarningIcon },
            { value: "open", label: "Open", tone: "info" },
            { value: "later", label: "Later", tone: "neutral" },
          ]}
          defaultValue={["done", "blocked"]}
        />
        <MultiSelect
          {...args}
          options={people.map((person) => ({ ...person, description: undefined }))}
          defaultValue={["ada", "grace"]}
          renderValue={(option) => (
            <span style={{ alignItems: "center", display: "inline-flex", gap: "var(--dbm-space-1)" }}>
              <span
                aria-hidden="true"
                style={{
                  alignItems: "center",
                  backgroundColor: "var(--dbm-bg-brand)",
                  borderRadius: "var(--dbm-radius-full)",
                  color: "var(--dbm-text-on-brand)",
                  display: "inline-flex",
                  fontSize: "var(--dbm-font-size-xs)",
                  fontWeight: "var(--dbm-font-weight-semibold)",
                  justifyContent: "center",
                  minBlockSize: "var(--dbm-space-4)",
                  minInlineSize: "var(--dbm-space-4)",
                }}
              >
                {option?.label.charAt(0)}
              </span>
              {option?.label}
            </span>
          )}
        />
      </div>,
    ),
};

export const Reorderable: Story = {
  name: "Moving chips",
  parameters: { docs: { source: { code: multiSelectSnippets.reorderable } } },
  args: { reorderable: true, "aria-label": "Columns", placeholder: "Choose columns", options: [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "role", label: "Role" },
    { value: "team", label: "Team" },
    { value: "joined", label: "Joined" },
  ] },
  render: function ReorderableStory(args) {
    const [columns, setColumns] = useState<string[]>(["name", "email", "role", "team"]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "26rem", minHeight: "20rem" }}>
        <MultiSelect {...args} value={columns} onValueChange={setColumns} />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>Order: {columns.join(" → ") || "—"}</span>
      </div>
    );
  },
};

export const SelectAllFromThePage: Story = {
  name: "Select all, answered by the page",
  parameters: { docs: { source: { code: multiSelectSnippets.selectAllRemote } } },
  // The story owns the options, the loading flag and the fetching.
  argTypes: { loading: { control: false }, options: { control: false }, selectAll: { control: false } },
  render: (args) =>
    inStage(
      <SearchingMultiSelect
        {...args}
        selectAll
        onSelectAll={async ({ text }) => {
          await new Promise((done) => window.setTimeout(done, 500));
          return countries.filter((country) => country.label.toLowerCase().includes(text.trim().toLowerCase())).map((country) => country.value);
        }}
      />,
    ),
};

export const GroupSelectAll: Story = {
  name: "A Select all row in each group",
  parameters: { docs: { source: { code: multiSelectSnippets.groupSelectAll } } },
  args: {
    selectGroups: true,
    options: [
      { value: "apple", label: "Apple", group: "Fruit" },
      { value: "apricot", label: "Apricot", group: "Fruit" },
      { value: "cherry", label: "Cherry", group: "Fruit" },
      { value: "carrot", label: "Carrot", group: "Vegetables" },
      { value: "kale", label: "Kale", group: "Vegetables" },
      { value: "salt", label: "Salt" },
    ],
    "aria-label": "Ingredients",
    placeholder: "Choose ingredients",
  },
};

export const CustomValues: Story = {
  name: "Typed values as chips",
  parameters: { docs: { source: { code: multiSelectSnippets.customValues } } },
  args: {
    allowCustomValue: true,
    "aria-label": "Recipients",
    placeholder: "Choose, or type an email address",
    options: [
      { value: "ada@example.com", label: "Ada Lovelace" },
      { value: "grace@example.com", label: "Grace Hopper" },
      { value: "alan@example.com", label: "Alan Turing" },
    ],
  },
  render: (args) =>
    inStage(<MultiSelect {...args} validate={(text) => (/^\S+@\S+\.\S+$/.test(text) ? undefined : "Not an email address")} />),
};

export const Overflow: Story = {
  name: "Many chips",
  parameters: { docs: { source: { code: multiSelectSnippets.overflow } } },
  // Each instance sets its own overflow, so no single control value could represent them.
  argTypes: { overflow: { control: false }, maxVisible: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "22rem", minHeight: "22rem" }}>
      <MultiSelect {...args} options={people} aria-label="Wrapping" defaultValue={["ada", "grace", "alan", "katherine", "margaret"]} />
      <MultiSelect {...args} options={people} aria-label="Collapsing" overflow="collapse" defaultValue={["ada", "grace", "alan", "katherine", "margaret"]} />
      <MultiSelect {...args} options={people} aria-label="Two at most" maxVisible={2} defaultValue={["ada", "grace", "alan", "katherine", "margaret"]} />
    </div>
  ),
};

export const ChipLook: Story = {
  name: "The look of the chips",
  parameters: { docs: { source: { code: multiSelectSnippets.chipLook } } },
  // Each instance sets its own tone and variant.
  argTypes: { tone: { control: false }, variant: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "26rem" }}>
      <MultiSelect {...args} aria-label="Subtle" defaultValue={["ca", "us"]} />
      <MultiSelect {...args} aria-label="Solid" variant="solid" tone="neutral" defaultValue={["ca", "us"]} />
      <MultiSelect {...args} aria-label="Outlined" variant="outlined" tone="success" defaultValue={["ca", "us"]} />
    </div>
  ),
};

export const Async: Story = {
  name: "Options fetched as you type",
  parameters: { docs: { source: { code: multiSelectSnippets.async } } },
  // The story owns the options, the loading flag and the filter, so those controls would do nothing.
  argTypes: { loading: { control: false }, options: { control: false } },
  render: (args) => inStage(<SearchingMultiSelect {...args} />),
};

export const Create: Story = {
  name: "Creating new options",
  parameters: { docs: { source: { code: multiSelectSnippets.create } } },
  // The story owns the options, and onCreate is what it demonstrates.
  argTypes: { options: { control: false } },
  args: { "aria-label": "Labels", placeholder: "Choose or add a label" },
  render: function CreateStory(args) {
    const [options, setOptions] = useState<MultiSelectOption[]>([
      { value: "bug", label: "Bug" },
      { value: "design", label: "Design" },
      { value: "docs", label: "Docs" },
    ]);
    return inStage(
      <MultiSelect
        {...args}
        options={options}
        onCreate={(text) => {
          const option = { value: text.toLowerCase(), label: text };
          setOptions((current) => [...current, option]);
          return option;
        }}
      />,
    );
  },
};

export const FullWidth: Story = {
  name: "Full width on a phone",
  parameters: {
    docs: { source: { code: multiSelectSnippets.fullWidth } },
    // Pinned to a phone width in the Storybook UI; on a Docs page it sits in the wide page like any other story.
  },
  globals: { viewport: { value: "mobile1", isRotated: false } },
  // The story sets the presentation as a map, which no select can express.
  argTypes: { presentation: { control: false } },
  render: (args) => (
    <div style={{ minHeight: "26rem" }}>
      <MultiSelect {...args} presentation={{ base: "full-width", sm: "anchored" }} />
    </div>
  ),
};

export const States: Story = {
  name: "Loading, error and empty",
  parameters: { docs: { source: { code: multiSelectSnippets.states } } },
  // Each instance sets its own state.
  argTypes: { loading: { control: false }, error: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "26rem", minHeight: "30rem" }}>
      <MultiSelect {...args} aria-label="Loading" placeholder="Loading" options={[]} loading />
      <MultiSelect {...args} aria-label="Error" placeholder="Error" error />
      <MultiSelect {...args} aria-label="Empty" placeholder="Type something that matches nothing" emptyContent="No country by that name" />
    </div>
  ),
};

export const LongList: Story = {
  name: "A long list",
  parameters: { docs: { source: { code: multiSelectSnippets.longList } } },
  args: { options: manyOptions, "aria-label": "Items", placeholder: "Search 2,000 items" },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: { docs: { source: { code: multiSelectSnippets.error } } },
  args: { hasError: true },
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: multiSelectSnippets.disabled } } },
  // The two instances set their own state.
  argTypes: { disabled: { control: false }, readOnly: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "26rem" }}>
      <MultiSelect {...args} aria-label="Disabled" defaultValue={["ca", "us"]} disabled />
      <MultiSelect {...args} aria-label="Read-only" defaultValue={["ca", "us"]} readOnly />
    </div>
  ),
};

export const FromCode: Story = {
  name: "Driven from code",
  parameters: { docs: { source: { code: multiSelectSnippets.controller } } },
  render: function FromCodeStory(args) {
    const controllerRef = useRef<MultiSelectController>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "26rem", minHeight: "22rem" }}>
        <MultiSelect {...args} controllerRef={controllerRef} defaultValue={["ca", "us"]} />
        <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
          <Button size="sm" variant="secondary" onClick={() => controllerRef.current?.open()}>
            Open
          </Button>
          <Button size="sm" variant="secondary" onClick={() => controllerRef.current?.clear()}>
            Clear
          </Button>
        </div>
      </div>
    );
  },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: multiSelectSnippets.inFormField } } },
  // The FormField sets these from its own props, and the story fixes the name and the minimum.
  argTypes: { required: { control: false }, disabled: { control: false }, hasError: { control: false }, name: { control: false } },
  render: (args) =>
    inStage(
      <FormField label="Countries" helperText="Where the order ships" required>
        {(fieldProps) => <MultiSelect {...args} {...fieldProps} name="countries" minSelected={2} />}
      </FormField>,
    ),
};

/** Move a chip with the keyboard, and take it back. */
export const ReorderInteraction: Story = {
  ...Reorderable,
  name: "Moving chips — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const canvas = within(canvasElement);
    const chipsText = () => within(canvas.getByRole("list", { name: "Selected options" })).getAllByRole("listitem").map((item) => item.textContent).filter(Boolean);
    canvas.getByRole("combobox").focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft} {ArrowLeft}");
    await expect(chipsText()).toEqual(["Name", "Role", "Email", "Team"]);
    await userEvent.keyboard("{Escape}");
    await expect(chipsText()).toEqual(["Name", "Email", "Role", "Team"]);
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await expect(chipsText()).toEqual(["Name", "Email", "Team", "Role"]);
    await expect(body.getByRole("button", { name: "Remove Role" })).toHaveFocus();
  },
};

/** Type values, and have one refused. */
export const CustomValuesInteraction: Story = {
  ...CustomValues,
  name: "Typed values as chips — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "new@example.com,nobody{Enter}");
    await expect(await canvas.findByText("Not an email address")).toBeInTheDocument();
    await expect(canvas.getByRole("list", { name: "Selected options" })).toHaveTextContent("new@example.com");
  },
};
