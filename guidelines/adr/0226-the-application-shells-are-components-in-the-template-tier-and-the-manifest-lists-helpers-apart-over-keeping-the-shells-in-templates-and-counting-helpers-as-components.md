# 0226 — The application shells are components in the template tier, and the manifest lists helpers apart, over keeping the shells in Templates and counting helpers as components

**Status:** Accepted · **Date:** 2026-11-17 · Partly supersedes [0225](./0225-storybooks-sidebar-lists-every-component-alphabetically-in-one-group-and-a-catalog-holds-tier-and-category-over-tier-and-category-groups-in-the-story-title.md) (Templates keep `Templates/{Group}/{Name}`) and the grouping in [0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md); the decision there that shells ship and example pages do not stands

## Context
The number of components was shown three ways: 120 on the home page (components plus the two application shells), 118 in Storybook's Components Index (the shells were in Templates), and 123 in the manifest (three exports that support another component, such as `TooltipProvider`, counted as components). Each was right by its own rule, and the rules were written in three places (a catalog test, a folder-name filter on the home page, a story title). A shell is a component by every test but its sidebar group: it ships, is imported, has props, parts and a manifest entry. A helper is not something with a page of its own.

## Decision
- **The application shells are components in the template tier.** `AppShell` and `PageShell` are `Components/{Name}` in Storybook, in the one alphabetical list, with a catalog entry (tier `template`, category `Shells`, a tenth category used only by that tier). Their story ids do not change (explicit `id`, as in ADR-0225), so no address moves. The Components Index lists them (tier "Template") and its Tier filter has a Template option.
- **Templates are the example pages.** The Templates group holds its Index and the story-only example pages, flat: `Templates/{Name}` (the inventory's template types stay in `04-component-inventory.md`, not in the sidebar). The Templates Index lists the shells too, marked with an asterisk ("a template-level component"), and the pages; its table has a Name and a Description column.
- **Helpers are listed apart from the components in the manifest.** A component written in another component's folder (`HoverCardProvider`, `ImageViewerButton`, `TooltipProvider`) is in `helpers`, with `helperOf` naming the component it supports; its file is `manifest/helpers/<Name>.json`. `components` is what has a page of its own: 120.
- **One number.** The manifest's `components`, Storybook's Components pages and the home page's two counts are the same, and `apps/docs/scripts/check-counts.mjs` fails the Pages build when they differ.

## Alternatives considered
- **Leave the shells in Templates and say "118 components and 2 shells" on the home page.** Honest, but "components" would then mean something different from the manifest and the import list, and every surface needs the same two-part phrase for ever.
- **List the shells in both the Components and the Templates groups of the sidebar.** One page twice is two entries to keep in step and a search that finds each twice.
- **A `kind` flag on manifest entries instead of a `helpers` list.** Less disruptive to readers of `components`, but an agent iterating components has to know to skip flagged ones; a separate list matches how hooks and functions are already kept apart.
- **Keep the template groups (`Shells`, `Data pages`, …) in the sidebar.** The three example pages share one group today, and the groups are a planning aid in the inventory, not a way to find a page.

## Consequences
- The manifest's `components` loses three entries and gains a sibling list: a pre-1.0 change to the shipped manifest, released as a minor. The schema's `helpers` is optional at the root, so a reader of an older manifest still validates.
- A new template-level component (a shell) needs a catalog entry (tier `template`, category `Shells`) and a `Components/{Name}` title with an explicit `id`; a new example page is `Templates/{Name}` with the `example-page` tag (`examplePageTags.test.ts`).
- The category list is ten, nine for atoms, molecules and organisms and Shells for the template tier (`componentCatalog.test.ts` holds both rules).
- A helper has no entry in the catalog of its own: it takes its folder's.

## Related
`04-component-inventory.md` (Templates), `07-storybook-and-documentation-standards.md` §3 and §11, `docs-site/02-structure.md`, `packages/manifest/README.md`, `packages/components/AGENTS.md`.
