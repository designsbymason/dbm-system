import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "../../atoms/Button";
import type { PaginationProps } from "../../molecules/Pagination";
import type { TableSize, TableTone, TableVariant } from "../../molecules/Table";
import type { TableToolbarProps, TableToolbarSelectionProps } from "../../molecules/TableToolbar";

/** The way a column is ordered. */
export type DataTableSortDirection = "ascending" | "descending";

/** One column's ordering. */
export interface DataTableSortItem {
  /** The `id` of the column. */
  columnId: string;
  /** Which way it is ordered. */
  direction: DataTableSortDirection;
}

/**
 * The ordering, as a list of columns in order of weight. Pressing a header makes a list of one (or empty, to remove the
 * sort); a list of several, which only your own code can make, orders by each in turn.
 */
export type DataTableSort = DataTableSortItem[];

/** Where the sorting and the page of rows are worked out. */
export type DataTableSortMode = "client" | "manual";

/** How many rows can be chosen. */
export type DataTableSelectionMode = "none" | "single" | "multiple";

/** One column of a `DataTable`. */
export interface DataTableColumn<TRow> {
  /** A name for the column that no other has; sorting, hiding and the sort announcement refer to it. */
  id: string;
  /** The column's heading: text, or anything that names it. A heading that isn't text needs a `headerLabel`. */
  header: ReactNode;
  /**
   * The words that name the column in announcements and a screen reader's list of columns, when `header` isn't
   * text (an icon).
   */
  headerLabel?: string;
  /**
   * Reads this column's value from a row: what the cell shows when there is no `cell`, and what the column is sorted
   * by when there is no `compare`.
   */
  accessor?: (row: TRow) => unknown;
  /** Draws the cell. Without it the cell shows the `accessor`'s value as text. */
  cell?: (row: TRow, context: { index: number }) => ReactNode;
  /**
   * Lets a person sort by this column. Needs an `accessor` or a `compare`.
   * @default false
   */
  sortable?: boolean;
  /**
   * Orders two whole rows, smallest first, for a column whose value isn't a plain number, date or text. It is
   * flipped for a descending sort.
   */
  compare?: (a: TRow, b: TRow) => number;
  /**
   * Where the cell's content sits, in logical terms.
   * @default 'start'
   */
  align?: "start" | "center" | "end";
  /**
   * Marks the column as numbers: end-aligned with tabular figures.
   * @default false
   */
  numeric?: boolean;
  /** The column's width (any CSS length). Without it the column takes what its content asks for. */
  width?: CSSProperties["inlineSize"];
  /** The narrowest the column gets (any CSS length). Dragging a resizable column also stops here (a number is pixels; `px` and `rem` are understood). */
  minWidth?: CSSProperties["minInlineSize"];
  /** The widest the column gets (any CSS length), and the widest a drag makes a resizable column (a number is pixels; `px` and `rem` are understood). */
  maxWidth?: CSSProperties["maxInlineSize"];
  /**
   * Lets a person drag the end edge of this column's heading to resize it, or turns that off for it when the table is `resizable`.
   * Follows the table's `resizable` when left out.
   */
  resizable?: boolean;
  /**
   * Draws this column's cells as row headers (`<th scope="row">`), so a screen reader reads a row's name when it
   * enters the row. Use it on the one column that names each row.
   * @default false
   */
  rowHeader?: boolean;
  /**
   * Lets the cell's text wrap onto several lines instead of being cut with an ellipsis. A table with any such
   * column has rows of different heights, so it is never drawn a window at a time.
   * @default false
   */
  wrap?: boolean;
}

