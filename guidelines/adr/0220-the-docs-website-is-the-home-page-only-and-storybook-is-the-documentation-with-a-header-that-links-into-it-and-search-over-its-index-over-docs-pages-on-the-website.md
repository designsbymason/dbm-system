# 0220 — The docs website is the home page only and Storybook is the documentation, with a header that links into it and search over its index, over docs pages on the website

**Status:** Accepted · **Date:** 2026-11-16 · Supersedes [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md), [ADR-0213](./0213-the-docs-site-is-navigated-by-docs-components-templates-ai-agents-and-storybook-with-project-pages-and-agent-files-at-short-root-urls-over-one-docs-section-holding-everything.md) and [ADR-0216](./0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)

## Context
The first plan put the documentation on the website: the guides moved out of Storybook, a page per component, hook and function generated from the manifest with the stories as live examples, site search, and a Markdown copy of every page ([ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md), [ADR-0213](./0213-the-docs-site-is-navigated-by-docs-components-templates-ai-agents-and-storybook-with-project-pages-and-agent-files-at-short-root-urls-over-one-docs-section-holding-everything.md), [ADR-0216](./0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)). M1 built the docs core that way. Storybook meanwhile already holds a Docs page for every component, the Foundations pages, the guides and Getting started, and stays the workshop. Two homes for the same knowledge meant porting every guide off Storybook's blocks, generating a second page per component, and keeping both in step. The maintainer chose one home for the documentation.

## Decision
- **The website is the home page** (with the 404 and the agent files at the root). It is the front door: what DBM System is, why it is different, proof that it works, and the way in.
- **Storybook is the documentation.** Its sidebar is grouped **Getting started** (Introduction, Installation, Quick start, Frameworks, AI agents, All components), **Guides**, **Resources** (Changelog, Roadmap, FAQ), **Foundations**, then **Atoms**, **Molecules**, **Organisms** and **Templates** as before, so no component's address changes.
- **No duplicate content:** the website's M1 pages move into Storybook and merge with what is there (one Installation, one Accessibility guide holding the statement, one Foundations overview). Storybook's single Getting started page is split, its Components and Templates tables becoming the **All components** page.
- **The home page's header links into Storybook:** Docs and Foundations open menus of their Storybook pages, Components links to All components, and the actions (search, mode, Storybook, GitHub) sit at the end. The menus are on the home page only; inside Storybook its sidebar navigates and the logo links home ([ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)).
- **Search** is DBM's `CommandPalette` over Storybook's own index (`index.json`): every Docs page, component and story by title, opening in Storybook. No site index.
- **Agent files stay at the root:** `/AGENTS.md`, and `/manifest.json`, `llms.txt`, `llms-full.txt` and a Markdown copy of each Storybook Docs page generated from its MDX at build ([ADR-0221](./0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)).

## Alternatives considered
- **Keep the docs on the website (the first plan).** One coherent site and fully indexable HTML, at the cost of a second page per component and a port of every guide, kept in step with Storybook forever.
- **Both, with Storybook as the reference and the site for guides.** The split the first plan had; the duplication and drift are what this decision removes.
- **Inject the site's header into Storybook.** One header everywhere, but it depends on Storybook's internals ([ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)).

## Consequences
- The site is small: the home page, its header and footer, the gates. The Article layout, the docs sidebar and outline, Pagefind and the M1 pages leave it.
- Storybook carries the reader's whole path through the docs, so its docs pages need the care the site pages had, and search engines must be allowed to index them ([ADR-0221](./0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)).
- Moving the Getting started content changes one Storybook address; it keeps a "moved" page.
- The categories remain a filter in All components and in the manifest; the sidebar stays tier first ([ADR-0006](./0006-functional-categories-over-atomic-tier-navigation.md) is not changed for the manifest).

## Related
`guidelines/docs-site/`. [ADR-0170](./0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md) (one Pages site, Storybook at `/storybook/`, unchanged). `07-storybook-and-documentation-standards.md` §11.
