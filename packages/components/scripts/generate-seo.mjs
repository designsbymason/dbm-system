// Writes the search-engine files for the built Storybook, next to its index.json: a sitemap of the Docs pages and the
// robots.txt rules (ADR-0221, docs-site/02-structure.md §12). Runs after `storybook build`.
//
// - `sitemap.xml` lists only the Docs entries a reader sees in the sidebar (the `dev` tag; a page hidden with `!dev` is left out), each at its manager address, `/storybook/?path=/docs/<id>`. Story canvases are never listed.
// - `index.html` gets a static title, description and share tags, and a `<noscript>` block of links to the Markdown copies (`patchManagerShell`).
//   The manager is one shell for every address, drawn by script, so without this a crawler that does not run script sees the title
//   "storybook - Storybook" and an empty body. No canonical is written here: it differs per page and the manager script sets it.
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

export const SITE = "https://dbm-system.com/";
export const SHELL_TITLE = "DBM System Storybook: components, tokens and guides";
export const SHELL_DESCRIPTION =
  "Documentation for DBM System, an agentic React component library built for both AI coding agents and developers alike.";

/** The manager's `index.html` with a static title, description, share tags and a `<noscript>` block of links. */
export function patchManagerShell(html) {
  if (!html.includes("<title>") || !html.includes("<body>")) throw new Error("generate-seo: index.html has no <title> or <body>");
  if (html.includes(`<title>${SHELL_TITLE}</title>`)) return html; // already patched
  const tags = [
    `<meta name="description" content="${SHELL_DESCRIPTION}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="DBM System" />`,
    `<meta property="og:title" content="${SHELL_TITLE}" />`,
    `<meta property="og:description" content="${SHELL_DESCRIPTION}" />`,
    `<meta property="og:image" content="${SITE}social.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n    ");
  const noscript = `<noscript>
      <h1>DBM System Storybook</h1>
      <p>${SHELL_DESCRIPTION} This page needs JavaScript. The same documentation is available as plain text:</p>
      <ul>
        <li><a href="${SITE}llms.txt">llms.txt</a>, an index of every page</li>
        <li><a href="${SITE}llms-full.txt">llms-full.txt</a>, every page in one file</li>
        <li><a href="${SITE}docs/getting-started-introduction.md">Introduction</a>, as Markdown</li>
      </ul>
    </noscript>`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${SHELL_TITLE}</title>\n    ${tags}`)
    .replace("<body>", `<body>\n    ${noscript}`);
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
  const shellPath = join(out, "index.html");
  writeFileSync(shellPath, patchManagerShell(readFileSync(shellPath, "utf8")));
  writeFileSync(join(out, "sitemap.xml"), sitemap);
  writeFileSync(join(out, "robots.txt"), buildRobots());
  process.stdout.write(`generate-seo: sitemap.xml with ${docsLocations(index).length} Docs pages, robots.txt, and the shell's title and noscript\n`);
}
