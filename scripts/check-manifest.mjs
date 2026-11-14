#!/usr/bin/env node
/**
 * Checks the manifest the components package ships (ADR-0204, ADR-0205). It generates the manifest again from the source into a
 * temporary folder, which fails on a schema problem, anything undocumented or an export the manifest cannot place, and then compares
 * the result with `packages/components/dist/manifest.json` and its schema copy, so a shipped file that is out of date or was edited
 * by hand is caught. Nothing is written into the repository. Needs the packages built first (`@dbm-system/utils` is read from its
 * `dist`, and the generator runs from its own).
 *
 * Run from the repository root: `pnpm check-manifest`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages", "manifest", "dist", "cli.js");
const shipped = join(root, "packages", "components", "dist");
if (!existsSync(cli) || !existsSync(join(root, "packages", "utils", "dist", "index.js")) || !existsSync(join(shipped, "manifest.json"))) {
  console.error("check-manifest: build the packages first (`pnpm build`).");
  process.exit(2);
}

const out = mkdtempSync(join(tmpdir(), "dbm-manifest-"));
try {
  const result = spawnSync("node", [cli, "--root", join(root, "packages", "components"), "--out", join(out, "manifest.json"), "--with-schema"], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
  let failed = false;
  for (const file of ["manifest.json", "manifest.schema.json"]) {
    if (readFileSync(join(out, file), "utf8") !== readFileSync(join(shipped, file), "utf8")) {
      console.error(`  FAIL  packages/components/dist/${file} is not what the source generates: run \`pnpm build\``);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log("check-manifest: the shipped manifest and schema match the source");
} finally {
  rmSync(out, { recursive: true, force: true });
}
