import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import type { HighlightTone } from "../../atoms/Highlight";
import type { TagTone, TagVariant } from "../../atoms/Tag";

export type MultiSelectSize = "xs" | "sm" | "md" | "lg" | "xl";
export type MultiSelectSide = "top" | "right" | "bottom" | "left";
export type MultiSelectAlign = "start" | "center" | "end";
/** How the list is drawn: under the field and as wide as it, or across the whole visible screen. */
export type MultiSelectPresentation = "anchored" | "full-width";
/** What a closed field does with chips that don't fit: wrap onto more lines, or stay on one line with a "+N more" button. */
export type MultiSelectOverflow = "wrap" | "collapse";

/** Why the text typed into a `MultiSelect` changed, as `onInputValueChange` reports it. */
export type MultiSelectInputChangeReason =
  /** The person typed, pasted or deleted. */
  | "input"
  /** An option was chosen or removed, and the text that narrowed the list was cleared. */
  | "select"
  /** The clear button was pressed. */
  | "clear"
  /** The field was left with text typed, and the text was dropped. */
  | "reset";

/** What changed the chosen values, as `onValueChange` reports it. */
export type MultiSelectChangeSource =
  /** An option was chosen from the list. */
  | "select"
  /** A chosen option was chosen again in the list, which removes it. */
  | "deselect"
  /** A chip was removed: its button, or Delete or Backspace with the chip focused. */
  | "remove"
  /** The clear button emptied the field. */
  | "clear"
  /** The "Select all" row chose, or removed, every option it covers. */
  | "selectAll"
  /** The "Create …" row made a new option and chose it. */
  | "create";

/** One choice in a `MultiSelect`. */
export interface MultiSelectOption {
  /** What is added to the field's value when this option is chosen, and what a form submits. Unique within `options`. */
  value: string;
  /** The text shown for the option and in its chip, and matched against what is typed. */
  label: string;
  /**
   * The text the default filter matches instead of `label`, for a label that is not plain text. The chip and the
   * row still show `label`. Defaults to `label`.
   */
  textValue?: string;
  /** A second line under the label in the list: a caption, an email address, a plan name. Not shown in the chip. */
  description?: ReactNode;
  /** An icon (a component reference, not a name) shown before the label in the list. */
  icon?: PhosphorIcon;
  /**
   * Makes the option unavailable. `true` dims it; a string does the same and gives the reason, shown as the row's
   * tooltip and read after its name. A disabled option that is already chosen stays chosen and can still be
   * removed with its chip.
   */
  disabled?: boolean | string;
  /** Extra words the default filter matches, never shown ("UK" for "United Kingdom"). */
  keywords?: string[];
  /** Puts the option under a heading of this name. Options are listed by group, groups in the order they first appear. */
  group?: string;
}

