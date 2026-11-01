# 0159 — `NavigationMenu` wraps Radix `navigation-menu`, pinned at 1.2.22 on the shared layer stack, as a disclosure navigation with one shared panel area, over a hand-rolled menu, `role="menu"` or a panel under each item only

**Status:** Accepted · **Date:** 2026-10-31

## Context
`NavigationMenu` is the mega-menu pattern of a site header: triggers that open panels of grouped links, beside plain links. [ADR-0092](./0092-navbar-group-is-a-menu-in-the-bar-and-an-expandable-group-in-the-menu-panel-over-a-floating-list-everywhere-or-a-mega-menu.md) left it to this component and said it has its own keyboard model. Four things had to be settled together: what holds the behaviour, which release, what ARIA pattern and how the panels are drawn.

The behaviour is the subtle part: hover with an intent delay and a grace period, moving between open panels without a new delay, a side to slide from, dismissal on `Escape` and on a press outside, and a hand-off of focus from a trigger into its panel. Radix has a `navigation-menu` primitive for exactly this. A spike against the real packages found that `@radix-ui/react-navigation-menu@1.2.22` depends on `dismissable-layer@1.1.19`, `presence@1.1.10` and `collection@1.1.15`, which are the versions already installed (adding it added the package and no second copy of any layer package), while `1.3.0` and later need `dismissable-layer@1.1.20` or newer and would split the layer stack ([ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)).

## Decision
- **`NavigationMenu` wraps `@radix-ui/react-navigation-menu`, pinned to `1.2.22` with no caret**, until the other Radix packages move; a refresh moves them together and re-checks that one copy of each layer package remains (`02-tech-stack-and-structure.md` §3.2). The bundle is about 4KB of JS and 3KB of CSS, inside the default budget.
- **It is the disclosure-navigation pattern, not `role="menu"`.** A trigger is a `<button>` with `aria-expanded` and `aria-controls`; the panel is links. `Menu` is for actions. Triggers and links are ordinary tab stops with arrow-key movement added, as the primitive provides; `Tab` from an open trigger goes into its panel, and `Escape` returns to the trigger.
- **The open item is a `value` string** (`""` for none), held by the component and fed to the primitive (controlled or not, as `Menu` does), so the trigger's `aria-expanded` is restated after the spread and is always true to what is drawn.
- **One panel area, shared and resized between items, is the default**; `viewport={false}` hangs a panel from its own item. The shared area is the panel's surface (border, corners, shadow); each panel is positioned over its corner and sets the area's size, and is as wide as its content wants between two new tokens, `navigation-menu.panel-min-width` and `.panel-max-width`.
- **The slide direction is physical.** The primitive names the side a panel comes from by where its trigger is, `start` being the left in both directions, so the keyframes move by a fixed side and nothing mirrors for right-to-left text (checked in a real browser). Under a reduced-motion preference a panel fades and does not slide.
- **`NavigationMenu.Link` draws its own `<a>`** (and `Slot` for `asChild`), as `Navbar.Link` does, on the primitive's link so choosing one closes the panel; `onSelect` may call `preventDefault()` to keep it open.
- **Panel links draw their focus ring inside the row,** since the shared area clips what is drawn outside it ([05 §6](../05-component-api-conventions.md)).

## Alternatives considered
- **Hand-roll it.** Rejected under [ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md): hover intent, the grace period between a trigger and its panel, the delay-skip between triggers and the focus hand-off are the behaviour Radix is adopted for.
- **Take the newest release (`1.4.x`).** Rejected for now: it silently splits the layer stack, so a `Select`, `Popover` or `Dialog` opened from a panel would stop receiving presses.
- **Compose `Popover` per trigger.** Rejected: each would have its own open state, so moving between triggers would close one and open the next with the delays of each, and there would be no shared area to resize.
- **`role="menu"` and `Menu`.** Rejected: a panel of links with descriptions is not a list of actions, and menu roles hide a link's own semantics.
- **A panel under each item only.** Kept as `viewport={false}`, not the default: the shared area is what makes a move between panels read as one surface changing.

## Consequences
- The primitive keeps a hidden, focusable stop (`aria-hidden`, `tabindex="0"`) beside an open trigger to hand focus into the panel. An accessibility checker that runs while a panel is open reports `aria-hidden-focus`; no story is open by default, and every real-browser check closes its panel and waits for it to be gone. The Docs page says so.
- A link in an exiting panel stays in the page for the length of its exit animation.
- A synthetic click moves the pointer over the trigger first, which starts the primitive's hover timer; a test that closes a panel sooner than `delayDuration` sees it reopen, so checks wait it out.
- `Navbar`'s bundle grows by a context object only.

## Related
`05-component-api-conventions.md` §3, ADR-0052, ADR-0064, ADR-0092; `component-reviews/NavigationMenu.md`.
