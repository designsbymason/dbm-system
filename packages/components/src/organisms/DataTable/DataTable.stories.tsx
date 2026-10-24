import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { Spacer } from "../../atoms/Spacer";
import { EmptyState } from "../../molecules/EmptyState";
import { ContextMenu } from "../ContextMenu";
import { TableToolbar } from "../../molecules/TableToolbar";
import { DataTable } from "./DataTable";
import { dataTablePlaygroundSnippet, dataTableSnippets } from "./DataTable.snippets";
import type { DataTableProps } from "./DataTable.types";
import { EmployeeDetail, employeeColumns, employees, makeEmployees, DensityDemo, RowMenu, SavedViewsDemo, ServerDemo, TeamDemo, type Employee } from "./DataTableStoryKit";

type Args = DataTableProps<Employee>;

const noControls = { control: false } as const;
const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "stretch" } as const;

const meta: Meta<Args> = {
  title: "Organisms/Data Display/DataTable",
  component: DataTable as unknown as ComponentType<Args>,
  parameters: { layout: "padded" },
  // Data and columns first, then the behaviour (sort, selection, pages, windowing), then the look, then the text and the
  // escape-hatch props last — the same sequencing as every other component's stories file.
  argTypes: {
    columns: { ...noControls, description: "The columns, in order: an id, a header, and how to read and draw a cell. Each can be sortable." },
    data: { ...noControls, description: "The rows. For a manual table, the rows to draw now (one page, in order)." },
    children: { ...noControls, description: "DataTable.Toolbar above the table and DataTable.Pagination below it." },
    getRowId: { ...noControls, description: "Gives a row the id its selection is kept by. The default reads the row's id, then its position in data." },
    getRowLabel: { ...noControls, description: "Names a row for a screen reader (\"Select Ada Lovelace\"). Without it a row is \"Row 3\"." },
    sort: { ...noControls, description: "The ordering, as a list of { columnId, direction }. Controlled with onSortChange." },
    defaultSort: { ...noControls, description: "The ordering the table starts with." },
    onSortChange: { ...noControls, description: "Called with the ordering a person asked for. A controlled table changes only when sort does." },
    sortMode: {
      control: "radio",
      options: ["client", "manual"],
      description: "client sorts and pages data in the browser; manual draws data as given and leaves sorting and paging to you.",
      table: { defaultValue: { summary: "client" } },
    },
    multiSort: {
      control: "boolean",
      description:
        "Lets a person sort by several columns: a press with Shift held adds the column to the sort (or turns it round, then takes it off), where a plain press makes it the only one.",
      table: { defaultValue: { summary: "true" } },
    },
    selectionMode: {
      control: "radio",
      options: ["none", "single", "multiple"],
      description: "How many rows can be chosen. multiple adds a checkbox column with a header checkbox; single replaces the choice.",
      table: { defaultValue: { summary: "none" } },
    },
    renderExpandedRow: { ...noControls, description: "Draws the detail of a row under it when it is opened, and adds a column of expand buttons. A table with this is never drawn a window at a time." },
    isRowExpandable: { ...noControls, description: "Says a row has no detail: its expand cell is left empty." },
    expanded: { ...noControls, description: "The ids of the rows that are open. Controlled with onExpandedChange." },
    defaultExpanded: { ...noControls, description: "The rows open to begin with.", table: { defaultValue: { summary: "[]" } } },
    onExpandedChange: { ...noControls, description: "Called with the ids a person asked to have open." },
    expandMode: {
      // Live only where rows can be expanded (the Expandable rows story turns it on), so no control is dead in the others.
      control: false,
      options: ["multiple", "single"],
      description: "multiple lets any number of rows be open; single closes the open row when another is opened.",
      table: { defaultValue: { summary: "multiple" } },
    },
    allSelected: { ...noControls, description: "Whether every row of the whole table is chosen, on every page, without their ids being listed: \"select all 137\" for a manual table with a totalCount. Controlled with onAllSelectedChange." },
    defaultAllSelected: { ...noControls, description: "Whether every row is chosen to begin with.", table: { defaultValue: { summary: "false" } } },
    onAllSelectedChange: { ...noControls, description: "Called when a person chooses every row of the whole table, or goes back to a list of ids." },
    selection: { ...noControls, description: "The ids of the chosen rows. Controlled with onSelectionChange." },
    defaultSelection: { ...noControls, description: "The rows chosen to begin with." },
    onSelectionChange: { ...noControls, description: "Called with the ids a person asked to have chosen." },
    isRowSelectable: { ...noControls, description: "Says a row can't be chosen: its checkbox is disabled and select all leaves it out." },
    page: { ...noControls, description: "The page, from 1. Controlled with onPageChange. Setting pageSize or adding DataTable.Pagination turns paging on." },
    defaultPage: { ...noControls, description: "The page to begin on.", table: { defaultValue: { summary: "1" } } },
    onPageChange: { ...noControls, description: "Called with the page a person asked for." },
    pageSize: { ...noControls, description: "Rows a page. Controlled with onPageSizeChange." },
    defaultPageSize: { ...noControls, description: "Rows a page to begin with.", table: { defaultValue: { summary: "10" } } },
    onPageSizeChange: { ...noControls, description: "Called with the page size a person asked for." },
    pageSizeOptions: { ...noControls, description: "The page sizes a person can choose from in DataTable.Pagination.", table: { defaultValue: { summary: "[10, 25, 50, 100]" } } },
    totalCount: { ...noControls, description: "How many rows there are in all, for a manual table that holds one page of them." },
    virtualize: {
      control: "radio",
      options: ["auto", true, false],
      description:
        "Draws only the rows in view. auto does so above 100 rows when the table isn't paged and has a maxHeight; true and false decide it.",
      table: { defaultValue: { summary: "auto" } },
    },
    loading: {
      control: "boolean",
      description: "Shows placeholder rows in place of the data while it loads.",
      table: { defaultValue: { summary: "false" } },
    },
    loadingRows: { control: "number", if: { arg: "loading", truthy: true }, description: "How many placeholder rows a loading table draws.", table: { defaultValue: { summary: "5" } } },
    emptyState: { ...noControls, description: "What an empty table says: text, or an EmptyState." },
    rowActions: { ...noControls, description: "Draws a trailing column for each row's actions, usually an IconButton that opens a Menu." },
    rowContextMenu: { ...noControls, description: "The items of the menu a right-click, a long press or the context-menu key opens on a row, as ContextMenu items. Told the row and the rows it acts on; a press on a row that isn't chosen chooses it alone first." },
    rowContextMenuKeys: { ...noControls, description: "Extra keys that open a row's context menu from the element that has focus in it, for platforms with no context-menu key." },
    onRowClick: { ...noControls, description: "Called when a row is pressed or Enter is pressed on it. Makes each row a tab stop; offer the action another way as well." },
    resizable: {
      control: "boolean",
      description:
        "Lets a person resize every column by dragging the end edge of its heading, or by keyboard on the handle (arrow keys, Shift for larger steps, Home and End for the limits, Enter to reset). A column's own resizable turns it off or on.",
      table: { defaultValue: { summary: "false" } },
    },
    columnWidths: { ...noControls, description: "The widths a person has given columns, in pixels, by column id. Controlled with onColumnWidthsChange." },
    defaultColumnWidths: { ...noControls, description: "The widths to begin with.", table: { defaultValue: { summary: "{}" } } },
    onColumnWidthsChange: { ...noControls, description: "Called with the widths a gesture asks for, on every step of a drag." },
    selectionColumnWidth: { control: "text", if: { arg: "selectionMode", neq: "none" }, description: "The width of the column of checkboxes (any CSS length)." },
    // Live only where there is a column of row actions (the Row actions and Pinned columns stories turn it on).
    actionsColumnWidth: { control: false, description: "The width of the column of row actions (any CSS length). It is as narrow as its button without one." },
    hiddenColumns: { ...noControls, description: "The ids of the columns that are not drawn. Controlled with onHiddenColumnsChange." },
    defaultHiddenColumns: { ...noControls, description: "The columns hidden to begin with." },
    onHiddenColumnsChange: { ...noControls, description: "Called with the ids a person asked to have hidden." },
    variant: {
      control: "radio",
      options: ["bordered", "ghost"],
      description: "The table's frame: bordered, or ghost for a table inside a Card.",
      table: { defaultValue: { summary: "bordered" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description: "The table's colour treatment, the same as Table's, except that the default is brand: a header in the brand's solid colour. neutral leaves the header unfilled.",
      table: { defaultValue: { summary: "brand" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Cell padding, type and the height of a row, on the standard scale.",
      table: { defaultValue: { summary: "md" } },
    },
    striped: { control: "boolean", description: "Alternates the background of every other row.", table: { defaultValue: { summary: "false" } } },
    hoverable: { control: "boolean", description: "Highlights the row under the pointer.", table: { defaultValue: { summary: "true" } } },
    stickyHeader: { control: "boolean", description: "Pins the header row to the top of the scroll area. Needs a maxHeight.", table: { defaultValue: { summary: "false" } } },
    stickyFirstColumn: { control: "boolean", options: [false, true, 2, 3, 4], description: "Pins the first column to the start edge; a number pins that many data columns. The checkbox column, when there is one, is pinned beside them. At most four columns are pinned at an edge in all. The Playground's switch is true (one column); pass a number in code.", table: { defaultValue: { summary: "false" } } },
    stickyLastColumn: { control: "boolean", options: [false, true, 2, 3, 4], description: "Pins the last column to the end edge; a number pins that many data columns. The actions column, when there is one, is pinned beside them. At most four columns are pinned at an edge in all. The Playground's switch is true (one column); pass a number in code.", table: { defaultValue: { summary: "false" } } },
    maxHeight: { control: "text", description: "Caps the height of the scroll area (any CSS max-height), so a long body scrolls inside it." },
    labels: { ...noControls, description: "Text written for the table, replacing the English defaults one by one." },
    formatNumber: { ...noControls, description: "Writes the numbers the table displays (a count in an announcement).", table: { defaultValue: { summary: "String" } } },
    caption: { ...noControls, description: "A visible title for the table, drawn as its caption. Names the table for assistive technology." },
    "aria-label": { control: "text", description: "Names the table when there is no visible caption. Give a caption, this, or aria-labelledby." },
    "aria-labelledby": { ...noControls, description: "The id of an element that names the table." },
    "aria-describedby": { ...noControls, description: "The id of an element that describes the table." },
    id: { ...noControls, description: "Standard DOM id, applied to the table element." },
    className: { ...noControls, description: "Additional CSS classes, for the box that holds the toolbar, table and pagination." },
    style: { ...noControls, description: "Inline styles for that same box." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the table element." },
  },
  args: {
    columns: employeeColumns,
    data: employees.slice(0, 8),
    "aria-label": "Team",
    sortMode: "client",
    multiSort: true,
    expandMode: "multiple",
    resizable: false,
    selectionMode: "none",
    virtualize: "auto",
    loading: false,
    loadingRows: 5,
    variant: "bordered",
    tone: "brand",
    size: "md",
    striped: false,
    hoverable: true,
    stickyHeader: false,
    stickyFirstColumn: false,
    stickyLastColumn: false,
    maxHeight: "",
    selectionColumnWidth: "",
    actionsColumnWidth: "",
  },
  render: ({ maxHeight, selectionColumnWidth, actionsColumnWidth, ...args }) => (
    <DataTable<Employee>
      {...args}
      maxHeight={maxHeight || undefined}
      selectionColumnWidth={selectionColumnWidth || undefined}
      actionsColumnWidth={actionsColumnWidth || undefined}
      getRowLabel={(row) => row.name}
    />
  ),
};

export default meta;

type Story = StoryObj<Args>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic" as const,
        transform: (_code: string, context: StoryContext) => dataTablePlaygroundSnippet(context.args as never),
      },
    },
  },
};

export const Sorting: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.sorting } } },
  argTypes: { data: noControls, columns: noControls },
  render: (args) => (
    <DataTable<Employee>
      {...args}
      maxHeight={args.maxHeight || undefined}
      columns={employeeColumns}
      data={employees.slice(0, 8)}
      defaultSort={[{ columnId: "salary", direction: "descending" }]}
    />
  ),
};

