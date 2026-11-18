#!/usr/bin/env node
/**
 * The agent-files check (ADR-0228, guidelines/docs-site/02-structure.md §6): what `generate-agent-files.mjs` wrote at the root of the
 * assembled site is complete and agrees with the rest of it. It fails on:
 *
 * - a sidebar-visible Docs page in Storybook's `index.json` with no copy in `docs/`, or a copy in `docs/` with no page;
 * - a copy that does not begin with a heading, does not end with its Storybook page, or still holds something the converter should have
 *   turned into text (an import or export line, a comment, a JSX tag, an empty cell) outside a code block;
 * - a link in a copy, `llms.txt` or `llms-full.txt` to a copy that does not exist, or to a Storybook page or story that is not in `index.json`;
 * - `llms.txt` that is not in the llmstxt.org form (an H1, a summary, H2 sections of `[name](url)` lines) or that leaves a page out;
 * - `llms-full.txt` that is not every copy, in the sidebar's order (it is rebuilt from the copies and compared);
 * - `manifest.json` or `AGENTS.md` that differs from the components package's own file.
 *
 *   node scripts/check-agent-files.mjs [root]
 *
 * `root` is the assembled artifact (the site at the root, Storybook in `storybook/`), default `_artifact`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLlmsFull, checkOrder } from "./agent-files/index-files.mjs";

/* eslint-disable no-console -- a CLI check's report */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", process.argv[2] ?? "_artifact");
const ORIGIN = "https://dbm-system.com/";
const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

const indexFile = join(root, "storybook", "index.json");
if (!existsSync(indexFile) || !existsSync(join(root, "docs"))) {
  console.error(`check-agent-files: ${root} needs storybook/index.json and docs/; assemble the site and run generate-agent-files first`);
  process.exit(1);
}
const entries = JSON.parse(readFileSync(indexFile, "utf8")).entries;
const pages = Object.values(entries).filter((entry) => entry.type === "docs" && entry.tags?.includes("dev"));
const copyName = (id) => `${id.replace(/--docs$/, "")}.md`;

// 1. A copy for every page, and no copy without a page.
const files = readdirSync(join(root, "docs"));
for (const page of pages) if (!files.includes(copyName(page.id))) fail(page.id, "has no Markdown copy in docs/");
const expected = new Set(pages.map((page) => copyName(page.id)));
for (const file of files) if (!expected.has(file)) fail(`docs/${file}`, "is not the copy of a Docs page in Storybook's index.json");