/** The text a `DataTable` writes itself. */
export interface DataTableLabels {
  /** What is announced after a sort, for the column's `headerLabel` or header text and the way it is ordered. */
  sorted: (column: string, direction: DataTableSortDirection) => string;
  /**
   * What is announced after a sort by several columns, in order of weight: "Sorted by Name, ascending, then Age, descending".
   * The label of a sort by one column is `sorted`.
   */
  sortedMultiple: (items: Array<{ column: string; direction: DataTableSortDirection }>) => string;
  /** Said, after the heading, by a sorted column's button while the sort is by several columns: "sort order 2". */
  sortOrder: (position: number) => string;
  /** What is announced when the sort is taken off. */
  sortCleared: string;
  /** The name of the header checkbox that chooses every row on the page. */
  selectAll: string;
  /** The name of a row's checkbox, for the row's label. */
  selectRow: (rowLabel: string) => string;
  /** A row's label when there is no `getRowLabel`: "Row 3". */
  row: (position: number) => string;
  /** The heading of the column of checkboxes, read by a screen reader but not drawn. */
  selectColumn: string;
  /** The heading of the column of `rowActions`, read by a screen reader but not drawn. */
  actionsColumn: string;
  /** The name of the menu a row's `rowContextMenu` opens: "Actions for Ada Lovelace". */
  rowMenu: (rowLabel: string) => string;
  /** The name of a row's expand button when it is closed: "Expand Ada Lovelace". */
  expandRow: (rowLabel: string) => string;
  /** The name of a row's expand button when it is open: "Collapse Ada Lovelace". */
  collapseRow: (rowLabel: string) => string;
  /** The heading of the column of expand buttons, read by a screen reader but not drawn. */
  expandColumn: string;
  /** The name of a column's resize handle, a separator: "Resize Name column". */
  resizeColumn: (column: string) => string;
  /** What is said after the handle's name, about its keys. */
  resizeHint: string;
  /** What an empty table says when there is no `emptyState`. */
  empty: string;
  /** What a screen reader hears while rows are loading. */
  loading: string;
  /** What is announced when the table's rows change because a page, a sort or a page size did: the number now shown. */
  rowsShown: (count: number, total: number) => string;
}

