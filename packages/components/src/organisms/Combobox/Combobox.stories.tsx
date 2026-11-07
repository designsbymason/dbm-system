import { GlobeIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FormField } from "../../molecules/FormField";
import { Combobox } from "./Combobox";
import type { ComboboxProps } from "./Combobox.types";
import { comboboxPlaygroundSnippet, comboboxSnippets } from "./Combobox.snippets";
import { SearchingCombobox, countries, manyOptions, plans } from "./ComboboxStoryKit";

// The Playground-only "None" choice for `highlightTone`: a story key, typed as the prop so it can be an arg.
const NONE = "none" as unknown as ComboboxProps["highlightTone"];

const meta: Meta<typeof Combobox> = {
  title: "Organisms/Inputs/Combobox",
  component: Combobox,
  parameters: { layout: "padded" },
  // Content props first, then core visual props, then behavioural and state props, then the advanced and
  // escape-hatch props last (07 §4 item 3).
  argTypes: {
    options: {
      control: false,
      description:
        "The choices: an array of { value, label, textValue?, description?, icon?, disabled?, group? }. Options with the same group are listed together under its heading.",
      table: { defaultValue: { summary: "[]" } },
    },
    value: {
      control: false,
      description: "The chosen value (the value of the chosen option, or an empty string for none), when you own it. Pair with onValueChange.",
    },
    defaultValue: {
      control: false,
      description: "The chosen value when uncontrolled.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: {
      control: false,
      description: "Called with the option's value and the option when the choice changes, or an empty string and undefined when it is cleared.",
    },
    inputValue: {
      control: false,
      description: "The text in the field, when you own it. Use it to show a label for a value whose option has not loaded yet.",
    },
    defaultInputValue: {
      control: false,
      description: "The text in the field when uncontrolled. Defaults to the label of defaultValue's option.",
    },
    onInputValueChange: {
      control: false,
      description:
        "Called with the text and why it changed: input (typing), select, clear or reset. Fetch on input and ignore the rest.",
    },
    placeholder: {
      control: "text",
      description: "Shown while the field is empty.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the field, matching Input's scale. It also sets the height of the rows.",
      table: { defaultValue: { summary: "md" } },
    },
    allowCustomValue: {
      control: "boolean",
      description:
        "Lets the typed text be the value when it matches no option, committed when the field is left or Enter is pressed. By default the value is always an option's.",
      table: { defaultValue: { summary: "false" } },
    },
    filter: {
      control: false,
      description:
        "How typing narrows the options: a function that decides for one option, or false to show options as given (when you filter or fetch yourself). The default matches the label anywhere, ignoring case and accents.",
      table: { defaultValue: { summary: "—" } },
    },
    autoHighlight: {
      control: false,
      description:
        "Highlights the first match as the person types, so Enter chooses it. On by default, and off with allowCustomValue, where Enter commits what was typed.",
      // Two values (one with allowCustomValue), so the cell shows "—" and the description says which.
      table: { defaultValue: { summary: "—" } },
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
    clearable: {
      control: "boolean",
      description: "Shows a clear button while there is a value or text, which empties both.",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: {
      control: false,
      description: "Called when the clear button is pressed, after the value and text have been emptied.",
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
        "Opens the list when the field gets focus. By default it opens on typing, on a press of the field or the toggle button, and on the arrow keys.",
      table: { defaultValue: { summary: "false" } },
    },
    prefix: {
      control: false,
      description: "Content drawn at the start of the field before the text: an icon, usually.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the field as invalid, visually and with aria-invalid.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the field: no typing, no list, and the value is not submitted.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Stops the value being changed without disabling the field. It can still be focused and read, and is submitted.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Asks for a choice, and stops a surrounding form submitting without one.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Form field name. The chosen value is submitted under it (the typed text, with allowCustomValue).",
    },
    form: {
      control: false,
      description: "Associates the field with a <form> by id, for use outside one.",
    },
    autoFocus: {
      control: false,
      description: "Focuses the field on mount. Use sparingly.",
      table: { defaultValue: { summary: "false" } },
    },
    maxLength: {
      control: false,
      description: "The most characters the text may have.",
    },
    inputMode: {
      control: false,
      description: "Hints which virtual keyboard a mobile device shows.",
    },
    enterKeyHint: {
      control: false,
      description: "What a phone's Enter key is labelled while the field has focus.",
    },
    spellCheck: {
      control: false,
      description: "Whether the browser checks the spelling of the text. Turn it off for ids, codes and handles.",
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
      description: "Text direction of the list and its content. Left out, the nearest `DirectionProvider`'s, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    formatNumber: {
      control: false,
      description:
        "How the number in the default results announcement is written, for a language or region whose numerals differ. Plain String when left out.",
      table: { defaultValue: { summary: "—" } },
    },
    labels: {
      control: false,
      description:
        "The text the component writes itself: clear, toggle, noResults, loading, error, results and pickAnOption. An omitted or undefined entry keeps the English default.",
      table: { defaultValue: { summary: "—" } },
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
    id: {
      control: false,
      description: "DOM id of the input, so a label's htmlFor reaches it.",
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
      description: "Test identifier, applied to the input.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real default (07 §5).
  args: {
    options: countries,
    placeholder: "Search countries",
    size: "md",
    allowCustomValue: false,
    loading: false,
    error: false,
    clearable: false,
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
    "aria-label": "Country",
  },
  // The list opens below the field, so the story reserves room for it rather than letting it overlap the page.
  render: (args) => (
    <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
      <Combobox {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Combobox>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => comboboxPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
  // "None" is a choice only here: leaving highlightTone out is what the prop's default does.
  argTypes: {
    highlightTone: {
      control: "select",
      options: ["none", "warning", "highlight", "success", "info", "danger"],
      mapping: { none: undefined },
    },
  },
  // The control's "none" key is mapped to undefined above, which the prop's type doesn't name.
  args: { highlightTone: NONE },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: comboboxSnippets.allSizes } } },
  // Each instance sets its own size, so no single control value could represent them.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "24rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Combobox key={size} {...args} size={size} aria-label={`Size ${size}`} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  parameters: { docs: { source: { code: comboboxSnippets.controlled } } },
  render: function ControlledStory(args) {
    const [country, setCountry] = useState("ca");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", maxWidth: "24rem", minHeight: "20rem" }}>
        <Combobox {...args} value={country} onValueChange={setCountry} />
        <span style={{ fontSize: "var(--dbm-font-size-sm)" }}>Value: {country || "—"}</span>
      </div>
    );
  },
};

export const Groups: Story = {
  name: "Groups",
  parameters: { docs: { source: { code: comboboxSnippets.groups } } },
  args: { options: plans.map(({ description: _description, disabled: _disabled, ...option }) => option), "aria-label": "Plan", placeholder: "Choose a plan" },
};

export const Rich: Story = {
  name: "Descriptions, icons and unavailable options",
  parameters: { docs: { source: { code: comboboxSnippets.rich } } },
  args: {
    options: plans.map((option) => ({ ...option, group: undefined, icon: option.disabled ? undefined : GlobeIcon })),
    "aria-label": "Plan",
    placeholder: "Choose a plan",
  },
};

export const CustomRow: Story = {
  name: "A row of your own",
  parameters: { docs: { source: { code: comboboxSnippets.customRow } } },
  args: { "aria-label": "Person", placeholder: "Choose a person" },
  render: (args) => (
    <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
      <Combobox
        {...args}
        options={countries}
        renderOption={(option, { selected }) => <strong>{selected ? `${option.label} (you)` : option.label}</strong>}
      />
    </div>
  ),
};

export const Async: Story = {
  name: "Options fetched as you type",
  parameters: { docs: { source: { code: comboboxSnippets.async } } },
  // The story owns the options, the loading flag and the filter, so those controls would do nothing.
  argTypes: { loading: { control: false }, options: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
      <SearchingCombobox {...args} />
    </div>
  ),
};

export const FullWidth: Story = {
  name: "Full width on a phone",
  parameters: {
    docs: { source: { code: comboboxSnippets.fullWidth } },
    // Pinned to a phone width in the Storybook UI; on a Docs page it sits in the wide page like any other story.
  },
  globals: { viewport: { value: "mobile1", isRotated: false } },
  // The story sets the presentation as a map, which no select can express.
  argTypes: { presentation: { control: false } },
  render: (args) => (
    <div style={{ minHeight: "24rem" }}>
      <Combobox {...args} presentation={{ base: "full-width", sm: "anchored" }} />
    </div>
  ),
};

export const HighlightTone: Story = {
  name: "Coloured matches",
  parameters: { docs: { source: { code: comboboxSnippets.highlightTone } } },
  args: { highlightTone: "highlight", defaultOpen: true, "aria-label": "Country" },
  argTypes: { highlightTone: { control: "select", options: ["warning", "highlight", "success", "info", "danger"] } },
  render: (args) => (
    <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
      <Combobox {...args} defaultInputValue="un" />
    </div>
  ),
};

export const Keywords: Story = {
  name: "Words people also search by",
  parameters: { docs: { source: { code: comboboxSnippets.keywords } } },
  args: { "aria-label": "Country", placeholder: "Try UK or America" },
};

export const Create: Story = {
  name: "Creating new options",
  parameters: { docs: { source: { code: comboboxSnippets.create } } },
  // The story owns the options, and onCreate is what it demonstrates.
  argTypes: { options: { control: false } },
  args: { "aria-label": "Country", placeholder: "Choose or add a country" },
  render: function CreateStory(args) {
    const [options, setOptions] = useState(countries.slice(0, 6));
    return (
      <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
        <Combobox
          {...args}
          options={options}
          onCreate={(text) => {
            const option = { value: text.toLowerCase(), label: text };
            setOptions((current) => [...current, option]);
            return option;
          }}
        />
      </div>
    );
  },
};

export const CustomValue: Story = {
  name: "Free text as well",
  parameters: { docs: { source: { code: comboboxSnippets.customValue } } },
  args: { allowCustomValue: true, "aria-label": "Destination", placeholder: "Choose or type a destination" },
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: comboboxSnippets.clearable } } },
  args: { clearable: true, defaultValue: "ca" },
  // The story starts with a choice so the button shows; the initial value has nothing to drive.
  argTypes: { defaultValue: { control: false } },
};

