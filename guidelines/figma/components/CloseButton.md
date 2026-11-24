# CloseButton in Figma

**What is drawn.** 24 variants: three sizes (`sm`, `md`, `lg`), four states (default, hover, focus, disabled) and `rounded` off or on. An optional translucent backing, `hasBackground`, as a boolean. The box is 39, 42 and 55 px, the same as [IconButton](./IconButton.md)'s at each size.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, every state at every size with `rounded` off and on. `xs` and `xl` are listed as undrawn in the map with the box and icon sizes to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **It is IconButton's `tertiary` look with a fixed X.** No fill at rest, `bg/brand-subtle-hover` on hover, the icon in `icon/brand`, as the code says it is styled to match. The icon is the real `Icon/X` (bold, tone `brand`), not a placeholder, because the code's icon is fixed.
- **`rounded` is a variant property,** as on Button and IconButton, because it changes the corner radius.
- **`hasBackground` is a boolean showing a `Scrim` layer.** The code paints a `::before` at `bg/scrim` and 40% opacity above the hover fill and below the icon, with the box's own radius, so the layer sits in that order and takes the same radius in each variant. A boolean was enough: a variant property would have doubled the set. In the spec frame the scrim is shown over coloured tiles so its effect is visible, since `bg/scrim` is a light wash in the light themes.
- **The box is a fixed frame** bound to the `icon-button` size variables, so the spec frame's instances are set to their variant's fixed size, not to hug (a hugging instance shrinks to its icon).
- **The focus ring is a layer** 6 px outside the box at `radius/lg`, and the focused box's own radius drops to `radius/sm` (`full` when rounded), copied from IconButton's.

## Differences from the code

See `deviations` in the map: the fixed box, the scrim layer's order, the focus radius, `aria-label`'s default, and hover on disabled.

## Not drawn

`xs` and `xl`, and hover on `disabled`.

## Review

2026-11-23: reviewed with no findings. Checked, for all 24 variants against the code's rules: every combination present and in axis order, the default `size=md, state=default, rounded=false` as the top-left cell, the fill (none except `bg/brand-subtle-hover` on hover), the box at exactly 39, 42 and 55 px with its width and height bound to the `icon-button` variables, the corner radius for each state and rounded value, the 40% opacity on exactly the disabled variants, the focus ring on exactly the focus variants, the icon (`Icon/X`, bold, tone `brand`, at its size's step), the `Scrim` layer (`bg/scrim`, 40% opacity bound, the box's radius, hidden by default, bound to `hasBackground`, and beneath the icon), and no unbound fill or stroke; the spec frame (instance of the master, every slot filled, all 20 matrix instances of this set at their variants' fixed sizes, every variable the set binds in Tokens used, the not-modelled names against the manifest), both links, the set's description and documentation link, the Section fill and the Components row. A hug-sized instance shrinking to its icon was caught and fixed while building. Not checked: a dark theme render, where `bg/scrim` changes colour. Approval by the maintainer is pending.
