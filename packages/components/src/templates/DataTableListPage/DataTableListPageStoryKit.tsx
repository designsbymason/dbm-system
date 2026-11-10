// The data-table list page every story, check and test of this template draws: a people directory in an `AppShell`. It is a story-only
// example (ADR-0179): nothing here is exported from the package, an app copies the page and replaces the data, the columns and the
// words. The "Show code" snippets are written by hand in `DataTableListPage.snippets.ts`.
//
// Where the state lives is the point of the page: the search, the filters, the sort, the page and the selection are the page's own
// (`usePeopleList`), the rows come from a request that is simulated here, and `DataTable` is driven entirely through its controlled
// props (`sortMode="manual"`, `sort`, `page`, `selection`, `allSelected`, `totalCount`, `loading`).
import { DotsThreeIcon, CopySimpleIcon, DownloadSimpleIcon, MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, TrashIcon, UsersIcon, WarningCircleIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Checkbox } from "../../atoms/Checkbox";
import { IconButton } from "../../atoms/IconButton";
import { Breadcrumb } from "../../molecules/Breadcrumb";
import { CheckboxGroup } from "../../molecules/CheckboxGroup";
import { EmptyState } from "../../molecules/EmptyState";
import { PageHeader } from "../../molecules/PageHeader";
import { SearchInput } from "../../molecules/SearchInput";
import { TableToolbar } from "../../molecules/TableToolbar";
import { Toolbar } from "../../molecules/Toolbar";
import { ConfirmDialog } from "../../organisms/ConfirmDialog";
import { DataTable } from "../../organisms/DataTable";
import type { DataTableColumn, DataTableSort } from "../../organisms/DataTable";
import { Menu } from "../../organisms/Menu";
import { preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { Toast, useToast } from "../../organisms/Toast";
import { AppShell } from "../AppShell";
import { DemoShell } from "../AppShell/AppShellStoryKit";
import styles from "./DataTableListPage.module.css";

export type PersonStatus = "active" | "invited" | "suspended";
export type Department = "design" | "engineering" | "sales" | "support";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  department: Department;
  status: PersonStatus;
  /** An ISO date (`2026-10-28`), which also sorts as text. */
  lastActive: string;
}

const statuses: PersonStatus[] = ["active", "invited", "suspended"];
const departments: Department[] = ["design", "engineering", "sales", "support"];

const firstNames = ["Ada", "Bo", "Cy", "Di", "Eli", "Fay", "Gus", "Hana", "Ivo", "Jo", "Kai", "Lee"];
const lastNames = ["Lovelace", "Okafor", "Nguyen", "Silva", "Kowalski", "Haddad", "Ito", "Moreau"];
const roles = ["Designer", "Engineer", "Account lead", "Support analyst", "Researcher", "Manager"];

/** `count` people, the same every time, so a story, its checks and its tests agree. */
export function makePeople(count: number): Person[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `${firstNames[index % firstNames.length] as string} ${lastNames[(index * 3) % lastNames.length] as string}`,
    email: `person${index + 1}@example.com`,
    role: roles[(index * 5) % roles.length] as string,
    department: departments[(index * 7) % departments.length] as Department,
    status: index % 11 === 4 ? "suspended" : index % 5 === 2 ? "invited" : "active",
    lastActive: `2026-${String(1 + (index % 10)).padStart(2, "0")}-${String(1 + ((index * 7) % 28)).padStart(2, "0")}`,
  }));
}

