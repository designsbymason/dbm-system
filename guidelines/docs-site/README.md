# Docs website — internal reference

The plan, structure and supporting references for the DBM System documentation website, `https://dbm-system.com`, and for how Storybook sits beside it at `/storybook/`. These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** Phase A is under way (`01-plan.md`). Done: the repository settings, the community files and issue templates, the domain, and a combined Pages deployment that publishes a placeholder page at `https://dbm-system.com` and Storybook at `/storybook/`. Not started: the `apps/docs` skeleton (still a placeholder), Phase 7 templates, the landing page. Component pages follow the manifest (Phase 8).

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, phases, what blocks what, risks, and what "done" means for each phase |
| [02-structure.md](./02-structure.md) | Site map and URLs, repository layout, the build and deploy pipeline, how Storybook fits, dependencies, quality gates, search and the agent files |
| [03-landing-page-brief.md](./03-landing-page-brief.md) | The brief for the premium landing page: audience, tone, sections, motion, and the rules it must keep |
| [04-content-inventory.md](./04-content-inventory.md) | Every page that exists today and where it goes, the Storybook-only blocks to port, and the new pages to write |
| [05-open-items.md](./05-open-items.md) | Assumptions to confirm, open questions, and the settings the maintainer changes outside the repository |
| [06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md) | What is gitignored and why, and what belongs in the private notes folder instead of here |

## The decisions behind them

| ADR | Decision |
|---|---|
| [0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md) | Astro with React islands, one GitHub Pages site on the apex, Storybook at `/storybook/`, deploy on push to `main`, Pagefind, no analytics |
| [0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md) | Manifest for facts, MDX for prose, the guides move out of Storybook, flat component URLs |
| [0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md) | Pull requests for collaborators only, Issues on |
| [0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md) | Docs app dependencies listed and justified, GSAP allowed for the landing page |

## Rules for this folder

- **This folder is public and permanent**, like the rest of `guidelines/`: the repository is public and its history is not forgotten. Never put a secret, a credential, an account identifier, a registrar or DNS login, a private email address, or anything about a person who has not published it here. `06-gitignore-and-private-notes.md` says where that material goes instead.
- A fact lives in **one** place. Link to it from the other files rather than repeating it.
- Keep a file current as the work lands; do not add dated "updated" notes.
