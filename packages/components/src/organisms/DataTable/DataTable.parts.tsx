import { ColumnsIcon } from "@dbm-system/icons";
import { cx, mergeDefined } from "@dbm-system/utils";
import { forwardRef, useContext } from "react";
import { Button } from "../../atoms/Button";
import { Pagination } from "../../molecules/Pagination";
import { Select } from "../../molecules/Select";
import { TableToolbar } from "../../molecules/TableToolbar";
import { Menu } from "../Menu";
import { DataTableContext, useDataTable } from "./DataTable.context";
import styles from "./DataTable.module.css";
import type {
  DataTableColumnMenuLabels,
  DataTableColumnMenuProps,
  DataTablePaginationLabels,
  DataTablePaginationProps,
  DataTableSelectionProps,
  DataTableToolbarProps,
} from "./DataTable.types";
import { rangeOf } from "./DataTable.page";
import { useDirection } from "../../atoms/DirectionProvider";

// Each number is wrapped in a bidirectional isolate (U+2068 … U+2069): in a script with right-to-left digits the dash between two
// numbers joins their run and a left-to-right page reads "1–10" as "10-1" (`05-component-api-conventions.md` §3).
const isolate = (text: string) => `\u2068${text}\u2069`;

const makePaginationLabels = (formatNumber: (value: number) => string): DataTablePaginationLabels => ({
  summary: (first, last, total) => `${isolate(formatNumber(first))}–${isolate(formatNumber(last))} of ${isolate(formatNumber(total))}`,
  pageSize: "Rows per page",
});

/**
 * The bar above a `DataTable`: a `TableToolbar`, so it takes the same parts (`TableToolbar.Search`, `.Filter`,
 * `.ActiveFilters`, `.Summary`) and `DataTable.Selection`. Place it as a direct child of the `DataTable`; it is drawn
 * above the table.
 *
 * @example
 * ```tsx
 * <DataTable aria-label="Team" columns={columns} data={rows}>
 *   <DataTable.Toolbar aria-label="Team table tools">
 *     <TableToolbar.Row>
 *       <TableToolbar.Search>
 *         <SearchInput aria-label="Search the team" onSearch={setQuery} />
 *       </TableToolbar.Search>
 *     </TableToolbar.Row>
 *   </DataTable.Toolbar>
 * </DataTable>
 * ```
 */
const DataTableToolbar = forwardRef<HTMLDivElement, DataTableToolbarProps>((props, ref) => <TableToolbar {...props} ref={ref} />);
DataTableToolbar.displayName = "DataTable.Toolbar";

/**
 * The bulk-action row of a `DataTable.Toolbar`: it appears when rows are chosen, says how many, offers "clear" (and
 * "select all N" when it can), and holds your bulk actions as its children. A `TableToolbar.Selection` read from the
 * table's own selection.
 *
 * @example
 * ```tsx
 * <DataTable.Toolbar aria-label="Team table tools">
 *   <DataTable.Selection>
 *     <Toolbar aria-label="Bulk actions" variant="secondary">
 *       <Toolbar.Button>Delete</Toolbar.Button>
 *     </Toolbar>
 *   </DataTable.Selection>
 * </DataTable.Toolbar>
 * ```
 */
const DataTableSelection = forwardRef<HTMLDivElement, DataTableSelectionProps>(({ onSelectAll, ...props }, ref) => {
  const table = useDataTable();
  return (
    <TableToolbar.Selection
      {...props}
      ref={ref}
      count={table.selectedCount}
      totalCount={table.selectableCount}
      onClear={table.clearSelection}
      onSelectAll={onSelectAll ?? table.selectAllRows}
    />
  );
});
DataTableSelection.displayName = "DataTable.Selection";

/**
 * The footer of a `DataTable`: the page controls, "1–10 of 47" and a page size select, all read from the table's own
 * page. Place it as a direct child of the `DataTable`; it is drawn below the table, and its presence turns paging on.
 *
 * @example
 * ```tsx
 * <DataTable aria-label="Team" columns={columns} data={rows} defaultPageSize={10} pageSizeOptions={[5, 10, 25]}>
 *   <DataTable.Pagination />
 * </DataTable>
 * ```
 */
