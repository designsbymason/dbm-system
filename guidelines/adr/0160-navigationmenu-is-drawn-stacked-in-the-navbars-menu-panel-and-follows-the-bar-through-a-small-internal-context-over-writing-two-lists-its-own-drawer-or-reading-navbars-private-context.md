# 0160 — `NavigationMenu` is drawn stacked in `Navbar`'s menu panel and follows the bar through a small internal context, over writing two lists, its own `Drawer` or reading `Navbar`'s private context

**Status:** Accepted · **Date:** 2026-10-31

## Context
Floating panels are a pointer's pattern. On a phone a mega menu has to become something a thumb can use, and in a header it has to be one set of items, not a bar's list plus a second list written for the phone ([ADR-0091](./0091-navbar-collapses-by-a-css-breakpoint-and-draws-its-links-in-the-bar-and-in-the-menu-panel-over-measuring-its-width-or-writing-two-lists.md)). `Navbar.Links` already draws its children twice, in the bar and in the menu panel's `Drawer`. A `NavigationMenu` among them would otherwise be a floating mega menu in the panel too, which [ADR-0092](./0092-navbar-group-is-a-menu-in-the-bar-and-an-expandable-group-in-the-menu-panel-over-a-floating-list-everywhere-or-a-mega-menu.md) rejected for `Navbar.Group`. `NavigationMenu` also has to look like the bar it sits in (current-page look, rounding, direction) without a second set of props to keep in step, and it may not import a private file of `Navbar`.

## Decision
- **`presentation` is `mega` or `stacked`** (a width map like `Menu`'s, resolved in JavaScript since it chooses what is drawn). Stacked is a vertical list where each trigger is a disclosure button (`aria-expanded`, `aria-controls`, `hidden` panel) and its links nest beneath it, one item open at a time. It uses no primitive, so its links are plain tab stops. The same parts draw both forms.
- **Inside `Navbar.Links` the menu is a list item of the bar's own navigation** (the bar is the landmark), takes the bar's `currentVariant`, `rounded` and `dir`, and is always stacked in the menu panel, where a link chosen closes the panel as `Navbar.Link` does (`closeMenuOnNavigate`).
- **`Navbar.Links` tells it so through `internal/navigationEmbed.ts`:** a small context (`currentVariant`, `rounded`, `dir`, `inPanel`, `closePanel`) defined beside neither component, provided around the bar's copy of the links and the panel's copy, and read by `NavigationMenu`. This is the "second consumer goes to `internal/`" rule ([05 §1](../05-component-api-conventions.md)) applied before a component imports another's private file. `Navbar`'s output is unchanged.

## Alternatives considered
- **Desktop only, and the author writes a second `Navbar.Group` list for the panel.** Rejected: two lists to keep in step, the failure ADR-0091 exists to prevent.
- **`NavigationMenu` draws its own `Drawer` below a width.** Rejected: it would repeat `Navbar`'s collapse, panel and menu button, and give a page two phone menus.
- **Read `NavbarPanelContext` and `useNavbarContext` from `NavigationMenu`.** Rejected: an organism importing another's private file, with `Navbar`'s whole context as its dependency.
- **Move `NavbarPanelContext` itself to `internal/`.** Rejected: it carries one boolean and none of the look, so `NavigationMenu` would still need the bar's other settings from somewhere.

## Consequences
- `Navbar` is Finalized; the change is additive (a provider around what it already drew), and its output and tests are unchanged, so it stays Finalized ([06 §9](../06-engineering-standards.md), the three-question test, question 1).
- A `NavigationMenu` outside a `Navbar` takes its own `size`, `currentVariant`, `rounded` and `dir`; inside one the bar's apply, and `size` applies only in the stacked form.
- A set of items written once serves the bar and the phone menu; the two copies have separate open-item state.

## Related
`05-component-api-conventions.md` §1, §3; ADR-0091, ADR-0092, ADR-0094, ADR-0121, ADR-0159; `component-reviews/NavigationMenu.md`, `component-reviews/Navbar.md`.
