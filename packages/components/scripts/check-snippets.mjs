#!/usr/bin/env node
/**
 * Typechecks the hand-written "Show code" snippets of every template page as real code against the components
 * (`07-storybook-and-documentation-standards.md` §4.2), and proves the check bites by planting a bad prop.
 *
 * A snippet is JSX only: it holds no imports and no state, so each page keeps a `<Name>.snippetScope.txt` beside its
 * `<Name>.snippets.ts` with the imports and the `declare const` lines the snippets rely on. For each such page this writes a throwaway
 * `__snippetcheck.tsx` (the scope, then every snippet wrapped in a fragment), runs `tsc --noEmit`, and deletes the file. It then does
 * it again with a nonexistent prop planted in the first component of the first snippet, and fails if that is not reported (a check
 * that has never failed proves nothing). Run from the package: `pnpm check-snippets`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = join(PACKAGE, "src/templates");
const THROWAWAY = "__snippetcheck.tsx";
const PLANTED_PROP = "bogusPropPlantedByTheCheck";

/** Typechecks the package and returns the errors that name the throwaway file. */
function typecheck() {
  const run = spawnSync("pnpm", ["exec", "tsc", "--noEmit"], { cwd: PACKAGE, encoding: "utf8" });
  return `${run.stdout}${run.stderr}`.split("\n").filter((line) => line.includes(THROWAWAY) || line.includes(PLANTED_PROP));
}

/** The throwaway file: the page's scope, then each snippet as an exported fragment. */
function build(scope, snippets, plant) {
  let out = `${scope}\n`;
  Object.entries(snippets).forEach(([name, code], index) => {
    let body = String(code);
    if (plant && index === 0) body = body.replace(/<([A-Z][A-Za-z.]*)/, `<$1 ${PLANTED_PROP}={1}`);
    out += `export const snippet${index}_${name.replace(/\W/g, "_")} = (<>\n${body}\n</>);\n\n`;
  });
  return out;
}

const folders = readdirSync(TEMPLATES).filter((entry) => !entry.startsWith("_") && statSync(join(TEMPLATES, entry)).isDirectory());
let failed = false;
let checked = 0;

for (const folder of folders) {
  const dir = join(TEMPLATES, folder);
  const scopeFile = join(dir, `${folder}.snippetScope.txt`);
  const snippetsFile = join(dir, `${folder}.snippets.ts`);
  // A shell's snippets are checked by the package's own typecheck of its Docs page examples; only a page keeps a scope file.
  if (!existsSync(scopeFile) || !existsSync(snippetsFile)) continue;
  checked += 1;
  const module = await import(pathToFileURL(snippetsFile).href);
  const snippets = Object.values(module).find((value) => value && typeof value === "object" && Object.values(value).every((entry) => typeof entry === "string"));
  if (!snippets) {
    console.error(`${folder}: ${folder}.snippets.ts exports no object of snippet strings`);
    failed = true;
    continue;
  }
  const scope = readFileSync(scopeFile, "utf8");
  const target = join(dir, THROWAWAY);
  try {
    writeFileSync(target, build(scope, snippets, false));
    const errors = typecheck();
    if (errors.length > 0) {
      console.error(`${folder}: the snippets do not typecheck as real code:\n${errors.join("\n")}`);
      failed = true;
      continue;
    }
    writeFileSync(target, build(scope, snippets, true));
    if (!typecheck().some((line) => line.includes(PLANTED_PROP))) {
      console.error(`${folder}: the check did not report a planted bad prop, so it proves nothing`);
      failed = true;
      continue;
    }
    process.stdout.write(`${folder}: ${Object.keys(snippets).length} snippets typecheck as real code, and a planted bad prop is reported\n`);
  } finally {
    rmSync(target, { force: true });
  }
}

if (checked === 0) process.stdout.write("no template page has a snippetScope.txt: nothing to check\n");
process.exit(failed ? 1 : 0);
