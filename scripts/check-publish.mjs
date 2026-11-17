#!/usr/bin/env node
/**
 * Checks that each public package (the four that are published; ADR-0209) would publish correctly, after `pnpm build`:
 *   1. the packed file list holds the README, the LICENSE, package.json and the build, and none of the
 *      source, tests, stories or private files;
 *   2. publint finds nothing wrong with `exports`, `main` and the files they point at;
 *   3. @arethetypeswrong/cli finds the types resolving for ESM, CommonJS and bundler consumers (JSON and CSS data exports are left out of this one);
 *   4. the package.json inside the tarball `pnpm pack` makes has no `workspace:` specifier left, depends on a sibling public package at
 *      exactly this package's version (the packages are one fixed group, ADR-0202), and depends on no private package.
 *   5. the components package's `dist/index.js` and `dist/index.cjs` start with `"use client"` and their source maps still line up (ADR-0227).
 * Exits non-zero on any failure, so CI fails the build.
 *
 * Run from the repository root: `pnpm check-publish`.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["components", "tokens", "utils", "icons"];

/** Files every tarball must hold, and path patterns none may. */
const REQUIRED = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts"];
/** Extra files a package must hold: the components package ships its stylesheet (ADR-0175), the manifest with its schema (ADR-0204) and AGENTS.md (ADR-0208), the tokens package its token index (ADR-0210). */
const REQUIRED_EXTRA = { tokens: ["build/tokens.json"], components: ["AGENTS.md", "dist/index.css", "dist/manifest.json", "dist/manifest.schema.json", "dist/manifest/index.json", "dist/manifest/utilities.json"] };
const FORBIDDEN = [/^src\//, /(^|\/)__tests__\//, /\.(test|spec|stories)\.[cm]?[jt]sx?$/, /^\.env/, /^\.local\//, /^tsconfig/, /^node_modules\//, /^storybook-static\//];

/** The sections of a package.json whose entries an installer reads. */
const DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
/** The workspace packages that are never published; a published package must not depend on one. */
const PRIVATE = ["@dbm-system/eslint-config", "@dbm-system/tsconfig", "@dbm-system/manifest"];

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

  // Tools and bundlers read `pkg/package.json`, which a package with an `exports` map must list or `require` throws
  // ERR_PACKAGE_PATH_NOT_EXPORTED.
  if (pkg.exports?.["./package.json"] !== "./package.json") fail(pkg.name, `exports does not list "./package.json"`);

  // A package that exposes CSS through `exports` must not say it has no side effects: a bundler is then free to drop `import "pkg/styles.css"`
  // from a production build, which leaves the app unstyled without an error (ADR-0207).
  const exposesCss = Object.values(pkg.exports ?? {}).some((target) => typeof target === "string" && target.endsWith(".css"));
  if (exposesCss && (pkg.sideEffects === false || (Array.isArray(pkg.sideEffects) && !pkg.sideEffects.some((entry) => entry.endsWith(".css"))))) {
    fail(pkg.name, `exports CSS but its sideEffects (${JSON.stringify(pkg.sideEffects)}) lets a bundler drop an import of it; list the CSS, or leave sideEffects out`);
  }

  // 1. The packed file list.
  const packed = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: dir, encoding: "utf8" }));
  const files = packed[0].files.map((file) => file.path);
  for (const required of [...REQUIRED, ...(REQUIRED_EXTRA[name] ?? [])]) if (!files.includes(required)) fail(pkg.name, `the tarball is missing ${required}`);
  if (name === "components" && files.includes("dist/manifest.json")) {
    // The manifest says which release it describes, so a stale one is caught here.
    const shipped = JSON.parse(readFileSync(join(dir, "dist", "manifest.json"), "utf8"));
    if (shipped.version !== pkg.version) fail(pkg.name, `dist/manifest.json describes version ${shipped.version}, not ${pkg.version}`);
    // One file per component and per helper, and none for one that is gone (ADR-0206).
    for (const [folder, entries, noun] of [["components", shipped.components, "component"], ["helpers", shipped.helpers, "helper"]]) {
      const expectedFiles = new Set(entries.map((entry) => `dist/manifest/${folder}/${entry.name}.json`));
      for (const file of expectedFiles) if (!files.includes(file)) fail(pkg.name, `the tarball is missing ${file}`);
      for (const file of files) if (file.startsWith(`dist/manifest/${folder}/`) && !expectedFiles.has(file)) fail(pkg.name, `the tarball holds ${file}, which no ${noun} in the manifest has`);
    }
  }
  for (const path of files) if (FORBIDDEN.some((pattern) => pattern.test(path))) fail(pkg.name, `the tarball holds ${path}`);
  console.log(`  ${files.length} files in the tarball`);

  // The components package's two public entries are client code in the App Router (ADR-0227): each starts with the directive, and its
  // source map has the one empty first line that the directive adds, so it still lines up with the file.
  if (name === "components") {
    for (const entry of ["dist/index.js", "dist/index.cjs"]) {
      const code = readFileSync(join(dir, entry), "utf8");
      if (!code.startsWith('"use client";\n')) fail(pkg.name, `${entry} does not start with "use client"`);
      const { mappings } = JSON.parse(readFileSync(join(dir, `${entry}.map`), "utf8"));
      if (mappings !== "" && (!mappings.startsWith(";") || mappings.split(";").length > code.split("\n").length)) {
        fail(pkg.name, `${entry}.map does not line up with the file after the "use client" line was added`);
      }
    }
    console.log('  "use client" entries ok');
  }

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

  // A JSON or CSS file exposed through `exports` (the schema, the stylesheet) is data, not a module: it has no types or module format for
  // attw to resolve, so it is left out of that check. publint still checks that the file exists.
  const dataEntrypoints = Object.keys(pkg.exports ?? {}).filter((entry) => entry.endsWith(".json") || entry.endsWith(".css"));
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

