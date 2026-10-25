import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import type { HighlightTone } from "../../atoms/Highlight";
import type { DialogOpenChangeReason, DialogSize } from "../Dialog/Dialog.types";

/** The panel's maximum width, on the standard 5-step scale: `Dialog`'s own size steps. */
export type CommandPaletteSize = DialogSize;

/**
 * One command in the list. It has the shape of a `Combobox` option (a `value`, a `label`, a `description`, an `icon`, a
 * `group`, `keywords`, a reason for being `disabled`), plus what a command does.
 */
export interface CommandItem {
  /** A unique id for the command, within its list. It is how `recent` names a command and how rows are keyed. */
  value: string;
  /** The text shown, and the text the search matches. */
  label: string;
  /** The text to match against instead of `label`, when the label is not what a person would type. */
  textValue?: string;
  /** A second, smaller line under the label. */
  description?: ReactNode;
  /** An icon before the label, a component reference from `@dbm-system/icons`. */
  icon?: PhosphorIcon;
  /** The command can't be run. A string is the reason, shown as the row's tooltip and read out after its name. */
  disabled?: boolean | string;
  /** Extra words the search matches but the row never shows ("preferences" for "Settings"). */
  keywords?: string[];
  /** The heading to list this command under. Commands with the same group are listed together. */
  group?: string;
  /**
   * The key combination to show at the row's end: one string (`"⌘N"`) or one string per key (`["Ctrl", "N"]`). It only
   * displays a hint and binds nothing: wire the key yourself, as for `Menu`'s `shortcut`.
   */
  shortcut?: string | string[];
  /**
   * Runs the command when it is chosen. It may return a promise: the row then shows a spinner, the palette waits (it
   * can't be dismissed), and it closes when the promise resolves. A rejection keeps it open and goes to
   * `onSelectError`. Not called for a command with `items`, which opens them.
   */
  onSelect?: (item: CommandItem) => void | Promise<unknown>;
  /**
   * Whether choosing the command closes the palette. `false` keeps it open (a toggle, a command that changes the
   * list), and a command that returns a promise stays open until it settles either way.
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * Commands this one opens as a list of their own. Choosing it clears the search and shows them under a Back button;
   * Backspace on an empty search goes back. One level is supported: the `items` of a command in a list opened this
   * way are ignored (a development warning says so).
   */
  items?: CommandItem[];
}

/**
 * What opened or closed the palette: `Dialog`'s reasons (a click on the `trigger`, Escape, a press on the scrim or the
 * close button, a `Dialog.Close`), and:
 * - `"select"`: a command was chosen.
 * - `"hotkey"`: the `hotkey` was pressed.
 * - `"controller"`: code called `open()`, `close()` or `toggle()` on the controller.
 */
export type CommandPaletteOpenChangeReason = DialogOpenChangeReason | "select" | "hotkey" | "controller";

/** The second argument of `onOpenChange`. */
export interface CommandPaletteOpenChangeDetails {
  /** What caused the change — see {@link CommandPaletteOpenChangeReason}. */
  reason: CommandPaletteOpenChangeReason;
}

/** The second argument of `onSelect`. */
export interface CommandPaletteSelectDetails {
  /** The text in the search when the command was chosen. */
  query: string;
}

/**
 * What code outside the palette can do to it. `CommandPalette`'s `controllerRef` hands it out, and
 * `useCommandPaletteController()` returns the same object inside the palette. Its identity never changes, and each
 * method says whether it had anything to do.
 */
export interface CommandPaletteController {
  /** Opens the palette. Returns `false` if it was already open. */
  open: () => boolean;
  /** Closes the palette. Returns `false` if it was closed, or is waiting for a command that returned a promise. */
  close: () => boolean;
  /** Opens it when closed and closes it when open. Returns whether anything changed. */
  toggle: () => boolean;
  /** Whether the palette is open now. */
  readonly isOpen: boolean;
}

/**
 * The text `CommandPalette` supplies itself, translatable through the `labels` prop. A part that needs a number is a
 * function of the plain number.
 */
export interface CommandPaletteLabels {
  /** The dialog's accessible name. @default 'Command palette' */
  title: string;
  /** The search field's accessible name. @default 'Search commands' */
  search: string;
  /** The search field's placeholder. @default 'Type a command or search…' */
  placeholder: string;
  /** The note when nothing matches. @default 'No results' */
  noResults: string;
  /** The note while `loading`. @default 'Loading…' */
  loading: string;
  /** The note under the list when `error` is set. @default 'Something went wrong. Try again.' */
  error: string;
  /** Said when a command that returned a promise rejected. @default 'That didn’t work. Try again.' */
  failed: string;
  /** The accessible name of the Back button, and the hint beside it. @default 'Back' */
  back: string;
  /** The heading of the `recent` group. @default 'Recent' */
  recent: string;
  /** Said when the number of matches changes. @default '5 results available' */
  results: (count: number) => string;
  /** The footer's hint for the arrow keys. @default 'Navigate' */
  hintNavigate: string;
  /** The footer's hint for Enter. @default 'Select' */
  hintSelect: string;
  /** The footer's hint for Escape. @default 'Close' */
  hintClose: string;
}

