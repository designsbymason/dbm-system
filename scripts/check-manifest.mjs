#!/usr/bin/env node
/**
 * Checks the manifest the components package ships (ADR-0204, ADR-0205). It generates the manifest again from the source into a
 * temporary folder, which fails on a schema problem, anything undocumented or an export the manifest cannot place, and then compares
 * the result with every file the build shipped (`manifest.json`, its schema copy and the `manifest` folder of ADR-0206), so a shipped
 * file that is out of date, was edited by hand or has no source any more is caught; and `packages/components/AGENTS.md`
 * (ADR-0208) and `CLAUDE.md` must carry the generated list the manifest generates, and name nothing the manifest and the token CSS do not back. Nothing is written into the repository. Needs the packages built first (`@dbm-system/utils` is read from its
 * `dist`, and the generator runs from its own).
 *
 * Run from the repository root: `pnpm check-manifest`.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages", "manifest", "dist", "cli.js");
const shipped = join(root, "packages", "components", "dist");
if (!existsSync(cli) || !existsSync(join(root, "packages", "utils", "dist", "index.js")) || !existsSync(join(shipped, "manifest.json"))) {
  console.error("check-manifest: build the packages first (`pnpm build`).");
  process.exit(2);
}

const out = mkdtempSync(join(tmpdir(), "dbm-manifest-"));
try {
  // The committed AGENTS.md is copied, and the copy's generated list is rewritten from the fresh manifest, to compare the two below.
  const agentsFile = join(root, "packages", "components", "AGENTS.md");
  const agentsCopy = join(out, "AGENTS.md");
  copyFileSync(agentsFile, agentsCopy);
  const claudeFile = join(root, "CLAUDE.md");
  const claudeCopy = join(out, "CLAUDE.md");
  copyFileSync(claudeFile, claudeCopy);
  const result = spawnSync("node", [cli, "--root", join(root, "packages", "components"), "--out", join(out, "manifest.json"), "--with-schema", "--split", join(out, "manifest"), "--agents", agentsCopy, "--claude", claudeCopy], { stdio: "inherit" });
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
  if (readFileSync(agentsFile, "utf8") !== readFileSync(agentsCopy, "utf8")) {
    console.error("  FAIL  packages/components/AGENTS.md: its generated list is not what the manifest generates: run `pnpm sync-agents` and commit the result");
    failed = true;
  }
  if (readFileSync(claudeFile, "utf8") !== readFileSync(claudeCopy, "utf8")) {
    console.error("  FAIL  CLAUDE.md: its generated component index is not what the manifest generates: run `pnpm sync-agents` and commit the result");
    failed = true;
  }
  // What the hand-written text of AGENTS.md names must be in the manifest and the token CSS (ADR-0208).
  const { agentsProblems } = await import(pathToFileURL(join(root, "packages", "manifest", "dist", "index.js")).href);
  const tokenCss = readFileSync(join(root, "packages", "tokens", "build", "css", "purple-light.bundled.css"), "utf8");
  const tokenNames = new Set([...tokenCss.matchAll(/^\s*(--dbm-[a-z0-9-]+):/gm)].map((match) => match[1]));
  const freshManifest = JSON.parse(readFileSync(join(out, "manifest.json"), "utf8"));
  // Names the text may use that are not components: what the tokens and icons packages export, and everything the components package's
  // declaration file exports (its own `export { … }` list and the `export type { … } from` lines that re-export types from other packages).
  const exportsOf = async (name) => Object.keys(await import(pathToFileURL(join(root, "packages", name, "dist", "index.js")).href));
  const declarations = readFileSync(join(root, "packages", "components", "dist", "index.d.ts"), "utf8");
  const componentExports = [...declarations.matchAll(/^export (?:type )?\{([\s\S]*?)\}(?: from [^;]+)?;?$/gm)]
    .flatMap((match) => (match[1] ?? "").split(","))
    .map((entry) => entry.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop())
    .filter(Boolean);
  if (componentExports.length < 100) {
    console.error("  FAIL  could not read the exports of packages/components/dist/index.d.ts");
    failed = true;
  }
  const otherNames = new Set([...(await exportsOf("tokens")), ...(await exportsOf("icons")), ...componentExports]);
  for (const message of agentsProblems(readFileSync(agentsFile, "utf8"), freshManifest, tokenNames, otherNames)) {
    console.error(`  FAIL  packages/components/AGENTS.md: ${message}`);
    failed = true;
  }
  if (failed) process.exit(1);
  console.log(`check-manifest: the ${expected.length} shipped manifest files match the source`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
