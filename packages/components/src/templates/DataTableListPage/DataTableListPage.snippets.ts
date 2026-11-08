// The code shown under each story's "Show code" button on the Data Table List Page's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's demo helpers
// (`DataTableListPage`, `usePeopleList`) and freeze the page's state. Each snippet is the smallest real usage of what its story shows, using only
// exports of the package; `storySnippets.test.ts` checks that stays true. State can't live in a snippet, so a comment names what the
// page holds. See `07-storybook-and-documentation-standards.md` §4.2.

const state = `{/* Your own state, held by the page (a hook, a router's search params or a query library):
    query, statuses, departments  the filters
    sort, page, pageSize          what the server is asked for
    selection, allSelected        the rows chosen (ids), or every row matching the filters
    statusChoice                  what the filter's button says: "All", the one choice, or "2 selected"
    rows, matching, loading       what the request answered with
    A change to a filter goes back to page 1 and clears the selection. */}`;

const heading = (words: { title: string; add: string }) => `    <PageHeader>
      <PageHeader.Title tabIndex={-1}>${words.title}</PageHeader.Title>
      <PageHeader.Actions>
        <Button leadingIcon={PlusIcon}>${words.add}</Button>
      </PageHeader.Actions>
    </PageHeader>`;

const english = { title: "People", add: "Add person" };

const table = (extra = "") => `    <DataTable
      aria-label="People"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      sortMode="manual"
      sort={sort}
      onSortChange={(next) => { setSort(next); setPage(1); }}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      totalCount={matching}
      loading={loading}
      loadingRows={pageSize}
      selectionMode="multiple"
      selection={selection}
      onSelectionChange={setSelection}
      allSelected={allSelected}
      onAllSelectedChange={setAllSelected}${extra}
      rowActions={(row) => (
        <Menu>
          <Menu.Trigger asChild>
            <IconButton icon={DotsThreeIcon} variant="tertiary" size="sm" aria-label={\`Actions for \${row.name}\`} />
          </Menu.Trigger>
          <Menu.Content align="end">
            <Menu.Item icon={PencilSimpleIcon}>Edit</Menu.Item>
            <Menu.Separator />
            <Menu.Item icon={TrashIcon} tone="danger" onSelect={() => askToRemove([row.id])}>Remove</Menu.Item>
          </Menu.Content>
        </Menu>
      )}
    >
      <DataTable.Toolbar aria-label="People table tools">
        <TableToolbar.Row>
          <TableToolbar.Summary count={matching} loading={loading} />
          <TableToolbar.Search>
            <SearchInput aria-label="Search people" placeholder="Search" onSearch={setQuery} />
          </TableToolbar.Search>
          {/* On a phone the filters are one button that opens a bottom sheet holding both (hide the Toolbar below, and show this,
              under your own breakpoint); the button says how many filters are in force */}
          <Drawer>
            <Drawer.Trigger asChild>
              <Button variant="secondary">Filters</Button>
            </Drawer.Trigger>
            <Drawer.Content side="bottom" size="lg">
              <Drawer.Header>
                <Drawer.Title>Filters</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>{/* a heading and the choices (a Checkbox for "All", a CheckboxGroup) for each filter */}</Drawer.Body>
              <Drawer.Footer>
                <Button variant="secondary" onClick={clearFilters}>Clear all</Button>
                <Drawer.Close asChild>
                  <Button>Done</Button>
                </Drawer.Close>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
          <Toolbar aria-label="Filters" variant="secondary">
            <Toolbar.Item>
              {/* The filter's name is plain text before a button of a fixed width that shows only the choice ("All",
                  "Active", "2 selected"); the panel is a CheckboxGroup headed by an "All" checkbox. No icon on the button.
                  Toolbar.Item takes one child, so the name and the button share a wrapper. */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span id="status-label">Status:</span>
                <TableToolbar.Filter
                  id="status-button"
                  aria-labelledby="status-label status-button"
                  label={statusChoice}
                  style={{ inlineSize: "9rem" }}
                  onClear={() => setStatuses([])}
                >
                  {/* a Checkbox for "All" and a CheckboxGroup of the statuses */}
                </TableToolbar.Filter>
              </div>
            </Toolbar.Item>
          </Toolbar>
        </TableToolbar.Row>
        <TableToolbar.Row>
          <TableToolbar.ActiveFilters items={applied} onRemove={removeFilter} onClearAll={clearFilters} />
        </TableToolbar.Row>
        <DataTable.Selection>
          <Toolbar aria-label="Bulk actions" variant="secondary">
            <Toolbar.Button leadingIcon={TrashIcon} onClick={() => askToRemove(allSelected ? "all" : selection)}>Remove</Toolbar.Button>
          </Toolbar>
        </DataTable.Selection>
      </DataTable.Toolbar>
    </DataTable>
    {/* The footer, from the page's own state, in three columns: the rows-per-page button (a small fixed width) at the start, the
        page controls in the middle, the range right-aligned at the end */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
      <div style={{ inlineSize: "5rem" }}>
        <Select size="sm" value={String(pageSize)} onValueChange={(next) => setPageSize(Number(next))} aria-label="Rows per page">
          <Select.Option value="10">10</Select.Option>
          <Select.Option value="25">25</Select.Option>
          <Select.Option value="50">50</Select.Option>
        </Select>
      </div>
      <Pagination size="sm" pageCount={Math.ceil(matching / pageSize)} value={page} onValueChange={setPage} />
      <span style={{ justifySelf: "end" }}>{\`\${first}–\${last} of \${matching}\`}</span>
    </div>`;

