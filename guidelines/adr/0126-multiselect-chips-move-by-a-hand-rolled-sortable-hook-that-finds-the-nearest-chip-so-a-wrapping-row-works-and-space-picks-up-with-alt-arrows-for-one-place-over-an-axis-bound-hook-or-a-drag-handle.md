# 0126 — `MultiSelect` chips move by a hand-rolled sortable hook that finds the nearest chip, so a wrapping row works, and Space picks up with Alt and the arrows for one place, over an axis-bound hook or a drag handle

**Status:** Accepted · **Date:** 2026-10-25

## Context
[ADR-0043](./0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md) decided that reordering is built once, by hand, with no dependency, as an internal hook, "with the component that first needs it". `MultiSelect`'s `reorderable` is that component. Two things in that record did not fit a field of chips: its first version was for one list "one axis at a time", with wrapping layouts out of scope, and a chip's only focusable part is its remove button, which Enter and Space already activate.

## Decision
- **The hook is `useSortable` in `utils`,** internal (not re-exported from `@dbm-system/components`), with the scope ADR-0043 set: a controlled order (a gesture asks with `onMove(from, to)` and the owner applies it), pointer, touch and keyboard, announcements through callbacks, `rtl`, and nothing drawn by the hook.
- **The drop target is the item nearest the pointer, not a position along an axis,** and the marker goes before or after it by which half of it the pointer is in, in reading order (flipped in a right-to-left list). That is what lets a row that wraps onto several lines work with no extra code, which widens ADR-0043's first version without closing any door it kept open (moving between lists is still out).
- **A drag starts after a few pixels of movement,** so a press that doesn't move is still a click (the chip's remove button), and the click that ends a drag is swallowed. Move and up listeners are on `window`, cleaned up on unmount, and a cancelled pointer drops nothing. A touch drags at once, so a component that moves items by touch gives them `touch-action: none`; `MultiSelect` does that for its chips only while `reorderable`.
- **The keyboard path is ADR-0043's:** Space picks up, the arrow keys (flipped in a right-to-left list), Home and End move, Space or Enter drops, Escape puts it back, and leaving the chip drops it where it is. **Alt with an arrow key moves an item one place without picking it up,** as a shortcut for the common one-step move.
- **On a chip Space is taken for picking up, and Enter and Delete still remove.** A browser clicks a button when Space is released, so the hook also keeps the key's release from activating it.
- **A moved chip keeps its element,** since chips are keyed by their value, so focus stays on the chip that moved.
- **A drag marks the chip being moved (dimmed) and a bar beside the nearest chip; a chip picked up with the keyboard has a ring.** There is no floating copy of the chip following the pointer.

## Alternatives considered
- **A hook bound to one axis, with wrapping out.** Rejected: a field of chips wraps by default, and the nearest-item test costs nothing more.
- **A drag handle on each chip.** Rejected: a chip is small, a handle would double its width, and the chip has no other drag-conflicting gesture (its remove button is a click).
- **Enter to pick up.** Rejected: Enter removes a chip, which people expect.
- **Moving chips live while dragging (the others slide aside).** Rejected for now: a marker is enough to know where it will land, and animating a wrapping row is a larger piece of motion than the first version needs.

## Consequences
- `DataTable`'s column reordering, `EditorTabs` and `Tree` can adopt `useSortable`; a component that is scrolled by touch decides its own `touch-action`.
- `MultiSelect` chips cannot be scrolled from by touch while `reorderable` is on; the field is small and the page scrolls from anywhere else.
- Dragging, hit-testing and the drop marker are checked in a real browser with a real mouse (a wrapped row, and a right-to-left page); jsdom tests cover the keyboard and the pointer logic against mocked rectangles.

## Related
ADR-0043, [ADR-0124](./0124-multiselect-is-a-combobox-over-a-multi-selectable-listbox-that-stays-open-and-keeps-chosen-rows-with-chips-outside-the-list-and-a-two-key-backspace-over-closing-on-choice-hiding-chosen-rows-or-removing-on-one-backspace.md), [ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md); `component-reviews/MultiSelect.md`.
