# Docs website — open items

Assumptions to confirm, questions not yet decided, and the settings the maintainer changes outside the repository. Remove an item here when it is settled, and record a real decision as an ADR.

## 1. Settings changed outside the repository

These are done on GitHub or at the domain's providers. Nothing here is a secret; the values and logins are in the private notes ([06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md)).

| Setting | Wanted state | Status |
|---|---|---|
| Pull-request creation | Limited to collaborators ([ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)) | Done (pull requests on, creation `collaborators_only`) |
| Issues | On, with the templates | Done: setting on; templates (bug, feature, docs problem) written in `.github/ISSUE_TEMPLATE/` |
| Private vulnerability reporting | On | Done |
| Workflows from forks | Approval required, no secrets available to them | Checked: approval is required for all outside contributors |
| Pages source | GitHub Actions | Done |
| Pages custom domain | `dbm-system.com`, HTTPS enforced | Done: the certificate covers the apex and `www`, HTTPS is enforced, and `www` redirects to the apex. Checked live after the first deployment (2026-11-04): `http://` redirects to HTTPS on the apex and on `/storybook/`, `www` redirects to the apex, `/storybook/` and its `index.json` serve, unknown paths return 404 |
| Domain verification | Verified on the GitHub account with a DNS TXT record | Done |
| DNS records | The apex and `www` pointed at GitHub Pages as GitHub's current documentation says | Done: four A and four AAAA records on the apex, a `www` CNAME; the email forwarding records are untouched |
| npm organisation | The `dbm-system` organisation exists, with two-factor authentication on its owner (`01` §13 Phase 8) | Done: the organisation exists, and two-factor is on for the account and required for the organisation |

## 2. Settled

Recorded here so they are not re-asked; the detail is in the file named.

| Item | Decision | Where |
|---|---|---|
| Where the docs live | Storybook; the website is the home page, the 404 and the agent files | [ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) |
| Storybook's sidebar | Getting started, Guides, Resources, Foundations, then Atoms, Molecules, Organisms and Templates; no component address changes | [02-structure.md](./02-structure.md) §2 |
| The header | Logo and version; Docs and Foundations menus and a Components link into Storybook; search, mode, Storybook, GitHub. On the home page only | [02-structure.md](./02-structure.md) §1 |
| Search | `CommandPalette` over Storybook's `index.json`; Pagefind goes | [ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) |
| Search engines | Storybook's Docs pages indexed, its canvases not; a sitemap; plain-text copies for agents | [ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md) |
| The logo | The "dbM system" wordmark, token-coloured: inline on the site, a light and a dark file generated from the tokens in Storybook | [ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md) |
| Mode | A light and dark toggle; a first visit is light; shared with Storybook | [ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md) |
| The site's brand | Purple; only mode is a reader control | [02-structure.md](./02-structure.md) §3 |
| Milestones | S1 Storybook docs, S2 site trim and header, S3 home page (live at the end), S4 agent files | [01-plan.md](./01-plan.md) §3 |
| Motion | Expressive on the home page with Motion allowed for pointer and spring interaction; calm in Storybook; reduced motion static, content before script, no scroll-jacking, `@supports` around scroll animation | [ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md), [02-structure.md](./02-structure.md) §5 |
| Design direction | "An annotated instrument": purple as ink, Lora headlines with Nunito and mono notes, editorial asymmetry, the annotation motif, an avoid list | [02-structure.md](./02-structure.md) §3 |
| Home page | Seven sections: Hero, Built for agents, Specification, All components, the theme card, Accessible and responsive, Start in three steps; numbers and lists generated at build | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| All components | A Storybook page under Getting started, and a filterable section on the home page, both from the same data | [02-structure.md](./02-structure.md) §2 |
| Accessibility guide and statement | One page under Guides | [04-content-inventory.md](./04-content-inventory.md) §1 |
| Illustrations and 3D | Geometric SVG and CSS 3D compositions of live components, in the brand's tonal range with the neutrals; no WebGL | [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md) |
| Showing two brands | The token theme files re-scoped to a wrapper element at build, so the theme card can wear each theme | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Fonts | Self-hosted Nunito and Lora for the site and Storybook | [ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md) |
| DBM changes found while building | A new or changed component or token is raised with the maintainer first; the site never hardcodes a value instead | [01-plan.md](./01-plan.md) §6 |
| Changed Storybook addresses | A short "this page has moved" page at each old address | [04-content-inventory.md](./04-content-inventory.md) §4 |
| Markdown copies | No "Copy page" button or "View as Markdown" link, at the maintainer's decision; the copies exist for agents | [02-structure.md](./02-structure.md) §6 |
| Tagline | "The agentic component library for people and the AI agents that build with them." | `01-vision-and-goals.md` §1 |
| Node and pnpm | The repository's: Node 24 from `.nvmrc` and the pinned pnpm | [02-structure.md](./02-structure.md) §9 |
| Local development | `pnpm --filter @dbm-system/docs dev` (the `docs` entry in `.claude/launch.json`, port 4321); the `site-artifact` entry serves the assembled site with Storybook on one origin | `apps/docs/README.md` |
| Going live | The site replaces the placeholder at `/` at the end of S3, by the Pages workflow's `PUBLISH_DOCS_SITE` switch | [02-structure.md](./02-structure.md) §9 |

## 3. Questions not yet decided

| Question | Waits on |
|---|---|
| `Sidebar` draws its section labels in capitals, which the design direction's avoid list names; changing it is a change to the design system | The maintainer's decision |
| The components package doesn't mark its modules `"use client"`, so in the Next.js App Router they must be imported from a file that does (the Frameworks page says so); marking them would be a change to the design system | The maintainer's decision |
| How the Markdown copies render Storybook blocks (tables, callouts, the component index) as text | S4 |
| How Storybook's story canvases are kept out of results (a `noindex` in the iframe page, `robots.txt` rules on `iframe.html`, or both) | S1 |
| Whether the brand tonal range needs decorative tokens beyond the semantic ones for the 3D stack and illustrations | S3; raised with the maintainer if so |

## 4. Gaps this plan depends on

- **Phase 8 outputs:** all built and shipped: the manifest and its split files, the publish pipeline (`0.1.x` is on npm with provenance) and the consumer stylesheet and token loading ([ADR-0175](../adr/0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)).
- **Search engines and Storybook:** its pages render with JavaScript inside an iframe, so indexing is partial until the plain-text copies exist (S4).
- **No analytics** means no reader numbers. A later change needs a new ADR.
