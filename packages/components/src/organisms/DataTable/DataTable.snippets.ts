// The code shown under each story's "Show code" button on DataTable's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default, fills every
// handler with a no-op, prints an icon as `{ $$typeof: Symbol(react.forward_ref) … }` and freezes state. Each snippet here
// is the smallest real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

const columnsNote = `{/* columns: [{ id: "name", header: "Name", accessor: (row) => row.name, sortable: true, rowHeader: true }, …]
    rows: your array of rows. Each row needs an \`id\`, or pass getRowId. */}`;

export const dataTableSnippets = {
  sorting: `${columnsNote}
{/* A header button cycles ascending, descending, none. aria-sort and a live announcement say so. A press with Shift held
    adds the column to the sort instead of replacing it, and the columns show their order (multiSort, on by default).
    Controlled: sort={sort} onSortChange={setSort}. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  defaultSort={[{ columnId: "salary", direction: "descending" }]}
/>`,

  selection: `${columnsNote}
{/* selectionMode: "multiple" adds a checkbox column and a header checkbox; "single" replaces the choice.
    The ids are kept across sorting and pages. Controlled: selection={ids} onSelectionChange={setIds}. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  selectionMode="multiple"
  getRowLabel={(row) => row.name}
  isRowSelectable={(row) => row.status !== "On leave"}
/>`,

  pagination: `${columnsNote}
{/* DataTable.Pagination turns paging on: the page controls, "1–10 of 87" and a page size select. */}
<DataTable aria-label="Team" columns={columns} data={rows} defaultPageSize={10} pageSizeOptions={[5, 10, 25]}>
  <DataTable.Pagination />
</DataTable>`,

  withToolbar: `${columnsNote}
{/* query, setQuery and the filtered rows are the app's own state. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={filteredRows}
  selectionMode="multiple"
  getRowLabel={(row) => row.name}
  emptyState="No one matches that search"
>
  <DataTable.Toolbar aria-label="Team table tools">
    <TableToolbar.Row>
      <TableToolbar.Search>
        <SearchInput aria-label="Search the team" onSearch={setQuery} />
      </TableToolbar.Search>
      <Spacer />
      <TableToolbar.Summary count={filteredRows.length} total={rows.length} />
    </TableToolbar.Row>
    <DataTable.Selection>
      <Toolbar aria-label="Bulk actions" variant="secondary">
        <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
      </Toolbar>
    </DataTable.Selection>
  </DataTable.Toolbar>
  <DataTable.Pagination />
</DataTable>`,

  rowActions: `${columnsNote}
{/* DotsThreeIcon comes from @dbm-system/icons. rowActions draws a trailing column; the menu is your own. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  rowActions={(row) => (
    <Menu>
      <Menu.Trigger asChild>
        <IconButton icon={DotsThreeIcon} variant="ghost" size="sm" aria-label={\`Actions for \${row.name}\`} />
      </Menu.Trigger>
      <Menu.Content align="end">
        <Menu.Item>Edit</Menu.Item>
        <Menu.Item tone="danger">Delete</Menu.Item>
      </Menu.Content>
    </Menu>
  )}
/>`,

  rowContextMenu: `${columnsNote}
{/* The menu opens on a right-click, a long press or the context-menu key. A press on a row that isn't chosen chooses it alone
    first, so rows is everything marked. Offer the same actions in rowActions or the toolbar: a context menu is a shortcut. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  selectionMode="multiple"
  rowContextMenuKeys={["Alt+ArrowDown"]}
  rowContextMenu={({ count }) => (
    <>
      <ContextMenu.Item>{count > 1 ? \`Edit \${count} people\` : "Edit"}</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item tone="danger">{count > 1 ? "Remove all" : "Remove"}</ContextMenu.Item>
    </>
  )}
/>`,

  longTable: `${columnsNote}
{/* Above 100 rows, an unpaged table with a maxHeight draws only the rows in view; every row is one line of
    a fixed height. aria-rowcount and aria-rowindex tell a screen reader the real size. */}
<DataTable aria-label="Team" columns={columns} data={thousandsOfRows} maxHeight="24rem" stickyHeader striped />`,

  serverSide: `${columnsNote}
{/* sortMode="manual": the table draws data as given and asks. Answer onSortChange and onPageChange with new rows, and say
    how many there are in all with totalCount. Its "Select all 137" chooses every row of every page without listing their ids
    (allSelected / onAllSelectedChange): reset it when the filter changes, since "all" meant the rows matching the old one. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={pageOfRows}
  sortMode="manual"
  totalCount={137}
  loading={isFetching}
  loadingRows={pageSize}
  selectionMode="multiple"
  getRowLabel={(row) => row.name}
  sort={sort}
  onSortChange={setSort}
  page={page}
  onPageChange={setPage}
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
>
  <DataTable.Toolbar aria-label="Team table tools">
    <DataTable.Selection />
  </DataTable.Toolbar>
  <DataTable.Pagination />
</DataTable>`,

  columnVisibility: `${columnsNote}
{/* DataTable.ColumnMenu is a button that opens one checkbox item per column; the last column drawn can't be turned off.
    hiddenColumns / onHiddenColumnsChange make it controlled (to keep it in the URL, say); defaultHiddenColumns is uncontrolled.
    Inside the table's children, useDataTable() reads and sets the same list for a menu of your own. */}
<DataTable aria-label="Team" columns={columns} data={rows} defaultHiddenColumns={["started"]}>
  <DataTable.Toolbar aria-label="Team table tools">
    <TableToolbar.Row>
      <Spacer />
      <DataTable.ColumnMenu />
    </TableToolbar.Row>
  </DataTable.Toolbar>
</DataTable>`,

  loadingAndEmpty: `${columnsNote}
{/* loading draws placeholder rows (and aria-busy); an empty table says emptyState, or "No results". */}
<DataTable aria-label="Team" columns={columns} data={[]} loading loadingRows={4} />
<DataTable
  aria-label="Team"
  columns={columns}
  data={[]}
  emptyState={
    <EmptyState size="sm">
      <EmptyState.Title>No one on the team yet</EmptyState.Title>
      <EmptyState.Description>People you add will show here.</EmptyState.Description>
    </EmptyState>
  }
/>`,

  sizes: `${columnsNote}
{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the cell type size, the row height and the controls in it. */}
<DataTable aria-label="Team" columns={columns} data={rows} size="sm" selectionMode="multiple" />`,

  expandableRows: `${columnsNote}
{/* renderExpandedRow draws the detail under a row and adds a column of expand buttons (aria-expanded, named for the row). The
    open rows are expanded / onExpandedChange (or defaultExpanded); expandMode="single" closes the open row when another opens.
    isRowExpandable leaves a row's cell empty. A table with expandable rows is never drawn a window at a time. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  striped
  selectionMode="multiple"
  getRowLabel={(row) => row.name}
  defaultExpanded={["e2"]}
  isRowExpandable={(row) => row.status === "Active"}
  renderExpandedRow={(row) => (
    <DescriptionList size="sm" variant="ghost">
      <DescriptionList.Item>
        <DescriptionList.Term>Contact</DescriptionList.Term>
        <DescriptionList.Details>{row.email}</DescriptionList.Details>
      </DescriptionList.Item>
    </DescriptionList>
  )}
/>`,

  density: `{/* A density toggle needs no prop of its own: size sets the type, the padding and the height of a row together, so a
    toggle is a piece of your state handed to it. Keep the choice where the person's other settings live (storage, a profile). */}
{/* const [density, setDensity] = useState<"sm" | "md" | "lg">("md"); */}
<ToggleGroup aria-label="Row density" size="sm" value={density} onValueChange={(next) => next && setDensity(next as "sm" | "md" | "lg")}>
  <ToggleGroup.Item value="sm">Compact</ToggleGroup.Item>
  <ToggleGroup.Item value="md">Comfortable</ToggleGroup.Item>
  <ToggleGroup.Item value="lg">Spacious</ToggleGroup.Item>
</ToggleGroup>
<DataTable aria-label="Team" columns={columns} data={rows} size={density} />`,

  savedViews: `{/* A saved view is a plain object of the table's own controlled state. Saving one copies that state; choosing one hands it
    back. Where views live (state, storage, a server) is the app's. A view might be:
    { id, name, sort, hiddenColumns, columnWidths, pageSize, size }, and the filters the app holds beside the table. */}
{/* const [sort, setSort] = useState([]);  const [hiddenColumns, setHiddenColumns] = useState([]);
    const [columnWidths, setColumnWidths] = useState({});  const [pageSize, setPageSize] = useState(10); */}
<Select value={viewId} onValueChange={chooseView} aria-label="View" size="sm">
  <Select.Option value="default">Default</Select.Option>
  <Select.Option value="payroll">Payroll</Select.Option>
</Select>
<Button size="sm" variant="secondary" onClick={saveCurrentView}>Save current view</Button>
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  resizable
  sort={sort}
  onSortChange={setSort}
  hiddenColumns={hiddenColumns}
  onHiddenColumnsChange={setHiddenColumns}
  columnWidths={columnWidths}
  onColumnWidthsChange={setColumnWidths}
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
>
  <DataTable.Toolbar aria-label="Team table tools">
    <TableToolbar.Row>
      <Spacer />
      <DataTable.ColumnMenu />
    </TableToolbar.Row>
  </DataTable.Toolbar>
  <DataTable.Pagination />
</DataTable>`,

  resizable: `${columnsNote}
{/* resizable puts a handle at the end of every heading: drag it, or focus it and use the arrow keys (Shift for larger steps,
    Home and End for the limits, Enter to reset). A column's width, minWidth and maxWidth are where it begins and where a drag stops;
    columnWidths / onColumnWidthsChange keep the widths (in the URL or storage, say). selectionColumnWidth and actionsColumnWidth
    size the two columns the table adds. */}
{/* columns: [{ id: "name", header: "Name", accessor: (row) => row.name, width: "12rem", minWidth: "8rem", maxWidth: "24rem" }, …] */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  resizable
  selectionMode="multiple"
  selectionColumnWidth="4rem"
  onColumnWidthsChange={saveWidths}
/>`,

  pinnedColumns: `${columnsNote}
{/* DotsThreeIcon comes from @dbm-system/icons. A number pins that many data columns beside the checkbox column (and the actions column at the end), up to four at an
    edge in all: here the checkbox and the name stay put at the start, and the actions at the end, while the rest scrolls
    sideways. true pins one. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  selectionMode="multiple"
  stickyFirstColumn={2}
  stickyLastColumn
  rowActions={(row) => (
    <Menu>
      <Menu.Trigger asChild>
        <IconButton icon={DotsThreeIcon} variant="ghost" size="sm" aria-label={\`Actions for \${row.name}\`} />
      </Menu.Trigger>
      <Menu.Content align="end">
        <Menu.Item>Edit</Menu.Item>
      </Menu.Content>
    </Menu>
  )}
/>`,

  tones: `${columnsNote}
{/* tone: "brand" (default) | "neutral" | "info" | "success" | "warning" | "danger" — the header's solid fill, and the stripe and
    hover tints, as Table's. neutral leaves the header unfilled. */}
<DataTable aria-label="Team" columns={columns} data={rows} tone="success" striped selectionMode="multiple" defaultSelection={["e2"]} />`,

  rightToLeft: `${columnsNote}
{/* Alignment and pinning are logical, so a page with dir="rtl" mirrors the table. The page size select opens a Radix list that
    doesn't read the page's direction: give the pagination dir="rtl" too. */}
<div dir="rtl">
  <DataTable aria-label="Team" columns={columns} data={rows} selectionMode="multiple" defaultPageSize={5}>
    <DataTable.Pagination dir="rtl" />
  </DataTable>
</div>`,
};