/** The text a `MultiSelect` writes itself: names, announcements and messages. */
export interface MultiSelectLabels {
  /** The accessible name of the clear button. @default "Clear all" */
  clear: string;
  /** The accessible name of the button that opens and closes the list. @default "Toggle options" */
  toggle: string;
  /** The accessible name of a chip's remove button. Receives the option's label. @default (label) => `Remove ${label}` */
  remove: (label: string) => string;
  /** The accessible name of the list of chosen options. @default "Selected options" */
  selected: string;
  /** Shown, and announced, when typed text matches no option. @default "No results" */
  noResults: string;
  /** Shown while `loading` and nothing is listed yet, and as the note under the list afterwards. @default "Loading…" */
  loading: string;
  /** Shown, and announced, when `error` is set. @default "Something went wrong. Try again." */
  error: string;
  /**
   * Announced while the person types, with how many options match. Receives a plain number; write it with
   * `formatNumber` if you pass your own.
   * @default (count) => `${count} results available`
   */
  results: (count: number) => string;
  /**
   * Announced when an option is chosen, with how many are chosen now. Plain numbers; write them with
   * `formatNumber` if you pass your own.
   * @default (label, count) => `${label} selected, ${count} selected`
   */
  added: (label: string, count: number) => string;
  /**
   * Announced when an option is removed, with how many are chosen now. Plain numbers; write them with
   * `formatNumber` if you pass your own.
   * @default (label, count) => `${label} removed, ${count} selected`
   */
  removed: (label: string, count: number) => string;
  /** Announced when the clear button empties the field. @default "All options cleared" */
  cleared: string;
  /**
   * The reason shown on the options that can't be chosen once `maxSelected` is reached, and announced when a choice
   * is refused. Receives the limit as a plain number.
   * @default (max) => `No more than ${max} can be selected`
   */
  limitReached: (max: number) => string;
  /** The text of the "Select all" row (`selectAll`). @default "Select all" */
  selectAll: string;
  /** The text of the "Select all" row while everything it covers is chosen. @default "Deselect all" */
  deselectAll: string;
  /** Announced after "Select all" changed the choice, with how many are chosen now. Plain number. @default (count) => `${count} selected` */
  selectedCount: (count: number) => string;
  /** The message a form shows when `required` is set and it is submitted with nothing chosen. @default "Choose at least one option" */
  required: string;
  /** The message a form shows when fewer than `minSelected` are chosen. Receives the minimum. @default (min) => `Choose at least ${min}` */
  minSelected: (min: number) => string;
  /**
   * The visible text, and the name, of the button that shows the chips collapsed by `maxVisible` or
   * `overflow="collapse"`. Receives how many are hidden, as a plain number.
   * @default (hidden) => `+${hidden} more`
   */
  more: (hidden: number) => string;
  /** The text of the button that collapses the chips again after `more` was used. @default "Show less" */
  less: string;
  /** Describes the field once something is chosen: how to reach the chips with the keyboard. @default "Use the left arrow key to move to the chosen options" */
  chipsHint: string;
  /** The text of the "Create …" row for typed text that names no option. Receives the text. @default (text) => `Create “${text}”` */
  create: (text: string) => string;
  /** Shown in an empty list with nothing typed. @default "Type to search" */
  typeToSearch: string;
}

/** Drives a `MultiSelect` from outside. Every method says whether it had anything to do. */
export interface MultiSelectController {
  /** Opens the list. `false` when it is already open, or the field is disabled or read-only. */
  open: () => boolean;
  /** Closes the list. `false` when it is already closed. */
  close: () => boolean;
  /** Removes every chosen option, as the clear button does. `false` when nothing is chosen or the field can't be edited. */
  clear: () => boolean;
  /** Puts focus in the field's entry. `false` when it is disabled or not in the page. */
  focus: () => boolean;
}

/** What `onValueChange` reports besides the new values. */
export interface MultiSelectChangeDetails {
  /** What changed them. */
  source: MultiSelectChangeSource;
  /** The option that was added or removed, when one was (not for `clear` or `selectAll`); `undefined` for a value with no option in `options`. */
  option?: MultiSelectOption;
}

