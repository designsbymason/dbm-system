# 0163 — The menu's item parts, context and stylesheet move to `internal/menu` at the third consumer, over `Menubar` importing them from `Menu`

**Status:** Accepted · **Date:** 2026-11-01

## Context
[ADR-0065](./0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md) settled that the menu's stylesheet is shared and left extracting the parts to the third consumer, and [ADR-0119](./0119-menus-item-parts-draw-with-the-radix-parts-a-context-supplies-so-contextmenu-shares-them-over-copying-them-or-extracting-them-early.md) made the parts read their Radix parts from a context so `ContextMenu` could share them from `Menu.tsx`, naming `Menubar` as the moment to extract. `Menubar` is that consumer. `Menu.tsx` held the root, trigger and content of the dropdown (about 330 lines) and, after them, about 700 lines of parts that never touch the dropdown's own primitive.

## Decision
- **The item, checkbox, radio, label, group, separator and submenu parts, the viewport that scrolls a panel, the size classes, `MenuContext` and the stylesheet move to `internal/menu/`** (`menuParts.tsx`, `MenuContext.ts`, `menu.module.css`). `Menu`, `ContextMenu` and `Menubar` each draw their own root, trigger and panel and provide the Radix parts their root needs through `MenuPrimitiveContext`.
- **Nothing is renamed.** The class names in the stylesheet, the parts' display names (`Menu.Item` and the rest) and `menuSharedParts` are unchanged; `Menu.tsx` re-exports `menuSharedParts`, `MenuViewport` and the size classes, so `ContextMenu` changes only its import paths.
- **The prop types stay in `Menu.types.ts`,** and `internal/menu` reads them from there (type-only). Moving them would rename every export of a Finalized component's public types for no gain.
- **Each Docs-token test reads the one stylesheet** (`Menu`'s, `ContextMenu`'s and `Menubar`'s) plus its own.

## Alternatives considered
- **`Menubar` imports the parts from `Menu`, as `ContextMenu` does.** Rejected: that was the stop-gap for the second consumer; with three, a component importing another's private file is the thing `05` §1 says to avoid, and `Menu.tsx` would keep carrying 700 lines that are not its own.
- **Move the parts and the types together.** Rejected for the reason above.
- **Split the stylesheet into a shared item file and a panel file.** Rejected: the panel, items and submenu rules read each other's custom properties (`--menu-*`), and the result would be two files to keep in step for one look.

## Consequences
- A change to a shared part is a change to all three components, and each Docs-token test sees it.
- `Menu` and `ContextMenu` stay Finalized: the move changes no output (`06` §9's three-question test: no). Their unit tests (4,615 across all organisms) pass unchanged but for the stylesheet's import path, and their real-browser checks are run with this change.
- `check-component-bundle-size` counts the shared code in each importer.

## Related
`05-component-api-conventions.md` §1, ADR-0065, ADR-0119, ADR-0162; `component-reviews/Menu.md`, `component-reviews/ContextMenu.md`, `component-reviews/Menubar.md`.
