import type { CommandItem } from "@dbm-system/components";

/** One entry of Storybook's `index.json`: a Docs page, or a story. */
export interface IndexEntry {
  id: string;
  title: string;
  name: string;
  type: "docs" | "story";
  tags?: string[];
}

/** A searchable page or story, prepared once from the index. */
export interface Searchable {
  item: CommandItem;
  /** Lower-case words the query is matched against. */
  text: string;
  /** The Docs pages come before the stories, and the shorter title before the longer. */
  rank: number;
}

/** Each component's tier and category, by the component's name (`Button`: Atoms, Inputs); the manifest knows them (`data/placements.ts`). */
export type Placements = Record<string, { tier: string; category: string }>;

/** How many results the palette lists. */
export const LIMIT = 12;

/** The top-level Storybook groups that are documentation; the rest (the components and the templates) are not. */
const DOCS_GROUPS = new Set(["Getting started", "Guides", "Resources", "Foundations"]);

/**
 * A title with a component's tier and category in front: `Components/Tabs/Content` is `Molecules/Navigation/Tabs/Content`. The
 * components are in one group, so their tier and category are not in the title; search describes and ranks a component by them, as
 * a reader expects ("Atoms › Inputs"), and finds it by those words. A title that is not a component's is as it is.
 */
function withPlacement(parts: string[], placements: Placements): string[] {
  const name = parts[1];
  const placement = parts[0] === "Components" && name !== undefined ? placements[name] : undefined;
  return placement ? [placement.tier, placement.category, ...parts.slice(1)] : parts;
}

/**
 * The entries a reader sees in Storybook's sidebar (the `dev` tag): not the hidden check stories. `base` is where
 * Storybook is (`/storybook/`), which a result opens.
 */
export function prepare(entries: IndexEntry[], placements: Placements, base: string): Searchable[] {
  return entries
    .filter((entry) => entry.tags?.includes("dev"))
    .map((entry) => {
      const parts = withPlacement(entry.title.split("/"), placements);
      const title = parts.join("/");
      const last = parts.at(-1) ?? entry.title;
      const where = parts.slice(0, -1).join(" › ");
      const isDocs = entry.type === "docs";
      const group = DOCS_GROUPS.has(parts[0] ?? "") ? "Docs" : isDocs ? "Components" : "Examples";
      const label = isDocs ? last : `${last}: ${entry.name}`;
      const href = `${base}?path=/${isDocs ? "docs" : "story"}/${entry.id}`;
      return {
        item: { value: href, label, description: where || undefined, group },
        text: `${title} ${isDocs ? "" : entry.name}`.toLowerCase(),
        rank: (isDocs ? 0 : 100) + title.length,
      };
    });
}

/** The best matches for a query: every word must appear, a title that starts with the query comes first, then Docs pages. */
export function find(searchables: Searchable[], query: string): CommandItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return searchables
    .filter(({ text }) => words.every((word) => text.includes(word)))
    .map((searchable) => {
      const label = searchable.item.label.toLowerCase();
      const starts = words.every((word) => label.startsWith(word)) ? 0 : label.includes(words[0] ?? "") ? 50 : 200;
      return { searchable, score: searchable.rank + starts };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, LIMIT)
    .map(({ searchable }) => searchable.item);
}
