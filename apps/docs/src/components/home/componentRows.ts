// The rows of the home page's component table, read at build from the manifest (which takes each component's tier and category from the
// components package's catalog) and the one line written for each component in the package's docs-only descriptions, the same ones
// Storybook's Index page shows, so the two tables cannot disagree (03-landing-page-brief.md §3, section 4).
import manifest from "@dbm-system/components/manifest.json" with { type: "json" };
import { componentDescriptions } from "../../../../../packages/components/src/componentDescriptions";
import { docsPage } from "../../data/site";

export type TierName = "Atom" | "Molecule" | "Organism" | "Template";

export interface ComponentRow {
  name: string;
  tier: TierName;
  category: string;
  description: string;
  /** The component's Docs page in Storybook. */
  href: string;
}

const TIERS: Record<string, { label: TierName; folder: string }> = {
  atom: { label: "Atom", folder: "atoms" },
  molecule: { label: "Molecule", folder: "molecules" },
  organism: { label: "Organism", folder: "organisms" },
  template: { label: "Template", folder: "templates" },
};

/** Storybook's own rule for an id segment: lower case, anything that is not a letter or a digit becomes a hyphen. */
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Every component and shipped shell, by name. A part that is its own export without a page of its own (`TooltipProvider`,
 * `ImageViewerButton`, `HoverCardProvider`) is left out: its folder is its parent component's, whose page documents it. A Docs page's
 * id keeps the tier and category the component was filed under when its page was made (ADR-0225), which the tier and category here
 * are, and the link check fails the build on any address Storybook does not have.
 */
export const componentRows: ComponentRow[] = manifest.components
  .filter((component) => component.source.split("/").at(-2) === component.name)
  .map((component) => {
    const tier = TIERS[component.tier];
    if (!tier) throw new Error(`componentRows: unknown tier "${component.tier}" on ${component.name}`);
    const description = componentDescriptions[component.name];
    if (!description) throw new Error(`componentRows: no line in componentDescriptions.ts for ${component.name}`);
    return {
      name: component.name,
      tier: tier.label,
      category: component.category,
      description,
      href: docsPage(`${tier.folder}-${slug(component.category)}-${component.name.toLowerCase()}`),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

export const componentCount = componentRows.filter((row) => row.tier !== "Template").length;
export const shellCount = componentRows.length - componentCount;
