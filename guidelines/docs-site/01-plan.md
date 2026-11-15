# Docs website — plan

**Decided in:** [ADR-0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md), [ADR-0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md), [ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md), [ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md) (its dependency rule; its GSAP part is superseded), [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) to [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md). Structure is in [02-structure.md](./02-structure.md).

## 1. Goals

1. A **front door** for DBM System at `dbm-system.com` that says plainly what it is (an agentic component library for people and AI agents) and makes a first impression worthy of the system: premium, professional, calm and precise.
2. **One quality bar for every page.** The docs pages, the component pages and Storybook get the same care as the landing page: one design language, one type hierarchy, one motion system.
3. **Alive, not busy.** Motion, micro-interactions and scroll-driven choreography explain structure and never delay reading ([ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)). SVG illustrations and CSS 3D compositions of live components, drawn from the tokens, carry the ideas ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)).
4. **One site with Storybook.** Moving between the docs and Storybook keeps the mode, the type and the colours, without a flash ([ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)).
5. A **complete reference** for a person or an agent adopting DBM: install, frameworks, theme, guides, every component, hook, function and template, the changelog.
6. **Agent legibility**: the manifest, per-component JSON, `AGENTS.md`, a Markdown copy of every page, `llms.txt` and `llms-full.txt` at stable URLs (`01-vision-and-goals.md` §13.1).
7. **Dogfooded**: the site's chrome is DBM components and tokens, so the site is the system's largest real test. A gap found in DBM is raised with the maintainer before anything in the system changes.
8. **Honest and fast**: nothing promised that is not built; static HTML with islands only where something is interactive; WCAG 2.2 AA; reduced motion gives a complete static page.

## 2. Scope of the first release

In: the landing page; Docs (home, Introduction, Installation, Quick start, Frameworks, the six guides, Foundations overview); Resources (Changelog with an RSS feed, Roadmap, FAQ, Accessibility statement); the Components index and a page per component, hook and function; the Templates index and pages; AI agents and the agent files; the 404; search; light, dark and system mode; a release banner; the Storybook bridge; the quality gates.

Later: "Edit this page" and "Last updated" on docs pages; a brand switch on component examples (revisited after M2); a grid view of the component index with a glyph per component; a tokens page; recipes built from the template pages; versioned docs (from 1.0).

Out: a blog, analytics, a brand switcher or a text-direction switch for the site itself, a Figma library, an MCP server.

## 3. Milestones

The milestones are the docs website's own, inside the roadmap's Phase 9 (`01-vision-and-goals.md` §13). Phase 8 is done, so nothing here waits on it. Each milestone ends with a review in the running site (desktop, tablet and phone; light and dark; reduced motion; keyboard only) and is deployed before the next starts. The order puts the design language on many real pages before the landing page, so the landing page can link to real component pages.

### Done before the milestones

