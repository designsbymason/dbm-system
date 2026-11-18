#!/usr/bin/env node
/**
 * Serves a built folder (default `_artifact`, the site with Storybook in `storybook/`, as the Pages workflow assembles
 * it) on one origin, to try the Storybook bridge locally: the shared mode, the transitions and the links both ways.
 * It answers on the loopback address only, and only from inside the folder (`scripts/lib/static-server.mjs`).
 *
 *   node scripts/serve.mjs [root] [port]
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serveFolder } from "./lib/static-server.mjs";

/* eslint-disable no-console -- a local server's one line */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] ?? "_artifact");
const port = Number(process.argv[3] ?? 4322);

// As GitHub Pages does: the site's own 404 page, with a 404 status.
const { origin } = await serveFolder(root, { port, notFound: "404.html" });
console.log(`serving ${root} at ${origin.replace("127.0.0.1", "localhost")}/`);