export const Selection: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.selection } } },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => (
    <DataTable<Employee>
      {...args}
      maxHeight={maxHeight || undefined}
      data={employees.slice(0, 8)}
      getRowLabel={(row) => row.name}
      isRowSelectable={(row) => row.status !== "On leave"}
    />
  ),
};

export const Pagination: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.pagination } } },
  render: ({ maxHeight, ...args }) => (
    <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={makeEmployees(87)} defaultPageSize={10} pageSizeOptions={[5, 10, 25]}>
      <DataTable.Pagination />
    </DataTable>
  ),
};

export const WithToolbar: Story = {
  name: "With a toolbar and paging",
  parameters: { docs: { source: { code: dataTableSnippets.withToolbar } } },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => <TeamDemo {...args} maxHeight={maxHeight || undefined} />,
};

export const RowActions: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.rowActions } } },
  argTypes: { actionsColumnWidth: { control: "text" } },
  render: ({ maxHeight, ...args }) => (
    <div style={{ minHeight: "22rem" }}>
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={employees.slice(0, 6)} rowActions={(row) => <RowMenu row={row} size={args.size} />} />
    </div>
  ),
};

export const RowContextMenu: Story = {
  name: "A row's context menu",
  parameters: { docs: { source: { code: dataTableSnippets.rowContextMenu } } },
  args: { selectionMode: "multiple" },
  argTypes: { selectionMode: { control: "inline-radio", options: ["none", "single", "multiple"] } },
  render: ({ maxHeight, ...args }) => (
    <div style={{ minHeight: "22rem" }}>
      <DataTable<Employee>
        {...args}
        maxHeight={maxHeight || undefined}
        data={employees.slice(0, 6)}
        aria-label="Team"
        rowContextMenuKeys={["Alt+ArrowDown"]}
        rowContextMenu={({ row, rows, count }) => (
          <>
            <ContextMenu.Item>{count > 1 ? `Edit ${count} people` : `Edit ${row.name}`}</ContextMenu.Item>
            <ContextMenu.Item>Copy {count > 1 ? `${count} emails` : "email"}</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item tone="danger" disabled={rows.some((person) => person.status === "On leave")}>
              {count > 1 ? `Remove ${count} people` : "Remove"}
            </ContextMenu.Item>
          </>
        )}
      />
    </div>
  ),
};

