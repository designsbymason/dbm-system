import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Getting started page marks a template that is a story-only example page (an app copies it; nothing is imported) with an asterisk,
// and it reads that from the `example-page` tag on the template's stories, not from where the template is grouped. This keeps the tag
// honest: a template with a main story that the package does not export must carry it, and one it does export must not. (The tests run
// from the package's own folder.)
const templates = join(process.cwd(), "src/templates");
const index = readFileSync(join(process.cwd(), "src/index.ts"), "utf8");

// A folder starting with an underscore holds what several templates share, not a template.
const folders = readdirSync(templates).filter((entry) => !entry.startsWith("_") && statSync(join(templates, entry)).isDirectory());

describe("template example pages", () => {
  it("finds the templates it is meant to cover", () => {
    expect(folders.length).toBeGreaterThan(1);
  });

  it.each(folders)("%s is tagged example-page exactly when the package does not export it", (folder) => {
    const stories = readdirSync(join(templates, folder)).filter((file) => file.endsWith(".stories.tsx") && !file.includes(".checks."));
    const main = stories
      .map((file) => readFileSync(join(templates, folder, file), "utf8"))
      .find((source) => /^\s*title:\s*"Templates\/[^/"]+\/[^/"]+"/m.test(source));
    expect(main, `${folder} has a main story titled Templates/{Group}/{Name}`).toBeDefined();
    const exported = index.includes(`./templates/${folder}"`);
    const tagged = /tags:\s*\[[^\]]*"example-page"/.test(main as string);
    expect(tagged, exported ? `${folder} ships from the package, so it is not an example page` : `${folder} is not exported, so its main story needs tags: ["example-page"]`).toBe(!exported);
  });
});
