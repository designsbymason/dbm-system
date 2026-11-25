---
"@dbm-system/components": patch
---

`Tag`: fixes three defects and shortens a long label. A same-named prop (`role`, `tabIndex`, `aria-pressed`, `aria-disabled`, `aria-keyshortcuts`) no longer replaces what the tag computes, and a caller's `onKeyDown` no longer stops Enter and Space activating an interactive tag (it runs first and can claim a key with `preventDefault()`). The remove button's default name is "Remove" plus the plain text of the label, where `Status: {value}` gave "Remove Status: ,Active" and an element gave "Remove [object Object]", and an empty `removeLabel` now means the default instead of a blank name. A label wider than the room the tag is in is shortened with an ellipsis and the tag never outgrows its container, so the label is drawn in a `span` of its own (an icon-only tag draws none); the look of every tag that fits is unchanged. `TagsInput` and `MultiSelect` chips are drawn as before.
