#!/usr/bin/env node
/**
 * Installs the packed packages into a fresh app and checks that they work there (ADR-0175, ADR-0207), after `pnpm build`:
 *   1. packs the four public packages with pnpm, as a publish would;
 *   2. installs them into an empty app with pnpm (the install line the guide gives, literally: components, tokens and icons; utils comes in only as a dependency), which is not this repository's workspace (so nothing resolves by accident), and finds
 *      AGENTS.md and the manifest files where an agent looks for them;
 *   3. bundles a small entry with esbuild for production: React, a `Button`, `@dbm-system/components/styles.css` and the light and dark
 *      bundled token files, the way the consumer guide says;
 *   4. builds the same entry with webpack in production mode and requires the component stylesheet's rules to be in the output. esbuild
 *      and Vite keep a CSS import even when the package says `sideEffects: false`; webpack drops it, which leaves an app unstyled with
 *      no error (Next.js builds on it), so only this build can show that the package's `sideEffects` still keeps the stylesheet;
 *   4b. builds a Next.js App Router app (Turbopack and webpack) whose server page, with no "use client" of its own, imports components from the
 *      package, and requires the prerendered HTML to hold them and the page to hydrate in Chromium without an error (ADR-0227);
 *   5. loads the page in Chromium and requires no errors, the component styles and the token CSS to have reached the bundle, and the
 *      button to be drawn from the theme's tokens, in light and again after `data-theme` changes to dark.
 * Needs the packages built, a Chromium for Playwright and the network (`pnpm install` of React, webpack, Next.js and the packages' dependencies; the two build tools are in the temporary app only). Nothing is
 * written into the repository. Exits non-zero on a failure.
 *
 * Run from the repository root: `pnpm check-fresh-app`.
 */
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["components", "tokens", "utils", "icons"];
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
        "@dbm-system/icons": file("icons"),
      },
      // Only the temporary app has these; none of them is a dependency of this repository.
      devDependencies: { webpack: "5.101.0", "css-loader": "7.1.2", "style-loader": "4.0.0", next: "16.4.6" },
    }),
  );
  // The packed packages depend on each other at the release version, which is not on the registry yet, so each is pointed at its tarball
  // (pnpm 11 reads overrides from pnpm-workspace.yaml, not package.json).
  writeFileSync(join(app, "pnpm-workspace.yaml"), `overrides:\n${PACKAGES.map((name) => `  "@dbm-system/${name}": ${JSON.stringify(file(name))}`).join("\n")}\n`);
  const install = () => execFileSync("pnpm", ["install", "--ignore-scripts"], { cwd: app, stdio: "pipe", encoding: "utf8" });
  try {
    install();
  } catch (first) {
    // The registry can hiccup; one more try before calling it a failure.
    try {
      install();
    } catch (second) {
      throw new Error(`pnpm install failed twice:\n${second.stderr ?? second.message}`);
    }
  }
  console.log("  installed into a fresh app");

  // What an agent looks for in the installed package (ADR-0208, ADR-0206): AGENTS.md at its root, and the manifest through its exports.
  const installed = createRequire(join(app, "package.json"));
  // Under pnpm's strict layout an app reaches only what it depends on: utils is internal, so it must not be importable from the app.
  try {
    installed.resolve("@dbm-system/utils");
    fail("@dbm-system/utils is importable from the app; it should only be a dependency of the components");
  } catch {}
  if (!existsSync(join(app, "node_modules", "@dbm-system", "components", "AGENTS.md"))) fail("AGENTS.md is not at the root of the installed components package");
  for (const entry of ["@dbm-system/components/manifest/index.json", "@dbm-system/components/manifest/components/Button.json", "@dbm-system/components/manifest.json"]) {
    try {
      installed.resolve(entry);
    } catch {
      fail(`${entry} does not resolve in the installed package`);
    }
  }

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

  // 4. webpack, production mode: the stylesheet's rules must survive its tree-shaking.
  writeFileSync(
    join(app, "entry-webpack.js"),
    `import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@dbm-system/components";

createRoot(document.getElementById("root")).render(createElement(Button, null, "Save"));
`,
  );
  const webpack = createRequire(join(app, "package.json"))("webpack");
  const stats = await new Promise((resolve, reject) =>
    webpack(
      {
        mode: "production",
        context: app,
        entry: "./entry-webpack.js",
        output: { path: join(app, "out-webpack"), filename: "app.js" },
        module: { rules: [{ test: /\.css$/, use: ["style-loader", "css-loader"] }] },
        performance: { hints: false },
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    ),
  );
  if (stats.hasErrors()) fail(`the webpack build failed: ${stats.toString({ all: false, errors: true })}`);
  else {
    const bundle = readFileSync(join(app, "out-webpack", "app.js"), "utf8");
    const before = failures.length;
    if (!/\.Button_root ?\{/.test(bundle)) fail("webpack dropped the component stylesheet: `@dbm-system/components/styles.css` is not kept by the package's sideEffects");
    if (!bundle.includes("--dbm-bg-brand:")) fail("webpack dropped the token CSS");
    if (failures.length === before) console.log(`  webpack production build keeps the stylesheet (${Math.round(bundle.length / 1024)} KB)`);
  }

  // 4b. A Next.js App Router app (ADR-0227): a server page, with no "use client" in its own files, imports components straight from the
  // package. It builds only because the package's entry starts with "use client"; without that, a server file that imports it fails at
  // build time (a hook or `createContext` is not a function). Built with Turbopack and with webpack, the HTML it prerenders must hold
  // the components, and the page is then loaded in Chromium to see it hydrate without an error.
  const nextApp = join(app, "next-app");
  mkdirSync(join(nextApp, "app"), { recursive: true });
  writeFileSync(join(nextApp, "package.json"), JSON.stringify({ name: "next-app", private: true, type: "module" }));
  writeFileSync(
    join(nextApp, "app", "layout.jsx"),
    `import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";

export default function Layout({ children }) {
  return (
    <html lang="en" data-theme="purple-light">
      <body>{children}</body>
    </html>
  );
}
`,
  );
  writeFileSync(
    join(nextApp, "app", "page.jsx"),
    `import { Button, Stack, Text } from "@dbm-system/components";

export default function Page() {
  return (
    <Stack>
      <Text>Server page</Text>
      <Button>Save</Button>
    </Stack>
  );
}
`,
  );
  const nextBin = join(app, "node_modules", "next", "dist", "bin", "next");
  const nextEnv = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "production" };
  let nextOk = true;
  for (const [label, flags] of [["Turbopack", []], ["webpack", ["--webpack"]]]) {
    rmSync(join(nextApp, ".next"), { recursive: true, force: true });
    try {
      execFileSync("node", [nextBin, "build", ...flags], { cwd: nextApp, env: nextEnv, stdio: "pipe", encoding: "utf8" });
    } catch (error) {
      nextOk = false;
      fail(`the Next.js (${label}) build of a server page that imports the package failed:\n${String(error.stdout ?? "")}${String(error.stderr ?? error.message)}`.slice(0, 2000));
      continue;
    }
    const html = readFileSync(join(nextApp, ".next", "server", "app", "index.html"), "utf8");
    if (!/<button[^>]*class="[^"]*Button_root/.test(html) || !html.includes("Server page")) {
      nextOk = false;
      fail(`the Next.js (${label}) page was prerendered without the Button and the Text`);
    } else console.log(`  Next.js App Router (${label}): a server page imports the package and prerenders it`);
  }
  if (nextOk) {
    // The last build is webpack's; run it and hydrate the page.
    const port = await new Promise((resolve) => {
      const probe = createServer().listen(0, () => {
        const { port: free } = probe.address();
        probe.close(() => resolve(free));
      });
    });
    const server = spawn("node", [nextBin, "start", "-p", String(port)], { cwd: nextApp, env: nextEnv, stdio: "pipe" });
    const output = [];
    server.stdout.on("data", (chunk) => output.push(String(chunk)));
    server.stderr.on("data", (chunk) => output.push(String(chunk)));
    const browser = await chromium.launch();
    try {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (await fetch(`http://127.0.0.1:${port}/`).then((response) => response.ok, () => false)) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.waitForSelector("button");
      // Hydration runs once the scripts have loaded; a mismatch or a client-reference error is reported through the console or as a page error.
      await page.waitForLoadState("networkidle");
      if (errors.length > 0) fail(`the Next.js page reported errors in the browser: ${errors.join("; ")}`);
      else console.log("  Next.js App Router: the server-rendered page hydrates without an error");
    } catch (error) {
      fail(`the Next.js page did not load: ${error instanceof Error ? error.message : String(error)}\n${output.join("").slice(-800)}`);
    } finally {
      await browser.close();
      server.kill("SIGKILL");
    }
  }

  // 5. Load it.
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
