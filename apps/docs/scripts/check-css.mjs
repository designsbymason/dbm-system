#!/usr/bin/env node
/**
 * The CSS check: the built stylesheets keep `animation-timeline` out of the `animation` shorthand. Lightning CSS, Vite's default
 * minifier, folds `animation: x linear both; animation-timeline: scroll(root)` into `animation: linear both x scroll(root)`, which current
 * Chrome rejects as a whole, so every scroll-driven animation vanished in the build while the unminified development server worked
 * (the theme section's compositions stayed at opacity 0). The build minifies with esbuild instead (astro.config.mjs); this fails the
 * build if a stylesheet ever has the folded form again.
 *
 *   node scripts/check-css.mjs [root]
 *
 * `root` is the built site (default `dist`); every `.css` file under it is read, Storybook's too when it is beside the site.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a CLI check's report */

/** A timeline (`scroll(…)`, `view(…)` or a dashed name such as `--themes`) written inside an `animation:` shorthand, outside `var()`. */
export const FOLDED = /animation:(?:[^;}()]|\((?:[^()]|\([^()]*\))*\))*?(?:\s|^)(?:scroll|view)\(|animation:(?:[^;}()]|\((?:[^()]|\([^()]*\))*\))*\s--[a-z][\w-]*\s*(?:[;}]|$)/;

export function foldedTimelines(css) {
  return [...css.matchAll(new RegExp(FOLDED.source, "g"))].map((match) => match[0].slice(0, 90));
}

function* cssFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* cssFiles(path);
    else if (entry.name.endsWith(".css")) yield path;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] ?? "dist");
  const problems = [];
  let files = 0;
  for (const file of cssFiles(root)) {
    files++;
    for (const found of foldedTimelines(readFileSync(file, "utf8"))) problems.push(`${file.slice(root.length + 1)}: ${found}`);
  }
  if (files === 0) {
    console.error(`check-css: no .css files under ${root}; build the site first`);
    process.exit(1);
  }
  if (problems.length > 0) {
    console.error(`check-css: ${problems.length} animation shorthand(s) with a timeline folded in\n${problems.map((line) => `  ${line}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`check-css: ${files} stylesheets, no timeline folded into an animation shorthand`);
}