/** Every word the page draws. */
export const dataTableListPageCopy = {
  people: "People",
  home: "Home",
  title: "People",
  intro: "Everyone with access to this workspace.",
  add: "Add person",
  tableName: "People",
  search: "Search people",
  searchPlaceholder: "Search",
  filterPanel: (name: string) => `${name} filter`,
  toolsName: "People table tools",
  filtersName: "Filters",
  bulkName: "Bulk actions",
  statusFilter: "Status",
  departmentFilter: "Department",
  allChoices: "All",
  filtersButton: "Filters",
  filtersButtonCount: (count: number) => `Filters (${count})`,
  filtersSheetTitle: "Filters",
  filtersSheetText: "Narrow the list of people.",
  clearAll: "Clear all",
  done: "Done",
  rowsPerPage: "Rows per page",
  range: (first: number, last: number, total: number) => `${first}–${last} of ${total}`,
  selectedCount: (count: number) => `${count} selected`,
  statusLabels: { active: "Active", invited: "Invited", suspended: "Suspended" } as Record<PersonStatus, string>,
  departmentLabels: { design: "Design", engineering: "Engineering", sales: "Sales", support: "Support" } as Record<Department, string>,
  columns: { name: "Name", role: "Role", department: "Department", status: "Status", lastActive: "Last active" },
  rowMenu: (name: string) => `Actions for ${name}`,
  edit: "Edit",
  copyEmail: "Copy email",
  remove: "Remove",
  export: "Export",
  emptyTitle: "No one here yet",
  emptyText: "Invite your team to give them access. They appear here as soon as they accept.",
  noResultsTitle: "No one matches",
  noResultsText: "Try a different search, or clear the filters.",
  clearFilters: "Clear filters",
  errorTitle: "We couldn't load the list",
  errorText: "Something went wrong on our side. Nothing was changed. Try again in a moment.",
  retry: "Try again",
  confirmOne: (name: string) => `Remove ${name}?`,
  confirmMany: (count: number) => `Remove ${count} ${count === 1 ? "person" : "people"}?`,
  confirmText: "They lose access to this workspace straight away. This can't be undone.",
  confirmAction: "Remove",
  cancel: "Cancel",
  removedOne: (name: string) => `${name} was removed`,
  removedMany: (count: number) => (count === 1 ? "1 person was removed" : `${count} people were removed`),
  exported: (count: number) => `Exported ${count} ${count === 1 ? "person" : "people"}`,
  copied: "Email copied",
  edited: (name: string) => `Editing ${name}`,
  added: "Invitation sent",
} as const;

const copy = dataTableListPageCopy;

const pageSizes = [10, 25, 50];

/** A wait, so the request takes the time a request takes. */
const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export interface PeopleListOptions {
  /** How many people the "server" holds. */
  total?: number;
  /** How long a request takes, in milliseconds. */
  latency?: number;
  /** Makes the request fail. Pressing "Try again" with this turned off succeeds. */
  fail?: boolean;
  initialQuery?: string;
  initialStatuses?: PersonStatus[];
  initialDepartments?: Department[];
  initialSelection?: string[];
  initialPageSize?: number;
}

type Loaded = { request: string; rows: Person[]; matching: number; error: boolean };

/**
 * What an app holds for a list page: the filters, the sort, the page and the selection, and the rows a request answers with. Any
 * change to a filter goes back to page 1 and drops the selection, since "the rows I chose" and "every row" meant the old filter.
 */
