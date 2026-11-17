#!/usr/bin/env node
/**
 * The count check: the number of components is the same everywhere it is shown. The manifest the package ships, Storybook's Components
 * Index and the home page (the Specification card and the All components table) each say how many components there are, and they are
 * read from three places, so this fails the build when they disagree: a component added to one and not another, a rule for what counts
 * that drifts, a helper counted as a component.
 *
 *   node scripts/check-counts.mjs [root]
 *
 * `root` is the assembled Pages artifact (the site at the root, Storybook in `storybook/`), default `dist`; the Storybook count is
 * skipped when Storybook is not beside the site.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a CLI check's report */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", process.argv[2] ?? "dist");
const home = join(root, "index.html");
if (!existsSync(home)) {
  console.error(`check-counts: ${home} does not exist; build the site first`);
  process.exit(1);
}

const counts = [];

// 1. The manifest the components package ships: what has a page of its own (a helper is listed apart).
const manifest = JSON.parse(readFileSync(resolve(here, "..", "..", "..", "packages", "components", "dist", "manifest.json"), "utf8"));
counts.push(["the manifest's components", manifest.components.length]);

// 2. Storybook's Components Index: the Docs pages titled `Components/{Name}`, the Index page itself not counted.
const index = join(root, "storybook", "index.json");
if (existsSync(index)) {
  const entries = Object.values(JSON.parse(readFileSync(index, "utf8")).entries);
  const pages = entries.filter((entry) => entry.type === "docs" && /^Components\/[^/]+$/.test(entry.title) && entry.title !== "Components/Index");
  counts.push(["Storybook's Components pages", pages.length]);
}

// 3. The home page: the Specification card, and the All components table's summary.
const html = readFileSync(home, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ");
const card = /(\d+) components and \d+ hooks/.exec(text);
if (card) counts.push(["the home page's Specification card", Number(card[1])]);
else console.error("check-counts: the Specification card's \"N components and N hooks\" line is not on the home page");
const summary = /(?:^| )(\d+) components?(?: |$)/.exec(text.slice(text.indexOf("All components")));
if (summary) counts.push(["the home page's table summary", Number(summary[1])]);
else console.error("check-counts: the All components table's count is not on the home page");

let failed = !card || !summary;
const expected = counts[0][1];
for (const [where, count] of counts) {
  const ok = count === expected;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${where}: ${count}`);
  if (!ok) failed = true;
}
if (failed) {
  console.error("check-counts: the component counts disagree: a component, an application shell or a helper is counted on one surface and not another");
  process.exit(1);
}
console.log(`check-counts: ${expected} components everywhere`);
