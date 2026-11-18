# docs

The website for `https://dbm-system.com`: an Astro app with React islands, deployed with Storybook as one GitHub Pages site. The site is the home page, the 404, the accessibility and legal pages and the agent files; Storybook, at `/storybook/`, is the documentation (`guidelines/docs-site/01-plan.md`, ADR-0220). The docs pages that were once here (M1) now live in Storybook (S1), and the site was trimmed to match (S2). It is built and checked on every push and replaces the placeholder at the root when the Pages workflow's `PUBLISH_DOCS_SITE` switch is turned on (after S3).

## Run it

Build the workspace packages first (`pnpm build` at the root), then:

- `pnpm --filter @dbm-system/docs dev`: the site at `http://localhost:4321` (the `docs` entry in `.claude/launch.json`). A change to a CSS module can show a page load late in the development server; reload twice, or restart it, before judging a style.
- `pnpm --filter @dbm-system/docs build`: the static site in `dist/`.
- `pnpm --filter @dbm-system/docs typecheck`: the TypeScript files.
- `pnpm --filter @dbm-system/docs check-links [folder]`, `check-counts [folder]`, `check-accessibility [folder]` and `check-privacy [folder]`: the gates, on `dist/` by default (the count and privacy checks also read Storybook, so give them the assembled artifact): the links resolve, the manifest, Storybook and the home page count the same components, the pages pass the accessibility scan, and the Privacy Policy matches what the site keeps in the browser.
- `pnpm --filter @dbm-system/docs assemble-local [--skip-storybook]`: assembles the site with Storybook beside it in `_artifact/` the way the Pages workflow does (builds the home page and Storybook, copies both, writes `robots.txt`, `sitemap.xml` and the agent files, then checks the agent files and the built CSS). It deletes and rebuilds the folder each time, so it is never a stale copy; `--skip-storybook` reuses the Storybook already built, for a change to the home page alone. Serve it with `node scripts/serve.mjs` (the `site-artifact` entry, port 4322), which reads files per request, so a reload shows the new folder. The workspace packages must be built first (`pnpm build`).

Telemetry and the dev toolbar are off.

## Where things are

- `src/data/site.ts`: the site map: every docs link, which goes into Storybook (the header menus and the footer read it).
- `src/components/shell/`: the page shell (`PageShell`, the header, the footer).
- `src/layouts/`: `Base` (fonts, tokens, the mode before first paint) and `Marketing` (the page type the site has).
- `src/pages/`: the routes: `/`, the 404, and the Accessibility statement, Privacy Policy and Terms of Use (`accessibility.astro`, `privacy.astro` and `terms.astro`, on the `Legal` layout; ADR-0224). Their text says what the site does and checks, so a change to that changes them.
- `src/illustrations/`: the SVG illustrations, coloured from the tokens.
- `src/components/header/SiteSearch.tsx`: search, a `CommandPalette` over Storybook's `index.json` (fetched when it first opens). On the published site that is Storybook beside the site; on the development server it is Storybook's own development server (`pnpm storybook`, port 6006), which has to be running, or search says so.
- `src/components/home/`: the home page's sections.
- `scripts/`: the scoped token themes, `assemble-seo.mjs` (writes the root `robots.txt` and `sitemap.xml` from Storybook's own, in the Pages workflow), the link check (which also checks each link into Storybook against its `index.json`), the accessibility scan and the local server.

The plan, structure, landing page brief and open items are in `guidelines/docs-site/`; the decisions are ADRs 0170, 0172, 0173, 0212, 0214, 0215, 0217 and 0220 to 0224 in `guidelines/adr/`.
