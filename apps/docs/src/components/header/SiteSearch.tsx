import { CommandPalette, IconButton, Kbd } from "@dbm-system/components";
import type { CommandItem } from "@dbm-system/components";
import { MagnifyingGlassIcon } from "@dbm-system/icons";
import { useRef, useState } from "react";
import { storybookHref } from "../../data/site";
import styles from "./SiteSearch.module.css";

/** One entry of Storybook's `index.json`: a Docs page, or a story. */
interface IndexEntry {
  id: string;
  title: string;
  name: string;
  type: "docs" | "story";
  tags?: string[];
}

/** A searchable page or story, prepared once from the index. */
interface Searchable {
  item: CommandItem;
  /** Lower-case words the query is matched against. */
  text: string;
  /** The Docs pages come before the stories, and the shorter title before the longer. */
  rank: number;
}

/** How many results the palette lists. */
const LIMIT = 12;

/** The top-level Storybook groups that are documentation; the rest (Atoms, Molecules, Organisms, Templates) are components. */
const DOCS_GROUPS = new Set(["Getting started", "Guides", "Resources", "Foundations"]);

const unavailable = "Search needs Storybook beside the site.";

/** The entries a reader sees in Storybook's sidebar (the `dev` tag): not the hidden check stories or the moved page. */
function prepare(entries: IndexEntry[]): Searchable[] {
  return entries
    .filter((entry) => entry.tags?.includes("dev"))
    .map((entry) => {
      const parts = entry.title.split("/");
      const last = parts.at(-1) ?? entry.title;
      const where = parts.slice(0, -1).join(" › ");
      const isDocs = entry.type === "docs";
      const group = DOCS_GROUPS.has(parts[0] ?? "") ? "Docs" : isDocs ? "Components" : "Examples";
      const label = isDocs ? last : `${last}: ${entry.name}`;
      const href = `${storybookHref}?path=/${isDocs ? "docs" : "story"}/${entry.id}`;
      return {
        item: { value: href, label, description: where || undefined, group },
        text: `${entry.title} ${isDocs ? "" : entry.name}`.toLowerCase(),
        rank: (isDocs ? 0 : 100) + entry.title.length,
      };
    });
}

/** The best matches for a query: every word must appear, a title that starts with the query comes first, then Docs pages. */
function find(searchables: Searchable[], query: string): CommandItem[] {
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

/**
 * Search (02-structure.md §1, ADR-0220): DBM's CommandPalette over Storybook's own `index.json` on this origin, so every Docs
 * page, component and story is found by title and opens in Storybook. No search service and no site index. The index is
 * fetched once, when the palette first opens. ⌘K or Ctrl K opens it from anywhere. Where there is no Storybook beside the site
 * (the development server), the palette says so instead of searching. Its trigger is an icon button, and below `lg` the palette
 * opens as a bottom sheet.
 */
export function SiteSearch() {
  const [results, setResults] = useState<CommandItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const index = useRef<Promise<Searchable[] | null> | null>(null);
  const latest = useRef("");

  const load = () => {
    index.current ??= fetch(`${storybookHref}index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ entries: Record<string, IndexEntry> }>;
      })
      .then(({ entries }) => prepare(Object.values(entries)))
      .catch(() => {
        setFailed(true);
        return null;
      });
    return index.current;
  };

  const search = async (query: string) => {
    latest.current = query;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const searchables = await load();
    if (latest.current !== query) return; // A newer search replaced this one.
    setResults(searchables ? find(searchables, query) : []);
    setLoading(false);
  };

  return (
    <CommandPalette
      aria-label="Search the documentation"
      commands={results}
      filter={false}
      loading={loading}
      onQueryChange={search}
      onOpenChange={(open) => open && void load()}
      onSelect={(item) => window.location.assign(item.value)}
      emptyContent={failed ? unavailable : undefined}
      labels={{ placeholder: "Search the docs and components…" }}
      // Below `lg` the panel is a sheet from the bottom edge, 85% of the screen tall (SiteSearch.module.css).
      className={styles.sheet}
      trigger={
        // An icon button like the others in the bar. Its name is "Search"; the tooltip adds the shortcut, shown for a sighted keyboard user.
        <IconButton
          icon={MagnifyingGlassIcon}
          aria-label="Search"
          tooltip={
            <>
              Search <Kbd keys={["mod", "K"]} />
            </>
          }
          variant="tertiary"
          size="sm"
          data-site-search
        />
      }
    />
  );
}
