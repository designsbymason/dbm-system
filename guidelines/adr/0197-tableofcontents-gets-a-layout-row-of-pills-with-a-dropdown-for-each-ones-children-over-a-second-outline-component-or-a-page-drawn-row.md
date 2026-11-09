# 0197 — `TableOfContents` gets a `layout="row"` of pills with a dropdown for each one's children, over a second outline component or a page-drawn row

**Status:** Accepted, in part superseded by [0198](./0198-the-tableofcontents-row-is-drawn-by-navigationmenu-and-layout-takes-a-width-map-over-keeping-the-hand-built-pills-and-a-two-element-pattern-only.md) · **Date:** 2026-11-08

## Context
A documentation page shows its outline in a column at the end. Below that column's step it dropped under the page, or became the folded bar (`sticky="folded"`), which is a button over a list. The maintainer asked for a second row of links at the top of the page, sticking under the site's header: the top-level sections as pills and, for a section with sections inside it, a menu holding them. `TableOfContents` draws a vertical list or a folded button; it has no horizontal form. `sticky` takes only a spacing step for its offset, so it cannot stick under a header whose height is a measured length (the same gap `Sidebar` had, ADR-0195).

## Decision
- **`TableOfContents layout`** (`"list"` default, or `"row"`). A row is one line of pills, one for each top-level entry (level 1 after `minLevel`); an entry with deeper entries after it has a small button beside its pill that opens a popover (the same `Popover` the folded dropdown uses) holding those entries as links. The pill that holds the current entry is marked, as a group's heading is. The row scrolls sideways inside itself when it is too long and keeps the marked pill in view. It has no title and no folding (`collapse`, `foldedStyle` and `showTitle` have no effect); it is named by `labels.navigation` or `aria-label`.
- **A row sticks** when `sticky` is set (`true` or `"folded"`), with the page's surface behind it and a rule below, and the headings are kept clear of it as they are for the folded bar.
- **`stickyOffset` takes a CSS length as well as a spacing step** (`SpaceValue | string`), for `"folded"` and the row; `sticky={true}` (built on `Affix`) still takes a step only.
- Nothing changes for `layout="list"`.

## Alternatives considered
- **A new `TableOfContentsRow` / `PillNav` component.** Rejected: the entries, the scroll reading, the current mark, the click-to-scroll and the groups are this component's; a second one would copy them.
- **`foldedStyle="pills"`.** Rejected: that style is a way to fold the one outline; a row is a different layout at every width.
- **A row drawn by the page from `Navbar.Links scroll`.** Rejected: it would not follow the scroll or mark the current section, and a page-written outline is a pattern of its own.

## Consequences
- Additive: `TableOfContents` stays Finalized. The Documentation Page shows the row on a phone and tablet, with the column's outline from `lg` (two instances, one shown at each width by the page's stylesheet).

## Related
ADR-0195, ADR-0196; `component-reviews/TableOfContents.md`, `component-reviews/DocumentationPage.md`.
