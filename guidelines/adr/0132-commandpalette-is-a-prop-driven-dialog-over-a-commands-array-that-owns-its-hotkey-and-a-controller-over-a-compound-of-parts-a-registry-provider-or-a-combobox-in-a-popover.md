# 0132 — `CommandPalette` is a prop-driven `Dialog` over a `commands` array that owns its hotkey and a controller, over a compound of parts, a registry provider or a `Combobox` in a popover

**Status:** Accepted · **Date:** 2026-10-25

## Context
`CommandPalette` is a ⌘K-style launcher: a hotkey opens a window with a search field and a list of commands, and choosing one runs it. The inventory names it as "`Dialog` plus `Combobox`-style search". Several shapes could carry that, and the guidelines say nothing about a global keyboard shortcut, which no component has needed until now.

## Decision
- **It is a `Dialog` with a search field and a list in it, prop-driven over data** (like `ConfirmDialog` over `AlertDialog`). `commands` is an array of `CommandItem` (the `ListOption` shape of [ADR-0078](./0078-combobox-takes-its-options-as-data-over-option-parts-mounted-as-children.md), plus a `shortcut`, an `onSelect`, a `closeOnSelect` and `items` for a sub-list). It has no sub-parts. The panel is placed at the top (`Dialog`'s `placement="top"`) so it does not jump as the results change.
- **The search field is a native `<input>` the palette draws, not the `Input` atom.** A palette's search row is borderless and fills the header; `Input` is a bordered one-row box with its own ring, and adding a borderless look to a Finalized atom to serve one component is a larger change than the field it replaces (`TagsInput` and `PinInput` draw their own for the same reason). The row's focus ring is drawn inside it, with a negative offset, as the field rule requires.
- **The list is inline.** Focus stays in the field and the highlighted row is pointed at with `aria-activedescendant` (the combobox pattern of [ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md)), but in the dialog's own panel, not a second layer. See [ADR-0133](./0133-the-listbox-body-is-split-from-the-option-list-panel-so-commandpalette-draws-it-inline-over-copying-the-rows-or-anchoring-a-popover-in-a-dialog.md).
- **It owns its hotkey.** `hotkey` defaults to `"mod+k"` (`mod` is ⌘ on an Apple platform and Ctrl elsewhere, read from `navigator` when the key is pressed, so nothing differs between a server render and the first client render) and toggles the palette from anywhere on the page, including from inside a text field. `hotkey={false}` turns it off. The listener is attached to `document` from an effect and calls `preventDefault`, which takes the combination from the browser where it has one. A command's `shortcut` only *displays* a key, as `Menu`'s does: the app binds it.
- **It can be driven from code.** `open`/`defaultOpen`/`onOpenChange(open, { reason })` as the other overlays, with `reason` including `"hotkey"`, `"select"` and `"controller"`; `controllerRef` and `useCommandPaletteController()` give `open()`, `close()`, `toggle()` (each says whether it had anything to do) and `isOpen`, per `05-component-api-conventions.md` §3. The identity never changes.
- **Recent commands are the caller's.** `recent` is a list of values shown first while the search is empty; the palette stores nothing.
- **A phone gets the same panel.** `fullScreen` is passed to `Dialog` and is off by default; making it the default on a phone waits for a real device, as [ADR-0081](./0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md) did.

## Alternatives considered
- **A compound (`CommandPalette.Input`/`List`/`Group`/`Item`).** Rejected: the list must know every command to rank, count, announce and window them, and a long list is drawn a window at a time, which mounted child parts cannot support (ADR-0078).
- **A registry: a provider and `useRegisterCommands` so any component can add commands.** Rejected for now: it decides whose state owns "which commands exist", and a prop is enough to build one. The provider shape of [ADR-0070](./0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md) can be added later without changing this one.
- **A `Combobox` in a `Popover`.** Rejected: the combobox's list is a second layer anchored to a field, with a field's value and validation; a palette has no value, no form and a list that is the whole window.
- **The `Input` atom, or a new borderless look on it.** Rejected above.
- **No built-in hotkey; the app wires one to `open`.** Rejected: every palette needs the same key, the platform rule (⌘ or Ctrl) is easy to get wrong, and an app that wants none passes `false`.
- **Bind each command's `shortcut` too.** Rejected: it would make the palette a global key router with conflicts to resolve; the display-only rule matches `Menu`.

## Consequences
- The palette's bundle holds `Dialog`, the list body and its rows; its JS budget is set above the 10KB default with the measured size beside it.
- The hotkey takes `Ctrl+K` from browsers that reserve it, which the Docs page says; `hotkey` can be any other combination.
- The palette does not persist anything and has no global command store.

## Related
`04-component-inventory.md` (CommandPalette row), `05-component-api-conventions.md` §3, ADR-0052, ADR-0066, ADR-0070, ADR-0076, ADR-0078, ADR-0120, ADR-0133, ADR-0134; `component-reviews/CommandPalette.md`.