const confirm = `    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => { if (!open) setPending(null); }}
      tone="danger"
      title="Remove 3 people?"
      description="They lose access to this workspace straight away. This can't be undone."
      labels={{ confirm: "Remove" }}
      onConfirm={async () => { await remove(pending); }}
    />`;

const page = (body: string, shellAttributes = "") => `{/* PlusIcon, TrashIcon, PencilSimpleIcon and DotsThreeIcon come from @dbm-system/icons */}
${state}
<Toast.Provider>
  <AppShell${shellAttributes ? ` ${shellAttributes}` : ""}>
    {/* AppShell.Header with your Navbar, AppShell.Sidebar with your Sidebar: see the AppShell page */}
    <AppShell.Main>
      <AppShell.Content size="xl">
${body}
      </AppShell.Content>
    </AppShell.Main>
  </AppShell>
</Toast.Provider>`;

const everything = `${heading(english)}
${table()}
${confirm}`;

export const dataTableListPageSnippets = {
  default: page(everything),

  filtered: `{/* Start with filters in force: they show as chips under the toolbar, the count says how many match ("6 results"), and "Clear all" or a
    chip's remove button takes them off and goes back to page 1 */}
${page(everything)}`,

  selection: `{/* With rows chosen the toolbar shows how many, a "select all 137" offer for the whole filtered list (allSelected,
    no ids listed) and the bulk actions. Removing asks first, and focus goes to the heading afterwards. */}
${page(everything)}`,

  loading: `{/* loading draws loadingRows placeholder rows of the table's own height, so the page does not jump when the rows arrive */}
${page(`${heading(english)}\n${table()}`)}`,

  empty: `{/* Nothing at all, and no filter in force: say what the page is for and offer the first step.
    There is no count or footer to draw. */}
${page(
  `${heading(english)}
    <DataTable aria-label="People" columns={columns} data={[]} emptyState={
      <EmptyState size="sm">
        <EmptyState.Icon icon={UsersIcon} />
        <EmptyState.Title level={2}>No one here yet</EmptyState.Title>
        <EmptyState.Description>Invite your team to give them access.</EmptyState.Description>
        <EmptyState.Actions>
          <Button leadingIcon={PlusIcon}>Add person</Button>
        </EmptyState.Actions>
      </EmptyState>
    } />`,
)}`,

  noResults: `{/* Filters in force and nothing matches: say so and offer the way out. It is a different state from "nothing at all". */}
${page(
  `${heading(english)}
    <DataTable aria-label="People" columns={columns} data={[]} emptyState={
      <EmptyState size="sm">
        <EmptyState.Icon icon={MagnifyingGlassIcon} />
        <EmptyState.Title level={2}>No one matches</EmptyState.Title>
        <EmptyState.Description>Try a different search, or clear the filters.</EmptyState.Description>
        <EmptyState.Actions>
          <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
        </EmptyState.Actions>
      </EmptyState>
    } />`,
)}`,

  error: `{/* A failed request replaces the table, keeps the heading and says what to do next. announce reads it out once. */}
${page(
  `${heading(english)}
    <EmptyState announce tone="danger" variant="outlined">
      <EmptyState.Icon icon={WarningCircleIcon} />
      <EmptyState.Title level={2}>We couldn't load the list</EmptyState.Title>
      <EmptyState.Description>Something went wrong on our side. Nothing was changed. Try again in a moment.</EmptyState.Description>
      <EmptyState.Actions>
        <Button onClick={retry}>Try again</Button>
      </EmptyState.Actions>
    </EmptyState>`,
)}`,
};
