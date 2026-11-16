import { Button, CommandPalette, Kbd } from "@dbm-system/components";
import type { CommandItem } from "@dbm-system/components";
import { MagnifyingGlassIcon } from "@dbm-system/icons";
import { useRef, useState } from "react";

interface PagefindResult {
  url: string;
  excerpt: string;
  meta: { title?: string };
}
interface Pagefind {
  debouncedSearch: (query: string) => Promise<{ results: { data: () => Promise<PagefindResult> }[] } | null>;
}

/** Pagefind's excerpt marks the matched words with `<mark>`; the palette shows text, so the markup is dropped. */
const plain = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Written by `pagefind --site dist` after the build; a variable, so neither the bundler nor TypeScript resolves it. */
const pagefindPath = "/pagefind/pagefind.js";

const groupOf = (url: string) => (url.startsWith("/docs") ? "Docs" : url.startsWith("/components") ? "Components" : "Pages");

/**
 * Search (02-structure.md §6): DBM's CommandPalette in front of the Pagefind index built from the site's pages at build
 * time. No service, no account. ⌘K or Ctrl K opens it from anywhere. The index exists only in the built site, so
 * the development server says so instead of searching.
 */
export function SiteSearch() {
  const [results, setResults] = useState<CommandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const pagefind = useRef<Promise<Pagefind | null> | null>(null);

  const load = () => {
    pagefind.current ??= import(/* @vite-ignore */ pagefindPath).then(
      (module: Pagefind) => module,
      () => {
        setUnavailable(true);
        return null;
      },
    );
    return pagefind.current;
  };

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const engine = await load();
    const found = await engine?.debouncedSearch(query);
    if (found === null) return; // A newer search replaced this one.
    const data = await Promise.all((found?.results ?? []).slice(0, 12).map((result) => result.data()));
    setResults(
      data.map((page) => {
        const url = page.url.replace(/\.html$/, "").replace(/\/index$/, "/");
        return { value: url, label: page.meta.title?.replace(/: DBM System$/, "") ?? url, description: plain(page.excerpt), group: groupOf(url) };
      }),
    );
    setLoading(false);
  };

  return (
    <CommandPalette
      aria-label="Search the docs"
      commands={results}
      filter={false}
      loading={loading}
      onQueryChange={search}
      onOpenChange={(open) => open && void load()}
      onSelect={(item) => window.location.assign(item.value)}
      emptyContent={unavailable ? "Search works in the built site; the development server has no index." : undefined}
      labels={{ placeholder: "Search the docs…" }}
      trigger={
        // The visible word is the name (WCAG 2.5.3, Label in Name); the shortcut is shown but kept from assistive technology.
        <Button variant="secondary" tone="neutral" size="sm" leadingIcon={MagnifyingGlassIcon}>
          <span>Search</span>
          <Kbd keys={["mod", "K"]} aria-hidden="true" />
        </Button>
      }
    />
  );
}
