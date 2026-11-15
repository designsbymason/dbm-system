# docs

The documentation website for `https://dbm-system.com`: an Astro app with React islands, deployed with Storybook as one GitHub Pages site. It is at the start of M0: the design-direction sample (the home page's hero, specification and theming section at `/`, and the direction itself at `/direction`, kept out of search results).

Run it with `pnpm --filter @dbm-system/docs dev` (port 4321; build the workspace packages first with `pnpm build`), or the `docs` entry in `.claude/launch.json`. `pnpm --filter @dbm-system/docs build` writes the static site to `dist/`, and `typecheck` checks the TypeScript files. Telemetry is off in every script.

The plan, structure, landing page brief and open items are in `guidelines/docs-site/`; the decisions are ADRs 0170 to 0173 and 0212 to 0217 in `guidelines/adr/`.
