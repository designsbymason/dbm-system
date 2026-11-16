#!/usr/bin/env node
/**
 * The accessibility scan (guidelines/docs-site/02-structure.md §11): every page of the built site, in light and dark,
 * with motion and with reduced motion, run through axe-core in Chromium (Playwright) against WCAG 2.2 A and AA. Any
 * violation fails. The site is served from the build by Node's own `http` module, so there is no server dependency.
 *
 *   node scripts/check-accessibility.mjs [root]
 *
 * `root` is the folder to serve (default `dist`). Storybook's pages are left out: its own suite scans every story.
 */
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/* eslint-disable no-console -- a CLI check's report */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", process.argv[2] ?? "dist");
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png", ".txt": "text/plain" };

const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (relative(root, path) !== "storybook") walk(path);
    } else if (name.endsWith(".html")) {
      pages.push(`/${relative(root, path).replace(/index\.html$/, "").replace(/\.html$/, "")}`);
    }
  }
};
walk(root);

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname).replace(/\/$/, "");
  const file = [join(root, pathname), join(root, pathname, "index.html"), join(root, `${pathname}.html`)].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const failures = [];
let scans = 0;
try {
  for (const mode of ["light", "dark"]) {
    for (const reducedMotion of ["reduce", "no-preference"]) {
      const context = await browser.newContext({ reducedMotion, viewport: { width: 1280, height: 900 } });
      await context.addInitScript((value) => window.localStorage.setItem("dbm-mode", value), mode);
      const page = await context.newPage();
      for (const path of pages) {
        await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
        // Let the islands hydrate and the entrance settle before judging the page.
        await page.waitForTimeout(1200);
        await page.addScriptTag({ path: axePath });
        const result = await page.evaluate(async () =>
          window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }),
        );
        scans += 1;
        for (const violation of result.violations) {
          const where = violation.nodes.slice(0, 3).map((node) => node.target.join(" ")).join("; ");
          failures.push(`${path} (${mode}, motion ${reducedMotion}): ${violation.id}: ${violation.help} [${violation.nodes.length}× — ${where}]`);
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`check-accessibility: ${pages.length} pages × light and dark × motion and reduced motion = ${scans} scans`);
if (failures.length > 0) {
  console.error(`\n${failures.length} violations:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("check-accessibility: no WCAG 2.2 A or AA violations");
