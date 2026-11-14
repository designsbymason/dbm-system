#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { generateManifest } from "./generate";
import { manifestSchema, validateManifest } from "./validate";

const USAGE = "Usage: dbm-manifest --root <components package folder> --out <manifest.json> [--with-schema] [--quiet]\n\n--with-schema also writes manifest.schema.json beside the manifest. Exits 1 when the manifest breaks its schema or anything is undocumented or unplaced, and 0 when there is nothing to report.";

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
const errors = diagnostics.filter((entry) => entry.level === "error");
const warnings = diagnostics.filter((entry) => entry.level === "warning");
process.stdout.write(
  `dbm-manifest: ${manifest.components.length} components, ${manifest.utilities.length} functions and ${manifest.constants.length} constants written to ${out} (${errors.length} errors, ${warnings.length} warnings, ${problems.length} schema problems)\n`,
);
if (!process.argv.includes("--quiet")) {
  for (const entry of diagnostics) process.stdout.write(`  ${entry.level === "error" ? "error  " : "warning"} ${entry.subject}: ${entry.message}\n`);
}
for (const problem of problems) process.stdout.write(`  schema  ${problem}\n`);
// A missing description or example fails the same as a missing prop description: the manifest is the contract agents read.
if (diagnostics.length > 0 || problems.length > 0) process.exit(1);
