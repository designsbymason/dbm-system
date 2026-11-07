#!/usr/bin/env node
/**
 * Warn-only consistency check for the numbered guideline docs
 * (`guidelines/01`–`07`), the READMEs and `CLAUDE.md` against each other and
 * against the code.
 *
 * Those docs are a current-state reference, not a changelog
 * (`guidelines/06-engineering-standards.md` §8), and a hand-kept count, list
 * or section number goes stale without anything failing. This script prints a
 * finding for each of: a dated "Updated/Corrected/Added…" note, a line too long to
 * read, a component count stated outside the inventory, the inventory and the
 * status table drifting from the component folders, a broken link, a citation
 * of a section that no longer exists, and the ADR index missing a record.
 *
 * It only warns. Every finding is a GitHub `::warning` annotation (or a plain
 * line locally) and the exit code is always 0, so a finding shows up on the CI
 * run without turning it red. Run it with `pnpm check-guidelines`.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- this CLI script's whole job is printing a
   human-readable report; console.log is the intended output. */

const REPO = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const GUIDELINES = join(REPO, "guidelines");
const SRC = join(REPO, "packages/components/src");
const IN_CI = process.env.GITHUB_ACTIONS === "true";

/** Longest a line may be (link targets not counted) before it is hard to read. */
const MAX_PROSE_CHARS = 1500;
const MAX_TABLE_ROW_CHARS = 1200;

let warnings = 0;
const checks = [];

const read = (file) => readFileSync(file, "utf8");
const rel = (file) => relative(REPO, file);
const lines = (file) => read(file).split("\n");

function warn(file, line, message) {
  warnings += 1;
  if (IN_CI) console.log(`::warning file=${rel(file)}${line ? `,line=${line}` : ""}::${message}`);
  else console.log(`  warning: ${rel(file)}${line ? `:${line}` : ""} — ${message}`);
}

function check(name, run) {
  const before = warnings;
  run();
  checks.push({ name, found: warnings - before });
}

/** Every file under `dir` whose name ends with one of `extensions`, skipping build output. */
function walk(dir, extensions, found = []) {
  const skip = new Set(["node_modules", "dist", "build", "storybook-static", ".turbo", ".git", "test-results", "playwright-report"]);
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, extensions, found);
    else if (extensions.some((extension) => entry.endsWith(extension))) found.push(path);
  }
  return found;
}

const numberedDocs = readdirSync(GUIDELINES)
  .filter((name) => /^0[1-7]-.*\.md$/.test(name))
  .map((name) => join(GUIDELINES, name));
const indexDocs = [
  join(REPO, "README.md"),
  join(REPO, "CLAUDE.md"),
  join(GUIDELINES, "README.md"),
  join(GUIDELINES, "adr/README.md"),
  join(GUIDELINES, "component-reviews/README.md"),
  // The docs website's reference folder: a living reference like the numbered docs, so its links and line lengths are checked too.
  ...readdirSync(join(GUIDELINES, "docs-site"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(GUIDELINES, "docs-site", name)),
];
const trackedDocs = [...numberedDocs, ...indexDocs];

/** A table row's or a paragraph's length with link targets left out, since a URL says nothing of its readability. */
const textLength = (line) => line.replace(/\]\([^)]*\)/g, "]").length;

/** Components built on disk, as `name -> tier` (`Atom`, `Molecule`, `Organism`). */
function builtComponents() {
  const built = new Map();
  for (const [folder, tier] of [["atoms", "Atom"], ["molecules", "Molecule"], ["organisms", "Organism"]]) {
    const dir = join(SRC, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) if (statSync(join(dir, name)).isDirectory()) built.set(name, tier);
  }
  return built;
}

