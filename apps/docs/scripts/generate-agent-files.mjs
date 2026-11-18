#!/usr/bin/env node
/**
 * Writes the files an agent reads, at the root of the assembled site (ADR-0228, guidelines/docs-site/02-structure.md §6): a Markdown
 * copy of every Storybook Docs page at `docs/<id>.md`, with its Properties tables read from the rendered page.
 *
 *   node scripts/generate-agent-files.mjs <root>
 *
 * `<root>` is the site with Storybook built in `<root>/storybook/` (what the Pages workflow assembles). Build Storybook first.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { convertPage } from "./agent-files/convert.mjs";
import { buildContext } from "./agent-files/context.mjs";
import { scrapeTables } from "./agent-files/scrape-tables.mjs";

const root = resolve(process.argv[2] ?? "");
const storybookDir = join(root, "storybook");

const ctx = await buildContext({ storybookDir });
const packageDir = (await import("./agent-files/context.mjs")).componentsPackageDir();

// Every page's MDX, and how many rendered tables it has.
const sources = new Map(ctx.pages.map((entry) => [entry.id, readFileSync(join(packageDir, entry.importPath), "utf8")]));
const jobs = ctx.pages
  .map((entry) => ({ id: entry.id, count: (sources.get(entry.id).match(/<(PropertiesTable|FieldsTable)\b/g) ?? []).length }))
  .filter((job) => job.count > 0);
process.stdout.write(`generate-agent-files: ${ctx.pages.length} Docs pages, reading the tables of ${jobs.length} from the rendered pages\n`);
const tables = await scrapeTables(storybookDir, jobs);

let bytes = 0;
for (const entry of ctx.pages) {
  const markdown = await convertPage(sources.get(entry.id), { entry, ctx, tables: tables.get(entry.id) ?? [] });
  const file = join(root, "docs", `${entry.id.replace(/--docs$/, "")}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, markdown);
  bytes += Buffer.byteLength(markdown);
}
process.stdout.write(`generate-agent-files: ${ctx.pages.length} copies in ${join(root, "docs")} (${(bytes / 1024).toFixed(0)} KiB)\n`);
