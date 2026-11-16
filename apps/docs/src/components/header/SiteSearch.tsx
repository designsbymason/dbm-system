import { CommandPalette, IconButton } from "@dbm-system/components";
import type { CommandItem } from "@dbm-system/components";
import { MagnifyingGlassIcon } from "@dbm-system/icons";
import { useRef, useState } from "react";
import { storybookHref } from "../../data/site";
import { find, prepare } from "./searchIndex";
import type { IndexEntry, Placements, Searchable } from "./searchIndex";
import styles from "./SiteSearch.module.css";

/**
 * Where Storybook is. On the published site it is beside the site, at `/storybook/`. The development server has no Storybook beside it,
 * so there search reads the Storybook development server (`pnpm storybook`, port 6006) when one is running.
 */
const storybookBase = import.meta.env.DEV ? "http://localhost:6006/" : storybookHref;

const unavailable = import.meta.env.DEV ? "Start Storybook (pnpm storybook) to search." : "Search is not available right now.";

/**
 * Search (02-structure.md §1, ADR-0220): DBM's CommandPalette over Storybook's own `index.json` on this origin, so every Docs
 * page, component and story is found by title and opens in Storybook. No search service and no site index. The index is
 * fetched once, when the palette first opens. ⌘K or Ctrl K opens it from anywhere. On the development server it reads the Storybook
 * development server instead (see `storybookBase`), and says so when that is not running. `placements` gives each component's tier and
 * category (from the manifest), so a result reads "Atoms › Inputs" however Storybook groups the component. Its trigger is an icon button, and below `lg` the palette
 * opens as a bottom sheet.
 */
export function SiteSearch({ placements }: { placements: Placements }) {
  const [results, setResults] = useState<CommandItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const index = useRef<Promise<Searchable[] | null> | null>(null);
  const latest = useRef("");

  const load = () => {
    index.current ??= fetch(`${storybookBase}index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ entries: Record<string, IndexEntry> }>;
      })
      .then(({ entries }) => prepare(Object.values(entries), placements, storybookBase))
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
        // An icon button like the others in the bar; its name and tooltip are "Search".
        <IconButton
          icon={MagnifyingGlassIcon}
          aria-label="Search"
          tooltip="Search"
          variant="tertiary"
          size="md"
          data-site-search
        />
      }
    />
  );
}
