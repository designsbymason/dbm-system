# Docs website — plan

**Decided in:** [ADR-0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md), [ADR-0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md), [ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md), [ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md). Structure is in [02-structure.md](./02-structure.md).

## 1. Goals

1. A **front door** for DBM System at `dbm-system.com` that makes a first impression worthy of the system, and says plainly what it is (an agentic component library for people and AI agents): premium, fast, accessible, and honest about what is and is not published yet.
2. A **complete reference** for a person or an agent who wants to adopt it: install, theme, guides, every component and template, the changelog.
3. **Agent legibility**: the manifest, `llms.txt`, `llms-full.txt` and a consumer `AGENTS.md` at stable URLs (`01-vision-and-goals.md` §13.1).
4. A site that **uses DBM itself**: its chrome is DBM components and tokens, so the docs site is the system's largest real test.
5. **Storybook stays the workshop**: Playground, controls and tests for every component, at `/storybook/`, linked from every component page.

## 2. Scope of the first release

In: the landing page, the Docs section (Getting started and Installation, Guides, a Foundations overview that links into Storybook, For AI agents, Changelog, Accessibility statement and browser support), the Components index and pages, the Templates index, a 404, search, light and dark and system mode, the community files, the quality gates.

Out for now: a blog, analytics, a brand switcher or a text-direction switch on the site, versioned docs (from 1.0), a Figma library, an MCP server.

## 3. Phases

The phases here are the docs website's own. They sit inside the roadmap's Phase 8 (manifest and publish) and Phase 9 (surface expansion), in `01-vision-and-goals.md` §13.

### Phase A — skeleton, landing page and pipeline (starts now; needs nothing unbuilt)

**Order within it:** the repository settings, the community files and a minimal Pages deployment come first (they prove the pipeline and settle the subpath and redirect checks). **Roadmap Phase 7, the first templates, then runs before the landing page**, because the live showcase should be built from real compositions such as a dashboard shell (`01-vision-and-goals.md` §13). The `apps/docs` skeleton and the landing page follow it.

| Deliverable | Done when |
|---|---|
| Repository settings | Pull requests limited to collaborators, Issues on, private vulnerability reporting on (`05-open-items.md`) |
| Community files | Issue templates, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` exist |
| Domain on GitHub Pages | `https://dbm-system.com` serves a Pages site over HTTPS, `www` redirects to the apex, the domain is verified |
| `apps/docs` skeleton | An Astro app with the React and MDX integrations builds, with the layout, the navigation and light, dark and system mode, using DBM components and tokens |
| Combined Pages workflow | One workflow builds the docs site and `storybook-static` and publishes docs at `/` and Storybook at `/storybook/` on every push to `main` |
| Storybook subpath check | Storybook works under `/storybook/`: assets, the iframe, the Getting started page's index fetch, deep links |
| Landing page | Built from the brief in [03-landing-page-brief.md](./03-landing-page-brief.md) over several review rounds, with the not-yet-published states labelled |
| Docs shell pages | Placeholders with honest "in active development, not yet published" states for Installation and For AI agents |
| Search | Pagefind index built and wired into the layout |
| Quality gates | Link check and an accessibility scan of the key pages run in CI |
| Storybook trimmed | Getting started becomes a pointer to the docs website; the guides move (the move waits until their pages exist on the site), each leaving a "moved" page; `/storybook/` is marked not to be indexed |

### Phase B — after Phase 8 (manifest and first publish)

| Deliverable | Done when |
|---|---|
| Manifest at a stable URL | `/manifest.json` is built or copied from `packages/manifest` |
| Component pages | `/components/<name>` for every component, props and variants from the manifest, prose from MDX, a link to its Storybook page |
| Component coverage check | CI fails when a component in the manifest has no docs page |
| Installation | The Installation page is real, once the consumer stylesheet and token loading decision is made (`01` §12) |
| Agent files | `llms.txt`, `llms-full.txt` and the consumer `AGENTS.md` are published |
| Changelog | Generated from Changesets, under Docs |
| Release-version builds | A release build installs the published packages and tests them in a fresh app |

### Phase C — 1.0

Versioned docs under `/v1/`, `/v2/` and so on; a build that deploys from release tags; Templates pages as templates are built (`04-component-inventory.md`, Templates).

## 4. What blocks what

- Component pages, Installation, the agent files and the changelog **wait on Phase 8**: the manifest, the publish pipeline and the consumer CSS decision.
- The skeleton, the landing page, the pipeline, the community files and the domain **wait on nothing** and can start at once.
- Moving the guides off Storybook waits on their pages existing on the site; until then Storybook's pages stay, so nothing disappears.

## 5. Risks

| Risk | What reduces it |
|---|---|
| The landing page becomes heavy or slow with motion | The brief asks for a hand review of weight and script size; no CI budget was adopted ([ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)), so it needs checking by hand each round |
| Storybook does not work under `/storybook/` | A subpath check in Phase A, before anything depends on it |
| The guides are ported badly (Storybook-only blocks) | The port list in [04-content-inventory.md](./04-content-inventory.md) and a visual check of each page |
| The docs promise things that are not published | Every unpublished item is labelled in the page itself; the accessibility page states the known exceptions |
| GSAP's licence terms change | Re-read before the first release; the fallback is Motion with CSS ([ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)) |
| One maintainer | Keep the pipeline small and the content mostly generated; every gate is automated |

## 6. How the work is run

- One phase deliverable at a time, each verified in a browser (and the pipeline in a real run) before it is called done.
- The landing page is built from the brief and tightened in review rounds against the running page.
- A decision that is a real fork in the road gets an ADR; routine choices are recorded in the commit message.
- The maintainer commits and pushes; nothing is pushed without an explicit go-ahead (`CLAUDE.md`).
