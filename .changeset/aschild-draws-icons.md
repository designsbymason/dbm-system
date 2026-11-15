---
"@dbm-system/components": patch
---

`Button` and `IconButton` with `asChild` now draw their own pieces inside the element you give them. `Button` draws `leadingIcon`, `trailingIcon` and the loading spinner around the link's own text; `IconButton` draws `icon`, the spinner and the `label` caption inside an empty element (`<IconButton asChild icon={GithubLogoIcon} aria-label="GitHub"><a href="…" aria-label="GitHub" /></IconButton>`; the same name on the link keeps lint rules that check a link for content happy). Before, these props were dropped with a development warning. An `IconButton` element that already has content of its own is used as it is, so code that put the icon in the link by hand still shows one icon.
