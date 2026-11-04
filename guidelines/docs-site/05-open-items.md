# Docs website — open items

Assumptions to confirm, questions not yet decided, and the settings the maintainer changes outside the repository. Remove an item here when it is settled, and record a real decision as an ADR.

## 1. Settings changed outside the repository

These are done on GitHub or at the domain's providers. Nothing here is a secret; the values and logins are in the private notes ([06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md)).

| Setting | Wanted state | Status |
|---|---|---|
| Pull-request creation | Limited to collaborators ([ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)) | Done (pull requests on, creation `collaborators_only`) |
| Issues | On, with the templates | Setting done; the templates are Phase A files, not yet written |
| Private vulnerability reporting | On | Done |
| Workflows from forks | Approval required, no secrets available to them | Checked: approval is required for all outside contributors |
| Pages source | GitHub Actions | Done |
| Pages custom domain | `dbm-system.com`, HTTPS enforced | Done: the certificate covers the apex and `www`, HTTPS is enforced, and `www` redirects to the apex. `http://dbm-system.com` still answered 404 with nothing deployed, so check that it redirects to HTTPS after the first deployment |
| Domain verification | Verified on the GitHub account with a DNS TXT record | Done |
| DNS records | The apex and `www` pointed at GitHub Pages as GitHub's current documentation says | Done: four A and four AAAA records on the apex, a `www` CNAME; the email forwarding records are untouched |
| npm organisation | The `dbm-system` organisation exists, with two-factor authentication on its owner (`01` §13 Phase 8) | Done: the organisation exists, and two-factor is on for the account and required for the organisation |

## 2. Settled

Recorded here so they are not re-asked; the detail is in the file named.

| Item | Decision | Where |
|---|---|---|
| The site's brand | Purple, in light, dark and system mode; only mode is a reader control | [02-structure.md](./02-structure.md) §5 |
| Landing-page guardrails | Reduced motion (a static, complete page) and content before script are required; nothing else is. Weight and motion are judged in review | [03-landing-page-brief.md](./03-landing-page-brief.md) §5 |
| Showing two brands | Side by side, with live Storybook stories, one frame per brand (Storybook takes the brand in its URL) | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Old Storybook guide links | A short "this page has moved" page at each old address, linking to the new one | [04-content-inventory.md](./04-content-inventory.md) §4 |
| Search engines and `/storybook/` | Not indexed | [02-structure.md](./02-structure.md) §10 |
| Tagline | "A design system for people and the agents that build with them." | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Phase A before Phase 8 | Yes, with the unpublished sections labelled "in active development, not yet published" | [01-plan.md](./01-plan.md) |
| GSAP's licence | Read at adoption: free including commercial use, ScrollTrigger included, not described as open source (the recorded exception); pin the version, because terms can change for newer versions | [02-structure.md](./02-structure.md) §8 |
| Node and pnpm | The repository's: Node 24 from `.nvmrc` and the pinned pnpm, which CI already reads | [02-structure.md](./02-structure.md) §3 |
| `/templates` before a template exists | Moot: Phase 7 builds the first templates before the docs site | [01-plan.md](./01-plan.md) |

## 3. Questions not yet decided

All of these wait on work that has not started, and each is decided when that work does.

| Question | Waits on |
|---|---|
| The site's description (the one-sentence meta description) | The first landing review; a starting point is "A React component library for accessible web and enterprise applications, built on design tokens, for people and AI coding agents." |
| How social images are generated | The social-image build step; the tool is chosen when it is built |
| Component page layout | The manifest schema (Phase 8) |
| How the changelog page reads Changesets | The release pipeline (Phase 8) |
| The hero's visual concept and the page's length | The first landing review |

## 4. Gaps this plan depends on

- **Phase 8 outputs:** the manifest schema, the publish pipeline, the Changesets wiring and the consumer stylesheet and token loading decision (`01-vision-and-goals.md` §12 and §13).
- **Templates:** none built; the Templates pages wait on them.
- **Ports:** every guide uses Storybook-only blocks ([04-content-inventory.md](./04-content-inventory.md)); the port is real work.
- **Local development:** how a contributor runs the docs app and Storybook side by side (ports, a launch entry) is decided with the skeleton.
- **No analytics** means no reader numbers. A later change needs a new ADR.
