#!/usr/bin/env node
/**
 * The package build's two file steps around `tsup` (ADR-0219):
 *
 * - `clean`, before it: empties `dist/`. The build runs two tsup configurations at once (the per-component ES modules
 *   and the single CommonJS file), so neither may clean the folder itself without racing the other.
 * - `prune`, after it: removes the stylesheet esbuild writes beside each per-component entry (`dist/atoms/Button.css`
 *   and so on). Nothing imports them: the package ships one stylesheet, `dist/index.css` (`./styles.css`, ADR-0175),
 *   which already holds every component's CSS, so the copies would only add weight to the published package.
 */
import { readdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a build step's one line of output */

const DIST = fileURLToPath(new URL("../dist", import.meta.url));
const KEEP = new Set(["index.css", "index.css.map"]);
const step = process.argv[2];

if (step === "clean") {
  rmSync(DIST, { recursive: true, force: true });
} else if (step === "prune") {
  let removed = 0;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if ((name.endsWith(".css") || name.endsWith(".css.map")) && !KEEP.has(relative(DIST, path))) {
        rmSync(path);
        removed += 1;
      }
    }
  };
  walk(DIST);
  console.log(`dist-files: removed ${removed} per-entry stylesheet files; dist/index.css is the package's stylesheet`);
} else {
  console.error('dist-files: pass "clean" or "prune"');
  process.exit(1);
}