/** The inventory's component rows as `name -> { tier, priority }`, deduplicated by name as its summary does. */
function inventoryRows() {
  const file = join(GUIDELINES, "04-component-inventory.md");
  const rows = new Map();
  const tiers = { atom: "Atom", molecule: "Molecule", organism: "Organism" };
  for (const line of lines(file)) {
    if (!line.startsWith("|")) continue;
    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
    const tier = tiers[cells[1]?.toLowerCase()];
    if (!tier || !/^[🟢🟡⚪]/u.test(cells[2] ?? "")) continue;
    const name = cells[0].replace(/[`*]/g, "").split(" (")[0].split(" / ")[0].trim();
    if (!rows.has(name)) rows.set(name, { tier, priority: cells[2] });
  }
  return rows;
}

check("no dated update notes in the numbered docs", () => {
  const note = /\*\*[^*]{0,60}\b(Updated|Corrected|Added|Found|Established|Revised|Reopened|Decided|Fixed)\b[^*]{0,80}20\d\d-\d\d-\d\d|\((?:found|fixed|established|added|corrected|decided|revised)[^)]{0,40}20\d\d-\d\d-\d\d/i;
  for (const file of numberedDocs) {
    lines(file).forEach((line, index) => {
      if (note.test(line)) warn(file, index + 1, "a dated update note: edit the sentence that changed instead, and put the history in the commit message (06 §8)");
    });
  }
});

check("line length", () => {
  for (const file of numberedDocs) {
    let inFence = false;
    lines(file).forEach((line, index) => {
      if (line.startsWith("```")) inFence = !inFence;
      if (inFence) return;
      const isRow = line.startsWith("|");
      const limit = isRow ? MAX_TABLE_ROW_CHARS : MAX_PROSE_CHARS;
      if (textLength(line) > limit) warn(file, index + 1, `${textLength(line)} characters (limit ${limit}); split it or move detail to an ADR or the component's review file`);
    });
  }
});

check("counts are stated once, in the inventory", () => {
  const stated = /(?<![-–\d])\b([1-9]\d{1,2})\s+(atoms|molecules|organisms|components|records|files)\b|\b\d+ of a planned \d+/;
  const inventory = join(GUIDELINES, "04-component-inventory.md");
  const rootReadme = join(REPO, "README.md");
  for (const file of trackedDocs) {
    if (file === inventory || file === rootReadme) continue;
    lines(file).forEach((line, index) => {
      const match = stated.exec(line);
      if (match) warn(file, index + 1, `"${match[0]}" is a count that goes stale; say "see 04-component-inventory.md" instead`);
    });
  }
});

check("the README's headline matches the inventory and the code", () => {
  const file = join(REPO, "README.md");
  const match = /(\d+) of a planned (\d+) components/.exec(read(file));
  if (!match) return warn(file, 0, "the status sentence no longer has the form 'N of a planned M components'");
  const actual = [builtComponents().size, inventoryRows().size];
  const stated = match.slice(1, 3).map(Number);
  if (actual.some((value, index) => value !== stated[index])) {
    warn(file, 0, `the status sentence says ${stated.join("/")} but the code and inventory give ${actual.join("/")} (built / planned)`);
  }
});

check("the inventory matches its own summary and the component folders", () => {
  const file = join(GUIDELINES, "04-component-inventory.md");
  const rows = inventoryRows();
  const text = read(file);
  const priorities = { "🟢": 0, "🟡": 0, "⚪": 0 };
  for (const { priority } of rows.values()) priorities[[...priority][0]] += 1;
  const summary = [...text.matchAll(/\|\s*([🟢🟡⚪])[^|]*\|\s*(\d+)\s*\|/gu)];
  for (const [, mark, stated] of summary) {
    if (priorities[mark] !== Number(stated)) warn(file, 0, `the summary says ${stated} for ${mark} but the tables hold ${priorities[mark]}`);
  }
  const total = /\*\*Total planned\*\*\s*\|\s*\*\*(\d+)\*\*/.exec(text);
  if (total && Number(total[1]) !== rows.size) warn(file, 0, `the summary total is ${total[1]} but the tables hold ${rows.size} components`);
  const byTier = /By tier: (\d+) atoms, (\d+) molecules, (\d+) organisms/.exec(text);
  if (byTier) {
    const actual = ["Atom", "Molecule", "Organism"].map((tier) => [...rows.values()].filter((row) => row.tier === tier).length);
    if (actual.some((value, index) => value !== Number(byTier[index + 1]))) warn(file, 0, `"By tier" says ${byTier.slice(1, 4).join("/")} but the tables hold ${actual.join("/")}`);
  }
  for (const [name, tier] of builtComponents()) {
    const row = rows.get(name);
    if (!row) warn(file, 0, `${name} is built but has no row in the inventory`);
    else if (row.tier !== tier) warn(file, 0, `${name} is a ${row.tier.toLowerCase()} in the inventory but lives in ${tier.toLowerCase()}s/`);
  }
});

