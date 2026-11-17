import { Badge, Button, Checkbox, CheckboxGroup, DataTable, SearchInput, TableToolbar } from "@dbm-system/components";
import type { DataTableColumn } from "@dbm-system/components";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

/**
 * One toolbar filter: its name as plain text before a button that shows only the choice, at the start with the chevron at the end, over a
 * panel of checkboxes headed by "All".
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
  /** The button's width, fixed, so a longer choice ("Organism") cannot change it or move anything beside it. */
  width: string;
}) {
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
        style={{ inlineSize: width }}
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
  /** The height the table has with every row showing, kept while a filter narrows it, so nothing below it moves. */
  const [fullHeight, setFullHeight] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const present = new Set(rows.map((row) => row.category));
  const categoryOptions = CATEGORY_ORDER.filter((category) => present.has(category));
  const tierOptions = TIERS.filter((tier) => rows.some((row) => row.tier === tier));

  const needle = query.trim().toLowerCase();
  const shown = rows.filter(
    (row) =>
      (tiers.length === 0 || tiers.includes(row.tier)) &&
      (categories.length === 0 || categories.includes(row.category)) &&
      (needle === "" || row.name.toLowerCase().includes(needle) || row.description.toLowerCase().includes(needle)),
  );
  const filtering = needle !== "" || tiers.length > 0 || categories.length > 0;
  // The compact view is a box of one height whatever the rows (a filter that leaves two rows, or none, does not shrink it); the full view
  // is as tall as every row, and while a filter narrows it keeps that height.
  const bounded = !expanded;

  useEffect(() => {
    if (!expanded || filtering) return;
    const container = box.current?.querySelector<HTMLElement>('[class*="Table_container"]');
    if (container) setFullHeight(container.offsetHeight);
  }, [expanded, filtering, rows.length]);

  const held = bounded ? COMPACT_HEIGHT : filtering ? `${fullHeight}px` : "0px";

  return (
    <div className={styles.table} ref={box} style={{ "--table-min": held } as CSSProperties}>
      <DataTable
        aria-label="Components"
        columns={columns}
        data={shown}
        getRowId={(row) => row.name}
        tone="brand"
        striped
        stickyHeader={bounded}
        maxHeight={bounded ? COMPACT_HEIGHT : undefined}
        defaultSort={[{ columnId: "name", direction: "ascending" }]}
        emptyState="No component matches. Try a shorter search or clear a filter."
      >
        <DataTable.Toolbar aria-label="Component list tools">
          <TableToolbar.Row className={styles.row}>
            <TableToolbar.Summary
              className={styles.summary}
              count={shown.length}
              total={filtering ? rows.length : undefined}
              labels={{
                results: (count: number) => (count === 0 ? "No components" : `${count} ${count === 1 ? "component" : "components"}`),
                resultsOf: (count: number, total: number) => `${count} of ${total} components`,
              }}
            />
            <TableToolbar.Search className={styles.search}>
              <SearchInput
                aria-label="Search components"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery("")}
              />
            </TableToolbar.Search>
            <ChoiceFilter name="Tier" options={tierOptions} chosen={tiers} onChange={setTiers} width="8.25rem" />
            <ChoiceFilter name="Category" options={categoryOptions} chosen={categories} onChange={setCategories} width="9.25rem" />
          </TableToolbar.Row>
        </DataTable.Toolbar>
      </DataTable>
      {/* Kept in place (and out of the tab order) while a filter is on, so what is below the table does not move. */}
      <div className={styles.more} style={{ visibility: filtering ? "hidden" : "visible" }}>
        <Button variant="secondary" size="sm" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
          {expanded ? "Show fewer" : `Show all ${rows.length}`}
        </Button>
      </div>
    </div>
  );
}
