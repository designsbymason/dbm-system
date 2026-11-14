#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { generateManifest } from "./generate";

const USAGE = "Usage: dbm-manifest --root <components package folder> --out <manifest.json> [--quiet]";

function read(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const root = read("--root");
const out = read("--out");
if (!root || !out) {
  console.error(USAGE);
  process.exit(2);
}

const { manifest, diagnostics } = generateManifest({ packageRoot: root });
mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), `${JSON.stringify(manifest, null, 2)}\n`);

const errors = diagnostics.filter((entry) => entry.level === "error");
const warnings = diagnostics.filter((entry) => entry.level === "warning");
process.stdout.write(`dbm-manifest: ${manifest.components.length} components written to ${out} (${errors.length} errors, ${warnings.length} warnings)\n`);
if (!process.argv.includes("--quiet")) {
  for (const entry of diagnostics) process.stdout.write(`  ${entry.level === "error" ? "error  " : "warning"} ${entry.subject}: ${entry.message}\n`);
}
