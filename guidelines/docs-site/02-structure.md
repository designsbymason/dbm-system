# Docs website — structure

**Decided in:** [ADR-0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md) and [ADR-0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md). The plan is [01-plan.md](./01-plan.md).

## 1. Site map and URLs

The site is `https://dbm-system.com` (the apex is canonical; `www` redirects). Top-level navigation: **Docs**, **Components**, **Templates**. There is no blog at launch.

| URL | Page | Source |
|---|---|---|
| `/` | The landing page | MDX and Astro, from [03-landing-page-brief.md](./03-landing-page-brief.md) |
| `/docs/getting-started` | Getting started, with Installation | MDX; Installation waits on Phase 8 |
| `/docs/guides/theming`, `accessibility`, `responsive-and-rtl`, `hooks-and-utilities`, `composition-patterns`, `icons` | The guides | MDX, ported from Storybook |
| `/docs/foundations/…` | The token pages (overview, colour, typography, spacing, radius, shadows, motion, icon sizes, miscellaneous, breakpoints) | MDX, values read from `@dbm-system/tokens` |
| `/docs/for-ai-agents` | The manifest, `llms.txt`, `AGENTS.md` explained | MDX; waits on Phase 8 |
| `/docs/changelog` | The release history | Generated from Changesets |
| `/docs/accessibility-statement` | The WCAG target, the known exceptions, supported browsers | MDX |
| `/components` | The component index: a table with search, Tier and Category filters and sortable columns | Generated from the manifest |
| `/components/<name>` | One component (flat, for example `/components/button`) | Manifest for facts, MDX for prose |
| `/templates`, `/templates/<name>` | The page-level templates | Placeholder until templates exist |
| `/storybook/` | Storybook | The `storybook-static` build |
| `/manifest.json`, `/llms.txt`, `/llms-full.txt` | The agent files | Generated at build; not committed |
| `/sitemap.xml`, `/robots.txt`, `/404` | Standard files | Generated |

A version path (`/v1/…`) is added from 1.0; until then the site is the latest release only.

## 2. Repository layout

```
apps/
  docs/                    The Astro app (the docs website)
    src/
      pages/               Routes: the landing page, /docs, /components, /templates, 404
      content/             MDX for the guides, Foundations prose, Getting started, statement pages
      components/          The site's own React islands and Astro components, built on DBM
      layouts/             The page shells, the navigation, the footer
      styles/              Site-only CSS that uses DBM tokens (never hardcoded values)
    public/                Static files: favicons, the web app manifest, the logo
    scripts/               Build steps: copy the manifest, write llms.txt and llms-full.txt, social images
    astro.config.mjs
  storybook/               The wrapper for the public Storybook build and its subpath check
.github/
  workflows/pages.yml      The combined build and deploy
  ISSUE_TEMPLATE/          Bug, feature and docs-problem templates
SECURITY.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md
```

Generated files (`apps/docs/dist/`, `apps/docs/.astro/`, the Pagefind index, the copied manifest and the `llms` files) are gitignored; see [06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md).

## 3. Build and deploy

One GitHub Actions workflow, run on every push to `main` while the packages are 0.x:

1. Install with pnpm and build the packages the docs need (`tokens`, `utils`, `icons`, `components`, and later `manifest`) through Turborepo.
2. Build Storybook (`pnpm build-storybook`) to `storybook-static`.
3. Build the docs app: copy the manifest, write `llms.txt` and `llms-full.txt`, generate the pages, build the Pagefind index, generate the social images.
4. Assemble one artifact: the docs build at the root and `storybook-static` in a `storybook/` folder.
5. Run the gates on that artifact: the link check (including links into `/storybook/`) and the accessibility scan of the key pages.
6. Publish it with the Pages actions. The custom domain is set in the repository's Pages settings, not by a `CNAME` file.

Pull requests get the build and the gates (they run for collaborators); only `main` deploys. From 1.0 the deploy moves to release tags.

**Components in the build.** Development and previews import the workspace packages (which resolve to their built `dist`). A release build installs the published version from npm, which also tests the package in a fresh app.

## 4. How Storybook fits

