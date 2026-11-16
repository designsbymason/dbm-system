// Writes the search-engine files for the built Storybook, next to its index.json: a sitemap of the Docs pages and the
// robots.txt rules (ADR-0221, docs-site/02-structure.md §12). Runs after `storybook build`.
//
// - `sitemap.xml` lists only the Docs entries a reader sees in the sidebar (the `dev` tag; a page hidden with `!dev`, such as
//   the "moved" page, is left out), each at its manager address, `/storybook/?path=/docs/<id>`. Story canvases are never listed.
// - `robots.txt` allows /storybook/ and disallows the story addresses. `iframe.html` is never disallowed: it must stay
//   crawlable or the Docs pages index empty. A robots.txt only counts at the origin's root, so this copy is the source that the
//   site's build merges into the root file (S2).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const BASE = "https://dbm-system.com/storybook/";

/** The `<loc>` of every sidebar-visible Docs entry of a Storybook `index.json`, in index order. */
export function docsLocations(index) {
  return Object.values(index.entries)
    .filter((entry) => entry.type === "docs" && entry.tags?.includes("dev"))
    .map((entry) => `${BASE}?path=/docs/${entry.id}`);
}

export function buildSitemap(index) {
  const locations = docsLocations(index);
  if (locations.length === 0) throw new Error("generate-seo: index.json has no Docs entries");
  const urls = locations.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobots() {
  return [
    "# Storybook's rules (ADR-0221). The Docs pages are indexed; the story canvases are not.",
    "# `iframe.html` is never disallowed: the Docs pages are drawn inside it.",
    "User-agent: *",
    "Allow: /storybook/",
    "Disallow: /storybook/*?path=/story/",
    "",
    `Sitemap: ${BASE}sitemap.xml`,
    "",
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = join(dirname(fileURLToPath(import.meta.url)), "..", "storybook-static");
  const indexPath = join(out, "index.json");
  if (!existsSync(indexPath)) throw new Error(`generate-seo: ${indexPath} does not exist (run build-storybook first)`);
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const sitemap = buildSitemap(index);
  // Each address must name an entry the index has (the sitemap is built from it, so this guards the id format).
  const ids = new Set(Object.keys(index.entries));
  for (const loc of docsLocations(index)) {
    const id = loc.slice(`${BASE}?path=/docs/`.length);
    if (!ids.has(id)) throw new Error(`generate-seo: ${loc} names no entry in index.json`);
  }
  writeFileSync(join(out, "sitemap.xml"), sitemap);
  writeFileSync(join(out, "robots.txt"), buildRobots());
  process.stdout.write(`generate-seo: sitemap.xml with ${docsLocations(index).length} Docs pages, and robots.txt\n`);
}
