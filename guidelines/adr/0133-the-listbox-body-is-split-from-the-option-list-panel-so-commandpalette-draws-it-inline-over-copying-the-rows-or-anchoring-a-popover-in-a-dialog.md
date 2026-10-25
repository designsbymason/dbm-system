# 0133 — The listbox body is split from the option list panel so `CommandPalette` draws it inline, over copying the rows or anchoring a popover in a dialog

**Status:** Accepted · **Date:** 2026-10-25

## Context
[ADR-0123](./0123-the-floating-option-list-is-shared-by-combobox-and-multiselect-through-internal-and-multiselect-draws-tagsinputs-box-and-chip-over-copying-them-or-adding-a-multiple-prop-to-combobox.md) extracted the option list for `Combobox` and `MultiSelect` and said `CommandPalette` would use it "without moving anything". `OptionListPanel` turned out to be the floating layer and the rows in one component: a Radix popover portal anchored to a field, with the listbox, its rows, headings and notes inside it. The palette's list sits inline in a `Dialog`'s panel, so it can use the rows but not the layer.

## Decision
- **`OptionListBody` is split out of `OptionListPanel`:** the listbox element, the rows, the group headings, the match marking and the empty row. `OptionListPanel` becomes the popover layer around `OptionListBody` plus the error, loading and footer notes, with the same output as before.
- **`OptionListBody` gains one optional prop, `renderTrailing`,** drawn after a row's text and before its check, so a consumer can add what a row ends with (a shortcut, a chevron, a spinner) without replacing the whole row through `renderOption`. `OptionListPanel` does not pass it, so `Combobox` and `MultiSelect` are unchanged.
- **Nothing else moves.** The match, rows, window and layout helpers, the stylesheet and the `ListOption` type stay where they are. The palette imports `OptionList.module.css` for the loading and error notes it draws itself (`05-component-api-conventions.md` §1, "a component may import another component's CSS module").
- **ADR-0123's sentence is amended in place** (a detail of that record, not its decision).

## Alternatives considered
- **Import only the helpers and write the rows again in the palette.** Rejected: about 120 lines of row rendering (icon space, match marking, descriptions, disabled reasons, the group names a windowed list must read out) would exist twice and drift.
- **Anchor a popover list under the palette's search field.** Rejected: a second layer inside a dialog is what [ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md) and ADR-0077 had to work around, and a palette's list is the window's content, not a floating suggestion.
- **Give `OptionListPanel` an `inline` mode.** Rejected: a panel that is sometimes a popover layer and sometimes not is a flag that changes what it is.

## Consequences
- `Combobox` and `MultiSelect` render the same; their real-browser and unit checks re-run as the proof, and their reviews are not reopened (a refactor with no change to output, [06 §9](../06-engineering-standards.md)).
- A later inline list (a tree's search, a mention list) can draw the body the same way.

## Related
`05-component-api-conventions.md` §1; ADR-0077, ADR-0123, ADR-0132; `component-reviews/Combobox.md`, `component-reviews/MultiSelect.md`.