export const States: Story = {
  name: "Loading, error and empty",
  parameters: { docs: { source: { code: comboboxSnippets.states } } },
  // Each instance sets its own state.
  argTypes: { loading: { control: false }, error: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "24rem", minHeight: "28rem" }}>
      <Combobox {...args} aria-label="Loading" placeholder="Loading" options={[]} loading />
      <Combobox {...args} aria-label="Error" placeholder="Error" error />
      <Combobox {...args} aria-label="Empty" placeholder="Type something that matches nothing" emptyContent="No country by that name" />
    </div>
  ),
};

export const LongList: Story = {
  name: "A long list",
  parameters: { docs: { source: { code: comboboxSnippets.longList } } },
  args: { options: manyOptions, "aria-label": "Item", placeholder: "Search 2,000 items" },
};

export const OpenOnFocus: Story = {
  name: "Opening on focus",
  parameters: { docs: { source: { code: comboboxSnippets.openOnFocus } } },
  args: { openOnFocus: true },
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: { docs: { source: { code: comboboxSnippets.error } } },
  args: { hasError: true },
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: comboboxSnippets.disabled } } },
  // The two instances set their own state.
  argTypes: { disabled: { control: false }, readOnly: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "24rem" }}>
      <Combobox {...args} aria-label="Disabled" defaultValue="ca" disabled />
      <Combobox {...args} aria-label="Read-only" defaultValue="ca" readOnly />
    </div>
  ),
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: comboboxSnippets.inFormField } } },
  render: (args) => (
    <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
      <FormField label="Country" helperText="Where the order ships" required>
        {(fieldProps) => <Combobox {...args} {...fieldProps} name="country" />}
      </FormField>
    </div>
  ),
};
