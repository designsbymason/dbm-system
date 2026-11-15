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
| The site's brand | Purple, in light, dark and system mode; only mode is a reader control | [02-structure.md](./02-structure.md) §3 |
| Navigation and URLs | Docs, Components, Templates, AI agents, Storybook; Resources at root URLs; hooks and functions get pages; components by category | [ADR-0213](../adr/0213-the-docs-site-is-navigated-by-docs-components-templates-ai-agents-and-storybook-with-project-pages-and-agent-files-at-short-root-urls-over-one-docs-section-holding-everything.md) |
| Milestone order | Foundation, docs core, components, then the landing page, then guides and templates, then agents and polish | [01-plan.md](./01-plan.md) §3 |
| Animation | CSS first; no GSAP; Motion only for an interaction CSS cannot do, agreed in a review round | [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) |
| Motion guardrails | Reduced motion gives a static, complete page; content before script; no scroll-jacking; motion tokens; reveals once on docs pages; `@supports` around scroll animation | [02-structure.md](./02-structure.md) §5 |
| Design direction | "An annotated instrument": purple as ink, Lora headlines with Nunito and mono notes, editorial asymmetry, sparing annotation, restrained motion, an avoid list; professional first, personality in three places | [02-structure.md](./02-structure.md) §3 |
| Home page | Nine sections from the hero's CSS 3D stack to Where next, numbers generated at build, three signature scroll moments | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 and §5 |
| Human / Agent view | On the home page only, in the Built for agents section; elsewhere Copy page and the Markdown copies do that job | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Illustrations and 3D | Geometric SVG and CSS 3D compositions of live components, in the brand's tonal range with the neutrals; no WebGL | [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md) |
| Storybook and the site | Storybook keeps its interface; shared mode, fonts, transitions, logo and links both ways; the bridge's Storybook changes are part of M0 | [ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md) |
| Fonts | Self-hosted Nunito and Lora for the site and Storybook | [ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md) |
| Live examples | The Storybook stories, rendered with portable stories | [ADR-0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md) |
| Showing two brands | On the landing page, in the page itself: `ThemeProvider` scopes a brand around a live composition (replaces the earlier one-Storybook-frame-per-brand idea, which the in-page version makes unnecessary) | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| DBM changes found while building | A new or changed component or token is raised with the maintainer first; the site never hardcodes a value instead | [01-plan.md](./01-plan.md) §6 |
| Old Storybook guide links | A short "this page has moved" page at each old address | [04-content-inventory.md](./04-content-inventory.md) §4 |
| Search engines and `/storybook/` | Not indexed | [02-structure.md](./02-structure.md) §4 |
| Tagline | "The agentic component library for people and the AI agents that build with them." | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Site description (meta) | The one-sentence wording in [01-vision-and-goals.md](../01-vision-and-goals.md) §1, trimmed to about 155 characters at build | The first landing review |
| First-release extras | Copy page and Markdown copies; Roadmap and FAQ; a release banner and an RSS feed | [01-plan.md](./01-plan.md) §2 |
| Node and pnpm | The repository's: Node 24 from `.nvmrc` and the pinned pnpm | [02-structure.md](./02-structure.md) §9 |

## 3. Questions not yet decided

Each of these is decided when the work it waits on starts.

| Question | Waits on |
|---|---|
| The link checker and the accessibility scanner | M0 |
| How a contributor runs the site and Storybook side by side (ports, a launch entry), and how Storybook run alone loads the self-hosted fonts | M0 |
| Browser support for scroll timelines, confirmed against MDN's compatibility data | M0 |
| How a story that needs Storybook-only parts gets a site-safe form | M2 |
| How the changelog page reads each package's `CHANGELOG.md` | M5 (the files exist) |
| How social images are generated | M5 |
| Whether the brand tonal range needs decorative tokens beyond the semantic ones for the 3D stack and illustrations | The design-direction sample (M0); raised with the maintainer if so |
| The page's length (nine sections, or seven with 7 and 8 folded in) | The first landing review (M3) |
| A brand switch on component examples | After M2 |

## 4. Gaps this plan depends on

- **Phase 8 outputs:** all built and shipped: the manifest and its split files, the publish pipeline (`0.1.x` is on npm with provenance) and the consumer stylesheet and token loading ([ADR-0175](../adr/0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)).
- **Templates:** two shells ship and the first example pages are built (`04-component-inventory.md`); the rest of the Templates pages follow the templates still to build.
- **Ports:** every guide uses Storybook-only blocks ([04-content-inventory.md](./04-content-inventory.md)); the port is real work.
- **Stories as examples:** some stories may rely on Storybook-only parts; each needs a site-safe form before its page shows it.
- **No analytics** means no reader numbers. A later change needs a new ADR.
