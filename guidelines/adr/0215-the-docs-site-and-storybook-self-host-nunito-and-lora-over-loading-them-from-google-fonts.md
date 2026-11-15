# 0215 — The docs site and Storybook self-host Nunito and Lora, over loading them from Google Fonts

**Status:** Accepted · **Date:** 2026-11-15 · **Amended 2026-11-16** — Storybook bundles its own copy of the font files instead of loading the site's; the decision itself is unchanged

## Context
Storybook loads Nunito and Lora from Google Fonts in its preview (`03-token-system-spec.md`). The docs site needs the same two families, and the site has no third-party scripts or services that see its readers ([ADR-0170](./0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md)). Moving between the site and Storybook should not refetch or reflow the type ([ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)).

## Decision
- The docs site serves Nunito and Lora itself, from the Fontsource packages (SIL Open Font License), in the weights the tokens use (400, 500, 600, 700), as `woff2`, with the Latin subset preloaded.
- Storybook bundles the same Fontsource files itself (the preview every subset by `unicode-range`, the manager only the Latin subset, since its bundler inlines fonts into its CSS), so it is self-hosted both alone and deployed. *(Amended 2026-11-16: this originally said Storybook's preview and manager load the same files from the site's path, so the browser fetches them once for both. Storybook run on its own, with no site beside it, would then have had no fonts, so it bundles its own copy at the cost of a second download when a reader crosses between the two.)*
- This is about the site and Storybook only. A consumer of the packages still supplies the fonts ([ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)).

## Alternatives considered
- **Keep Google Fonts.** No work, but a third-party request for every reader, another origin to connect to, and two caches for the site and Storybook.
- **Commit the font files by hand.** No dependency, but a manual update and a licence file to keep in step.
- **Ship the fonts in the published packages.** Rejected in ADR-0175.

## Consequences
- Two Fontsource packages join the docs app's dependency list.
- Storybook needs no site beside it to load the fonts; a reader crossing between the site and Storybook downloads them twice.
- `03-token-system-spec.md`'s note on how Storybook loads the fonts changes when this is built.

## Related
`guidelines/docs-site/02-structure.md` §10. `03-token-system-spec.md` (Typography). [ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md).
