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
/** What a closed field does with chips that don't fit: wrap onto more lines, stay on one line with a "+N more" button, or show a count instead of chips. */
export type MultiSelectOverflow = "wrap" | "collapse" | "summary";

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
  | "create"
  /** Typed text was made into a chip of its own (`allowCustomValue`), with no option behind it. */
  | "custom"
  /** A chip was moved to another place (`reorderable`). */
  | "reorder";

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
   * tooltip and read after its name. A disabled option that is already chosen stays chosen, and its chip has no
   * remove button: it is locked, and the clear button leaves it too. The reason is read after the chip.
   */
  disabled?: boolean | string;
  /** Extra words the default filter matches, never shown ("UK" for "United Kingdom"). */
  keywords?: string[];
  /** Puts the option under a heading of this name. Options are listed by group, groups in the order they first appear. */
  group?: string;
  /** The colour of this option's chip, replacing the field's `tone`: a status, a category, a priority. */
  tone?: TagTone;
  /** An icon (a component reference) drawn before the text in this option's chip. It is separate from `icon`, which is for the list. */
  chipIcon?: PhosphorIcon;
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
  /** Said under the field when typed or pasted text names no option and `allowCustomValue` is off. Receives the text. @default (text) => `${text} isn't in the list` */
  notFound: (text: string) => string;
  /** Shown, and announced, after a pasted list had pieces that were not added. Plain numbers. @default (added, refused) => `${added} added, ${refused} not added` */
  pasted: (added: number, refused: number) => string;
  /** The text of the count that stands for the chips with `overflow="summary"`. Plain number. @default (count) => `${count} selected` */
  summary: (count: number) => string;
  /** Read after a chip that can't be removed because its option is disabled, when the option gives no reason of its own. @default "Can't be removed" */
  locked: string;
  /** The count in the list's footer (`footer`). Plain number. @default (count) => `${count} selected` */
  footerCount: (count: number) => string;
  /** The footer's button that removes every chip that can be removed. @default "Clear" */
  footerClear: string;
  /** The footer's button that closes the list. @default "Done" */
  footerDone: string;
  /** The text of a group's "select all" row (`selectGroups`). Receives the group's name. @default (group) => `Select all in ${group}` */
  selectGroup: (group: string) => string;
  /** The text of a group's row while everything it covers is chosen. Receives the group's name. @default (group) => `Deselect all in ${group}` */
  deselectGroup: (group: string) => string;
  /** The message shown, and announced, when typed text names a value that is already chosen (`allowCustomValue`). Receives the text. @default (text) => `${text} is already chosen` */
  duplicate: (text: string) => string;
  /**
   * Announced when a chip is picked up with the keyboard (`reorderable`), with its place. Plain numbers; write them
   * with `formatNumber` if you pass your own.
   * @default (label, position, total) => `${label}, position ${position} of ${total}. Use the arrow keys to move it, Space to drop it, Escape to cancel`
   */
  liftedChip: (label: string, position: number, total: number) => string;
  /** Announced as a picked-up chip moves, or is moved with Alt and an arrow key, with its new place. @default (label, position, total) => `${label} moved to position ${position} of ${total}` */
  movedChip: (label: string, position: number, total: number) => string;
  /** Announced when a chip is dropped, by key or by the pointer, with its place. @default (label, position, total) => `${label} dropped at position ${position} of ${total}` */
  droppedChip: (label: string, position: number, total: number) => string;
  /** Announced when a pick-up is cancelled and the chip is back where it was. @default (label, position, total) => `${label} moved back to position ${position} of ${total}` */
  cancelledChip: (label: string, position: number, total: number) => string;
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
  /** The option that was added or removed, when one was (not for `clear` or `selectAll`); `undefined` for a value with no option, as one typed with `allowCustomValue`. */
  option?: MultiSelectOption;
  /**
   * The option behind each of the new values, in the same order, or `undefined` for a value with none (a typed one, or an
   * id the field has never seen). It includes options that have left `options` since they were chosen, which a field of
   * fetched options can't otherwise recover.
   */
  selected: Array<MultiSelectOption | undefined>;
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
   * Highlights the first match while the person types, so Enter chooses it. Off by default with `allowCustomValue`,
   * where Enter commits what was typed.
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
   * are chosen. With text typed it covers the matches only. Stops at `maxSelected`. With `onSelectAll` the row asks
   * you for the options instead, and only ever adds.
   * @default false
   */
  selectAll?: boolean;
  /**
   * Gives the "Select all" row the answer, for a list the page doesn't hold all of (options fetched as the person
   * types, or a count in the thousands). Called with the typed text and the enabled options loaded now; return the
   * options to choose (or their values), or a promise of them. The row waits while the promise is out, and the result
   * is added to what is chosen, up to `maxSelected`. Needs `selectAll`.
   */
  onSelectAll?: (details: { text: string; options: MultiSelectOption[] }) => Array<MultiSelectOption | string> | void | Promise<Array<MultiSelectOption | string> | void>;
  /**
   * Adds a row under each group's heading that chooses every enabled option of that group the list shows, or removes
   * them again when all are chosen. Only options with a `group` have one. Stops at `maxSelected`.
   * @default false
   */
  selectGroups?: boolean;
  /**
   * Lets typed text be a chip of its own when it names no option: Enter (with no option highlighted), a separator, a
   * paste of several, or leaving the field makes the text a value, as `TagsInput` does. Text that is exactly an
   * option's label chooses that option instead. A value already chosen, one that `validate` refuses and one past
   * `maxSelected` are refused with a message. The first match is not highlighted while typing, so Enter commits what
   * was typed.
   * @default false
   */
  allowCustomValue?: boolean;
  /**
   * Lets a list be pasted into the typing field: the text is split at the separators, line breaks and tabs, and each
   * piece that is exactly an option's label (ignoring case and accents) is chosen. Pieces that name no option are
   * refused and counted ("3 added, 2 not added"), or become chips of their own with `allowCustomValue`, which turns this
   * on. Without it a paste is ordinary text.
   * @default false
   */
  pasteList?: boolean;
  /**
   * Adds a footer under the list with the count chosen, a "Clear" button and a "Done" button that closes the list: a way
   * to finish on a phone, where the list spans the screen and there is no key to press. Takes a map to change with the
   * screen, such as `{ base: true, sm: false }`. The buttons are for the pointer and touch and are not tab stops.
   * @default false
   */
  footer?: Responsive<boolean>;
  /**
   * The characters that end a typed value, when `allowCustomValue` is set: typing one, or pasting text with one (or a
   * line break), makes a chip of what came before it.
   * @default [","]
   */
  separators?: string[];
  /** Checks a typed value before it becomes a chip (`allowCustomValue`): return a message to refuse it, or nothing to accept it. */
  validate?: (text: string) => string | void | undefined;
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
   * Replaces the text of each chip with content of your own (an avatar and a name). Receives the option, or
   * `undefined` for a value with no option, and the value. The chip's tooltip, remove button name and announcements
   * still use the option's `label`.
   */
  renderValue?: (option: MultiSelectOption | undefined, value: string) => ReactNode;
  /**
   * Lets chips be moved to change the order of the values: drag one with a pointer or a finger, or focus its remove
   * button, press Space, move it with the arrow keys and press Space or Enter to drop it (Escape cancels). Alt with an
   * arrow key moves a chip one place at once. The order is submitted. Chips are `touch-action: none` so a finger drags
   * instead of scrolling the page; on a chip, Space picks up rather than removing, and Enter and Delete still remove.
   * @default false
   */
  reorderable?: boolean;
  /**
   * What a closed field does with chips that don't fit: `wrap` lets them take more lines, `collapse` keeps one line
   * with as many chips as fit and a "+N more" button, and `summary` shows a count ("3 selected") instead of any chips,
   * for a field in a toolbar or a narrow filter bar. `wrap` and `collapse` show every chip while the field is in use;
   * `summary` never does, so options are removed from the list (the check marks) or with the clear button.
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
