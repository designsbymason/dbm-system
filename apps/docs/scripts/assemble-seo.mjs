#!/usr/bin/env node
/**
 * Writes the root `robots.txt` and `sitemap.xml` of the assembled site (guidelines/docs-site/02-structure.md §12, ADR-0221),
 * from what Storybook's build left in `storybook/` (packages/components/scripts/generate-seo.mjs): its robots rules, one
 * source for both, and its list of Docs pages. A `robots.txt` only counts at the origin's root, so the two files move
 * there and the copies inside `storybook/` are removed, leaving one sitemap.
 *
 *   node scripts/assemble-seo.mjs <root> [--home]
 *
 * `--home` adds the site's own pages to the sitemap: the home page, and every other page the site builds at its root (the
 * Privacy Policy and the Terms of Use, ADR-0224; not the 404). Leave it out while the root is the placeholder (the site goes
 * live in S3). Every other address in the sitemap must be a Docs entry in Storybook's `index.json`, or the run fails.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ORIGIN = "https://dbm-system.com/";
const STORYBOOK = `${ORIGIN}storybook/`;

const args = process.argv.slice(2);
const home = args.includes("--home");
const root = resolve(args.find((arg) => !arg.startsWith("--")) ?? "");
const storybook = join(root, "storybook");
for (const file of ["index.json", "robots.txt", "sitemap.xml"]) {
  if (!existsSync(join(storybook, file))) {
    process.stderr.write(`assemble-seo: ${join(storybook, file)} is missing; build Storybook first (build-storybook writes robots.txt and sitemap.xml)\n`);
    process.exit(1);
  }
}

const locations = [...readFileSync(join(storybook, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const ids = new Set(Object.keys(JSON.parse(readFileSync(join(storybook, "index.json"), "utf8")).entries));
const prefix = `${STORYBOOK}?path=/docs/`;
for (const loc of locations) {
  if (!loc.startsWith(prefix) || !ids.has(loc.slice(prefix.length))) {
    process.stderr.write(`assemble-seo: ${loc} is not a Docs page in Storybook's index.json\n`);
    process.exit(1);
  }
}
if (locations.length === 0) {
  process.stderr.write("assemble-seo: Storybook's sitemap lists no Docs pages\n");
  process.exit(1);
}

/** The site's own pages: the home page, then each folder at the root that holds an `index.html` (so not Storybook, not the 404). */
const folders = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "storybook" && existsSync(join(root, entry.name, "index.html")))
  .map((entry) => `${ORIGIN}${entry.name}/`)
  .sort();
const sitePages = home ? [ORIGIN, ...folders] : [];

const urls = [...sitePages, ...locations].map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n");
writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

// Storybook's rules, with the sitemap line pointing at the root sitemap.
const rules = readFileSync(join(storybook, "robots.txt"), "utf8")
  .split("\n")
  .filter((line) => !line.startsWith("Sitemap:"))
  .join("\n")
  .trimEnd();
writeFileSync(join(root, "robots.txt"), `${rules}\n\nSitemap: ${ORIGIN}sitemap.xml\n`);

rmSync(join(storybook, "robots.txt"));
rmSync(join(storybook, "sitemap.xml"));
process.stdout.write(`assemble-seo: ${root}/sitemap.xml with ${locations.length + sitePages.length} pages${home ? ` (the site's own: ${sitePages.length})` : ""}, and robots.txt\n`);
