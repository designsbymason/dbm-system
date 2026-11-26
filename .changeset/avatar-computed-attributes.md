---
"@dbm-system/components": patch
---

`Avatar`: the `role`, `aria-disabled` and native `disabled` it works out can no longer be replaced by props of the same name (a `role="presentation"` used to drop an avatar's name, and `aria-disabled={false}` re-enabled a disabled link avatar). A plain avatar with no name, or one that is not disabled, still takes a `role` or `aria-disabled` you pass. Nothing else changes.
