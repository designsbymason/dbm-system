# 0216 — Component pages render the Storybook stories as their live examples through portable stories, over hand-written examples or story iframes

**Status:** Superseded by [0220](./0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) · **Date:** 2026-11-15

## Context
Each component page on the docs site shows live examples with their code ([ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md)). Storybook already has, for every component, stories that show its variants and states, and a hand-written snippet per example for "Show code" ([ADR-0020](./0020-show-code-uses-hand-written-snippets-over-storybook-generated-source.md)). Writing the examples a second time for the site would double the work and let the two drift.

## Decision
- The docs site renders the components' stories natively, as React islands, with Storybook's **portable stories** (`composeStories` from `@storybook/react`), and shows each story's existing snippet as its code.
- The site supplies its own project annotations (the theme and direction wrappers) in place of Storybook's preview, so a story takes the site's mode.
- A component page chooses which stories it shows; checks-only stories and `play` functions are never run on the site.
- `@storybook/react` joins the docs app's dependency list, at the version the components package's Storybook uses.

## Alternatives considered
- **Hand-written examples per component page.** Full control, but about 118 pages of examples to write and keep in step with Storybook.
- **Embed each story's iframe.** No new dependency, but heavy and hard to size and theme; ADR-0171 already rejected embedding Storybook.
- **Show the snippets as static code with no live render.** Light, but the site would stop being the system's real test.

## Consequences
- Stories become shared source for two consumers. A story that relies on something only Storybook provides (an action spy, a Storybook-only block, a global) needs a site-safe form before the site shows it.
- The docs app imports story files from the components package's source, not from the published package.
- Upgrading Storybook also upgrades the site's `@storybook/react`; the refresh pass covers both.

## Related
`guidelines/docs-site/02-structure.md` §3 and §10. `07-storybook-and-documentation-standards.md` §4.2 (snippets). [ADR-0020](./0020-show-code-uses-hand-written-snippets-over-storybook-generated-source.md), [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md).
