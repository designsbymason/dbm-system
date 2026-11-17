#!/usr/bin/env node
/**
 * The privacy check (guidelines/docs-site/02-structure.md §11): the Privacy Policy says what the site keeps in a visitor's browser, sets no
 * cookies and asks no other company for anything; this holds the site to that. Two parts:
 *
 *   1. Code. The files in the site and in Storybook's configuration that touch browser storage or cookies are exactly the ones listed in
 *      `src/data/remembered.json`. A new file that does, or a listed file that no longer does, fails, so the page is looked at.
 *   2. Behaviour. The built site is driven in Chromium (the home page's controls, the legal pages, Storybook's home and two Docs pages) and
 *      watched: every key it writes to local or session storage is a listed choice or one of Storybook's own, every listed choice was
 *      written, no cookie is set, and every request goes to the site's own origin.
 *
 *   node scripts/check-privacy.mjs [root]
 *
 * `root` is the assembled site with Storybook beside it (default `dist`, which has no Storybook: that part is then skipped and said so).
 */
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/* eslint-disable no-console -- a CLI check's report */

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const root = resolve(here, "..", process.argv[2] ?? "dist");
const declared = JSON.parse(readFileSync(join(here, "..", "src", "data", "remembered.json"), "utf8"));
const failures = [];

// ---------------------------------------------------------------- 1. Code
const STORAGE = /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/;
const SOURCE = new Set([".ts", ".tsx", ".js", ".mjs", ".astro", ".html"]);
const found = new Set();
const scan = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "generated") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) scan(path);
    else if (SOURCE.has(extname(name)) && STORAGE.test(readFileSync(path, "utf8"))) found.add(relative(repo, path));
  }
};
scan(join(repo, "apps", "docs", "src"));
scan(join(repo, "packages", "components", ".storybook"));
const listed = new Set(declared.storageFiles);
for (const file of found) {
  if (!listed.has(file)) failures.push(`${file} uses browser storage or cookies but is not in src/data/remembered.json: say what it keeps in the Privacy Policy, then list it`);
}
for (const file of listed) {
  if (!found.has(file)) failures.push(`${file} is listed in src/data/remembered.json but no longer uses browser storage: remove it (and any choice only it kept)`);
}

// ------------------------------------------------------------ 2. Behaviour
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml", ".map": "application/json" };
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

const hasStorybook = existsSync(join(root, "storybook", "index.json"));
const docsPages = hasStorybook
  ? Object.values(JSON.parse(readFileSync(join(root, "storybook", "index.json"), "utf8")).entries)
      .filter((entry) => entry.type === "docs")
      .slice(0, 2)
      .map((entry) => entry.id)
  : [];

const browser = await chromium.launch();
const keys = { local: new Set(), session: new Set() };
const origins = new Map();
const cookieHeaders = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("data:") || url.startsWith("blob:")) return;
    const key = new URL(url).origin;
    origins.set(key, (origins.get(key) ?? 0) + 1);
  });
  page.on("response", (response) => {
    if (response.headers()["set-cookie"]) cookieHeaders.push(response.url());
  });
  const read = async () => {
    for (const frame of page.frames()) {
      try {
        const now = await frame.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), cookie: document.cookie }));
        for (const key of now.local) keys.local.add(key);
        for (const key of now.session) keys.session.add(key);
        if (now.cookie) failures.push(`document.cookie is not empty on ${page.url()}: ${now.cookie}`);
      } catch {
        // A frame that is gone or not yet ready has nothing to read.
      }
    }
  };

  // The home page: its controls that remember something.
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.locator("#start").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  for (const name of ["npm", "yarn", "pnpm"]) {
    await page.getByRole("tab", { name, exact: true }).last().click();
  }
  const modeButton = page.getByRole("button", { name: /(light|dark) mode/i }).first();
  await modeButton.click();
  await modeButton.click();
  await read();
  // The other pages and Storybook: opened, and read.
  for (const path of ["/privacy", "/terms", "/accessibility", "/404"]) {
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    await read();
  }
  if (hasStorybook) {
    await page.goto(`${origin}/storybook/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await read();
    for (const id of docsPages) {
      await page.goto(`${origin}/storybook/?path=/docs/${id}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      await read();
    }
  }
  const jar = await context.cookies();
  if (jar.length > 0) failures.push(`the browser holds cookies after the visit: ${jar.map((cookie) => cookie.name).join(", ")}`);
  await context.close();
} finally {
  await browser.close();
  server.close();
}

const ownKey = (key) => declared.storybookOwnKeyPrefixes.some((prefix) => key.startsWith(prefix));
const choiceKeys = new Set(declared.choices.map((choice) => choice.key));
for (const [where, set] of Object.entries(keys)) {
  for (const key of set) {
    if (!choiceKeys.has(key) && !ownKey(key)) failures.push(`${where} storage holds "${key}", which the Privacy Policy does not list: add it to src/data/remembered.json, with what it keeps`);
  }
}
for (const key of choiceKeys) {
  if (!keys.local.has(key)) failures.push(`"${key}" is listed in src/data/remembered.json but the site never wrote it: remove it, or the page that sets it is not being exercised`);
}
if (cookieHeaders.length > 0) failures.push(`a response set a cookie: ${[...new Set(cookieHeaders)].join(", ")}`);
for (const [other, count] of origins) {
  if (other !== origin) failures.push(`${count} request(s) went to ${other}, which is not the site's own origin`);
}

// The policy page names every listed choice (it is built from the list, so this says the build used it).
const policy = readFileSync(join(root, "privacy", "index.html"), "utf8");
for (const key of choiceKeys) {
  if (!policy.includes(key)) failures.push(`the built Privacy Policy does not name "${key}"`);
}

const requests = [...origins.values()].reduce((total, count) => total + count, 0);
console.log(
  `check-privacy: ${found.size} files use browser storage (all listed); ${hasStorybook ? `Storybook and ${docsPages.length} Docs pages visited` : "Storybook not in this root, so skipped"}; ` +
    `keys written: ${[...keys.local, ...keys.session].sort().join(", ")}; ${requests} requests, all to the site's own origin`,
);
if (failures.length > 0) {
  console.error(`\n${failures.length} problems:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("check-privacy: the Privacy Policy matches what the site does");
