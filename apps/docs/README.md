# docs

The documentation website for `https://dbm-system.com`: an Astro app with React islands, deployed with Storybook as one GitHub Pages site. M0, the foundation, is built (`guidelines/docs-site/01-plan.md` §3): the home page sample at `/`, the approved design direction at `/direction` (kept out of search results), the Marketing and Article layouts, and the gates. The site is built and checked on every push and replaces the placeholder at the root after M1 (the Pages workflow's `PUBLISH_DOCS_SITE` switch).

## Run it

Build the workspace packages first (`pnpm build` at the root), then:

- `pnpm --filter @dbm-system/docs dev`: the site at `http://localhost:4321` (the `docs` entry in `.claude/launch.json`).
- `pnpm --filter @dbm-system/docs build`: the static site in `dist/`.
- `pnpm --filter @dbm-system/docs typecheck`: the TypeScript files.
- `pnpm --filter @dbm-system/docs check-links [folder]` and `check-accessibility [folder]`: the two gates, on `dist/` by default.
- To try the Storybook bridge on one origin, assemble the site with Storybook (`cp -R dist/. _artifact/ && cp -R ../../packages/components/storybook-static _artifact/storybook` after `pnpm --filter @dbm-system/components build-storybook`) and serve it with `node scripts/serve.mjs` (the `site-artifact` entry, port 4322).

Telemetry and the dev toolbar are off.

## Where things are

- `src/data/site.ts`: the site map (the header menus, the footer, the sidebar and the link check's planned pages).
- `src/components/shell/`: the page shell (`PageShell`, the header, the docs sidebar and outline, the footer).
- `src/layouts/`: `Base` (fonts, tokens, the mode before first paint), `Marketing` and `Article`.
- `src/components/home/`: the home page sample's sections.
- `scripts/`: the scoped token themes, the link check, the accessibility scan and the local server.

The plan, structure, landing page brief and open items are in `guidelines/docs-site/`; the decisions are ADRs 0170 to 0173 and 0212 to 0217 in `guidelines/adr/`.
