# Docs website — content inventory

What exists today in Storybook, where each piece goes on the docs website, and what has to be written new. The decision is [ADR-0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md); the destinations are in [02-structure.md](./02-structure.md) §2.

## 1. Pages that exist today

Storybook sources are in `packages/components/src/guides/` and `packages/components/src/foundations/`.

| Today | Goes to | Notes |
|---|---|---|
| Getting started (the welcome, the five installation steps, the fonts, where releases and issues live, the agent files, the Components and Templates tables) | `/docs/introduction`, `/docs/installation` and `/agents` on the site (built in M1); Storybook's page becomes a pointer that keeps the component index when the guides move (M4) | The component index reads Storybook's own `index.json`, so it stays Storybook's |
| Guides / Theming | `/docs/guides/theming` | Port; the live examples become islands |
| Guides / Accessibility | `/docs/guides/accessibility` | Port; the known-exceptions table is copied from `03-token-system-spec.md` and must stay in step (it also feeds `/accessibility-statement`) |
| Guides / Responsive and right-to-left | `/docs/guides/responsive-and-rtl` | Port; the two component lists are checked against the code |
| Guides / Hooks and utilities | `/docs/guides/hooks-and-utilities` | Port; it links to the new `/hooks/<name>` and `/functions/<name>` pages |
| Guides / Composition patterns | `/docs/guides/composition-patterns` | Port; the six demos become islands (a `Toast.Provider` and the simulated requests) |
| Guides / Icons | `/docs/guides/icons` | Port; the gallery is a hand-kept snapshot of the 35 most-used icons |
| Foundations (ten pages) | Stay in Storybook, their one home; `/docs/foundations` is an overview with a card per page | They read `@dbm-system/tokens` through Storybook's Brand and Mode toolbar, which the site does not have |
| Component Docs pages | Storybook keeps them; `/components/<name>` pages are built from the manifest, with the stories as live examples ([ADR-0216](../adr/0216-component-pages-render-the-storybook-stories-as-their-live-examples-through-portable-stories-over-hand-written-examples-or-story-iframes.md)) | Each links to its Storybook page and back |
| Templates | `/templates` and `/templates/<name>` | Two shells that ship (`AppShell`, `PageShell`) and the story-only example pages (`04-component-inventory.md`, Templates) |

## 2. Storybook-only blocks to port or replace

These are in `packages/components/.storybook/blocks/` and depend on Storybook's Docs container. The site needs its own equivalent for each one it uses.

| Block | Used for | On the docs website |
|---|---|---|
| `Callout` | Do and Don't and info panels | `Alert` in an MDX component |
| `ReferenceTable`, `FieldsTable`, `PropertiesTable` | The guide tables and each component's props | `PropertiesTable` is replaced by the manifest-driven props table; the others become one table component on `Table` |
| `RelatedLinks`, `RelatedCard`, `FoundationsCards` | Related pages and the Foundations cards | Port on `Card`, including the whole-card link; the Foundations cards point into Storybook |
| `IconGallery` | The Icons guide | Port as an island |
| `CompositionDemos` | The Composition guide | Port as islands |
| `ComponentIndex` | Getting started's component tables | Replaced by the manifest-driven `/components` index |
| `ComponentHeader` | Each component's Docs page header | Stays in Storybook and gains the "View on dbm-system.com" link ([ADR-0214](../adr/0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md)); the site has its own header |
| `TokenRow`, `PlaygroundControls`, `PlaygroundCanvas` | Component Docs pages | Storybook only; not ported |
| The Foundations blocks (colour grids, scales, type specimen, token tables) | The token pages | Storybook only; not ported |
| `ThemeSync` | Making a Docs page take the toolbar's theme | Storybook only; the shared mode key feeds it ([02-structure.md](./02-structure.md) §4) |

## 3. Pages to write new

| Page | Needs |
|---|---|
| The landing page | [03-landing-page-brief.md](./03-landing-page-brief.md) |
| Docs home | Cards into the four Docs groups, with their illustrations |
| Introduction, Installation | Storybook's Getting started and the package README; the packages are published |
| Quick start | An empty app to a themed page; `check-fresh-app` already proves the steps |
| Frameworks | Server rendering (`06-engineering-standards.md`), `ClientOnly`, loading the CSS in each framework |
| AI agents | The manifest, per-component JSON, `AGENTS.md`, the Markdown copies; `llms.txt` and `llms-full.txt` labelled until built |
| Changelog | Each package's `CHANGELOG.md`, written by the release workflow; an RSS feed |
| Roadmap | `01-vision-and-goals.md` §13 in public wording: built, next, not planned |
| FAQ | Short answers: server rendering, size, theming, licence, versions |
| Accessibility statement | The WCAG target and known exceptions (from the token spec) and the supported browsers (`06-engineering-standards.md` §6) |
| Component, hook and function pages | The manifest, the stories and their snippets, MDX for prose |
| Templates index and pages | The shells' manifest entries and the example pages' stories |
| 404 | Search and the section entry points |

## 4. Old links

When a guide moves, its Storybook address (`/storybook/?path=/docs/guides-…`) would stop working. **Each old address keeps a short "this page has moved" page that links to the new one**, because static Pages cannot redirect. The stubs are written when a guide moves and removed when the guides have been at their new addresses long enough that nobody is arriving at the old ones.
