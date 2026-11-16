# 0214 — Storybook keeps its own interface and is bridged to the docs site by a shared mode, shared fonts, view transitions and links both ways, over an iframe workshop page or an injected header

**Status:** Accepted, the search-engine part superseded by [0221](./0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md) · **Date:** 2026-11-15

## Context
The docs site and Storybook share one domain ([ADR-0170](./0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md)), and moving between them should feel like one site. Storybook's manager is already themed from the tokens (fonts, colours, radius) and follows its own Brand and Mode toolbar. But the reader's light or dark choice does not carry across, each loads its own fonts, a navigation between them flashes a blank page, the logo links to GitHub rather than the site, and its logo image uses a root path that does not resolve under `/storybook/`.

## Decision
Storybook keeps its own interface, and these join it to the site:

- **Shared mode:** one mode key in the origin's `localStorage`. The site writes it; Storybook's manager reads it at start-up to set its Mode global and writes it back when the toolbar changes.
- **Shared fonts:** both load the same self-hosted font files ([ADR-0215](./0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md)).
- **Transitions:** both opt into cross-document View Transitions, and Storybook's manager paints the mode's background before it loads, so neither direction flashes.
- **Brand:** Storybook's logo resolves under `/storybook/` and links to `https://dbm-system.com/` in the same tab.
- **Links both ways:** each component page on the site has "Open in Storybook"; each component's Docs page in Storybook has "View on dbm-system.com".
- **Search engines:** Storybook is not indexed (`noindex` and a `robots.txt` rule), as already planned.

These changes are Storybook configuration (`packages/components/.storybook/`) and its docs blocks, never the published components.

## Alternatives considered
- **A workshop page in the site's own header that frames Storybook's canvas in an iframe.** The most seamless, but heavy, awkward on a phone, and a second way to reach the same Playground.
- **The site's header injected into Storybook's manager.** The two would look most alike, but it depends on Storybook internals and would break on upgrades.
- **Leave Storybook as it is and link to it.** No work, but the reader notices the seam on every crossing.

## Consequences
- The site and Storybook must agree on the mode key and its values; the site's mode menu and Storybook's toolbar become two controls for one setting.
- Storybook's sidebar stays tier first; the links map between its paths and the site's flat URLs ([ADR-0213](./0213-the-docs-site-is-navigated-by-docs-components-templates-ai-agents-and-storybook-with-project-pages-and-agent-files-at-short-root-urls-over-one-docs-section-holding-everything.md)).
- The bridge is checked in the combined artifact, in both directions, as part of the site's foundation.

## Related
`guidelines/docs-site/02-structure.md` §4. [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md), [ADR-0212](./0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md).
