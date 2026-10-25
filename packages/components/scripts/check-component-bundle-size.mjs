#!/usr/bin/env node
/**
 * Per-component bundle-size tripwire for the published `@dbm-system/
 * components` package — closes the "remains open" success metric in
 * `01-vision-and-goals.md` §11 ("bundle size per component"), previously
 * tracked nowhere. Same "cheap custom script over a new dependency"
 * approach as `check-storybook-bundle-size.mjs`: this reuses `tsup`
 * (already a real devDependency, the exact bundler the real package build
 * itself uses) rather than adding a bundle-analysis package.
 *
 * What "per-component size" means here: for every top-level export in
 * `src/index.ts` (one per component folder), build a single-entry ESM
 * bundle containing *only* that component — external `react`/`react-dom`
 * (consumers already have these), minified, no code-splitting between
 * entries (each output file is fully self-contained, matching what a
 * consumer who imports *just* this one component actually pays for, the
 * same metric tools like bundlephobia/size-limit report). Gzip size is
 * what's budgeted, since that's what actually crosses the wire.
 *
 * This does NOT run as part of `pnpm build` — it builds its own isolated,
 * throwaway bundles into `dist/.bundle-size-check/` (gitignored via the
 * existing `dist/` rule) and removes that directory when done, regardless
 * of pass/fail. Run standalone (`pnpm check-component-bundle-size`) or in
 * CI after the real `pnpm build` step, for the same narrative-ordering
 * reason `check-foundations-token-coverage` sits there.
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "tsup";

/* eslint-disable no-console -- this CLI script's whole job is printing a
   human-readable size report; console.log is the intended output here,
   not debug residue left behind by mistake. */

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_INDEX = join(PACKAGE_ROOT, "src/index.ts");
const OUT_DIR = join(PACKAGE_ROOT, "dist/.bundle-size-check");

// (Sizes are for a production build: see `define` below, and 06-engineering-standards.md.)
// Deliberately generous headroom over the real baseline measured
// 2026-08-16 (50 components; largest gzipped was Avatar at 1.88KB JS /
// 1.04KB CSS, median well under 1KB for both) — a tripwire for one
// component ballooning (an accidentally-bundled dependency, a lost
// tree-shake), not a tight limit tuned to today's exact numbers. Revisit
// the numbers themselves (not just raise them blindly) if a real,
// justified increase trips this.
const PER_COMPONENT_JS_BUDGET_KB = 10;
const PER_COMPONENT_CSS_BUDGET_KB = 5;

// A component whose bundle legitimately holds other components gets its own JS budget, with the reason beside it. Not a way
// to excuse growth: the default stands for every other component, and an override is sized to the measured number plus a
// little headroom, so it still trips if the component balloons.
//   TimeRangePicker (2026-10-03): composes two `TimePicker`s (8.0KB on their own, wheels included) and adds the shared
//   popover (`Popover`, `IconButton`, a second set of wheels), 10.58KB measured.
//   Calendar (2026-10-05): the one month grid the date pickers will be built on, so it holds what they would otherwise each
//   carry: the month, year and week grids, several months side by side, the month and year fields (it imports `Select`),
//   range and multiple-date choosing with drag, the footer, the markers, week numbers and the key. 9.01KB before the year
//   and month views and the week mode, 10.26KB measured with them (10.54KB after the final review). Sized at the user's direction
//   (2026-10-05) to about 12KB.
//   Toolbar (2026-10-12): `overflow="menu"` draws the items that don't fit as a `Menu` (the panel, the item kinds, the
//   scroll fades, and the tooltip and spinner an item can carry), 5.7KB before it and 11.12KB with it. A molecule
//   holding an organism is the cost of the feature (ADR-0068), paid by every bar whether or not it uses the mode.
//   DatePicker (2026-10-17): a field and a popover around `Calendar`, so its bundle holds the whole 10.55KB calendar (the
//   month, year and week grids, the footer, the markers) plus `Popover` (1.4KB) and its own segment entry, validation and
//   `commitOn` code, 14.37KB measured. The calendar is the larger part and is the reason a date field is a date field.
//   With its own anchored panel, presets, reasons, bounds relative to today and the month grid (ADR-0083, ADR-0084): 15.39KB, and 15.85KB with the announcement, `container` and the review fixes.
//   DataTable (2026-10-17): a table that draws with `Table` (2.38KB), `TableToolbar` (6.40KB), `Pagination` (5.10KB), `Select`,
//   `Checkbox` and the windowing hook, plus its own sort, selection, paging and announcement code, 17.08KB measured. The parts it
//   composes are most of it, and an app that wants a table with a toolbar and paging would pay for them either way (ADR-0085).
//   With the column menu (a `Menu` and a `Button`, 5KB and more), sorting by several columns, select all across pages and resizing
//   columns (ADR-0087, ADR-0088): 23.59KB measured. The menu is the largest part, and every table pays for it whether or not it uses one.
//   Sidebar (2026-10-19): the phone panel is a `Drawer` and a group in the rail opens a `Menu`, an item's text in the rail is a
//   `Tooltip`, and a group opens with `Collapse`, so its bundle holds those four and their stylesheets plus the `Badge`, `Icon` and
//   `IconButton` it draws with, 16.80KB measured (the same parts as `Navbar`'s 19.50KB, less its search sheet and rows).
//   Sidebar (2026-10-21): shared group and section state, `peek`, the account part, group counts, the skeleton (the `Skeleton` atom) and the
//   rail flyout's measured offset, 20.70KB measured; the budget is 22KB, the same as `Navbar`'s.
//   FileUpload (2026-10-24): draws with `Button`, `IconButton`, `FieldError`, `ProgressBar`, `Icon`, `Image` and `Text`, and holds the
//   drop, paste, folder-reading, duplicate, cancel and preview code of its own, 10.24KB measured against the default 10KB. The budget is 14KB.
//   DataTable (2026-10-24): a row's context menu (`rowContextMenu`) brings `ContextMenu` with it, which draws `Menu`'s item parts that the column
//   menu already carries: 26.42KB measured against the 26KB set before it. The budget is 32KB.
//   MultiSelect (2026-10-25): the option list it shares with `Combobox` (the panel, the rows, the matching and the windowing, about 6KB), the
//   chip row and chip keys of `TagsInput` (the `Tag`, its tooltip and the width measuring), the select-all, limit, create and controller code
//   of its own and the Popover layer, 12.45KB measured against the default 10KB. The budget is 14KB, the same as `FileUpload`'s.
const JS_BUDGET_OVERRIDES_KB = { Calendar: 12, DataTable: 32, DatePicker: 18, FileUpload: 14, MultiSelect: 14, Navbar: 22, Sidebar: 22, TimeRangePicker: 12, Toolbar: 13 };

