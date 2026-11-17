---
"@dbm-system/components": patch
---

`Indicators`: its description now says how it meets WCAG 2.5.8 (target size): the steps are smaller than 24 by 24 px, so the criterion is met through an equivalent control, which `Carousel` draws unless its controls are hidden (previous and next buttons of at least that size). Used on its own, provide that control yourself, or use `variant="bars"` from `sm` up. Nothing in how it looks or behaves changed.
