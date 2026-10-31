// The code shown under each story's "Show code" button on ColorPicker's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only wiring, which can't
// be pasted anywhere. Each snippet here is the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { ColorPickerAlign, ColorPickerCommitOn, ColorPickerFormat, ColorPickerPresentation, ColorPickerSide, ColorPickerSize } from "./ColorPicker.types";

export const colorPickerSnippets = {
  basic: `<ColorPicker aria-label="Brand color" defaultValue="#5548a4" />`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — each is as tall as an Input of the same size. */}
<ColorPicker aria-label="Brand color" size="lg" defaultValue="#5548a4" />`,

  formats: `{/* format: "hex" (default) | "rgb" | "hsl" | "oklch" — how the color is written in the field and in the value.
    Typed text may use any of them, with or without #, whatever the format is. */}
<ColorPicker aria-label="Brand color" format="oklch" defaultValue="#5548a4" />`,

  formatSwitch: `{/* showFormatSwitch: a row of buttons in the panel (Hex, RGB, HSL, OKLCH). Choosing one rewrites the field and reports the color
    in the new format through onValueChange and onValueCommit. Use format and onFormatChange to hold the format yourself. */}
<ColorPicker aria-label="Brand color" showFormatSwitch defaultValue="#5548a4" onFormatChange={(format) => remember(format)} />`,

  formatControlled: `{/* const [format, setFormat] = useState("hex"); const [color, setColor] = useState("#5548a4"); */}
<ColorPicker
  aria-label="Brand color"
  showFormatSwitch
  format={format}
  onFormatChange={setFormat}
  value={color}
  onValueChange={setColor}
/>`,

  channelInputs: `{/* showChannelInputs: number fields for each channel of the format (one field for the whole code for hex; R, G, B for rgb; H, S, L for hsl;
    L, C, H for oklch), and opacity with alpha. A number applies as soon as it is in range. */}
<ColorPicker aria-label="Brand color" showChannelInputs alpha defaultValue="#5548a4" />`,

  noneSwatch: `{/* noneSwatch: a first swatch that means "no color": it clears the value and is pressed while the value is empty. */}
<ColorPicker aria-label="Accent color" noneSwatch swatches={["#5548a4", "#2e8a7d"]} />`,

  copyButton: `{/* copyButton: copies the color, written in format, and says so aloud. */}
<ColorPicker aria-label="Brand color" copyButton format="rgb" defaultValue="#5548a4" />`,

  controller: `{/* const controller = useRef(null);  controller.current?.open()  — open() / close() / focus() / isOpen(); each says whether it did anything */}
<ColorPicker aria-label="Brand color" controllerRef={controller} defaultValue="#5548a4" />`,

  recent: `{/* showRecent: a row of the last five settled colors, newest first. By default the list lives in the picker; maxRecent changes the 5. */}
<ColorPicker aria-label="Brand color" showRecent defaultValue="#5548a4" />`,

  recentPersisted: `{/* persistKey: the picker keeps the list in the browser (storage: "local" (default) | "session"), shared by every picker with that key. */}
<ColorPicker aria-label="Brand color" showRecent persistKey="brand-colors" storage="local" />`,

  recentControlled: `{/* recentColors: the app owns the list (newest first, each as hex). const [recent, setRecent] = useState([]); */}
<ColorPicker aria-label="Brand color" showRecent recentColors={recent} onRecentColorsChange={setRecent} />`,

  names: `{/* Typed text may be a CSS color name: "rebeccapurple" is read, and written back in the format (#663399). */}
<ColorPicker aria-label="Brand color" defaultValue="rebeccapurple" />`,

  alpha: `{/* alpha: adds an opacity slider. The value gains two digits (#rrggbbaa), or "/ a" in the other formats,
    only while the color is not fully opaque. */}
<ColorPicker aria-label="Overlay color" alpha defaultValue="#5548a480" />`,

  swatches: `{/* swatches: strings, or { value, label }. A swatch is a button; the arrow keys move between them. */}
<ColorPicker
  aria-label="Brand color"
  defaultValue="#5548a4"
  swatches={["#5548a4", "#2e8a7d", { value: "oklch(0.7 0.15 60)", label: "Amber" }, "#d92d20"]}
/>`,

  eyeDropper: `{/* eyeDropper: a button that picks a color from anywhere on the screen. Drawn only where the browser has the
    EyeDropper API (Chromium); it is left out elsewhere. */}
<ColorPicker aria-label="Brand color" eyeDropper />`,

  inline: `{/* inline: the panel is drawn in place under the field, with no button and no popover. */}
<ColorPicker aria-label="Brand color" inline alpha swatches={["#5548a4", "#2e8a7d"]} defaultValue="#5548a4" />`,

  placement: `{/* side: "bottom" (default) | "top", its first choice. align: "start" (default) | "center" | "end". */}
