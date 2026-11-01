# 0161 — `NavigationMenu` keeps its panels on the screen by a measured room and takes a split trigger, a path for the current page and item-held disclosure state, over a fixed width, a trigger that is one or the other, or a router hook

**Status:** Accepted · **Date:** 2026-11-01

## Context
The first `NavigationMenu` ([ADR-0159](./0159-navigationmenu-wraps-radix-navigation-menu-pinned-at-1-2-22-on-the-shared-layer-stack-as-a-disclosure-navigation-with-one-shared-panel-area-over-a-hand-rolled-menu-role-menu-or-a-panel-under-each-item-only.md), [ADR-0160](./0160-navigationmenu-is-drawn-stacked-in-the-navbars-menu-panel-and-follows-the-bar-through-a-small-internal-context-over-writing-two-lists-its-own-drawer-or-reading-navbars-private-context.md)) drew a panel as wide as its content up to a token, from its menu's start edge. Real headers showed what that does not cover: a panel wider than the room runs off the screen or is clipped by its own frame, a panel taller than the window cannot be scrolled, a menu at the far end of a bar wants its panel on the other side, a section often has a page of its own as well as a panel, every link and trigger needed a hand-set `current`, and the stacked form opened one item at a time and ignored where the page was.

## Decision
- **A panel is kept on the screen by a measured room.** From an effect (so a server render has none) the menu, or each item when panels hang from items, writes the width from where the panel hangs to the screen's edge on the side it grows toward, and the height below it, as `--navigation-menu-room` and `--navigation-menu-room-block` on its own element, updated on resize and, while a panel is open, on scroll. The panel's `max-inline-size` and `max-block-size` read them, so its links wrap and a tall panel scrolls inside itself. `panelAlign` gains `end` and `auto` (`start` unless there is more room toward the start side). `panelSize` is `auto`, a fixed width as a multiple of the least-width token (no new token), or `full`, the width of the nearest positioned ancestor, which needs one.
- **`orientation="vertical"`** puts the panels beside a column of triggers, over the stacked form for a wide side navigation; the room beside the column is measured the same way.
- **A trigger with an `href` is a split trigger:** a link, and a caret button that opens the panel, both tab stops, the caret named by `labels.togglePanel`. The link opens the panel when the pointer rests on it, with its own timers, since the primitive's hover belongs to its trigger. It is one prop on the trigger, not a second part.
- **The current page is found from `currentPath`** (and `currentMatch`), compared with each link's same-site `href`, and a trigger is current when a link in its panel is, found by reading the item's children as `Navbar` finds its parts; a link's own `current`, either value, wins. Links wrapped in a component of the caller's are not seen, which the Docs say. No router hook is read: the caller passes the path.
- **In the stacked form each item holds its own disclosure state,** `value` still names the open one, an item that holds the current page (or has `defaultOpen`) starts open until something is pressed, and `exclusive={false}` lets several stay open. The panel is a `Collapse`, so it animates its height and a closed one is out of the page.
- **Smaller additions:** a trigger's `badge`, an `onIntent` callback on triggers and links (a resting pointer or focus, for prefetching), a per-trigger `delayDuration`, `onOpenChangeComplete`, a `controllerRef` (a ref and no hook, as the parts a caller could put inside it are its own), a `Feature` and a `Footer` part, `layout="columns"` on a panel, a group heading that is a link, and `descriptionLines`.
- **The disabled-link guard and the external-address pattern are shared** in `internal/linkGuard.ts` by `Navbar`, `Sidebar` and `NavigationMenu`, the three components that draw their own `<a>` ([05 §1](../05-component-api-conventions.md)).

## Alternatives considered
- **A fixed `max-inline-size` of `100vw`.** What it was: it does not know where the panel starts, so a menu not at the screen's edge still overflowed.
- **A collision engine that moves the panel.** Rejected: the primitive offers none for this part, and capping the size by the room never leaves the screen, which moving does not promise.
- **A separate `NavigationMenu.SplitTrigger` part.** Rejected: it would repeat the trigger's props (`icon`, `badge`, `current`, `disabled`) for one extra address.
- **Reading a router hook for the path.** Rejected: the library has no router, and a prop works with every one.
- **Registering links with the item in effects to find the current one.** Rejected: setting state from a registry on every render; reading the children is a pure function of them, as `Navbar`'s part finding is.

## Consequences
- The room is written imperatively onto the menu's element, so a test that reads layout needs a real browser; the checks run in one (a tall panel scrolling, `auto` ending at the far edge, the sizes, vertical, the indicator, a split trigger's hover).
- `Navbar` and `Sidebar` import the shared guard; their output is unchanged, so they stay Finalized ([06 §9](../06-engineering-standards.md), question 1).
- The primitive's hidden focus stop still fails an accessibility scan while a panel is open ([ADR-0159](./0159-navigationmenu-wraps-radix-navigation-menu-pinned-at-1-2-22-on-the-shared-layer-stack-as-a-disclosure-navigation-with-one-shared-panel-area-over-a-hand-rolled-menu-role-menu-or-a-panel-under-each-item-only.md)); it is the primitive's own and not patched here.

## Related
`05-component-api-conventions.md` §1, §3; ADR-0021, ADR-0092, ADR-0109, ADR-0121, ADR-0159, ADR-0160; `component-reviews/NavigationMenu.md`.
