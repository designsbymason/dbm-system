# 0128 — `MultiSelect` pastes a list by matching labels, shows a count for chips, adds a pointer footer, locks the chips of disabled options and reports the chosen options, over text-only paste, chips everywhere or a keyboard footer

**Status:** Accepted · **Date:** 2026-10-25

## Context
Five more gaps came out of using the field in the places it is meant for: bringing in a list from a document, a field in a toolbar where chips crowd the row, finishing a choice on a phone where the list spans the screen, a chosen option that must stay chosen (an owner, a required member), and a list fetched as the person types, where the field forgot what it had chosen once the options changed.

## Decision
- **`pasteList` matches a pasted list to the options.** The text is split at the separators, line breaks and tabs, and each piece that is exactly an option's label (ignoring case and accents) is chosen; the pieces that are not are refused and counted ("3 added, 2 not added"), or one refused piece says what it was. It is off by default, so a paste with a comma in it is still text unless asked for, and `allowCustomValue` turns the same split on and makes chips of what matches no option ([ADR-0127](./0127-multiselect-answers-select-all-from-the-page-and-per-group-and-makes-typed-text-a-chip-only-when-asked-over-a-fixed-select-all-or-a-separate-tags-input.md)).
- **`overflow="summary"` shows a count in place of every chip,** one line at every size, never showing the chips (not even while the field is in use, unlike `wrap` and `collapse`). Options come out from the list, where each chosen one is checked, or with the clear button. The count describes the typing field, so it is read with the field's name.
- **`footer` adds a count, "Clear" and "Done" under the list,** for a pointer and a finger, as a responsive map (`{ base: true, sm: false }`) so it can be on only where the list spans the screen. Its buttons take no focus and are not tab stops, as the caret and clear buttons aren't: the keyboard closes with Escape and has the chips.
- **A chosen option that is disabled is locked:** its chip has no remove button, the reason is read after it, and the clear button, "Select all" and choosing it again in the list leave it. The clear button is hidden while everything chosen is locked. A locked chip has no focusable part, so the chip keys skip it; it can still be dragged.
- **`onValueChange` reports `selected`,** the option behind each of the new values in order (`undefined` for a typed value or an id never seen), taken from what the field has remembered, so it includes options that have left `options`.

## Alternatives considered
- **Paste always splits.** Rejected: a comma in a pasted phrase ("New York, NY") is ordinary text in a search, and a default that eats it would be a surprise.
- **Summary only while the field is idle, with chips while it is in use.** Rejected: that is `overflow="collapse"`'s job, and a toolbar field that grows when focused moves what is around it. A summary that never shows chips is predictable.
- **A footer in the tab order, or reachable with a key.** Rejected: focus belongs in the typing field, and each button's job has a key already; a button that took focus would end the combobox pattern the list relies on.
- **A locked chip that is dimmed.** Rejected: dimming text lowers its contrast for no gain, and the missing remove button and the spoken reason say what the colour would.
- **Reporting only the option that changed.** Kept as `option`, and `selected` added: a caller that wants every chosen option, not just the last, would otherwise have to remember them itself.

## Consequences
- A field that receives `value` from a store and `options` from a search can keep the chosen options from `selected` without a second fetch.
- A locked chip can't be reached by the keyboard, so a keyboard user does not meet it in the chip keys, and a screen reader's browse mode reads it with its reason.
- `footer` is not a part of the keyboard path; the Docs page says so.

## Related
`04-component-inventory.md` (MultiSelect row); ADR-0124, ADR-0127, [ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md); `component-reviews/MultiSelect.md`.
