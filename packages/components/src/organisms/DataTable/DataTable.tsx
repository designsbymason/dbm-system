import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CaretRightIcon, CaretUpDownIcon } from "@dbm-system/icons";
import { cx, mergeDefined, useAnnouncement, useWindowedList } from "@dbm-system/utils";
import {
  Children,
  forwardRef,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ForwardedRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from "react";
import { Checkbox } from "../../atoms/Checkbox";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Table, type TableSize } from "../../molecules/Table";
import { lengthToPx, readLengthToken } from "./DataTable.length";
import { ColumnResizeHandle } from "./DataTable.resize";
import { DataTableContext, useControllableValue, type DataTableState } from "./DataTable.context";
import styles from "./DataTable.module.css";
import { clampPage, pageCountOf } from "./DataTable.page";
import { DataTableColumnMenu, DataTablePagination, DataTableSelection, DataTableToolbar } from "./DataTable.parts";
import { DataTableRowMenu } from "./DataTable.rowMenu";
import { headerState, idsBetween, setChosen } from "./DataTable.selection";
import { directionOf, nextDirection, sortRows } from "./DataTable.sort";
import type { DataTableColumn, DataTableLabels, DataTableProps, DataTableRowMenuContext, DataTableSort } from "./DataTable.types";

/** Above this many rows an unpaged table with a `maxHeight` draws only the ones in view. */
const WINDOW_THRESHOLD = 100;
/** Rows drawn beyond each edge of the visible ones, so a quick scroll shows no blank space. */
const OVERSCAN = 8;
/** The row height assumed until the token is read in the browser, so the first render is the same on a server. Not a design value. */
const FALLBACK_ROW_PX = 40;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const NO_IDS: string[] = [];
const NO_SORT: DataTableSort = [];
const NO_WIDTHS: Record<string, number> = {};
// Elements that answer a press themselves, which a row's own click must not also act on.
const INTERACTIVE =
  "a, button, input, select, textarea, label, summary, [role='checkbox'], [role='menuitem'], [role='button'], [role='link'], [role='switch']";

const sizeClass: Record<TableSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const makeLabels = (formatNumber: (value: number) => string): DataTableLabels => ({
  sorted: (column, direction) => `Sorted by ${column}, ${direction}`,
  sortedMultiple: (items) => `Sorted by ${items.map((item, index) => `${index === 0 ? "" : "then "}${item.column}, ${item.direction}`).join(", ")}`,
  sortOrder: (position) => `sort order ${position}`,
  sortCleared: "Sorting removed",
  selectAll: "Select all rows",
  selectRow: (rowLabel) => `Select ${rowLabel}`,
  row: (position) => `Row ${formatNumber(position)}`,
  selectColumn: "Select",
  actionsColumn: "Actions",
  rowMenu: (rowLabel) => `Actions for ${rowLabel}`,
  expandRow: (rowLabel) => `Expand ${rowLabel}`,
  collapseRow: (rowLabel) => `Collapse ${rowLabel}`,
  expandColumn: "Details",
  resizeColumn: (column) => `Resize ${column} column`,
  resizeHint: "Arrow keys resize, Shift for larger steps, Home and End for the limits, Enter resets",
  empty: "No results",
  loading: "Loading",
  rowsShown: (count, total) => `Showing ${formatNumber(count)} of ${formatNumber(total)} rows`,
});

const noSubscription = () => () => undefined;
const noSnapshot = (): undefined => undefined;

/** The number of columns the table pins: the data columns asked for, and the checkbox or actions column beside them. */
const pinned = (asked: boolean | number | undefined, extra: number): number => {
  const count = asked === true ? 1 : typeof asked === "number" && Number.isFinite(asked) ? Math.max(0, Math.floor(asked)) : 0;
  return count > 0 ? count + extra : 0;
};

const defaultRowId = (row: unknown, index: number): string => {
  const id = typeof row === "object" && row !== null ? (row as { id?: unknown }).id : undefined;
  return typeof id === "string" || typeof id === "number" ? String(id) : String(index);
};

