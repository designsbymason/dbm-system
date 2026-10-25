#!/usr/bin/env node
/**
 * Bundle-size tripwire for the Storybook static build (`storybook build`
 * output, `storybook-static/`) — nothing tracked this before, so it could
 * grow indefinitely without anyone noticing until a hosted instance
 * (Phase 9) was already slow to load. Run after `build-storybook`, not as
 * part of it: this only inspects the already-built output on disk, it
 * doesn't build anything itself.
 *
 * Two separate checks, not one, because they catch different failure
 * modes and have different owners:
 *
 * 1. Total site size — catches overall bloat regardless of source
 *    (more stories, a heavier addon, an accidentally-duplicated
 *    dependency). Includes everything Storybook writes: its own
 *    `sb-manager`/`sb-addons` framework bundles as well as our
 *    Vite-bundled story/docs content.
 * 2. Largest single chunk under `assets/` (Vite's own output — our
 *    story/docs content specifically) — catches one pathological chunk
 *    (forgetting to code-split, an icon set bundled instead of
 *    tree-shaken) that a total-size budget alone could miss if the rest
 *    of the build stayed small. Deliberately scoped to `assets/` only:
 *    `sb-manager/`/`sb-addons/` are Storybook/addon-owned bundles we
 *    don't control the internals of (currently the single largest files
 *    in the whole build, ~4MB + ~2MB — real, but not ours to fix, and
 *    flagging them would just be unactionable noise on every run).
 *
 * Budgets below are deliberately generous headroom over the real
 * baseline measured 2026-08-12 (49 atoms + 3 molecules; 11.1MB total,
 * 1.05MB largest `assets/` chunk) — this is a tripwire for runaway
 * growth, not a tight limit tuned to today's exact numbers. Revisit the
 * numbers themselves (not just raise them blindly) if a real, justified
 * increase trips this.
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- this CLI script's whole job is printing a
   human-readable size report; console.log is the intended output here,
   not debug residue left behind by mistake. */

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const STATIC_DIR = join(PACKAGE_ROOT, "storybook-static");
const ASSETS_DIR = join(STATIC_DIR, "assets");

// The total grew with every component's stories, Docs page and checks: 11.1MB at the first measurement (2026-08-12), 20.1MB with
// `MultiSelect` (103 components built), which crossed the 20MB first set for it. Raised to 24MB to leave room for the components still to be built; revisit the
// figure itself if growth continues.
const TOTAL_BUDGET_KB = 24_000;
const CHUNK_BUDGET_KB = 1_536; // ~1.5MB — current largest `assets/` chunk ~1.05MB

/** Recursively lists every file under `dir` as absolute paths. */
function listFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function toKb(bytes) {
  return bytes / 1024;
}

function formatKb(kb) {
  return `${kb.toFixed(0)}KB`;
}

function main() {
  let staticFiles;
  try {
    staticFiles = listFiles(STATIC_DIR);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(
        `storybook-static/ not found at ${STATIC_DIR} — run "pnpm build-storybook" first.`,
      );
      process.exit(1);
    }
    throw error;
  }

  const totalBytes = staticFiles.reduce((sum, file) => sum + statSync(file).size, 0);
  const totalKb = toKb(totalBytes);

  const assetFiles = listFiles(ASSETS_DIR).filter((f) => f.endsWith(".js") || f.endsWith(".css"));
  const assetSizes = assetFiles
    .map((file) => ({ file, kb: toKb(statSync(file).size) }))
    .sort((a, b) => b.kb - a.kb);
  const largestChunk = assetSizes[0];

  console.log(`Storybook static build: ${formatKb(totalKb)} total (budget: ${formatKb(TOTAL_BUDGET_KB)})`);
  console.log(
    `Largest assets/ chunk: ${largestChunk ? `${formatKb(largestChunk.kb)} (${largestChunk.file.slice(STATIC_DIR.length + 1)})` : "none found"} (budget: ${formatKb(CHUNK_BUDGET_KB)})`,
  );

  const failures = [];
  if (totalKb > TOTAL_BUDGET_KB) {
    failures.push(
      `Total build size ${formatKb(totalKb)} exceeds budget ${formatKb(TOTAL_BUDGET_KB)}.`,
    );
  }
  if (largestChunk && largestChunk.kb > CHUNK_BUDGET_KB) {
    failures.push(
      `Largest assets/ chunk ${formatKb(largestChunk.kb)} (${largestChunk.file.slice(STATIC_DIR.length + 1)}) exceeds budget ${formatKb(CHUNK_BUDGET_KB)}.`,
    );
  }

  if (failures.length > 0) {
    console.error("\nBundle size budget exceeded:");
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(
      "\nIf this growth is real and justified, raise the relevant budget in " +
        "scripts/check-storybook-bundle-size.mjs with a note explaining why — " +
        "don't just bump the number silently.",
    );
    process.exit(1);
  }

  console.log("\nWithin budget.");
}

main();
