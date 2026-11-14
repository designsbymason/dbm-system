#!/usr/bin/env node
/**
 * Checks the CSS the tokens build ships (ADR-0175, ADR-0207), after `pnpm build`:
 *   1. every bundle (`<brand>-<mode>.bundled.css`) holds exactly the declarations of the primitives, the component tokens and its
 *      theme, in that order, so it cannot drift from the separate files it is made from;
 *   2. every bundle is self-contained: each `var(--dbm-…)` in it names a custom property the bundle defines;
 *   3. no token description is left: each file has its one generated-file header comment and no other;
 *   4. no value is empty or `[object Object]`, and the four themes define the same semantic tokens.
 * Exits non-zero on the first kind of problem it finds, listing them.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cssDir = join(dirname(fileURLToPath(import.meta.url)), "..", "build", "css");
const THEMES = ["purple-light", "purple-dark", "emerald-light", "emerald-dark"];
const read = (file) => readFileSync(join(cssDir, file), "utf8");

/** The `selector { name: value; … }` blocks of a file as `[selector, name, value]` rows, comments left out. */
function declarations(css) {
  const rows = [];
  for (const [, selector, block] of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const declaration of block.split(";")) {
      const text = declaration.trim();
      if (!text) continue;
      const colon = text.indexOf(":");
      rows.push([selector.trim().replace(/\s+/g, " "), text.slice(0, colon).trim(), text.slice(colon + 1).trim().replace(/\s+/g, " ")]);
    }
  }
  return rows;
}

const problems = [];
const fail = (file, message) => problems.push(`${file}: ${message}`);
const files = ["primitives.css", "component-tokens.css", ...THEMES.flatMap((theme) => [`${theme}.css`, `${theme}.bundled.css`])];

for (const file of files) {
  const css = read(file);
  const comments = css.match(/\/\*/g)?.length ?? 0;
  if (comments !== 1) fail(file, `has ${comments} comments; only the generated-file header may stay (token descriptions are dropped, ADR-0207)`);
  for (const [selector, name, value] of declarations(css)) {
    if (value === "" || value.includes("[object Object]")) fail(file, `${selector} { ${name}: "${value}" }`);
  }
}

for (const theme of THEMES) {
  const bundle = declarations(read(`${theme}.bundled.css`));
  const parts = [...declarations(read("primitives.css")), ...declarations(read("component-tokens.css")), ...declarations(read(`${theme}.css`))];
  if (JSON.stringify(bundle) !== JSON.stringify(parts)) fail(`${theme}.bundled.css`, "is not the primitives, the component tokens and the theme file, in that order");
  const defined = new Set(bundle.map(([, name]) => name));
  const missing = new Set();
  for (const [, , value] of bundle) for (const [, reference] of value.matchAll(/var\((--dbm-[a-z0-9-]+)/g)) if (!defined.has(reference)) missing.add(reference);
  if (missing.size > 0) fail(`${theme}.bundled.css`, `uses ${[...missing].slice(0, 5).join(", ")}${missing.size > 5 ? ` and ${missing.size - 5} more` : ""}, which it does not define`);
}

const names = (theme) => new Set(declarations(read(`${theme}.css`)).map(([, name]) => name));
const reference = names(THEMES[0]);
for (const theme of THEMES.slice(1)) {
  const own = names(theme);
  const lacking = [...reference].filter((name) => !own.has(name));
  const extra = [...own].filter((name) => !reference.has(name));
  if (lacking.length + extra.length > 0) fail(`${theme}.css`, `does not define the same semantic tokens as ${THEMES[0]} (lacks ${lacking.length}, adds ${extra.length})`);
}

if (problems.length > 0) {
  console.error(problems.map((problem) => `  FAIL  ${problem}`).join("\n"));
  console.error("\ncheck-css: failed");
  process.exit(1);
}
console.log(`check-css: ${files.length} files, ${THEMES.length} bundles self-contained and equal to their parts, no descriptions left`);