// 5. The consumer guide (ADR-0175): what it tells an app to import and set must exist.
const GUIDE_FILES = [...PACKAGES.map((name) => join("packages", name, "README.md")), join("packages", "components", "AGENTS.md"), ...["Installation", "QuickStart", "Frameworks", "Theming"].map((page) => join("packages", "components", "src", "guides", `${page}.mdx`))];

/** The file in `directory` that `exports` maps `subpath` (`./css/purple-light.bundled.css`) to, or `undefined` when it does not. */
function resolveExport(directory, exportsMap, subpath) {
  for (const [key, target] of Object.entries(exportsMap)) {
    if (typeof target !== "string") continue;
    if (key === subpath) return join(directory, target);
    const star = key.indexOf("*");
    if (star === -1) continue;
    const [prefix, suffix] = [key.slice(0, star), key.slice(star + 1)];
    if (subpath.startsWith(prefix) && subpath.endsWith(suffix) && subpath.length >= key.length - 1) return join(directory, target.split("*").join(subpath.slice(prefix.length, subpath.length - suffix.length)));
  }
  return undefined;
}

for (const guide of GUIDE_FILES) {
  const text = readFileSync(join(root, guide), "utf8");
  for (const [, pkgName, subpath] of text.matchAll(/import "@dbm-system\/([a-z]+)\/([^"]+)"/g)) {
    const directory = join(root, "packages", pkgName);
    const exportsMap = JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).exports ?? {};
    const target = resolveExport(directory, exportsMap, `./${subpath}`);
    if (!target) fail(guide, `imports "@dbm-system/${pkgName}/${subpath}", which the package's exports do not expose`);
    else if (!existsSync(target)) fail(guide, `imports "@dbm-system/${pkgName}/${subpath}", but ${target.replace(`${root}/`, "")} does not exist (run \`pnpm build\`?)`);
  }
  for (const [, theme] of text.matchAll(/data-theme="([a-z]+-(?:light|dark))"/g)) {
    if (!existsSync(join(root, "packages", "tokens", "build", "css", `${theme}.bundled.css`))) fail(guide, `shows data-theme="${theme}", which has no bundled token file`);
  }
}
// The install line: the same everywhere, naming components, and every package the file's text has an app import from, and neither utils nor
// the private tools (ADR-0209). A strict package manager only lets an app import a package it depends on.
const INSTALL = /^pnpm add (@dbm-system\/components[^\n]*)$/m;
const installLines = new Map();
for (const guide of GUIDE_FILES) {
  const text = readFileSync(join(root, guide), "utf8");
  const line = text.match(INSTALL)?.[1];
  if (!line) continue;
  installLines.set(guide, line);
  const installed = new Set([...line.matchAll(/@dbm-system\/([a-z-]+)/g)].map((match) => match[1]));
  const rest = text.replace(INSTALL, "");
  for (const name of ["tokens", "icons"]) if (!installed.has(name) && rest.includes(`@dbm-system/${name}`)) fail(guide, `names @dbm-system/${name} but its install line does not include it: ${line}`);
  for (const name of ["utils", "manifest", "eslint-config", "tsconfig"]) if (installed.has(name)) fail(guide, `its install line includes @dbm-system/${name}, which an app does not install: ${line}`);
}
if (new Set(installLines.values()).size > 1) fail("the consumer guide", `the install line differs between files: ${[...installLines].map(([guide, line]) => `${guide}: ${line}`).join("; ")}`);

// The consumer guide's font link must load the two families the tokens name, at every weight the tokens offer, and say
// the same in every guide file. (It used to be compared with Storybook's own link; Storybook self-hosts its fonts now,
// ADR-0215, while a consumer still chooses how to load them, ADR-0175.)
const FONT_LINK = /https:\/\/fonts\.googleapis\.com\/css2\?[^"\s]+/;
const typography = JSON.parse(readFileSync(join(root, "packages", "tokens", "src", "primitive", "typography.json"), "utf8"));
const families = ["primary", "secondary"].map((role) => typography["font-family"][role].$value[0]);
const weights = Object.values(typography["font-weight"]).map((token) => String(token.$value)).sort();
const fontLinks = new Map(GUIDE_FILES.map((guide) => [guide, readFileSync(join(root, guide), "utf8").match(FONT_LINK)?.[0]]).filter(([, link]) => link));
const guideFonts = fontLinks.get("packages/components/README.md");
if (!guideFonts) fail("packages/components/README.md", "has no Google Fonts link");
else {
  const asked = new Map([...new URL(guideFonts).searchParams.getAll("family")].map((spec) => {
    const [name, axes = ""] = spec.split(":");
    return [name.replaceAll("+", " "), (axes.split("@")[1] ?? "").split(";").filter(Boolean).sort()];
  }));
  for (const family of families) {
    const got = asked.get(family);
    if (!got) fail("packages/components/README.md", `its font link doesn't load ${family}, which the tokens name`);
    else if (got.join(";") !== weights.join(";")) fail("packages/components/README.md", `its font link loads ${family} at ${got.join(", ")}, but the tokens offer ${weights.join(", ")}`);
  }
}
if (new Set(fontLinks.values()).size > 1) fail("the consumer guide", `the font link differs between files: ${[...fontLinks].map(([guide, link]) => `${guide}: ${link}`).join("; ")}`);
if (!failed) console.log(`\nguide: ${GUIDE_FILES.length} files, every import and theme it shows resolves, and the font link loads ${families.join(" and ")} at ${weights.join(", ")}`);

if (failed) {
  console.error("\ncheck-publish: failed");
  process.exit(1);
}
console.log("\ncheck-publish: all packages ok");
