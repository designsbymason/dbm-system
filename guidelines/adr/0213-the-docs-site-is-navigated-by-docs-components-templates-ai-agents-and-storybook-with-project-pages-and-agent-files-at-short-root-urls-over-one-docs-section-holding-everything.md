# 0213 — The docs site is navigated by Docs, Components, Templates, AI agents and Storybook, with project pages and agent files at short root URLs, over one Docs section holding everything

**Status:** Accepted · **Date:** 2026-11-15

## Context
The first site map put almost everything under `/docs`: onboarding, guides, the Foundations overview, the agent page, the changelog and the accessibility statement. Its top bar was Docs, Components, Templates and Storybook. That mixes learning, reference and project news in one sidebar, buries the agent story (the system's first claim is that it is agentic) at `/docs/for-ai-agents`, and gives the 14 hooks and 4 functions the manifest documents no page at all. URLs are hard to change once shared, so the map is decided before the site is built.

## Decision
- **Top bar:** Docs ▾, Components ▾, Templates, AI agents, Storybook; then search, a version menu, GitHub and the mode menu. Docs and Components open large menus; Storybook is styled as a secondary item marked as the workshop.
- **Docs** has four groups: **Get started** (`/docs`, `/docs/introduction`, `/docs/installation`, `/docs/quick-start`, `/docs/frameworks`), **Guides** (`/docs/guides/<slug>`), **Foundations** (`/docs/foundations`, linking into Storybook's token pages, [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md)) and **Resources**.
- **Resources live at the root**: `/changelog`, `/roadmap`, `/faq`, `/accessibility-statement`. They are in the Docs menu, the version menu and the footer, not in the learning sidebar.
- **Components** keep flat URLs (`/components/<name>`, ADR-0171), and their sidebar and menu follow the **9 functional categories**, the navigation axis of [ADR-0006](./0006-functional-categories-over-atomic-tier-navigation.md); tier is a filter. **Hooks and functions** get pages at `/hooks/<name>` and `/functions/<name>`, grouped in the same sidebar.
- **Templates** at `/templates` and `/templates/<name>`, grouped into Shells and Pages.
- **AI agents** at `/agents`. **Agent files at stable root URLs**: `/manifest.json`, `/components/<name>.json`, `/AGENTS.md`, `/llms.txt`, `/llms-full.txt`, and a Markdown copy of every page at its own URL with `.md` added.
- **Wayfinding on every content page:** breadcrumbs, a sidebar for the current section only, an outline for long pages, previous and next links, and a four-column footer. On a phone, one drawer holds the sections and the current section's pages.

## Alternatives considered
- **Keep one Docs section.** Fewer top-level items, but a sidebar that mixes learning and news, and long URLs for the pages people share most.
- **Foundations as a top-level item.** Its pages live in Storybook ([ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md)), so a top-level item would lead to one overview page.
- **Navigate components by tier, as Storybook's sidebar does.** Consistent with Storybook, but against ADR-0006, and a reader looks for "an input", not "a molecule".
- **Hooks and functions under `/components/<name>`.** One URL space, but a hook is not a component and the URL would say so wrongly.
- **Resources under `/docs`.** Consistent prefixes, at the cost of the learning sidebar and the length of shared links.

## Consequences
- Storybook stays tier first; the site maps between the two in its "Open in Storybook" links and Storybook's link back.
- The Docs menu, the footer and the version menu all list Resources; one data file drives them.
- Every page has a Markdown copy, so the build writes two outputs per page.
- Renaming a URL after launch needs a "moved" page, as for the guides leaving Storybook.

## Related
`guidelines/docs-site/02-structure.md` §1 and §2. [ADR-0006](./0006-functional-categories-over-atomic-tier-navigation.md), [ADR-0170](./0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md), [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md).
