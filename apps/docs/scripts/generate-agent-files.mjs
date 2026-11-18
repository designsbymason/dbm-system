#!/usr/bin/env node
/**
 * Writes the files an agent reads, at the root of the assembled site (ADR-0228, guidelines/docs-site/02-structure.md §6):
 *
 * - `docs/<id>.md`, a Markdown copy of every Storybook Docs page, with its Properties tables read from the rendered page;
 * - `llms.txt`, the curated index of those copies, and `llms-full.txt`, all of them in one file;
 * - `manifest.json` and `AGENTS.md`, the components package's own files, copied so the root address and the package never differ.
 *
 *   node scripts/generate-agent-files.mjs <root>
 *
 * `<root>` is the site with Storybook built in `<root>/storybook/` (what the Pages workflow assembles). Build Storybook first.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { convertPage } from "./agent-files/convert.mjs";
import { buildContext, componentsPackageDir } from "./agent-files/context.mjs";
import { buildLlmsFull, buildLlmsTxt } from "./agent-files/index-files.mjs";
import { scrapeTables } from "./agent-files/scrape-tables.mjs";

const root = resolve(process.argv[2] ?? "");
const storybookDir = join(root, "storybook");

const ctx = await buildContext({ storybookDir });
const packageDir = componentsPackageDir();

// Every page's MDX, and how many rendered tables it has.
const sources = new Map(ctx.pages.map((entry) => [entry.id, readFileSync(join(packageDir, entry.importPath), "utf8")]));
const jobs = ctx.pages
  .map((entry) => ({ id: entry.id, count: (sources.get(entry.id).match(/<(PropertiesTable|FieldsTable)\b/g) ?? []).length }))
  .filter((job) => job.count > 0);
process.stdout.write(`generate-agent-files: ${ctx.pages.length} Docs pages, reading the tables of ${jobs.length} from the rendered pages\n`);
const tables = await scrapeTables(storybookDir, jobs);

let bytes = 0;
const copies = new Map();
for (const entry of ctx.pages) {
  const markdown = await convertPage(sources.get(entry.id), { entry, ctx, tables: tables.get(entry.id) ?? [] });
  copies.set(entry.id, markdown);
  const file = join(root, "docs", `${entry.id.replace(/--docs$/, "")}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, markdown);
  bytes += Buffer.byteLength(markdown);
}

// The site's own description of itself, from the home page, so the index says what the home page says.
const homePage = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "src", "pages", "index.astro"), "utf8");
const summary = /description="([^"]+)"/.exec(homePage)?.[1];
if (!summary) throw new Error("generate-agent-files: src/pages/index.astro has no description for the index to quote");
const descriptions = Object.fromEntries(ctx.componentRows().map((row) => [row.name, row.description]));
writeFileSync(join(root, "llms.txt"), buildLlmsTxt({ pages: ctx.pages, copies, descriptions, summary }));
writeFileSync(join(root, "llms-full.txt"), buildLlmsFull({ pages: ctx.pages, copies, summary }));

// The package's own files, byte for byte.
copyFileSync(join(packageDir, "AGENTS.md"), join(root, "AGENTS.md"));
copyFileSync(createRequire(import.meta.url).resolve("@dbm-system/components/manifest.json"), join(root, "manifest.json"));

process.stdout.write(`generate-agent-files: ${ctx.pages.length} copies in ${join(root, "docs")} (${(bytes / 1024).toFixed(0)} KiB), llms.txt, llms-full.txt, manifest.json and AGENTS.md\n`);