const DataTablePagination = forwardRef<HTMLDivElement, DataTablePaginationProps>(
  (
    {
      showSummary = true,
      showPageSize = true,
      labels: labelOverrides,
      paginationLabels,
      formatNumber = String,
      dir: dirProp,
      size = "sm",
      className,
      style,
      "data-testid": dataTestId,
      id,
      ...paginationProps
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const table = useContext(DataTableContext);
    if (!table) throw new Error("DataTable.Pagination must be used inside a DataTable, as one of its children.");
    const labels = mergeDefined(makePaginationLabels(formatNumber), labelOverrides);
    const { first, last } = rangeOf(table.page, table.pageSize, table.total);
    const summary = labels.summary(first, last, table.total);
    // The widest the summary can be, so the controls beside it stay put as the numbers change (a fixed width in digits).
    const widest = labels.summary(table.total, table.total, table.total).length;
    const options = table.pageSizeOptions.includes(table.pageSize)
      ? table.pageSizeOptions
      : [...table.pageSizeOptions, table.pageSize].sort((a, b) => a - b);

    return (
      <div ref={ref} id={id} data-testid={dataTestId} className={cx(styles.pagination, className)} style={style}>
        <div className={styles.paginationMeta}>
          {showSummary && (
            <span className={styles.summary} style={{ minInlineSize: `${widest}ch` }}>
              {summary}
            </span>
          )}
          {showPageSize && (
            <span className={styles.pageSize}>
              <Select
                size={size}
                value={String(table.pageSize)}
                onValueChange={(next) => table.setPageSize(Number(next))}
                dir={dir}
                aria-label={labels.pageSize}
                className={styles.pageSizeSelect}
              >
                {options.map((option) => (
                  <Select.Option key={option} value={String(option)}>
                    {formatNumber(option)}
                  </Select.Option>
                ))}
              </Select>
            </span>
          )}
        </div>
        <Pagination
          {...paginationProps}
          size={size}
          pageCount={table.pageCount}
          value={table.page}
          onValueChange={table.setPage}
          labels={paginationLabels}
          formatNumber={formatNumber}
        />
      </div>
    );
  },
);
DataTablePagination.displayName = "DataTable.Pagination";

const columnMenuLabels: DataTableColumnMenuLabels = {
  trigger: "Columns",
  lastColumn: "At least one column stays",
};

/**
 * A button that opens a menu of the table's columns, each a checkbox item that shows or hides it. It reads and sets the table's
 * hidden columns (`hiddenColumns`, controlled or not), and the last column still drawn can't be turned off. Place it anywhere in
 * the table's children, usually in the toolbar.
 *
 * @example
 * ```tsx
 * <DataTable aria-label="Team" columns={columns} data={rows}>
 *   <DataTable.Toolbar aria-label="Team table tools">
 *     <TableToolbar.Row>
 *       <Spacer />
 *       <DataTable.ColumnMenu />
 *     </TableToolbar.Row>
 *   </DataTable.Toolbar>
 * </DataTable>
 * ```
 */
const DataTableColumnMenu = forwardRef<HTMLButtonElement, DataTableColumnMenuProps>(
  (
    { variant = "secondary", size = "md", icon = ColumnsIcon, align = "end", dir: dirProp, labels: labelOverrides, className, style, id, "data-testid": dataTestId },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const table = useDataTable();
    const labels = mergeDefined(columnMenuLabels, labelOverrides);
    const shown = table.columns.filter((column) => !table.hiddenColumns.includes(column.id));
    return (
      <Menu dir={dir}>
        <Menu.Trigger asChild>
          <Button
            ref={ref}
            id={id}
            data-testid={dataTestId}
            className={className}
            style={style}
            variant={variant}
            size={size}
            leadingIcon={icon ?? undefined}
          >
            {labels.trigger}
          </Button>
        </Menu.Trigger>
        <Menu.Content align={align} size={size} aria-label={labels.trigger}>
          {table.columns.map((column) => {
            const checked = !table.hiddenColumns.includes(column.id);
            const last = checked && shown.length === 1;
            return (
              <Menu.CheckboxItem
                key={column.id}
                checked={checked}
                disabled={last}
                disabledReason={last ? labels.lastColumn : undefined}
                onCheckedChange={(next) =>
                  table.setHiddenColumns(next ? table.hiddenColumns.filter((id) => id !== column.id) : [...table.hiddenColumns, column.id])
                }
              >
                {column.label}
              </Menu.CheckboxItem>
            );
          })}
        </Menu.Content>
      </Menu>
    );
  },
);
DataTableColumnMenu.displayName = "DataTable.ColumnMenu";

export { DataTableColumnMenu, DataTablePagination, DataTableSelection, DataTableToolbar };
