# 0224 — The website carries a Privacy Policy and Terms of Use as two pages of its own, over putting them in Storybook or leaving them out

**Status:** Accepted · **Date:** 2026-11-16 · **Amended 2026-11-16** — adds a third page, the website's accessibility statement at `/accessibility`; the decision itself is unchanged · Narrows the "home page only" scope of [ADR-0220](./0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)

## Context
[ADR-0220](./0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) made the website the home page, the 404 and the agent files, with every documentation page in Storybook. The footer now links to a Privacy Policy and Terms of Use. They are not documentation: they are about the site itself, a reader looks for them in the footer of the home page, and Storybook is a workshop whose chrome is built for components.

## Decision
- **`/privacy` and `/terms` are pages of the website,** in its shell, as plain prose in Astro (no Markdown or MDX pipeline, which left the site in S2).
- **Each says only what is true of the site as built:** no accounts, cookies, analytics or third-party requests, the colour mode kept in local storage, the host's own handling, the MIT licence for the code and the written documentation. A change to any of that (an analytics tool, say) changes the page in the same commit.
- **The footer's Accessibility link goes to `/accessibility`, a statement about the website and its documentation:** the aim, what is checked and not, the supported browsers and how to report a problem. It links to Storybook's Accessibility guide for the components' guarantees and the measured exceptions, which stay there once and are not repeated. *(Amended 2026-11-16: this originally said the footer link went to the Storybook guide, with no page of its own, because the guide already held the statement; a page of the site's own was wanted beside the other two.)*
- **They are in the sitemap** and the accessibility and link checks, like the home page.

## Alternatives considered
- **Pages in Storybook (Resources).** Everything stays in one home, but a legal page inside a component workshop reads oddly and is hard to find from the footer.
- **Leave them out.** Nothing to maintain, but a public site that stores a preference and links to services should say what it does.

## Consequences
- The site has two more pages to keep true. The privacy text lists what is checked (no third-party requests on the home page or in Storybook, local storage keys), and a new feature that collects anything must update it.
- The wording is plain-language drafts for the maintainer to review; it is not legal advice, and it names no governing law.

## Related
`guidelines/docs-site/02-structure.md` §1 and §2.
