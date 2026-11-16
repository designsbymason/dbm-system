import { Badge, Button, Checkbox, CheckboxGroup, DataTable, SearchInput, TableToolbar } from "@dbm-system/components";
import type { DataTableColumn } from "@dbm-system/components";
import { useId, useState } from "react";
import type { ComponentRow, TierName } from "./componentRows";
import styles from "./ComponentTable.module.css";

/** The tier badges draw as they do on a component's Docs page in Storybook. */
const TONES = { Atom: "info", Molecule: "warning", Organism: "success", Template: "brand" } as const;
const TIERS: TierName[] = ["Atom", "Molecule", "Organism", "Template"];
/** The inventory's categories in the order the documentation lists them. */
const CATEGORY_ORDER = ["Layout", "Typography", "Inputs", "Data Display", "Navigation", "Feedback", "Overlay", "Media", "Utility", "Shells"];

/** The rows the compact first view holds before "Show all". */
const COMPACT_HEIGHT = "26rem";

const columns: DataTableColumn<ComponentRow>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (row) => row.name,
    // The brand text colour, not the link colour: the link blue is a hair under 4.5:1 on the striped rows in the light themes.
    cell: (row) => (
      <a className={styles.link} href={row.href}>
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
    accessor: (row) => row.tier,
    cell: (row) => (
      <Badge tone={TONES[row.tier]} size="sm" variant="subtle">
        {row.tier}
      </Badge>
    ),
    sortable: true,
    width: "16%",
  },
  { id: "category", header: "Category", accessor: (row) => row.category, sortable: true, width: "17%" },
  { id: "description", header: "Description", accessor: (row) => row.description, wrap: true, width: "45%" },
];

/** What a filter's button says: "All" while nothing is chosen, the choice while it is one, else a count. */
const filterValue = (chosen: string[]) => (chosen.length === 0 ? "All" : chosen.length === 1 ? (chosen[0] ?? "All") : `${chosen.length} selected`);

/** One toolbar filter: its name as plain text before a button that shows the choice, over a panel of checkboxes headed by "All". */
function ChoiceFilter({ name, options, chosen, onChange }: { name: string; options: string[]; chosen: string[]; onChange: (next: string[]) => void }) {
  const id = useId();
  return (
    <div className={styles.filtergroup}>
      <span className={styles.filterlabel} id={`${id}-label`}>
        {name}:
      </span>
      <TableToolbar.Filter
        id={`${id}-button`}
        aria-labelledby={`${id}-label ${id}-button`}
        label={filterValue(chosen)}
        className={styles.filter}
        labels={{ panel: () => `${name} filter` }}
      >
        <div className={styles.panel}>
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
 * The home page's table of every component and shell: name, tier, category and one line, each name linking to its Docs page in
 * Storybook. It starts compact and shows everything on request; searching or filtering shows every match. The rows arrive as props
 * read at build, so the table is in the page's HTML before any script runs.
 */
export function ComponentTable({ rows }: { rows: ComponentRow[] }) {
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const present = new Set(rows.map((row) => row.category));
  const categoryOptions = CATEGORY_ORDER.filter((category) => present.has(category));
  const tierOptions = TIERS.filter((tier) => rows.some((row) => row.tier === tier));

  const needle = query.trim().toLowerCase();
  const shown = rows.filter(
    (row) =>
      (tiers.length === 0 || tiers.includes(row.tier)) &&
      (categories.length === 0 || categories.includes(row.category)) &&
      (needle === "" || row.name.toLowerCase().includes(needle)),
  );
  const filtering = needle !== "" || tiers.length > 0 || categories.length > 0;
  const compact = !expanded && !filtering;

  return (
    <div className={styles.table}>
      <DataTable
        aria-label="Components"
        columns={columns}
        data={shown}
        getRowId={(row) => row.name}
        tone="brand"
        striped
        stickyHeader={compact}
        maxHeight={compact ? COMPACT_HEIGHT : undefined}
        defaultSort={[{ columnId: "name", direction: "ascending" }]}
        emptyState="No component matches. Try a shorter search or clear a filter."
      >
        <DataTable.Toolbar aria-label="Component list tools">
          <TableToolbar.Row>
            <TableToolbar.Summary
              className={styles.summary}
              count={shown.length}
              total={filtering ? rows.length : undefined}
              labels={{
                results: (count: number) => (count === 0 ? "No components" : `${count} ${count === 1 ? "component" : "components"}`),
                resultsOf: (count: number, total: number) => `${count} of ${total} components`,
              }}
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
            <ChoiceFilter name="Tier" options={tierOptions} chosen={tiers} onChange={setTiers} />
            <ChoiceFilter name="Category" options={categoryOptions} chosen={categories} onChange={setCategories} />
          </TableToolbar.Row>
        </DataTable.Toolbar>
      </DataTable>
      {!filtering && (
        <div className={styles.more}>
          <Button variant="secondary" size="sm" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
            {expanded ? "Show fewer" : `Show all ${rows.length}`}
          </Button>
        </div>
      )}
    </div>
  );
}
