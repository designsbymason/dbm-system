import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { faviconSvg } from "../generate-brand-assets.mjs";
import { buildIco } from "./image-info.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "..", "check-brand-assets.mjs");
const logo = readFileSync(join(here, "..", "..", "brand", "logo-round-brand.svg"), "utf8");
const roots = [];

function png(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}
const head = `<meta property="og:type" content="website"><meta property="og:title" content="T"><meta property="og:description" content="D"><meta property="og:url" content="https://dbm-system.com/">
<meta property="og:image" content="https://dbm-system.com/social.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="A">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="T"><meta name="twitter:description" content="D"><meta name="twitter:image" content="https://dbm-system.com/social.png"><meta name="twitter:image:alt" content="A">
<meta name="theme-color" content="#fff" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#000" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">`;

/** A small built site that passes the check; a test breaks it in one way. */
function site(change = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "brand-assets-"));
  roots.push(root);
  writeFileSync(join(root, "index.html"), `<!doctype html><html><head>${head}</head><body></body></html>`);
  writeFileSync(join(root, "404.html"), `<!doctype html><html><head>${head}</head><body></body></html>`);
  mkdirSync(join(root, "privacy"));
  writeFileSync(join(root, "privacy", "index.html"), `<!doctype html><html><head>${head}</head><body></body></html>`);
  writeFileSync(join(root, "social.png"), png(1200, 630));
  writeFileSync(join(root, "apple-touch-icon.png"), png(180, 180));
  writeFileSync(join(root, "icon-192.png"), png(192, 192));
  writeFileSync(join(root, "icon-512.png"), png(512, 512));
  writeFileSync(join(root, "favicon.ico"), buildIco([16, 32, 48].map((size) => ({ size, png: png(size, size) }))));
  writeFileSync(join(root, "favicon.svg"), faviconSvg(logo));
  writeFileSync(join(root, "site.webmanifest"), JSON.stringify({ name: "N", short_name: "N", start_url: "/", theme_color: "#000", background_color: "#fff", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }] }));
  change(root);
  return root;
}
const run = (root) => spawnSync(process.execPath, [script, root], { encoding: "utf8" });
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("check-brand-assets", () => {
  it("passes on a complete site", () => assert.equal(run(site()).status, 0));
  it("fails on a page without the share tags, or with a relative image address", () => {
    assert.match(run(site((root) => writeFileSync(join(root, "privacy", "index.html"), "<html><head></head></html>"))).stderr, /privacy\/index\.html: has no <meta property="og:image">/);
    assert.match(run(site((root) => writeFileSync(join(root, "index.html"), `<html><head>${head.replace("https://dbm-system.com/social.png", "/social.png")}</head></html>`))).stderr, /og:image is \/social\.png/);
  });
  it("fails on a file that is missing or not the size it is announced at", () => {
    assert.match(run(site((root) => rmSync(join(root, "social.png")))).stderr, /social\.png: is missing/);
    assert.match(run(site((root) => writeFileSync(join(root, "social.png"), png(1200, 600)))).stderr, /social\.png: is 1200 by 600, announced at 1200 by 630/);
    assert.match(run(site((root) => writeFileSync(join(root, "favicon.ico"), buildIco([{ size: 16, png: png(16, 16) }])))).stderr, /favicon\.ico: holds 16 px, not 16, 32 and 48/);
  });
  it("fails on a tab icon that is no longer the round logo", () => {
    assert.match(run(site((root) => writeFileSync(join(root, "favicon.svg"), "<svg></svg>"))).stderr, /favicon\.svg: differs from brand\/logo-round-brand\.svg/);
  });
  it("fails on a web manifest that names an icon that is not there or is the wrong size", () => {
    assert.match(run(site((root) => writeFileSync(join(root, "icon-192.png"), png(100, 100)))).stderr, /says \/icon-192\.png is 192x192, it is 100x100/);
    assert.match(run(site((root) => rmSync(join(root, "icon-512.png")))).stderr, /names \/icon-512\.png, which is not a PNG/);
  });
});
