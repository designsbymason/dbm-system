import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { buildLlmsFull } from "./index-files.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "..", "check-agent-files.mjs");
const packageDir = dirname(createRequire(import.meta.url).resolve("@dbm-system/components/package.json"));
const manifest = createRequire(import.meta.url).resolve("@dbm-system/components/manifest.json");
const pages = [
  { id: "getting-started-introduction--docs", title: "Getting started/Introduction" },
  { id: "atoms-inputs-button--docs", title: "Components/Button" },
];
const roots = [];

/** A small assembled site that passes the check, which a test then breaks in one way. */
function site(change = () => {}, after = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "agent-files-"));
  roots.push(root);
  mkdirSync(join(root, "storybook"));
  mkdirSync(join(root, "docs"));
  const entries = Object.fromEntries([...pages.map((page) => [page.id, { id: page.id, type: "docs", title: page.title, tags: ["dev"] }]), ["atoms-inputs-button--playground", { id: "atoms-inputs-button--playground", type: "story", title: "Components/Button", tags: ["dev"] }]]);
  writeFileSync(join(root, "storybook", "index.json"), JSON.stringify({ entries }));
  const copies = new Map(
    pages.map((page) => [page.id, `# ${page.title.split("/")[1]}\n\nText with a [link](https://dbm-system.com/docs/atoms-inputs-button.md).\n\nStorybook page: <https://dbm-system.com/storybook/?path=/docs/${page.id}>\n`]),
  );
  for (const page of pages) writeFileSync(join(root, "docs", `${page.id.replace(/--docs$/, "")}.md`), copies.get(page.id));
  const summary = "A library.";
  const lines = pages.map((page) => `- [${page.title.split("/")[1]}](https://dbm-system.com/docs/${page.id.replace(/--docs$/, "")}.md): note`);
  writeFileSync(
    join(root, "llms.txt"),
    `# DBM System\n\n> ${summary}\n\n## Start here\n\n- [AGENTS.md](https://dbm-system.com/AGENTS.md): a\n- [manifest.json](https://dbm-system.com/manifest.json): b\n- [llms-full.txt](https://dbm-system.com/llms-full.txt): c\n\n## Docs\n\n${lines.join("\n")}\n`,
  );
  copyFileSync(join(packageDir, "AGENTS.md"), join(root, "AGENTS.md"));
  copyFileSync(manifest, join(root, "manifest.json"));
  change(root);
  // llms-full.txt is built from the copies as they are on disk, so a test that changes a copy still has a matching one; `after` runs last.
  const present = pages.filter((page) => existsSync(join(root, "docs", `${page.id.replace(/--docs$/, "")}.md`)));
  const onDisk = new Map(present.map((page) => [page.id, readFileSync(join(root, "docs", `${page.id.replace(/--docs$/, "")}.md`), "utf8")]));
  writeFileSync(join(root, "llms-full.txt"), buildLlmsFull({ pages: present, copies: onDisk, summary }));
  after(root, copies);
  return root;
}
const run = (root) => spawnSync(process.execPath, [script, root], { encoding: "utf8" });
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("check-agent-files", () => {
  it("passes on a complete set", () => {
    const result = run(site());
    assert.equal(result.status, 0, result.stderr);
  });
  it("fails on a page with no copy and on a copy with no page", () => {
    assert.match(run(site((root) => rmSync(join(root, "docs", "atoms-inputs-button.md")))).stderr, /atoms-inputs-button--docs: has no Markdown copy/);
    assert.match(run(site((root) => writeFileSync(join(root, "docs", "old.md"), "# Old\n"))).stderr, /docs\/old\.md: is not the copy of a Docs page/);
  });
  it("fails on something the converter should have turned into text", () => {
    const bad = (text) => run(site((root) => writeFileSync(join(root, "docs", "atoms-inputs-button.md"), `# Button\n\n${text}\n\nStorybook page: <https://dbm-system.com/storybook/?path=/docs/atoms-inputs-button--docs>\n`)));
    assert.match(bad('import { Meta } from "x";').stderr, /an import or export line/);
    assert.match(bad("<Canvas of={X} />").stderr, /a JSX tag/);
    assert.match(bad("{/* note */}").stderr, /a comment/);
    assert.match(bad("| a | |\n| - | - |").stderr, /an empty table cell/);
    assert.equal(bad("```tsx\nimport { Button } from 'x';\n<Button />\n```").status, 0, "a code block may hold imports and tags");
  });
  it("fails on a link to a copy or a Storybook page that is not there", () => {
    const link = (url) => run(site((root) => writeFileSync(join(root, "docs", "atoms-inputs-button.md"), `# Button\n\n[x](${url})\n\nStorybook page: <https://dbm-system.com/storybook/?path=/docs/atoms-inputs-button--docs>\n`)));
    assert.match(link("https://dbm-system.com/docs/missing.md").stderr, /which is not a copy/);
    assert.match(link("https://dbm-system.com/storybook/?path=/story/nothing--here").stderr, /not in Storybook's index/);
  });
  it("fails on an llms.txt out of form or missing a page, and on a stale llms-full.txt", () => {
    assert.match(run(site((root) => writeFileSync(join(root, "llms.txt"), "Not a heading\n"))).stderr, /does not begin with an H1/);
    assert.match(
      run(site((root) => writeFileSync(join(root, "llms.txt"), readFileSync(join(root, "llms.txt"), "utf8").replace(/^- \[Button\].*\n/m, "")))).stderr,
      /does not list atoms-inputs-button--docs/,
    );
    assert.match(run(site(undefined, (root, copies) => writeFileSync(join(root, "docs", "atoms-inputs-button.md"), `${copies.get("atoms-inputs-button--docs")}\nMore.\n`))).stderr, /llms-full\.txt: is not every copy/);
  });
  it("fails on a manifest or AGENTS.md that is not the package's", () => {
    assert.match(run(site((root) => writeFileSync(join(root, "manifest.json"), "{}"))).stderr, /manifest\.json: differs/);
    assert.match(run(site((root) => writeFileSync(join(root, "AGENTS.md"), "# other\n"))).stderr, /AGENTS\.md: differs/);
  });
});
