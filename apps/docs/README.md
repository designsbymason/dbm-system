# docs

The website for `https://dbm-system.com`: an Astro app with React islands, deployed with Storybook as one GitHub Pages site. The site is the home page, the 404 and the agent files; Storybook, at `/storybook/`, is the documentation (`guidelines/docs-site/01-plan.md`, ADR-0220). The docs pages that were once here (M1) now live in Storybook (S1), and the site was trimmed to match (S2). It is built and checked on every push and replaces the placeholder at the root when the Pages workflow's `PUBLISH_DOCS_SITE` switch is turned on (after S3).

## Run it

Build the workspace packages first (`pnpm build` at the root), then:

- `pnpm --filter @dbm-system/docs dev`: the site at `http://localhost:4321` (the `docs` entry in `.claude/launch.json`).
- `pnpm --filter @dbm-system/docs build`: the static site in `dist/`.
- `pnpm --filter @dbm-system/docs typecheck`: the TypeScript files.
- `pnpm --filter @dbm-system/docs check-links [folder]` and `check-accessibility [folder]`: the two gates, on `dist/` by default.
- To try the Storybook bridge on one origin, assemble the site with Storybook (`cp -R dist/. _artifact/ && cp -R ../../packages/components/storybook-static _artifact/storybook` after `pnpm --filter @dbm-system/components build-storybook`) and serve it with `node scripts/serve.mjs` (the `site-artifact` entry, port 4322).

Telemetry and the dev toolbar are off.

## Where things are

- `src/data/site.ts`: the site map: every docs link, which goes into Storybook (the header menus and the footer read it).
- `src/components/shell/`: the page shell (`PageShell`, the header, the footer).
- `src/layouts/`: `Base` (fonts, tokens, the mode before first paint) and `Marketing` (the page type the site has).
- `src/pages/`: the routes: `/`, the 404 and `/AGENTS.md`.
- `src/illustrations/`: the SVG illustrations, coloured from the tokens.
- `src/components/header/SiteSearch.tsx`: search, a `CommandPalette` over Storybook's `index.json` on the same origin (fetched when it first opens). It finds nothing on the development server, which has no Storybook beside it; try it in the assembled site (`serve.mjs`).
- `src/components/home/`: the home page's sections.
- `scripts/`: the scoped token themes, `assemble-seo.mjs` (writes the root `robots.txt` and `sitemap.xml` from Storybook's own, in the Pages workflow), the link check (which also checks each link into Storybook against its `index.json`), the accessibility scan and the local server.

The plan, structure, landing page brief and open items are in `guidelines/docs-site/`; the decisions are ADRs 0170, 0172, 0173, 0212, 0214, 0215, 0217 and 0220 to 0223 in `guidelines/adr/`.
