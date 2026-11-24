---
"@dbm-system/components": minor
---

`CloseButton`: a new `tone` prop, `neutral` or `brand`, and **the default is now `neutral`**. Before, a `CloseButton` was always the brand colour; it is now `icon.default` with a `bg.neutral-subtle` hover fill, the same as `IconButton`'s neutral `tertiary`, and `tone="brand"` gives the earlier look (`icon.brand`, `bg.brand-subtle-hover`). The close buttons that `Dialog`, `Drawer` and `Popover` draw take the new default, so they turn neutral; to keep one brand-coloured, render your own `CloseButton tone="brand"` where the component lets you. Nothing else changes: the sizes, `rounded`, `hasBackground`, the focus ring and the accessible name are as they were.
