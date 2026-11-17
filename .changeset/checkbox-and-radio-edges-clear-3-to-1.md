---
"@dbm-system/components": patch
---

`Checkbox` and `Radio`: the edge of an unchecked box or circle is now `border.neutral-strong` (4.70:1 on the surface in the light themes, 6.08:1 in the dark ones; it was 2.32:1 in the light themes, under the 3:1 WCAG 1.4.11 asks of a control's boundary), and it darkens to `border.strong` on hover. The checked, error and disabled looks are unchanged.