| Question | Answer |
|---|---|
| What is it for? | The workshop: a Playground, controls and tests for every component |
| Where is it? | `https://dbm-system.com/storybook/` |
| What does its sidebar keep? | Foundations, the component pages and Templates, plus a short Getting started page that points to the docs website and keeps the component index |
| What moves out? | The guides and the long Getting started content ([04-content-inventory.md](./04-content-inventory.md)) |
| How does the docs site link to it? | Each component page has "Open in Storybook", linking to `/storybook/?path=/docs/<tier>-<category>-<name>--docs` |
| Does it work under a subpath? | Its static build uses relative assets and the Getting started page reads `index.json` with a relative URL. **To be verified in the combined artifact** (Phase A). |
| Does the docs site embed it? | No. Components render in the page. |

## 5. Components, data and live demos

- **Facts** (props, variants, tier, category) come from the manifest. A page for a component the manifest lacks cannot be built, which is the coverage gate.
- **Prose** is MDX in `src/content`, one file per page; a component page's prose can add sections the manifest cannot know (usage guidance, accessibility notes, examples).
- **Live demos** are React islands that import the built `@dbm-system/components`, so they take the site's theme. An island loads only on a page that needs it.
- **Theme:** one brand (Purple) in light, dark and system mode, chosen by the reader, remembered in the browser, defaulting to the system. Components and tokens come from DBM; the site writes no hardcoded colour, spacing or type.

## 6. Search

Pagefind: an open-source index built from the generated HTML at deploy time, searched in the browser. No service and no account. It indexes Docs, Components and Templates, and leaves out the landing page and Storybook (Storybook has its own search).

## 7. The agent files

| File | What | When |
|---|---|---|
| `/manifest.json` | The full component manifest | After Phase 8 |
| `/llms.txt` | A short curated index of the docs (the llmstxt.org convention) | After Phase 8 |
| `/llms-full.txt` | The documentation as one text file, generated from the same content | After Phase 8 |
| A consumer `AGENTS.md` | A usage guide for an agent building with the library, also shipped in the npm package | After Phase 8 |

Until Phase 8, the For AI agents page says plainly that they are in development.

## 8. Dependencies of `apps/docs`

The docs app is not published, so the packages' runtime budget does not apply, but each dependency is listed here with its reason, and one that is not listed needs a new ADR ([ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)). Confirm each licence when adding it and again at the refresh pass (`02-tech-stack-and-structure.md` §3.2).

| Dependency | Why | Licence note |
|---|---|---|
| `astro` | The site framework, static output | Open source |
| `@astrojs/react` | React islands for live DBM components | Open source |
| `@astrojs/mdx` | MDX pages | Open source |
| `react`, `react-dom` | Required by the islands and by DBM | Open source |
| `@dbm-system/tokens`, `utils`, `icons`, `components` | The system the site is built from | MIT |
| `pagefind` | Static search, no service | Open source |
| `gsap` with ScrollTrigger | Scroll-driven choreography on the landing page | **Free of charge but not OSI open source; the recorded exception. Re-read the terms before the first release.** |
| A link checker and an accessibility scanner (CI only) | The two quality gates | Open source |

## 9. Quality gates

| Gate | What it fails on |
|---|---|
| Link check | Any dead internal link, including links into `/storybook/` |
| Accessibility scan | An axe violation on the home page, a component page and a guide |
| Component coverage | A component in the manifest (or Storybook's index) with no docs page; starts in Phase B |

Not adopted: a Lighthouse or page-weight budget. The landing page's weight and motion are reviewed by hand each round.

## 10. SEO and sharing

`sitemap.xml`, `robots.txt`, a canonical URL and page metadata on every page, a generated social preview image per page, a web app manifest and favicons derived from the existing dbM logo. No structured data at launch.

## 11. Community and repository files

Issue templates (bug, feature, docs problem), `SECURITY.md` (private vulnerability reporting), `CONTRIBUTING.md` (pull requests are by invitation for now), `CODE_OF_CONDUCT.md`. Decided in [ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md).

## 12. Licence

MIT for the code and for the written content, one licence.
