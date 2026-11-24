---
"@dbm-system/components": patch
---

`CloseButton`: `tone` gains `white`, for a surface that is dark in every theme (a lightbox, a video, a dark banner). The icon is `icon.white`, the hover fill is `icon.white` at `opacity.20`, the focus ring is `border.white`, and with `hasBackground` the grounding layer is `bg.overlay` instead of `bg.scrim`, so a white icon is never on a white layer. A new `CloseButtonTone` type is exported. `neutral` and `brand` are unchanged.