const columnLabel = <TRow,>(column: DataTableColumn<TRow>): string =>
  column.headerLabel ?? (typeof column.header === "string" || typeof column.header === "number" ? String(column.header) : column.id);

const columnStyle = <TRow,>(column: DataTableColumn<TRow>, resized?: number): CSSProperties | undefined => {
  // A width a person dragged to is the whole of it: a fixed size, which a long cell is cut to.
  if (resized !== undefined) return { inlineSize: resized, minInlineSize: resized, maxInlineSize: resized };
  if (column.width === undefined && column.minWidth === undefined && column.maxWidth === undefined) return undefined;
  return { inlineSize: column.width, maxInlineSize: column.maxWidth ?? column.width, minInlineSize: column.minWidth };
};

const fixedWidth = (width: CSSProperties["inlineSize"] | undefined): CSSProperties | undefined =>
  width === undefined || width === "" ? undefined : { inlineSize: width, minInlineSize: width, maxInlineSize: width };

function toText(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return isValidElement(value) ? value : String(value);
}

interface Entry<TRow> {
  row: TRow;
  id: string;
  /** The row's position in `data`, whatever order it is shown in. */
  index: number;
}

/** Empty space standing in for the rows not drawn, as tall as that many rows. The height is worked out in CSS from the row-height token. */
function Spacer({ rows, columns }: { rows: number; columns: number }) {
  return (
    <tr aria-hidden="true" className={styles.spacerRow}>
      <td colSpan={columns} style={{ "--data-table-spacer-rows": rows } as CSSProperties} />
    </tr>
  );
}

