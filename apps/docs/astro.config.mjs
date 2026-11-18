// The DBM System website (guidelines/docs-site/, ADR-0170, ADR-0220): the home page, as static output with React
// islands for live DBM components. The documentation is Storybook.
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dbm-system.com",
  integrations: [react()],
  // No dev toolbar: it overlays the page under review and has nothing the site needs.
  devToolbar: { enabled: false },
  // Workspace packages ship CSS imports and are built as ES modules; let Vite bundle them for the
  // server render too, so a component's styles reach the page.
  vite: {
    ssr: { noExternal: [/^@dbm-system\//] },
    // The default minifier (Lightning CSS) folds `animation-timeline` into the `animation` shorthand (`animation: linear both name scroll(root)`),
    // which current Chrome rejects whole, so every scroll-driven animation on the home page vanished in the build and the theme section's
    // compositions stayed at opacity 0. esbuild keeps the longhands apart.
    build: { cssMinify: "esbuild" },
  },
});
