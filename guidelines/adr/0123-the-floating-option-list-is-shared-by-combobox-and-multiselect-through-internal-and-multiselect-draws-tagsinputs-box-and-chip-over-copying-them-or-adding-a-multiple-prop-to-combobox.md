# 0123 — The floating option list is shared by `Combobox` and `MultiSelect` through `internal/optionList`, and `MultiSelect` draws `TagsInput`'s box and chip, over copying them or adding a `multiple` prop to `Combobox`

**Status:** Accepted · **Date:** 2026-10-25

## Context
`MultiSelect` chooses several options from a long list and shows them as removable chips. Two Finalized components already hold what it needs: `Combobox` has the list (options as data, grouping, matching, marking, windowing, the floating layer, a full-width presentation, announcements), and `TagsInput` has the chips (a wrapping box, the roving chip keys, the width-driven collapse). Neither could be used as it stood: `Combobox`'s list was 350 lines of rendering and four hooks' worth of state inside a 926-line component, with its stylesheet and helpers in the component's own folder, and `TagsInput`'s chip and box were private to it.

`05-component-api-conventions.md` §1 says a stylesheet may be imported by a later component when the two must look identical, and that shared code moves to `internal/` when a third component needs it. `CommandPalette` (the third consumer of the list) is named in the inventory but not built.

## Decision
- **The list is extracted now, at the second consumer.** The panel, its rows and notes, the matching and row helpers, the windowing hook, the layout hook (the field's width, and the full-width presentation measured against the visual viewport) and the in-field caret and clear buttons live in `internal/optionList/`. `Combobox` is rebuilt on them with no change to what it renders or does; its unit and real-browser checks pass unchanged (the helper tests moved with the helpers, and the docs-token test now reads the shared stylesheets). The rule says to wait for the third consumer, but here the third is certain, and what is shared is code and not only a stylesheet, which can't be imported from a component's folder.
- **The list's tokens keep the `combobox.*` names** (`list-max-height`, `option-height.*`): they are the same rows, and renaming a token that a Finalized component and its Docs page list buys nothing.
- **The rows for the field's own actions are told from options by a value prefix.** "Create …" and "Select all" are rows with a value that starts with a character no option's value will, drawn without marking the typed text in them.
- **`MultiSelect`'s box and chips are `TagsInput`'s.** It imports `TagsInput`'s stylesheet (the two must look identical, which is the case `05` §1 allows) and its chip, moved unchanged into its own file (`TagsInputChip`), and the collapse arithmetic (`fitCount`). The chip row's focus, key and collapse logic is written again as a hook in `MultiSelect`'s folder, because lifting it out of `TagsInput` would reopen a Finalized component for no gain in behaviour; it is the same model, and a later change can have `TagsInput` adopt the hook.
- **`MultiSelect` is its own component, not a `multiple` prop on `Combobox`.**

## Alternatives considered
- **A `multiple` prop on `Combobox`.** Rejected: the value changes type (`string` against `string[]`), the field changes (a one-row `Input` against a wrapping box of chips), the keys change (Backspace, the left arrow, Escape), the form submission changes (one hidden input against one per value) and the validation changes. That is the "growing list of mutually-exclusive flags" that `06` §2 says should be a separate component, and the inventory already names `MultiSelect` as one.
- **Copy the list into `MultiSelect`.** Rejected: 350 lines of rows, windowing and floating-layer handling that must stay identical in two components, in a design system that exists to keep one answer to one question.
- **Import `Combobox`'s stylesheet and export its rendering from `Combobox`'s folder.** Rejected: the rules are not `Combobox`'s, and a third consumer would import from a sibling's folder.
- **A headless `useOptionList` hook that returns props for the caller to render.** Rejected: the rendering is most of what is shared, and a hook that hands it back out would have each caller write the rows again.

## Consequences
- `Combobox` is Finalized and was changed, so the three-question test of `06` §9 applies: its rendered and behavioural output is unchanged (every unit and real-browser check passes, the moved helper tests and the docs-token test aside), so it stays Finalized. The shared stylesheet's class names and the two CSS custom properties the list reads (`--combobox-width`, `--combobox-room`) are now a contract between the components.
- A change to the list (a row, a key, the windowing) reaches both fields, and `Combobox`'s and `MultiSelect`'s real-browser checks must both be re-run.
- `MultiSelect`'s bundle holds the list, the chip and the popover layer (12.45KB of JS, with a 14KB budget). `TagsInput` is unchanged in what it renders.
- `CommandPalette`, when built, uses `internal/optionList` without moving anything.

## Related
`05-component-api-conventions.md` §1; [ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md), [ADR-0078](./0078-combobox-takes-its-options-as-data-over-option-parts-mounted-as-children.md), [ADR-0080](./0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md), [ADR-0081](./0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md), [ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md), [ADR-0050](./0050-tagsinput-chips-are-one-tab-stop-with-arrow-key-movement-and-tag-lets-its-remove-button-leave-the-tab-order.md); `component-reviews/MultiSelect.md`, `component-reviews/Combobox.md`.
