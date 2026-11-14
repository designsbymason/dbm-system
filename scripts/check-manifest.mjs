#!/usr/bin/env node
/**
 * Generates the component manifest from the components package into a temporary folder and fails when it breaks its schema or
 * anything is undocumented or unplaced (ADR-0205). Nothing is written into the repository. Needs the packages built first
 * (`@dbm-system/utils` is read from its `dist`, and the generator runs from its own).
 *
 * Run from the repository root: `pnpm check-manifest`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages", "manifest", "dist", "cli.js");
if (!existsSync(cli) || !existsSync(join(root, "packages", "utils", "dist", "index.js"))) {
  console.error("check-manifest: build the packages first (`pnpm build`).");
  process.exit(2);
}

const out = mkdtempSync(join(tmpdir(), "dbm-manifest-"));
try {
  const result = spawnSync("node", [cli, "--root", join(root, "packages", "components"), "--out", join(out, "manifest.json")], { stdio: "inherit" });
  process.exit(result.status ?? 1);
} finally {
  rmSync(out, { recursive: true, force: true });
}
