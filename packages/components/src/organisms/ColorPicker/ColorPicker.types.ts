import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, FocusEventHandler, Ref } from "react";
import type { InputSize } from "../../atoms/Input";
import type { ColorFormat } from "../../internal/color/colorValue";

export type ColorPickerSize = InputSize;
/** How a color is written as text: the field's text and the value `onValueChange` reports. */
export type ColorPickerFormat = ColorFormat;
/** How the panel is drawn: floating from the field, or spanning the visible screen (a phone, usually). */
export type ColorPickerPresentation = "anchored" | "full-width";
/** Which side of the field the panel opens on, its first choice. */
export type ColorPickerSide = "top" | "bottom";
/** How the panel lines up with the field along the side it opens on. */
export type ColorPickerAlign = "start" | "center" | "end";

/** A color offered in the panel's list of swatches. */
export interface ColorPickerSwatch {
  /** The color, in any form `value` can be written in: `"#5548a4"`, `"rgb(85 72 164)"`, `"hsl(248 39% 46%)"`, `"oklch(0.5 0.14 285)"`. */
  value: string;
  /** The swatch's name, said by a screen reader and shown as its tooltip. Defaults to the color written as text. */
  label?: string;
}

/**
 * Every piece of text `ColorPicker` writes itself. Pass a partial object to translate any of it; the rest stays English.
 * A label that needs a number is a function of the plain number, written through `formatNumber`.
 */
export interface ColorPickerLabels {
  /** Name of the text entry that shows and takes the color. */
  value: string;
  /** Name of the button that opens the panel. */
  openPicker: string;
  /** Name of the panel. */
  pickerName: string;
  /** Name of the button that clears the field. */
  clear: string;
  /** Name of the saturation control of the area. */
  saturation: string;
  /** Name of the brightness control of the area. */
  brightness: string;
  /** Name of the hue slider. */
  hue: string;
  /** Name of the opacity slider. */
  alpha: string;
  /** Name of the group of swatches. */
  swatches: string;
  /** Name of the button that picks a color from the screen. */
  eyeDropper: string;
  /** The placeholder of the text entry while no color is chosen. */
  none: string;
  /** The form message for text that is not a color. */
  invalid: string;
  /** What the hue is read as, given degrees. */
  hueText: (degrees: string) => string;
  /** What a saturation, brightness or opacity is read as, given the percentage. */
  percentText: (percent: string) => string;
  /** Said aloud when a color is chosen from a swatch, the screen or typed text, given the color written as text. */
  chosen: (color: string) => string;
  /** Said aloud when the color is cleared. */
  cleared: string;
  /** Name of a channel's number field (`showChannelInputs`), given the channel: `"r"`, `"g"`, `"b"`, `"h"`, `"s"`, `"l"`, `"c"` or `"a"` (opacity). */
  channelName: (channel: ColorPickerChannel) => string;
  /** The short text drawn under a channel's number field, such as "R" or "H". It is decoration; `channelName` is the name. */
  channelLetter: (channel: ColorPickerChannel) => string;
  /** Name of the button that copies the color (`copyButton`). */
  copy: string;
  /** Said aloud when the color has been copied. */
  copied: string;
  /** Said aloud when the browser refused to copy. */
  copyFailed: string;
  /** Name of the group of buttons that changes the format (`showFormatSwitch`). */
  formatSwitch: string;
  /** The text of a format's button in that group, given the format. */
  formatName: (format: ColorPickerFormat) => string;
}

/** The channels a number field can edit: red, green, blue, hue, saturation, lightness, chroma, and opacity. */
export type ColorPickerChannel = "r" | "g" | "b" | "h" | "s" | "l" | "c" | "a";

/**
 * What code can do to a `ColorPicker` from outside, through `controllerRef`. Each method says whether it had anything to
 * do (`false` while the picker is disabled, read only, drawn `inline`, or already in the state asked for) instead of throwing.
 */
