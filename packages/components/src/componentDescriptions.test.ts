import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentDescriptions } from "./componentDescriptions";

// The Getting started page's component table has a Description column read from `src/componentDescriptions.ts`.
// A component is whatever has a main story titled `{Atoms|Molecules|Organisms}/{Category}/{Name}`; each needs a
// line there, and a line for a component that no longer exists is removed. (The tests run from the package's own folder.)
const root = join(process.cwd(), "src");

function storiesFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return storiesFiles(path);
    return entry.endsWith(".stories.tsx") ? [path] : [];
  });
}

const components = new Set<string>();
for (const file of storiesFiles(root)) {
  const match = /^\s*title:\s*"(?:Atoms|Molecules|Organisms)\/[^/"]+\/([^/"]+)"/m.exec(readFileSync(file, "utf8"));
  if (match?.[1]) components.add(match[1]);
}

describe("component descriptions", () => {
  it("finds the components it is meant to cover", () => {
    expect(components.size).toBeGreaterThan(100);
  });

  it("has a line for every component", () => {
    const missing = [...components].filter((name) => !componentDescriptions[name]);
    expect(missing, "add a line to .storybook/componentDescriptions.ts").toEqual([]);
  });

  it("has no line for a component that does not exist", () => {
    const extra = Object.keys(componentDescriptions).filter((name) => !components.has(name));
    expect(extra, "remove the line from .storybook/componentDescriptions.ts").toEqual([]);
  });

  it("keeps every line short and ending in a full stop", () => {
    const bad = Object.entries(componentDescriptions).filter(([, line]) => line.length > 95 || !line.endsWith("."));
    expect(bad).toEqual([]);
  });
});
