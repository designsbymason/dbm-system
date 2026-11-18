#!/usr/bin/env node
/**
 * Writes the site's icons and share image into `public/` from the round logo (`brand/logo-round-brand.svg`), the token colours and the
 * components package's own manifest:
 *
 * - `favicon.svg`: the round logo as the tab icon (its clip wrapper dropped); `favicon.ico`: the same at 16, 32 and 48 px;
 * - `apple-touch-icon.png` (180 px) and `icon-192.png` and `icon-512.png`: the same letters on a full-bleed brand-purple square, because
 *   iOS and Android mask an icon's corners themselves and a circle on a transparent square gets black ones;
 * - `site.webmanifest`: the name, colours and those icons;
 * - `social.png` (1200 by 630): the share image, the tagline and the subline beside a card of the real Button manifest.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Needs the components package built (the Button manifest) and Chromium. The outputs are committed, so a build does not render them:
 * run this when the logo, the tagline, the subline or the tokens change, and `check-brand-assets` fails when a file is missing, the wrong
 * size or no longer matches the logo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { buildIco } from "./lib/image-info.mjs";

/* eslint-disable no-console -- a CLI's progress lines */

const docs = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(docs, "..", "..");
const require = createRequire(import.meta.url);
const tokens = require("@dbm-system/tokens");
const c = tokens.primitives.color;

export const TAGLINE = "Let your agent read the manual.";
export const SUBLINE = "An agentic, standalone React component library built for both AI coding agents and developers alike.";
const IMAGE_ALT = "DBM System: let your agent read the manual. A card of the Button component's manifest beside the tagline.";

/** The round logo without its `clipPath` wrapper (the circle already is the shape), as the tab icon. */
export function faviconSvg(source) {
  const unwrapped = source.replace(/<g clip-path="[^"]*">\s*/, "").replace(/\s*<\/g>\s*(?=<defs>)/, "\n").replace(/<defs>[\s\S]*?<\/defs>\s*/, "");
  if (/clip-path|clipPath/.test(unwrapped)) throw new Error("generate-brand-assets: the logo still has a clip path after unwrapping it");
  return unwrapped;
}

/** The logo's white letters on a full-bleed square of the logo's own purple, with the letters kept as large as in the round one. */
export function squareSvg(source) {
  const purple = /<circle[^>]*fill="(#[0-9a-fA-F]{6})"/.exec(source)?.[1];
  const letters = [...source.matchAll(/<path[^>]*fill="white"[^>]*\/>/g)].map((m) => m[0]);
  if (!purple || letters.length === 0) throw new Error("generate-brand-assets: the logo has no circle colour or no white letters to copy");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="${purple}"/>${letters.join("")}</svg>`;
}

const font = (family, weight, file, dir) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(join(docs, "node_modules", "@fontsource", dir, "files", file)).toString("base64")}) format('woff2')}`;

/** The 1200 by 630 share image as a page. */
function socialHtml() {
  const brand = tokens.primitives.color.purple[600];
  const paper = tokens.purpleLight.bg["neutral-subtle"];
  const ink = tokens.purpleLight.text.primary;
  const pencil = tokens.purpleLight.text.secondary;
  const wordmark = readFileSync(join(repo, "packages", "components", ".storybook", "brand", "dbm-system-wordmark.svg"), "utf8").replace(/<svg[^>]*>/, "").replace("</svg>", "").replace(/fill="[^"]*"/g, "");
  const manifest = JSON.parse(readFileSync(join(repo, "packages", "components", "dist", "manifest", "components", "Button.json"), "utf8"));
  const prop = (name) => manifest.props.find((entry) => entry.name === name);
  const variant = prop("variant").values;
  const tone = prop("tone").values;
  const list = (values, more) => `[${values.map((value) => `<i class="s">"${value}"</i>`).join(", ")}${more ? ", …" : ""}]`;
  return `<!doctype html><meta charset="utf-8"><style>${font("Nunito", 400, "nunito-latin-400-normal.woff2", "nunito")}${font("Lora", 600, "lora-latin-600-normal.woff2", "lora")}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Nunito,system-ui,sans-serif;background:${paper};position:relative}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.l{position:absolute;left:72px;top:72px;width:470px;bottom:72px}.tag{font:600 66px/1.07 Lora;color:${ink};margin-top:42px}
.sub{font:400 23px/1.42 Nunito;color:${pencil};margin-top:22px}.dom{position:absolute;left:0;bottom:0;font-size:22px;color:${ink}}
.code{position:absolute;left:590px;top:50%;transform:translateY(-50%);width:545px;border-radius:20px;background:${c.purple[950]};padding:30px 36px 34px;color:${c.purple[50]};box-shadow:0 24px 60px rgba(31,30,36,.28);font-size:19.5px;line-height:1.55}
.dots{display:flex;gap:9px;margin-bottom:16px}.dots span{width:13px;height:13px;border-radius:50%;background:${c.purple[900]};border:1px solid ${brand}}
i{font-style:normal}.k{color:${c.purple[300]}}.s{color:${c.emerald[400]}}.p{color:${c.gray[500]}}</style>
<div class="l"><svg viewBox="0 0 501 93" height="44" fill="${brand}">${wordmark}</svg><div class="tag">${TAGLINE}</div><div class="sub">${SUBLINE}</div><div class="dom mono">dbm-system.com</div></div>
<div class="code mono"><div class="dots"><span></span><span></span><span></span></div>
<div class="p">{</div><div>&nbsp;&nbsp;<i class="k">"name"</i>: <i class="s">"${manifest.name}"</i>,</div><div>&nbsp;&nbsp;<i class="k">"props"</i>: [</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;{ <i class="k">"name"</i>: <i class="s">"variant"</i>,</div><div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="k">"values"</i>: ${list([variant[0], variant[3]], true)},</div><div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="k">"default"</i>: <i class="s">"${variant[0]}"</i> },</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;{ <i class="k">"name"</i>: <i class="s">"tone"</i>,</div><div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="k">"values"</i>: ${list(tone, false)},</div><div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="k">"default"</i>: <i class="s">"${tone[0]}"</i> }</div><div>&nbsp;&nbsp;]</div><div class="p">}</div></div>`;
}

export const ICON_SIZES = { "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };
export { IMAGE_ALT };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readFileSync(join(docs, "brand", "logo-round-brand.svg"), "utf8");
  const favicon = faviconSvg(source);
  const square = squareSvg(source);
  writeFileSync(join(docs, "public", "favicon.svg"), favicon);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const render = async (svg, size, transparent) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="${size}" height="${size}">`);
    return page.screenshot({ type: "png", omitBackground: transparent });
  };
  writeFileSync(join(docs, "public", "favicon.ico"), buildIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await render(favicon, size, true) })))));
  for (const [name, size] of Object.entries(ICON_SIZES)) writeFileSync(join(docs, "public", name), await render(square, size, false));
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(socialHtml());
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(join(docs, "public", "social.png"), await page.screenshot({ type: "png" }));
  await browser.close();

  const manifest = {
    name: "DBM System",
    short_name: "DBM System",
    description: "An accessible, token-driven React component library built for AI coding agents and developers alike.",
    start_url: "/",
    display: "browser",
    background_color: tokens.purpleLight.bg["neutral-subtle"],
    theme_color: tokens.primitives.color.purple[600],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  writeFileSync(join(docs, "public", "site.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("generate-brand-assets: favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest and social.png written to public/");
}
