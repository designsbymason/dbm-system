# 0164 — Menubar gets a controller, opt-in hotkeys, an action part, disabled reasons, platform-drawn shortcut hints, a sticky option, an overflow menu and a trigger icon, over leaving each to the app

**Status:** Accepted · **Date:** 2026-11-01 · **Amended 2026-11-01** — the overflow menu is fed by each item registering itself, not by the bar reading its children, and the platform-drawn hints apply to `Menu`, `ContextMenu` and (as `keys`) the `Kbd` atom too; the decision itself is unchanged

## Context
[ADR-0162](./0162-menubar-wraps-radix-menubar-pinned-at-1-1-24-as-a-compound-of-named-menus-that-holds-the-open-menus-name-leaves-the-page-usable-and-scrolls-past-its-room-over-a-data-driven-menus-array-a-modal-bar-or-an-overflow-menu.md) left nine things to the app that a menu bar is expected to have, and `05` §3 already says how a component of this kind offers several of them. Radix Menubar has no part for a button that opens nothing, no way to skip a trigger that must stay focusable, and closes by menu *name*, which constrains each.

## Decision
- **A `controllerRef` and `useMenubarController()`** (`05` §3, as `ContextMenu`): `open(value)` (focus on the first item), `close()` and a `value` getter on an object that never changes; a method says whether it had anything to do. Outside a bar the hook returns an inert object and warns.
- **`hotkeys`, an object from a menu's `value` to a combination or `false`,** binding nothing by default, read through `internal/hotkey`; a match for a menu that is in the bar is kept from the browser and opens the menu onto its first item. It is compared by content (`JSON.stringify`), since an app writes it inline. A mnemonic underline on the trigger is not drawn.
- **`Menubar.Action`** is a Radix menubar *trigger* that never opens. The bar keeps a registry of what is in it (menu or action, its trigger, whether it is blocked) and ignores Radix's request to open an action by name: it closes the open menu, hands focus to the action and tells the closing panel to leave it there (Radix would give it back to the menu's own trigger). It runs `onSelect` on a click with a pointer (`detail` above 0) and on Enter and Space on the key, since Radix cancels the key and so the click a key would make. It is not a popup: no `aria-haspopup` or `aria-expanded`.
- **`disabledReason` on a trigger and an action** keeps them focusable (Radix's own `disabled` would leave the arrow-key order), `aria-disabled`, with a `Tooltip` and the reason as the description, as items have. The registry marks the menu blocked, so every route to opening it (a press, a key, the controller, an arrow key inside another open menu) is refused; the last leaves the other menu open.
- **A shortcut hint written with `mod` is drawn for the platform.** It is done in the shared item parts, so `Menu` and `ContextMenu` draw it too (a string with a `mod` token only; any other text is drawn as written, so nothing that existed changes). *(Amended 2026-11-01: this first applied to a menubar only, through a context, because `Menu` and `ContextMenu` are Finalized; it was extended to them at direction, and the `Kbd` atom gained a `keys` prop that draws a combination from the same key table.)* The key table is `CommandPalette`'s, moved unchanged to `internal/hotkey/shortcutKeys.ts` at its second consumer, and the platform is read through a store with a server snapshot, so a server render and the first client render agree.
- **`sticky`, `stickyOffset` and `scrollContainerRef`** are `Toolbar`'s, over `Affix`.
- **`icon` and `trailing`** on a trigger and an action, with the icon at the bar's size step in `icon.default`.
- **`overflow="menu"` moves what does not fit into a "More" menu**, each menu a submenu and each action an item (`labels.more`; the default stays `scroll`). Each menu and action tells the bar what it is as it mounts (its label, icon, items or `onSelect`) and leaves a hidden marker in the bar, which gives the order they are drawn in even while one is not drawn; the bar draws every item, remembers each width, fits against the container's width (a bar is as wide as its items, so the bar's own width says nothing), and trims or restores from the remembered widths when the container resizes. A trimmed item renders only its marker, so Radix has no trigger for it. An item with keyboard focus is held until focus leaves. A hotkey for a menu that has moved is left to the browser. *(Amended 2026-11-01: this first read the bar's `Menubar.Menu` and `Menubar.Action` children, which made them direct children and hid any inside a component of the app's own.)*
- **The narrow-screen answer is a documented recipe, not a prop:** swap to a `Menu` or a `NavigationMenu` below a breakpoint, with the commands kept in one place.

## Alternatives considered
- **Let the app write the listener for `hotkeys`.** Rejected: every app wrote the same one, and the part that matters (focus on the first item, a key for a menu that moved, the browser's own keys) is easy to get wrong.
- **A data-driven `menus` array for the overflow menu.** Rejected, as in ADR-0162; reading the children costs the "direct children" rule, stated on the prop and the Docs page.
- **Read the bar's children for the overflow menu.** Rejected after the first build: it needs every menu to be a direct child of the bar, and a wrapper component of the app's own hides them.
- **Hide trailing items with `display: none` instead of removing them.** Rejected: they stay in Radix's collection and its arrow-key order, and focus lands on nothing.
- **Disable a trigger with Radix's `disabled` and show the reason anyway.** Rejected: a disabled button takes no pointer events or focus, so the reason can't be reached.
- **A `presentation` for touch.** Rejected, as in ADR-0162.

## Consequences
- A change to a shared part's shortcut drawing is a change to `Menu`, `ContextMenu` and `Menubar` together.
- Radix's closing-menu focus return is overridden once per hand-off to an action; the real-browser check that moves a real pointer onto an action fails without it.
- The registry and the overflow measurement are the wrapper's, so a Radix that changes how it opens by name is covered by the real-browser checks (actions, the hotkey, the reason, the overflow).
- `CommandPalette`'s imports changed path; nothing it draws did.

## Related
`04-component-inventory.md` (Menubar row), `05-component-api-conventions.md` §1 and §3, ADR-0120, ADR-0132, ADR-0146, ADR-0162, ADR-0163; `component-reviews/Menubar.md`.
