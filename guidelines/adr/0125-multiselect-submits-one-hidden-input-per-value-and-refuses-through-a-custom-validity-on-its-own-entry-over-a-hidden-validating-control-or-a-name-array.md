# 0125 — `MultiSelect` submits one hidden input per value and refuses through a custom validity on its own entry, over a hidden validating control or a `name[]` array

**Status:** Accepted · **Date:** 2026-10-25

## Context
A field of several values must submit each, tell a surrounding `Form` it is invalid when empty (`required`) or short (`minSelected`), and be found by that form as the field it belongs to. `TagsInput` submits one hidden input per tag and refuses through a visually hidden, `required` control of its own ([ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md), [ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md)). `Form` attaches an invalid control to its `FormField` by the control's id, or by its name, and `Form` reads `form.elements.namedItem(name)` to find the field. A hidden validating control with neither lands in the form's summary as an unnamed "field-3", and nothing at the field shows its message.

## Decision
- **Each chosen value is its own hidden `<input>` under `name`,** as a group of checkboxes submits, read back with `getAll(name)`. With nothing chosen a single disabled hidden input keeps the name in the form's list of controls and submits nothing, so `Form` still finds the field.
- **`required` and `minSelected` are a custom validity on the typing field itself** (`setCustomValidity`, with `labels.required` or `labels.minSelected(min)`), set after every render. The typing field is the control a `FormField` gives its id to, so `Form` shows the message in the field's own error slot, focuses the field and marks it, and the browser's own validation focuses it too. It has no `name` and its text is never submitted. A read-only or disabled field is barred from constraint validation by the browser, as it should be.
- **`required` also sets `aria-required` on the typing field,** which is allowed on a combobox.

## Alternatives considered
- **A visually hidden validating control, as `TagsInput` has.** Rejected here: with no name and no id it is not tied to the `FormField`, so the form's message appears in the summary only and the focus goes to a control nobody can see (redirected by an `onFocus` hack). Giving it the field's name would submit a stray entry.
- **A `name[]` array, as `RangeSlider` submits its pair.** Rejected: a fixed pair suits two values; a list of any length is read the same way a checkbox group is, and `getAll` is the platform's own.
- **One hidden input holding a joined string.** Rejected: it forces the reader to split it and picks a separator no option's value may contain.
- **Validate in JavaScript only (a `FormField` `validate`).** Rejected: the browser's constraint validation would not refuse a form that has no `Form` around it.

## Consequences
- The form's message for an empty field is `labels.required`, not the browser's generic one, and is translatable.
- The disabled hidden input means a form reading its controls sees the name even when empty; a form that reads values sees no entry.
- `TagsInput` keeps its own approach, which is Finalized and works for its use; a field that wants this one can adopt it later.

## Related
`04-component-inventory.md` (MultiSelect row); [ADR-0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md), [ADR-0079](./0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md); `component-reviews/MultiSelect.md`.
