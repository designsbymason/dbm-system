#!/usr/bin/env node
/**
 * The docs-pages check: every Docs page of the built Storybook renders. Nothing else opens them (the Storybook test run covers stories,
 * not MDX pages), so a block that throws, a missing asset or a page that never draws would show only to a reader. Each sidebar-visible
 * Docs page in `index.json` is opened in headless Chromium, a few at a time, and fails on:
 *
 * - a page that never draws its content, or that draws Storybook's error or "no preview" screen;
 * - a page with no heading (`h1`);
 * - an uncaught error or a `console.error` while it loads;
 * - a request to the Storybook's own origin that fails (a missing image, script or stylesheet).
 *
 *   node scripts/check-docs-pages.mjs [root] [--only <id>]
 *
 * `root` is the assembled artifact (Storybook in `root/storybook/`), default `_artifact`. `--only` checks one page by its Docs id.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serveFolder } from "./lib/static-server.mjs";

/* eslint-disable no-console -- a CLI check's report */

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", args.find((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--only") ?? "_artifact");
const storybookDir = join(root, "storybook");
if (!existsSync(join(storybookDir, "index.json"))) {
  console.error(`check-docs-pages: ${storybookDir}/index.json does not exist; assemble the site first`);
  process.exit(1);
}
const entries = Object.values(JSON.parse(readFileSync(join(storybookDir, "index.json"), "utf8")).entries);
const pages = entries.filter((entry) => entry.type === "docs" && entry.tags?.includes("dev") && (only === undefined || entry.id === only));
if (pages.length === 0) {
  console.error(`check-docs-pages: no Docs page${only ? ` with the id ${only}` : ""} in Storybook's index`);
  process.exit(1);
}

const { origin, close } = await serveFolder(storybookDir);
const browser = await chromium.launch();
const problems = [];
const queue = [...pages];
const started = Date.now();

async function check(page, entry) {
  const found = [];
  page.removeAllListeners();
  page.on("pageerror", (error) => found.push(`an uncaught error: ${error.message.split("\n")[0].slice(0, 160)}`));
  page.on("console", (message) => {
    if (message.type() === "error") found.push(`a console error: ${message.text().split("\n")[0].slice(0, 160)}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(origin)) found.push(`a failed request (${response.status()}): ${response.url().slice(origin.length)}`);
  });
  await page.goto(`${origin}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=docs`, { waitUntil: "load" });
  const drawn = await page
    .waitForSelector(".sbdocs-content", { timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  if (!drawn) found.push("never drew its content");
  else {
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const state = await page.evaluate(() => ({
      error: document.body.classList.contains("sb-show-errordisplay"),
      empty: document.body.classList.contains("sb-show-nopreview"),
      headings: document.querySelectorAll(".sbdocs-content h1").length,
    }));
    if (state.error) found.push("drew Storybook's error screen");
    if (state.empty) found.push("drew Storybook's no-preview screen");
    if (state.headings === 0) found.push("has no heading (h1)");
  }
  return [...new Set(found)];
}

try {
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      for (let entry = queue.shift(); entry; entry = queue.shift()) {
        for (const message of await check(page, entry)) problems.push(`${entry.id}: ${message}`);
      }
      await context.close();
    }),
  );
} finally {
  await browser.close();
  close();
}

if (problems.length > 0) {
  console.error(`check-docs-pages: ${problems.length} problem(s) on ${pages.length} page(s)\n${problems.sort().map((line) => `  ${line}`).join("\n")}`);
  process.exit(1);
}
console.log(`check-docs-pages: ${pages.length} Docs pages drew with a heading, no errors and no failed requests (${((Date.now() - started) / 1000).toFixed(0)} s)`);