export interface CommandPaletteProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "onSelect" | "dir" | "title"> {
  /**
   * The commands, in the order to list them. Commands with the same `group` are listed together under a heading, in
   * the order the groups first appear.
   * @default []
   */
  commands?: CommandItem[];
  /** The controlled open state. Omit (along with `defaultOpen`) to let the palette manage its own. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled use — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes. The second argument says what caused it — see
   * {@link CommandPaletteOpenChangeReason}.
   */
  onOpenChange?: (open: boolean, details: CommandPaletteOpenChangeDetails) => void;
  /** Called with `true` once the palette has finished opening and with `false` once it has finished closing. */
  onOpenChangeComplete?: (open: boolean) => void;
  /** An element that opens the palette when pressed, rendered through `Dialog.Trigger` (usually a `Button`). */
  trigger?: ReactNode;
  /**
   * The key combination that opens the palette when it is closed and closes it when it is open, from anywhere on the
   * page, including from inside a text field. `mod` is ⌘ on an Apple platform and Ctrl elsewhere; the others are
   * `ctrl`, `alt`, `shift` and `meta`, joined by `+`. `false` turns it off. The press is stopped from reaching the
   * browser, which takes the combination from one that reserves it.
   * @default 'mod+k'
   */
  hotkey?: string | false;
  /** The controlled text in the search field. */
  query?: string;
  /**
   * The text the search starts with, each time the palette opens. Ignored once `query` is provided.
   * @default ''
   */
  defaultQuery?: string;
  /** Called with the new text as the person types, and with `""` when choosing a command that opens a list clears it. */
  onQueryChange?: (query: string) => void;
  /**
   * How commands are matched to the search. By default every word must be found in a command's label or `keywords`,
   * and the best matches are listed first within each group. A function keeps or drops each command and leaves the
   * order; `false` leaves the list as given, for a search the caller does itself (pass new `commands` as
   * `onQueryChange` reports typing, and `loading` while they are on their way).
   */
  filter?: false | ((item: CommandItem, query: string) => boolean);
  /**
   * The `value`s of commands to list first, under a heading of their own, while the search is empty. A command shows
   * once: in this group while the search is empty, and in its usual place otherwise. The palette remembers nothing,
   * so what counts as recent, and where it is kept, is up to you.
   */
  recent?: string[];
  /**
   * Shows that the commands are on their way: a spinner in the search row, and a note in place of "No results"
   * while there are none.
   * @default false
   */
  loading?: boolean;
  /**
   * Shows an error note under the list (`labels.error`) and announces it.
   * @default false
   */
  error?: boolean;
  /** What the list says when nothing matches, in place of `labels.noResults`. */
  emptyContent?: ReactNode;
  /**
   * Called when a command is chosen, after its own `onSelect` has been called. A command that opens a list does not
   * call it.
   */
  onSelect?: (item: CommandItem, details: CommandPaletteSelectDetails) => void;
  /**
   * Called when a command's `onSelect` returned a promise that rejected. Without it the rejection is left unhandled,
   * so it is never lost silently. The palette stays open and announces `labels.failed`.
   */
  onSelectError?: (error: unknown, item: CommandItem) => void;
  /** Draws a command's row yourself, in place of the icon, label and description. */
  renderItem?: (item: CommandItem, state: { highlighted: boolean }) => ReactNode;
  /** Adds colour to the bold match in each label. Without it the match is bold only. */
  highlightTone?: HighlightTone;
  /**
   * Shows the footer's key hints (arrows, Enter, Escape). They are not drawn on a touch screen either way.
   * @default true
   */
  showHints?: boolean;
  /** Content for the end of the footer: a link to help, a count. */
  footer?: ReactNode;
  /**
   * The panel's maximum width, on the standard scale (`Dialog`'s steps: 20, 24, 32, 42 and 56rem). On a viewport
   * narrower than the step the panel fills the width less a gutter.
   * @default 'lg'
   */
  size?: CommandPaletteSize;
  /**
   * Where the panel sits. A palette sits at the top by default so it doesn't jump as the results change.
   * @default 'top'
   */
  placement?: "center" | "top";
  /**
   * Fills the whole viewport. A mobile-first map switches it at a breakpoint, e.g. `{ base: true, sm: false }`. Off by
   * default: a phone-sized presentation waits for a trial on a real device.
   * @default false
   */
  fullScreen?: Responsive<boolean>;
  /**
   * Shows `Dialog`'s close button in the panel's corner. Off by default (Escape, a press on the scrim and choosing a
   * command all close it); turn it on with `fullScreen`, where there is no scrim to press.
   * @default false
   */
  showCloseButton?: boolean;
  /**
   * Blurs the page behind the scrim as well as dimming it.
   * @default false
   */
  scrimBlur?: boolean;
  /** Renders the palette into a different node than `document.body`, e.g. to keep an embedded demo inside its own box. */
  container?: HTMLElement | null;
  /**
   * The reading direction of the palette. It is passed on, not read from the page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** The text the component supplies itself, each part replaceable. A part left `undefined` keeps its English default. */
  labels?: Partial<CommandPaletteLabels>;
  /** Writes numbers the palette says (the count of results). Defaults to `String`. */
  formatNumber?: (value: number) => string;
  /** An object that receives the palette's {@link CommandPaletteController}; the same one `useCommandPaletteController()` returns. */
  controllerRef?: Ref<CommandPaletteController>;
  /** Accessible name for the dialog, in place of `labels.title`. */
  "aria-label"?: string;
  /** Points to the `id` of an element to use as the dialog's accessible name instead of `labels.title`. */
  "aria-labelledby"?: string;
  /** Standard DOM id, applied to the dialog panel. */
  id?: string;
  /** Additional CSS classes, on the dialog panel. */
  className?: string;
  /** Inline styles, merged onto the panel's own. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
