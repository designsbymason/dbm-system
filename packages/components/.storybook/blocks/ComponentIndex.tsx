import { useEffect, useMemo, useState } from "react";
import { Button } from "../../src/atoms/Button";
import { VisuallyHidden } from "../../src/atoms/VisuallyHidden";
import { ToggleGroup } from "../../src/molecules/ToggleGroup";
import { SearchInput } from "../../src/molecules/SearchInput";

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

/** The singular label for each tier, used in the legend and in the hidden text after each name. */
const TIER_LABEL: Record<Tier, string> = {
  Atoms: "Atom",
  Molecules: "Molecule",
  Organisms: "Organism",
  Templates: "Template",
};

/** What each tier means, shown in the legend. */
const TIER_HINT: Record<Exclude<Tier, "Templates">, string> = {
  Atoms: "A single building block",
  Molecules: "A few atoms working together",
  Organisms: "A complete, self-contained pattern",
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
 * `Templates/{Template}` or `Templates/{Category}/{Template}` Docs page. Everything else (the Foundations pages, a
 * component's own checks) has a different top-level group or no Docs entry and is left out.
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

function TierMark({ tier }: { tier: Tier }) {
  return <span aria-hidden="true" className="dbm-component-index__mark" data-tier={tier} />;
}

function IndexList({ rows }: { rows: IndexRow[] }) {
  const groups = useMemo(() => {
    const byLetter = new Map<string, IndexRow[]>();
    for (const row of rows) {
      const letter = row.name.charAt(0).toUpperCase();
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), row]);
    }
    return [...byLetter.entries()];
  }, [rows]);

  return (
    <div className="dbm-component-index__columns">
      {groups.map(([letter, group]) => (
        <div key={letter} className="dbm-component-index__group">
          <h3 aria-hidden="true" className="dbm-component-index__letter">
            {letter}
          </h3>
          <ul className="dbm-component-index__list">
            {group.map((row) => (
              <li key={row.id}>
                <a className="dbm-component-index__link" href={docsHref(row.id)} target="_top">
                  <TierMark tier={row.tier} />
                  {row.name}
                  <VisuallyHidden>
                    , {TIER_LABEL[row.tier].toLowerCase()}, {row.category}
                  </VisuallyHidden>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Docs-page-only index of every component, built live from Storybook's own `index.json` so it can never drift from
 * the sidebar: a leading mark per tier (a shape as well as a colour), a search box, and a tier and a category
 * filter that combine. Templates are listed in their own section below, empty until the first one exists. Not part
 * of the published package.
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
  const reset = () => {
    setQuery("");
    setTiers([]);
    setCategories([]);
  };

  if (failed) {
    return (
      <p>
        The component list could not be loaded from Storybook&apos;s index. Use the sidebar to browse the components.
      </p>
    );
  }
  if (entries === null) {
    return <p role="status">Loading the component list…</p>;
  }

  return (
    <div className="dbm-component-index sb-unstyled">
      <ul className="dbm-component-index__legend" aria-label="Tier key">
        {COMPONENT_TIERS.map((tier) => (
          <li key={tier}>
            <TierMark tier={tier} />
            <strong>{TIER_LABEL[tier]}</strong>
            <span>{TIER_HINT[tier]}</span>
          </li>
        ))}
      </ul>

      <div className="dbm-component-index__controls">
        <SearchInput
          aria-label="Search components"
          placeholder="Search components"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
        />
        <div className="dbm-component-index__filter">
          <span className="dbm-component-index__filter-label" id="dbm-index-tier-label">
            Tier
          </span>
          <ToggleGroup
            aria-labelledby="dbm-index-tier-label"
            type="multiple"
            size="sm"
            attached={false}
            value={tiers}
            onValueChange={setTiers}
          >
            {COMPONENT_TIERS.map((tier) => (
              <ToggleGroup.Item key={tier} value={tier}>
                {tier}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>
        <div className="dbm-component-index__filter">
          <span className="dbm-component-index__filter-label" id="dbm-index-category-label">
            Category
          </span>
          <ToggleGroup
            aria-labelledby="dbm-index-category-label"
            type="multiple"
            size="sm"
            attached={false}
            value={categories}
            onValueChange={setCategories}
          >
            {categoryOptions.map((category) => (
              <ToggleGroup.Item key={category} value={category}>
                {category}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <p className="dbm-component-index__count" role="status">
        {filtering ? `Showing ${shown.length} of ${components.length} components` : `${components.length} components`}
        {filtering ? (
          <>
            {" "}
            <Button variant="tertiary" size="sm" onClick={reset}>
              Clear filters
            </Button>
          </>
        ) : null}
      </p>

      {shown.length > 0 ? (
        <IndexList rows={shown} />
      ) : (
        <p className="dbm-component-index__empty">No component matches. Try a shorter search or clear a filter.</p>
      )}

      <h2 id="templates">Templates</h2>
      <p className="dbm-component-index__empty">
        Templates are page-level compositions of the components above: a dashboard shell, an auth flow and so on.
      </p>
      {templates.length > 0 ? (
        <IndexList rows={templates} />
      ) : (
        <p className="dbm-component-index__empty">No templates yet.</p>
      )}
    </div>
  );
}
