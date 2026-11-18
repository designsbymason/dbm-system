/**
 * Reads the Properties tables of Storybook's Docs pages as they are rendered (ADR-0228): the page shows Storybook's own prepared
 * prop descriptions for a component, which the manifest does not match, so the table is taken from the page itself and cannot differ.
 * The built Storybook is served from a local port and each page is opened in headless Chromium, a few at a time.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png", ".ico": "image/x-icon", ".map": "application/json" };
/** A table drawn by `PropertiesTable` or `FieldsTable`: they share the class; `ReferenceTable` and `TokenReferenceTable` add their own. */
const SELECTOR = "table.dbm-proptable:not(.dbm-reftable):not(.dbm-tokentable)";

/** Runs in the page: each matching table as its header and its rows, every cell as Markdown-inline text. */
function readTables(selector) {
  const inline = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName;
    if (tag === "CODE") return `\`${node.textContent}\``;
    if (tag === "WBR") return "";
    if (tag === "BR") return " ";
    if (node.classList.contains("dbm-proptable-required")) return " (required)";
    if (node.classList.contains("dbm-proptable-options")) return [...node.children].map(inline).join(", ");
    return [...node.childNodes].map(inline).join("");
  };
  const clean = (value) => value.replace(/\s+/g, " ").trim();
  return [...document.querySelectorAll(selector)].map((table) => ({
    head: [...table.querySelectorAll("thead th")].map((th) => clean(th.textContent ?? "")),
    rows: [...table.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((td) => clean(inline(td)))),
  }));
}

/**
 * @param {string} storybookDir The built Storybook (it holds `iframe.html`).
 * @param {{ id: string, count: number }[]} jobs A Docs page and how many tables its MDX has (`PropertiesTable` and `FieldsTable` blocks).
 * @returns {Promise<Map<string, { head: string[], rows: string[][] }[]>>}
 */
export async function scrapeTables(storybookDir, jobs, { concurrency = 4, timeout = 60_000 } = {}) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = join(storybookDir, pathname === "/" ? "index.html" : pathname);
    if (!file.startsWith(storybookDir) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const results = new Map();
  const queue = [...jobs];
  try {
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await context.newPage();
        for (let job = queue.shift(); job; job = queue.shift()) {
          await page.goto(`${origin}/iframe.html?id=${encodeURIComponent(job.id)}&viewMode=docs`, { waitUntil: "load" });
          await page.waitForFunction(([selector, count]) => document.querySelectorAll(selector).length >= count, [SELECTOR, job.count], { timeout }).catch(() => {});
          const tables = await page.evaluate(readTables, SELECTOR);
          if (tables.length !== job.count) throw new Error(`${job.id}: the page draws ${tables.length} Properties table(s) and its MDX has ${job.count}`);
          results.set(job.id, tables);
        }
        await context.close();
      }),
    );
  } finally {
    await browser.close();
    server.close();
  }
  return results;
}
