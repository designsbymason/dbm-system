#!/usr/bin/env node
/**
 * Checks the manifest the components package ships (ADR-0204, ADR-0205). It generates the manifest again from the source into a
 * temporary folder, which fails on a schema problem, anything undocumented or an export the manifest cannot place, and then compares
 * the result with every file the build shipped (`manifest.json`, its schema copy and the `manifest` folder of ADR-0206), so a shipped
 * file that is out of date, was edited by hand or has no source any more is caught. Nothing is written into the repository. Needs the packages built first (`@dbm-system/utils` is read from its
 * `dist`, and the generator runs from its own).
 *
 * Run from the repository root: `pnpm check-manifest`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
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
  const result = spawnSync("node", [cli, "--root", join(root, "packages", "components"), "--out", join(out, "manifest.json"), "--with-schema", "--split", join(out, "manifest")], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
  /** Every file under a folder, as paths relative to it. */
  const list = (folder, prefix = "") => readdirSync(join(folder, prefix), { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? list(folder, join(prefix, entry.name)) : [join(prefix, entry.name)]));
  const expected = ["manifest.json", "manifest.schema.json", ...list(join(out, "manifest")).map((file) => join("manifest", file))].sort();
  const present = ["manifest.json", "manifest.schema.json", ...(existsSync(join(shipped, "manifest")) ? list(join(shipped, "manifest")).map((file) => join("manifest", file)) : [])].sort();
  let failed = false;
  for (const file of expected.filter((name) => !present.includes(name))) {
    console.error(`  FAIL  packages/components/dist/${file} is missing: run \`pnpm build\``);
    failed = true;
  }
  for (const file of present.filter((name) => !expected.includes(name))) {
    console.error(`  FAIL  packages/components/dist/${file} is not something the source generates (a stale file?): run \`pnpm build\``);
    failed = true;
  }
  for (const file of expected.filter((name) => present.includes(name))) {
    if (readFileSync(join(out, file), "utf8") !== readFileSync(join(shipped, file), "utf8")) {
      console.error(`  FAIL  packages/components/dist/${file} is not what the source generates: run \`pnpm build\``);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log(`check-manifest: the ${expected.length} shipped manifest files match the source`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
