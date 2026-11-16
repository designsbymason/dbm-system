# Docs website — structure

**Decided in:** [ADR-0170](../adr/0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md), [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md), [ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md), [ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md), [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md) and [ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md) to [ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md). The plan is [01-plan.md](./01-plan.md).

## 1. The home page's header

The site is `https://dbm-system.com` (the apex is canonical; `www` redirects). It is the home page; the documentation is Storybook at `/storybook/` ([ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)).

```
[dbM system] [v0.1.x]        Docs ▾   Foundations ▾   Components        [Search] [Mode] | [Storybook] [GitHub]
```

| Item | What |
|---|---|
| Logo | The "dbM system" wordmark, inline SVG coloured with `text.brand`, about 24 px tall; links to `/` |
| Version | The current version as a subtle brand-toned `Badge`, read from the packages at build |
| **Docs** | A large menu, one link per Storybook page, grouped: Getting started, Guides, Resources, and AI agents |
| **Foundations** | A menu, one link per Storybook Foundations page |
| **Components** | A direct link (no menu) to Storybook's All components page |
| Search | `CommandPalette` over Storybook's `index.json`: every Docs page, component and story by title; a result opens in Storybook. Opened from the header or with ⌘K or Ctrl K |
| Mode | An icon button that toggles light and dark; a first visit is light; remembered and shared with Storybook ([ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md)) |
| Storybook, GitHub | Brand-toned icon buttons with accessible names, after a vertical divider |

Every menu link goes into Storybook in the same tab. The menus are on the home page only; inside Storybook its sidebar navigates and the logo links home.

**On a phone** the bar keeps the logo, the version, search and a menu button; the drawer holds the menus as expandable groups and the actions.

**Footer:** columns for Docs (into Storybook), Resources (Changelog, Roadmap, FAQ in Storybook), AI agents and the agent files, and Project (GitHub, npm, Issues, Security, Licence). The 404 offers search and the way into the docs.

## 2. Site map

### On the website

| URL | What | Source |
|---|---|---|
| `/` | The home page | Astro, from [03-landing-page-brief.md](./03-landing-page-brief.md) |
| `/404` | Not found, with search | Astro |
| `/AGENTS.md`, `/manifest.json`, `/llms.txt`, `/llms-full.txt`, the Markdown copies | The agent files (§6) | Generated at build; not committed |
| `/sitemap.xml`, `/robots.txt` | §12 | Generated |
| `/storybook/` | The documentation | The `storybook-static` build |

A version path (`/v1/…`) is added from 1.0; until then the site is the latest release only.

### In Storybook

