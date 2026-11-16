# 0225 — Storybook's sidebar lists every component alphabetically in one group, and a catalog holds each component's tier and category, over tier and category groups in the story title

**Status:** Accepted · **Date:** 2026-11-16 · Partly supersedes [0006](./0006-functional-categories-over-atomic-tier-navigation.md) (the sidebar as a navigation axis; the categories themselves stand)

## Context
Storybook's sidebar grouped components as `{Tier}/{Category}/{Component}` (`Atoms/Inputs/Button`): three tiers, nine categories, so a reader opened two groups to find a component, and had to know both where it was filed. The same title was the only place a component's tier and category were written, so the manifest, the All components table and the site's search all parsed it. Storybook derives every story id from the title, so changing a title would have changed every address.

## Decision
- **One group.** Every atom, molecule and organism is `Components/{Name}` (a part or its checks `Components/{Name}/{Part}`), sorted alphabetically. Templates keep `Templates/{Group}/{Name}`.
- **Tier and category live in `packages/components/src/componentCatalog.json`**, one entry per component keyed by its folder name. The manifest, the Index table and the site's search read it; `componentCatalog.test.ts` fails when a component has no entry, an entry has no component, the tier is not its folder's, the category is not one of the nine, or a title is not `Components/{Name}`. The manifest build names the fix when an entry is missing or the tier disagrees.
- **Addresses do not change.** Each stories file sets an explicit `id` in its meta, the old sanitized title (`atoms-inputs-button`), so every story and Docs id, and every link, stays as it was. The ids embed the old tier and category by design and are never edited when a component's category changes.
- **The pages are Indexes.** "All components" is `Components/Index`, first in the group, id `components-index--docs`, and holds the components table; the templates table is `Templates/Index`, first in Templates, id `templates-index--docs`. A hidden `Moved/All components` page keeps the old address (`getting-started-all-components--docs`) and links to it. The site header's label stays "Components".
- The tier badge on each Docs page, the table and its filters, and the site's "Atom › Inputs" search subtitle are unchanged; they read the catalog and the manifest.

## Alternatives considered
- **Tags for tier and category** (`tags: ["tier:atom"]`): rejected. Custom tags appear in Storybook's own sidebar tag filter, which adds back the clutter this removes.
- **Keep the tier and category in the title and hide the levels in the sidebar:** not possible without a custom manager tree; it would add a fragile manager customisation (07 §9).
- **Let the ids follow the new titles:** rejected, since it breaks every link into Storybook, the sitemap and any page indexed so far.
- **Keep only the nine category groups (no tiers):** rejected; it still needs a click to find a component by name, and the user wants the fewest clicks.

## Consequences
- A component is found by its name in one scroll or the sidebar search; the cost is that the sidebar no longer shows what kind of component something is. The Index table and the Docs page badge do.
- A new component needs a catalog entry (a test and the manifest build say so) and a title `Components/{Name}` with an explicit `id` of the form `{tier}-{category}-{name}` in lowercase, hyphenated, so its address matches its siblings'.
- A changed tier or category is a catalog edit only; its id keeps the old words.
- The Index page's old address needs the moved page for as long as links to it exist.

## Related
`07-storybook-and-documentation-standards.md` §3 and §11, `04-component-inventory.md`, `05-component-api-conventions.md`, `docs-site/02-structure.md`, `packages/manifest/README.md`.
