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
          {/* TableToolbar.Filters draws its filters inline while the table is wide and, below its collapseBelow (the bar's own width, 48rem by default),
              one "Filters" button that opens them in a bottom sheet with "Clear all" and "Done"; the button says how many filters are in force. Each filter
              shows its choice ("All", "Active", "2 selected") with its name drawn before the button; the panel is a CheckboxGroup headed by an "All" checkbox. */}
          <TableToolbar.Filters onClearAll={clearFilters}>
            <TableToolbar.Filter label="Status" value={statusChoice} labelPlacement="before" count={statuses.length} onClear={() => setStatuses([])}>
              {/* a Checkbox for "All" and a CheckboxGroup of the statuses */}
            </TableToolbar.Filter>
          </TableToolbar.Filters>
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
      {/* The footer is the table's own: the page size at the start, the page controls centred and the range at the end, stacking below the table's 48rem
          (layout="centered", with the table's pageSizeOptions); the table announces a change of page size itself. Left out while there is nothing to page. */}
      <DataTable.Pagination layout="centered" size="sm" />
    </DataTable>
`;

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
