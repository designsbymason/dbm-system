# 0127 — `MultiSelect` answers "Select all" from the page and per group, and makes typed text a chip only when asked, over a fixed "Select all" or a separate tags input

**Status:** Accepted · **Date:** 2026-10-25 · **Amended 2026-10-25** — `maxTagLength` limits typed values, and a paste is matched through a lookup of options by label; the decision itself is unchanged

## Context
[ADR-0124](./0124-multiselect-is-a-combobox-over-a-multi-selectable-listbox-that-stays-open-and-keeps-chosen-rows-with-chips-outside-the-list-and-a-two-key-backspace-over-closing-on-choice-hiding-chosen-rows-or-removing-on-one-backspace.md) made "Select all" cover the options the list shows. That has three gaps: a list fetched as the person types holds only the page loaded now, so "all" is wrong; a long grouped list wants "all of this group"; and a field of suggestions (an email field) wants typed text to become a chip, which `TagsInput` does and `MultiSelect`'s `onCreate` does only through the owner.

## Decision
- **`onSelectAll` answers the row.** It is called with the typed text and the enabled options loaded now, and returns options or values (or a promise of them). The result is added to what is chosen up to `maxSelected`, and the returned options are remembered so their chips keep a label, tone and icon. The row is disabled while a promise is out, a rejection or a throw is announced as an error, and the row only ever adds (it can't know when "all" of a list it doesn't hold is chosen); removal is the clear button or the chips. It is offered once there is something to search or load.
- **`selectGroups` puts an action row under each group's heading,** covering that group's enabled options among the matches, toggling between "Select all in …" and "Deselect all in …" like the list-level row, stopping at `maxSelected`. It is an option row (not a button inside the heading), so it is reachable with the arrow keys, announced, and unaffected by windowing, where headings are plain rows. A group with nothing that can be chosen has none.
- **`allowCustomValue` makes typed text a chip,** in `TagsInput`'s way: Enter with no option highlighted, a separator (`separators`, a comma by default), a paste split at separators and line breaks, or leaving the field. Text that is exactly an option's label (ignoring case and accents) chooses that option instead, so a typed "canada" is the Canada chip and not a second value. A value already chosen, one longer than `maxTagLength` (typed values only; an option's own label is never limited, and the native `maxLength` is not set on the typing field, which is also a search), one `validate` refuses, a disabled option's text and one past `maxSelected` are refused, with a message under the field that is announced and cleared by the next keystroke. The first match is not highlighted while typing (`autoHighlight` follows `allowCustomValue`), so Enter commits what was typed, and an arrow key moves to an option when that is meant.
- **Rows for the field's own actions share one prefix on their value,** so none can collide with an option and none has its label marked as a match.

## Alternatives considered
- **A "Select all" that asks the page for a count and selects "everything matching" as a state** (an inverted selection). Rejected for now: it needs a value shape other than `string[]`, and `DataTable`'s select-all-across-pages already shows how much that costs ([ADR-0087](./0087-select-all-across-pages-is-a-state-of-its-own-for-a-table-that-holds-one-page-over-listing-ids-it-doesnt-have-or-an-inverted-selection.md)). Returning the values keeps the field a plain list of them.
- **A checkbox or button in each group heading.** Rejected: headings are not options and are plain rows in a windowed list, so it would be a second kind of interactive row with its own focus and announcement.
- **`allowCustomValue` as a different component (`TagsInput` with suggestions).** Rejected: `TagsInput` has no list; the two controls share the chip box, and one that has a list and also takes typed text is `MultiSelect` with a flag, as `Combobox` has `allowCustomValue`.
- **Committing typed text on Enter even when an option is highlighted.** Rejected: the highlight is the person's own choice.

*(Amended 2026-10-25: the match of a typed or pasted word to an option was a search through every option, which made a long paste quadratic in the options; it is a lookup in a map of options by folded label, built once, so the cost is proportional to the paste.)*

## Consequences
- The value stays a `string[]`: a typed value is the text itself, so it must not collide with an option's value, which a caller sees only if they use values that look like text.
- A form submits typed values as they were typed (trimmed), with no way to tell them from an option's value except by looking them up.
- An `onSelectAll` that returns thousands of values asks the field to render that many chips; `overflow="collapse"` or `maxVisible` is the way to keep that readable, and `maxSelected` stops it.

## Related
`04-component-inventory.md` (MultiSelect row); ADR-0124, [ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md), [ADR-0079](./0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md); `component-reviews/MultiSelect.md`.
