import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ManifestTier } from "./types";

const TIERS: Record<string, ManifestTier> = { Atoms: "atom", Molecules: "molecule", Organisms: "organism", Templates: "template" };

/** The tier and category in a story title such as `Atoms/Inputs/Button`, or `undefined` when the title does not follow that shape. */
export function parseStoryTitle(title: string): { tier: ManifestTier; category: string } | undefined {
  const [first, second, third] = title.split("/");
  const tier = first === undefined ? undefined : TIERS[first];
  if (tier === undefined || second === undefined || third === undefined) return undefined;
  return { tier, category: second };
}

/**
 * Reads the tier and category of the component in `directory` from the title of its stories. The component's own
 * `<Name>.stories.tsx` is read first; any other story file in the folder is the fallback.
 */
export function readStoryTitle(directory: string, name: string): { tier: ManifestTier; category: string } | undefined {
  const stories = readdirSync(directory).filter((file) => file.endsWith(".stories.tsx") && !file.includes(".checks."));
  const ordered = [...stories.filter((file) => file === `${name}.stories.tsx`), ...stories.filter((file) => file !== `${name}.stories.tsx`)];
  for (const file of ordered) {
    // The meta's title is the one that reads `Tier/Category/Name`; a story's own `title` arg (a dialog's heading, say) does not.
    for (const match of readFileSync(join(directory, file), "utf8").matchAll(/\btitle:\s*"([^"]+)"/g)) {
      const parsed = match[1] === undefined ? undefined : parseStoryTitle(match[1]);
      if (parsed) return parsed;
    }
  }
  return undefined;
}