| Group | Pages |
|---|---|
| **Getting started** | Introduction · Installation · Quick start · Frameworks · AI agents · All components |
| **Guides** | Theming · Accessibility (with the statement: guarantees, how it is checked, the known exceptions, browsers, how to report) · Responsive and right-to-left · Composition patterns · Hooks and utilities · Icons |
| **Resources** | Changelog (generated from the packages' `CHANGELOG.md` at build) · Roadmap · FAQ |
| **Foundations** | Overview · Color · Typography · Spacing · Radius · Shadows · Motion · Icon sizes · Miscellaneous · Breakpoints |
| **Atoms**, **Molecules**, **Organisms** | Tier, then category, then component: unchanged, so no component address changes |
| **Templates** | Unchanged |

The order is set in `preview.tsx`'s `storySort` (`07-storybook-and-documentation-standards.md` §11). **All components** holds the Components and Templates tables (the `ComponentIndex` block over `index.json`); the home page's All components section shows the same data from the manifest. A page whose address changes keeps a short "moved" page at the old one, since static Pages cannot redirect.

## 3. Design direction: "an annotated instrument"

The home page reads as a precise instrument, documented: editorial and technical, like a type specimen book crossed with an engineering drawing. Professional and highly finished first; the personality lives in the annotation motif, the editorial type and the interactive sections ([03-landing-page-brief.md](./03-landing-page-brief.md)).

| Element | Rule |
|---|---|
| Colour | **Purple as ink**: neutral surfaces throughout, the page on `bg.neutral-subtle` (every text token clears 4.5:1 on it in both modes) with rules in `border.neutral`; purple only for emphasis, links, focus, annotations, the brand-toned icon buttons and the primary action. No gradient washes. Illustrations use the brand's tonal range with the neutrals ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)) |
| Type | **Lora** (secondary) for display headlines and editorial moments, in the `4xl` to `6xl` steps; **Nunito** (primary) for the interface and body; the **mono** family for annotations, token labels and code |
| Layout | **Editorial asymmetry**: a 12-column grid with deliberate offsets, headlines in a narrow column, content and live components spanning wider, generous margins for notes |
| Section openers | A Lora headline and one sentence; one idea per section. No numbered or all-caps eyebrow above it; mono is kept for real code |
| Annotation motif | Hairline rules, dimension lines and token labels measured onto real components: in the hero, the specification and the theme card, and on hover. A signature, not wallpaper |
| Motion | **Expressive** on the home page (§5, [ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md)); calm in Storybook |
| Surfaces | Space, alignment to the spacing scale, and the shadow and radius scales; light and dark designed together |
| Voice | Plain, confident, specific; short sentences; no hype words |
| Avoid | Gradient backgrounds, glassy blurred panels, glowing blobs, emoji, sparkle icons, abstract floating 3D shapes, a centred hero over a grid of identical icon cards, stock imagery, invented metrics or logos |

Site-only CSS uses semantic tokens only; a missing token or component is proposed to the maintainer, never replaced by a one-off value.

**Site compositions** (built in the site from DBM components, not added to DBM):

| Piece | Composed from |
|---|---|
| Header and phone drawer | `PageShell`, `NavigationMenu`, `Badge`, `IconButton`, `Divider`, `Drawer` |
| Search | `CommandPalette` (`filter={false}`), Storybook's `index.json` |
| Mode toggle | `IconButton`, `ThemeProvider`, the shared storage key |
| Install line with package-manager tabs (pnpm, npm, yarn, bun), remembered | `Tabs`, `CodeBlock` |
| All components table | `DataTable`, `SearchInput`, `Select` or `ToggleGroup`, `Badge` |

## 4. How Storybook fits

Storybook is the documentation and the workshop, at `https://dbm-system.com/storybook/`. It keeps its own interface and is bridged to the home page ([ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)):

| Bridge item | What |
|---|---|
| Shared mode | One mode key, `dbm-mode`, in the origin's `localStorage`. The site writes it; Storybook's preview reads it into `initialGlobals` (a `mode` in the URL still wins), the manager starts in it, and a change from the Mode toolbar is written back. Light and dark only ([ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md)) |
| Self-hosted fonts | Storybook bundles the same Fontsource files itself, the manager only the Latin subset ([ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md)) |
| Transitions | Both opt into cross-document View Transitions; the manager paints the mode's background from the token index before it loads |
| Logo | The "dbM system" wordmark as two files generated from the tokens (light and dark), switched with the Mode toolbar, relative so it resolves under `/storybook/`, linking to `https://dbm-system.com/` in the same tab ([ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)) |
| Search engines | The Docs pages are indexed; story canvases (the Playground and the check stories) are kept out of results; the Docs pages are in the sitemap ([ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)) |

The site never embeds Storybook, and Storybook gets no injected header.

## 5. Motion

Expressive on the home page, calm in Storybook ([ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md), [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)).

| Layer | What | How |
|---|---|---|
| Micro-interactions | Hover, press, focus, copy feedback, menu and palette entrances, on most interactive elements | The DBM components' own transitions; site additions use the motion tokens (`duration.fast` to `slower`, `easing.standard` and `emphasized`, `scale.98` and `102`) |
| Pointer and spring | The hero's tilting stack, layers lifting on hover, controls that respond to the pointer | Motion (MIT), loaded on the home page only, for what CSS cannot express |
| Page transitions | Between the home page and Storybook, and the mode change | Cross-document View Transitions; the mode change is a short reveal from the toggle. No client router |
| Scroll-driven | Entrances that assemble a section's composition, the hero settling flat, the theme card stepping through the themes on wide screens | CSS scroll timelines (`scroll()`, `view()`, named ranges), sticky sections, `@property` custom properties, SVG stroke drawing |

**Rules:** reduced motion gives a static, complete page with every control present; content is in the HTML before any script; no scroll-jacking; time-based motion uses the motion tokens; every scroll animation is inside `@supports (animation-timeline: view())`, and a browser without it gets the static page.

## 6. Agent files

| File | What | When |
|---|---|---|
| `/AGENTS.md` | The consumer usage guide, copied from the components package at build | Built |
| `/manifest.json` | The full component manifest, copied from the built components package | S4 |
| `<page>.md` | A Markdown copy of each Storybook Docs page, generated from its MDX at build ([ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)) | S4 |
| `/llms.txt` | A short curated index of the docs (the llmstxt.org convention) | S4 |
| `/llms-full.txt` | The documentation as one text file | S4 |

**How the copies are made:** each Storybook Docs page's MDX is parsed with the unified tools at build. Headings, prose, lists, tables and code pass through; imports, `<Meta>` and `<ThemeSync />` are dropped; every block has its own text form, and a block with none fails the build, so nothing disappears silently:

| Block | Text form |
|---|---|
| `Callout` | A blockquote beginning "Note:", "Do:" or "Don't:" |
| `ReferenceTable`, `FieldsTable` | A table from the same props or imported data |
| `ComponentIndex` | The All components table, from the manifest |
| `RelatedLinks`, `FoundationsCards` | A list of links |
| The Foundations token blocks | Token tables from `tokens.json` |
| Live demos and `Canvas` | The story's snippet where it has one, and a "Live example:" link to Storybook |

Links become absolute, pointing at the `.md` copy where one exists. A check fails if a Docs page in `index.json` has no copy; `llms-full.txt` is built from the same output.

Until a file is built, the AI agents page says plainly that it is in development.

## 7. Illustrations

Geometric, diagram-style illustrations drawn in code from the tokens ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)), in two techniques: inline SVG (including isometric views) and CSS 3D compositions of live DBM components. Built from the radius scale, the spacing grid and real component silhouettes; coloured from the brand's tonal range and the neutrals, every colour a semantic token, so one asset serves both modes; the final, flat frame under reduced motion; decorative ones `aria-hidden`, informative ones with a `<title>` and `<desc>`. No WebGL. The set: the hero's 3D stack, the home page's section pieces and the 404.

