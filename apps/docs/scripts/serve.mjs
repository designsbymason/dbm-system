#!/usr/bin/env node
/**
 * Serves a built folder (default `_artifact`, the site with Storybook in `storybook/`, as the Pages workflow assembles
 * it) on one origin, to try the Storybook bridge locally: the shared mode, the transitions and the links both ways.
 *
 *   node scripts/serve.mjs [root] [port]
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a local server's one line */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] ?? "_artifact");
const port = Number(process.argv[3] ?? 4322);
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png", ".txt": "text/plain" };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const clean = pathname.replace(/\/$/, "");
  const file = [join(root, clean), join(root, clean, "index.html"), join(root, `${clean}.html`)].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}/`));
