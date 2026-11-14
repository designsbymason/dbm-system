#!/usr/bin/env node
/**
 * Checks that each public package would publish correctly, after `pnpm build`:
 *   1. the packed file list holds the README, the LICENSE, package.json and the build, and none of the
 *      source, tests, stories or private files;
 *   2. publint finds nothing wrong with `exports`, `main` and the files they point at;
 *   3. @arethetypeswrong/cli finds the types resolving for ESM, CommonJS and bundler consumers.
 * Exits non-zero on any failure, so CI fails the build.
 *
 * Run from the repository root: `pnpm check-publish`.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["components", "tokens", "utils", "icons", "manifest"];

/** Files every tarball must hold, and path patterns none may. */
const REQUIRED = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts"];
const FORBIDDEN = [/^src\//, /(^|\/)__tests__\//, /\.(test|spec|stories)\.[cm]?[jt]sx?$/, /^\.env/, /^\.local\//, /^tsconfig/, /^node_modules\//, /^storybook-static\//];

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
  for (const required of REQUIRED) if (!files.includes(required)) fail(pkg.name, `the tarball is missing ${required}`);
  for (const path of files) if (FORBIDDEN.some((pattern) => pattern.test(path))) fail(pkg.name, `the tarball holds ${path}`);
  console.log(`  ${files.length} files in the tarball`);

  // 2 and 3. publint, then are-the-types-wrong, each on the packed package.
  for (const [label, command, args] of [
    ["publint", "pnpm", ["exec", "publint", "--pack", "pnpm", "--strict"]],
    ["attw", "pnpm", ["exec", "attw", "--pack", "."]],
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
