#!/usr/bin/env node
/**
 * The brand-asset check: the icons and the share image the pages announce are there, the right size and still the logo. It fails on:
 *
 * - a page of the built site without the share tags (`og:title`, `og:description`, `og:url`, `og:image` and its size and description,
 *   `twitter:card` as `summary_large_image` with its image), the two `theme-color` tags, the icon links or the manifest link;
 * - a file those tags or the web manifest name that is not in the build, or is not the size it is announced at (`social.png` 1200 by 630,
 *   `apple-touch-icon.png` 180 px, `icon-192.png` and `icon-512.png`, `favicon.ico` at 16, 32 and 48 px);
 * - a `favicon.svg` that differs from the round logo in `brand/` (`scripts/generate-brand-assets.mjs` writes it).
 *
 *   node scripts/check-brand-assets.mjs [root]
 *
 * `root` is the built site (default `dist`). The PNGs and the ICO are rendered by Chromium and committed, so only their size is checked,
 * not their bytes: a render differs a little between machines.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { icoSizes, pngSize } from "./lib/image-info.mjs";
import { faviconSvg } from "./generate-brand-assets.mjs";

/* eslint-disable no-console -- a CLI check's report */

const docs = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(docs, process.argv[2] ?? "dist");
const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

/** The PNG sizes the pages and the manifest announce. */
const PNG_SIZES = { "social.png": [1200, 630], "apple-touch-icon.png": [180, 180], "icon-192.png": [192, 192], "icon-512.png": [512, 512] };

if (!existsSync(join(root, "index.html"))) {
  console.error(`check-brand-assets: ${root}/index.html does not exist; build the site first`);
  process.exit(1);
}

// 1. Every page of the site (Storybook's own pages are not the site's) announces the share image, the colours and the icons.
const pages = [join(root, "index.html"), ...readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== "storybook" && existsSync(join(root, entry.name, "index.html"))).map((entry) => join(root, entry.name, "index.html")), join(root, "404.html")].filter((file) => existsSync(file));
const meta = (head, attribute, name) => new RegExp(`<meta[^>]*${attribute}="${name}"[^>]*content="([^"]*)"|<meta[^>]*content="([^"]*)"[^>]*${attribute}="${name}"`).exec(head);
for (const file of pages) {
  const where = file.slice(root.length + 1);
  const head = readFileSync(file, "utf8").split("</head>")[0] ?? "";
  for (const property of ["og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt", "og:type"]) if (!meta(head, "property", property)) fail(where, `has no <meta property="${property}">`);
  for (const name of ["twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) if (!meta(head, "name", name)) fail(where, `has no <meta name="${name}">`);
  const card = meta(head, "name", "twitter:card");
  if (!card || (card[1] ?? card[2]) !== "summary_large_image") fail(where, 'does not have <meta name="twitter:card" content="summary_large_image">');
  if ((head.match(/<meta[^>]*name="theme-color"/g) ?? []).length !== 2) fail(where, "does not have two theme-color tags (light and dark)");
  for (const [tag, pattern] of [["the SVG icon", /rel="icon"[^>]*href="\/favicon\.svg"/], ["the ICO icon", /rel="icon"[^>]*href="\/favicon\.ico"/], ["the Apple touch icon", /rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/], ["the manifest", /rel="manifest"[^>]*href="\/site\.webmanifest"/]]) {
    if (!pattern.test(head)) fail(where, `does not link ${tag}`);
  }
  const image = (meta(head, "property", "og:image") ?? [])[1] ?? "";
  if (image && !/^https:\/\/dbm-system\.com\/social\.png$/.test(image)) fail(where, `og:image is ${image}, not the absolute https://dbm-system.com/social.png`);
}

// 2. The files are there at the sizes they are announced at.
for (const [name, [width, height]] of Object.entries(PNG_SIZES)) {
  const file = join(root, name);
  if (!existsSync(file)) fail(name, "is missing");
  else {
    const size = pngSize(readFileSync(file));
    if (!size) fail(name, "is not a PNG");
    else if (size.width !== width || size.height !== height) fail(name, `is ${size.width} by ${size.height}, announced at ${width} by ${height}`);
  }
}
if (!existsSync(join(root, "favicon.ico"))) fail("favicon.ico", "is missing");
else {
  const sizes = icoSizes(readFileSync(join(root, "favicon.ico")));
  if (!sizes) fail("favicon.ico", "is not an ICO");
  else if (sizes.map((s) => s.width).join() !== "16,32,48") fail("favicon.ico", `holds ${sizes.map((s) => s.width).join(", ")} px, not 16, 32 and 48`);
}

// 3. The tab icon is the round logo.
const logo = join(docs, "brand", "logo-round-brand.svg");
if (!existsSync(join(root, "favicon.svg"))) fail("favicon.svg", "is missing");
else if (!existsSync(logo)) fail("brand/logo-round-brand.svg", "is missing");
else if (readFileSync(join(root, "favicon.svg"), "utf8") !== faviconSvg(readFileSync(logo, "utf8"))) fail("favicon.svg", "differs from brand/logo-round-brand.svg; run `pnpm generate-brand-assets`");

// 4. The web manifest names icons that exist, at the sizes it says.
const manifestFile = join(root, "site.webmanifest");
if (!existsSync(manifestFile)) fail("site.webmanifest", "is missing");
else {
  try {
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    for (const key of ["name", "short_name", "start_url", "theme_color", "background_color"]) if (!manifest[key]) fail("site.webmanifest", `has no ${key}`);
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) fail("site.webmanifest", "lists no icons");
    for (const icon of manifest.icons ?? []) {
      const file = join(root, icon.src.replace(/^\//, ""));
      const size = existsSync(file) ? pngSize(readFileSync(file)) : undefined;
      if (!size) fail("site.webmanifest", `names ${icon.src}, which is not a PNG in the build`);
      else if (`${size.width}x${size.height}` !== icon.sizes) fail("site.webmanifest", `says ${icon.src} is ${icon.sizes}, it is ${size.width}x${size.height}`);
    }
  } catch (error) {
    fail("site.webmanifest", `is not valid JSON: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`check-brand-assets: ${failures.length} problem(s)\n${failures.map((line) => `  ${line}`).join("\n")}`);
  process.exit(1);
}
console.log(`check-brand-assets: ${pages.length} pages announce the share image, the theme colours and the icons; ${Object.keys(PNG_SIZES).length} PNGs, the ICO, favicon.svg and the web manifest are as announced`);
