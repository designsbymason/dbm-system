---
"@dbm-system/tokens": patch
"@dbm-system/components": patch
---

`Tag`: the label of a hovered `subtle` or `outlined` tag in the `info`, `warning` or `danger` tone now holds 4.5:1 on its hover fill in the light themes (it was 4.15:1, 4.2:1 and 4.44:1), using three new semantic tokens, `text.info-hover`, `text.warning-hover` and `text.danger-hover`, one step darker than the status text colours. Only those six hover states change, in the light themes; the dark themes use the same colour as before, and every other component and state is as it was.
