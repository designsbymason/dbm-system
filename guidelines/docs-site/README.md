# Docs website — internal reference

The plan, structure and supporting references for `https://dbm-system.com`: the home page, and Storybook at `/storybook/`, which is the documentation ([ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)). These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** M0, the foundation, and M1, the docs core under the first plan, are built (`01-plan.md` §3). The plan is now: S1, Storybook docs; S2, site trim and header; S3, the home page, after which the site goes live at the root; S4, the agent files. Next: S1. Storybook is live at `/storybook/`; the site is built and checked on every push, with the placeholder still at the root.

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, the milestones, what blocks what, risks, and how the work is run |
| [02-structure.md](./02-structure.md) | The header, the site map and Storybook's sidebar, the design direction, the Storybook bridge, motion, the agent files, illustrations, the repository layout, build and deploy, dependencies, quality gates, SEO |
| [03-landing-page-brief.md](./03-landing-page-brief.md) | The brief for the home page: audience, what must stay true, the seven sections, look and feel, motion rules |
| [04-content-inventory.md](./04-content-inventory.md) | Where each piece of documentation goes in Storybook, what leaves the site, and the old addresses |
| [05-open-items.md](./05-open-items.md) | The settings changed outside the repository, what is settled, the questions not yet decided, and the gaps |
| [06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md) | What is gitignored and why, and what belongs in the private notes folder instead of here |

## The decisions behind them

| ADR | Decision |
|---|---|
| [0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md) | Astro with React islands, one GitHub Pages site on the apex, Storybook at `/storybook/`, deploy on push to `main`, no analytics |
| [0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md) | Pull requests for collaborators only, Issues on |
| [0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md) | Docs app dependencies listed and justified (its GSAP part superseded by 0212, its mode part by 0223) |
| [0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) | CSS scroll timelines and View Transitions first, no GSAP (when Motion may be added is superseded by 0222) |
| [0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md) | The Storybook bridge (its search-engine part superseded by 0221) |
| [0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md) | Self-hosted fonts for the site and Storybook |
| [0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md) | Illustrations: geometric SVG and CSS 3D compositions of live components, drawn from the tokens; no WebGL |
| [0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) | The website is the home page; Storybook is the documentation; the header and search lead into it (supersedes 0171, 0213 and 0216) |
| [0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md) | Storybook's Docs pages indexed, plain-text copies for agents, the token-coloured logo |
| [0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md) | Expressive motion on the home page, Motion allowed for pointer and spring interaction |
| [0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md) | A light and dark toggle that starts light |

## Rules for this folder

- **This folder is public and permanent**, like the rest of `guidelines/`: the repository is public and its history is not forgotten. Never put a secret, a credential, an account identifier, a registrar or DNS login, a private email address, or anything about a person who has not published it here. `06-gitignore-and-private-notes.md` says where that material goes instead.
- A fact lives in **one** place. Link to it from the other files rather than repeating it.
- Keep a file current as the work lands; do not add dated "updated" notes.
