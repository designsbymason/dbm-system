#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { generateManifest } from "./generate";
import { splitManifest } from "./split";
import { manifestSchema, validateManifest, validateManifestFile } from "./validate";
import type { ManifestFileKind } from "./validate";

const USAGE = "Usage: dbm-manifest --root <components package folder> --out <manifest.json> [--with-schema] [--split <folder>] [--quiet]\n\n--with-schema also writes manifest.schema.json beside the manifest; --split also writes the index, one file per component and utilities.json into the folder (ADR-0206). Exits 1 when the manifest breaks its schema or anything is undocumented or unplaced, and 0 when there is nothing to report.";

function read(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const root = read("--root");
const out = read("--out");
if (!root || !out) {
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

const { manifest, diagnostics } = generateManifest({ packageRoot: root });
mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), `${JSON.stringify(manifest, null, 2)}\n`);
if (process.argv.includes("--with-schema")) writeFileSync(join(dirname(resolve(out)), "manifest.schema.json"), `${JSON.stringify(manifestSchema, null, 2)}\n`);

const problems = validateManifest(manifest);

const splitFolder = read("--split");
let splitCount = 0;
if (splitFolder) {
  const folder = resolve(splitFolder);
  // Only what this writes is removed, so a stale component file never outlives its component.
  rmSync(join(folder, "components"), { recursive: true, force: true });
  rmSync(join(folder, "index.json"), { force: true });
  rmSync(join(folder, "utilities.json"), { force: true });
  for (const [file, content] of Object.entries(splitManifest(manifest))) {
    const target = join(folder, file);
    mkdirSync(dirname(target), { recursive: true });
    // Compact: these files are read by agents, and indentation costs them tokens.
    writeFileSync(target, `${JSON.stringify(content)}\n`);
    splitCount += 1;
    const kind: ManifestFileKind = file === "index.json" ? "index" : file === "utilities.json" ? "utilitiesFile" : "component";
    for (const problem of validateManifestFile(kind, content)) problems.push(`${file}: ${problem}`);
  }
}
const errors = diagnostics.filter((entry) => entry.level === "error");
const warnings = diagnostics.filter((entry) => entry.level === "warning");
process.stdout.write(
  `dbm-manifest: ${manifest.components.length} components, ${manifest.utilities.length} functions and ${manifest.constants.length} constants written to ${out} (${errors.length} errors, ${warnings.length} warnings, ${problems.length} schema problems)${splitFolder ? `; ${splitCount} split files in ${splitFolder}` : ""}\n`,
);
if (!process.argv.includes("--quiet")) {
  for (const entry of diagnostics) process.stdout.write(`  ${entry.level === "error" ? "error  " : "warning"} ${entry.subject}: ${entry.message}\n`);
}
for (const problem of problems) process.stdout.write(`  schema  ${problem}\n`);
// A missing description or example fails the same as a missing prop description: the manifest is the contract agents read.
if (diagnostics.length > 0 || problems.length > 0) process.exit(1);