| Deliverable | Status |
|---|---|
| Repository settings: pull requests for collaborators, Issues, private vulnerability reporting ([05-open-items.md](./05-open-items.md)) | Done |
| Community files: issue templates, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` | Done |
| Domain on GitHub Pages over HTTPS, `www` redirecting to the apex | Done |
| Pages workflow publishing a placeholder at `/` and Storybook at `/storybook/` | Done |
| Storybook under the subpath: assets, the index fetch, the HTTP to HTTPS redirect | Done; deep links and the logo are fixed in M0 |
| The first templates the site's layouts and showcase use (`AppShell`, `PageShell`, the Documentation Page and Marketing Page recipes) | Done |

### M0 — Foundation

| Deliverable | Done when | Status |
|---|---|---|
| Design direction | First, before any layout: a short direction page (concept, type roles, colour use, the annotation motif, motion, the avoid list; [02-structure.md](./02-structure.md) §3) and one sample page built in it, approved by the maintainer. Checked against the avoid list | Done: approved, with its four changes to the brief and the paper, logo and icon-button tweaks; the direction page is `/direction` (not indexed) |
| `apps/docs` | An Astro app with the React and MDX integrations builds, with a local dev entry in `.claude/launch.json` beside Storybook's | Done: Astro 7; `docs` and `site-artifact` entries in `.claude/launch.json` |
| Layouts | The three page types (Marketing, Article, Reference) on `PageShell` ([02-structure.md](./02-structure.md) §3), with the header, the large menus, the phone drawer, breadcrumbs and the footer | Done for Marketing and Article (the shell in `apps/docs/src/components/shell/`, the map in `src/data/site.ts`); Reference is built on Article in M2 |
| Mode | Light, dark and system, chosen by the reader, remembered, with no flash on load | Done; shared with Storybook |
| Fonts | Self-hosted Nunito and Lora ([ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md)) | Done, for the site and Storybook |
| Motion layer | View transitions, the CSS scroll-reveal and reading-progress primitives, reduced motion ([02-structure.md](./02-structure.md) §5) | View transitions, reduced motion and the reading-progress line done; the illustration reveal comes with the first illustrations (M1) |
| Storybook bridge | The six items in [02-structure.md](./02-structure.md) §4, checked in both directions in the combined artifact | Done and checked both ways in the combined artifact, except the two links between component pages, which come in M2 |
| Pipeline | The Pages workflow builds the site and Storybook into one artifact | Done: every push builds and checks the site; it is published at `/` when `PUBLISH_DOCS_SITE` is switched on after M1 |
| Gates | Link check and accessibility scan in CI; the lint rule keeping animation libraries out of `packages/*` | Done: link check and accessibility scan in the Pages workflow; the lint rule in `packages/eslint-config` |

### M1 — Docs core

Docs home, Introduction, Installation, Quick start, Frameworks, the Foundations overview, AI agents, the Accessibility statement, FAQ, Roadmap and the 404; search (Pagefind behind `CommandPalette`); previous and next links; the first illustrations. Done when each page is live and reviewed.

### M2 — Components

The `/components` index; a page for every component, hook and function from the manifest, with live examples from the stories ([ADR-0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)); the coverage gate; per-component JSON and the Markdown copies. Done when the coverage gate passes.

### M3 — Landing page

Built from [03-landing-page-brief.md](./03-landing-page-brief.md) section by section over review rounds, CSS first, with Motion only for an interaction a round agrees CSS cannot do; the hero and section illustrations. Done when the maintainer calls it done.

### M4 — Guides and templates

The six guides ported from Storybook (their demos as islands); the Templates index and pages; Storybook trimmed: its Getting started becomes a pointer, and each moved guide leaves a "moved" page.

### M5 — Agents and polish

`llms.txt` and `llms-full.txt`; the Changelog and its RSS feed; social images; the release banner; print styles; a full accessibility and performance pass.

## 4. What blocks what

- M0 waits on nothing. Every later milestone needs M0's layouts and pipeline.
- M2 needs the manifest (built and shipped) and the stories; a story that depends on Storybook-only parts needs a site-safe form first ([ADR-0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)).
- M3 links to the component pages, so it follows M2.
- Moving the guides off Storybook waits on their pages existing on the site; until then Storybook keeps them, so nothing disappears.
- A change to a DBM component or token found while building waits on the maintainer's confirmation.

## 5. Risks

| Risk | What reduces it |
|---|---|
| The landing page becomes heavy or slow with motion | CSS first; Motion only by agreement; its weight is reported in the build log each round and reviewed by hand |
| Scroll timelines unsupported in a reader's browser | Every scroll animation is inside `@supports`; such a browser gets the complete static page |
| Storybook does not work under `/storybook/`, or the bridge breaks on a Storybook upgrade | The bridge uses configuration and head files, not Storybook internals, and is rechecked in the upgrade checklist |
| A story cannot render outside Storybook | The page shows a different story or a site-safe form is added ([ADR-0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)) |
| The guides are ported badly (Storybook-only blocks) | The port list in [04-content-inventory.md](./04-content-inventory.md) and a visual check of each page |
| The docs promise things that are not built | Each such item is labelled in the page itself; the accessibility statement lists the known exceptions |
| One maintainer | A small pipeline, generated content where possible, every gate automated |

## 6. How the work is run

- One milestone at a time, each verified in a browser (and the pipeline in a real run) before it is called done.
- The site uses DBM components and tokens. A new component, a change to one, or a new token is raised with the maintainer before it is made; the site never hardcodes a value instead.
- The landing page is built from the brief and tightened in review rounds against the running page.
- A decision that is a real fork in the road gets an ADR; routine choices are recorded in the commit message.
- The maintainer commits and pushes; nothing is pushed without an explicit go-ahead (`CLAUDE.md`).