export interface MultiSelectProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    | "children"
    | "defaultValue"
    | "onChange"
    | "role"
    | "id"
    | "dir"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
  > {
  /** The choices. Default `[]`: a field with no options shows its empty row when opened. */
  options?: MultiSelectOption[];
  /**
   * The chosen options' `value`s, in the order the chips show (a new array on every change; never mutated). Passing
   * it makes the field controlled: a change is reported through `onValueChange` and the chips stay this array until
   * the prop changes. A value with no matching option shows the value itself as its chip.
   */
  value?: string[];
  /**
   * The chosen values when uncontrolled.
   * @default []
   */
  defaultValue?: string[];
  /** Called with the new array of values each time an option is added or removed, and with why. */
  onValueChange?: (value: string[], details: MultiSelectChangeDetails) => void;
  /**
   * The text typed to narrow the list. Passing it makes the entry controlled; pair with `onInputValueChange`.
   * Fetch options from it by passing `filter={false}` and a new `options` array.
   */
  inputValue?: string;
  /**
   * The initial typed text when uncontrolled.
   * @default ""
   */
  defaultInputValue?: string;
  /** Called with the typed text as it changes, and why. */
  onInputValueChange?: (inputValue: string, reason: MultiSelectInputChangeReason) => void;
  /**
   * Decides which options match the typed text, replacing the default (every word of the text appears in the label,
   * its `textValue` or its `keywords`, in any order, ignoring case and accents). `false` shows every option
   * whatever is typed, for a caller that fetches the matches itself.
   */
  filter?: ((option: MultiSelectOption, text: string) => boolean) | false;
  /**
   * Highlights the first match while the person types, so Enter chooses it.
   * @default true
   */
  autoHighlight?: boolean;
  /**
   * Keeps the list open after an option is chosen, so several can be chosen in a row. Set it to close the list on
   * each choice.
   * @default false
   */
  closeOnSelect?: boolean;
  /**
   * The most options that can be chosen. Once reached, the options not chosen are disabled with
   * `labels.limitReached` as the reason. Not enforced on a controlled `value` longer than the limit.
   */
  maxSelected?: number;
  /**
   * The fewest options a form accepts. Only a form's validation reads it; a person can still remove chips below it.
   */
  minSelected?: number;
  /**
   * Adds a first row to the list that chooses every enabled option the list shows, or removes them again when all
   * are chosen. With text typed it covers the matches only. Stops at `maxSelected`.
   * @default false
   */
  selectAll?: boolean;
  /**
   * Shows the clear button once something is chosen or typed.
   * @default true
   */
  clearable?: boolean;
  /** Called after the clear button has emptied the field. */
  onClear?: () => void;
  /** Shows a spinner and `labels.loading`, for options being fetched. @default false */
  loading?: boolean;
  /** Shows `labels.error` under the list and announces it, for options that failed to load. @default false */
  error?: boolean;
  /** Shown in the list instead of `labels.noResults` when typed text matches nothing. */
  emptyContent?: ReactNode;
  /**
   * Adds `Highlight`'s colour to the bold match in each label. Without it a match is only bold.
   */
  highlightTone?: HighlightTone;
  /**
   * Offers a "Create …" row at the end of the list while the typed text names no option. Called with the trimmed
   * text. Return the new option (or a promise of it) to have it chosen; add it to `options` yourself. Return nothing
   * when you are handling it elsewhere.
   */
  onCreate?: (text: string) => MultiSelectOption | void | Promise<MultiSelectOption | void>;
  /** Replaces what each row draws inside the list (the label, icon and description). The check mark stays. */
  renderOption?: (option: MultiSelectOption, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  /** Whether the list is open. Passing it makes the open state controlled; pair with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the list starts open when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Opens the list when the entry receives focus, rather than waiting for a click, a key or typing.
   * @default false
   */
  openOnFocus?: boolean;
  /** What is shown while nothing is chosen and nothing is typed. Once there is a chip it goes. */
  placeholder?: string;
  /**
   * The size of the box, on the shared size scale. The box is as tall as a `TagsInput` of the same size, and the
   * chips are one step smaller.
   * @default "md"
   */
  size?: MultiSelectSize;
  /**
   * The colour of every chip, from `Tag`'s own tones.
   * @default "brand"
   */
  tone?: TagTone;
  /**
   * The look of every chip, from `Tag`'s own variants.
   * @default "subtle"
   */
  variant?: TagVariant;
  /**
   * What a closed field does with chips that don't fit: `wrap` lets them take more lines, `collapse` keeps one line
   * with as many chips as fit and a "+N more" button. The field always shows every chip while it is in use.
   * @default "wrap"
   */
  overflow?: MultiSelectOverflow;
  /**
   * The most chips shown while the field is not in use; the rest are behind a "+N more" button. With
   * `overflow="collapse"` it is an upper limit on the number that fit.
   */
  maxVisible?: number;
  /** Marks the field as invalid for styling. Also set when a form refuses it. @default false */
  hasError?: boolean;
  /** Disables the field: no typing, no list, no removing, and a form does not submit the values. @default false */
  disabled?: boolean;
  /** Blocks changing the values without disabling the field: the chips stay, with no remove buttons, the list does not open, and a form still submits the values. @default false */
  readOnly?: boolean;
  /**
   * A form refuses to submit while nothing is chosen. The rule is a custom validity on the entry itself, so a
   * surrounding `Form` shows its message at the field and focuses it.
   * @default false
   */
  required?: boolean;
  /** Submits each chosen value as its own entry under this name, as a group of checkboxes does. */
  name?: string;
  /** The id of the `<form>` the values belong to, when the field is not inside it. */
  form?: string;
  /** Focuses the entry on mount. @default false */
  autoFocus?: boolean;
  /** The browser's own autofill hint. Defaults to `"off"`, since the list is the suggestion. @default 'off' */
  autoComplete?: string;
  /** The on-screen keyboard to ask a phone for. */
  inputMode?: ComponentPropsWithoutRef<"input">["inputMode"];
  /** The label of the keyboard's enter key on a phone. */
  enterKeyHint?: ComponentPropsWithoutRef<"input">["enterKeyHint"];
  /** Whether the browser may spell-check what is typed. */
  spellCheck?: boolean;
  /**
   * How the list is drawn. `anchored` puts it under the field, as wide as the field. `full-width` spans the visible
   * screen (the visual viewport, so an on-screen keyboard is counted) with a small gap at each edge, and opens above
   * or below the field, whichever has room. Takes a map to change with the screen: `{ base: "full-width", sm:
   * "anchored" }` is full width below the `sm` breakpoint. `align` has no effect in `full-width`.
   * @default 'anchored'
   */
  presentation?: Responsive<MultiSelectPresentation>;
  /**
   * The element the list is drawn inside, instead of the end of `document.body`. Use it where a host confines its
   * layers. Must be in the page by the time the list first opens.
   */
  container?: HTMLElement | null;
  /** Which side of the field the list opens on; it moves to the other side if there is no room. @default 'bottom' */
  side?: MultiSelectSide;
  /** Alignment along the chosen `side`. @default 'start' */
  align?: MultiSelectAlign;
  /** Text direction of the field and its list. Not read from the page. @default 'ltr' */
  dir?: "ltr" | "rtl";
  /** The text the field writes itself: names, messages and announcements. Only the ones you pass are replaced. */
  labels?: Partial<MultiSelectLabels>;
  /**
   * Writes the numbers the field shows or announces, for a locale whose numerals differ. Your own `labels`
   * functions receive plain numbers and should write them with the same function.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * Receives an object that opens, closes, clears and focuses the field from code. Its identity never changes and
   * its methods read the latest state.
   */
  controllerRef?: Ref<MultiSelectController>;
  /**
   * Accessible name, required unless a visible label points at the field with `aria-labelledby` or a `<label>`.
   */
  "aria-label"?: string;
  /** The id of the element that labels the field. */
  "aria-labelledby"?: string;
  /** The id of a helper or error message paired with the field. */
  "aria-describedby"?: string;
  /** Marks the entry as invalid for assistive technology. Also set by `hasError`. */
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  /**
   * Standard DOM id of the entry input. Generated when omitted; pass your own when a label's `htmlFor` needs to
   * point at it.
   */
  id?: string;
  /** Additional CSS classes, applied to the outermost box that holds the field. */
  className?: string;
  /** Inline styles, applied to the outermost box that holds the field. */
  style?: CSSProperties;
  /** Test identifier, set on the entry input as `data-testid`. */
  "data-testid"?: string;
}
