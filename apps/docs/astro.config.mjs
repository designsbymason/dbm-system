// The DBM System docs website (guidelines/docs-site/, ADR-0170). Static output, React islands for live
// DBM components, MDX for prose.
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import remarkCodeFence from "./src/plugins/remark-code-fence.mjs";

export default defineConfig({
  site: "https://dbm-system.com",
  // Code fences render as DBM CodeBlocks (src/plugins/remark-code-fence.mjs), so Astro's own highlighter is off. The
  // plugin needs the unified (remark) processor: Astro 7's default processor runs no remark plugins.
  markdown: { syntaxHighlight: false, processor: unified({ remarkPlugins: [remarkCodeFence] }) },
  integrations: [react(), mdx()],
  // No dev toolbar: it overlays the page under review and has nothing the site needs.
  devToolbar: { enabled: false },
  // Workspace packages ship CSS imports and are built as ES modules; let Vite bundle them for the
  // server render too, so a component's styles reach the page.
  vite: {
    ssr: { noExternal: [/^@dbm-system\//] },
  },
});