function DataTableInner<TRow>(props: DataTableProps<TRow>, ref: ForwardedRef<HTMLTableElement>) {
  const {
    columns,
    data,
    children,
    getRowId = defaultRowId,
    getRowLabel,
    sort: sortProp,
    defaultSort = NO_SORT,
    onSortChange,
    sortMode = "client",
    multiSort = true,
    selectionMode = "none",
    selection: selectionProp,
    defaultSelection = NO_IDS,
    onSelectionChange,
    renderExpandedRow,
    isRowExpandable,
    expanded: expandedProp,
    defaultExpanded = NO_IDS,
    onExpandedChange,
    expandMode = "multiple",
    allSelected: allSelectedProp,
    defaultAllSelected = false,
    onAllSelectedChange,
    isRowSelectable,
    page: pageProp,
    defaultPage: defaultPageProp,
    onPageChange,
    pageSize: pageSizeProp,
    defaultPageSize: defaultPageSizeProp,
    onPageSizeChange,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    totalCount,
    virtualize = "auto",
    loading = false,
    loadingRows = 5,
    emptyState,
    rowActions,
    rowContextMenu,
    rowContextMenuKeys,
    onRowClick,
    resizable = false,
    columnWidths: columnWidthsProp,
    defaultColumnWidths = NO_WIDTHS,
    onColumnWidthsChange,
    selectionColumnWidth,
    actionsColumnWidth,
    hiddenColumns: hiddenProp,
    defaultHiddenColumns = NO_IDS,
    onHiddenColumnsChange,
    variant,
    tone = "brand",
    size = "md",
    striped,
    hoverable = true,
    stickyHeader,
    stickyFirstColumn,
    stickyLastColumn,
    maxHeight,
    labels: labelOverrides,
    formatNumber = String,
    caption,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    style,
    ...tableProps
  } = props;

  const labels = mergeDefined(makeLabels(formatNumber), labelOverrides);
  const manual = sortMode === "manual";

  const [sort, setSort] = useControllableValue(sortProp, defaultSort, onSortChange);
  const [selection, setSelection] = useControllableValue(selectionProp, defaultSelection, onSelectionChange);
  const [expanded, setExpanded] = useControllableValue(expandedProp, defaultExpanded, onExpandedChange);
  const [allSelected, setAllSelected] = useControllableValue(allSelectedProp, defaultAllSelected, onAllSelectedChange);
  const [columnWidths, setColumnWidths] = useControllableValue(columnWidthsProp, defaultColumnWidths, onColumnWidthsChange);
  const [hiddenColumns, setHiddenColumns] = useControllableValue(hiddenProp, defaultHiddenColumns, onHiddenColumnsChange);
  const [pageSize, setPageSizeState] = useControllableValue(pageSizeProp, defaultPageSizeProp ?? DEFAULT_PAGE_SIZE, onPageSizeChange);
  const [rawPage, setRawPage] = useControllableValue(pageProp, defaultPageProp ?? 1, onPageChange);

  // The direct children that are a pagination go below the table, and anything else above it.
  const { top, bottom, hasPagination } = useMemo(() => {
    const above: ReactNode[] = [];
    const below: ReactNode[] = [];
    let found = false;
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === DataTablePagination) {
        found = true;
        below.push(child);
      } else if (child !== null && child !== undefined && typeof child !== "boolean") {
        above.push(child);
      }
    });
    return { top: above, bottom: below, hasPagination: found };
  }, [children]);

  const paginated =
    hasPagination || [pageSizeProp, defaultPageSizeProp, pageProp, defaultPageProp, totalCount].some((value) => value !== undefined);

  const visibleColumns = useMemo(() => columns.filter((column) => !hiddenColumns.includes(column.id)), [columns, hiddenColumns]);
  // The order is worked out from the rows alone, so a `getRowId` or `isRowSelectable` written inline in the caller's JSX (a new
  // function each render) doesn't sort the rows again; only new `data`, a new `sort` or new `columns` do.
  const orderedRows = useMemo(() => {
    const indexed = data.map((row, index) => ({ row, index }));
    if (manual) return indexed;
    return sortRows(
      indexed,
      sort,
      columns.map((column) => ({
        id: column.id,
        accessor: column.accessor ? (entry: { row: TRow }) => column.accessor?.(entry.row) : undefined,
        compare: column.compare ? (a: { row: TRow }, b: { row: TRow }) => column.compare?.(a.row, b.row) ?? 0 : undefined,
      })),
    );
  }, [data, sort, columns, manual]);
  const ordered = useMemo<Entry<TRow>[]>(
    () => orderedRows.map(({ row, index }) => ({ row, index, id: getRowId(row, index) })),
    [orderedRows, getRowId],
  );

  const total = manual && totalCount !== undefined ? totalCount : ordered.length;
  const pageCount = paginated ? pageCountOf(total, pageSize) : 1;
  const page = paginated ? clampPage(rawPage, pageCount) : 1;
  const displayed = useMemo(
    () => (paginated && !manual ? ordered.slice((page - 1) * pageSize, page * pageSize) : ordered),
    [ordered, paginated, manual, page, pageSize],
  );
  const firstPosition = paginated ? (page - 1) * pageSize : 0;

  const selectable = useCallback((row: TRow) => (isRowSelectable ? isRowSelectable(row) : true), [isRowSelectable]);
  const selectedSet = useMemo(() => new Set(selection), [selection]);
  const displayedSelectableIds = useMemo(
    () => displayed.filter((entry) => selectable(entry.row)).map((entry) => entry.id),
    [displayed, selectable],
  );
  const selecting = selectionMode !== "none";
  const allMatching = allSelected && selectionMode === "multiple";
  const hasWrap = visibleColumns.some((column) => column.wrap);
  const hasActions = Boolean(rowActions);
  const expandable = Boolean(renderExpandedRow);
  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const detailsId = useId();
  const columnCount = visibleColumns.length + (selecting ? 1 : 0) + (expandable ? 1 : 0) + (hasActions ? 1 : 0);

  const windowed =
    !loading &&
    !hasWrap &&
    !expandable &&
    displayed.length > 0 &&
    (virtualize === true || (virtualize === "auto" && !paginated && maxHeight !== undefined && displayed.length > WINDOW_THRESHOLD));

  // The row's height in pixels, read from its token once the page is in the browser. A server (and a hydrating render)
  // gets `undefined`, so the first render is the same on both and the real height arrives right after.
  const rowPx = useSyncExternalStore(
    noSubscription,
    useCallback(() => readLengthToken(`--dbm-data-table-row-height-${size}`), [size]),
    noSnapshot,
  );
  const getItemSize = useCallback(() => rowPx ?? FALLBACK_ROW_PX, [rowPx]);
  const windowedList = useWindowedList({ count: displayed.length, getItemSize, enabled: windowed, overscan: OVERSCAN });
  // The window starts on an even row, so a striped table's alternating rows stay in step with their positions.
  const start = windowed ? windowedList.start - (windowedList.start % 2) : 0;
  const end = windowed ? windowedList.end : displayed.length;
  const visibleEntries = windowed ? displayed.slice(start, end) : displayed;

  const { message, announce } = useAnnouncement();
  const resizeHintId = useId();
  const lastToggled = useRef<string | undefined>(undefined);
  const shiftHeld = useRef(false);

  const setPage = useCallback((next: number) => setRawPage(clampPage(next, pageCount)), [setRawPage, pageCount]);
  const setPageSize = useCallback(
    (next: number) => {
      setPageSizeState(next);
      setRawPage(1);
      announce(labels.rowsShown(Math.min(next, total), total));
    },
    [setPageSizeState, setRawPage, announce, labels, total],
  );

  const selectAllRows = useMemo(() => {
    if (manual) {
      // The caller holds one page, so "all" is a state of its own rather than a list of ids it hasn't got.
      return totalCount === undefined
        ? undefined
        : () => {
            setSelection([]);
            setAllSelected(true);
          };
    }
    return () => setSelection(ordered.filter((entry) => selectable(entry.row)).map((entry) => entry.id));
  }, [manual, totalCount, ordered, selectable, setSelection, setAllSelected]);
  const selectableCount = useMemo(
    () => (manual ? totalCount : ordered.filter((entry) => selectable(entry.row)).length),
    [manual, totalCount, ordered, selectable],
  );

  const state: DataTableState = {
    selection,
    setSelection,
    selectedCount: allMatching ? (selectableCount ?? 0) : selection.length,
    allSelected: allMatching,
    setAllSelected,
    clearSelection: () => {
      if (allMatching) setAllSelected(false);
      setSelection([]);
    },
    selectableCount,
    sort,
    setSort,
    page,
    setPage,
    pageCount,
    pageSize,
    setPageSize,
    pageSizeOptions,
    total,
    paginated,
    columns: columns.map((column) => ({ id: column.id, label: columnLabel(column) })),
    expanded,
    setExpanded,
    columnWidths,
    setColumnWidths,
    hiddenColumns,
    setHiddenColumns,
    selectAllRows,
  };

  const pressHeader = (column: DataTableColumn<TRow>, event: MouseEvent<HTMLButtonElement>) => {
    const current = directionOf(sort, column.id);
    const next = nextDirection(current);
    let nextSort: DataTableSort;
    if (multiSort && event.shiftKey) {
      // Shift keeps the other columns: add this one, turn it round, or take it off.
      if (!next) nextSort = sort.filter((item) => item.columnId !== column.id);
      else if (current) nextSort = sort.map((item) => (item.columnId === column.id ? { ...item, direction: next } : item));
      else nextSort = [...sort, { columnId: column.id, direction: next }];
    } else {
      nextSort = next ? [{ columnId: column.id, direction: next }] : [];
    }
    setSort(nextSort);
    const named = nextSort.map((item) => ({
      column: columnLabel(columns.find((candidate) => candidate.id === item.columnId) ?? column),
      direction: item.direction,
    }));
    const [only] = named;
    announce(only === undefined ? labels.sortCleared : named.length === 1 ? labels.sorted(only.column, only.direction) : labels.sortedMultiple(named));
  };

  const toggleRow = (entry: Entry<TRow>, chosen: boolean) => {
    if (allMatching) {
      // Every row was chosen; unchecking one goes back to a list of ids: the page's rows, but that one.
      setAllSelected(false);
      setSelection(displayedSelectableIds.filter((id) => id !== entry.id));
      lastToggled.current = entry.id;
      shiftHeld.current = false;
      return;
    }
    if (selectionMode === "single") {
      setSelection(chosen ? [entry.id] : []);
    } else {
      const range =
        shiftHeld.current && lastToggled.current !== undefined
          ? idsBetween(displayedSelectableIds, lastToggled.current, entry.id)
          : [entry.id];
      setSelection(setChosen(selection, range, chosen));
    }
    shiftHeld.current = false;
    lastToggled.current = entry.id;
  };

  // A press on a row that isn't chosen chooses it alone first, so a row's menu is about what is marked; a press on a chosen
  // row keeps the selection, and the menu is about all of it.
  const chooseForMenu = (entry: Entry<TRow>) => {
    if (!selecting || !selectable(entry.row) || allMatching || selectedSet.has(entry.id)) return;
    setSelection([entry.id]);
    lastToggled.current = entry.id;
  };
  const menuContext = (entry: Entry<TRow>): DataTableRowMenuContext<TRow> => {
    const part = allMatching ? selectable(entry.row) : selectedSet.has(entry.id);
    const rows = part
      ? ordered.filter((candidate) => (allMatching ? selectable(candidate.row) : selectedSet.has(candidate.id))).map((candidate) => candidate.row)
      : [entry.row];
    return {
      row: entry.row,
      index: entry.index,
      id: entry.id,
      rows,
      count: part && allMatching ? (selectableCount ?? rows.length) : rows.length,
      allSelected: part && allMatching,
    };
  };

  const toggleExpanded = (id: string) => {
    if (expandedSet.has(id)) setExpanded(expanded.filter((candidate) => candidate !== id));
    else setExpanded(expandMode === "single" ? [id] : [...expanded, id]);
  };

  const toggleHeader = () => {
    if (allMatching) {
      setAllSelected(false);
      setSelection([]);
      return;
    }
    const current = headerState(selectedSet, displayedSelectableIds);
    setSelection(setChosen(selection, displayedSelectableIds, current !== true));
  };

  const rowPress = (row: TRow, event: MouseEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;
    const interactive = (event.target as Element).closest(INTERACTIVE);
    if (interactive && event.currentTarget.contains(interactive)) return;
    onRowClick(row, event);
  };
  const rowKey = (row: TRow, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row, event);
    }
  };

  const warnedDuplicate = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const seen = new Set<string>();
    for (const entry of ordered) {
      if (seen.has(entry.id)) {
        // Once for each id, however often the rows are drawn again.
        if (warnedDuplicate.current !== entry.id) {
          warnedDuplicate.current = entry.id;
          console.warn(
            `DataTable: two rows have the id "${entry.id}", so their selection can't be told apart. Give \`getRowId\` an id that no other row has.`,
          );
        }
        break;
      }
      seen.add(entry.id);
    }
  }, [ordered]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    for (const column of columns) {
      if (!manual && column.sortable && !column.accessor && !column.compare) {
        console.warn(`DataTable: column "${column.id}" is \`sortable\` but has no \`accessor\` or \`compare\`, so there is nothing to sort by.`);
      }
      if (typeof column.header !== "string" && typeof column.header !== "number" && !column.headerLabel) {
        console.warn(`DataTable: column "${column.id}" has a heading that isn't text and no \`headerLabel\`, so its name falls back to its id.`);
      }
    }
    if (!caption && !ariaLabel && !ariaLabelledBy) {
      console.warn("DataTable: give the table a name with `caption`, `aria-label` or `aria-labelledby`.");
    }
    if (virtualize === true && (hasWrap || expandable)) {
      console.warn(`DataTable: \`virtualize\` needs rows of one height, so it is ignored while ${expandable ? "rows can be expanded" : "a column has `wrap`"}.`);
    }
  }, [columns, caption, ariaLabel, ariaLabelledBy, virtualize, hasWrap, expandable, manual]);

  const renderHeaderCell = (column: DataTableColumn<TRow>) => {
    const direction = directionOf(sort, column.id);
    const position = sort.length > 1 ? sort.findIndex((item) => item.columnId === column.id) + 1 : 0;
    const stored = columnWidths[column.id];
    const canResize = column.resizable ?? resizable;
    const label = columnLabel(column);
    return (
      <Table.HeaderCell
        key={column.id}
        align={column.align}
        numeric={column.numeric}
        style={columnStyle(column, stored)}
        className={cx((column.width !== undefined || column.maxWidth !== undefined || stored !== undefined) && styles.truncate, canResize && styles.resizableCell)}
        {...(column.sortable && direction ? { "aria-sort": direction } : {})}
        // The handle inside is named too, and would otherwise be read as part of the heading's own name.
        {...(canResize ? { "aria-label": label } : {})}
      >
        {column.sortable ? (
          <button
            type="button"
            className={cx(styles.sortButton, tone !== "neutral" && styles.sortButtonTinted)}
            onClick={(event) => pressHeader(column, event)}
          >
            <span className={styles.sortLabel}>{column.header}</span>
            {position > 0 && (
              <>
                <span aria-hidden="true" className={styles.sortOrder}>
                  {formatNumber(position)}
                </span>
                <VisuallyHidden>, {labels.sortOrder(position)}</VisuallyHidden>
              </>
            )}
            <Icon
              icon={direction === "ascending" ? ArrowUpIcon : direction === "descending" ? ArrowDownIcon : CaretUpDownIcon}
              size="xs"
              className={cx(styles.sortIcon, direction === undefined && styles.sortIconIdle)}
            />
          </button>
        ) : (
          column.header
        )}
        {canResize && (
          <ColumnResizeHandle
            label={label}
            name={labels.resizeColumn(label)}
            hintId={resizeHintId}
            minimum={lengthToPx(column.minWidth)}
            maximum={lengthToPx(column.maxWidth)}
            tinted={tone !== "neutral"}
            onResize={(width) => setColumnWidths({ ...columnWidths, [column.id]: width })}
            onReset={() => {
              const { [column.id]: _dropped, ...rest } = columnWidths;
              setColumnWidths(rest);
            }}
          />
        )}
      </Table.HeaderCell>
    );
  };

  const renderRow = (entry: Entry<TRow>, position: number) => {
    const chosen = allMatching ? selectable(entry.row) : selectedSet.has(entry.id);
    const rowLabel = getRowLabel ? getRowLabel(entry.row, entry.index) : labels.row(firstPosition + position + 1);
    const canExpand = expandable && (isRowExpandable ? isRowExpandable(entry.row) : true);
    const open = canExpand && expandedSet.has(entry.id);
    const detailId = `${detailsId}-${entry.id.replace(/\s/g, "_")}`;
    const row = (
      <Table.Row
        selected={chosen}
        {...(open ? { "data-expanded": "" } : {})}
        {...((windowed || paginated) && !expandable ? { "aria-rowindex": firstPosition + position + 2 } : {})}
        {...(onRowClick
          ? {
              tabIndex: 0,
              onClick: (event: MouseEvent<HTMLTableRowElement>) => rowPress(entry.row, event),
              onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => rowKey(entry.row, event),
            }
          : {})}
        className={cx(onRowClick && styles.rowClickable, rowContextMenu && styles.rowMenu)}
      >
        {selecting && (
          <Table.Cell className={styles.selectCell} style={fixedWidth(selectionColumnWidth)}>
            <span className={styles.selectBox}>
              <Checkbox
                size={size}
                checked={chosen}
                disabled={!selectable(entry.row)}
                aria-label={labels.selectRow(rowLabel)}
                onClick={(event) => {
                  shiftHeld.current = event.shiftKey;
                }}
                onCheckedChange={(next) => toggleRow(entry, next === true)}
              />
            </span>
          </Table.Cell>
        )}
        {expandable && (
          <Table.Cell className={styles.expandCell}>
            {canExpand ? (
              <IconButton
                icon={open ? CaretDownIcon : CaretRightIcon}
                size={size}
                variant="ghost"
                className={styles.expandButton}
                aria-label={open ? labels.collapseRow(rowLabel) : labels.expandRow(rowLabel)}
                aria-expanded={open}
                aria-controls={open ? detailId : undefined}
                onClick={() => toggleExpanded(entry.id)}
              />
            ) : null}
          </Table.Cell>
        )}
        {visibleColumns.map((column) => {
          const content = column.cell ? column.cell(entry.row, { index: entry.index }) : toText(column.accessor?.(entry.row));
          const cut = column.width !== undefined || column.maxWidth !== undefined || columnWidths[column.id] !== undefined;
          const common = {
            align: column.align,
            numeric: column.numeric,
            style: columnStyle(column, columnWidths[column.id]),
            className: cx(cut && styles.truncate),
            // A cell cut with an ellipsis says its whole text on hover, for a column that has a width and plain text in it.
            title: cut && (typeof content === "string" || typeof content === "number") ? String(content) : undefined,
          };
          return column.rowHeader ? (
            <Table.HeaderCell key={column.id} scope="row" {...common}>
              {content}
            </Table.HeaderCell>
          ) : (
            <Table.Cell key={column.id} {...common}>
              {content}
            </Table.Cell>
          );
        })}
        {hasActions && <Table.Cell className={styles.actionsCell} style={fixedWidth(actionsColumnWidth)}>{rowActions?.(entry.row, entry.index)}</Table.Cell>}
      </Table.Row>
    );
    return (
      <>
      {rowContextMenu ? (
        <DataTableRowMenu
          name={labels.rowMenu(rowLabel)}
          keys={rowContextMenuKeys}
          onOpen={() => chooseForMenu(entry)}
          renderItems={() => rowContextMenu(menuContext(entry))}
        >
          {row}
        </DataTableRowMenu>
      ) : (
        row
      )}
      {open && (
        <>
          {/* A hidden row keeps the striping in step: the detail row and this one make two rows after the one it belongs to. */}
          <tr hidden aria-hidden="true" />
          <tr id={detailId} className={styles.detailRow}>
            <Table.Cell colSpan={columnCount} className={styles.detailCell}>
              {renderExpandedRow?.(entry.row, { index: entry.index })}
            </Table.Cell>
          </tr>
        </>
      )}
      </>
    );
  };

  return (
    <DataTableContext.Provider value={state}>
      <div className={cx(styles.root, className)} style={style}>
        {top}
        <Table
          {...tableProps}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          ref={ref}
          containerRef={windowed ? windowedList.containerRef : undefined}
          variant={variant}
          tone={tone}
          size={size}
          striped={striped}
          hoverable={hoverable || Boolean(onRowClick)}
          stickyHeader={stickyHeader}
          stickyFirstColumn={pinned(stickyFirstColumn, (selecting ? 1 : 0) + (expandable ? 1 : 0))}
          stickyLastColumn={pinned(stickyLastColumn, hasActions ? 1 : 0)}
          maxHeight={maxHeight}
          className={cx(styles.table, sizeClass[size], !hasWrap && styles.fixedRows)}
          {...((windowed || paginated) && !expandable ? { "aria-rowcount": total + 1 } : {})}
        >
          {caption && <Table.Caption>{caption}</Table.Caption>}
          <Table.Header>
            <Table.Row {...((windowed || paginated) && !expandable ? { "aria-rowindex": 1 } : {})}>
              {selecting && (
                <Table.HeaderCell className={styles.selectCell} style={fixedWidth(selectionColumnWidth)}>
                  {selectionMode === "multiple" ? (
                    <span className={styles.selectBox}>
                      <Checkbox
                        size={size}
                        checked={allMatching ? true : headerState(selectedSet, displayedSelectableIds)}
                        disabled={displayedSelectableIds.length === 0}
                        aria-label={labels.selectAll}
                        onCheckedChange={toggleHeader}
                      />
                    </span>
                  ) : (
                    <VisuallyHidden>{labels.selectColumn}</VisuallyHidden>
                  )}
                </Table.HeaderCell>
              )}
              {expandable && (
                <Table.HeaderCell className={styles.expandCell}>
                  <VisuallyHidden>{labels.expandColumn}</VisuallyHidden>
                </Table.HeaderCell>
              )}
              {visibleColumns.map(renderHeaderCell)}
              {hasActions && (
                <Table.HeaderCell className={styles.actionsCell} style={fixedWidth(actionsColumnWidth)}>
                  <VisuallyHidden>{labels.actionsColumn}</VisuallyHidden>
                </Table.HeaderCell>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body loading={loading} loadingRows={loadingRows} loadingLabel={labels.loading}>
            {displayed.length === 0 ? (
              <Table.Empty colSpan={Math.max(1, columnCount)}>{emptyState ?? labels.empty}</Table.Empty>
            ) : (
              <>
                {windowed && start > 0 && (
                  <>
                    <Spacer rows={start} columns={columnCount} />
                    {/* A hidden row keeps the striping in step: with the spacer it makes two rows ahead of the first one drawn. */}
                    <tr hidden aria-hidden="true" />
                  </>
                )}
                {visibleEntries.map((entry, offset) => (
                  <Fragment key={entry.id}>{renderRow(entry, (windowed ? start : 0) + offset)}</Fragment>
                ))}
                {windowed && displayed.length - end > 0 && <Spacer rows={displayed.length - end} columns={columnCount} />}
              </>
            )}
          </Table.Body>
        </Table>
        {bottom}
        {resizable || columns.some((column) => column.resizable) ? <VisuallyHidden id={resizeHintId}>{labels.resizeHint}</VisuallyHidden> : null}
        <VisuallyHidden role="status">{message}</VisuallyHidden>
      </div>
    </DataTableContext.Provider>
  );
}

type DataTableComponent = (<TRow>(props: DataTableProps<TRow> & RefAttributes<HTMLTableElement>) => ReactElement | null) & {
  displayName?: string;
  Toolbar: typeof DataTableToolbar;
  ColumnMenu: typeof DataTableColumnMenu;
  Selection: typeof DataTableSelection;
  Pagination: typeof DataTablePagination;
};

const DataTableRoot = forwardRef(DataTableInner) as unknown as DataTableComponent;
DataTableRoot.displayName = "DataTable";
DataTableRoot.Toolbar = DataTableToolbar;
DataTableRoot.ColumnMenu = DataTableColumnMenu;
DataTableRoot.Selection = DataTableSelection;
DataTableRoot.Pagination = DataTablePagination;

/**
 * A table of data given as `columns` and `data`, with sorting, row selection, paging, a long table drawn a window at a time,
 * loading and empty states, row actions and hidden columns. It draws a `Table` (a native `<table>` in its own scroll frame),
 * and holds the sort, the choice, the page, the page size and the hidden columns, each controlled (`value` + `onValueChange`) or
 * uncontrolled (`defaultValue`). It sorts and pages `data` in the browser, or with `sortMode="manual"` draws the rows it is given
 * and asks for new ones. `DataTable.Toolbar`, `DataTable.Selection` and `DataTable.Pagination` are placed as direct children, and
 * `useDataTable()` reads and changes the state from your own parts.
 *
 * `ref`, `id`, `data-testid` and the `aria-*` props reach the `<table>`; `className` and `style` go on the box around the toolbar,
 * the table and the pagination. Define `columns` once (or `useMemo` it): a new array each render sorts the rows again.
 *
 * @example
 * ```tsx
 * const columns: DataTableColumn<Employee>[] = [
 *   { id: "name", header: "Name", accessor: (row) => row.name, sortable: true, rowHeader: true },
 *   { id: "salary", header: "Salary", accessor: (row) => row.salary, sortable: true, numeric: true },
 * ];
 *
 * <DataTable aria-label="Team" columns={columns} data={employees} selectionMode="multiple" getRowLabel={(row) => row.name}>
 *   <DataTable.Pagination />
 * </DataTable>
 * ```
 */
export const DataTable = DataTableRoot;
