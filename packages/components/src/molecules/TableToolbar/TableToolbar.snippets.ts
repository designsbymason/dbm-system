// The code shown under each story's "Show code" button on TableToolbar's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default, fills every handler
// with a no-op, prints an icon as `{ $$typeof: Symbol(react.forward_ref) … }` and freezes state. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const tableToolbarSnippets = {
  filtersSheet: `{/* TableToolbar.Filters draws its filters inline while the bar is wide and, below collapseBelow (the bar's own width, "sm" 40rem to "xl" 80rem),
    one "Filters" button that opens them all in a bottom sheet: each filter as a section headed by its label, holding the controls you gave it, with Clear all and Done.
    The filters must be direct children; the state is yours. The bar is a size container while it holds this part, so give it a width of its own. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <TableToolbar.Search>
      <SearchInput aria-label="Search orders" />
    </TableToolbar.Search>
    <TableToolbar.Filters collapseBelow="md" onClearAll={clearAll}>
      <TableToolbar.Filter label="Status" count={statuses.length} onClear={() => setStatuses([])}>
        <CheckboxGroup aria-label="Status" value={statuses} onValueChange={setStatuses}>
          <Checkbox value="open">Open</Checkbox>
          <Checkbox value="shipped">Shipped</Checkbox>
        </CheckboxGroup>
      </TableToolbar.Filter>
      <TableToolbar.Filter label="Owner" count={owners.length} onClear={() => setOwners([])}>
        <CheckboxGroup aria-label="Owner" value={owners} onValueChange={setOwners}>
          <Checkbox value="jane">Jane</Checkbox>
          <Checkbox value="marcus">Marcus</Checkbox>
        </CheckboxGroup>
      </TableToolbar.Filter>
    </TableToolbar.Filters>
  </TableToolbar.Row>
</TableToolbar>`,

  filterValue: `{/* With a value the button shows the choice and is named "Status: All"; labelPlacement="before" draws the name as plain text before it
    (className and style then go on the box that holds both). */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <Toolbar aria-label="Filters" variant="secondary">
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" value="2 selected" labelPlacement="before" count={2}>
          <CheckboxGroup aria-label="Status" defaultValue={["open", "shipped"]}>
            <Checkbox value="open">Open</Checkbox>
            <Checkbox value="shipped">Shipped</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
  </TableToolbar.Row>
</TableToolbar>`,

  searchAndActions: `{/* Icons come from @dbm-system/icons: FunnelSimpleIcon, DownloadSimpleIcon.
    The search field is an ordinary tab stop; the filters and the actions are each a Toolbar (one tab stop, arrow keys). */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <TableToolbar.Search>
      <SearchInput aria-label="Search orders" />
    </TableToolbar.Search>
    <Toolbar aria-label="Filters" variant="secondary">
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" icon={FunnelSimpleIcon}>
          <CheckboxGroup aria-label="Status">
            <Checkbox value="open">Open</Checkbox>
            <Checkbox value="shipped">Shipped</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
    <Spacer />
    <Toolbar aria-label="Actions" variant="secondary">
      <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Row>
</TableToolbar>`,

  filters: `{/* count: how many values of the filter are applied (shown on the button, said in its name, and Clear appears in the
    panel when onClear is given). What is in the panel, and its state, is yours. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <Toolbar aria-label="Filters" variant="secondary">
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" count={2} onClear={clearStatuses}>
          <CheckboxGroup aria-label="Status" defaultValue={["open", "shipped"]}>
            <Checkbox value="open">Open</Checkbox>
            <Checkbox value="shipped">Shipped</Checkbox>
            <Checkbox value="delayed">Delayed</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
      <Toolbar.Item>
        <TableToolbar.Filter label="Owner">
          <RadioGroup aria-label="Owner" defaultValue="jane">
            <Radio value="jane">Jane</Radio>
            <Radio value="marcus">Marcus</Radio>
            <Radio value="priya">Priya</Radio>
          </RadioGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
      <Toolbar.Item>
        {/* a count above max (99) reads "99+" on the badge; the button's name still says 1,284 */}
        <TableToolbar.Filter label="Tags" count={1284}>
          <CheckboxGroup aria-label="Tags">
            <Checkbox value="rush">Rush</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
  </TableToolbar.Row>
</TableToolbar>`,

  activeFilters: `{/* const [applied, setApplied] = useState([
      { id: "status:open", group: "Status", label: "Open" },
      { id: "owner:jane", group: "Owner", label: "Jane" },
    ]);
    onRemove gets the chip's id; Clear all shows once there is more than one. Removing from the keyboard moves focus to the
    next chip. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <TableToolbar.ActiveFilters
      items={applied}
      onRemove={(id) => setApplied(applied.filter((item) => item.id !== id))}
      onClearAll={() => setApplied([])}
    />
  </TableToolbar.Row>
</TableToolbar>`,

  resultCount: `{/* count undefined means "not known yet": nothing is shown, and the count that arrives is not announced. With a total
    larger than count it reads "12 of 128 results". loading shows a placeholder in the count's place and announces nothing. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <TableToolbar.Summary count={128} />
  </TableToolbar.Row>
  <TableToolbar.Row>
    <TableToolbar.Summary count={12} total={128} />
  </TableToolbar.Row>
  <TableToolbar.Row>
    <TableToolbar.Summary count={0} total={128} />
  </TableToolbar.Row>
  <TableToolbar.Row>
    <TableToolbar.Summary loading />
  </TableToolbar.Row>
</TableToolbar>`,

  bulkSelection: `{/* const [count, setCount] = useState(3);
    The row shows while count > 0; Select all N shows while fewer than totalCount are selected. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Selection count={count} totalCount={12} onClear={() => setCount(0)} onSelectAll={() => setCount(12)}>
    <Toolbar aria-label="Bulk actions" variant="secondary">
      <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export selected</Toolbar.Button>
      <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Selection>
</TableToolbar>`,

  withATable: `{/* The bar owns no data: rows, query, filters and selection are the app's (or a DataTable's), passed in and
    called back. A Checkbox per row selects; the header Checkbox is "indeterminate" while some are. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <TableToolbar.Search>
      <SearchInput aria-label="Search orders" onSearch={setQuery} />
    </TableToolbar.Search>
    <Toolbar aria-label="Filters" variant="secondary">
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" icon={FunnelSimpleIcon} count={statuses.length} onClear={() => setStatuses([])}>
          <CheckboxGroup aria-label="Status" value={statuses} onValueChange={setStatuses}>
            <Checkbox value="Open">Open</Checkbox>
            <Checkbox value="Shipped">Shipped</Checkbox>
            <Checkbox value="Delayed">Delayed</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
    <Spacer />
    <Toolbar aria-label="Actions" variant="secondary">
      <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Row>
  <TableToolbar.Row>
    <TableToolbar.ActiveFilters items={applied} onRemove={removeFilter} onClearAll={clearFilters} />
    <TableToolbar.Summary count={rows.length} total={orders.length} />
  </TableToolbar.Row>
  <TableToolbar.Selection count={selected.length} totalCount={rows.length} onClear={clearSelection} onSelectAll={selectAll}>
    <Toolbar aria-label="Bulk actions" variant="secondary">
      <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Selection>
</TableToolbar>
<Table aria-label="Orders" hoverable>
  {/* a header row with a "Select all orders" Checkbox, and a body row per order with its own Checkbox */}
</Table>`,

  split: `{/* The parts don't have to share one box. The search, filters and chips go above the table; the result count goes in a
    second, named bar below it (next to a Pagination, say). A part outside a TableToolbar uses size "md", so give it the same
    size as the top bar, or wrap it in its own TableToolbar as here. */}
<TableToolbar aria-label="Orders table tools">
  <TableToolbar.Row>
    <TableToolbar.Search>
      <SearchInput aria-label="Search orders" onSearch={setQuery} />
    </TableToolbar.Search>
    <Toolbar aria-label="Filters" variant="secondary">
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" count={statuses.length} onClear={() => setStatuses([])}>
          <CheckboxGroup aria-label="Status" value={statuses} onValueChange={setStatuses}>
            <Checkbox value="Open">Open</Checkbox>
            <Checkbox value="Shipped">Shipped</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
  </TableToolbar.Row>
  <TableToolbar.Row>
    <TableToolbar.ActiveFilters items={applied} onRemove={removeFilter} onClearAll={clearFilters} />
  </TableToolbar.Row>
</TableToolbar>
<Table aria-label="Orders" hoverable>
  {/* the rows */}
</Table>
<TableToolbar aria-label="Orders table footer">
  <TableToolbar.Row>
    <TableToolbar.Summary count={rows.length} total={orders.length} />
  </TableToolbar.Row>
</TableToolbar>`,

  selectionElsewhere: `{/* Selection is a part of its own: put it after the table and pin it to the bottom of the box that scrolls. It is hidden
    while nothing is selected, and its announcements come from a live region beside it, wherever it sits. Put it after the table
    in the markup too, so the Tab order matches where it appears. */}
<div style={{ alignContent: "start", blockSize: "22rem", display: "grid", gap: "var(--dbm-space-4)", gridAutoRows: "max-content", overflow: "auto" }}>
  <TableToolbar aria-label="Orders table tools">
    <TableToolbar.Row>
      <TableToolbar.Search>
        <SearchInput aria-label="Search orders" onSearch={setQuery} />
      </TableToolbar.Search>
    </TableToolbar.Row>
  </TableToolbar>
  <Table aria-label="Orders" hoverable>
    {/* the rows, with a Checkbox each */}
  </Table>
  <TableToolbar.Selection
    style={{ bottom: 0, position: "sticky" }}
    count={selected.length}
    totalCount={rows.length}
    onClear={clearSelection}
    onSelectAll={selectAll}
  >
    <Toolbar aria-label="Bulk actions" variant="secondary">
      <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Selection>
</div>`,

  sizes: `{/* size on the bar is the default for ActiveFilters, Summary, Selection and a Filter outside a toolbar. Say the same size on the
    SearchInput and the Toolbars, which are your own components. Shown: sm. */}
<TableToolbar size="sm" aria-label="Size sm">
  <TableToolbar.Row>
    <TableToolbar.Search>
      <SearchInput aria-label="Search (sm)" size="sm" />
    </TableToolbar.Search>
    <Toolbar aria-label="Filters (sm)" variant="secondary" size="sm">
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" count={2}>
          <CheckboxGroup aria-label="Status">
            <Checkbox value="open">Open</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
    <Spacer />
    <TableToolbar.Summary count={12} total={128} />
  </TableToolbar.Row>
</TableToolbar>`,

  rtl: `{/* The layout mirrors with the page's direction; pass dir="rtl" to each Toolbar so its arrow keys follow it too */}
<div dir="rtl">
  <TableToolbar aria-label="Orders table tools">
    <TableToolbar.Row>
      <TableToolbar.Search>
        <SearchInput aria-label="Search orders" />
      </TableToolbar.Search>
      <Toolbar aria-label="Filters" variant="secondary" dir="rtl">
        <Toolbar.Item>
          <TableToolbar.Filter label="Status" count={2}>
            <CheckboxGroup aria-label="Status">
              <Checkbox value="open">Open</Checkbox>
            </CheckboxGroup>
          </TableToolbar.Filter>
        </Toolbar.Item>
      </Toolbar>
    </TableToolbar.Row>
    <TableToolbar.Row>
      <TableToolbar.ActiveFilters items={[{ id: "status:open", group: "Status", label: "Open" }]} onRemove={removeFilter} />
      <TableToolbar.Summary count={12} total={128} />
    </TableToolbar.Row>
  </TableToolbar>
</div>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TableToolbarPlaygroundSnippetArgs {
  size?: string;
  "aria-label"?: string;
}

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The Playground's snippet, built from its current controls: the whole bar the Playground shows, with `size` written on the
 * bar and on the search field and toolbars that don't read it, only when it isn't the default.
 */
export function tableToolbarPlaygroundSnippet(args: TableToolbarPlaygroundSnippetArgs): string {
  const size = args.size && args.size !== "md" && (sizes as readonly string[]).includes(args.size) ? ` size="${args.size}"` : "";
  const label = args["aria-label"] || "Orders table tools";
  return `{/* Icons come from @dbm-system/icons: FunnelSimpleIcon, DownloadSimpleIcon, TrashIcon. The rows, query, filters and
    selection are the app's own state. */}
