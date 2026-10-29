import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";

/** The size of the rows, text and icons, on the standard 5-step scale (`05-component-api-conventions.md` §2). */
export type TreeSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Whether rows can be selected: `"none"` (the default), `"single"` (one row at a time) or `"multiple"` (a click replaces the
 * selection, Ctrl or ⌘ with a click adds or removes a row, Shift with a click or an arrow key extends it).
 */
export type TreeSelectionMode = "none" | "single" | "multiple";

/** One row of the tree, and the rows under it. */
export interface TreeNode {
  /** Names the row. Unique across the whole tree, since selection, checking and expansion are all lists of ids. */
  id: string;
  /**
   * The row's text. A plain string, since typeahead matches it, `highlightQuery` finds in it and it is cut with an ellipsis when
   * it does not fit; use `Tree`'s `renderLabel` to draw something else in its place.
   */
  label: string;
  /** An icon drawn before the label, as a component reference from `@dbm-system/icons`. */
  icon?: PhosphorIcon;
  /** Quieter text drawn on the same line after the label. */
  description?: string;
  /** The rows under this one, drawn when it is expanded. */
  children?: TreeNode[];
  /**
   * Marks a row that has children you have not given yet (a folder you fetch when it is opened). It can be expanded:
   * `onExpandedChange` fires, you fetch, and you put the result in `children`. Ignored once `children` is set.
   */
  hasChildren?: boolean;
  /** Stops the row being selected, checked or expanded by a person. It stays in the arrow-key order. */
  disabled?: boolean;
  /** Content drawn at the end of the row. Not interactive: a button here would be a second focus stop inside a tree item. */
  trailing?: ReactNode;
}

/** What `renderLabel` is told about the row it draws. */
export interface TreeRowState {
  /** How deep the row is, from `1` for a top-level row. */
  level: number;
  expanded: boolean;
  selected: boolean;
  /** `true`, `false` or `"indeterminate"` (some of the rows under it are checked). Always `false` when the tree is not `checkable`. */
  checked: boolean | "indeterminate";
  disabled: boolean;
  /** Whether the row can be expanded (it has children, or `hasChildren`). */
  hasChildren: boolean;
}

/**
 * The text `Tree` supplies itself, translatable through the `labels` prop (`ADR-0021`). A label that needs numbers is a
 * function of the plain numbers.
 */
export interface TreeLabels {
  /** What a tree with no rows says, unless `empty` replaces it. @default 'No items' */
  empty: string;
  /**
   * What a screen reader hears when the children of a row you were loading arrive, given how many.
   * @default (count) => `${count} items loaded` (the number through `formatNumber`; `1 item loaded` for one)
   */
  childrenLoaded: (count: number) => string;
}

/**
 * The controls `controllerRef` hands to code outside the tree, such as an "Expand all" button. Each asks for a change the way
 * a key press does (through `onExpandedChange` when the expansion is controlled, by moving itself when it is not) and
 * says whether there was anything to do. The object is the same for the tree's life, and its methods read the latest state.
 */
export interface TreeController {
  /** Asks for every row that has children to be open. */
  expandAll: () => boolean;
  /** Asks for every row to be closed. */
  collapseAll: () => boolean;
  /** Asks for this row to be open. `false` when it is missing, has nothing under it or is already open. */
  expand: (id: string) => boolean;
  /** Asks for this row to be closed. `false` when it is missing or already closed. */
  collapse: (id: string) => boolean;
  /** Opens the rows above this one and scrolls it into view, without taking focus. `false` when there is no such row. */
  scrollToNode: (id: string) => boolean;
}

