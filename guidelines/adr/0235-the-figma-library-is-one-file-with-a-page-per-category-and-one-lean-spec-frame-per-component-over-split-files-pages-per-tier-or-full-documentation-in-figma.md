# 0235 — The Figma library is one file with a page per category and one lean spec frame per component, over split files, pages per tier or full documentation in Figma

**Status:** Accepted · **Date:** 2026-11-19 · **Amended 2026-11-19** — the page that lists what is not drawn is called Scope notes · **Amended 2026-11-22** — a spec frame also has a Properties block; the decision itself is unchanged

## Context
Categories such as Inputs and Data Display hold atoms, molecules and organisms. The library needs a structure that a designer can navigate, that follows the repository's catalog, and that does not duplicate Storybook.

## Decision
- **One file to start**, split by tier only if it becomes slow past about 100 components.
- **A page per category**, with sections in the order atom, molecule, organism, and one frame per component with a tier tag.
- **A lean spec frame:** header (name, tier, description, link to its Storybook page), the variant matrix, anatomy, the tokens used and accessibility notes. Props, usage and code stay in Storybook, which stays the single source of truth. *(Amended 2026-11-22: the frame also lists the properties the component has in Figma and names the code props it does not model, with a link to the Props table in Storybook; the full reference is still Storybook's.)*
- Coverage is visual components only; templates, hooks, functions and non-visual utilities are listed on a Scope notes page. *(Amended 2026-11-19: this originally said a "Not in Figma" page; the page was renamed.)*

## Alternatives considered
- **Foundations and components in two files.** Cleaner separation, but both must be published and kept in sync. Held back until size requires it.
- **Pages per tier, or tier and category.** Mirrors the build order, but splits a component family across pages, or gives about 25 pages.
- **Full documentation in Figma.** Duplicates Storybook and drifts.

## Consequences
- A component's props and usage are changed in one place.
- The file may need splitting later; the plan treats that as a new record.
- A category page is revisited three times as the tiers are built.

## Related
`guidelines/figma/01-plan.md` §4. `04-component-inventory.md`.