## 8. Repository layout

```
apps/
  docs/                    The Astro app: the home page, the 404, the agent files
    src/
      pages/               Routes: /, 404, /AGENTS.md and the other agent files
      components/          The header, the footer and the home page's sections, built on DBM
      illustrations/       The SVG illustrations, as Astro components
      layouts/             The page layout
      data/                The header's links into Storybook
      styles/              Site-only CSS on DBM tokens
    public/                Favicons, the web app manifest, the logo
    scripts/               The scoped token themes, the agent files, the link check, the accessibility scan, the local server
packages/components/
  src/guides/              Storybook's Getting started, Guides and Resources pages (MDX)
  src/foundations/         Storybook's Foundations pages
  .storybook/              The sidebar order, the bridge, the logo, the indexing setup
.github/
  workflows/pages.yml      The combined build and deploy
```

Generated files (`apps/docs/dist/`, `apps/docs/.astro/`, the copied manifest, the agent files) are gitignored; see [06-gitignore-and-private-notes.md](./06-gitignore-and-private-notes.md).

## 9. Build and deploy

One GitHub Actions workflow, run on every push to `main` while the packages are 0.x:

1. Install with pnpm on the Node version in `.nvmrc`, and build the packages through Turborepo.
2. Build Storybook (`pnpm build-storybook`) to `storybook-static`, with the generated Changelog and logo files.
3. Build the site, and write the agent files and the sitemap from the manifest and Storybook's index and MDX.
4. Assemble one artifact: the site at the root and `storybook-static` in `storybook/`.
5. Run the gates on that artifact (§11).
6. Publish it with the Pages actions. Until S3 the workflow's `PUBLISH_DOCS_SITE` switch is `"false"`: the placeholder in `.github/pages/` stays at the root while the site is built and checked, and Storybook is published at `/storybook/` either way.

Pull requests get the build and the gates; only `main` deploys. From 1.0 the deploy moves to release tags. Development and previews import the workspace packages (which resolve to their built `dist`).

