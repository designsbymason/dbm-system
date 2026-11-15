# Docs website — structure

**Decided in:** [ADR-0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md), [ADR-0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md) and [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) to [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md). The plan is [01-plan.md](./01-plan.md).

## 1. Navigation

The site is `https://dbm-system.com` (the apex is canonical; `www` redirects). The navigation is decided in [ADR-0213](../adr/0213-the-docs-site-is-navigated-by-docs-components-templates-ai-agents-and-storybook-with-project-pages-and-agent-files-at-short-root-urls-over-one-docs-section-holding-everything.md).

```
[dbM]  Docs ▾  Components ▾  Templates  AI agents  Storybook      [Search ⌘K] [v0.1.x ▾] [GitHub] [Mode]
```

| Item | Opens |
|---|---|
| **Docs** | A large menu in four groups, each link with a one-line description: Get started, Guides, Foundations, Resources |
| **Components** | A large menu of the 9 functional categories, plus All components and Hooks and functions |
| **Templates** | The templates index |
| **AI agents** | `/agents` |
| **Storybook** | `/storybook/`, styled as a secondary item marked as the workshop, same tab |
| Search | `CommandPalette` over the Pagefind index; ⌘K, Ctrl K or `/` |
| Version | A menu: Changelog, Roadmap, npm, GitHub releases |
| GitHub, Mode | Icon buttons with accessible names; Mode is Light, Dark or System |

**On a phone** the bar keeps the logo, search and a menu button; the menu is one drawer holding the sections as an expandable tree and the current section's pages.

**On every content page:** breadcrumbs (`Components / Inputs / Button`); a sidebar for the current section only, with the current page marked and its group open; an outline (`TableOfContents`) for long pages; previous and next links at the foot, in the section's order; a four-column footer (Docs; Components by category; Resources and AI agents; Project: GitHub, npm, Issues, Security, Licence). The 404 offers search and the section entry points.

## 2. Site map and URLs

| Section | URL | Page | Source |
|---|---|---|---|
| Home | `/` | The landing page | Astro and MDX, from [03-landing-page-brief.md](./03-landing-page-brief.md) |
| Docs · Get started | `/docs` | Docs home: cards into each group | MDX |
| | `/docs/introduction` | What DBM is, its principles, the four packages | MDX |
| | `/docs/installation` | Package managers, the stylesheet and a theme, the fonts ([ADR-0175](../adr/0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)) | MDX, from Storybook's Getting started and the package README |
| | `/docs/quick-start` | An empty app to a themed page | MDX |
| | `/docs/frameworks` | Next.js, Vite, Astro, Remix: server rendering, `ClientOnly`, loading the CSS | MDX |
| Docs · Guides | `/docs/guides/<slug>` | Theming, Accessibility, Responsive and RTL, Composition patterns, Hooks and utilities, Icons | MDX, ported from Storybook |
| Docs · Foundations | `/docs/foundations` | What tokens are, the three layers, naming, a card per Storybook token page | MDX; the token pages stay in Storybook |
| Resources | `/changelog` | Release history, with `/rss.xml` | Each package's `CHANGELOG.md` |
| | `/roadmap` | Built, next, not planned, in public wording | MDX, from `01-vision-and-goals.md` §13 |
| | `/faq` | Short answers: server rendering, size, theming, licence, versions | MDX |
| | `/accessibility-statement` | The WCAG target, the known exceptions, supported browsers | MDX |
| Components | `/components` | Index: a `DataTable` with search, category and tier filters | The manifest |
| | `/components/<name>` | One per component (flat, for example `/components/button`) | Manifest for facts, MDX for prose, stories for examples |
| | `/hooks/<name>`, `/functions/<name>` | One per hook and function | The manifest, MDX |
| Templates | `/templates`, `/templates/<name>` | Shells (`AppShell`, `PageShell`) and Pages (the example pages) | The manifest for the shells, stories for the previews |
| AI agents | `/agents` | How an agent uses DBM, and the files below | MDX |
| Storybook | `/storybook/` | Storybook | The `storybook-static` build |
| Agent files | `/manifest.json`, `/components/<name>.json`, `/AGENTS.md`, `/llms.txt`, `/llms-full.txt`, `<page>.md` | §7 | Generated at build; not committed |
| Standard | `/404`, `/sitemap.xml`, `/robots.txt`, `/rss.xml` | | Generated |

