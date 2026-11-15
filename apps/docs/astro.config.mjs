// The DBM System docs website (guidelines/docs-site/, ADR-0170). Static output, React islands for live
// DBM components, MDX for prose.
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dbm-system.com",
  integrations: [react(), mdx()],
  // No dev toolbar: it overlays the page under review and has nothing the site needs.
  devToolbar: { enabled: false },
  // Workspace packages ship CSS imports and are built as ES modules; let Vite bundle them for the
  // server render too, so a component's styles reach the page.
  vite: {
    ssr: { noExternal: [/^@dbm-system\//] },
  },
});