// 2. Each copy is whole text, and its links go somewhere.
const copies = new Map();
const checkLink = (where, url) => {
  const copy = /^https:\/\/dbm-system\.com\/docs\/([^#]+\.md)(#.*)?$/.exec(url);
  if (copy) {
    if (!expected.has(copy[1])) fail(where, `links to ${url}, which is not a copy`);
    return;
  }
  const storybook = /^https:\/\/dbm-system\.com\/storybook\/\?path=\/(docs|story)\/([^&#\s]+)/.exec(url);
  if (storybook) {
    if (!(storybook[2] in entries)) fail(where, `links to ${url}, which is not in Storybook's index`);
    return;
  }
  if (url.startsWith(ORIGIN)) {
    const path = url.slice(ORIGIN.length).replace(/[#?].*$/, "");
    if (!path || !existsSync(join(root, path))) fail(where, `links to ${url}, which is not in the site`);
  }
};
const linksOf = (markdown) => [...markdown.matchAll(/\]\((https?:[^)\s]+)\)|<(https?:[^>\s]+)>|^(?:\s*[-*] )?\[[^\]]+\]\((https?:[^)\s]+)\)/gm)].map((match) => match[1] ?? match[2] ?? match[3]);
for (const page of pages) {
  const file = copyName(page.id);
  if (!files.includes(file)) continue;
  const markdown = readFileSync(join(root, "docs", file), "utf8");
  copies.set(page.id, markdown);
  const where = `docs/${file}`;
  if (!/^# \S/.test(markdown)) fail(where, "does not begin with a heading");
  if (!markdown.trimEnd().endsWith(`?path=/docs/${page.id}>`)) fail(where, "does not end with the line naming its Storybook page");
  const prose = markdown.replace(/^```[\s\S]*?^```/gm, "");
  const leftovers = [
    [/^(import|export) /m, "an import or export line"],
    [/\{\/\*/, "a comment from the MDX"],
    [/^<[A-Za-z]/m, "a JSX tag"],
    [/\[object Object\]|\bNaN\b(?!`)/, "a value that did not render"],
    [/\|[ \t]*\|/, "an empty table cell"],
  ];
  for (const [pattern, what] of leftovers) if (pattern.test(prose.replace(/`[^`\n]*`/g, "x"))) fail(where, `holds ${what} outside a code block`);
  for (const url of linksOf(prose)) checkLink(where, url);
}

// 3. llms.txt: the llmstxt.org form, and every page in it.
const llmsFile = join(root, "llms.txt");
if (!existsSync(llmsFile)) fail("llms.txt", "does not exist");
else {
  const llms = readFileSync(llmsFile, "utf8");
  const lines = llms.split("\n");
  if (!/^# \S/.test(lines[0])) fail("llms.txt", "does not begin with an H1");
  if (!lines.slice(1, 4).some((line) => line.startsWith("> "))) fail("llms.txt", "has no summary (a blockquote) after the H1");
  if (!/^## /m.test(llms)) fail("llms.txt", "has no H2 sections");
  const listed = new Set();
  for (const line of lines) {
    if (!line.startsWith("- ")) continue;
    const match = /^- \[[^\]]+\]\((https:[^)\s]+)\)(: .+)?$/.exec(line);
    if (!match) {
      fail("llms.txt", `a list line is not "- [name](url): note": ${line.slice(0, 80)}`);
      continue;
    }
    checkLink("llms.txt", match[1]);
    listed.add(match[1]);
  }
  for (const page of pages) if (!listed.has(`${ORIGIN}docs/${copyName(page.id)}`)) fail("llms.txt", `does not list ${page.id}`);
  for (const target of ["AGENTS.md", "manifest.json", "llms-full.txt"]) if (!listed.has(`${ORIGIN}${target}`)) fail("llms.txt", `does not list ${target}`);
}

// 4. llms-full.txt: every copy, in the sidebar's order. Rebuilt from the copies and compared.
const fullFile = join(root, "llms-full.txt");
if (!existsSync(fullFile)) fail("llms-full.txt", "does not exist");
else if (copies.size === pages.length) {
  try {
    checkOrder(pages);
    const full = readFileSync(fullFile, "utf8");
    const summary = /^> (.+)$/m.exec(full)?.[1] ?? "";
    if (buildLlmsFull({ pages, copies, summary }) !== full) fail("llms-full.txt", "is not every copy, in the sidebar's order");
  } catch (error) {
    fail("llms-full.txt", error.message);
  }
}

// 5. The package's own files, byte for byte.
const packageDir = dirname(createRequire(import.meta.url).resolve("@dbm-system/components/package.json"));
for (const [name, source] of [
  ["AGENTS.md", join(packageDir, "AGENTS.md")],
  ["manifest.json", createRequire(import.meta.url).resolve("@dbm-system/components/manifest.json")],
]) {
  if (!existsSync(join(root, name))) fail(name, "does not exist");
  else if (!readFileSync(join(root, name)).equals(readFileSync(source))) fail(name, "differs from the components package's own file");
}

if (failures.length > 0) {
  console.error(`check-agent-files: ${failures.length} problem(s)\n${failures.map((line) => `  ${line}`).join("\n")}`);
  process.exit(1);
}
const kib = (name) => (readFileSync(join(root, name)).length / 1024).toFixed(0);
console.log(`check-agent-files: ${pages.length} copies, llms.txt (${kib("llms.txt")} KiB), llms-full.txt (${kib("llms-full.txt")} KiB), manifest.json and AGENTS.md; every link resolves`);
