---
"@dbm-system/components": patch
---

`Tag` takes an optional `labelRef`, a ref to the element that holds its label (`null` for an icon-only tag), so a caller can measure whether the text is cut. `TagsInput` and `MultiSelect` use it to show the whole text in a tooltip only for a cut chip, and so no longer draw a truncating span of their own inside the tag; what is drawn is unchanged.
