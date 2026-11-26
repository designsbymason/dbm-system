---
"@dbm-system/tokens": patch
"@dbm-system/components": patch
---

`Avatar`: the initials of a hovered interactive `colorful` avatar in the `danger`, `warning` or `info` family now hold 4.5:1 on their hover fill in the light themes (they were 4.44:1, 4.2:1 and 4.15:1), using the `text.danger-hover`, `text.warning-hover` and `text.info-hover` tokens `Tag` already uses. Only those three hover states change, in the light themes; the dark themes, the brand and success families and every resting state are as they were. The three tokens' descriptions now name the avatar as well as the tag.
