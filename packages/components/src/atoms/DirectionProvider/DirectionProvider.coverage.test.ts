import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Every component that exposes a `dir` has to read the nearest DirectionProvider when it is given none, or a right-to-left app that wraps its
// root once silently gets a left-to-right part. This reads the source: any `*.types.ts` that declares a `dir` prop must sit beside a component
// file that calls `useDirection(` or `useProvidedDirection(`. A new component with a `dir` that forgets fails here, not in an app.
const SRC = join(dirname(fileURLToPath(import.meta.url)), "../..");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Types files whose `dir` is not a component's own, with the reason. Each must stay a short list. */
const NOT_A_COMPONENT_DIR = new Set<string>([
  // `DirectionProviderProps.dir` is the value being provided, not a prop that should read it.
  "atoms/DirectionProvider/DirectionProvider.types.ts",
]);

const files = walk(SRC).filter((file) => !file.includes("node_modules"));
const declaresDir = (source: string) => /^\s+dir\??:\s/m.test(source);

describe("every component with a dir prop reads the DirectionProvider", () => {
  const typesFiles = files
    .filter((file) => file.endsWith(".types.ts"))
    .filter((file) => declaresDir(readFileSync(file, "utf8")))
    .map((file) => file.slice(SRC.length + 1))
    .filter((file) => !NOT_A_COMPONENT_DIR.has(file));

  it("finds the components that take a dir", () => {
    // A floor, so an edit to the pattern above that matches nothing cannot pass by finding nothing.
    expect(typesFiles.length).toBeGreaterThan(30);
  });

  it.each(typesFiles)("%s: a component beside it calls useDirection or useProvidedDirection", (typesFile) => {
    const folder = join(SRC, dirname(typesFile));
    const readers = readdirSync(folder)
      .filter((name) => name.endsWith(".tsx") && !/\.(stories|test|checks\.stories|ssr\.test)\./.test(name) && !name.endsWith(".stories.tsx"))
      .map((name) => readFileSync(join(folder, name), "utf8"))
      .filter((source) => /\buse(Provided)?Direction\(/.test(source));
    expect(readers.length).toBeGreaterThan(0);
  });
});