export function usePeopleList({
  total = 137,
  latency = 400,
  fail = false,
  initialQuery = "",
  initialStatuses = [],
  initialDepartments = [],
  initialSelection = [],
  initialPageSize = 10,
}: PeopleListOptions = {}) {
  // What is typed, and what the request uses: the request follows the text once it has stopped changing, so a key press is not a request.
  const [query, setQueryState] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [selectedStatuses, setStatusesState] = useState<PersonStatus[]>(initialStatuses);
  const [selectedDepartments, setDepartmentsState] = useState<Department[]>(initialDepartments);
  const [sort, setSortState] = useState<DataTableSort>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [selection, setSelection] = useState<string[]>(initialSelection);
  const [allSelected, setAllSelected] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);

  const everyone = useMemo(() => makePeople(total), [total]);
  useEffect(() => {
    if (query === appliedQuery) return;
    const timer = window.setTimeout(() => setAppliedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, appliedQuery]);
  const request = JSON.stringify([appliedQuery, selectedStatuses, selectedDepartments, sort, page, pageSize, removed.length, attempt]);
  const [loaded, setLoaded] = useState<Loaded>({ request: "", rows: [], matching: 0, error: false });

  const matching = useCallback(
    () =>
      everyone.filter(
        (person) =>
          !removed.includes(person.id) &&
          (!appliedQuery || `${person.name} ${person.email} ${person.role}`.toLowerCase().includes(appliedQuery.toLowerCase())) &&
          (selectedStatuses.length === 0 || selectedStatuses.includes(person.status)) &&
          (selectedDepartments.length === 0 || selectedDepartments.includes(person.department)),
      ),
    [everyone, removed, appliedQuery, selectedStatuses, selectedDepartments],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (fail) {
        setLoaded({ request, rows: [], matching: 0, error: true });
        return;
      }
      const all = matching();
      const key = sort[0]?.columnId as keyof Person | undefined;
      if (key) {
        const sign = sort[0]?.direction === "descending" ? -1 : 1;
        all.sort((a, b) => sign * String(a[key]).localeCompare(String(b[key]), "en"));
      }
      setLoaded({ request, rows: all.slice((page - 1) * pageSize, page * pageSize), matching: all.length, error: false });
    }, latency);
    return () => window.clearTimeout(timer);
  }, [request, fail, latency, matching, sort, page, pageSize]);

  const backToStart = () => {
    setPage(1);
    setSelection([]);
    setAllSelected(false);
  };
  const filtered = appliedQuery !== "" || selectedStatuses.length > 0 || selectedDepartments.length > 0;

  return {
    // What the table is drawn from.
    rows: loaded.rows,
    matching: loaded.matching,
    loading: loaded.request !== request,
    error: loaded.error && loaded.request === request,
    // The state the page holds.
    query,
    selectedStatuses,
    selectedDepartments,
    sort,
    page,
    pageSize,
    selection,
    allSelected,
    filtered,
    // The ways it changes.
    setQuery(next: string) {
      setQueryState(next);
      // Emptying the box shows everyone at once; typing waits for a pause.
      if (next === "") setAppliedQuery("");
      backToStart();
    },
    setStatuses(next: PersonStatus[]) {
      setStatusesState(next);
      backToStart();
    },
    setDepartments(next: Department[]) {
      setDepartmentsState(next);
      backToStart();
    },
    clearFilters() {
      setQueryState("");
      setAppliedQuery("");
      setStatusesState([]);
      setDepartmentsState([]);
      backToStart();
    },
    setSort(next: DataTableSort) {
      setSortState(next);
      setPage(1);
    },
    setPage,
    setPageSize(next: number) {
      setPageSizeState(next);
      setPage(1);
    },
    setSelection,
    setAllSelected,
    retry: () => setAttempt((current) => current + 1),
    /** Removes people by id, or every person matching the filters when "all" is chosen, once the request has taken its time. */
    async remove(ids: string[] | "all"): Promise<number> {
      await wait(latency);
      const gone = ids === "all" ? matching().map((person) => person.id) : ids;
      setRemoved((current) => [...current, ...gone]);
      setSelection([]);
      setAllSelected(false);
      setPage((current) => Math.max(1, Math.min(current, Math.ceil((matching().length - gone.length) / pageSize))));
      return gone.length;
    },
  };
}

type PeopleList = ReturnType<typeof usePeopleList>;

/**
 * Columns are fixed shares of the table's width, so a longer value or a sort never moves a column; the checkbox and menu
 * columns have fixed widths of their own (`selectionColumnWidth`, `actionsColumnWidth`).
 */
const columns: DataTableColumn<Person>[] = [
  { id: "name", header: copy.columns.name, accessor: (row) => row.name, sortable: true, rowHeader: true, width: "24%" },
  { id: "role", header: copy.columns.role, accessor: (row) => row.role, sortable: true, width: "22%" },
  { id: "department", header: copy.columns.department, accessor: (row) => row.department, cell: (row) => copy.departmentLabels[row.department], sortable: true, width: "19%" },
  {
    id: "status",
    header: copy.columns.status,
    accessor: (row) => row.status,
    cell: (row) => (
      <Badge tone={row.status === "active" ? "success" : row.status === "invited" ? "info" : "warning"} size="sm" variant="subtle">
        {copy.statusLabels[row.status]}
      </Badge>
    ),
    sortable: true,
    width: "17%",
  },
  { id: "lastActive", header: copy.columns.lastActive, accessor: (row) => row.lastActive, sortable: true, width: "18%" },
];

