# CloseButton in Figma

**What is drawn.** 24 variants in the neutral tone (the code's default; the brand and white tones are not drawn): three sizes (`sm`, `md`, `lg`), four states (default, hover, focus, disabled) and `rounded` off or on. An optional translucent backing, `hasBackground`, as a boolean. The box is 39, 42 and 55 px, the same as [IconButton](./IconButton.md)'s at each size.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, every state at every size with `rounded` off and on. `xs` and `xl` are listed as undrawn in the map with the box and icon sizes to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **Neutral is drawn and brand is a recipe.** The code gained a `tone` prop (`neutral`, the default, or `brand`) on 2026-11-23, at the maintainer's direction. The set draws the default, which is IconButton's neutral `tertiary` look with a fixed X: no fill at rest, `bg/neutral-subtle` on hover, the icon in `icon/default`. The brand tone (the icon in `icon/brand` and the hover fill `bg/brand-subtle-hover`) is in the map's `undrawn.tone` and the spec frame's "In code, not drawn" table with a recipe, as Button and IconButton do for their neutral tone. The set has a `tone` variant property with the one value `neutral`, in the axis order `tone`, `size`, `state`, `rounded`. The icon is the real `Icon/X` (bold, tone `default`), not a placeholder, because the code's icon is fixed.
- **The `white` tone is a recipe too** (2026-11-24, at the maintainer's direction): for a surface that is dark in every theme, the icon in `icon/white`, the hover fill `icon/white` at 20% opacity, the focus ring `border/white`, and with `hasBackground` the Scrim filled `bg/overlay` instead of `bg/scrim`. It is in the map's `undrawn.tone` and the spec frame's "In code, not drawn" table, and the `tone` property keeps the one drawn value `neutral`.
- **`rounded` is a variant property,** as on Button and IconButton, because it changes the corner radius.
- **`hasBackground` is a boolean showing a `Scrim` layer.** The code paints a `::before` at `bg/scrim` and 40% opacity above the hover fill and below the icon, with the box's own radius, so the layer sits in that order and takes the same radius in each variant. A boolean was enough: a variant property would have doubled the set. In the spec frame the scrim is shown over coloured tiles so its effect is visible, since `bg/scrim` is a light wash in the light themes.
- **The box is a fixed frame** bound to the `icon-button` size variables, so the spec frame's instances are set to their variant's fixed size, not to hug (a hugging instance shrinks to its icon).
- **The focus ring is a layer** 6 px outside the box at `radius/lg`, and the focused box's own radius drops to `radius/sm` (`full` when rounded), copied from IconButton's.

## Differences from the code

See `deviations` in the map: only the neutral tone, the fixed box, the scrim layer's order, the focus radius, `aria-label`'s default, and hover on disabled.

## Not drawn

The brand and white tones, `xs` and `xl`, and hover on `disabled`.

## Review

2026-11-23: reviewed again after the `tone` prop, one finding, applied. The spec frame's not-modelled line said "8 of 12 props in code"; the manifest now has 13, so it reads "8 of 13". Checked, for all 24 variants (neutral tone only): every combination in axis order with `tone=neutral, size=md, state=default, rounded=false` as the top-left cell, the hover fill `bg/neutral-subtle` and the icon tone `default` on every variant, the box at 39, 42 and 55 px bound to the `icon-button` variables, the corner radius for each state and rounded value, the 40% opacity bound on exactly the disabled variants, the focus ring on exactly the six focus variants, the hidden `Scrim` layer bound to 40%, and no unbound fill, stroke or opacity; the spec frame (instance of the master, 20 matrix instances of this set, the Tokens used row against the 16 variables the set binds, the not-modelled names against the manifest, the undrawn rows for `xs`, `xl` and `brand`), the set's description and documentation link, and the Section fill. Not checked: a dark theme render, where `bg/scrim` changes colour, the Components page row, and the Code Connect mapping after the variants were renamed. Approved by the maintainer 2026-11-23.

2026-11-24: the `white` tone was added in code, with no redraw. The spec frame gained a `tone white` row in "In code, not drawn", the Properties row and the set's description say brand and white are not drawn, and the map lists `white` under `undrawn.tone`. Read back in the file; the set, its 24 variants and the status (approved 2026-11-23) are unchanged.
