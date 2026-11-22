import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isChangeset, isReleaseCommit, problems, shipsToConsumers } from "./check-changeset.mjs";

const commit = (subject, ...files) => `\0${subject}\n${files.join("\n")}\n`;

describe("shipsToConsumers", () => {
  it("counts the source of a published package", () => {
    assert.ok(shipsToConsumers("packages/components/src/atoms/Button/Button.module.css"));
    assert.ok(shipsToConsumers("packages/tokens/src/semantic/color.json"));
    assert.ok(shipsToConsumers("packages/mcp/src/server.ts"));
  });
  it("does not count tests, stories, docs pages, snippets or the Storybook-only pages", () => {
    for (const path of [
      "packages/components/src/atoms/Button/Button.test.tsx",
      "packages/components/src/atoms/Button/Button.stories.tsx",
      "packages/components/src/atoms/Button/Button.checks.stories.tsx",
      "packages/components/src/atoms/Button/Button.mdx",
      "packages/components/src/atoms/Button/Button.snippets.ts",
      "packages/components/src/foundations/Colors.mdx",
      "packages/components/src/guides/GettingStarted.mdx",
    ])
      assert.equal(shipsToConsumers(path), false, path);
  });
  it("does not count other packages, docs or tooling", () => {
    for (const path of ["packages/manifest/src/index.ts", "apps/docs/src/page.astro", "guidelines/01-vision-and-goals.md", "scripts/figma-sync.mjs", "packages/components/e2e/visual.spec.ts"])
      assert.equal(shipsToConsumers(path), false, path);
  });
});

describe("isChangeset", () => {
  it("is a Markdown file in .changeset other than the README", () => {
    assert.ok(isChangeset(".changeset/button-secondary-same-height.md"));
    assert.equal(isChangeset(".changeset/README.md"), false);
    assert.equal(isChangeset(".changeset/config.json"), false);
  });
});

describe("isReleaseCommit", () => {
  it("matches the Changesets version commit", () => {
    assert.ok(isReleaseCommit("chore: version packages (#23)"));
    assert.equal(isReleaseCommit("fix(button): a thing"), false);
  });
});

describe("problems", () => {
  const src = "M\tpackages/components/src/atoms/Button/Button.module.css";
  const changeset = "A\t.changeset/x.md";
  it("flags a shipped change with no changeset", () => {
    assert.deepEqual(problems(commit("fix", src)), ["packages/components/src/atoms/Button/Button.module.css"]);
  });
  it("accepts the changeset in the same commit or a later one", () => {
    assert.deepEqual(problems(commit("fix", src, changeset)), []);
    assert.deepEqual(problems(commit("chore: a changeset", changeset) + commit("fix", src)), []);
  });
  it("ignores a range that changes nothing shipped", () => {
    assert.deepEqual(problems(commit("docs", "M\tguidelines/01-vision-and-goals.md", "M\tpackages/components/src/atoms/Button/Button.test.tsx")), []);
  });
  it("does not count a deleted changeset, and skips the release commit", () => {
    assert.equal(problems(commit("fix", src, "D\t.changeset/x.md")).length, 1);
    assert.deepEqual(problems(commit("chore: version packages (#1)", "M\tpackages/components/src/index.ts", "D\t.changeset/x.md")), []);
  });
});
