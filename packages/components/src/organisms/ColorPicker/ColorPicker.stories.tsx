import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { FormField } from "../../molecules/FormField";
import { ColorPicker } from "./ColorPicker";
import { colorPickerPlaygroundSnippet, colorPickerSnippets } from "./ColorPicker.snippets";

const swatchList = ["#5548a4", "#2e8a7d", { value: "oklch(0.7 0.15 60)", label: "Amber" }, "#d92d20", "#1f2937"];

const meta: Meta<typeof ColorPicker> = {
  title: "Organisms/Inputs/ColorPicker",
  component: ColorPicker,
  parameters: { layout: "padded" },
  // Core value props first, then the format and content props, then visual and state props, then the panel and form wiring,
  // then advanced/escape-hatch props last (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Overall size, on the shared scale; the field's height matches Input at the same step.",
      table: { defaultValue: { summary: '"md"' } },
    },
    hasError: {
      control: "boolean",
      description: "Shows the error state: a danger-coloured border and aria-invalid. Text that is not a color shows it too, without this.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      control: false,
      description: 'The color, as text in format ("#5548a4"). "" or omitted for no color. Any readable spelling is accepted and written back in format.',
    },
    defaultValue: {
      control: "text",
      description: "The initial color for uncontrolled usage, written like value — ignored once value is provided.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: {
      control: false,
      description: "Called with the new color, written in format, whenever it changes: a step of a drag, a key, a swatch, the eyedropper, committed text and the clear button.",
    },
    onValueCommit: {
      control: false,
      description: "Called once with the final color, when a drag is released, a key step completes, text is committed, or a swatch, the eyedropper or the clear button is used.",
    },
    format: {
      control: "select",
      options: ["hex", "rgb", "hsl", "oklch"],
      description: "How the color is written: the text in the field and the string the callbacks and name carry. Typed text may use any of them.",
      table: { defaultValue: { summary: '"hex"' } },
    },
    alpha: {
      control: "boolean",
      description: "Adds an opacity slider and keeps opacity in the value (#rrggbbaa, or / a in the other formats); a fully opaque color is written with none.",
      table: { defaultValue: { summary: "false" } },
    },
    swatches: {
      control: false,
      description: "Colors to choose from in a list under the sliders, as strings or { value, label }. An entry that is not a color is left out, with a development warning.",
    },
    eyeDropper: {
      control: "boolean",
      description: "Adds a button that picks a color from anywhere on the screen, where the browser has the EyeDropper API (Chromium); left out elsewhere.",
      table: { defaultValue: { summary: "false" } },
    },
    commitOn: {
      control: "select",
      options: ["change", "commit"],
      description: '"change" calls onValueChange on every change; "commit" only when the person is done (a drag released, a key step finished, text committed).',
      table: { defaultValue: { summary: '"change"' } },
    },
    clearable: {
      control: "boolean",
      description: "Shows a clear button while a color is chosen. Clearing makes the value empty.",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: { control: false, description: "Called after the clear button has cleared the color." },
    inline: {
      control: "boolean",
      description: "Draws the panel in place, under the field's text entry, instead of floating from a button: no popover, no trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    side: {
      control: "select",
      options: ["bottom", "top"],
      description: "Which side of the field the panel opens on, its first choice; it moves to the other side if there is no room.",
      table: { defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: 'How the panel lines up with the field along that side. Has no effect while presentation is "full-width".',
      table: { defaultValue: { summary: '"start"' } },
    },
    presentation: {
      control: "select",
      options: ["anchored", "full-width"],
      description: '"anchored" floats the panel from the field; "full-width" spans the visible screen (a phone). A breakpoint map is accepted.',
      table: { defaultValue: { summary: '"anchored"' } },
    },
    container: { control: false, description: "The element the floating panel is portaled into. Defaults to document.body." },
    open: { control: false, description: "The controlled open state of the floating panel. Omit (with defaultOpen) to let the field hold it. Ignored when inline." },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: { control: false, description: "Called with the new open state whenever the panel opens or closes." },
    onFocus: { control: false, description: "Called when focus arrives on the field as a whole (its parts and the open panel are one field)." },
    onBlur: { control: false, description: "Called when focus leaves the field as a whole." },
    disabled: {
      control: "boolean",
      description: "Disables the whole field.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Keeps the color visible and selectable but not editable, and the panel closed.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Refuses a submit while no color is chosen.",
      table: { defaultValue: { summary: "false" } },
    },
    autoFocus: { control: false, description: "Focuses the text entry on mount." },
    name: { control: "text", description: "The name of the form field the color is submitted under, as the string in format." },
    form: { control: false, description: "The id of the form the hidden input belongs to, when the field is not inside it." },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction. rtl mirrors the field and the sliders (the arrow keys follow); the saturation and brightness area never mirrors.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: { control: false, description: "Text the component writes itself (accessible names, form messages, announcements); pass a partial object to translate any of it." },
    formatNumber: { control: false, description: "How a number the component says (a hue in degrees, a percentage) is written, for a language whose numerals differ." },
    "aria-label": { control: "text", description: "Names the group of controls when there is no visible label to point aria-labelledby at." },
    "aria-labelledby": { control: false, description: "The id of the element that names the group." },
    "aria-describedby": { control: false, description: "The id of the element that describes the field (helper or error text)." },
    id: { control: false, description: "The id of the text entry, for a label's htmlFor." },
    className: { control: false, description: "Extra classes for the outermost box." },
    style: { control: false, description: "Inline styles for the outermost box." },
    "data-testid": { control: false, description: "A plain, behavior-free hook for automated tests." },
  },
  args: {
    size: "md",
    hasError: false,
    defaultValue: "#5548a4",
    format: "hex",
    alpha: false,
    eyeDropper: false,
    commitOn: "change",
    clearable: false,
    inline: false,
    side: "bottom",
    align: "start",
    presentation: "anchored",
    defaultOpen: false,
    disabled: false,
    readOnly: false,
    required: false,
    name: "",
    dir: "ltr",
    "aria-label": "Brand color",
    onValueChange: fn(),
    onValueCommit: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ColorPicker>;

// The fixed-render stories below show one thing each; every control that render ignores is switched off.
const noControls = {
  value: { control: false },
  defaultValue: { control: false },
  onValueChange: { control: false },
  onValueCommit: { control: false },
  format: { control: false },
  alpha: { control: false },
  eyeDropper: { control: false },
  commitOn: { control: false },
  clearable: { control: false },
  inline: { control: false },
  side: { control: false },
  align: { control: false },
  presentation: { control: false },
  defaultOpen: { control: false },
  size: { control: false },
  hasError: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  required: { control: false },
  dir: { control: false },
  name: { control: false },
  "aria-label": { control: false },
} as const;

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" } as const;

/** Choose a color in the panel, type one into the field, or step the sliders with the keys; drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <ColorPicker {...args} swatches={swatchList} />,
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => colorPickerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.sizes } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ColorPicker key={size} size={size} aria-label={`Brand color, ${size}`} defaultValue="#5548a4" />
      ))}
    </div>
  ),
};

export const Formats: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.formats } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      {(["hex", "rgb", "hsl", "oklch"] as const).map((format) => (
        <ColorPicker key={format} format={format} aria-label={`Brand color, ${format}`} defaultValue="#5548a4" />
      ))}
    </div>
  ),
};

export const WithOpacity: Story = {
  name: "With opacity",
  parameters: { docs: { source: { code: colorPickerSnippets.alpha } } },
  argTypes: { ...noControls },
  render: () => <ColorPicker alpha aria-label="Overlay color" defaultValue="#5548a480" />,
};

export const Swatches: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.swatches } } },
  argTypes: { ...noControls },
  render: () => <ColorPicker aria-label="Brand color" defaultValue="#5548a4" swatches={swatchList} />,
};

export const EyeDropper: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.eyeDropper } } },
  argTypes: { ...noControls },
  render: () => <ColorPicker aria-label="Brand color" eyeDropper defaultValue="#5548a4" />,
};

export const Inline: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.inline } } },
  argTypes: { ...noControls },
  render: () => <ColorPicker inline alpha aria-label="Brand color" swatches={swatchList} defaultValue="#5548a4" />,
};

export const Placement: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.placement } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={{ ...stack, paddingBlockStart: "26rem" }}>
      <ColorPicker aria-label="Brand color" side="top" align="end" defaultValue="#5548a4" />
    </div>
  ),
};

export const FullWidth: Story = {
  name: "Full width",
  parameters: { docs: { source: { code: colorPickerSnippets.fullWidth } } },
  argTypes: { ...noControls },
  render: () => <ColorPicker aria-label="Brand color" presentation={{ base: "full-width", sm: "anchored" }} defaultValue="#5548a4" />,
};

export const CommitTiming: Story = {
  name: "Change and commit",
  parameters: { docs: { source: { code: colorPickerSnippets.commitOn } } },
  argTypes: { ...noControls },
  render: function CommitTimingStory() {
    const [changes, setChanges] = useState(0);
    const [commits, setCommits] = useState(0);
    return (
      <div style={stack}>
        <ColorPicker aria-label="Brand color" defaultValue="#5548a4" onValueChange={() => setChanges((n) => n + 1)} onValueCommit={() => setCommits((n) => n + 1)} />
        <Text size="sm" color="secondary">
          {changes} changes reported while dragging, {commits} commits.
        </Text>
      </div>
    );
  },
};

export const InAForm: Story = {
  name: "Required, in a form",
  parameters: { docs: { source: { code: colorPickerSnippets.form } } },
  argTypes: { ...noControls },
  render: function InAFormStory() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("brand")));
        }}
      >
        <ColorPicker aria-label="Brand color" name="brand" required />
        <Button type="submit">Save</Button>
        <Text size="sm" color="secondary">
          {submitted === null ? "Submit it empty, or with text that is not a color: the browser stops it." : `Submitted ${submitted}`}
        </Text>
      </form>
    );
  },
};

export const States: Story = {
  name: "Error, disabled and read-only",
  parameters: { docs: { source: { code: colorPickerSnippets.states } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <ColorPicker hasError aria-label="Brand color, error" defaultValue="#5548a4" />
      <ColorPicker disabled aria-label="Brand color, disabled" defaultValue="#5548a4" />
      <ColorPicker readOnly aria-label="Brand color, read only" defaultValue="#5548a4" />
    </div>
  ),
};

export const Clearable: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.clearable } } },
  argTypes: { ...noControls },
  render: () => <ColorPicker clearable aria-label="Accent color" defaultValue="#5548a4" />,
};

export const Controlled: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.controlled } } },
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [color, setColor] = useState("#5548a4");
    return (
      <div style={stack}>
        <ColorPicker aria-label="Brand color" value={color} onValueChange={setColor} />
        <Button variant="secondary" size="sm" onClick={() => setColor("#2e8a7d")}>
          Set to teal
        </Button>
        <Text size="sm" color="secondary">
          Value: {color}
        </Text>
      </div>
    );
  },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: colorPickerSnippets.formField } } },
  argTypes: { ...noControls },
  render: () => <FormField label="Brand color" helperText="Used for buttons and links.">{(field) => <ColorPicker {...field} defaultValue="#5548a4" />}</FormField>,
};

export const Translated: Story = {
  parameters: { docs: { source: { code: colorPickerSnippets.translated } } },
  argTypes: { ...noControls },
  render: () => (
    <ColorPicker
      aria-label="Markenfarbe"
      defaultValue="#5548a4"
      labels={{ openPicker: "Farbe wählen", pickerName: "Farbe wählen", saturation: "Sättigung", brightness: "Helligkeit", hue: "Farbton", value: "Farbwert" }}
    />
  ),
};

export const TypeAColor: Story = {
  name: "Type a color — interaction test",
  tags: ["!dev"],
  args: { defaultValue: "", "aria-label": "Brand color" },
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole("textbox", { name: "Color value" });
    await userEvent.type(field, "ABC{Enter}");
    await waitFor(() => expect(field).toHaveValue("#aabbcc"));
    await expect(args.onValueChange).toHaveBeenCalledWith("#aabbcc");
  },
};
