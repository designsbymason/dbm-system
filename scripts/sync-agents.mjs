#!/usr/bin/env node
/**
 * Rewrites the generated component list in `packages/components/AGENTS.md` from a fresh generation of the manifest (ADR-0208). Run it
 * after adding, renaming or removing a component or a hook, and commit the result; `pnpm check-manifest` fails while the committed list
 * is out of date. Needs the packages built first.
 *
 * Run from the repository root: `pnpm sync-agents`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages", "manifest", "dist", "cli.js");
if (!existsSync(cli) || !existsSync(join(root, "packages", "utils", "dist", "index.js"))) {
  console.error("sync-agents: build the packages first (`pnpm build`).");
  process.exit(2);
}

const out = mkdtempSync(join(tmpdir(), "dbm-agents-"));
try {
  const result = spawnSync("node", [cli, "--root", join(root, "packages", "components"), "--out", join(out, "manifest.json"), "--agents", join(root, "packages", "components", "AGENTS.md"), "--quiet"], { stdio: "inherit" });
  process.exit(result.status ?? 1);
} finally {
  rmSync(out, { recursive: true, force: true });
}
