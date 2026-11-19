/**
 * Recomputes every answer in evaluation.xml straight from the files the packages ship, without the MCP server, and exits non-zero when
 * one differs. The answers describe the installed release, so run this when the packages change and before running the evaluation:
 * `pnpm build && node evaluation/verify.mjs`.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const read = (specifier) => JSON.parse(readFileSync(require.resolve(specifier), "utf8"));
const index = read("@dbm-system/components/manifest/index.json");
const tokens = read("@dbm-system/tokens/tokens.json").tokens;
const utilities = read("@dbm-system/components/manifest/utilities.json").utilities;
const entry = (row) => read(`@dbm-system/components/manifest/${row.file}`);
const components = index.components.map((row) => ({ ...row, entry: entry(row) }));
const guide = readFileSync(require.resolve("@dbm-system/components/package.json").replace("package.json", "AGENTS.md"), "utf8");

/** The one item with the smallest `by`, failing when two tie, so a tie shows up as a question that needs rewording. */
function only(items, by, pick) {
  const sorted = [...items].sort((a, b) => pick(a, b));
  assert.notEqual(by(sorted[0]), by(sorted[1]), "the answer is tied");
  return sorted[0];
}

const answers = [
  () => only(components.filter((c) => c.tier === "atom" && c.category === "Layout"), (c) => c.entry.props.length, (a, b) => a.entry.props.length - b.entry.props.length).name,
  () => String(components.filter((c) => c.tier === "molecule" && c.category === "Inputs" && c.entry.refElement === "HTMLInputElement").length),
  () => tokens.find((t) => t.name === "--dbm-bg-brand").aliases["purple-dark"],
  () => String(tokens.filter((t) => t.usedBy?.includes("Avatar")).length),
  () => {
    const helper = index.helpers.find((h) => h.name === "TooltipProvider");
    return components.find((c) => c.name === helper.helperOf).tier;
  },
  () => only(components, (c) => c.entry.parts.length, (a, b) => b.entry.parts.length - a.entry.parts.length).name,
  () => guide.match(/invalid state is `([A-Za-z]+)`/)[1],
  () => {
    const hits = utilities.filter((u) => u.kind === "hook" && /dismiss/i.test(u.name));
    assert.equal(hits.length, 1);
    return hits[0].name;
  },
  () => {
    const hits = components.filter((c) => /^A start time and an end time/.test(c.summary));
    assert.equal(hits.length, 1);
    return hits[0].name;
  },
  () => {
    const hits = components.find((c) => c.name === "Navbar").entry.parts.filter((p) => p.refElement === "HTMLButtonElement" && p.name !== "Navbar.MenuButton");
    assert.equal(hits.length, 1);
    return hits[0].name;
  },
];

const xml = readFileSync(new URL("./evaluation.xml", import.meta.url), "utf8");
const expected = [...xml.matchAll(/<answer>([^<]*)<\/answer>/g)].map((match) => match[1]);
assert.equal(expected.length, answers.length, "evaluation.xml and verify.mjs must have the same number of questions");
let failed = 0;
answers.forEach((compute, i) => {
  const actual = compute();
  const ok = actual === expected[i];
  if (!ok) failed += 1;
  console.error(`${ok ? "ok  " : "FAIL"} ${i + 1}: expected ${expected[i]}, computed ${actual}`);
});
process.exit(failed ? 1 : 0);
