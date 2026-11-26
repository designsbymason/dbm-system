# ListItem in Figma

**What is drawn.** 6 variants on the Typography page: a plain item, and an interactive item at `default`, `hover`, `focus`, `selected` and `disabled`. Booleans show a leading icon (`icon`) and trailing content (`trailing`), a text property `label` holds the text, and a slot holds the trailing content.

## Decisions

- **`interactive` is a variant property.** A plain item has no padding or fill and an interactive one has both, which changes the shape, so by the rules it is not a boolean. The two values are both drawn.
- **A plain item is drawn at `default` only.** The code gives hover, focus, selected and disabled styling to an interactive item only (a plain item that is `selected` or `disabled` warns and does nothing), so those combinations do not occur: 1 plain and 5 interactive variants. Selected together with disabled or focus is a recipe.
- **The marker is not drawn.** The bullet or number is the List's: a list item generates it from the list around it, and the item suppresses it only when a custom `icon` replaces it. The `List` molecule is not drawn yet, and a custom icon is the `icon` boolean.
- **The trailing content is a slot with a boolean.** The slot holds a `Badge` showing "3" as an example and is shown by `trailing`, pushed to the end because the label fills the row. A slot made with `createSlot()` on a component has its own default size and fill, so it was reset to hug its content and have no fill.
- **Selected needs a new style.** Selected text is semibold at the normal line height, and `Label/base` is semibold at a tighter 125%, so `Components/ListItemSelected/base` was added to `scripts/figma-sync.mjs` (68 text styles); the other states use `Body/base`.
- **Width and size.** The row is 280 px wide with the label filling it, where the code takes the width of its list. The text is `base`, and other sizes are a recipe, since the row's height follows the line height.
- **The focus ring** is a layer 6 px outside the row at `radius/lg`, as Button's.

## Differences from the code

See `deviations` in the map: the plain item at one state, the marker, the inherited size, the icon's tone, the width, the focus ring's radius, and the selected style.

## Not drawn

The marker, other text sizes, selected together with disabled or focus, and the ordinal `value`. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings. Checked on all 6 variants: the `space/2` gap, the interactive padding (`space/2`, `space/3`) and `radius/md` and the plain item's lack of both, the fill of each state (`bg/neutral-subtle` on hover, `bg/brand-subtle` on selected, none otherwise), the `opacity/40` binding on exactly the disabled variant, the label's style (`Body/base`, and `Components/ListItemSelected/base` on selected), its `text/primary` fill and its `label` reference, the `Icon/Check` instance (bold, tone default) with its width and height bound to `icon-size/sm` and its `icon` reference, the trailing slot (no fill, hugging, shown by `trailing`), the focus ring on exactly the focus variant with `border/focus`, `border-width/2` and `radius/lg`, the 280 px width, and the selected style's values and bindings; the five properties and their defaults against the map, the grid (the default in the top-left cell), the description and documentation link, the section fill, the spec frame (the 9 matrix instances from the set, the links, `7 of 13 props in code`, the token rows equal to the 11 variables the set binds and its two styles) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/ListItem/ListItem.tsx`, `ListItem`) and read back on all 6 variants. Approved by the maintainer 2026-11-26.