<ColorPicker aria-label="Brand color" side="top" align="end" />`,

  fullWidth: `{/* presentation: "anchored" (default) | "full-width", or a breakpoint map: full-width spans the visible screen. */}
<ColorPicker aria-label="Brand color" presentation={{ base: "full-width", sm: "anchored" }} />`,

  commitOn: `{/* onValueChange fires on every step of a drag; onValueCommit once when it is done. commitOn="commit" holds
    onValueChange back to those moments too. */}
<ColorPicker
  aria-label="Brand color"
  commitOn="commit"
  onValueChange={setColor}
  onValueCommit={(color) => save(color)}
/>`,

  form: `{/* name: the color is submitted in the field's format. required refuses a submit with no color, and text that
    is not a color refuses it with a message. */}
<form onSubmit={handleSubmit}>
  <ColorPicker aria-label="Brand color" name="brand" required />
  <Button type="submit">Save</Button>
</form>`,

  states: `<ColorPicker aria-label="Brand color, error" hasError defaultValue="#5548a4" />
<ColorPicker aria-label="Brand color, disabled" disabled defaultValue="#5548a4" />
<ColorPicker aria-label="Brand color, read only" readOnly defaultValue="#5548a4" />`,

  clearable: `{/* clearable: a button that clears the color while one is chosen; the value becomes "". */}
<ColorPicker aria-label="Accent color" clearable defaultValue="#5548a4" onClear={() => track("cleared")} />`,

  controlled: `{/* const [color, setColor] = useState("#5548a4"); */}
<ColorPicker aria-label="Brand color" value={color} onValueChange={setColor} />`,

  formField: `<FormField label="Brand color" helperText="Used for buttons and links.">
  {(field) => <ColorPicker {...field} defaultValue="#5548a4" />}
</FormField>`,

  translated: `{/* labels: every name and message the picker writes. formatNumber writes the hue and the percentages. */}
<ColorPicker
  aria-label="Markenfarbe"
  dir="ltr"
  labels={{ openPicker: "Farbe wählen", saturation: "Sättigung", brightness: "Helligkeit", hue: "Farbton" }}
/>`,
} as const;

export interface ColorPickerPlaygroundSnippetArgs {
  size?: ColorPickerSize;
  hasError?: boolean;
  defaultValue?: string;
  format?: ColorPickerFormat;
  showFormatSwitch?: boolean;
  showChannelInputs?: boolean;
  showRecent?: boolean;
  maxRecent?: number;
  noneSwatch?: boolean;
  copyButton?: boolean;
  alpha?: boolean;
  eyeDropper?: boolean;
  commitOn?: ColorPickerCommitOn;
  clearable?: boolean;
  inline?: boolean;
  side?: ColorPickerSide;
  align?: ColorPickerAlign;
  presentation?: ColorPickerPresentation | Record<string, ColorPickerPresentation>;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  dir?: "ltr" | "rtl";
}

/** The Playground's code, from its live controls: only what differs from the defaults, around a small real example. */
export function colorPickerPlaygroundSnippet(args: ColorPickerPlaygroundSnippetArgs): string {
  const attributes: string[] = ['aria-label="Brand color"'];
  if (args.defaultValue) attributes.push(`defaultValue=${quote(args.defaultValue)}`);
  // With the switch on the Playground holds the format itself, so it is written as the format to start from.
  if (args.format && args.format !== "hex") attributes.push(`${args.showFormatSwitch ? "defaultFormat" : "format"}="${args.format}"`);
  if (args.showFormatSwitch) attributes.push("showFormatSwitch");
  if (args.showChannelInputs) attributes.push("showChannelInputs");
  if (args.showRecent) attributes.push("showRecent");
  if (args.showRecent && args.maxRecent !== undefined && args.maxRecent !== 5) attributes.push(`maxRecent={${args.maxRecent}}`);
  if (args.noneSwatch) attributes.push("noneSwatch");
  if (args.copyButton) attributes.push("copyButton");
  if (args.alpha) attributes.push("alpha");
  if (args.eyeDropper) attributes.push("eyeDropper");
  if (args.commitOn && args.commitOn !== "change") attributes.push(`commitOn="${args.commitOn}"`);
  if (args.clearable) attributes.push("clearable");
  if (args.inline) attributes.push("inline");
  if (args.side && args.side !== "bottom") attributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (typeof args.presentation === "string" && args.presentation !== "anchored") attributes.push(`presentation="${args.presentation}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.required) attributes.push("required");
  if (args.name) attributes.push(`name=${quote(args.name)}`);
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  return `<ColorPicker ${attributes.join(" ")} />`;
}