A version path (`/v1/…`) is added from 1.0; until then the site is the latest release only.

## 3. Layouts

Three page types, all on **`PageShell`**, the shipped shell for a site without an app sidebar. The template recipes are a starting point, not a constraint: where one does not fit, the site composes the components directly.

| Page type | Used by | Built from |
|---|---|---|
| **Marketing** | The landing page, Docs home | The Marketing Page recipe: `Navbar` with `NavigationMenu`, full-width sections in the three `Content` widths, a column footer |
| **Article** | Docs, guides, Resources, AI agents, Templates | The Documentation Page recipe: a sidebar column (`Sidebar`), the article, an outline (`TableOfContents`) that becomes a sticky row of pills below `lg`, one menu drawer on a phone |
| **Reference** | Component, hook and function pages | The Article layout with a component header and example frames |

**Design direction: "an annotated instrument".** The site reads as a precise instrument, documented: editorial and technical, like a type specimen book crossed with an engineering drawing. Professional and highly finished first; the personality lives in three controlled places, the annotation motif, the editorial type and the home page's Human / Agent split ([03-landing-page-brief.md](./03-landing-page-brief.md) §4).

| Element | Rule |
|---|---|
| Colour | **Purple as ink**: neutral surfaces throughout; purple only for emphasis, links, focus, annotations and the primary action. No gradient washes. Illustrations use the brand's tonal range with the neutrals ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)) |
| Type | **Lora** (secondary) for display headlines and editorial moments, in the `4xl` to `6xl` steps; **Nunito** (primary) for the interface and body; the **mono** family for annotations, token labels and code |
| Layout | **Editorial asymmetry** on the home page and Docs home: a 12-column grid with deliberate offsets, headlines in a narrow column, content and live components spanning wider, generous margins for notes. Docs and reference pages keep a calm three-column reading layout |
| Section openers | A numbered label in mono ("01 — Tokens"), a Lora headline and one sentence; one idea per section |
| Annotation motif | **Sparing**: hairline rules, dimension lines and token labels measured onto real components, used only in the home page's hero and token section, on hover in the showcase, and in component anatomy diagrams. A signature, not wallpaper |
| Motion | **Restrained** (§5): a few signature moments on the home page; quiet once-only reveals elsewhere; docs pages barely move |
| Surfaces | Space, alignment to the spacing scale, and the shadow and radius scales; light and dark designed together |
| Voice | Plain, confident, specific; short sentences; no hype words |
| Avoid | Gradient backgrounds, glassy blurred panels, glowing blobs, emoji, sparkle icons, abstract floating 3D shapes, a centred hero over a grid of identical icon cards, stock imagery, invented metrics or logos |

Site-only CSS uses semantic tokens only; a missing token or component is proposed to the maintainer, never replaced by a one-off value.

**Component page anatomy:**

1. Header: name, the manifest's one-sentence description, tier and category badges, the import line with a copy button, and links to Storybook, the source, the component's JSON and "Copy page".
2. Hero example: the default story, live, in a frame with Preview and Code tabs.
3. Examples: each with a heading, a sentence, the live story and its snippet, and mode and direction toggles on the frame.
4. Anatomy (compound components): the parts and how they nest, as a diagram.
5. Props: one table per part from the manifest (name, type, default, description), with a filter; inherited native props listed by name.
6. Accessibility: the keyboard map, the ARIA, any known exception.
7. Related: "Uses" and "Used by" from the manifest, and the guide that covers it.
8. Previous and next within the category.

One outlined page rather than tabs, so every section can be read, searched, copied as Markdown and linked to.

**Site compositions** (built in the site from DBM components, not added to DBM):

| Piece | Composed from |
|---|---|
| Example frame | `Tabs`, `CodeBlock`, `ToggleGroup`, `ThemeProvider`, `DirectionProvider` |
| Mode menu | `Menu`, `ThemeProvider`, the site's own storage |
| Install line with package-manager tabs (pnpm, npm, yarn, bun), remembered | `Tabs`, `CodeBlock` |
| Previous and next | `Card`, `Link` |
| Callouts | `Alert` |
| Release banner, dismissible | `PageShell.Banner`, `usePersistentDismiss` |
| Search | `CommandPalette` (`filter={false}`, `loading`), `useRecentCommands`, Pagefind |