// The same for CSS. `DataTable`'s bundle holds the stylesheets of the `Table`, `TableToolbar`, `Pagination`, `Select`,
// `Checkbox` and `Menu` parts it draws with (6.30KB measured against 3.45KB for `TableToolbar`, the largest of them), plus its own; 8.10KB
// with the resize handle, the pinned columns, the expand column and the detail row.
//
// `Navbar`'s bundle holds the `Drawer` its menu panel is and the `Menu` its groups open, with the `SearchInput` and the second `Drawer` of its search sheet (and the `IconButton`, `Container` and `Affix`
// it draws with, and the `Badge` of its links' badges): 17.48KB of JS and 8.35KB of CSS first measured, 19.60KB and 10.00KB with the link
// sizes, weights and cases, the columns, the frosted variant and the badge, the CSS being mostly the `Drawer`'s seven-breakpoint side classes. CSS budget 11KB.
//
// `Sidebar`'s bundle holds the `Drawer`'s seven-breakpoint side classes, as `Navbar`'s does, with the `Menu`, `Tooltip` and `Collapse` stylesheets
// and its own: 8.52KB measured. CSS budget 10KB.
//
// `Menu`'s stylesheet grew by about 0.4KB with the sheet presentation (2026-10-24), which every bundle that holds a `Menu` carries:
// `Sidebar`'s CSS went from 9.75KB to 10.12KB against its 10KB, so its budget is 11KB, and `Toolbar`'s overflow menu took its JS to 11.98KB
// against 12KB, so its budget is 13KB.
const CSS_BUDGET_OVERRIDES_KB = { DataTable: 10, Navbar: 11, Sidebar: 11 };

// Words only an opt-in extra's code contains, and the component whose bundle must not contain them: `CodeBlock`
// ships Python, Go and Java as separate exports an app registers (ADR-0027). If a change makes the component
// import one, its bundle grows for every app whatever language it uses, and this says so before the byte budget
// (which it could still fit inside) does.
const MUST_NOT_CONTAIN = {
  CodeBlock: {
    nonlocal: "the Python grammar",
    fallthrough: "the Go grammar",
    strictfp: "the Java grammar",
    // A name only the development-only opt-in list holds: it must be gone from a production build.
    pgsql: "the opt-in language name list (development only)",
  },
};

/**
 * Parses `export * from "./atoms/Badge";`-style lines out of src/index.ts. A third segment
 * (`"./molecules/CodeBlock/languages"`) names a file beside the component's own `index.ts`: an optional extra a
 * consumer opts into, measured on its own so the component's number doesn't include it.
 */
