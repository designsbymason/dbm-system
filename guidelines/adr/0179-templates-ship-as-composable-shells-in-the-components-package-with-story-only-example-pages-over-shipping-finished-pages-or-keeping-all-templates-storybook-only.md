# 0179 — Templates ship as composable shells in the components package, with story-only example pages, over shipping finished pages or keeping all templates Storybook-only

**Status:** Accepted · **Date:** 2026-11-04

## Context
Every planned component is built, and Phase 7 adds the page-level templates listed in `04-component-inventory.md`. Several things had been left open until the first one: whether a template is public API or an example, what its API looks like, where it lives, how it appears in Storybook and the docs site, who owns the page landmarks, and how it is tested. The landing page's live showcase needs a real dashboard shell, so the answer has to cover something an app can import.

## Decision
- **Two kinds of template.** An **application shell** (dashboard, top-nav, docs, marketing) is reusable structure and **ships** from `@dbm-system/components`. A **page** (settings, billing, error pages, auth, list and detail pages) is content-heavy and app-specific, so it is a **story-only example page** that an app copies; it does not ship.
- **A shell is a compound component with slots** (`Shell`, `Shell.Sidebar`, `Shell.Header`, `Shell.Content`, and so on, per `05` §4). It takes structural props only (the breakpoint at which it collapses, a `labels` object for its own text) and all content as children. It is not a page with a data-props list. The component's exact name is settled when the first shell is planned.
- **The shell owns the page landmarks:** `<header>`, `<nav>`, `<main>` with an id, a skip link wired to the existing skip-link part, and the heading order it can guarantee. Its text is overridable through `labels`. A test asserts the landmark tree.
- **Location and files.** Shells live in `packages/components/src/templates/{Name}/` with the `05` §1 file set. The definition of done is `05` §8 plus the `06` §9 pass, with four template checks added: the landmark tree, the layout at phone, tablet and desktop widths, right-to-left, and forced colours.
- **Storybook.** A top-level `Templates` group, titled `Templates/{Group}/{Name}` where the group is one of the inventory's headings (application shells, authentication, data pages, settings and account, system pages), placed after the other tiers. Every template story uses `layout: "fullscreen"`; the Docs page embeds a framed live preview and links to the full-screen story.
- **Testing.** Unit and axe tests for landmarks and keyboard, plus hidden real-browser `*.checks.stories` at pinned phone, tablet and desktop viewports that assert the layout changes, a right-to-left story that measures mirroring, and a forced-colours check. No screenshot-diff tooling.
- **Docs site and manifest.** A shipped shell is in the manifest as kind `template`, with props from JSDoc like a component. Its `/templates/<name>` page has facts from the manifest, a live island and an "Open in Storybook" link to the full-screen story. A story-only page gets a docs page with its source and no manifest entry.

## Alternatives considered
- **Ship every template.** Gives the most time-to-first-app, but each page becomes public API with copy and props apps override anyway, and the package grows with page-specific code.
- **Storybook-only for all.** No API to maintain, but a consuming agent could not import a shell, and the landing page could only use one by reaching into the repository.
- **Finished pages with data props** (`<DashboardPage stats={…} />`). Quick to demo, but a long, growing prop list that conflicts with composition over configuration (`06` §2).
- **A separate `@dbm-system/templates` package.** Keeps the core lean but adds a sixth public package and release path before Phase 8.
- **Treat shells as organisms.** Adds no tier, but contradicts the Template tier badge and Getting started wiring that already exist.
- **Consumer owns the landmarks.** Less opinionated, but easy to get wrong, which undercuts the accessibility stance.
- **Screenshot-diff regression.** Needs tooling and baseline storage that the free-tooling rule and CI budget have not approved.

## Consequences
- Each shipped shell is public API and carries the same semver and review obligations as a component.
- The `Templates` group needs `storySort` handling and a status-table section in `07` §6; the Getting started Templates section and the `Template` tier badge already exist.
- Phase 8's manifest schema has to allow a `template` kind.
- Template counts stay out of the component summary in `04`.
- The dashboard shell is built first and fixes the pattern the others follow.

## Related
`04-component-inventory.md` (Templates), `01-vision-and-goals.md` §13 (Phase 7), `07-storybook-and-documentation-standards.md` §3 and §11, `docs-site/02-structure.md`; [ADR-0006](./0006-functional-categories-over-atomic-tier-navigation.md).