## 4. How Storybook fits

Storybook is the workshop: a Playground, controls and tests for every component, at `https://dbm-system.com/storybook/`. It keeps its own interface and is bridged to the site ([ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)):

| Bridge item | What |
|---|---|
| Shared mode | One mode key in the origin's `localStorage`; the site writes it, Storybook's manager reads it at start-up and writes it back from its Mode toolbar |
| Shared fonts | Both load the site's self-hosted font files ([ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md)) |
| Transitions | Both opt into cross-document View Transitions; the manager paints the mode's background before it loads |
| Logo | Resolves under `/storybook/` (today it points at the root and fails there) and links to `https://dbm-system.com/` in the same tab |
| Links both ways | "Open in Storybook" on each component page (to `/storybook/?path=/docs/<tier>-<category>-<name>--docs`); "View on dbm-system.com" in each Storybook component header |
| Search engines | `noindex` in Storybook's head and `Disallow: /storybook/` in `robots.txt` |

Its sidebar keeps Foundations, the component pages (tier first) and Templates, plus a short Getting started page that points to the site and keeps the component index. The guides and the long Getting started content move to the site ([04-content-inventory.md](./04-content-inventory.md)); each old address keeps a "moved" page. The site never embeds Storybook; components render in the page.

## 5. Motion

CSS first; no GSAP; Motion only for an interaction CSS cannot express ([ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)).

| Layer | What | How |
|---|---|---|
| Micro-interactions | Hover, press, focus, copy feedback, menu and palette entrances | The DBM components' own transitions; site additions use the motion tokens (`duration.fast` to `slower`, `easing.standard` and `emphasized`, `scale.98` and `102`) |
| Page transitions | Between pages, between the site and Storybook, and the mode change | Cross-document View Transitions (`@view-transition { navigation: auto }`): the header holds, the content cross-fades with a small slide; the mode change is a short reveal from the switch. No client router |
| Scroll-driven | Docs pages: once-only reveals of illustrations and section openers, a reading-progress line in the header. Landing page: the choreography in the brief | CSS scroll timelines (`scroll()`, `view()`, named ranges), sticky sections, `@property` custom properties, SVG stroke drawing |

**Rules:** reduced motion gives a static, complete page; content is in the HTML before any script; no scroll-jacking; time-based motion uses the motion tokens; on docs pages reveals run once and never loop; every scroll animation is inside `@supports (animation-timeline: view())`, and a browser without it gets the static page.

## 6. Illustrations

Geometric, diagram-style illustrations drawn in code from the tokens ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)), in two techniques: inline SVG (including isometric views) and CSS 3D compositions of live DBM components. Built from the radius scale, the spacing grid and real component silhouettes; coloured from the brand's tonal range and the neutrals, every colour a semantic token, so one asset serves both modes; drawn, assembled, separated and flattened on scroll, never morphed; the final, flat frame under reduced motion; decorative ones `aria-hidden`, informative ones with a `<title>` and `<desc>`. No WebGL.

| Set | Pieces |
|---|---|
| Launch | The home page's CSS 3D stack (tokens, components, an application) and its section pieces; a spot illustration per guide; the Docs home cards; the AI agents diagram; the 404; the social-image template |
| Later | A small glyph per component for a grid view of the index |

## 7. Agent files

| File | What | When |
|---|---|---|
| `/manifest.json` | The full component manifest, copied from the built components package | M2 |
| `/components/<name>.json` | One component's entry, from the manifest's split files ([ADR-0206](../adr/0206-the-manifest-is-also-shipped-as-an-index-and-one-file-per-component-beside-the-whole-file-over-the-single-file-alone-or-waiting-for-an-mcp-server.md)) | M2 |
| `/AGENTS.md` | The consumer usage guide, copied from the components package | M1 |
| `<page>.md` | A Markdown copy of every docs, component, hook and function page; each page has a "Copy page" button | M1 for docs pages, M2 for the reference |
| `/llms.txt` | A short curated index of the docs (the llmstxt.org convention) | M5 |
| `/llms-full.txt` | The documentation as one text file | M5 |

Until a file is built, the AI agents page says plainly that it is in development.

## 8. Repository layout