check("the status table covers every built component", () => {
  const file = join(GUIDELINES, "07-storybook-and-documentation-standards.md");
  const built = builtComponents();
  const listed = new Map();
  for (const [index, line] of lines(file).entries()) {
    if (!line.startsWith("|")) continue;
    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
    if (!["Atom", "Molecule", "Organism"].includes(cells[1])) continue;
    const name = cells[0].replace(/`/g, "");
    listed.set(name, cells[1]);
    if (!existsSync(join(GUIDELINES, "component-reviews", `${name}.md`))) warn(file, index + 1, `${name} has a status row but no component-reviews/${name}.md`);
  }
  for (const [name, tier] of built) {
    if (!listed.has(name)) warn(file, 0, `${name} is built but has no row in the status table (§6)`);
    else if (listed.get(name) !== tier) warn(file, 0, `${name} is a ${listed.get(name)} in the status table but lives in ${tier.toLowerCase()}s/`);
  }
  for (const name of listed.keys()) if (!built.has(name)) warn(file, 0, `${name} has a status row but no component folder`);
});

check("every template has a status row, a review file and a place in the inventory", () => {
  const file = join(GUIDELINES, "07-storybook-and-documentation-standards.md");
  // A folder whose name starts with an underscore holds what several templates share (a story kit), not a template.
  const folders = readdirSync(join(SRC, "templates")).filter((entry) => !entry.startsWith("_") && statSync(join(SRC, "templates", entry)).isDirectory());
  const listed = new Map();
  for (const [index, line] of lines(file).entries()) {
    if (!line.startsWith("|")) continue;
    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
    if (cells[1] !== "Template") continue;
    // A page's row is named with spaces ("Data Table List Page"); its folder and review file without them.
    listed.set(cells[0].replace(/[`\s]/g, ""), index + 1);
  }
  for (const folder of folders) {
    if (!listed.has(folder)) warn(file, 0, `the template ${folder} is built but has no row in the status table (§6)`);
    if (!existsSync(join(GUIDELINES, "component-reviews", `${folder}.md`))) warn(file, 0, `the template ${folder} has no component-reviews/${folder}.md`);
  }
  for (const [name, line] of listed) if (!folders.includes(name)) warn(file, line, `${name} has a status row but no templates/ folder`);
  // The inventory's Templates section names each built template: by its folder in backticks (a shell, `AppShell`) or in words (a page,
  // "Data Table List Page"), since a shell's row is named for what it is ("Dashboard shell") and a page's for itself.
  const inventory = join(GUIDELINES, "04-component-inventory.md");
  const text = read(inventory);
  // Only the section's table rows count, not the prose around them (the naming rule quotes a page's name).
  const section = text.slice(text.indexOf("## Templates"), text.indexOf("## Rough count summary")).split("\n").filter((line) => line.startsWith("|")).join("\n");
  for (const folder of folders) {
    const spaced = folder.replace(/([a-z])([A-Z])/g, "$1 $2");
    if (!section.includes(`\`${folder}\``) && !section.includes(spaced)) warn(inventory, 0, `the template ${folder} is built but the inventory's Templates section does not name it (as \`${folder}\` or "${spaced}")`);
  }
});

check("the commands' references resolve", () => {
  const dir = join(REPO, ".claude/commands");
  if (!existsSync(dir)) return;
  // Paths a command may name before they exist (created when a second template needs one).
  const optional = new Set(["src/templates/_shared/"]);
  const sections = new Map();
  for (const file of numberedDocs) {
    const found = new Set();
    for (const line of lines(file)) {
      const match = /^#{2,4}\s+(\d+(?:\.\d+)?)[.\s]/.exec(line);
      if (match) found.add(match[1]);
    }
    sections.set(basename(file).slice(0, 2), found);
  }
  const adrs = readdirSync(join(GUIDELINES, "adr")).map((name) => name.slice(0, 4));
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".md")).map((name) => join(dir, name))) {
    lines(file).forEach((line, index) => {
      // A backticked path (`guidelines/…`, `packages/…`, `.github/…`, `.claude/…`, `src/…` from the components package) exists.
      for (const [, path] of line.matchAll(/`((?:guidelines|packages|\.github|\.claude|src)\/[A-Za-z0-9_./-]+)`/g)) {
        if (optional.has(path)) continue;
        const resolved = path.startsWith("src/") ? join(SRC, "..", path) : join(REPO, path);
        if (!existsSync(resolved)) warn(file, index + 1, `names ${path}, which does not exist`);
      }
      // A numbered document named whole (`04-component-inventory.md`) exists.
      for (const [, name] of line.matchAll(/`(0\d-[a-z0-9-]+\.md)`/g)) {
        if (!existsSync(join(GUIDELINES, name))) warn(file, index + 1, `names ${name}, which does not exist`);
      }
      for (const [, number] of line.matchAll(/ADR-(\d{4})/g)) {
        if (!adrs.includes(number)) warn(file, index + 1, `cites ADR-${number}, which does not exist`);
      }
      // The short form `06` §9, `05` §1 and §8: the section exists in that document.
      for (const [, doc, run] of line.matchAll(/`(0\d)`\s*(§\s?\d+(?:\.\d+)?(?:\s*(?:,|and|&|–|-)\s*§?\s?\d+(?:\.\d+)?)*)/g)) {
        const known = sections.get(doc);
        if (!known) continue;
        for (const [section] of run.matchAll(/\d+(?:\.\d+)?/g)) {
          if (!known.has(section)) warn(file, index + 1, `cites ${doc} §${section}, which does not exist`);
        }
      }
    });
  }
});

