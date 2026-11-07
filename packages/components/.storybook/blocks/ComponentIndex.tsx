import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Badge } from "../../src/atoms/Badge";
import { Checkbox } from "../../src/atoms/Checkbox";
import { MagnifyingGlassIcon, SquaresFourIcon, StackIcon } from "@dbm-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import { IconButton } from "../../src/atoms/IconButton";
import { VisuallyHidden } from "../../src/atoms/VisuallyHidden";
import { Popover } from "../../src/molecules/Popover";
import { CheckboxGroup } from "../../src/molecules/CheckboxGroup";
import { SearchInput } from "../../src/molecules/SearchInput";
import { TableToolbar } from "../../src/molecules/TableToolbar";
import { Toolbar } from "../../src/molecules/Toolbar";
import { DataTable } from "../../src/organisms/DataTable";
import type { DataTableColumn } from "../../src/organisms/DataTable";
import { componentDescriptions } from "../../src/componentDescriptions";
import { toneForTier } from "./ComponentHeader";
import type { ComponentTier } from "./ComponentHeader";

type Tier = "Atoms" | "Molecules" | "Organisms" | "Templates";

interface IndexRow {
  id: string;
  name: string;
  tier: Tier;
  category: string;
  /** A template that is a story-only example page an app copies, not a component it imports (only the application shells ship). */
  examplePage: boolean;
}

export interface RawEntry {
  id: string;
  title: string;
  type: string;
  tags?: string[];
}

/** The singular label of each tier, which is also the key of the badge tone `ComponentHeader` draws it with. */
const TIER_LABEL: Record<Tier, ComponentTier> = {
  Atoms: "Atom",
  Molecules: "Molecule",
  Organisms: "Organism",
  Templates: "Template",
};

/**
 * The tag a story-only example page puts on its stories (`tags: ["example-page"]`), which Storybook copies onto the page's Docs entry.
 * It is the template's own statement, so it holds wherever the template is grouped; `src/templates/examplePageTags.test.ts` fails a
 * template that is not exported from the package and lacks it.
 */
const EXAMPLE_PAGE_TAG = "example-page";

const COMPONENT_TIERS: Exclude<Tier, "Templates">[] = ["Atoms", "Molecules", "Organisms"];

/** The inventory's categories in the order `07-storybook-and-documentation-standards.md` §3 lists them. */
const CATEGORY_ORDER = [
  "Layout",
  "Typography",
  "Inputs",
  "Data Display",
  "Navigation",
  "Feedback",
  "Overlay",
  "Media",
  "Utility",
];

const isTier = (value: string | undefined): value is Tier =>
  value === "Atoms" || value === "Molecules" || value === "Organisms" || value === "Templates";

/**
 * Turns Storybook's own index into rows. A component's Docs page is the entry whose type is `docs` and whose title is
 * `{Tier}/{Category}/{Component}` (§3), so a new component appears here with no edit to this page. A template is a
 * `Templates/{Template}` or `Templates/{Category}/{Template}` Docs page. Everything else (the Foundations pages, the
 * guides, a component's own checks) has a different top-level group or no Docs entry and is left out.
 */