<TableToolbar${size} aria-label="${label}">
  <TableToolbar.Row>
    <TableToolbar.Search>
      <SearchInput aria-label="Search orders"${size} onSearch={setQuery} />
    </TableToolbar.Search>
    <Toolbar aria-label="Filters" variant="secondary"${size}>
      <Toolbar.Item>
        <TableToolbar.Filter label="Status" icon={FunnelSimpleIcon} count={statuses.length} onClear={() => setStatuses([])}>
          <CheckboxGroup aria-label="Status" value={statuses} onValueChange={setStatuses}>
            <Checkbox value="Open">Open</Checkbox>
            <Checkbox value="Shipped">Shipped</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </Toolbar.Item>
    </Toolbar>
    <Spacer />
    <Toolbar aria-label="Actions" variant="secondary"${size}>
      <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Row>
  <TableToolbar.Row>
    <TableToolbar.ActiveFilters items={applied} onRemove={removeFilter} onClearAll={clearFilters} />
    <TableToolbar.Summary count={rows.length} total={orders.length} />
  </TableToolbar.Row>
  <TableToolbar.Selection count={selected.length} totalCount={rows.length} onClear={clearSelection} onSelectAll={selectAll}>
    <Toolbar aria-label="Bulk actions" variant="secondary"${size}>
      <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
    </Toolbar>
  </TableToolbar.Selection>
</TableToolbar>`;
}
