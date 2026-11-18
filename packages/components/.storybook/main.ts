import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import remarkGfm from "remark-gfm";
import type { StorybookConfig } from "@storybook/react-vite";

// The manager's head, for the bridge to the docs website (ADR-0214). Built here, in Node, so the colours come from the
// token index rather than being typed in.
const tokenIndex = JSON.parse(readFileSync(createRequire(import.meta.url).resolve("@dbm-system/tokens/tokens.json"), "utf8")) as {
  tokens: { name: string; values: Record<string, string> }[];
};
const tokenValue = (name: string, theme: string) => {
  const value = tokenIndex.tokens.find((token) => token.name === name)?.values[theme];
  if (!value) throw new Error(`.storybook/main.ts: no ${name} for ${theme} in tokens.json`);
  return value;
};
// The manager's app background (`appBg` in theme.ts): bg.neutral-subtle in light, bg.brand-subtle in dark.
const appBackground = { light: tokenValue("--dbm-bg-neutral-subtle", "purple-light"), dark: tokenValue("--dbm-bg-brand-subtle", "purple-dark") };
const managerHead = `
  <!-- Search engines (ADR-0221, docs-site/02-structure.md §12): the Docs pages are indexed and the story canvases are not.
       The head is the same for every path, so a script decides from the address: a story path gets noindex, a Docs path a
       canonical URL. It follows Storybook's own navigation, which changes the address without loading the page again. -->
  <script>
    (function () {
      var base = "https://dbm-system.com/storybook/";
      function head(tag, attrs) {
        var el = document.head.querySelector(tag + "[data-dbm-seo]");
        if (!el) { el = document.createElement(tag); el.setAttribute("data-dbm-seo", ""); document.head.appendChild(el); }
        for (var name in attrs) el.setAttribute(name, attrs[name]);
        return el;
      }
      function sync() {
        var path = new URLSearchParams(location.search).get("path") || "";
        var robots = document.head.querySelector('meta[name="robots"][data-dbm-seo]');
        var canonical = document.head.querySelector('link[rel="canonical"][data-dbm-seo]');
        if (path.indexOf("/story/") === 0) {
          head("meta", { name: "robots", content: "noindex" });
          if (canonical) canonical.remove();
        } else {
          if (robots) robots.remove();
          if (path.indexOf("/docs/") === 0) head("link", { rel: "canonical", href: base + "?path=" + path });
          else if (canonical) canonical.remove();
        }
      }
      ["pushState", "replaceState"].forEach(function (method) {
        var original = history[method];
        history[method] = function () { var result = original.apply(this, arguments); sync(); return result; };
      });
      addEventListener("popstate", sync);
      sync();
    })();
  </script>
  <!-- Crossing to or from dbm-system.com cross-fades instead of flashing a blank page; both sides opt in. -->
  <style>
    @view-transition { navigation: auto; }
    @media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }
    html { background: ${appBackground.light}; }
    html[data-dbm-mode="dark"] { background: ${appBackground.dark}; color-scheme: dark; }
  </style>
  <!-- The reader's mode, shared with the site through one key on the origin, painted before the manager loads. -->
  <script>
    (function () {
      try {
        var mode = localStorage.getItem("dbm-mode");
        var dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
        if (dark) document.documentElement.dataset.dbmMode = "dark";
      } catch (e) {}
    })();
  </script>`;

const config: StorybookConfig = {
  // `.mdx` docs pages live alongside their component's stories (see
  // guidelines/07-storybook-and-documentation-standards.md §4) — matched
  // separately since they don't follow the `*.stories.*` naming pattern.
  //
  // The published build (`pnpm build-storybook` sets STORYBOOK_PUBLIC_BUILD) leaves out the `*.checks.stories` files: they are the
  // hidden test stories (`!dev`, about half of all stories) that only the real-browser tests and the visual suite run, no docs page
  // shows one, and left in they were 2.3 MB of the build and 575 KB of `index.json`, which the manager, every docs page and the
  // website's search each fetch. `test:storybook`, `test:visual` and `pnpm storybook` still see them.
  stories: [
    process.env.STORYBOOK_PUBLIC_BUILD ? "../src/**/!(*.checks).stories.@(ts|tsx)" : "../src/**/*.stories.@(ts|tsx)",
    "../src/**/*.mdx",
  ],
  // `@storybook/addon-viewport` and interaction/play-function testing are
  // both core-bundled in Storybook 10 (`storybook/viewport`,
  // `storybook/test`) — no separate addon packages needed for either.
  // `@storybook/addon-vitest` (added 2026-08-16) wires the sidebar's
  // per-story test-status indicators to the real "storybook" Vitest
  // project (vitest.config.ts) — it's also what the Accessibility addon's
  // automatic scan is gated behind; see guidelines/01-vision-and-goals.md
  // §12 for the full diagnosis of why the a11y panel didn't work without it.
  // The live panel/sidebar indicators need `pnpm test:storybook:watch`
  // running alongside `pnpm storybook` — confirmed empirically (registering
  // the addon here alone isn't enough; it has nothing to report until a
  // live Vitest process is actually watching). `pnpm test:storybook` (no
  // watch) is the one that matters for CI — it works standalone with no
  // running dev server, since Vite loads stories directly.
  // `@storybook/addon-docs` registered with an explicit `options` object
  // (rather than the plain string form) so its MDX compiler picks up
  // `remark-gfm` — without it, GFM tables in a `.mdx` Docs page silently
  // render as raw, unparsed `| pipe | text |` instead of an actual table
  // (found 2026-09-09, via FocusTrap's own review; confirmed there's no
  // other way to reach the MDX compiler's remark plugins — `main.ts` has no
  // top-level `options` field of its own, this addon's own per-addon
  // `options.mdxPluginOptions.mdxCompileOptions` is the documented
  // extension point). Dev-only Storybook tooling, not shipped in
  // `@dbm-system/components` — same category as Storybook itself,
  // not subject to the runtime dependency budget in `CLAUDE.md`.
  addons: [
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-vitest",
  ],
  // Served beside the manager, so `./public/logo-light.svg` becomes `logo-light.svg` next to
  // `index.html` (at `/storybook/logo-light.svg` on dbm-system.com) — referenced as
  // `brandImage` in theme.ts for the sidebar logo.
  staticDirs: ["./public"],
  managerHead: (head) => `${head}${managerHead}`,
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // One copy of React for the preview and for every package it loads. The dev server's dependency pre-bundle can end up with two
  // (`02-tech-stack-and-structure.md`, "Adding a dependency while Storybook is running": an "Invalid hook call" from the new package
  // while the real-browser tests pass); resolving `react` and `react-dom` to a single copy rules that out.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: { ...viteConfig.resolve, dedupe: [...(viteConfig.resolve?.dedupe ?? []), "react", "react-dom"] },
  }),
  // esbuild's local-css loader (see tsup.config.ts) is a build-time-only concern;
  // Vite already has native CSS Modules support, so no extra config is needed here.
  // No paid SaaS / anonymous-usage-phone-home in the build pipeline, per
  // CLAUDE.md's free/OSS-only + security posture — Storybook otherwise
  // sends anonymous telemetry on most CLI commands by default.
  core: {
    disableTelemetry: true,
  },
};

export default config;