function toRows(entries: Record<string, RawEntry>): IndexRow[] {
  const rows: IndexRow[] = [];
  for (const entry of Object.values(entries)) {
    if (entry.type !== "docs") continue;
    const parts = entry.title.split("/");
    const tier = parts[0];
    if (!isTier(tier)) continue;
    const name = parts[parts.length - 1];
    if (!name) continue;
    if (tier === "Templates") {
      if (parts.length < 2 || parts.length > 3) continue;
      rows.push({ id: entry.id, name, tier, category: parts[1] ?? "", examplePage: entry.tags?.includes(EXAMPLE_PAGE_TAG) === true });
    } else if (parts.length === 3 && parts[1]) {
      rows.push({ id: entry.id, name, tier, category: parts[1], examplePage: false });
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/** `./` from the preview iframe is Storybook's root, so `?path=` there opens a page in the full shell. */
function docsHref(id: string): string {
  return `${new URL("./", window.location.href).href}?path=/docs/${id}`;
}

/** What a filter's button says: "All" while nothing is chosen, the choice while it is one, else a count. */
function filterValue(chosen: string[]): string {
  if (chosen.length === 0) return "All";
  if (chosen.length === 1) return chosen[0] ?? "All";
  return `${chosen.length} selected`;
}

/**
 * One toolbar filter: its name as plain text before the button ("Tier:"), and a button that shows only the choice,
 * with the choice on the left and the chevron on the right. The panel is a list of checkboxes headed by "All". The
 * button is named by both ("Tier: All"), which holds its visible text as whole words (WCAG 2.5.3).
 */
function ChoiceFilter({
  name,
  options,
  chosen,
  onChange,
  width,
}: {
  name: string;
  options: string[];
  chosen: string[];
  onChange: (next: string[]) => void;
  width: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const buttonId = `${id}-button`;
  return (
    <div className="dbm-getting-started__filtergroup">
      <span className="dbm-getting-started__filterlabel" id={labelId}>
        {name}:
      </span>
      <TableToolbar.Filter
        id={buttonId}
        aria-labelledby={`${labelId} ${buttonId}`}
        label={filterValue(chosen)}
        className="dbm-getting-started__filter"
        style={{ inlineSize: width }}
        labels={{ panel: () => `${name} filter` }}
      >
        <div className="dbm-getting-started__panel">
          <Checkbox checked={chosen.length === 0} onCheckedChange={() => onChange([])}>
            All
          </Checkbox>
          <CheckboxGroup aria-label={name} value={chosen} onValueChange={onChange}>
            {options.map((option) => (
              <Checkbox key={option} value={option}>
                {option}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </TableToolbar.Filter>
    </div>
  );
}

/**
 * On a phone the filters and the search are a right-aligned group of icon buttons beside the count (Tier, Category, search), each
 * opening a small panel: the same checkboxes as the toolbar's filters, and the search box, focused. A button shows it is in use (a
 * filter chosen, a search typed) by its look, and is named by its choice ("Tier: All"). These stand in for the toolbar's own filters and
 * search, which are not drawn at that width.
 */
function FilterIconButton({
  name,
  icon,
  options,
  chosen,
  onChange,
}: {
  name: string;
  icon: PhosphorIcon;
  options: string[];
  chosen: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <Popover>
      <Popover.Trigger asChild>
        <IconButton icon={icon} variant="ghost" tone={chosen.length > 0 ? "brand" : "neutral"} size="sm" aria-label={`${name}: ${filterValue(chosen)}`} />
      </Popover.Trigger>
      <Popover.Content align="end" aria-label={`${name} filter`}>
        <div className="dbm-getting-started__panel">
          {/* The icon button has no words of its own, so the panel says which filter it is. */}
          <span className="dbm-getting-started__panellabel">{name}</span>
          <Checkbox checked={chosen.length === 0} onCheckedChange={() => onChange([])}>
            All
          </Checkbox>
          <CheckboxGroup aria-label={name} value={chosen} onValueChange={onChange}>
            {options.map((option) => (
              <Checkbox key={option} value={option}>
                {option}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </Popover.Content>
    </Popover>
  );
}

function SearchIconButton({ query, onChange }: { query: string; onChange: (next: string) => void }) {
  return (
    <Popover>
      <Popover.Trigger asChild>
        <IconButton
          icon={MagnifyingGlassIcon}
          variant="ghost"
          tone={query.trim() !== "" ? "brand" : "neutral"}
          size="sm"
          aria-label={query.trim() !== "" ? `Search components: ${query.trim()}` : "Search components"}
        />
      </Popover.Trigger>
      <Popover.Content align="end" aria-label="Search components">
        <div className="dbm-getting-started__searchpanel">
          <SearchInput aria-label="Search components" placeholder="Search" value={query} onChange={(event) => onChange(event.target.value)} onClear={() => onChange("")} />
        </div>
      </Popover.Content>
    </Popover>
  );
}

/**
 * The columns of both tables. Fixed shares of the width, so choosing a filter never moves a column. With `markPages`, the name of an
 * example page template ends with an asterisk, which the note under the table explains.
 */
const columnsFor = (markPages: boolean): DataTableColumn<IndexRow>[] => [
  {
    id: "name",
    header: "Name",
    accessor: (row) => row.name,
    cell: (row) => (
      <a className="dbm-getting-started__link" href={docsHref(row.id)} target="_top">
        {row.name}
        {markPages && row.examplePage && <span aria-hidden="true">*</span>}
        {markPages && row.examplePage && <VisuallyHidden> (example page)</VisuallyHidden>}
      </a>
    ),
    sortable: true,
    rowHeader: true,
    width: "22%",
  },
  {
    id: "tier",
    header: "Tier",
    accessor: (row) => TIER_LABEL[row.tier],
    cell: (row) => (
      <Badge tone={toneForTier[TIER_LABEL[row.tier]]} size="sm" variant="subtle">
        {TIER_LABEL[row.tier]}
      </Badge>
    ),
    sortable: true,
    width: "16%",
  },
  {
    id: "category",
    header: "Category",
    accessor: (row) => row.category,
    sortable: true,
    width: "17%",
  },
  {
    id: "description",
    header: "Description",
    accessor: (row) => componentDescriptions[row.name] ?? "",
    cell: (row) => componentDescriptions[row.name] ?? "—",
    wrap: true,
    width: "45%",
  },
];

const COMPONENT_COLUMNS = columnsFor(false);
const TEMPLATE_COLUMNS = columnsFor(true);

/** The shared table: brand header, striped, sortable on every column, a header that stays while the rows scroll. */
function IndexTable({
  rows,
  label,
  emptyState,
  tall = false,
  wrapNames = false,
  columns,
  children,
}: {
  rows: IndexRow[];
  columns: DataTableColumn<IndexRow>[];
  label: string;
  emptyState: string;
  /** Holds one height whatever the rows (a table with filters), so nothing below it moves as they change. */
  tall?: boolean;
  /** Lets a long name wrap onto lines in full, rather than being cut off with an ellipsis. */
  wrapNames?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={["dbm-getting-started__table", tall && "dbm-getting-started__table--tall", wrapNames && "dbm-getting-started__table--wrapnames"]
        .filter(Boolean)
        .join(" ")}
    >
      <DataTable
        aria-label={label}
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        tone="brand"
        striped
        stickyHeader
        maxHeight="34rem"
        defaultSort={[{ columnId: "name", direction: "ascending" }]}
        emptyState={emptyState}
      >
        {children}
      </DataTable>
    </div>
  );
}

/**
 * Docs-page-only Components and Templates sections for the Getting started page, built live from Storybook's own
 * `index.json` so they can never drift from the sidebar. The Components section has a count badge, and a toolbar of a
 * search box and a Tier and a Category filter (each a panel of checkboxes, "All" until one is chosen) over a table of
 * every component; its tier badges are the ones the component pages draw. Templates are listed in a section of their
 * own, empty until the first one exists. Not part of the published package.
 */
export function ComponentIndex({ index }: { index?: Record<string, RawEntry> } = {}) {
  const [entries, setEntries] = useState<IndexRow[] | null>(index ? toRows(index) : null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // An index handed in (by a check) is drawn as it is; otherwise Storybook's own is fetched.
    if (index) return;
    const controller = new AbortController();
    const url = new URL("index.json", window.location.href);
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ entries: Record<string, RawEntry> }>;
      })
      .then((index) => setEntries(toRows(index.entries)))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [index]);

  const components = useMemo(() => (entries ?? []).filter((row) => row.tier !== "Templates"), [entries]);
  const templates = useMemo(() => (entries ?? []).filter((row) => row.tier === "Templates"), [entries]);

  const categoryOptions = useMemo(() => {
    const present = new Set(components.map((row) => row.category));
    const known = CATEGORY_ORDER.filter((category) => present.has(category));
    const extra = [...present].filter((category) => !CATEGORY_ORDER.includes(category)).sort();
    return [...known, ...extra];
  }, [components]);

  const needle = query.trim().toLowerCase();
  const shown = components.filter(
    (row) =>
      (tiers.length === 0 || tiers.includes(row.tier)) &&
      (categories.length === 0 || categories.includes(row.category)) &&
      (needle === "" || row.name.toLowerCase().includes(needle)),
  );
  const filtering = needle !== "" || tiers.length > 0 || categories.length > 0;

  const summaryLabels = {
    results: (count: number) => (count === 0 ? "No components" : `${count} ${count === 1 ? "component" : "components"}`),
    resultsOf: (count: number, total: number) => `${count} of ${total} components`,
  };

  return (
    <div className="dbm-getting-started sb-unstyled">
      <h2 id="components">Components</h2>
      <p className="dbm-getting-started__lede">
        Every component opens its own page with a live Playground, props, usage guidance, accessibility notes and a
        copyable snippet for each example. They come in three tiers: an{" "}
        <Badge tone={toneForTier.Atom} size="sm" variant="subtle">
          Atom
        </Badge>{" "}
        is a single building block, a{" "}
        <Badge tone={toneForTier.Molecule} size="sm" variant="subtle">
          Molecule
        </Badge>{" "}
        combines a few atoms into one working unit, and an{" "}
        <Badge tone={toneForTier.Organism} size="sm" variant="subtle">
          Organism
        </Badge>{" "}
        is a complete pattern. The list is read from Storybook itself, so it always matches the sidebar.
      </p>

      {failed ? (
        <p className="dbm-getting-started__note">
          The component list could not be loaded from Storybook&apos;s index. Use the sidebar to browse the components.
        </p>
      ) : entries === null ? (
        <p className="dbm-getting-started__note" role="status">
          Loading the component list…
        </p>
      ) : (
        <IndexTable tall columns={COMPONENT_COLUMNS} rows={shown} label="Components" emptyState="No component matches. Try a shorter search or clear a filter.">
          <DataTable.Toolbar aria-label="Component list tools">
            <TableToolbar.Row>
              <TableToolbar.Summary
                className="dbm-getting-started__summary"
                count={shown.length}
                total={filtering ? components.length : undefined}
                labels={summaryLabels}
              />
              <TableToolbar.Search>
                <SearchInput
                  aria-label="Search components"
                  placeholder="Search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onClear={() => setQuery("")}
                />
              </TableToolbar.Search>
              <div className="dbm-getting-started__mobiletools">
                <FilterIconButton name="Tier" icon={StackIcon} options={COMPONENT_TIERS} chosen={tiers} onChange={setTiers} />
                <FilterIconButton name="Category" icon={SquaresFourIcon} options={categoryOptions} chosen={categories} onChange={setCategories} />
                <SearchIconButton query={query} onChange={setQuery} />
              </div>
              <Toolbar aria-label="Filters" variant="secondary" className="dbm-getting-started__filters">
                <Toolbar.Item>
                  <ChoiceFilter name="Tier" options={COMPONENT_TIERS} chosen={tiers} onChange={setTiers} width="8.25rem" />
                </Toolbar.Item>
                <Toolbar.Item>
                  <ChoiceFilter
                    name="Category"
                    options={categoryOptions}
                    chosen={categories}
                    onChange={setCategories}
                    width="9.25rem"
                  />
                </Toolbar.Item>
              </Toolbar>
            </TableToolbar.Row>
          </DataTable.Toolbar>
        </IndexTable>
      )}

      <h2 id="templates">Templates</h2>
      <p className="dbm-getting-started__lede">
        Templates are page-level compositions of the components above: a dashboard shell, an auth flow and so on.
      </p>
      {templates.length > 0 ? (
        <>
          <IndexTable wrapNames columns={TEMPLATE_COLUMNS} rows={templates} label="Templates" emptyState="No templates yet." />
          {templates.some((row) => row.examplePage) && (
            <p className="dbm-getting-started__note dbm-getting-started__footnote">
              * An example page template, not a component. Nothing is imported from the package: copy the page into your app
              and replace its data and words.
            </p>
          )}
        </>
      ) : (
        <p className="dbm-getting-started__note">No templates yet.</p>
      )}
    </div>
  );
}