## 10. Dependencies of `apps/docs`

The docs app is not published, so the packages' runtime budget does not apply, but each dependency is listed here with its reason, and one that is not listed needs a new ADR ([ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)). Every one is free and open source. Confirm each licence when adding it and again at the refresh pass (`02-tech-stack-and-structure.md` §3.2).

| Dependency | Why | Licence |
|---|---|---|
| `astro` | The site framework, static output | MIT |
| `@astrojs/react` | React islands for live DBM components | MIT |
| `react`, `react-dom` | Required by the islands and by DBM | MIT |
| `@dbm-system/tokens`, `utils`, `icons`, `components` | The system the site is built from | MIT |
| `@fontsource/nunito`, `@fontsource/lora` | Self-hosted fonts for the site and Storybook ([ADR-0215](../adr/0215-the-docs-site-and-storybook-self-host-nunito-and-lora-over-loading-them-from-google-fonts.md)) | SIL Open Font License |
| `motion` | Pointer and spring interaction on the home page only ([ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md)); added when first used in S3 | MIT |
| `playwright`, `axe-core` (development only) | The accessibility scan; the link check and the local server are scripts with no dependency | Apache-2.0, MPL-2.0 |
| `typescript`, `@types/react`, `@types/react-dom` (development only) | Type-checking, at the versions the components package uses | Apache-2.0, MIT |

No animation library is ever a dependency of `packages/*` ([ADR-0140](../adr/0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md)); a lint rule enforces it.

## 11. Quality gates

| Gate | What it fails on | Status |
|---|---|---|
| Link check | Any internal link or asset that resolves to nothing in the build, including links into `/storybook/` (checked against Storybook's `index.json`), and any same-page `#fragment` with no id (`apps/docs/scripts/check-links.mjs`) | Built |
| Accessibility scan | An axe-core WCAG 2.2 A or AA violation on any built page, in light and dark, with and without reduced motion (`apps/docs/scripts/check-accessibility.mjs`) | Built |
| Animation libraries | `gsap`, `motion` or a similar library imported in `packages/*` (`no-restricted-imports` in `packages/eslint-config/base.js`) | Built |
| Storybook docs | Storybook's own checks and the guide-file consistency in `check-publish`, which the new Getting started pages join (and `check-logo` for the logo files) | Built |

Not adopted: a Lighthouse or page-weight budget. The home page's weight is reported in the build log and reviewed by hand each round.

## 12. SEO and sharing

`sitemap.xml` (the home page and Storybook's Docs pages, the `docs` entries of `index.json`), `robots.txt` (Storybook allowed, its story canvases kept out), a canonical URL and page metadata on the home page; Storybook's Docs pages indexed ([ADR-0221](../adr/0221-storybooks-docs-pages-are-indexed-by-search-engines-with-plain-text-copies-for-agents-over-keeping-storybook-out-of-results.md)); a web app manifest and favicons from the logo. No structured data at launch.

**Keeping the story canvases out:** Storybook serves each page at the manager address (`/storybook/?path=/docs/…` or `?path=/story/…`) and renders it in `iframe.html`, which must stay crawlable or the Docs pages index empty.

| Where | What |
|---|---|
| `robots.txt` | `Disallow: /storybook/*?path=/story/`; `iframe.html` is never disallowed |
| The preview's head (`iframe.html`) | `<meta name="robots" content="noindex, indexifembedded">`: the frame is never a result itself, but its content counts for the page that embeds it |
| The manager's head (`managerHead`) | A short script: `noindex` on a story path, a canonical URL on a Docs path (the static head is the same for every path, so only a script can tell them apart) |
| `sitemap.xml` | Only the Docs entries; a check confirms each one exists in `index.json` |

How well a search engine renders the manager and its frame is checked in Search Console after launch; the plain-text copies (§6) make the docs readable either way.

## 13. Community and licence

Issue templates (bug, feature, docs problem), `SECURITY.md`, `CONTRIBUTING.md` (pull requests by invitation), `CODE_OF_CONDUCT.md` ([ADR-0172](../adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)). MIT for the code and the written content; the fonts keep their own licence, stated on the site.