function listComponentEntries() {
  const source = readFileSync(SRC_INDEX, "utf8");
  const matches = [...source.matchAll(/^export \* from "\.\/(\w+)\/(\w+)(?:\/(\w+))?";$/gm)];
  if (matches.length === 0) {
    throw new Error(`No 'export * from "./tier/Name";' lines found in ${SRC_INDEX}.`);
  }
  return matches.map(([, tier, name, extra]) => ({
    name: extra ? `${name}/${extra}` : name,
    // One name could theoretically collide across tiers (none do today,
    // atoms/molecules/organisms are disjoint) — tsup's `entry` keys must
    // be unique regardless, so this fails loudly via a duplicate-key
    // build error rather than silently overwriting one component's output
    // with another's if that ever changes.
    entryPath: join(PACKAGE_ROOT, "src", tier, name, extra ? `${extra}.ts` : "index.ts"),
  }));
}

function toKb(bytes) {
  return bytes / 1024;
}

function formatKb(kb) {
  return `${kb.toFixed(2)}KB`;
}

async function buildAllEntries(components) {
  const entry = {};
  for (const { name, entryPath } of components) {
    if (!existsSync(entryPath)) {
      throw new Error(`${name}: expected entry file not found at ${entryPath}`);
    }
    entry[name] = entryPath;
  }

  await build({
    entry,
    format: ["esm"],
    outDir: OUT_DIR,
    dts: false,
    sourcemap: false,
    clean: true,
    minify: true,
    treeshake: true,
    splitting: false,
    external: ["react", "react-dom"],
    loader: { ".css": "local-css" },
    // Measured as an app's production build ships it: development-only code (warnings, the opt-in language
    // names behind them) is dropped there, and counting it would overstate what a consumer pays for.
    define: { "process.env.NODE_ENV": '"production"' },
    silent: true,
  });
}

function measure(components) {
  const results = [];
  for (const { name } of components) {
    const jsPath = join(OUT_DIR, `${name}.js`);
    const cssPath = join(OUT_DIR, `${name}.css`);
    if (!existsSync(jsPath)) {
      throw new Error(`${name}: expected build output not found at ${jsPath}`);
    }
    const jsRaw = readFileSync(jsPath);
    const jsGzipKb = toKb(gzipSync(jsRaw).byteLength);
    const cssGzipKb = existsSync(cssPath) ? toKb(gzipSync(readFileSync(cssPath)).byteLength) : 0;
    results.push({ name, jsGzipKb, cssGzipKb });
  }
  return results.sort((a, b) => b.jsGzipKb + b.cssGzipKb - (a.jsGzipKb + a.cssGzipKb));
}

async function main() {
  const components = listComponentEntries();
  console.log(`Building ${components.length} isolated per-component bundles...`);
  await buildAllEntries(components);

  const results = measure(components);

  console.log("\nPer-component gzipped size (JS + CSS), largest first:");
  for (const { name, jsGzipKb, cssGzipKb } of results) {
    console.log(
      `  ${name.padEnd(20)} JS ${formatKb(jsGzipKb).padStart(9)}   CSS ${formatKb(cssGzipKb).padStart(9)}`,
    );
  }

  const failures = [];
  for (const { name, jsGzipKb, cssGzipKb } of results) {
    const jsBudgetKb = JS_BUDGET_OVERRIDES_KB[name] ?? PER_COMPONENT_JS_BUDGET_KB;
    if (jsGzipKb > jsBudgetKb) {
      failures.push(`${name}: JS ${formatKb(jsGzipKb)} exceeds per-component budget ${formatKb(jsBudgetKb)}.`);
    }
    const cssBudgetKb = CSS_BUDGET_OVERRIDES_KB[name] ?? PER_COMPONENT_CSS_BUDGET_KB;
    if (cssGzipKb > cssBudgetKb) {
      failures.push(`${name}: CSS ${formatKb(cssGzipKb)} exceeds per-component budget ${formatKb(cssBudgetKb)}.`);
    }
  }

  for (const [name, markers] of Object.entries(MUST_NOT_CONTAIN)) {
    const js = readFileSync(join(OUT_DIR, `${name}.js`), "utf8");
    for (const [marker, what] of Object.entries(markers)) {
      if (js.includes(marker)) failures.push(`${name}: its bundle contains ${what}, which should not be in it.`);
    }
  }

  rmSync(OUT_DIR, { recursive: true, force: true });

  if (failures.length > 0) {
    console.error("\nComponent bundle size budget exceeded:");
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(
      "\nIf this growth is real and justified, raise the relevant budget in " +
        "scripts/check-component-bundle-size.mjs with a note explaining why — " +
        "don't just bump the number silently.",
    );
    process.exit(1);
  }

  console.log("\nAll components within budget.");
}

main().catch((error) => {
  rmSync(OUT_DIR, { recursive: true, force: true });
  console.error(error);
  process.exit(1);
});
