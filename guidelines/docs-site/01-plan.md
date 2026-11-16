# Docs website — plan

**Decided in:** [ADR-0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md), [ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md), [ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md) (its dependency rule; its GSAP and mode parts are superseded), [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md), [ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md), [ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md), [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md) and [ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) to [ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md). Structure is in [02-structure.md](./02-structure.md).

**The model:** the website at `dbm-system.com` is the **home page**; **Storybook, at `/storybook/`, is the documentation** ([ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)). The home page's header links into Storybook's pages, and its search runs over Storybook's index.

## 1. Goals

1. A **front door** for DBM System that says plainly what it is (an agentic component library for people and AI agents) and makes a first impression worthy of the system: premium, professional and precise, with a character of its own.
2. **One home for the documentation.** Every guide, foundation and component page lives once, in Storybook; the home page links into it and repeats none of it.
3. **Alive on the home page, calm in the docs.** Expressive, interactive motion on the home page ([ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md)); Storybook's docs pages add none. SVG illustrations and CSS 3D compositions of live components, drawn from the tokens, carry the ideas ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)).
4. **One site with Storybook.** Moving between the home page and Storybook keeps the mode, the type and the colours, without a flash ([ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)).
5. A **complete reference** in Storybook for a person or an agent adopting DBM: install, frameworks, theme, guides, every component and template, the changelog.
6. **Agent legibility**: `AGENTS.md`, the manifest, `llms.txt`, `llms-full.txt` and a Markdown copy of each Storybook Docs page at stable root URLs ([ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md), `01-vision-and-goals.md` §13.1), and Storybook's Docs pages indexed by search engines.
7. **Dogfooded**: the home page and its header are DBM components and tokens. A gap found in DBM is raised with the maintainer before anything in the system changes.
8. **Honest and fast**: nothing promised that is not built; static HTML with islands only where something is interactive; WCAG 2.2 AA; reduced motion gives a complete static page.

## 2. Scope

In: the home page (seven sections, [03-landing-page-brief.md](./03-landing-page-brief.md)) with its header and footer; search over Storybook's index; the light and dark toggle; the 404; the agent files at the root; in Storybook, the Getting started, Guides and Resources groups ([02-structure.md](./02-structure.md) §2), the All components page, a generated Changelog, indexing and a sitemap, the new logo; the Storybook bridge; the quality gates.

Later: a grid view of All components with a glyph per component; a tokens page; versioned docs (from 1.0); social images; a release banner.

Out: docs pages on the website itself; a blog; analytics; a brand switcher or a text-direction switch for the site; a Figma library; an MCP server.

## 3. Milestones

The milestones are inside the roadmap's Phase 9 (`01-vision-and-goals.md` §13). Each ends with a review in the running site and Storybook (desktop, tablet and phone; light and dark; reduced motion; keyboard only).

### Done

| Deliverable | Status |
|---|---|
| Repository settings, community files, the domain on GitHub Pages over HTTPS, the Pages workflow with Storybook at `/storybook/` ([05-open-items.md](./05-open-items.md)) | Done |
| **M0, the foundation**: the design direction ([02-structure.md](./02-structure.md) §3), `apps/docs` (Astro 7 with React and MDX), the page shell, the shared mode and fonts, view transitions, the Storybook bridge, the pipeline, the link check and accessibility scan, the lint rule keeping animation libraries out of `packages/*` | Built |
| **M1, the docs core** under the first plan: docs pages on the site, Pagefind search, Markdown copies, the first illustrations, the 404 | Built; its pages are ported to Storybook (S1) and the site is trimmed (S2) |
| **S1, Storybook docs**: the sidebar groups, the ported and merged pages, Getting started split with a "moved" page, the Accessibility guide and statement merged, the generated Changelog, indexing with a sitemap and `robots.txt`, the "dbM system" logo in a light and a dark file | Built (`07-storybook-and-documentation-standards.md` §11) |

The site is built and checked on every push and is not yet published at the root: the workflow's `PUBLISH_DOCS_SITE` switch stays off until S3.

### S1 — Storybook docs

Built; see the table above and `07-storybook-and-documentation-standards.md` §11. What remains for the search-engine setup is on the site's side: its build takes Storybook's `robots.txt` and merges the sitemap (S2), and the Markdown copies and `llms.txt` are S4.

### S2 — Site trim and header

The site becomes the home page, the 404 and the agent files ([02-structure.md](./02-structure.md) §1); the new header (logo, version, Docs and Foundations menus, the Components link, search, mode, Storybook, GitHub, the phone drawer); search over Storybook's index; the light and dark toggle that starts light ([ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md)).

### S3 — Home page

Built from [03-landing-page-brief.md](./03-landing-page-brief.md) section by section over review rounds, with expressive motion ([ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md)). Done when the maintainer calls it done; the site then goes live at the root.

### S4 — Agent files

`/manifest.json`, `llms.txt`, `llms-full.txt` and a Markdown copy of each Storybook Docs page, generated at build ([02-structure.md](./02-structure.md) §6).

## 4. What blocks what

- S1 (built) waited on nothing. S2's menus and search point at S1's pages.
- S3 needs S2's header and the All components data; its sections link into S1's pages.
- S4 reads S1's MDX, so it follows S1; it may run beside S3.
- The site's M1 pages stay until S2 removes them; their content is already in Storybook (S1), so nothing disappears in between.
- A change to a DBM component or token found while building waits on the maintainer's confirmation.

## 5. Risks

| Risk | What reduces it |
|---|---|
| Search engines index Storybook's JavaScript-rendered docs only partly | The plain-text copies and `llms-full.txt` generated from the same MDX (S4), and a sitemap ([ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)) |
| The home page becomes heavy with expressive motion | CSS first; Motion only for pointer and spring interaction and only on the home page; its weight is reported in the build log and reviewed by hand each round |
| Scroll timelines unsupported in a reader's browser | Every scroll animation is inside `@supports`; such a browser gets the complete static page |
| A Storybook upgrade breaks the bridge, the sidebar order or the indexing setup | Configuration and head files only, no Storybook internals; rechecked in the upgrade checklist |
| Storybook's Docs pages fall below the home page's quality | They get the same review rounds as the home page in S1 |
| The docs promise things that are not built | Each such item is labelled in the page itself; the Accessibility guide lists the known exceptions |
| One maintainer | A small site, generated content where possible, every gate automated |

## 6. How the work is run

- One milestone at a time, each verified in a browser (and the pipeline in a real run) before it is called done.
- The site uses DBM components and tokens. A new component, a change to one, or a new token is raised with the maintainer before it is made; the site never hardcodes a value instead.
- The home page is built from the brief and tightened in review rounds against the running page.
- A decision that is a real fork in the road gets an ADR; routine choices are recorded in the commit message.
- Nothing is pushed without an explicit go-ahead (`CLAUDE.md`).