```
apps/
  docs/                    The Astro app
    src/
      pages/               Routes: the landing page, /docs, /components, /hooks, /functions,
                           /templates, /agents, the Resources pages, 404, and the .md copies
      content/             MDX for Docs, guides, Resources and component prose
      components/          The site's islands and Astro components, built on DBM
      illustrations/       The SVG illustrations, as Astro components
      layouts/             The three page types, the header, the drawer, the footer
      styles/              Site-only CSS on DBM tokens: the motion primitives, the reveals
    public/                Favicons, the web app manifest, the logo
    scripts/               Build steps: copy the manifest and AGENTS.md, write the agent files
    astro.config.mjs
  storybook/               The wrapper for the public Storybook build and its subpath check
.github/
  workflows/pages.yml      The combined build and deploy
```

Generated files (`apps/docs/dist/`, `apps/docs/.astro/`, the Pagefind index, the copied manifest, the agent files) are gitignored; see [06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md).

## 9. Build and deploy

One GitHub Actions workflow, run on every push to `main` while the packages are 0.x:

1. Install with pnpm on the Node version in `.nvmrc`, and build the packages through Turborepo.
2. Build Storybook (`pnpm build-storybook`) to `storybook-static`.
3. Build the site: copy the manifest and `AGENTS.md`, generate the pages and their Markdown copies, write the agent files, build the Pagefind index, generate the social images.
4. Assemble one artifact: the site at the root and `storybook-static` in `storybook/`.
5. Run the gates on that artifact (§11).
6. Publish it with the Pages actions. The custom domain is set in the repository's Pages settings.

Pull requests get the build and the gates; only `main` deploys. From 1.0 the deploy moves to release tags. Development and previews import the workspace packages (which resolve to their built `dist`); a release build installs the published version from npm.

## 10. Dependencies of `apps/docs`

The docs app is not published, so the packages' runtime budget does not apply, but each dependency is listed here with its reason, and one that is not listed needs a new ADR ([ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)). Every one is free and open source. Confirm each licence when adding it and again at the refresh pass (`02-tech-stack-and-structure.md` §3.2).

| Dependency | Why | Licence |
|---|---|---|
| `astro` | The site framework, static output | MIT |
| `@astrojs/react` | React islands for live DBM components | MIT |
| `@astrojs/mdx` | MDX pages | MIT |
| `react`, `react-dom` | Required by the islands and by DBM | MIT |
| `@dbm-system/tokens`, `utils`, `icons`, `components` | The system the site is built from | MIT |
| `@storybook/react` | Portable stories for the live examples, at the version the components package's Storybook uses ([ADR-0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)) | MIT |
| `@fontsource/nunito`, `@fontsource/lora` | Self-hosted fonts for the site and Storybook ([ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md)) | SIL Open Font License |
| `pagefind` | Static search, no service | MIT |
| A link checker and an accessibility scanner (CI only) | The quality gates; chosen in M0 | Open source |
| `motion` | **Not added.** Only if a landing review round agrees an interaction needs it ([ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)) | MIT |

No animation library is ever a dependency of `packages/*` ([ADR-0140](../adr/0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md)); a lint rule enforces it.

## 11. Quality gates

| Gate | What it fails on | From |
|---|---|---|
| Link check | Any dead internal link, including links into `/storybook/` | M0 |
| Accessibility scan | An axe violation on each page type, in light and dark, with reduced motion | M0 |
| Animation libraries | `gsap`, `motion` or similar imported in `packages/*` | M0 |
| Component coverage | A component, hook or function in the manifest with no page | M2 |
| Visual check | A changed snapshot of each page type, with the repository's Playwright setup | M2 |

Not adopted: a Lighthouse or page-weight budget. The landing page's weight is reported in the build log and reviewed by hand each round.

## 12. SEO and sharing

`sitemap.xml`, `robots.txt`, a canonical URL and page metadata on every page; `/storybook/` kept out of search results (§4); a generated social image per page in the illustration style; a web app manifest and favicons from the dbM logo. No structured data at launch.

## 13. Community and licence

Issue templates (bug, feature, docs problem), `SECURITY.md`, `CONTRIBUTING.md` (pull requests by invitation), `CODE_OF_CONDUCT.md` ([ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)). MIT for the code and the written content; the fonts keep their own licence, stated on the site.
