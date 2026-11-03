# Docs website — open items

Assumptions to confirm, questions not yet decided, and the settings the maintainer changes outside the repository. Remove an item here when it is settled, and record a real decision as an ADR.

## 1. Settings changed outside the repository

These are done on GitHub or at the domain's providers. Nothing here is a secret; the values and logins are in the private notes ([06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md)).

| Setting | Wanted state | Status |
|---|---|---|
| Pull-request creation | Limited to collaborators ([ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)) | Not done |
| Issues | On, with the templates | Not done |
| Private vulnerability reporting | On | Not done |
| Workflows from forks | Approval required, no secrets available to them | Not checked |
| Pages source | GitHub Actions | Not done |
| Pages custom domain | `dbm-system.com`, HTTPS enforced | Not done |
| Domain verification | Verified on the GitHub account with a DNS TXT record | Not done |
| DNS records | The apex and `www` pointed at GitHub Pages as GitHub's current documentation says | Not done |
| npm organisation | The `dbm-system` organisation exists, with two-factor authentication on its owner (`01` §13 Phase 8) | Not checked |

## 2. Assumptions to confirm

- **The site's one brand is Purple**, in light, dark and system mode. Only mode is a reader control.
- **Which guardrails the landing page keeps.** Reduced motion and content-before-script are required. No scroll-jacking, a script and weight budget, and lighter effects on phones were offered and not adopted; with no budget in CI, the page's weight is a hand review.
- **Phase A starts before Phase 8**, with the Installation and For AI agents sections labelled "in active development, not yet published".
- **GSAP's current licence terms** fit the project's use. Re-read them before the first release.

## 3. Questions not yet decided

| Question | Notes |
|---|---|
| **Foundations in two places.** The ten pages stay in Storybook and are also on the docs website. | They share their data, not their prose. Keep both, or point the docs website at Storybook's pages? |
| **How the landing page shows two brands** when the reader only controls mode | The theme is document-wide, so two brands cannot appear together without a scoped demo, pre-rendered images or a frame. Decide in the first landing review. |
| **Old Storybook guide links** after the guides move | A stub that points to the new page, or let them break. |
| **Whether `/storybook/` is indexed** by search engines | Both are the same project; Storybook's own pages are numerous and thin. |
| **The site's name, description and tagline** | Used in metadata and the social images. |
| **How social images are generated** | A build step in `apps/docs/scripts`; the tool is chosen when it is built. |
| **The Node and pnpm versions** the docs build uses | Match the repository's; the workflow declares them. |
| **Whether `/templates` exists before a template does** | A placeholder page, or hide it until the first template. |
| **Component page layout** | The sections of a page, and which come from the manifest. Decided when the manifest schema exists. |
| **How the changelog page reads Changesets** | Decided when the release pipeline is wired. |

## 4. Gaps this plan depends on

- **Phase 8 outputs:** the manifest schema, the publish pipeline, the Changesets wiring and the consumer stylesheet and token loading decision (`01-vision-and-goals.md` §12 and §13).
- **Templates:** none built; the Templates pages wait on them.
- **Ports:** every guide uses Storybook-only blocks ([04-content-inventory.md](./04-content-inventory.md)); the port is real work.
- **Local development:** how a contributor runs the docs app and Storybook side by side (ports, a launch entry) is decided with the skeleton.
- **No analytics** means no reader numbers. A later change needs a new ADR.
