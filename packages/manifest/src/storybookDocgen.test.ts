import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtinImporters, builtinResolvers, parse } from "react-docgen";
import { beforeAll, describe, expect, it } from "vitest";
import { generateManifest } from "./generate";
import type { Manifest } from "./types";

// Storybook's Properties table is built by react-docgen (Babel), which drops some props the manifest keeps (ADR-0174). The manifest is
// the contract agents read, so it must never be the thinner of the two: every prop Storybook shows for a component is in the manifest.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components");

describe("the manifest against Storybook's own docgen", () => {
  let manifest: Manifest;
  beforeAll(() => {
    manifest = generateManifest({ packageRoot }).manifest;
  }, 180_000);

  it("lists every prop that react-docgen finds for a component, for every component it can read", () => {
    const parsed = new Map<string, ReturnType<typeof parse>>();
    const missing: string[] = [];
    let compared = 0;
    for (const component of manifest.components) {
      const file = join(packageRoot, component.source);
      if (!parsed.has(file)) {
        parsed.set(
          file,
          parse(readFileSync(file, "utf8"), {
            filename: file,
            importer: builtinImporters.fsImporter,
            resolver: new builtinResolvers.FindExportedDefinitionsResolver(),
            babelOptions: { filename: file },
          }),
        );
      }
      const doc = parsed.get(file)?.find((candidate) => candidate.displayName === component.name);
      if (!doc) continue;
      compared += 1;
      const listed = new Set(component.props.map((prop) => prop.name));
      for (const name of Object.keys(doc.props ?? {})) if (!listed.has(name)) missing.push(`${component.name}.${name}`);
    }
    // Most components are readable by react-docgen; if far fewer are, the comparison is not telling us anything.
    expect(compared).toBeGreaterThan(90);
    expect(missing).toEqual([]);
  }, 180_000);
});