/** The properties of `DataTable`, whose type parameter is the shape of one row. */
export interface DataTableProps<TRow>
  extends Omit<ComponentPropsWithoutRef<"table">, "children" | "className" | "style" | "id" | "onSelect" | "onChange"> {
  /** The columns, in order. */
  columns: DataTableColumn<TRow>[];
  /** The rows. For a `manual` table this is the rows to draw now (one page, in order). */
  data: TRow[];
  /**
   * `DataTable.Toolbar`, `DataTable.Pagination` and anything else drawn around the table: a toolbar goes above it, a
   * pagination below. Only direct children of those two kinds are placed; anything else is drawn above the table.
   */
  children?: ReactNode;
  /**
   * A visible title for the table, drawn as its `<caption>`. Names the table for assistive technology; give this,
   * an `aria-label` or an `aria-labelledby`.
   */
  caption?: ReactNode;
  /**
   * The table's frame: `"bordered"` or `"ghost"` (inside a `Card`).
   * @default 'bordered'
   */
  variant?: TableVariant;
  /**
   * The table's colour treatment, the same as `Table`'s, except that the default is `brand`: a header in the brand's solid
   * colour. `neutral` leaves the header and caption unfilled.
   * @default 'brand'
   */
  tone?: TableTone;
  /**
   * Cell padding, type and the height of a row, on the standard scale.
   * @default 'md'
   */
  size?: TableSize;
  /**
   * Alternates the background of every other row.
   * @default false
   */
  striped?: boolean;
  /**
   * Highlights the row under the pointer. A table with `onRowClick` highlights anyway.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Pins the header row to the top of the table's scroll area. Needs a `maxHeight`.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Pins the first column to the start edge while the rest scrolls sideways; a number pins that many data columns. The checkbox
   * column, when there is one, is pinned beside them. The table pins at most four columns at an edge in all.
   * @default false
   */
  stickyFirstColumn?: boolean | number;
  /**
   * Pins the last column to the end edge while the rest scrolls sideways; a number pins that many data columns. The actions
   * column, when there is one, is pinned beside them. The table pins at most four columns at an edge in all.
   * @default false
   */
  stickyLastColumn?: boolean | number;
  /** Caps the height of the scroll area (any CSS `max-height`), so a long body scrolls inside it. */
  maxHeight?: CSSProperties["maxHeight"];
  /**
   * Gives a row the id its selection is kept by. The default reads the row's `id` and then its position in `data`.
   * Give it when the rows have no `id` field and the data can be reordered or replaced.
   */
  getRowId?: (row: TRow, index: number) => string;
  /**
   * Names a row for a screen reader ("Select Ada Lovelace"). Without it a row is "Row 3".
   */
  getRowLabel?: (row: TRow, index: number) => string;
  /**
   * `"client"` sorts and pages `data` in the browser; `"manual"` draws `data` as given and leaves the sorting and
   * paging to the caller, who answers `onSortChange` and `onPageChange` with new rows.
   * @default 'client'
   */
  sortMode?: DataTableSortMode;
  /**
   * Lets a person sort by several columns: a press with Shift held adds the column to the sort (or turns it round, then takes it
   * off), where a plain press makes it the only one. The columns then show their order. A list of several in `sort` is honoured
   * whether or not this is on.
   * @default true
   */
  multiSort?: boolean;
  /** The ordering. Controlled with `onSortChange`. */
  sort?: DataTableSort;
  /**
   * The ordering the table starts with.
   * @default []
   */
  defaultSort?: DataTableSort;
  /** Called with the ordering a person asked for. A controlled table changes only when `sort` does. */
  onSortChange?: (sort: DataTableSort) => void;
  /** The page, from 1. Controlled with `onPageChange`. Setting `pageSize` or adding a `DataTable.Pagination` turns paging on. */
  page?: number;
  /**
   * The page to begin on.
   * @default 1
   */
  defaultPage?: number;
  /** Called with the page a person asked for. A controlled table changes only when `page` does. */
  onPageChange?: (page: number) => void;
  /** Rows a page. Controlled with `onPageSizeChange`. */
  pageSize?: number;
  /**
   * Rows a page to begin with.
   * @default 10
   */
  defaultPageSize?: number;
  /** Called with the page size a person asked for. */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * The page sizes a person can choose from in `DataTable.Pagination`.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * How many rows there are in all, for a `manual` table that holds one page of them. Without it the count is
   * `data.length`.
   */
  totalCount?: number;
  /**
   * How many rows can be chosen: `"multiple"` adds a checkbox column with a header checkbox, `"single"` the same
   * without the header checkbox, and a new choice replaces the old.
   * @default 'none'
   */
  selectionMode?: DataTableSelectionMode;
  /** Says a row can't be chosen. Its checkbox is disabled, and the header checkbox leaves it out. */
  isRowSelectable?: (row: TRow) => boolean;
  /** The ids of the chosen rows. Controlled with `onSelectionChange`. */
  selection?: string[];
  /**
   * The rows chosen to begin with.
   * @default []
   */
  defaultSelection?: string[];
  /** Called with the ids a person asked to have chosen. A controlled table changes only when `selection` does. */
  onSelectionChange?: (selection: string[]) => void;
  /**
   * Whether every row of the whole table is chosen, on every page, without their ids being listed: "select all 137" for a table that
   * holds one page of them (`sortMode="manual"` with a `totalCount`). Every row shows as chosen, the count is the `totalCount`, and
   * unchecking one goes back to a list of ids (the page's rows but that one). Reset it (`onAllSelectedChange(false)`) when the filter
   * changes, since "all" meant the rows matching the old one. Controlled with `onAllSelectedChange`.
   */
  allSelected?: boolean;
  /**
   * Whether every row is chosen to begin with.
   * @default false
   */
  defaultAllSelected?: boolean;
  /** Called when a person chooses every row of the whole table, or goes back to a list of ids. */
  onAllSelectedChange?: (allSelected: boolean) => void;
  /**
   * Draws the detail of a row under it when it is opened, and adds a column of expand buttons (after the checkboxes) that open and
   * close it. What it returns fills one cell as wide as the table. Rows of different heights can't be drawn a window at a time,
   * so a table with this is never windowed, and the table sets no `aria-rowcount` or `aria-rowindex`, since the detail rows make
   * the number of rows unknowable across pages.
   */
  renderExpandedRow?: (row: TRow, context: { index: number }) => ReactNode;
  /** Says a row has no detail: its expand cell is left empty. Only read with `renderExpandedRow`. */
  isRowExpandable?: (row: TRow) => boolean;
  /**
   * `"multiple"` lets any number of rows be open; `"single"` closes the open row when another is opened.
   * @default 'multiple'
   */
  expandMode?: "multiple" | "single";
  /** The ids of the rows that are open. Controlled with `onExpandedChange`. */
  expanded?: string[];
  /**
   * The rows open to begin with.
   * @default []
   */
  defaultExpanded?: string[];
  /** Called with the ids a person asked to have open. A controlled table changes only when `expanded` does. */
  onExpandedChange?: (expanded: string[]) => void;
  /**
   * Draws a trailing column for each row's actions, usually an `IconButton` that opens a `Menu`. Its heading is
   * read by a screen reader and not drawn.
   */
  rowActions?: (row: TRow, index: number) => ReactNode;
  /**
   * The items of the menu a right-click, a long press or the context-menu key opens on a row: return
   * `ContextMenu` items (`ContextMenu.Item`, `.Separator`, …) for the row, or for the whole selection when the row
   * pressed is part of it. A press on a row that is not selected chooses it alone first (in a table with
   * `selectionMode`), so the menu is always about what the person sees marked; a press on a selected row keeps
   * the selection. The row carries `data-state="open"` while its menu is. A context menu is a shortcut: offer the
   * same actions in `rowActions` or the toolbar.
   */
  rowContextMenu?: (context: DataTableRowMenuContext<TRow>) => ReactNode;
  /**
   * Extra keys that open a row's `rowContextMenu` from the element that has focus in it, such as a row's checkbox
   * or button (`["Alt+ArrowDown"]`), for platforms with no context-menu key. See `ContextMenu.Trigger`'s `openOnKeys`.
   */
  rowContextMenuKeys?: string[];
  /**
   * Called when a row is pressed or Enter is pressed on it. Makes each row a tab stop, so offer the same action
   * another way as well (a link in the row), and don't rely on this alone. A press on a control inside the row
   * (a checkbox, a link, a menu button) is that control's, and doesn't reach this.
   */
  onRowClick?: (row: TRow, event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>) => void;
  /**
   * Shows placeholder rows in place of the data while it loads.
   * @default false
   */
  loading?: boolean;
  /**
   * How many placeholder rows a loading table draws.
   * @default 5
   */
  loadingRows?: number;
  /** What an empty table says: text, or an `EmptyState`. */
  emptyState?: ReactNode;
  /**
   * Draws only the rows in view. `"auto"` does so above 100 rows when the table isn't paged and has a
   * `maxHeight`; `true` and `false` decide it. Needs a `maxHeight` to have anything to scroll within.
   * @default 'auto'
   */
  virtualize?: "auto" | boolean;
  /** The ids of the columns that are not drawn. Controlled with `onHiddenColumnsChange`. */
  hiddenColumns?: string[];
  /**
   * The columns hidden to begin with.
   * @default []
   */
  defaultHiddenColumns?: string[];
  /** Called with the ids a person asked to have hidden. */
  onHiddenColumnsChange?: (hidden: string[]) => void;
  /**
   * Lets a person resize every column by dragging the end edge of its heading, or by keyboard on the handle (arrow keys, Shift for
   * larger steps, Home and End for the limits, Enter to reset). A column's own `resizable` turns it off or on for it. Each handle is a
   * tab stop, so a table with many resizable columns adds that many; turn it on where it is wanted.
   * @default false
   */
  resizable?: boolean;
  /**
   * The widths a person has given columns, in pixels, by column id; a column not listed has its `width`, or what its content asks
   * for. Controlled with `onColumnWidthsChange` (to remember them, say).
   */
  columnWidths?: Record<string, number>;
  /**
   * The widths to begin with.
   * @default {}
   */
  defaultColumnWidths?: Record<string, number>;
  /** Called with the widths a gesture asks for, on every step of a drag. A controlled table changes only when `columnWidths` does. */
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  /** The width of the column of checkboxes (any CSS length). */
  selectionColumnWidth?: CSSProperties["inlineSize"];
  /** The width of the column of row actions (any CSS length). It is as narrow as its button without one. */
  actionsColumnWidth?: CSSProperties["inlineSize"];
  /** Text written for the table, replacing the English defaults one by one. */
  labels?: Partial<DataTableLabels>;
  /**
   * Writes the numbers the table displays (a count in an announcement).
   * @default String
   */
  formatNumber?: (value: number) => string;
  /** Names the table, when there is no visible caption. */
  "aria-label"?: string;
  /** The id of an element that names the table. */
  "aria-labelledby"?: string;
  /** The id of an element that describes the table. */
  "aria-describedby"?: string;
  /** Standard DOM id, applied to the `<table>` element. */
  id?: string;
  /** Additional CSS classes, for the box that holds the toolbar, table and pagination. */
  className?: string;
  /** Inline styles for that same box. */
  style?: CSSProperties;
  /** Test identifier, applied to the `<table>` element. */
  "data-testid"?: string;
}

