# Docs website — internal reference

The plan, structure and supporting references for the DBM System documentation website, `https://dbm-system.com`, and for how Storybook sits beside it at `/storybook/`. These files are a **current-state reference, not a changelog**, like the numbered docs in `guidelines/`. A real fork in the road is recorded as an ADR in `../adr/` and linked from here, not narrated here.

**Status:** M0, the foundation, and M1, the docs core, are built (`01-plan.md` §3): the Astro app, the Marketing and Article layouts, the shared mode and fonts, the Storybook bridge, the gates, and the docs pages, search, the Markdown copies and the first illustrations. The site is built and checked on every push and replaces the placeholder at `https://dbm-system.com` when the Pages workflow's `PUBLISH_DOCS_SITE` switch is turned on; Storybook is live at `/storybook/`. Next: M2, the component pages.

## Files

| File | What it holds |
|---|---|
| [01-plan.md](./01-plan.md) | Goals, scope, the six milestones, what blocks what, risks, and how the work is run |
| [02-structure.md](./02-structure.md) | Navigation, the site map and URLs, layouts and the component page, the Storybook bridge, motion, illustrations, the agent files, the repository layout, build and deploy, dependencies, quality gates, SEO |
| [03-landing-page-brief.md](./03-landing-page-brief.md) | The brief for the landing page: audience, what must stay true, the scroll story, look and feel, motion rules |
| [04-content-inventory.md](./04-content-inventory.md) | Every page that exists today and where it goes, the Storybook-only blocks to port, and the new pages to write |
| [05-open-items.md](./05-open-items.md) | The settings changed outside the repository, what is settled, the questions not yet decided, and the gaps |
| [06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md) | What is gitignored and why, and what belongs in the private notes folder instead of here |

## The decisions behind them

| ADR | Decision |
|---|---|
| [0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md) | Astro with React islands, one GitHub Pages site on the apex, Storybook at `/storybook/`, deploy on push to `main`, Pagefind, no analytics |
| [0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md) | Manifest for facts, MDX for prose, the guides move out of Storybook, flat component URLs |
| [0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md) | Pull requests for collaborators only, Issues on |
| [0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md) | Docs app dependencies listed and justified (its GSAP part is superseded by 0212) |
| [0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) | CSS scroll timelines and View Transitions, Motion only where CSS cannot, no GSAP; the motion rules |
| [0213](../adr/0213-the-docs-site-is-navigated-by-docs-components-templates-ai-agents-and-storybook-with-project-pages-and-agent-files-at-short-root-urls-over-one-docs-section-holding-everything.md) | The navigation, the URL map, the agent files at root URLs |
| [0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md) | The Storybook bridge |
| [0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md) | Self-hosted fonts for the site and Storybook |
| [0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md) | Live examples from the Storybook stories |
| [0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md) | Illustrations: geometric SVG and CSS 3D compositions of live components, drawn from the tokens; no WebGL |

## Rules for this folder

- **This folder is public and permanent**, like the rest of `guidelines/`: the repository is public and its history is not forgotten. Never put a secret, a credential, an account identifier, a registrar or DNS login, a private email address, or anything about a person who has not published it here. `06-gitignore-and-private-notes.md` says where that material goes instead.
- A fact lives in **one** place. Link to it from the other files rather than repeating it.
- Keep a file current as the work lands; do not add dated "updated" notes.
