import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { HighlightTone } from "../../atoms/Highlight";

export type ComboboxSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ComboboxSide = "top" | "right" | "bottom" | "left";
export type ComboboxAlign = "start" | "center" | "end";
/** How the list is drawn: under the field and as wide as it, or across the whole visible screen. */
export type ComboboxPresentation = "anchored" | "full-width";

/** Why the text in a `Combobox` changed, as `onInputValueChange` reports it. */
export type ComboboxInputChangeReason =
  /** The person typed, pasted or deleted. */
  | "input"
  /** An option was chosen, and its label was written into the field. */
  | "select"
  /** The clear button was pressed. */
  | "clear"
  /** The field was left with text that isn't a choice, and the last choice (or nothing) was put back. */
  | "reset";

/** One choice in a `Combobox`. */
export interface ComboboxOption {
  /** What the field's value becomes when this option is chosen, and what a form submits. Unique within `options`. */
  value: string;
  /** The text shown for the option, written into the field when it is chosen, and matched against what is typed. */
  label: string;
  /**
   * The text the default filter matches against, when `label` isn't it (a label with markup around a name, an id
   * people also search by). Defaults to `label`.
   */
  textValue?: string;
  /** A second, smaller line under the label. A row with a description is taller than one without. */
  description?: ReactNode;
  /** A Phosphor icon component drawn before the label (a component reference, not a name). */
  icon?: PhosphorIcon;
  /**
   * Stops the option being chosen. It stays in the list, dimmed and skipped by the arrow keys. A string is the reason,
   * shown as the row's `title` and read as its description.
   */
  disabled?: boolean | string;
  /**
   * Extra words the default filter matches besides the label: synonyms, ids and codes people also search by ("UK" for
   * "United Kingdom"). Never shown, and not marked in the label. A `filter` of your own decides for itself.
   */
  keywords?: string[];
  /** The heading this option is listed under. Options with the same `group` are drawn together, in the order the groups first appear. */
  group?: string;
}

/** The text a `Combobox` writes itself: names, messages and announcements. */
export interface ComboboxLabels {
  /** The accessible name of the clear button shown by `clearable`. @default "Clear" */
  clear: string;
  /** The accessible name of the button that shows and hides the list. @default "Toggle options" */
  toggle: string;
  /** The row shown, and announced, when no option matches. @default "No results" */
  noResults: string;
  /** The row shown, and announced, while `loading` and there are no options to show. @default "Loading…" */
  loading: string;
  /** The message shown, and announced, in place of the footer when `error` is `true`. @default "Something went wrong. Try again." */
  error: string;
  /**
   * Announced when the number of matching options changes while the list is open. Receives the count as a plain
   * number; write it with `formatNumber` if you pass your own.
   * @default (count) => `${count} results available`
   */
  results: (count: number) => string;
  /**
   * The message the browser shows when a form is submitted while the field holds text that isn't a choice.
   * @default "Choose one of the options"
   */
  pickAnOption: string;
  /**
   * The text of the row offered by `onCreate`. Receives the typed text.
   * @default (text) => `Create “${text}”`
   */
  create: (text: string) => string;
  /**
   * The row shown, and nothing else announced, when the list has no options at all and nothing has been typed: the
   * state of a field that waits for a search. Text that then matches nothing shows `noResults`.
   * @default "Type to search"
   */
  typeToSearch: string;
}

