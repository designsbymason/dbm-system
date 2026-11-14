#!/usr/bin/env node
/**
 * Checks that the lockfile resolves one version of each Radix package that holds shared state or
 * wraps the layer stack. Two copies of `dismissable-layer` mean two layer stacks (a popover opened
 * from a dialog stops being clickable with no error); two copies of `focus-scope` mean two focus
 * stacks, so a trap inside an overlay cannot pause the overlay's own. The rule and its history are in
 * guidelines/02-tech-stack-and-structure.md §3.2 (step 4) and ADR-0052.
 *
 * Reads `pnpm-lock.yaml` only, so it needs no install. Exits non-zero when a package resolves to more
 * than one version. Run from the repository root: `pnpm check-radix-single-copy`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lock = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");

/** The shared packages that must resolve to exactly one version. */
const SHARED = [
  "@radix-ui/primitive",
  "@radix-ui/react-primitive",
  "@radix-ui/react-dismissable-layer",
  "@radix-ui/react-focus-scope",
  "@radix-ui/react-portal",
  "@radix-ui/react-presence",
  "@radix-ui/react-popper",
  "@radix-ui/react-slot",
  "@radix-ui/react-visually-hidden",
];

// Resolved packages are the two-space-indented keys under `packages:`, e.g. `  '@radix-ui/react-portal@1.1.17':`.
const section = lock.slice(lock.indexOf("\npackages:\n"), lock.indexOf("\nsnapshots:\n"));
const versions = new Map(SHARED.map((name) => [name, new Set()]));
for (const [, name, version] of section.matchAll(/^ {2}'?(@radix-ui\/[a-z-]+)@(\d[^':(]*)'?:/gm)) {
  if (versions.has(name)) versions.get(name).add(version);
}

let failed = false;
for (const [name, found] of versions) {
  if (found.size === 0) continue; // not in the tree at all
  const list = [...found].sort().join(", ");
  if (found.size > 1) {
    failed = true;
    console.error(`  FAIL  ${name} resolves to ${found.size} versions: ${list}`);
  } else {
    console.log(`  ok    ${name} ${list}`);
  }
}

if (failed) {
  console.error("\ncheck-radix-single-copy: failed. See guidelines/02-tech-stack-and-structure.md §3.2 (step 4).");
  process.exit(1);
}
console.log("\ncheck-radix-single-copy: one version of each shared Radix package");
