#!/usr/bin/env node
/**
 * Reports what the home page weighs: its HTML, the stylesheets it links, the JavaScript that loads with it, the JavaScript its
 * islands load later (as they come into view) and the fonts it preloads, each raw and gzipped (what GitHub Pages serves). It prints a
 * table to the build log and to the job summary, and warns, never fails, when a number passes a soft limit below, so a page that is
 * getting heavy shows in the log (guidelines/docs-site/01-plan.md §5, 02-structure.md §11).
 *
 *   node scripts/report-weight.mjs [root]
 *
 * `root` is the built site (default `dist`). The limits are about a quarter above the weight when they were set (2026-11-18); raise one
 * with a reason when the page grows on purpose.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/* eslint-disable no-console -- a CLI report */

/** Soft limits in KiB of gzipped weight. */
export const LIMITS = { html: 50, css: 95, "js (loads with the page)": 220, "js (loads later)": 70 };

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] ?? "dist");
const read = (url) => {
  const file = join(root, url.split("?")[0].replace(/^\//, ""));
  return existsSync(file) ? readFileSync(file) : undefined;
};

/** The JavaScript files a module loads at once: itself and everything it imports by a relative `import … from` or `import "…"`. */
function withImports(url, seen = new Set()) {
  if (seen.has(url)) return seen;
  const file = read(url);
  if (!file) return seen;
  seen.add(url);
  const source = file.toString("utf8");
  for (const match of source.matchAll(/(?:from|import)\s*"(\.{1,2}\/[^"]+\.js)"/g)) withImports(new URL(match[1], `http://x${url}`).pathname, seen);
  return seen;
}

const html = readFileSync(join(root, "index.html"));
const page = html.toString("utf8");
const hrefs = (pattern) => [...page.matchAll(pattern)].map((match) => match[1]);

const css = hrefs(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g);
const fonts = hrefs(/<link[^>]*rel="preload"[^>]*as="font"[^>]*href="([^"]+)"/g);
const early = new Set();
const later = new Set();
for (const href of [...hrefs(/<script[^>]*type="module"[^>]*src="([^"]+)"/g), ...hrefs(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)]) withImports(href, early);
for (const island of page.matchAll(/<astro-island\b[^>]*>/g)) {
  const tag = island[0];
  const urls = [/component-url="([^"]+)"/.exec(tag)?.[1], /renderer-url="([^"]+)"/.exec(tag)?.[1]].filter(Boolean);
  const when = /client="([^"]+)"/.exec(tag)?.[1] ?? "load";
  for (const url of urls) withImports(url, when === "load" || when === "only" ? early : later);
}
for (const url of early) later.delete(url);

const measure = (urls) => {
  const files = [...urls].map(read).filter(Boolean);
  return { files: files.length, raw: files.reduce((sum, file) => sum + file.length, 0), gzip: files.reduce((sum, file) => sum + gzipSync(file, { level: 9 }).length, 0) };
};
const rows = {
  html: { files: 1, raw: html.length, gzip: gzipSync(html, { level: 9 }).length },
  css: measure(css),
  "js (loads with the page)": measure(early),
  "js (loads later)": measure(later),
  "fonts (preloaded)": { ...measure(fonts), gzip: undefined },
};
const kib = (bytes) => (bytes / 1024).toFixed(1);
const lines = [
  "| What | Files | Raw KiB | Gzip KiB | Soft limit (gzip) |",
  "|---|---|---|---|---|",
  ...Object.entries(rows).map(([name, row]) => `| ${name} | ${row.files} | ${kib(row.raw)} | ${row.gzip === undefined ? "n/a (woff2)" : kib(row.gzip)} | ${LIMITS[name] ?? ""} |`),
];
console.log(`Home page weight (${root.split("/").slice(-2).join("/")}/index.html and what it links)\n${lines.join("\n")}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Home page weight\n\n${lines.join("\n")}\n`);
for (const [name, limit] of Object.entries(LIMITS)) {
  const gzip = rows[name].gzip / 1024;
  if (gzip > limit) console.log(`::warning title=Home page weight::${name} is ${gzip.toFixed(1)} KiB gzipped, over the soft limit of ${limit} KiB (apps/docs/scripts/report-weight.mjs)`);
}