/** The properties of `DataTable.Toolbar`: a `TableToolbar` drawn above the table. */
export type DataTableToolbarProps = TableToolbarProps;

/** What `rowContextMenu` is told about the row a menu was opened on and the selection it belongs to. */
export interface DataTableRowMenuContext<TRow> {
  /** The row the menu was opened on. */
  row: TRow;
  /** The row's position in `data`. */
  index: number;
  /** The row's id, as `getRowId` gives it. */
  id: string;
  /**
   * The rows the menu acts on: the whole selection, in table order, when the row is part of it, and otherwise just
   * `row`. With every row chosen across pages (`allSelected`), the rows the table has, which are not all of them
   * when the caller holds one page.
   */
  rows: TRow[];
  /** How many rows the menu acts on: `rows.length`, or the total chosen across pages when `allSelected`. */
  count: number;
  /** Whether every row is chosen across pages, so `rows` is only the ones this table holds. */
  allSelected: boolean;
}

/** The properties of `DataTable.Selection`: `TableToolbar.Selection` read from the table's own selection. */
export interface DataTableSelectionProps extends Omit<TableToolbarSelectionProps, "count" | "totalCount" | "onClear"> {
  /**
   * Called to choose every row, for a table whose `data` holds only one page (a `manual` one) when you would rather list the ids
   * than use `allSelected`. Left out, a `client` table chooses every selectable row itself, and a `manual` one with a `totalCount`
   * chooses "all" (`allSelected`).
   */
  onSelectAll?: () => void;
}

