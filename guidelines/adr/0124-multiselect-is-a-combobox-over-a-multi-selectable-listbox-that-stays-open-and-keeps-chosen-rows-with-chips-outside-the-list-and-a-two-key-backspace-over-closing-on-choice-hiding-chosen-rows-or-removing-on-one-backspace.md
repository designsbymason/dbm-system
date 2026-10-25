# 0124 — `MultiSelect` is a combobox over a multi-selectable listbox that stays open and keeps chosen rows, with the chips outside the list and a two-key Backspace, over closing on a choice, hiding chosen rows or removing on one Backspace

**Status:** Accepted · **Date:** 2026-10-25

## Context
A field for several choices has to answer questions `Combobox` (one choice) and `TagsInput` (free text, no list) never faced together: what role the field and its list have, whether the list closes after a choice, what happens to the chosen options in the list, how a person reaches and removes a chip, what "select all" covers, and what happens to half-typed text when the field is left.

## Decision
- **The role is the WAI-ARIA combobox with a `listbox` that is `aria-multiselectable`.** The typing field is `role="combobox"` and points at the highlighted option with `aria-activedescendant`, as `Combobox` does; each option is `aria-selected`. The chips are not in the listbox: they are a named list ("Selected options") beside the typing field, in `TagsInput`'s box.
- **The list stays open after a choice, and the text that narrowed it is cleared.** Several choices in a row are the point of the control. `closeOnSelect` closes it instead. The highlight stays on the option just chosen, so a keyboard user's next press moves from where they were and the list does not jump.
- **Chosen options stay in the list, marked with a check,** and choosing one again removes it. Hiding them would move the rows under the pointer and make removal a different gesture from choosing.
- **The chips are not tab stops; the field is one.** The arrow key toward the chips from the start of the typing field reaches them (the model of [ADR-0050](./0050-tagsinput-chips-are-one-tab-stop-with-arrow-key-movement-and-tag-lets-its-remove-button-leave-the-tab-order.md)), the arrow keys move among them and Delete removes one.
- **Backspace on an empty typing field moves to the last chip, and a second Backspace removes it.** In `TagsInput` one press removes the last tag, since a tag is what was just typed and is trivially typed again. A chip here is a choice made from a list, and removing it by the key that deletes the last letter of a word is too easy to do by accident.
- **Escape closes the list, and a second Escape clears the typed text.** With the list closed Escape clears text only while there is some, so it still belongs to a surrounding `Dialog` otherwise.
- **Leaving the field drops the typed text** and closes the list. Text is a way of finding an option, never a value (`onCreate` is the way to make one), so nothing is committed from it, unlike `TagsInput`'s `addOnBlur`.
- **"Select all" is a first row that covers the enabled options the list shows,** so while text is typed it covers the matches, which is what "everything I just searched for" means. It stops at `maxSelected` and says so. Once every option it covers is chosen it reads "Deselect all" and removes only those, so a choice made earlier from outside the search stays. While text is typed Enter chooses the first match, never the Select all row.
- **`maxSelected` disables the unchosen options with a reason (`labels.limitReached`),** and leaves the chosen ones available to remove.

## Alternatives considered
- **Close the list after each choice.** Rejected as the default: a person adding five labels would reopen it five times. It stays one prop away.
- **Remove chosen options from the list.** Rejected, as above.
- **Remove the last chip on one Backspace.** Rejected: a slip loses a choice with no list in view to see it was one.
- **Make every option a checkbox (`role="checkbox"` rows, or a `listbox` of `aria-checked`).** Rejected: the `listbox` with `aria-multiselectable` and `aria-selected` is the pattern a combobox popup of several choices has, and the rows are not focusable (focus stays in the field), so a checkbox's own keys would not apply.
- **Select all covers every option, whatever is typed.** Rejected: it would make a search a way to pick a few and "select all" a way to pick everything with no way to pick all of a search.
- **Commit typed text as a chip when the field is left.** Rejected: that is `TagsInput`. Here it would turn a half-typed search into a value the list never offered.

## Consequences
- A screen reader hears "N selected" after each choice and removal, from a status region that was already in the page, and the matches count only as the person types.
- The two-key Backspace and the arrow into the chips are the only way to reach a chip by keyboard, so the typing field's description says so once something is chosen (`labels.chipsHint`).
- A form's `minSelected` is a rule on the field, not on the list: a person can remove chips below it (see [ADR-0125](./0125-multiselect-submits-one-hidden-input-per-value-and-refuses-through-a-custom-validity-on-its-own-entry-over-a-hidden-validating-control-or-a-name-array.md)).

## Related
`04-component-inventory.md` (MultiSelect row); [ADR-0123](./0123-the-floating-option-list-is-shared-by-combobox-and-multiselect-through-internal-and-multiselect-draws-tagsinputs-box-and-chip-over-copying-them-or-adding-a-multiple-prop-to-combobox.md); `component-reviews/MultiSelect.md`.
