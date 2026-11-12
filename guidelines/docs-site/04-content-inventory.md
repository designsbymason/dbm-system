# Docs website — content inventory

What exists today in Storybook, where each piece goes on the docs website, and what has to be written new. The decision is [ADR-0171](../adr/0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md); the destinations are in [02-structure.md](./02-structure.md).

## 1. Pages that exist today

Storybook sources are in `packages/components/src/guides/` and `packages/components/src/foundations/`.

| Today | Goes to | Notes |
|---|---|---|
| Getting started (the welcome, section list, the Components and Templates tables) | A pointer page stays in Storybook (the component index stays); the welcome and sections become `/docs/getting-started` and the landing page | The component index reads Storybook's own `index.json`, so it is Storybook-specific |
| Guides / Theming | `/docs/guides/theming` | Port; the live examples become islands |
| Guides / Accessibility | `/docs/guides/accessibility` | Port; the known-exceptions table is copied from `03-token-system-spec.md` and must stay in step |
| Guides / Responsive and right-to-left | `/docs/guides/responsive-and-rtl` | Port; the two component lists are checked against the code |
| Guides / Hooks and utilities | `/docs/guides/hooks-and-utilities` | Port; recheck the export list against the package index files |
| Guides / Composition patterns | `/docs/guides/composition-patterns` | Port; the six demos become islands (a `Toast.Provider` and the simulated requests) |
| Guides / Icons | `/docs/guides/icons` | Port; the gallery is a hand-kept snapshot of the 35 most-used icons |
| Foundations (ten pages) | Stay in Storybook, their one home; `/docs/foundations` is a short overview with cards linking to them | They are theme-specific and read `@dbm-system/tokens` through Storybook's Brand and Mode toolbar, which the docs website does not have |
| Components (115 Docs pages) | Storybook keeps them; `/components/<name>` pages are built from the manifest | Each links to its Storybook page |
| Templates | `/templates` | Five built in the components package (two shells that ship, `AppShell` and `PageShell`, and three story-only example pages); their docs pages wait for the site |

## 2. Storybook-only blocks to port or replace

These are in `packages/components/.storybook/blocks/` and depend on Storybook's Docs container. The docs website needs its own equivalent for each one it uses.

| Block | Used for | On the docs website |
|---|---|---|
| `Callout` | Do and Don't and info panels | A DBM-based component or a simple MDX component |
| `ReferenceTable`, `FieldsTable`, `PropertiesTable` | The guide tables and each component's props | `PropertiesTable` is replaced by the manifest-driven table; the others become one table component |
| `RelatedLinks`, `RelatedCard`, `FoundationsCards` | Related pages and the Foundations cards | Port, including the whole-card link; the Foundations cards on the overview page point into Storybook |
| `IconGallery` | The Icons guide | Port as an island |
| `CompositionDemos` | The Composition guide | Port as islands |
| `ComponentIndex` | Getting started's component tables | Replaced by the manifest-driven `/components` index |
| `ComponentHeader`, `TokenRow`, `PlaygroundControls`, `PlaygroundCanvas` | Component Docs pages | Storybook only; not ported |
| The Foundations blocks (colour grids, scales, type specimen, token tables) | The token pages | Storybook only; not ported |
| `ThemeSync` | Making a Docs page take the toolbar's theme | Storybook only |

## 3. Pages to write new

| Page | Needs |
|---|---|
| The landing page | [03-landing-page-brief.md](./03-landing-page-brief.md) |
| Getting started and Installation | Phase 8: the publish decision and the consumer stylesheet and token loading |
| For AI agents | Phase 8: the manifest, `llms.txt`, `llms-full.txt`, `AGENTS.md` |
| Changelog | The publish pipeline (Changesets) |
| Accessibility statement and browser support | The WCAG target and known exceptions (from the token spec) and the supported browsers (`06-engineering-standards.md` §6) |
| Component pages | The manifest |
| Templates index | Placeholder until the site is built; the templates exist and are listed from Storybook's index |
| 404 | A short page with a path back |

## 4. Old links

When a guide moves, its Storybook address (`/storybook/?path=/docs/guides-…`) stops working. **Each old address keeps a short "this page has moved" page that links to the new one**, because static Pages cannot redirect. The stubs are written when a guide moves and removed when the guides have been at their new addresses long enough that nobody is arriving at the old ones.
