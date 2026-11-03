import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Badge } from "../../src/atoms/Badge";
import { Checkbox } from "../../src/atoms/Checkbox";
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
}

interface RawEntry {
  id: string;
  title: string;
  type: string;
}

/** The singular label of each tier, which is also the key of the badge tone `ComponentHeader` draws it with. */
const TIER_LABEL: Record<Tier, ComponentTier> = {
  Atoms: "Atom",
  Molecules: "Molecule",
  Organisms: "Organism",
  Templates: "Template",
};

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
      rows.push({ id: entry.id, name, tier, category: parts[1] ?? "" });
    } else if (parts.length === 3 && parts[1]) {
      rows.push({ id: entry.id, name, tier, category: parts[1] });
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

/** The columns of both tables. Fixed shares of the width, so choosing a filter never moves a column. */
const COLUMNS: DataTableColumn<IndexRow>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (row) => row.name,
    cell: (row) => (
      <a className="dbm-getting-started__link" href={docsHref(row.id)} target="_top">
        {row.name}
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

/** The shared table: brand header, striped, sortable on every column, a header that stays while the rows scroll. */
function IndexTable({
  rows,
  label,
  emptyState,
  children,
}: {
  rows: IndexRow[];
  label: string;
  emptyState: string;
  children?: ReactNode;
}) {
  return (
    <div className="dbm-getting-started__table">
      <DataTable
        aria-label={label}
        columns={COLUMNS}
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
export function ComponentIndex() {
  const [entries, setEntries] = useState<IndexRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
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
  }, []);

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
        <IndexTable rows={shown} label="Components" emptyState="No component matches. Try a shorter search or clear a filter.">
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
        <IndexTable rows={templates} label="Templates" emptyState="No templates yet." />
      ) : (
        <p className="dbm-getting-started__note">No templates yet.</p>
      )}
    </div>
  );
}
