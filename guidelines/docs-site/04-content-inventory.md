# Docs website — content inventory

Where each piece of documentation lives under the current plan: once, in Storybook ([ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)). The sidebar is in [02-structure.md](./02-structure.md) §2. Storybook's sources are in `packages/components/src/guides/` and `packages/components/src/foundations/`; the site's M1 pages in `apps/docs/src/content/` have been ported to them (S1) and leave the site in S2.

## 1. Content moves and merges (S1, built)

No page exists twice. Where the site and Storybook both cover something, the two merge into one Storybook page.

| Today | Becomes |
|---|---|
| Storybook's Getting started (one page: the welcome, the five installation steps, the fonts, where releases and issues live, the agent files, the Components and Templates tables) | Split: **Introduction** (the welcome), **Installation** (the steps) and **All components** (the two tables). Its address changes once; the old one keeps a short "moved" page |
| The site's Introduction, Installation, Quick start, Frameworks, AI agents, FAQ and Roadmap | Ported to Storybook MDX under Getting started and Resources, merged with the Getting started content (one Installation, not two) |
| Storybook's Accessibility guide and the site's Accessibility statement | One **Accessibility** guide: the guarantees, how they are checked, the known exceptions (from `03-token-system-spec.md`, kept in step), the supported browsers, how to report a problem |
| The site's Foundations overview | Merged into Storybook's Foundations Overview (the three layers and the naming); the site page goes |
| Changelog (not built) | A Resources page generated from the packages' `CHANGELOG.md` at build |
| The Theming guide and Installation's theme step | Installation keeps the minimum and links to Theming for switching and multiple themes |
| The package README and Installation | Both stay (npm readers need the README); `check-publish` keeps the README, `AGENTS.md` and the Getting started pages consistent, and the new pages join that check |
| Storybook's other guides, the Foundations pages, the component Docs pages, Templates | Stay where they are |

## 2. What left the site (S2)

The `/docs/*`, `/agents`, `/faq`, `/roadmap` and `/accessibility-statement` pages; the Article layout, the docs sidebar and outline, previous and next; Pagefind; the `.md` copies of site pages (replaced in S4 by copies of Storybook's pages). Their content is in Storybook first (§1). The site's illustrations for those pages move with them only if Storybook can render them; otherwise they are retired.

## 3. Writing the moved pages

The site's M1 pages are plain Markdown in MDX, so they port directly; Storybook's own blocks (`Callout`, `ReferenceTable`, `RelatedLinks`, `ComponentIndex` and the rest, in `packages/components/.storybook/blocks/`) are available to them. Links inside the moved pages point to Storybook addresses; links to the home page use the absolute site URL.

## 4. Old addresses

A Storybook address that changes (Getting started) keeps a short "this page has moved" page linking to the new one, because static Pages cannot redirect. The site's removed pages were never published at the root, so they need no stubs. The stubs are removed once nobody arrives at the old addresses.