/** The text `DataTable.Pagination` writes itself. */
export interface DataTablePaginationLabels {
  /** The range of rows shown: "1–10 of 47". */
  summary: (first: number, last: number, total: number) => string;
  /** The name of the page size select. */
  pageSize: string;
}

/** The properties of `DataTable.Pagination`: the page controls, a range summary and a page size select. */
export interface DataTablePaginationProps
  extends Omit<PaginationProps, "pageCount" | "value" | "defaultValue" | "onValueChange" | "labels" | "formatNumber" | "size"> {
  /**
   * The size of the page controls and the page size select. Smaller than `Pagination`'s own default, since the footer is
   * secondary to the rows above it.
   * @default 'sm'
   */
  size?: PaginationProps["size"];
  /**
   * Shows "1–10 of 47" beside the page numbers.
   * @default true
   */
  showSummary?: boolean;
  /**
   * Shows a select for how many rows a page, from the table's `pageSizeOptions`.
   * @default true
   */
  showPageSize?: boolean;
  /**
   * The direction of the page size select, which opens a Radix list that doesn't read the page's: pass `"rtl"` on a right-to-left
   * page. The rest of the footer follows the page's own direction.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** Text written for the pagination (the page controls keep `Pagination`'s own labels). */
  labels?: Partial<DataTablePaginationLabels>;
  /**
   * The labels of the `Pagination` inside, replacing its English defaults one by one.
   */
  paginationLabels?: PaginationProps["labels"];
  /**
   * Writes the numbers the pagination displays.
   * @default String
   */
  formatNumber?: (value: number) => string;
}

/** The text `DataTable.ColumnMenu` writes itself. */
export interface DataTableColumnMenuLabels {
  /** The trigger button's text, and the menu's name. */
  trigger: string;
  /** Why the last drawn column's item can't be turned off. */
  lastColumn: string;
}

/** The properties of `DataTable.ColumnMenu`: a button that opens a menu with one checkbox item per column. */
export interface DataTableColumnMenuProps {
  /**
   * The button's treatment, on `Button`'s scale.
   * @default 'secondary'
   */
  variant?: ButtonVariant;
  /**
   * The button's size, on the shared scale. Say the same size as the toolbar's other controls.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * The icon before the button's text, as a component reference. Pass `null` for none.
   * @default ColumnsIcon
   */
  icon?: PhosphorIcon | null;
  /**
   * Where the menu lines up with the button.
   * @default 'end'
   */
  align?: "start" | "center" | "end";
  /**
   * The direction of the menu, which is a Radix list that doesn't read the page's: pass `"rtl"` on a right-to-left page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** Text written for the menu, replacing the English defaults one by one. */
  labels?: Partial<DataTableColumnMenuLabels>;
  /** Additional CSS classes for the button. */
  className?: string;
  /** Inline styles for the button. */
  style?: CSSProperties;
  /** Standard DOM id, applied to the button. */
  id?: string;
  /** Test identifier for automated testing, on the button. */
  "data-testid"?: string;
}
