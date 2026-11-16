# 0221 — Storybook's Docs pages are indexed by search engines, with plain-text copies for agents, over keeping Storybook out of results

**Status:** Accepted · **Date:** 2026-11-16 · Supersedes the search-engine part of [ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)

## Context
[ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md) kept Storybook out of search results (a `noindex` tag and `Disallow: /storybook/`), so results would show the website's pages instead of thin Storybook ones. With the documentation now in Storybook ([ADR-0220](./0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)), that would hide the docs entirely. Storybook renders its pages with JavaScript inside an iframe, which search engines index only partly and which an agent reading the web cannot run.

## Decision
- **Storybook's Docs pages are indexed:** the `noindex` tag leaves them and `robots.txt` no longer blocks `/storybook/`. Story canvases (the Playground and check stories) stay out of results.
- **A `sitemap.xml`** lists the home page and Storybook's Docs pages.
- **Plain-text copies:** at build, each Storybook Docs page's MDX is turned into Markdown at a stable root address, and `llms.txt` and `llms-full.txt` index and collect them, so crawlers and agents read the docs without running Storybook.
- **The logo:** Storybook's logo is the DBM System wordmark, generated from the tokens as a light and a dark file and switched with the Mode toolbar, linking to the home page.

## Alternatives considered
- **Keep Storybook out of results.** Only the home page would be found; the docs would be invisible.
- **Index Storybook with no text copies.** Simpler, but agents and some crawlers would get almost nothing.

## Consequences
- The plain-text copies are generated from the same MDX as the pages, so they cannot drift; a page with live blocks keeps its prose and code, not its demos.
- The search-engine setup is part of the Storybook build and of the link check.

## Related
`guidelines/docs-site/02-structure.md`. [ADR-0206](./0206-the-manifest-is-also-shipped-as-an-index-and-one-file-per-component-beside-the-whole-file-over-the-single-file-alone-or-waiting-for-an-mcp-server.md), [ADR-0208](./0208-the-agents-md-is-a-committed-file-with-a-marked-generated-list-that-a-sync-command-rewrites-and-a-check-keeps-in-step-over-writing-it-in-the-build-or-generating-it-into-dist.md).
