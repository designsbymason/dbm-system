/**
 * Serves a built folder from a local port: for the scripts that open the built site and Storybook in Chromium (the agent files read the
 * Properties tables, the docs-pages and home-page checks drive the pages), and for `scripts/serve.mjs`, the local preview. Node's own
 * `http` module, no dependency.
 *
 * A request is answered only from inside the folder: its path is decoded, resolved against the folder and kept only if the result, with
 * symbolic links followed, is still under it. The server listens on the loopback address unless it is told otherwise.
 */
import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve } from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".xml": "application/xml", ".map": "application/json" };

/** Whether `path` is `folder` itself or something under it (a prefix match is not enough: `/a/site-old` is not under `/a/site`). */
function isInside(folder, path) {
  const between = relative(folder, path);
  return between === "" || (!between.startsWith("..") && !isAbsolute(between));
}

/**
 * The file a request path names, as a folder would serve it (as GitHub Pages does: a folder serves its `index.html`, and `/page` may be
 * `page.html`), or `undefined` when there is none or the path leads out of the folder.
 */
export function fileFor(folder, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  if (decoded.includes("\0")) return undefined;
  const base = resolve(folder);
  const realBase = realpathSync(base);
  const target = resolve(base, `.${decoded.startsWith("/") ? decoded : `/${decoded}`}`);
  if (!isInside(base, target)) return undefined;
  for (const candidate of [target, join(target, "index.html"), `${target}.html`]) {
    if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;
    if (isInside(realBase, realpathSync(candidate))) return candidate;
  }
  return undefined;
}

/**
 * @param {string} folder
 * @param {{ port?: number, host?: string, notFound?: string }} [options] `notFound` is a file in the folder to send, with the 404 status, for a path that names nothing.
 * @returns {Promise<{ origin: string, close: () => void }>}
 */
export async function serveFolder(folder, { port = 0, host = "127.0.0.1", notFound } = {}) {
  const server = createServer((request, response) => {
    const file = fileFor(folder, new URL(request.url, "http://localhost").pathname);
    if (!file) {
      const page = notFound ? fileFor(folder, `/${notFound}`) : undefined;
      response.writeHead(404, { "content-type": page ? "text/html" : "text/plain" });
      if (page) createReadStream(page).pipe(response);
      else response.end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(port, host, done));
  return { origin: `http://${host}:${server.address().port}`, close: () => server.close() };
}
