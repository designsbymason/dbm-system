# 0171 — Docs website content comes from the manifest for facts and MDX for prose, and the guides move out of Storybook, which keeps the component pages, over reusing Storybook's MDX, a separate copy, or keeping both

**Status:** Accepted · **Date:** 2026-11-03

## Context
Storybook already holds a Docs page per component, a Foundations group, a Getting started page and six guides (Theming, Accessibility, Responsive and right-to-left, Hooks and utilities, Composition patterns, Icons). Those pages are written with Storybook-only blocks. A docs website needs a home for concepts and guides, a front door, and component references that stay correct as components change.

## Decision
- **Facts from the manifest.** A component page on the docs website gets its props, variants, tier and category from the JSON component manifest (Phase 8), so a reference cannot drift from the code.
- **Prose in MDX.** Concepts, guides, recipes and the landing page are MDX in `apps/docs`.
- **The guides move to the docs website.** Getting started, Theming, Accessibility, Responsive and right-to-left, Hooks and utilities, Composition patterns and Icons become docs pages. Storybook keeps Foundations, the component pages and Templates, plus a short Getting started page that points to the docs website and keeps the component index (which reads Storybook's own `index.json`).
- **Components are rendered in the page**, not embedded as Storybook iframes.
- **Each docs component page links to its Storybook page** ("Open in Storybook", at `/storybook/?path=/docs/…`) for the Playground, controls and tests.
- **Foundations** stay in Storybook and are also presented on the docs website, read from the tokens package by both, so neither copy is typed by hand.
- **Component URLs are flat**: `/components/button`. Tier and category are filters on the index, so moving a component never changes its address.

## Alternatives considered
- **Render Storybook's component MDX on the docs website.** One source, but those files depend on Storybook-only blocks and its docs container, and would have to be adapted anyway.
- **Write the docs website separately and leave Storybook complete.** Cleanest site, but two copies to keep in sync, and they drift.
- **Keep the guides in both places.** No link-outs, and the same drift.
- **The docs website links out to Storybook for components.** Not self-contained, and the front door would send readers into a developer tool.
- **Embed the Storybook Playground in each docs page.** Heavy, and hard to size and theme.

## Consequences
- The guides and the Foundations pages must be ported off Storybook-only blocks (`ReferenceTable`, `FieldsTable`, `RelatedLinks`, `Callout`, `IconGallery`, `CompositionDemos`, `FoundationsCards`). The port list is in `guidelines/docs-site/04-content-inventory.md`.
- Foundations exist in two places by this decision. They share their data source, but their prose does not; whether to keep both is an open item.
- Component pages on the docs website wait for the manifest.
- Storybook's sidebar gets smaller, and `07` §11 describes today's Getting started and Guides until they move.

## Related
`guidelines/docs-site/02-structure.md` and `04-content-inventory.md`. `07-storybook-and-documentation-standards.md` §11. [ADR-0170](./0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md).
