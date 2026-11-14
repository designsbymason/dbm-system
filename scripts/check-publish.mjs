#!/usr/bin/env node
/**
 * Checks that each public package would publish correctly, after `pnpm build`:
 *   1. the packed file list holds the README, the LICENSE, package.json and the build, and none of the
 *      source, tests, stories or private files;
 *   2. publint finds nothing wrong with `exports`, `main` and the files they point at;
 *   3. @arethetypeswrong/cli finds the types resolving for ESM, CommonJS and bundler consumers (JSON data exports are left out of this one);
 *   4. the package.json inside the tarball `pnpm pack` makes has no `workspace:` specifier left, depends on a sibling public package at
 *      exactly this package's version (the packages are one fixed group, ADR-0202), and depends on no private package.
 * Exits non-zero on any failure, so CI fails the build.
 *
 * Run from the repository root: `pnpm check-publish`.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["components", "tokens", "utils", "icons", "manifest"];

/** Files every tarball must hold, and path patterns none may. */
const REQUIRED = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts"];
/** Extra files a package must hold: the components package ships the manifest and its schema (ADR-0204). */
const REQUIRED_EXTRA = { components: ["dist/manifest.json", "dist/manifest.schema.json", "dist/manifest/index.json", "dist/manifest/utilities.json"] };
const FORBIDDEN = [/^src\//, /(^|\/)__tests__\//, /\.(test|spec|stories)\.[cm]?[jt]sx?$/, /^\.env/, /^\.local\//, /^tsconfig/, /^node_modules\//, /^storybook-static\//];

/** The sections of a package.json whose entries an installer reads. */
const DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
/** The workspace packages that are never published; a published package must not depend on one. */
const PRIVATE = ["@dbm-system/eslint-config", "@dbm-system/tsconfig"];

/**
 * What is wrong with the package.json that `pnpm pack` put in a tarball: a `workspace:` specifier it did not rewrite (a publish through
 * npm would leave one, and installs of it fail), a sibling public package at a version other than the package's own, or a dependency on
 * a private package.
 */
function packedManifestProblems(packed, version, publicNames) {
  const problems = [];
  for (const section of DEPENDENCY_SECTIONS) {
    for (const [dependency, range] of Object.entries(packed[section] ?? {})) {
      if (String(range).startsWith("workspace:")) problems.push(`${section}.${dependency} is still "${range}" in the tarball`);
      if (section === "devDependencies") continue;
      if (PRIVATE.includes(dependency)) problems.push(`${section}.${dependency} is a private package, which is never published`);
      if (publicNames.includes(dependency) && range !== version) problems.push(`${section}.${dependency} is "${range}", not exactly ${version}`);
    }
  }
  return problems;
}

let failed = false;
const fail = (pkg, message) => {
  failed = true;
  console.error(`  FAIL  ${pkg}: ${message}`);
};

for (const name of PACKAGES) {
  const dir = join(root, "packages", name);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  console.log(`\n${pkg.name}`);

  // 1. The packed file list.
  const packed = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: dir, encoding: "utf8" }));
  const files = packed[0].files.map((file) => file.path);
  for (const required of [...REQUIRED, ...(REQUIRED_EXTRA[name] ?? [])]) if (!files.includes(required)) fail(pkg.name, `the tarball is missing ${required}`);
  if (name === "components" && files.includes("dist/manifest.json")) {
    // The manifest says which release it describes, so a stale one is caught here.
    const shipped = JSON.parse(readFileSync(join(dir, "dist", "manifest.json"), "utf8"));
    if (shipped.version !== pkg.version) fail(pkg.name, `dist/manifest.json describes version ${shipped.version}, not ${pkg.version}`);
    // One file per component, and none for a component that is gone (ADR-0206).
    const expectedFiles = new Set(shipped.components.map((component) => `dist/manifest/components/${component.name}.json`));
    for (const file of expectedFiles) if (!files.includes(file)) fail(pkg.name, `the tarball is missing ${file}`);
    for (const file of files) if (file.startsWith("dist/manifest/components/") && !expectedFiles.has(file)) fail(pkg.name, `the tarball holds ${file}, which no component in the manifest has`);
  }
  for (const path of files) if (FORBIDDEN.some((pattern) => pattern.test(path))) fail(pkg.name, `the tarball holds ${path}`);
  console.log(`  ${files.length} files in the tarball`);

  // 4. The package.json inside the tarball pnpm makes (the one a publish through pnpm sends).
  const packFolder = mkdtempSync(join(tmpdir(), "dbm-pack-"));
  try {
    execFileSync("pnpm", ["pack", "--pack-destination", packFolder], { cwd: dir, stdio: "pipe" });
    const tarball = readdirSync(packFolder).find((file) => file.endsWith(".tgz"));
    if (!tarball) {
      fail(pkg.name, "pnpm pack made no tarball");
    } else {
      const packed = JSON.parse(execFileSync("tar", ["-xzOf", join(packFolder, tarball), "package/package.json"], { encoding: "utf8" }));
      const problems = packedManifestProblems(packed, pkg.version, PACKAGES.map((entry) => `@dbm-system/${entry}`));
      for (const problem of problems) fail(pkg.name, `the packed package.json: ${problem}`);
      if (problems.length === 0) console.log("  packed package.json ok");
    }
  } finally {
    rmSync(packFolder, { recursive: true, force: true });
  }

  // A JSON file exposed through `exports` (the schema, later the manifest) is data, not a module: it has no types or module format for
  // attw to resolve, so it is left out of that check. publint still checks that the file exists.
  const dataEntrypoints = Object.keys(pkg.exports ?? {}).filter((entry) => entry.endsWith(".json"));
  const attwArgs = ["exec", "attw", "--pack", ".", ...(dataEntrypoints.length ? ["--exclude-entrypoints", ...dataEntrypoints] : [])];

  // 2 and 3. publint, then are-the-types-wrong, each on the packed package.
  for (const [label, command, args] of [
    ["publint", "pnpm", ["exec", "publint", "--pack", "pnpm", "--strict"]],
    ["attw", "pnpm", attwArgs],
  ]) {
    const result = spawnSync(command, args, { cwd: dir, encoding: "utf8" });
    if (result.status !== 0) {
      fail(pkg.name, `${label} reported a problem`);
      console.error(`${result.stdout}${result.stderr}`);
    } else {
      console.log(`  ${label} ok`);
    }
  }
}

if (failed) {
  console.error("\ncheck-publish: failed");
  process.exit(1);
}
console.log("\ncheck-publish: all packages ok");