export interface ComboboxProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    | "value"
    | "defaultValue"
    | "onChange"
    | "size"
    | "prefix"
    | "children"
    | "role"
    | "type"
    | "list"
    | "checked"
    | "defaultChecked"
  > {
  /** The choices. Default `[]`: a field with no options shows its empty row when opened. */
  options?: ComboboxOption[];
  /** The controlled chosen value: the `value` of the chosen option, or `""` for none. */
  value?: string;
  /** The chosen value when uncontrolled. */
  defaultValue?: string;
  /**
   * Called when the chosen value changes: with the option's `value` and the option itself, or `""` and `undefined`
   * when cleared. With `allowCustomValue`, called with the typed text and `undefined` when the field is left.
   */
  onValueChange?: (value: string, option: ComboboxOption | undefined) => void;
  /**
   * The controlled text in the field. Pass it to show a label for a `value` whose option isn't in `options` yet,
   * or to reset the text yourself.
   */
  inputValue?: string;
  /** The text in the field when uncontrolled. Defaults to the label of `defaultValue`'s option. */
  defaultInputValue?: string;
  /**
   * Called when the text changes, with the new text and why. An async caller fetches on `"input"` and ignores
   * `"select"`, `"clear"` and `"reset"`, which write a label rather than a search.
   */
  onInputValueChange?: (inputValue: string, reason: ComboboxInputChangeReason) => void;
  /**
   * Lets the typed text be the value when it isn't one of the options, committed when the field is left or Enter is
   * pressed. By default the value is always an option's, and text that isn't a choice is put back to the last
   * choice when the field is left.
   * @default false
   */
  allowCustomValue?: boolean;
  /**
   * How the options are narrowed by the typed text. A function decides for one option; `false` shows `options`
   * as given, for a caller that filters or fetches on its own. The default matches when `textValue ?? label` and `keywords` together hold every word of the typed text, in any order,
   * ignoring case and accents. The list is not narrowed while the field shows a chosen option's label unedited.
   */
  filter?: ((option: ComboboxOption, text: string) => boolean) | false;
  /**
   * Highlights the first matching option as the person types, so Enter chooses it. Defaults to on, and to off
   * with `allowCustomValue` (where Enter should commit what was typed).
   */
  autoHighlight?: boolean;
  /**
   * Shows that options are on their way: a spinner in the field, and a "Loading…" row while there are none to show.
   * @default false
   */
  loading?: boolean;
  /**
   * Shows `labels.error` in a footer under the options, and announces it. Fetching, and what an error means, is
   * the caller's.
   * @default false
   */
  error?: boolean;
  /**
   * Replaces the "No results" row with content of your own (a hint, a link). Shown while the typed text matches no
   * option and `loading` is `false`. A list with no options at all and nothing typed shows `labels.typeToSearch`.
   */
  emptyContent?: ReactNode;
  /**
   * Adds colour to the matched text in each label, from `Highlight`'s tones (a background and a text colour). By
   * default the match is only bold, which marks it without a second treatment on every row. Leave it out for that.
   */
  highlightTone?: HighlightTone;
  /**
   * Offers a "Create …" row at the end of the list while the typed text names no option, which is how a person adds
   * one. Called with the typed text when the row is chosen. Return the new option to have it chosen (it needn't be in
   * `options` yet, but add it there so it stays), return nothing if you are handling it yourself (the list closes), or
   * return a promise of either: the row is held while it is out, and a rejection is announced and keeps the list open.
   */
  onCreate?: (text: string) => ComboboxOption | void | Promise<ComboboxOption | void>;
  /**
   * Draws an option's row. Receives the option and whether it is `highlighted` and `selected`. The default row is
   * the icon, label (with the typed text in bold) and description. Rows have a fixed height (a long list is drawn
   * a window at a time), so the content must fit the row.
   */
  renderOption?: (option: ComboboxOption, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  /**
   * Shows a clear button while there is a value or text, which empties both.
   * @default false
   */
  clearable?: boolean;
  /** Called when the clear button is pressed, after the value and text have been emptied. */
  onClear?: () => void;
  /** The controlled open state of the list. */
  open?: boolean;
  /** The initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called whenever the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Opens the list when the field gets focus. By default it opens on typing, on a press of the field or the
   * toggle button, and on the arrow keys.
   * @default false
   */
  openOnFocus?: boolean;
  /** Content drawn at the start of the field before the text: an icon, usually. */
  prefix?: ReactNode;
  /**
   * The field's size, on the scale `Input` uses; also sets the height of the rows.
   * @default 'md'
   */
  size?: ComboboxSize;
  /**
   * Marks the field as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables the field: no typing, no list, and the value isn't submitted.
   * @default false
   */
  disabled?: boolean;
  /**
   * Stops the value being changed without disabling the field. It can still be focused and read, and is submitted.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Requires a choice before the enclosing form can be submitted (with `allowCustomValue`, some text).
   * @default false
   */
  required?: boolean;
  /** Shown when the field is empty. */
  placeholder?: string;
  /** The name the chosen value is submitted under (the typed text, with `allowCustomValue`). */
  name?: string;
  /** Associates the field with a `<form>` by id, for use outside one. */
  form?: string;
  /** Focuses the field on mount. Use sparingly. */
  autoFocus?: boolean;
  /** The most characters the text may have (the native `maxLength` of the input). */
  maxLength?: number;
  /** Which virtual keyboard a mobile device shows for the field. */
  inputMode?: ComponentPropsWithoutRef<"input">["inputMode"];
  /** What a phone's Enter key is labelled while the field has focus. */
  enterKeyHint?: ComponentPropsWithoutRef<"input">["enterKeyHint"];
  /** Whether the browser checks the spelling of the text. Turn it off for ids, codes and handles. */
  spellCheck?: boolean;
  /**
   * The browser's own autofill hint. Defaults to `"off"`, since the list is the suggestion and the browser's would
   * be drawn over it.
   * @default 'off'
   */
  autoComplete?: string;
  /**
   * How the list is drawn. `anchored` puts it under the field, as wide as the field. `full-width` spans the visible
   * screen (the visual viewport, so an on-screen keyboard is counted) with a small gap at each edge, and opens above
   * or below the field, whichever has room: a long list is easier to read and tap on a phone. Takes a map to change
   * with the screen: `{ base: "full-width", sm: "anchored" }` is full width below the `sm` breakpoint. `align` has no
   * effect in `full-width`, and `side` is only its first choice.
   * @default 'anchored'
   */
  presentation?: Responsive<ComboboxPresentation>;
  /**
   * The element the list is drawn inside, instead of the end of `document.body`. Use it where a host confines its
   * layers (a `Dialog` or `Popover` given its own container, a shadow root, a Docs page). Must be in the page by
   * the time the list first opens. Not read again once the list is open.
   */
  container?: HTMLElement | null;
  /** Which side of the field the list opens on; it moves to the other side if there is no room. @default 'bottom' */
  side?: ComboboxSide;
  /** Alignment along the chosen `side`. @default 'start' */
  align?: ComboboxAlign;
  /** Text direction of the list and its content. Left out, the nearest `DirectionProvider`'s, else left-to-right; not read from the page. @default 'ltr' */
  dir?: "ltr" | "rtl";
  /**
   * The text the field writes itself: names, messages and announcements. Only the ones you pass are replaced.
   */
  labels?: Partial<ComboboxLabels>;
  /**
   * Writes the numbers the field shows or announces, for a locale whose numerals differ. Your own `labels`
   * functions receive plain numbers and should write them with the same function.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * Accessible name, required unless a visible label points at the field with `aria-labelledby` or a `<label>`.
   */
  "aria-label"?: string;
  /** The id of the element that labels the field. */
  "aria-labelledby"?: string;
  /** The id of a helper or error message paired with the field. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id of the input. Generated when omitted; pass your own when a label's `htmlFor` or
   * `aria-labelledby` needs to point at it.
   */
  id?: string;
  /** Additional CSS classes, applied to the outermost box that holds the field. */
  className?: string;
  /** Inline styles, applied to the outermost box that holds the field. */
  style?: CSSProperties;
  /** Test identifier, set on the input as `data-testid`. */
  "data-testid"?: string;
}
