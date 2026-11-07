import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The Docs page's Playground panel (`.storybook/blocks/PlaygroundControls.tsx`) draws its own controls and handles only these control types;
// any other falls through to a plain text field, which is how a `dir` control declared `inline-radio` showed up as a text box. Storybook's own
// Controls panel accepts more types, so a story can pass every other check and still read wrong on its Docs page.
const HANDLED = new Set(["boolean", "number", "select", "radio", "inline-radio", "text", "object"]);
const SRC = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe("story control types", () => {
  const stories = walk(SRC).filter((file) => file.endsWith(".stories.tsx"));

  it("finds the stories", () => {
    expect(stories.length).toBeGreaterThan(100);
  });

  it("only declares control types the Docs Playground panel draws", () => {
    const unhandled: string[] = [];
    for (const file of stories) {
      for (const match of readFileSync(file, "utf8").matchAll(/(?:^|[{,]\s*|\n\s+)control:\s*"([a-z-]+)"/g)) {
        if (!HANDLED.has(match[1]!)) unhandled.push(`${file.slice(SRC.length + 1)}: ${match[1]}`);
      }
    }
    expect(unhandled).toEqual([]);
  });
});
