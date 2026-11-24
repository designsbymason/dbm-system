---
"@dbm-system/components": patch
---

`Radio`: a circle drawn smaller than the 24 × 24px minimum target size (`xs`, `sm` and `md`, at 12, 16 and 20px) now has an invisible hit area of that size, so a press near it lands on it, as on `Checkbox`. Nothing visible changes: the circle, its states and its tokens are as they were, and `lg` and `xl` are unchanged.
