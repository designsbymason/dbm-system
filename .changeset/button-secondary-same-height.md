---
"@dbm-system/components": patch
---

`Button`: the `secondary` variant is now the same height as the other variants at every size. Its 1px outline used to add 2px to its height, so a `secondary` button beside a `primary` one was taller; its block padding now gives the outline back. Nothing else changes: the other variants, `IconButton` and the components sized to a `Button` keep their heights.