/** What a filter's button says: "All" while nothing is chosen, the choice while it is one, else a count. */
function filterValue(chosen: string[]): string {
  if (chosen.length === 0) return copy.allChoices;
  if (chosen.length === 1) return chosen[0] ?? copy.allChoices;
  return copy.selectedCount(chosen.length);
}

/** The choices of one filter: an "All" checkbox that clears the others, and a checkbox for each option. `TableToolbar.Filters` draws it in the filter's panel and in the sheet. */
function FilterChoices<T extends string>({
  name,
  options,
  labels,
  chosen,
  onChange,
}: {
  name: string;
  options: T[];
  labels: Record<T, string>;
  chosen: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className={styles.panel}>
      <Checkbox checked={chosen.length === 0} onCheckedChange={() => onChange([])}>
        {copy.allChoices}
      </Checkbox>
      <CheckboxGroup aria-label={name} value={chosen} onValueChange={(value) => onChange(value as T[])}>
        {options.map((option) => (
          <Checkbox key={option} value={option}>
            {labels[option]}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
}

/** What the page is asking the person to confirm: removing these people, or everyone matching the filters. */
type PendingRemoval = { ids: string[] | "all"; count: number; name?: string } | null;

/**
 * The page itself: heading, toolbar (the count, the search and two filters in three columns, the chips of the filters in force and the
 * bulk actions), the table, its paging, and the three ways it has nothing to show (no one yet, no one matching, a failed request). It
 * lives inside an `AppShell.Main`; `DataTableListPage` below puts it in a whole shell.
 */
export function PeopleListContent({ list }: { list: PeopleList }) {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingRemoval>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shown = list.selection.length;

  const applied = [
    ...list.selectedStatuses.map((value) => ({ id: `status:${value}`, group: copy.statusFilter, label: copy.statusLabels[value] })),
    ...list.selectedDepartments.map((value) => ({ id: `department:${value}`, group: copy.departmentFilter, label: copy.departmentLabels[value] })),
  ];
  const removeFilter = (id: string) => {
    const [kind, value] = id.split(":");
    if (kind === "status") list.setStatuses(list.selectedStatuses.filter((status) => status !== value));
    else list.setDepartments(list.selectedDepartments.filter((department) => department !== value));
  };

  const nothingAtAll = !list.loading && !list.error && list.matching === 0 && !list.filtered;
  const noResults = !list.loading && !list.error && list.matching === 0 && list.filtered;

  const empty = nothingAtAll ? (
    <EmptyState size="sm">
      <EmptyState.Icon icon={UsersIcon} />
      <EmptyState.Title level={2}>{copy.emptyTitle}</EmptyState.Title>
      <EmptyState.Description>{copy.emptyText}</EmptyState.Description>
      <EmptyState.Actions>
        <Button leadingIcon={PlusIcon} onClick={() => toast({ tone: "success", title: copy.added })}>
          {copy.add}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  ) : (
    <EmptyState size="sm">
      <EmptyState.Icon icon={MagnifyingGlassIcon} />
      <EmptyState.Title level={2}>{copy.noResultsTitle}</EmptyState.Title>
      <EmptyState.Description>{copy.noResultsText}</EmptyState.Description>
      <EmptyState.Actions>
        <Button variant="secondary" onClick={list.clearFilters}>
          {copy.clearFilters}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );

  return (
    <div className={styles.page}>
      <PageHeader>
        <PageHeader.Breadcrumbs>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="#" onClick={preventNavigation}>
                {copy.home}
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.Page>{copy.people}</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb>
        </PageHeader.Breadcrumbs>
        {/* Focus goes here when a removal finishes: the row that had it is gone, and the heading is where the page starts. */}
        <PageHeader.Title ref={headingRef} tabIndex={-1}>
          {copy.title}
        </PageHeader.Title>
        <PageHeader.Description>{copy.intro}</PageHeader.Description>
        <PageHeader.Actions>
          <Button leadingIcon={PlusIcon} onClick={() => toast({ tone: "success", title: copy.added })}>
            {copy.add}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {list.error ? (
        <EmptyState announce tone="danger" variant="outlined">
          <EmptyState.Icon icon={WarningCircleIcon} />
          <EmptyState.Title level={2}>{copy.errorTitle}</EmptyState.Title>
          <EmptyState.Description>{copy.errorText}</EmptyState.Description>
          <EmptyState.Actions>
            <Button onClick={list.retry}>{copy.retry}</Button>
          </EmptyState.Actions>
        </EmptyState>
      ) : (
        <div className={styles.table}>
          <DataTable<Person>
            aria-label={copy.tableName}
            columns={columns}
            data={list.rows}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            sortMode="manual"
            sort={list.sort}
            onSortChange={list.setSort}
            page={list.page}
            onPageChange={list.setPage}
            pageSize={list.pageSize}
            pageSizeOptions={pageSizes}
            onPageSizeChange={list.setPageSize}
            totalCount={list.matching}
            loading={list.loading}
            loadingRows={list.pageSize}
            selectionMode="multiple"
            selection={list.selection}
            onSelectionChange={list.setSelection}
            allSelected={list.allSelected}
            onAllSelectedChange={list.setAllSelected}
            selectionColumnWidth="3rem"
            actionsColumnWidth="4rem"
            emptyState={empty}
            rowActions={(row) => (
              <Menu>
                <Menu.Trigger asChild>
                  <IconButton icon={DotsThreeIcon} variant="tertiary" size="sm" aria-label={copy.rowMenu(row.name)} />
                </Menu.Trigger>
                <Menu.Content align="end">
                  <Menu.Item
                    icon={PencilSimpleIcon}
                    onSelect={() => {
                      toast({ tone: "info", title: copy.edited(row.name) });
                    }}
                  >
                    {copy.edit}
                  </Menu.Item>
                  <Menu.Item
                    icon={CopySimpleIcon}
                    onSelect={() => {
                      // Clipboard access can be refused (an insecure page, a denied permission), and the message is only a courtesy.
                      void navigator.clipboard?.writeText(row.email).catch(() => undefined);
                      toast({ tone: "success", title: copy.copied });
                    }}
                  >
                    {copy.copyEmail}
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item icon={TrashIcon} tone="danger" onSelect={() => setPending({ ids: [row.id], count: 1, name: row.name })}>
                    {copy.remove}
                  </Menu.Item>
                </Menu.Content>
              </Menu>
            )}
          >
            <DataTable.Toolbar aria-label={copy.toolsName} className={styles.toolbar}>
              <TableToolbar.Row className={styles.mainRow}>
                <TableToolbar.Summary className={styles.summary} count={list.matching} loading={list.loading} />
                <TableToolbar.Search className={styles.search}>
                  <SearchInput
                    aria-label={copy.search}
                    placeholder={copy.searchPlaceholder}
                    value={list.query}
                    onChange={(event) => list.setQuery(event.target.value)}
                    onClear={() => list.setQuery("")}
                  />
                </TableToolbar.Search>
                {/* The filters are inline while the table is wide and one "Filters" button with a bottom sheet while it is narrow (`TableToolbar.Filters`, ADR-0199). */}
                <TableToolbar.Filters
                  className={styles.filters}
                  onClearAll={list.clearFilters}
                  labels={{ group: copy.filtersName, button: copy.filtersButton, title: copy.filtersSheetTitle, description: copy.filtersSheetText, clearAll: copy.clearAll, done: copy.done }}
                >
                  <TableToolbar.Filter
                    label={copy.statusFilter}
                    value={filterValue(list.selectedStatuses.map((value) => copy.statusLabels[value]))}
                    labelPlacement="before"
                    count={list.selectedStatuses.length}
                    className={cx(styles.choiceFilter, styles.statusFilter)}
                    labels={{ panel: () => copy.filterPanel(copy.statusFilter) }}
                  >
                    <FilterChoices name={copy.statusFilter} options={statuses} labels={copy.statusLabels} chosen={list.selectedStatuses} onChange={list.setStatuses} />
                  </TableToolbar.Filter>
                  <TableToolbar.Filter
                    label={copy.departmentFilter}
                    value={filterValue(list.selectedDepartments.map((value) => copy.departmentLabels[value]))}
                    labelPlacement="before"
                    count={list.selectedDepartments.length}
                    className={cx(styles.choiceFilter, styles.departmentFilter)}
                    labels={{ panel: () => copy.filterPanel(copy.departmentFilter) }}
                  >
                    <FilterChoices
                      name={copy.departmentFilter}
                      options={departments}
                      labels={copy.departmentLabels}
                      chosen={list.selectedDepartments}
                      onChange={list.setDepartments}
                    />
                  </TableToolbar.Filter>
                </TableToolbar.Filters>
              </TableToolbar.Row>
              <TableToolbar.Row className={styles.chipsRow}>
                <TableToolbar.ActiveFilters items={applied} onRemove={removeFilter} onClearAll={list.clearFilters} />
              </TableToolbar.Row>
              <DataTable.Selection className={styles.bulk}>
                <Toolbar aria-label={copy.bulkName} variant="secondary">
                  <Toolbar.Button
                    leadingIcon={DownloadSimpleIcon}
                    onClick={() => toast({ tone: "success", title: copy.exported(list.allSelected ? list.matching : shown) })}
                  >
                    {copy.export}
                  </Toolbar.Button>
                  <Toolbar.Button
                    leadingIcon={TrashIcon}
                    onClick={() => setPending({ ids: list.allSelected ? "all" : list.selection, count: list.allSelected ? list.matching : shown })}
                  >
                    {copy.remove}
                  </Toolbar.Button>
                </Toolbar>
              </DataTable.Selection>
            </DataTable.Toolbar>
            {/* The footer is the table's own: the page size at the start, the page controls centred and the range at the end (`layout="centered"`, ADR-0200),
                stacking below the table's 48rem. It is drawn only while there are rows to page, and the table announces a change of page size itself. */}
            {!nothingAtAll && !noResults && <DataTable.Pagination layout="centered" size="sm" compact="never" className={styles.footer} labels={{ pageSize: copy.rowsPerPage, summary: copy.range }} />}
          </DataTable>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        tone="danger"
        title={pending?.name ? copy.confirmOne(pending.name) : copy.confirmMany(pending?.count ?? 0)}
        description={copy.confirmText}
        labels={{ confirm: copy.confirmAction, cancel: copy.cancel }}
        onConfirm={async () => {
          if (!pending) return;
          const done = await list.remove(pending.ids);
          toast({ tone: "success", title: pending.name ? copy.removedOne(pending.name) : copy.removedMany(done) });
        }}
        onOpenChangeComplete={(open) => {
          // The row or the button that opened the dialog is gone after a removal, so focus would fall to the page: put it on the heading
          // instead, but only if it has fallen (a person who moved on keeps their place).
          if (!open && (document.activeElement === document.body || document.activeElement === null)) headingRef.current?.focus();
        }}
      />
    </div>
  );
}

export interface DataTableListPageProps extends PeopleListOptions {
  /** Draws the shell in a box of its own, for a Docs page. */
  framed?: boolean;
}

/** The whole template: an `AppShell` with the demo's sidebar and header, holding the people list. */
export function DataTableListPage({ framed = false, ...options }: DataTableListPageProps) {
  const list = usePeopleList(options);
  return (
    <Toast.Provider>
      <DemoShell framed={framed} sidebarCurrent="team" pageKey="people" pageTitle={copy.title}>
        <AppShell.Content size="xl">
          <PeopleListContent list={list} />
        </AppShell.Content>
      </DemoShell>
    </Toast.Provider>
  );
}
