// Each component's tier and category, for the site's search (ADR-0224's neighbour, 02-structure.md §1): read from the manifest, which
// takes them from the components package's catalog, so the site never reads them from a story title. A template has none here.
import manifest from "@dbm-system/components/manifest.json" with { type: "json" };
import type { Placements } from "../components/header/searchIndex";

const TIER_NAMES: Record<string, string> = { atom: "Atoms", molecule: "Molecules", organism: "Organisms" };

export const componentPlacements: Placements = Object.fromEntries(
  manifest.components.flatMap((component) => {
    const tier = TIER_NAMES[component.tier];
    return tier ? [[component.name, { tier, category: component.category }]] : [];
  }),
);
