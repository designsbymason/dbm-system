#!/usr/bin/env node
/**
 * Installs the packed packages into a fresh app and checks that they work there (ADR-0175, ADR-0207), after `pnpm build`:
 *   1. packs the five public packages with pnpm, as a publish would;
 *   2. installs them into an empty app with npm, which is not this repository's workspace (so nothing resolves by accident);
 *   3. bundles a small entry with esbuild for production: React, a `Button`, `@dbm-system/components/styles.css` and the light and dark
 *      bundled token files, the way the consumer guide says;
 *   4. loads the page in Chromium and requires no errors, the component styles and the token CSS to have reached the bundle, and the
 *      button to be drawn from the theme's tokens, in light and again after `data-theme` changes to dark.
 * What it cannot show: esbuild keeps a CSS import even when the package says `sideEffects: false`, where webpack drops it, so that rule
 * is guarded statically by `check-publish`, not here.
 * Needs the packages built, a Chromium for Playwright and the network (`npm install` of React and the packages' dependencies). Nothing is
 * written into the repository. Exits non-zero on a failure.
 *
 * Run from the repository root: `pnpm check-fresh-app`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["components", "tokens", "utils", "icons", "manifest"];
const failures = [];
const fail = (message) => failures.push(message);

if (!existsSync(join(root, "packages", "components", "dist", "index.js"))) {
  console.error("check-fresh-app: build the packages first (`pnpm build`).");
  process.exit(2);
}
const { chromium } = createRequire(join(root, "packages", "components", "package.json"))("playwright");
const reactVersion = JSON.parse(readFileSync(join(root, "packages", "components", "package.json"), "utf8")).devDependencies.react.replace(/^[\^~]/, "");

const work = mkdtempSync(join(tmpdir(), "dbm-fresh-app-"));
try {
  // 1. Pack.
  const tarballs = join(work, "tarballs");
  mkdirSync(tarballs);
  for (const name of PACKAGES) execFileSync("pnpm", ["pack", "--pack-destination", tarballs], { cwd: join(root, "packages", name), stdio: "pipe" });
  const file = (name) => `file:${join(tarballs, readdirSync(tarballs).find((entry) => entry === `dbm-system-${name}-0.0.0.tgz` || entry.startsWith(`dbm-system-${name}-`)))}`;
  console.log(`  packed ${PACKAGES.length} packages`);

  // 2. An empty app. The tokens package is listed too, because the guide has the app import its CSS, and under a strict package manager
  // a package the app does not depend on is not importable.
  const app = join(work, "app");
  mkdirSync(app);
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({
      name: "fresh-app",
      private: true,
      type: "module",
      dependencies: {
        react: reactVersion,
        "react-dom": reactVersion,
        "@dbm-system/components": file("components"),
        "@dbm-system/tokens": file("tokens"),
        "@dbm-system/utils": file("utils"),
        "@dbm-system/icons": file("icons"),
      },
    }),
  );
  const install = () => execFileSync("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts"], { cwd: app, stdio: "pipe", encoding: "utf8" });
  try {
    install();
  } catch (first) {
    // The registry can hiccup; one more try before calling it a failure.
    try {
      install();
    } catch (second) {
      throw new Error(`npm install failed twice:\n${second.stderr ?? second.message}`);
    }
  }
  console.log("  installed into a fresh app");

  // 3. Bundle for production.
  writeFileSync(
    join(app, "entry.jsx"),
    `import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";
import "@dbm-system/tokens/css/purple-dark.bundled.css";
import { createRoot } from "react-dom/client";
import { Button } from "@dbm-system/components";

createRoot(document.getElementById("root")).render(<Button>Save</Button>);
`,
  );
  await build({
    entryPoints: [join(app, "entry.jsx")],
    absWorkingDir: app,
    bundle: true,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    outfile: join(app, "out", "app.js"),
    logLevel: "silent",
  });
  const css = existsSync(join(app, "out", "app.css")) ? readFileSync(join(app, "out", "app.css"), "utf8") : "";
  if (!css.includes("--dbm-bg-brand")) fail("the bundle has no token CSS (--dbm-bg-brand is not in it)");
  if (!/\.Button_root/.test(css)) fail("the bundle has no component CSS (the styles.css import did not reach it)");
  writeFileSync(
    join(app, "out", "index.html"),
    `<!doctype html><html data-theme="purple-light"><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>`,
  );
  console.log(`  bundled for production (${Math.round(css.length / 1024)} KB of CSS)`);

  // 4. Load it.
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    await page.goto(pathToFileURL(join(app, "out", "index.html")).href);
    await page.waitForSelector("button");
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
    const seen = await page.evaluate(() => {
      const root = document.documentElement;
      const colour = (token) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${token})`;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      const button = document.querySelector("button");
      const read = (theme) => {
        root.dataset.theme = theme;
        return { buttonBackground: getComputedStyle(button).backgroundColor, brand: colour("--dbm-bg-brand"), canvas: colour("--dbm-bg-canvas"), padding: getComputedStyle(button).paddingLeft };
      };
      return { light: read("purple-light"), dark: read("purple-dark") };
    });
    if (errors.length > 0) fail(`the page reported errors: ${errors.join("; ")}`);
    for (const theme of ["light", "dark"]) {
      const { buttonBackground, brand, padding } = seen[theme];
      if (!brand || brand === "rgba(0, 0, 0, 0)") fail(`${theme}: the theme's --dbm-bg-brand did not resolve to a colour`);
      if (buttonBackground !== brand) fail(`${theme}: the button is ${buttonBackground}, not the theme's brand colour ${brand}`);
      if (padding === "0px") fail(`${theme}: the button has no padding, so the component CSS did not apply`);
    }
    if (seen.light.canvas === seen.dark.canvas) fail(`changing data-theme did not change the page colours (canvas is ${seen.light.canvas} in both)`);
    console.log(`  page loaded: button ${seen.light.buttonBackground} in light, ${seen.dark.buttonBackground} in dark`);
  } finally {
    await browser.close();
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(failures.map((message) => `  FAIL  ${message}`).join("\n"));
  console.error("\ncheck-fresh-app: failed");
  process.exit(1);
}
console.log("check-fresh-app: the packed packages install into a fresh app and style a component from the theme's tokens");
