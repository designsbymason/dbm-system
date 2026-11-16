import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { readStoryTitle } from "./storyTitle";
import type { ManifestTier } from "./types";

/** A component's place in the system: its tier and its category. */
export interface Placement {
  tier: ManifestTier;
  category: string;
}

/** The catalog as written: each component's tier and category, by the name of its folder. */
export type Catalog = Record<string, Placement>;

/** Where the catalog is, inside the components package. */
export const CATALOG_PATH = join("src", "componentCatalog.json");

const TIER_FOLDERS: Record<string, ManifestTier> = { atoms: "atom", molecules: "molecule", organisms: "organism" };

/** Reads the components package's `src/componentCatalog.json`. */
export function readCatalog(root: string): Catalog {
  return JSON.parse(readFileSync(join(root, CATALOG_PATH), "utf8")) as Catalog;
}

/** What `placementOf` found, or why it found nothing (`problem` is a sentence for a diagnostic). */
export type PlacementResult = { placement: Placement; problem?: undefined } | { placement?: undefined; problem: string };

/**
 * Where the component whose source is in `directory` sits in the system.
 *
 * A component in `src/atoms`, `src/molecules` or `src/organisms` is in the catalog under the name of its folder (the main
 * component's name; a helper that shares the folder, such as `TooltipProvider`, takes its folder's entry), and the entry's
 * tier must be the tier of the folder it is in. A template, in `src/templates`, is read from the title of its stories
 * (`Templates/Shells/AppShell`), as templates have no catalog entry.
 */
export function placementOf(root: string, catalog: Catalog, directory: string, name: string): PlacementResult {
  const [tierFolder, folder] = relative(join(root, "src"), directory).split(sep);
  if (tierFolder === "templates") {
    const read = readStoryTitle(directory, name);
    return read ? { placement: read } : { problem: `no story title like "Templates/Shells/${name}" in ${relative(root, directory)}` };
  }
  const folderTier = tierFolder === undefined ? undefined : TIER_FOLDERS[tierFolder];
  if (folderTier === undefined || folder === undefined) {
    return { problem: `${relative(root, directory)} is not in src/atoms, src/molecules, src/organisms or src/templates` };
  }
  const entry = catalog[folder];
  if (!entry) return { problem: `no entry for "${folder}" in ${CATALOG_PATH}` };
  if (entry.tier !== folderTier) return { problem: `${CATALOG_PATH} puts "${folder}" in the ${entry.tier} tier, but its folder is in src/${tierFolder}` };
  return { placement: entry };
}