check("the ADR index lists every record, in order", () => {
  const dir = join(GUIDELINES, "adr");
  const index = join(dir, "README.md");
  const records = readdirSync(dir).filter((name) => /^\d{4}-.*\.md$/.test(name)).sort();
  const indexText = read(index);
  records.forEach((name, position) => {
    if (Number(name.slice(0, 4)) !== position + 1) warn(join(dir, name), 0, `ADR numbering is not contiguous at ${name.slice(0, 4)}`);
    if (!indexText.includes(name)) warn(index, 0, `${name} is not listed in the index`);
  });
});

check("relative links resolve", () => {
  for (const file of trackedDocs) {
    lines(file).forEach((line, index) => {
      for (const [, target] of line.matchAll(/\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g)) {
        if (/^https?:/.test(target) || target.includes("NNNN")) continue;
        if (!existsSync(resolve(dirname(file), target))) warn(file, index + 1, `the link to ${target} does not resolve`);
      }
    });
  }
});

check("cited sections exist", () => {
  const headings = new Map();
  for (const file of numberedDocs) {
    const found = new Set();
    for (const line of lines(file)) {
      const match = /^#{2,4}\s+(\d+(?:\.\d+)?)[.\s]/.exec(line);
      if (match) found.add(match[1]);
    }
    headings.set(basename(file), found);
  }
  // A document name followed by one or more sections: `06-….md §9`, `06-….md` (§8 …, §9 …), `07-….md §4–§6`.
  const cites = /(\d\d-[a-z-]+\.md)[`'’s]*\s*\(?\s*(§\s?\d+(?:\.\d+)?(?:\s*(?:,|and|&|–|-)\s*§?\s?\d+(?:\.\d+)?)*)/g;
  const files = [
    ...walk(GUIDELINES, [".md"]),
    ...walk(join(REPO, "packages"), [".md", ".mdx", ".ts", ".tsx", ".mjs", ".css"]),
    ...walk(join(REPO, ".github"), [".yml"]),
    ...(existsSync(join(REPO, ".claude/commands")) ? walk(join(REPO, ".claude/commands"), [".md"]) : []),
    join(REPO, "CLAUDE.md"),
    join(REPO, "README.md"),
  ];
  for (const file of files) {
    lines(file).forEach((line, index) => {
      for (const [, doc, run] of line.matchAll(cites)) {
        const known = headings.get(doc);
        if (!known) continue;
        for (const [section] of run.matchAll(/\d+(?:\.\d+)?/g)) {
          if (!known.has(section)) warn(file, index + 1, `cites ${doc} §${section}, which does not exist`);
        }
      }
    });
  }
});

check("05 names every component that has no stylesheet", () => {
  const file = join(GUIDELINES, "05-component-api-conventions.md");
  const paragraph = lines(file).find((line) => line.startsWith("**A component with no visual output")) ?? "";
  for (const [name] of builtComponents()) {
    const folder = [join(SRC, "atoms", name), join(SRC, "molecules", name), join(SRC, "organisms", name)].find(existsSync);
    if (folder && !existsSync(join(folder, `${name}.module.css`)) && !paragraph.includes(`\`${name}\``)) {
      warn(file, 0, `${name} has no ${name}.module.css but 05 §1 does not list it among the components without one`);
    }
  }
});

console.log(`\ncheck-guidelines: ${checks.length} checks, ${warnings} ${warnings === 1 ? "warning" : "warnings"}`);
for (const { name, found } of checks) console.log(`  ${found === 0 ? "ok     " : `${found} found`.padEnd(7)} ${name}`);
// Warn-only by design: findings never change the exit code.
process.exit(0);