export interface TreeProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id" | "dir" | "onChange"> {
  /** The top-level rows. Required; an empty list draws the `empty` message. */
  nodes: TreeNode[];
  /**
   * The size of the rows, text and icons.
   * @default 'md'
   */
  size?: TreeSize;
  /**
   * Whether rows can be selected — see {@link TreeSelectionMode}. A selected row has `aria-selected`, and the tree is
   * `aria-multiselectable` in `"multiple"`.
   * @default 'none'
   */
  selectionMode?: TreeSelectionMode;
  /** The ids of the selected rows (at most one in `"single"`). Makes the selection controlled: it changes only when this does. */
  value?: string[];
  /** The ids selected to begin with, when `value` is not given. @default [] */
  defaultValue?: string[];
  /** Called with the ids the person wants selected. */
  onValueChange?: (value: string[]) => void;
  /**
   * Draws a check box on every row. A row with rows under it shows what they hold: checked when all are, and "indeterminate"
   * when some are; checking it checks the ones under it that are not disabled. See `checkedIds`.
   * @default false
   */
  checkable?: boolean;
  /**
   * The ids of the checked rows that have nothing under them (the leaves); a row with children is worked out from them, so its
   * own id is ignored. A row that is waiting for its children (`hasChildren`) counts as a leaf until they arrive.
   * Makes the checks controlled.
   */
  checkedIds?: string[];
  /** The leaves checked to begin with, when `checkedIds` is not given. @default [] */
  defaultCheckedIds?: string[];
  /** Called with the leaves the person wants checked. */
  onCheckedChange?: (checkedIds: string[]) => void;
  /** The ids of the open rows. Makes the expansion controlled: it changes only when this does. */
  expandedIds?: string[];
  /** The ids open to begin with, when `expandedIds` is not given. @default [] */
  defaultExpandedIds?: string[];
  /** Starts with every row that has children open, when `expandedIds` and `defaultExpandedIds` are not given. @default false */
  defaultExpandAll?: boolean;
  /** Called with the ids that should be open, when a person opens or closes a row. */
  onExpandedChange?: (expandedIds: string[]) => void;
  /** The ids of rows whose children are being fetched: a spinner in place of the arrow, and `aria-busy` on the row. */
  loadingIds?: string[];
  /**
   * Called when a row is activated: Enter on it or a double click. A row that has children and no handler is opened or
   * closed by Enter instead.
   */
  onItemActivate?: (id: string) => void;
  /** Draws a row's label in place of its text, given the row and its state. The icon, arrow, check box and trailing content stay. */
  renderLabel?: (node: TreeNode, state: TreeRowState) => ReactNode;
  /** Text to find in each label and mark, case-insensitively. Marks the match only; it does not hide rows (filter `nodes` yourself). */
  highlightQuery?: string;
  /**
   * Draws only the rows in view of a long tree. `"auto"` does it from 200 visible rows, and only when `maxHeight` is set,
   * since a window needs a box to scroll. Row heights are fixed by `size`, so a label is cut with an ellipsis.
   * @default 'auto'
   */
  windowed?: "auto" | boolean;
  /** The most height the tree takes before it scrolls: a number is pixels, a string any CSS length. */
  maxHeight?: number | string;
  /** What to draw when there are no rows, in place of the words in `labels.empty`. `false` draws nothing. */
  empty?: ReactNode;
  /** The direction the tree reads. Mirrors the indent, the arrows and the Left and Right keys. @default 'ltr' */
  dir?: "ltr" | "rtl";
  /** Writes the digits in the text the tree supplies. @default String */
  formatNumber?: (value: number) => string;
  /** The text the tree supplies itself; any you leave out keeps its English default. */
  labels?: Partial<TreeLabels>;
  /** Hands `expandAll()`, `collapseAll()` and the rest to code outside the tree. See {@link TreeController}. */
  controllerRef?: Ref<TreeController>;
  /** Names the tree for a screen reader. One of this and `aria-labelledby` is needed (a warning in development when neither is given). */
  "aria-label"?: string;
  /** Points at the element that names the tree. */
  "aria-labelledby"?: string;
  /** Added to the outer box, the one that scrolls. */
  className?: string;
  /** Added to the outer box, the one that scrolls. */
  style?: CSSProperties;
  /** Put on the element with `role="tree"`. */
  id?: string;
  /** Put on the element with `role="tree"`. */
  "data-testid"?: string;
}
