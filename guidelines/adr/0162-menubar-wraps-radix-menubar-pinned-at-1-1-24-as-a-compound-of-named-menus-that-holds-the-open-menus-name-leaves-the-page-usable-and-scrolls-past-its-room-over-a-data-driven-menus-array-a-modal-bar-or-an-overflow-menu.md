# 0162 — Menubar wraps Radix Menubar pinned at 1.1.24 as a compound of named menus that holds the open menu's name, leaves the page usable and scrolls past its room, over a data-driven `menus` array, a modal bar or an overflow menu

**Status:** Accepted · **Date:** 2026-11-01

## Context
`Menubar` is the third consumer of the menu parts, after `Menu` and `ContextMenu`, and the first whose triggers are a row of peers rather than one button. A spike against the installed package settled what the documents could not:
- `@radix-ui/react-menubar@1.1.24` depends on `react-menu@2.1.24`, the version `Menu` already pins; `1.1.25` depends on `2.1.25`, which would split the layer stack as [ADR-0064](./0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md) found. Installing it added no second copy of any layer package.
- Radix Menubar holds which menu is open as one string, and each `Menubar.Menu` is named by a `value`. It computes a trigger's `role`, `aria-haspopup` and `aria-expanded` and a panel's `role` before spreading the props it is given, so a consumer's same-named prop replaces them (`05` §3).
- Radix's menus are non-modal: the page behind stays usable.
- A menu that has closed because another opened stays in the page for its exit animation, and the new menu takes focus meanwhile. The old one hears that as focus outside it and calls `onOpenChange(false)`, which Radix Menubar turns into "close the bar" (it closes by name, not by menu). With an exit fade on the panel, a real pointer moving from File to Edit closed both; jsdom has no animation and passed.
- A bar of menus in a narrow window has more triggers than room. Wrapping would turn a bar into a block, and hiding triggers behind a "More" menu would put a menu inside a menu bar.

## Decision
- **`Menubar` wraps `@radix-ui/react-menubar`, pinned to `1.1.24` with no caret,** on the Radix release train; a refresh moves it with `react-menu` and re-checks one copy of each layer package ([ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)).
- **It is compound: `Menubar` holds `Menubar.Menu` (a required `value`), which holds a `Menubar.Trigger` and a `Menubar.Content`,** and the item parts are `Menu`'s ([ADR-0163](./0163-the-menu-item-parts-context-and-stylesheet-move-to-internal-menu-at-the-third-consumer-over-menubar-importing-them-from-menu.md)). The root holds the open menu's name itself (`value`, `defaultValue`, `onValueChange`, uncontrolled when omitted) and gives each menu a `MenuRootContext` whose `open` is `value === its name`, so the trigger restates `aria-expanded` after the spread and an app opens a menu from its own key by setting `value`.
- **The menus are non-modal,** as Radix's are and as a native menu bar is. A press elsewhere closes the open menu and leaves the focus that press gave; a press on the bar's own item returns focus to the trigger without a ring.
- **A menu that is already closing ignores an outside press or focus,** so its exit cannot close the bar the next menu is opening in. The content's `onInteractOutside` prevents the dismissal while the menu is not open.
- **A bar wider than its room scrolls sideways** with a fade at each end that has more behind it (a mask, dropped in forced colours) and keeps the focused trigger fully in view and clear of the fade. No overflow menu in v1.
- **It has no sheet `presentation`, no `labels` and no `modal`.** A menubar is a desktop pattern; the one `labels` entry the shared parts read (`back`, for a sheet) has nothing to say here.
- **`size` is the shared scale and sets the trigger's padding and type and, unless a `Menubar.Content` sets its own, the menu's row size;** `surface` (`ghost` by default, `outlined`, `filled`) names the bar's own look as `Toolbar`'s does. No new token: a trigger is its padding plus a line of text, as a `Button` is, over the 24px floor.

## Alternatives considered
- **A data-driven `menus` array.** Rejected: a menu holds arbitrary item parts (checkbox and radio items, submenus, promises), and every other menu in the system is compound.
- **A modal bar.** Rejected: Radix's menus are not modal and a menu bar is meant to coexist with the page; `Menu`'s `modal` default is right for a button, not for chrome.
- **An overflow menu for triggers that do not fit.** Rejected for v1: a menu bar rarely has more than seven triggers, and a menu inside a menu bar is a worse pattern than a short scroll. Additive later.
- **A sheet presentation, as `Menu` and `ContextMenu` have.** Rejected: it would draw a desktop pattern as a phone one; an app shows a `Menu` or a `NavigationMenu` on a touch screen.
- **Leave Radix's own dismissal and drop the panel's exit fade.** Rejected: the fade is `Menu`'s, shared through one stylesheet, and the guard is three lines at the one place the bar can be closed by mistake.
- **Take `1.1.25` or newer.** Rejected for now, for the layer-stack split above.

## Consequences
- A refresh of the Radix packages moves `react-menubar` with the others and re-checks `pnpm why` for one copy of each layer package.
- The guard is the wrapper's, so a future Radix that closes by menu is covered by the real-browser check that moves a real pointer from one trigger to the next with the exit fade in place.
- `Menubar`'s bundle holds the shared item parts, as `ContextMenu`'s does.

## Related
`04-component-inventory.md` (Menubar row), `02-tech-stack-and-structure.md` §3.2, ADR-0052, ADR-0064, ADR-0118, ADR-0119; `component-reviews/Menubar.md`.
