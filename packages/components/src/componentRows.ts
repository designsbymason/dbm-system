import componentCatalog from "./componentCatalog.json";

/**
 * The rows of the Index page's table, from Storybook's index and the component catalog. Docs-only, like `componentDescriptions.ts`: not
 * exported from the package, so not shipped.
 */

/** A tier as the Index page's table names it. */
export type Tier = "Atoms" | "Molecules" | "Organisms" | "Templates";

/** One row of the Index page's table. */
export interface IndexRow {
  id: string;
  name: string;
  tier: Tier;
  category: string;
  /** Whether it has a page under `Components/` and so is a component (the application shells are, as template-level components); an example page is not. */
  component: boolean;
  /** A template that is a story-only example page an app copies, not a component it imports (only the application shells ship). */
  examplePage: boolean;
}

/** An entry of Storybook's own `index.json`, as far as the table reads it. */
export interface RawEntry {
  id: string;
  title: string;
  type: string;
  tags?: string[];
}

/** The catalog as `src/componentCatalog.json` writes it: each component's tier and category, by name. */
export type Catalog = Record<string, { tier: "atom" | "molecule" | "organism" | "template"; category: string }>;

const TIER_NAMES = { atom: "Atoms", molecule: "Molecules", organism: "Organisms", template: "Templates" } as const;

/** What the category column says of an example page, which is in no category of the catalog. */
const PAGE_CATEGORY = "Pages";

/**
 * The tag a story-only example page puts on its stories (`tags: ["example-page"]`), which Storybook copies onto the page's Docs entry.
 * It is the template's own statement, so it holds wherever the template is grouped; `src/templates/examplePageTags.test.ts` fails a
 * template that is not exported from the package and lacks it.
 */
const EXAMPLE_PAGE_TAG = "example-page";

/** The name of the component a Docs title is the page of (`Components/{Name}`), or `undefined` when it is not a component's page: a part or a component's checks is deeper. */
function componentNameOf(parts: string[]): string | undefined {
  return parts[0] === "Components" && parts.length === 2 ? parts[1] : undefined;
}

/**
 * Turns Storybook's own index into rows. A component's Docs page is the entry whose type is `docs` and whose title is
 * `Components/{Name}`, and its tier and category are the catalog's (`src/componentCatalog.json`), so a new component appears
 * here once it is in the catalog (a test makes sure it is). An application shell is one of them, in the template tier. An example
 * page is a `Templates/{Name}` Docs page. Everything else (the Foundations pages, the guides, a component's own checks) has a
 * different top-level group or no Docs entry and is left out.
 */
export function toRows(entries: Record<string, RawEntry>, catalog: Catalog = componentCatalog as Catalog): IndexRow[] {
  const rows: IndexRow[] = [];
  for (const entry of Object.values(entries)) {
    if (entry.type !== "docs") continue;
    const parts = entry.title.split("/");
    const name = parts[parts.length - 1];
    if (!name) continue;
    if (parts[0] === "Templates") {
      // The Templates Index page (`Templates/Index`) is the page of the table, not a template.
      if (parts.length !== 2 || entry.title === "Templates/Index") continue;
      rows.push({ id: entry.id, name, tier: "Templates", category: PAGE_CATEGORY, component: false, examplePage: entry.tags?.includes(EXAMPLE_PAGE_TAG) === true });
      continue;
    }
    const componentName = componentNameOf(parts);
    const placement = componentName === undefined ? undefined : catalog[componentName];
    if (componentName !== undefined && placement) {
      rows.push({ id: entry.id, name: componentName, tier: TIER_NAMES[placement.tier], category: placement.category, component: true, examplePage: false });
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