export const LongTable: Story = {
  name: "A long table, drawn a window at a time",
  parameters: { docs: { source: { code: dataTableSnippets.longTable } } },
  args: { stickyHeader: true, maxHeight: "24rem", striped: true },
  render: ({ maxHeight, ...args }) => (
    <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={makeEmployees(5000)} aria-label="Five thousand employees" />
  ),
};

export const ServerSide: Story = {
  name: "Sorting and paging on a server",
  parameters: { docs: { source: { code: dataTableSnippets.serverSide } } },
  // The demo owns the sort, the page, the count and the loading state, as a server-backed table does.
  argTypes: { sortMode: noControls, loading: noControls, loadingRows: noControls },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => <ServerDemo {...args} maxHeight={maxHeight || undefined} />,
};

export const ColumnVisibility: Story = {
  name: "Column menu",
  parameters: { docs: { source: { code: dataTableSnippets.columnVisibility } } },
  args: { defaultHiddenColumns: ["started"] },
  render: ({ maxHeight, ...args }) => (
    <div style={{ minHeight: "18rem" }}>
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={employees.slice(0, 6)}>
        <DataTable.Toolbar aria-label="Team table tools">
          <TableToolbar.Row>
            <Spacer />
            <DataTable.ColumnMenu />
          </TableToolbar.Row>
        </DataTable.Toolbar>
      </DataTable>
    </div>
  ),
};

