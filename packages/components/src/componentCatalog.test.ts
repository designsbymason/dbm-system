import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// `src/componentCatalog.json` is where each component's tier and category are written down: one entry per component, keyed by
// the component's name, which is also the name of its folder (`src/atoms/Button`). The manifest, the All components table and
// the site's search read it, so a component belongs to one tier and one category in one place. These tests keep it complete
// and honest. (They run from the package's own folder.)
const root = join(process.cwd(), "src");

type Tier = "atom" | "molecule" | "organism";
interface Entry {
  tier: Tier;
  category: string;
}

const catalog = JSON.parse(readFileSync(join(root, "componentCatalog.json"), "utf8")) as Record<string, Entry>;

/** The nine categories of `04-component-inventory.md`, which `07-storybook-and-documentation-standards.md` §3 lists in this order. */
const CATEGORIES = ["Layout", "Typography", "Inputs", "Data Display", "Navigation", "Feedback", "Overlay", "Media", "Utility"];

const TIER_FOLDERS: Record<string, Tier> = { atoms: "atom", molecules: "molecule", organisms: "organism" };

/** Every component folder (`src/atoms/Button`, …): a folder in a tier folder that holds the component's own stories. */
const folders = new Map<string, Tier>();
for (const [folder, tier] of Object.entries(TIER_FOLDERS)) {
  for (const name of readdirSync(join(root, folder))) {
    const dir = join(root, folder, name);
    if (statSync(dir).isDirectory() && existsSync(join(dir, `${name}.stories.tsx`))) folders.set(name, tier);
  }
}

describe("component catalog", () => {
  it("finds the components it is meant to cover", () => {
    expect(folders.size).toBeGreaterThan(100);
  });

  it("has an entry for every component", () => {
    const missing = [...folders.keys()].filter((name) => !(name in catalog));
    expect(missing, "add the component to src/componentCatalog.json with its tier and category").toEqual([]);
  });

  it("has no entry for a component that does not exist", () => {
    const extra = Object.keys(catalog).filter((name) => !folders.has(name));
    expect(extra, "remove the entry from src/componentCatalog.json").toEqual([]);
  });

  it("gives every component the tier of the folder it is in", () => {
    const wrong = Object.entries(catalog).filter(([name, entry]) => folders.has(name) && folders.get(name) !== entry.tier);
    expect(wrong.map(([name, entry]) => `${name}: ${entry.tier} but in ${folders.get(name)}'s folder`)).toEqual([]);
  });

  it("uses only the nine categories", () => {
    const wrong = Object.entries(catalog).filter(([, entry]) => !CATEGORIES.includes(entry.category));
    expect(wrong.map(([name, entry]) => `${name}: "${entry.category}"`)).toEqual([]);
  });

  it("keeps its entries in alphabetical order, so a change reads as one line", () => {
    const names = Object.keys(catalog);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
  });

  // Until a component's story title stops carrying its tier and category, the catalog must agree with the title, so the two
  // cannot drift while both exist. This check goes when the titles become `Components/{Name}`.
  it("agrees with the tier and category in each component's story title", () => {
    const TITLE_TIERS: Record<string, Tier> = { Atoms: "atom", Molecules: "molecule", Organisms: "organism" };
    const disagree: string[] = [];
    for (const name of Object.keys(catalog)) {
      const folder = Object.entries(TIER_FOLDERS).find(([, tier]) => tier === folders.get(name))?.[0];
      if (!folder) continue;
      const stories = readFileSync(join(root, folder, name, `${name}.stories.tsx`), "utf8");
      const match = /^\s*title:\s*"(Atoms|Molecules|Organisms)\/([^/"]+)\/([^/"]+)"/m.exec(stories);
      const entry = catalog[name];
      if (!match || !entry) {
        disagree.push(`${name}: no Tier/Category/Name title in its stories`);
      } else if (match[3] !== name || TITLE_TIERS[match[1] ?? ""] !== entry.tier || match[2] !== entry.category) {
        disagree.push(`${name}: the title says ${match[1]}/${match[2]}, the catalog says ${entry.tier}/${entry.category}`);
      }
    }
    expect(disagree).toEqual([]);
  });
});
