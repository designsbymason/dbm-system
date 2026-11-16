#!/usr/bin/env node
/**
 * The link check (guidelines/docs-site/02-structure.md §11): every internal link and asset in the built site must
 * resolve to a file in it, and every same-page `#fragment` to an id on the page. A link into Storybook's pages
 * (`/storybook/?path=/docs/<id>`) must name an entry in its `index.json`, so a renamed Docs page breaks the build and
 * not the reader. External links are not fetched: no network in the gate.
 *
 *   node scripts/check-links.mjs [root]
 *
 * `root` is the folder to check (default `dist`, the docs build). Pass the assembled Pages artifact (the site at the
 * root, Storybook in `storybook/`) to check links into `/storybook/` too; with the docs build alone they are skipped.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a CLI check's report */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", process.argv[2] ?? "dist");
if (!existsSync(root)) {
  console.error(`check-links: ${root} does not exist; build the site first`);
  process.exit(1);
}
const hasStorybook = existsSync(join(root, "storybook", "index.html"));
/** The ids of Storybook's entries, when it is built beside the site. */
const storybookIds = hasStorybook ? new Set(Object.keys(JSON.parse(readFileSync(join(root, "storybook", "index.json"), "utf8")).entries)) : undefined;

/** The site's own pages: every .html file, except Storybook's (its links are its own). */
const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (relative(root, path) !== "storybook") walk(path);
    } else if (name.endsWith(".html")) {
      pages.push(path);
    }
  }
};
walk(root);

/** The file a site path is served from, or `undefined`. */
const fileFor = (pathname) => {
  const clean = decodeURIComponent(pathname).replace(/\/$/, "");
  return [join(root, clean), join(root, clean, "index.html"), join(root, `${clean}.html`)].find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
};

const failures = [];
let checked = 0;
const attribute = /\s(?:href|src)=("([^"]*)"|'([^']*)')/g;

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const pagePath = `/${relative(root, page).replace(/index\.html$/, "").replace(/\.html$/, "")}`;
  const ids = new Set([...html.matchAll(/\sid=("([^"]*)"|'([^']*)')/g)].map((match) => match[2] ?? match[3]));
  for (const match of html.matchAll(attribute)) {
    const value = (match[2] ?? match[3]).trim();
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) continue; // external, mailto:, data:, javascript:
    checked += 1;
    if (value.startsWith("#")) {
      const id = decodeURIComponent(value.slice(1));
      if (id && !ids.has(id)) failures.push(`${pagePath}: "${value}" points at no id on the page`);
      continue;
    }
    const url = new URL(value, `https://site.invalid${pagePath}`);
    const pathname = url.pathname;
    if (pathname.startsWith("/storybook/") && !hasStorybook) continue;
    const storybookPath = pathname.startsWith("/storybook/") ? url.searchParams.get("path") : null;
    const entry = storybookPath?.match(/^\/(?:docs|story)\/(.+)$/)?.[1];
    if (entry !== undefined && storybookIds && !storybookIds.has(entry)) {
      failures.push(`${pagePath}: "${value}" names no entry in Storybook's index.json`);
      continue;
    }
    if (fileFor(pathname)) continue;
    failures.push(`${pagePath}: "${value}" resolves to nothing in the build`);
  }
}

console.log(`check-links: ${pages.length} pages, ${checked} internal links and assets${hasStorybook ? ", Storybook included" : ""}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} broken:`);
  for (const failure of [...new Set(failures)]) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("check-links: all resolve");