export const LoadingAndEmpty: Story = {
  name: "Loading and empty",
  parameters: { docs: { source: { code: dataTableSnippets.loadingAndEmpty } } },
  argTypes: { loading: noControls, data: noControls, emptyState: noControls },
  render: ({ maxHeight, ...args }) => (
    <div style={column}>
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={[]} loading loadingRows={4} aria-label="Loading team" />
      <DataTable<Employee>
        {...args}
        maxHeight={maxHeight || undefined}
        data={[]}
        loading={false}
        aria-label="Empty team"
        emptyState={
          <EmptyState size="sm">
            <EmptyState.Title>No one on the team yet</EmptyState.Title>
            <EmptyState.Description>People you add will show here.</EmptyState.Description>
          </EmptyState>
        }
      />
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: dataTableSnippets.sizes } } },
  args: { selectionMode: "multiple" },
  argTypes: { size: noControls },
  render: ({ maxHeight, ...args }) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DataTable<Employee> key={size} {...args} maxHeight={maxHeight || undefined} data={employees.slice(0, 3)} size={size} aria-label={`Team, size ${size}`} />
      ))}
    </div>
  ),
};

export const ExpandableRows: Story = {
  name: "Expandable rows",
  parameters: { docs: { source: { code: dataTableSnippets.expandableRows } } },
  argTypes: { expandMode: { control: "radio" } },
  args: { selectionMode: "multiple", defaultExpanded: ["e2"] },
  render: ({ maxHeight, selectionColumnWidth, actionsColumnWidth, ...args }) => (
    <DataTable<Employee>
      {...args}
      maxHeight={maxHeight || undefined}
      selectionColumnWidth={selectionColumnWidth || undefined}
      actionsColumnWidth={actionsColumnWidth || undefined}
      data={employees.slice(0, 6)}
      getRowLabel={(row) => row.name}
      renderExpandedRow={(row) => <EmployeeDetail row={row} />}
      isRowExpandable={(row) => row.status === "Active"}
      striped
    />
  ),
};