export interface ColorPickerController {
  /** Opens the floating panel and moves focus into it. */
  open: () => boolean;
  /** Closes the floating panel and gives focus back to its button. */
  close: () => boolean;
  /** Focuses the text entry. */
  focus: () => boolean;
  /** Whether the floating panel is open. */
  isOpen: () => boolean;
}

/** When `onValueChange` is called: on every change, as the person drags, or only when they are done. */
export type ColorPickerCommitOn = "change" | "commit";

export interface ColorPickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role" | "onFocus" | "onBlur" | "dir"> {
  /**
   * Overall size, on the shared scale; the field's height matches `Input` at the same step.
   * @default 'md'
   */
  size?: ColorPickerSize;
  /**
   * Shows the error state: a danger-coloured border and `aria-invalid`. Text that is not a color shows it too, without this.
   * @default false
   */
  hasError?: boolean;
  /**
   * The color, as text in `format` (`"#5548a4"`). `""` or omitted for no color. Any readable spelling is accepted and
   * written back in `format`; a string that is not a color reads as empty, with a development warning.
   */
  value?: string;
  /** The initial color for uncontrolled usage, written like `value` — ignored once `value` is provided. */
  defaultValue?: string;
  /**
   * Called with the new color, written in `format`, whenever it changes: on every step of a drag, a key press, a swatch,
   * the eyedropper, typed text once it is committed (Enter or leaving the field) and the clear button (`""`). Use
   * `onValueCommit` to hear only the settled color.
   */
  onValueChange?: (value: string) => void;
  /**
   * Called once with the final color, when a drag is released, a key step completes, text is committed, or a swatch,
   * the eyedropper or the clear button is used. The right hook for anything expensive.
   */
  onValueCommit?: (value: string) => void;
  /**
   * The controlled format: how the color is written, as the text in the field and the string `onValueChange`,
   * `onValueCommit` and `name` carry. `"hex"` is `#rrggbb`, `"rgb"` is `rgb(r g b)`, `"hsl"` is `hsl(h s% l%)` and
   * `"oklch"` is `oklch(L C H)`. Typed text may use any of them (or a three, four or eight digit hex, with or without
   * `#`, or a CSS color name such as `rebeccapurple`) whatever the format is. Pair it with `onFormatChange` when `showFormatSwitch` is on, or the switch does nothing.
   * Omit it (and use `defaultFormat`) to let the picker hold the format.
   */
  format?: ColorPickerFormat;
  /**
   * The initial format for uncontrolled usage — ignored once `format` is provided.
   * @default 'hex'
   */
  defaultFormat?: ColorPickerFormat;
  /** Called with the new format when the format switch is used. The value is reported in the new format at the same moment. */
  onFormatChange?: (format: ColorPickerFormat) => void;
  /**
   * Adds a row of buttons to the panel (Hex, RGB, HSL, OKLCH) that changes the format. Choosing one rewrites the text
   * in the field and reports the color in the new format through `onValueChange` and `onValueCommit`, so leave it off
   * where the value must always be one fixed spelling.
   * @default false
   */
  showFormatSwitch?: boolean;
  /**
   * Adds an opacity slider and keeps opacity in the value (`#rrggbbaa`, or `/ a` in the other formats); a color that is
   * fully opaque is written with none. Off, the value is always opaque.
   * @default false
   */
  alpha?: boolean;
  /**
   * Colors to choose from in a list under the sliders, as strings or `{ value, label }`. An entry that is not a color
   * is left out, with a development warning. Arrow keys move between them (one tab stop); Enter or Space chooses one.
   */
  swatches?: ReadonlyArray<string | ColorPickerSwatch>;
  /**
   * Adds a button that picks a color from anywhere on the screen, where the browser has the `EyeDropper` API
   * (Chromium); the button is left out elsewhere.
   * @default false
   */
  eyeDropper?: boolean;
  /**
   * When `onValueChange` is called: `"change"` on every change, `"commit"` only when the person is done (a drag released,
   * a key step finished, text committed) — the same moments as `onValueCommit`.
   * @default 'change'
   */
  commitOn?: ColorPickerCommitOn;
  /**
   * Adds number fields to the panel for each channel of the format (red, green and blue for `hex` and `rgb`; hue,
   * saturation and lightness for `hsl`; lightness, chroma and hue for `oklch`), and opacity with `alpha`, for typing an
   * exact value. Each commits as you type a number in range.
   * @default false
   */
  showChannelInputs?: boolean;
  /**
   * Adds a swatch at the start of the list that means "no color": choosing it clears the value, and it is pressed while
   * the value is empty. Shown even when `swatches` is empty.
   * @default false
   */
  noneSwatch?: boolean;
  /**
   * Adds a button to the panel that copies the color, written in `format`, to the clipboard and says so aloud.
   * @default false
   */
  copyButton?: boolean;
  /**
   * A ref that receives a controller for opening, closing and focusing the picker from code. It is the same object for
   * the picker's whole life.
   */
  controllerRef?: Ref<ColorPickerController>;
  /**
   * Shows a clear button while a color is chosen. Clearing makes the value `""`.
   * @default false
   */
  clearable?: boolean;
  /** Called after the clear button has cleared the color. */
  onClear?: () => void;
  /**
   * The name of the form field the color is submitted under, as the string in `format`. The field is checked as a
   * real input, so `required` and text that is not a color refuse a surrounding form's submit.
   */
  name?: string;
  /** The `id` of the form the hidden input belongs to, when the field is not inside it. */
  form?: string;
  /**
   * Refuses a submit while no color is chosen.
   * @default false
   */
  required?: boolean;
  /**
   * Disables the whole field.
   * @default false
   */
  disabled?: boolean;
  /**
   * Keeps the color visible and selectable but not editable, and the panel closed.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Draws the panel in place, under the field's text entry, instead of floating from a button: no popover, no trigger.
   * For a settings page or a Docs page where the panel is the content.
   * @default false
   */
  inline?: boolean;
  /**
   * The controlled open state of the floating panel. Omit (with `defaultOpen`) to let the field hold it.
   * Ignored when `inline`.
   */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called with the new open state whenever the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Which side of the field the panel opens on, its first choice; it moves to the other side if there is no room.
   * @default 'bottom'
   */
  side?: ColorPickerSide;
  /**
   * How the panel lines up with the field along that side. Has no effect while `presentation` is `"full-width"`.
   * @default 'start'
   */
  align?: ColorPickerAlign;
  /**
   * `"anchored"` floats the panel from the field; `"full-width"` spans the visible screen (a phone), opening on
   * whichever side has room once an on-screen keyboard is counted. A breakpoint map is accepted.
   * @default 'anchored'
   */
  presentation?: Responsive<ColorPickerPresentation>;
  /** The element the floating panel is portaled into. Defaults to `document.body`. */
  container?: HTMLElement | null;
  /**
   * Focuses the text entry on mount. React only does this for native controls, so it is done from an effect.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Text direction. `"rtl"` mirrors the field and the panel's sliders (the arrow keys follow); the saturation and
   * brightness area never mirrors, since a color space is not text.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** Text the component writes itself (accessible names, form messages, announcements); pass a partial object to translate any of it. */
  labels?: Partial<ColorPickerLabels>;
  /**
   * How a number the component says (a hue in degrees, a percentage) is written, for a language or region whose numerals
   * differ. Callbacks and the value keep plain numbers and the format's own digits.
   * @default (n) => String(n)
   */
  formatNumber?: (value: number) => string;
  /** Called when focus arrives on the field as a whole (its parts and the open panel are one field). */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /** Called when focus leaves the field as a whole. */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /** The `id` of the text entry, for a label's `htmlFor`. */
  id?: string;
  /** Names the group of controls when there is no visible label to point `aria-labelledby` at. */
  "aria-label"?: string;
  /** The `id` of the element that names the group. */
  "aria-labelledby"?: string;
  /** The `id` of the element that describes the field (helper or error text). */
  "aria-describedby"?: string;
  /** Extra classes for the outermost box. */
  className?: string;
  /** Inline styles for the outermost box. */
  style?: React.CSSProperties;
  /** A plain, behavior-free hook for automated tests. */
  "data-testid"?: string;
}
