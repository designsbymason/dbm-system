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
  },
});
