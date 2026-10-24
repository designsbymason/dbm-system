# 0118 — `ContextMenu` wraps Radix ContextMenu pinned at 2.3.7 on `Menu`'s release train, holds its own open state, and is modal with Radix's long press, over the newest release or a hand-rolled trigger

**Status:** Accepted · **Date:** 2026-10-24

## Context
`ContextMenu` is the second consumer of `Menu`'s item parts, and `Menubar` and `Navbar` follow ([ADR-0064](./0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md), [ADR-0065](./0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md)). A spike against the real packages settled what the documents could not:
- `@radix-ui/react-context-menu@2.3.7` depends on `react-menu@2.1.24`, the version `Menu`'s `react-dropdown-menu@2.1.24` already installs, so installing it added one package and no second copy of `react-menu`, `dismissable-layer`, `focus-scope` or `popper` below the Radix overlays (`pnpm why`, the installed tree). Every later release moves `react-menu` (2.3.8 uses 2.1.25, 2.4.0 uses 2.2.0, 2.4.1 uses 2.2.1), which splits the layer stack as [ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md) describes: a menu opened from a `Dialog` would stop receiving presses.
- Radix's context-menu root takes `open` and `onOpenChange` and no `defaultOpen`; its content omits `side`, `sideOffset` and `align` (it opens at the pointer); its trigger is a `span` that opens on the `contextmenu` event and on a 700ms touch hold.
- A real right-click inside an open `Dialog` opened the panel above the scrim and a real click on an item chose it with the dialog left open.

## Decision
- **`ContextMenu` wraps `@radix-ui/react-context-menu`, pinned to `2.3.7` with no caret,** until the other Radix packages move. A refresh moves them together and re-checks that one copy of each layer package remains.
- **The root holds its open state itself** (`open`/`defaultOpen`/`onOpenChange`, uncontrolled when `open` is omitted) and feeds it to Radix, as `Menu` does. A menu opened with `open` or `defaultOpen` before any press has no position to open at and is drawn at the page's top-left corner, which Radix warns about in development; `open` is for following and closing the menu, `defaultOpen` for tests.
- **Modal by default,** as `Menu` and a native context menu are: the page behind is inert and a press outside only closes it.
- **Touch is Radix's long press (700ms).** No custom gesture. The keyboard path is the context-menu key and Shift+F10 on a focused element, which send the same `contextmenu` event, so the trigger takes `tabIndex` and `asChild` and the Docs page says an area that cannot take focus cannot be opened from the keyboard.
- **A context menu is documented as a shortcut, never the only way to an action.** It is invisible until used and needs a long press on a touch screen.
- **The panel takes no `side`, `align` or `sideOffset`;** it has `alignOffset`, the collision props and `size`.
- **Focus goes back to the element that had it when the menu opened.** Radix returns it only to a trigger it can focus, so the trigger records the focused element as the menu opens, and a dialog an item opens finds it from the panel (`internal/overlay/menuInvokers`, a `WeakMap` keyed by the panel, read by `findInvoker`).

## Alternatives considered
- **Take the newest Radix packages.** Rejected for now, for the reason above.
- **Hand-roll the trigger over Radix Menu's anchor with a virtual point.** It would allow opening at a point from code and a controlled `defaultOpen`. Rejected: Radix ContextMenu is that trigger already (touch hold, pointer position, dismissal rules), and [ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md) adopts Radix for such behaviour.
- **Offer `side`, `align` and `sideOffset`.** Rejected: Radix omits them because a context menu's anchor is a point.
- **A custom touch gesture or a built-in "open from the focused element" prop.** Rejected for v1: the platform's own keys and the long press cover it, and a bespoke gesture has to be discoverable on its own.
- **Name the panel after the trigger.** Rejected: the trigger is an arbitrary area, often a whole card, so its text would be a poor name; `aria-label` is offered instead.

## Consequences
- A refresh of the Radix packages re-checks the single copy of each layer package with `pnpm why`, now for both `react-dropdown-menu` and `react-context-menu`.
- `ContextMenu`'s bundle carries Radix ContextMenu, `Menu`'s item parts and `Menu`'s stylesheet.
- No real-keyboard check of the context-menu key was possible with the test browser's synthetic key events, which do not trigger the browser's own contextmenu action; the unit tests send the event the key sends.

## Related
`04-component-inventory.md` (ContextMenu row), ADR-0052, ADR-0064, ADR-0065, [ADR-0119](./0119-menus-item-parts-draw-with-the-radix-parts-a-context-supplies-so-contextmenu-shares-them-over-copying-them-or-extracting-them-early.md); `component-reviews/ContextMenu.md`.
