# 0145 — `EditorTabs` is a data-driven strip built on `Tabs` with a `Tabs.Item` part, and it asks the owner for closes, adds and moves, over a compound strip, a list it owns or a touch drag

**Status:** Accepted · **Date:** 2026-10-29

## Context
`EditorTabs` was scoped as its own organism when `Tabs` was reviewed: tabs a person opens, closes, adds and arranges (open files, open records, saved views), where the tab set is the person's working state. Four forks had to be settled before building it.

1. A closable tab needs a close control, but a `Tabs.Trigger` is a `<button role="tab">`, and a button inside a button is invalid. The control has to be a sibling of the tab button.
2. Whether the strip owns the list, or the owner does, and what closing the selected tab selects.
3. Whether it draws panels.
4. How a tab is moved, given that a touch press on a scrolling strip is a scroll, and `useSortable` ([ADR-0043](./0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md), [ADR-0126](./0126-multiselect-chips-move-by-a-hand-rolled-sortable-hook-that-finds-the-nearest-chip-so-a-wrapping-row-works-and-space-picks-up-with-alt-arrows-for-one-place-over-an-axis-bound-hook-or-a-drag-handle.md)) has no way to tell a scroll from a drag on a touch screen.

## Decision
**Built on `Tabs`, with one additive part.** `Tabs.Item` wraps one `Tabs.Trigger` and an optional `action`, drawn at the tab's end as a sibling of the tab button. The trigger keeps every look it has (fill, underline, border, focus ring) and its place in the roving-focus order; the item only makes a positioning box, reserves room at the trigger's end and draws the action over it. Bare triggers and items mix in one list, and nothing changes for `Tabs` used on its own. `EditorTabs` composes `Tabs`, `Tabs.List`, `Tabs.Item`, `Tabs.Trigger` and `Tabs.Content`, so it inherits the variants, sizes, scrolling, fades and scroll buttons.

**The action is hidden from assistive technology and out of the tab order.** A `tablist` may own only tabs (axe's `aria-required-children` fails a button inside one), so the close button is a pointer shortcut. The same operation is the Delete key on a focused tab (`aria-keyshortcuts="Delete"`), a middle-click, and `tabContextMenu`.

**The owner owns the list.** `tabs` is the order and the contents; `onClose`, `onAdd` and `onReorder` ask, and the strip shows the array it is given next ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)). Closing is off without `onClose`, adding without `onAdd`, reordering without `onReorder`.

**Closing selects a neighbour, once the tab has gone.** `closeSelects` is `"neighbor"` by default (the next enabled tab, else the one before) or `"none"`. The choice is made in the commit in which the closed tab leaves `tabs`, not when the close is asked, so a close the owner refuses (a dialog about unsaved changes) selects nothing. Focus is handed to the neighbour only if it was inside the strip and has been lost. A new tab takes selection and focus only if the owner selects it.

**Panels are optional.** `EditorTabs.Panel` is `Tabs.Content`, with `forceMount` to keep an editor's state. A tab points at a panel (`aria-controls`) only when one is drawn for it.

**Reordering uses `useSortable` for the keyboard and a mouse or pen, and a menu for touch.** The hook gets `autoScroll`, which scrolls the container while an item is dragged near its edge. Pinned tabs go first and are not movable by drag or keyboard, so the hook is given only the unpinned tabs (indexes offset by the pinned count) and can never put one among the pinned. A touch press is a scroll of the strip, so it does not start a drag; a person on a touch screen, or who can't drag, moves a tab through `tabContextMenu` (a long press opens it) whose context hands `close()`, `move(to)` and `select()`, with the controller offering the same.

**A per-tab menu is a render prop of `ContextMenu` items**, as `DataTable`'s `rowContextMenu` ([ADR-0122](./0122-datatable-opens-a-rows-context-menu-through-a-render-prop-that-chooses-the-row-first-and-is-told-the-selection-over-a-menu-per-consumer-or-a-menu-that-ignores-the-selection.md)), drawn only while the menu is open. It does not change the selection.

**An overflow menu is an option.** `overflow="menu"` adds a button beside the strip listing every tab as radio items, as `Toolbar` moves what doesn't fit into a menu ([ADR-0068](./0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md)).

**Two component tokens** (`editor-tabs.tab-min-width`, `editor-tabs.tab-max-width`): the narrowest a tab gets and the widest before its name is cut with an ellipsis. Neither has a home on the spacing scale.

## Alternatives considered
- **Compose Radix Tabs directly and share `Tabs`' stylesheet through `internal/`.** Leaves `Tabs` untouched, but two copies of the tab looks and the overflow handling would drift, and an organism built from the system's own molecules is the rule (`06-engineering-standards.md` §9, atom reuse).
- **A button inside the tab button, or a click handler on a part of the tab.** Invalid nesting; a click target that isn't a control.
- **Leave the close button focusable and named in the list.** Fails the ARIA tablist pattern, and a second tab stop per tab breaks the single tab stop.
- **The strip owns the list.** One less thing for the caller, but it then has to ask about unsaved changes, applies moves the owner may refuse, and is no longer controlled.
- **Select the neighbour when the close is asked.** Simpler, but a refused close leaves the wrong tab selected.
- **Tap to move on a touch screen** (`useSortable`'s `tapToMove`). Every tap would pick a tab up, so a tab could not be selected by touch.
- **Touch drag with `touch-action: none` on the tabs.** The strip could then not be scrolled by touch; the scroll buttons and fades are not enough for 20 tabs.
- **A drag handle on each tab.** Costs width in a strip, and a handle on touch still fights the scroll.
- **Panels always drawn by the strip.** Most apps put the content in a router or an editor of their own.

## Consequences
- `Tabs` gains one part and its review file records it; its existing output is unchanged.
- Any component that wants a control beside a tab, or beside a trigger inside a roving list, has the same constraint: the control is a pointer shortcut and the keyboard path is a key or a menu.
- `useSortable` has two consumers, `MultiSelect` and `EditorTabs`, and is still internal. A drag on a touch screen is not supported; the menu is the single-pointer alternative, and an app that offers `onReorder` should offer `tabContextMenu` with "Move left" and "Move right".
- Pinned tabs cannot be reordered among themselves by drag or keyboard; the owner reorders them, or the controller and the menu do.
- A tab's close button is not announced by a screen reader; a screen-reader user closes a tab with Delete or the menu.

## Related
`04-component-inventory.md` (Navigation, organism build order, reordering); `05-component-api-conventions.md` §3 (a gesture asks, it does not apply; `controllerRef`); [ADR-0043](./0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md); [ADR-0050](./0050-tagsinput-chips-are-one-tab-stop-with-arrow-key-movement-and-tag-lets-its-remove-button-leave-the-tab-order.md). Components: `Tabs`, `EditorTabs`.
