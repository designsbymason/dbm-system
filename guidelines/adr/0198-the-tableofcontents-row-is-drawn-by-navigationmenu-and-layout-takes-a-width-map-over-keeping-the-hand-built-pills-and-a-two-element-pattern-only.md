# 0198 — The `TableOfContents` row is drawn by `NavigationMenu`, and `layout` takes a width map, over keeping the hand-built pills and a two-element pattern only

**Status:** Accepted · **Date:** 2026-11-08

## Context
[ADR-0197](./0197-tableofcontents-gets-a-layout-row-of-pills-with-a-dropdown-for-each-ones-children-over-a-second-outline-component-or-a-page-drawn-row.md) added `layout="row"`, drawn with `Link` pills and a `Popover` of their own. Reviewed, the pills were a pattern drawn beside an existing component: their own borders, radii, joined caret, marked fill and panel width (the panel took the little caret's width and showed nothing). `NavigationMenu` already is a row of rounded links and split triggers whose panels hold links, with the current-item marking, placement and keyboard model built and Finalized. A spike showed it holds up in a sticky, sideways-scrolling row. Two things were missing: a current link is always `aria-current="page"`, where an outline marks a place in one page (`"location"`), and the row had no sign that more of it lay off the screen.

## Decision
- **The row is drawn by `NavigationMenu`**: a plain pill is a `NavigationMenu.Link`, a pill with sections inside it is a split `NavigationMenu.Trigger` (`href` to its own section) with a `Content` of links. `TableOfContents` keeps what is its own: reading the scroll, the current entry, the click that scrolls clear of a sticky header, and keeping the marked pill in view. A molecule importing an organism inverts the tiers, as `Toolbar` already does with `Menu` for its overflow part; it is accepted here because the alternative is a second hand-drawn pill.
- **`NavigationMenu currentType`** (`"page"` default, or `"location"`): what a current link's `aria-current` says, for the menu's links and a split trigger's own link. Additive; `NavigationMenu` stays Finalized.
- **The ends of a row that is longer than the room fade out**, only the end that has more (`useScrollEdges`, as a scrolling `Navbar.Links` does), never taking a click.
- **`TableOfContents layout` takes a width map** (`{ base: "row", lg: "list" }`), resolved in the browser like `Menu`'s `presentation`. It draws one outline that changes with the width. It cannot move an outline from one place in the document to another, so a page that puts the column at the end and the row at the top (the Documentation Page) still writes two outlines, sharing one list of entries.
- The row ignores `tone` and `collapse`; panels of a pill link take the menu's look.

## Alternatives considered
- **Keep the hand-built pills and fix their CSS.** Rejected: the pattern would stay a second copy of what `NavigationMenu` does.
- **`Button` pills, or a new organism.** Rejected: `Button` has no joined split form, and a new organism duplicates the outline's scroll logic.
- **`aria-current="page"` for sections.** Rejected: it announces a section as the page and the list layout says "location".

## Consequences
- Additive on two Finalized components. A link in a pill's panel jumps to its section instead of gliding: focus returns to the caret as the panel closes, which would cut a smooth scroll short.

## Related
ADR-0197, ADR-0159 to 0161 (`NavigationMenu`), ADR-0196; `component-reviews/TableOfContents.md`, `component-reviews/NavigationMenu.md`, `component-reviews/DocumentationPage.md`.
