# 0119 — `Menu`'s item parts draw with the Radix parts a context supplies, so `ContextMenu` shares them, over copying them or extracting them early

**Status:** Accepted · **Date:** 2026-10-24

## Context
`ContextMenu` is to look and behave like `Menu` for everything inside the panel: icons, descriptions, trailing content, a promise from `onSelect`, `disabledReason`, `closeOnSelect`, checkbox and radio items, groups and submenus ([ADR-0066](./0066-menu-items-take-a-promise-a-close-on-select-setting-a-reason-for-being-disabled-and-a-description-and-a-menu-reports-when-it-has-closed.md)). Those parts are about 700 lines in `Menu.tsx`, drawn with Radix DropdownMenu's `Item`, `CheckboxItem`, `RadioItem`, `Group`, `Label`, `Separator`, `Sub`, `SubTrigger` and `SubContent`. Radix ContextMenu has its own versions of each over the same `react-menu`, and they are not interchangeable: a dropdown item under a context menu's root throws "`MenuItem` must be used within `Menu`", because each root provides the scope its own parts read (tried). [ADR-0065](./0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md) settled the stylesheet (`ContextMenu` imports `Menu`'s) and left extracting the parts to the third consumer.

## Decision
- **The item parts read a "kit" of Radix parts from a context** (`MenuPrimitiveContext`, in `Menu`'s `MenuContext.ts`), defaulting to DropdownMenu's, so `Menu` provides nothing and is unchanged. `ContextMenu.Content` provides Radix ContextMenu's kit around its children (not at the root, so a `Menu` drawn inside the trigger area, such as a row's "more" button, keeps the dropdown's parts), and `ContextMenu.Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `Label`, `Group`, `Separator`, `Sub`, `SubTrigger` and `SubContent` are `Menu`'s own parts, exported from `Menu.tsx` as `menuSharedParts`.
- **`Menu`'s stylesheet reads the popper's own custom properties** (`--radix-popper-available-height`, `-width` and `-transform-origin`) instead of `--radix-dropdown-menu-content-*`. The latter are aliases of the former that only DropdownMenu sets; Radix ContextMenu sets `--radix-context-menu-content-*`, so the panel rules would have found nothing under it. The rendered result for `Menu` is unchanged (its checks measure the panel's caps).
- **`Menu`'s name appears in a development warning from a shared part** (for example "Menu: `disabledReason` has no effect on an item that is not `disabled`") when it is used under a `ContextMenu`. Accepted for now; it names the part, which has the same props.

## Alternatives considered
- **Copy the item parts into `ContextMenu`.** Rejected: 700 lines of behaviour (the pending state, the reason tooltip, the indicator) duplicated, and two copies to keep identical.
- **Extract them to `internal/menu` now.** Rejected, as in ADR-0065 and [ADR-0056](./0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md): `Menubar` is the third consumer and the moment to extract. The kit is a small step toward it and moves nothing.
- **Render DropdownMenu's parts under the context menu's root.** Rejected: it throws (above).
- **Alias the dropdown's custom properties on the context panel in `ContextMenu`'s stylesheet.** Rejected: the submenu panel is `Menu`'s own and sits outside it, so each shared panel would need its own alias.

## Consequences
- `Menu`'s sub-parts gain one context read each and its stylesheet four renamed custom properties: an internal change with no change to what is drawn, so `Menu` stays Finalized (`06` §9's three-question test: no output change); its 124 unit tests and 58 real-browser checks pass.
- `Menubar` provides the same kit (its own Radix part set) when it is built, and that is when the item parts are extracted.
- A change to a shared part is a change to both components, and each Docs-token test reads both stylesheets.

## Related
`05-component-api-conventions.md` §1, ADR-0056, ADR-0064, ADR-0065, [ADR-0118](./0118-contextmenu-wraps-radix-contextmenu-pinned-at-2-3-7-on-the-menu-release-train-holds-its-own-open-state-and-is-modal-with-a-long-press-over-the-newest-release-or-a-hand-rolled-trigger.md); `component-reviews/Menu.md`, `component-reviews/ContextMenu.md`.