export const ResizableColumns: Story = {
  name: "Resizable columns",
  parameters: { docs: { source: { code: dataTableSnippets.resizable } } },
  args: { resizable: true, selectionMode: "multiple", selectionColumnWidth: "4rem" },
  render: ({ maxHeight, selectionColumnWidth, actionsColumnWidth, ...args }) => (
    <DataTable<Employee>
      {...args}
      maxHeight={maxHeight || undefined}
      selectionColumnWidth={selectionColumnWidth || undefined}
      actionsColumnWidth={actionsColumnWidth || undefined}
      data={employees.slice(0, 6)}
      columns={employeeColumns.map((item) => (item.id === "name" ? { ...item, width: "12rem", minWidth: "8rem", maxWidth: "24rem" } : item))}
      getRowLabel={(row) => row.name}
    />
  ),
};

export const PinnedColumns: Story = {
  name: "Pinned first and last columns",
  parameters: { docs: { source: { code: dataTableSnippets.pinnedColumns } } },
  argTypes: { actionsColumnWidth: { control: "text" } },
  args: { selectionMode: "multiple", stickyFirstColumn: 2, stickyLastColumn: true },
  render: ({ maxHeight, ...args }) => (
    <div style={{ maxWidth: "32rem" }}>
      <DataTable<Employee>
        {...args}
        maxHeight={maxHeight || undefined}
        data={employees.slice(0, 5)}
        rowActions={(row) => <RowMenu row={row} size={args.size} />}
      />
    </div>
  ),
};

export const DensityToggle: Story = {
  name: "Density toggle (a recipe)",
  parameters: { docs: { source: { code: dataTableSnippets.density } } },
  argTypes: { size: noControls },
  render: ({ maxHeight, selectionColumnWidth, actionsColumnWidth, ...args }) => (
    <DensityDemo {...args} maxHeight={maxHeight || undefined} selectionColumnWidth={selectionColumnWidth || undefined} actionsColumnWidth={actionsColumnWidth || undefined} />
  ),
};

export const SavedViews: Story = {
  name: "Saved views (a recipe)",
  parameters: { docs: { source: { code: dataTableSnippets.savedViews } } },
  // The demo holds the sort, the widths, the hidden columns and the page size, and turns resizing on.
  argTypes: { sortMode: noControls, resizable: noControls },
  render: ({ maxHeight, selectionColumnWidth, actionsColumnWidth, ...args }) => (
    <div style={{ minHeight: "28rem" }}>
      <SavedViewsDemo {...args} maxHeight={maxHeight || undefined} selectionColumnWidth={selectionColumnWidth || undefined} actionsColumnWidth={actionsColumnWidth || undefined} />
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: dataTableSnippets.tones } } },
  args: { striped: true, selectionMode: "multiple", defaultSelection: ["e2"] },
  argTypes: { tone: noControls },
  render: ({ maxHeight, ...args }) => (
    <div style={column}>
      {(["brand", "neutral", "info", "success", "warning", "danger"] as const).map((tone) => (
        <DataTable<Employee>
          key={tone}
          {...args}
          maxHeight={maxHeight || undefined}
          data={employees.slice(0, 3)}
          tone={tone}
          aria-label={`Team, tone ${tone}`}
        />
      ))}
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: dataTableSnippets.rightToLeft } } },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => (
    <div dir="rtl">
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={employees} defaultPageSize={5}>
        <DataTable.Pagination dir="rtl" />
      </DataTable>
    </div>
  ),
};