export interface DataTablePlaygroundSnippetArgs {
  size?: string;
  variant?: string;
  tone?: string;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean | number;
  stickyLastColumn?: boolean | number;
  selectionMode?: string;
  sortMode?: string;
  multiSort?: boolean;
  resizable?: boolean;
  expandMode?: string;
  selectionColumnWidth?: string;
  actionsColumnWidth?: string;
  loading?: boolean;
  loadingRows?: number;
  virtualize?: string | boolean;
  maxHeight?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around the
 * small real example the Playground shows.
 */
export function dataTablePlaygroundSnippet(args: DataTablePlaygroundSnippetArgs): string {
  const props: string[] = [];
  const label = args["aria-label"] || "Team";
  props.push(`aria-label=${/["&\\]/.test(label) ? `{${JSON.stringify(label)}}` : `"${label}"`}`);
  props.push("columns={columns}", "data={rows}");
  if (args.variant && args.variant !== "bordered") props.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "brand") props.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") props.push(`size="${args.size}"`);
  if (args.striped) props.push("striped");
  if (args.hoverable === false) props.push("hoverable={false}");
  if (args.stickyHeader) props.push("stickyHeader");
  for (const [name, value] of [["stickyFirstColumn", args.stickyFirstColumn], ["stickyLastColumn", args.stickyLastColumn]] as const) {
    if (typeof value === "number" && value > 1) props.push(`${name}={${value}}`);
    else if (value) props.push(name);
  }
  if (args.maxHeight) props.push(`maxHeight="${args.maxHeight}"`);
  if (args.selectionMode && args.selectionMode !== "none") props.push(`selectionMode="${args.selectionMode}"`);
  if (args.sortMode === "manual") props.push('sortMode="manual"');
  if (args.resizable) props.push("resizable");
  if (args.expandMode === "single") props.push('expandMode="single"');
  if (args.selectionColumnWidth) props.push(`selectionColumnWidth="${args.selectionColumnWidth}"`);
  if (args.actionsColumnWidth) props.push(`actionsColumnWidth="${args.actionsColumnWidth}"`);
  if (args.multiSort === false) props.push("multiSort={false}");
  if (args.virtualize === true || args.virtualize === "true") props.push("virtualize");
  else if (args.virtualize === false || args.virtualize === "false") props.push("virtualize={false}");
  if (args.loading) props.push("loading");
  if (args.loading && typeof args.loadingRows === "number" && args.loadingRows !== 5) props.push(`loadingRows={${args.loadingRows}}`);
  return `${columnsNote}
<DataTable
${props.map((prop) => `  ${prop}`).join("\n")}
/>`;
}
