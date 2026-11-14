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
| The site's brand | Purple, in light, dark and system mode; only mode is a reader control | [02-structure.md](./02-structure.md) §5 |
| Landing-page guardrails | Reduced motion (a static, complete page) and content before script are required; nothing else is. Weight and motion are judged in review | [03-landing-page-brief.md](./03-landing-page-brief.md) §5 |
| Showing two brands | Side by side, with live Storybook stories, one frame per brand (Storybook takes the brand in its URL) | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Old Storybook guide links | A short "this page has moved" page at each old address, linking to the new one | [04-content-inventory.md](./04-content-inventory.md) §4 |
| Search engines and `/storybook/` | Not indexed | [02-structure.md](./02-structure.md) §10 |
| Tagline | "The agentic component library for people and the AI agents that build with them." | [03-landing-page-brief.md](./03-landing-page-brief.md) §3 |
| Site description (meta) | The one-sentence wording in [01-vision-and-goals.md](../01-vision-and-goals.md) §1, trimmed to about 155 characters at build | The first landing review |
| Phase A before Phase 8 | Yes, with the unpublished sections labelled "in active development, not yet published" | [01-plan.md](./01-plan.md) |
| GSAP's licence | Read at adoption: free including commercial use, ScrollTrigger included, not described as open source (the recorded exception); pin the version, because terms can change for newer versions | [02-structure.md](./02-structure.md) §8 |
| Node and pnpm | The repository's: Node 24 from `.nvmrc` and the pinned pnpm, which CI already reads | [02-structure.md](./02-structure.md) §3 |
| `/templates` before a template exists | Moot: Phase 7 builds the first templates before the docs site | [01-plan.md](./01-plan.md) |

## 3. Questions not yet decided

Each of these is decided when the work it waits on starts.

| Question | Waits on |
|---|---|
| How social images are generated | The social-image build step; the tool is chosen when it is built |
| Component page layout | The docs site skeleton (Phase 9); the manifest, its schema and its per-component files exist ([ADR-0206](../adr/0206-the-manifest-is-also-shipped-as-an-index-and-one-file-per-component-beside-the-whole-file-over-the-single-file-alone-or-waiting-for-an-mcp-server.md)) |
| How the changelog page reads Changesets | The release pipeline (Phase 8) |
| The hero's visual concept and the page's length | The first landing review |

## 4. Gaps this plan depends on

- **Phase 8 outputs:** the manifest and its schema are built and ship in the package; the publish pipeline, the Changesets wiring and the consumer stylesheet and token loading (decided, not built, [ADR-0175](../adr/0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)) are not (`01-vision-and-goals.md` §12 and §13).
- **Templates:** two shells ship and three story-only pages are built (`04-component-inventory.md`); the rest of the Templates pages wait on the templates still to build.
- **Ports:** every guide uses Storybook-only blocks ([04-content-inventory.md](./04-content-inventory.md)); the port is real work.
- **Local development:** how a contributor runs the docs app and Storybook side by side (ports, a launch entry) is decided with the skeleton.
- **No analytics** means no reader numbers. A later change needs a new ADR.
