# docs

The documentation website for `https://dbm-system.com`: an Astro app with React islands, deployed with Storybook as one GitHub Pages site. M0 (the foundation) and M1 (the docs core) are built (`guidelines/docs-site/01-plan.md` §3): the home page sample at `/`, the docs under `/docs`, AI agents and the Resources pages at the root, a Markdown copy of each page, `/AGENTS.md`, search and the 404. The site is built and checked on every push and replaces the placeholder at the root when the Pages workflow's `PUBLISH_DOCS_SITE` switch is turned on.

## Run it

Build the workspace packages first (`pnpm build` at the root), then:

- `pnpm --filter @dbm-system/docs dev`: the site at `http://localhost:4321` (the `docs` entry in `.claude/launch.json`).
- `pnpm --filter @dbm-system/docs build`: the static site in `dist/`, and the search index (`pagefind --site dist`). Search works only in the built site.
- `pnpm --filter @dbm-system/docs typecheck`: the TypeScript files.
- `pnpm --filter @dbm-system/docs check-links [folder]` and `check-accessibility [folder]`: the two gates, on `dist/` by default.
- To try the Storybook bridge on one origin, assemble the site with Storybook (`cp -R dist/. _artifact/ && cp -R ../../packages/components/storybook-static _artifact/storybook` after `pnpm --filter @dbm-system/components build-storybook`) and serve it with `node scripts/serve.mjs` (the `site-artifact` entry, port 4322).

Telemetry and the dev toolbar are off.

## Where things are

- `src/data/site.ts`: the site map (the header menus, the footer, the sidebar and the link check's planned pages).
- `src/components/shell/`: the page shell (`PageShell`, the header, the docs sidebar and outline, the footer).
- `src/layouts/`: `Base` (fonts, tokens, the mode before first paint), `Marketing` and `Article`.
- `src/content/`: the pages' prose, plain Markdown in MDX (`docs/` under /docs, `pages/` at the root), with `src/content.config.ts`.
- `src/pages/`: the routes, including the `.md` copies and `/AGENTS.md`.
- `src/components/content/`: the page head, previous and next, and the code fences (`src/plugins/remark-code-fence.mjs` turns each fence into a DBM `CodeBlock`).
- `src/illustrations/`: the SVG illustrations, coloured from the tokens.
- `src/components/home/`: the home page sample's sections.
- `scripts/`: the scoped token themes, the link check, the accessibility scan and the local server.

The plan, structure, landing page brief and open items are in `guidelines/docs-site/`; the decisions are ADRs 0170, 0172, 0173, 0212, 0214, 0215, 0217 and 0220 to 0223 in `guidelines/adr/`. Under the current plan the site becomes the home page and its docs pages move to Storybook (S1 and S2).
