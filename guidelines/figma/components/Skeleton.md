# Skeleton in Figma

**What is drawn.** 3 variants on the Data Display page: `variant` of `text`, `circular` and `rectangular`, each a single frame filled with `bg/skeleton`. There is no state, size or boolean to draw.

## Decisions

- **`animation` is not modelled.** Motion can't be drawn, and `pulse` and `none` look identical in a still frame, so the property would only add duplicate variants. The spec frame's "In code, not drawn" section gives a recipe for each value: the opacity of the 50% pulse frame (`opacity/40`), a gradient rectangle for a still of the wave, and the drawn look for `none`.
- **`width` and `height` are not properties.** A skeleton takes the size of the layout it sits in, so a designer resizes the instance or sets it to fill its container. The drawn sizes are the code's defaults: `circular` is `icon-size/2xl` square (40 px) and `rectangular` is 96 px tall (`space/24`), both bound.
- **The text height is 16 px.** The code gives the text variant `1em`, which follows the surrounding font size. The only variable with a font size is scoped to font size and can't be bound to a height, so the variant is drawn at the size of `Body/base` on desktop, unbound, and the spec frame's recipe is to set the instance height to the font size it stands in for. The 240 px width of the `text` and `rectangular` variants is likewise a placeholder for a width that fills its container.
- **The radius follows the variant:** `radius/sm` for text, `radius/full` for circular and `radius/md` for rectangular, as the stylesheet does.
- **The spec frame shows a card placeholder** (a circle, two text lines of different widths and a rectangle) so the shapes read in context; its widths are instance overrides.
- **The fill is deliberately faint** against the surface (1.11:1 to 1.36:1 across the four themes, measured from the variables): a decorative fill, exempt from text contrast, kept visible enough to read as a placeholder.

## Differences from the code

See `deviations` in the map: the 16 px text height, the 240 px placeholder width, the animations that are not drawn, and size set on the instance.

## Not drawn

The `pulse` and `wave` animations, and `animation=none` as a separate look (it is the drawn one).

## Review

2026-11-26: reviewed with no findings. Checked: each variant's fill, radius and bound size against the stylesheet (the text variant's height and the two 240 px widths are the recorded literals), no stroke, no children and full opacity, the `variant` property and its default `text` in the top-left cell, the set's description and documentation link, the spec frame (instance of the master, every slot filled, Variants shows 7 instances of this set, Tokens used equal to the set's bindings, "7 of 8 props in code", both links), the Section fill (`bg/canvas`, bound) and the Components row (name and status linked to the spec frame, count 17 of 101). Contrast of `bg/skeleton` on `bg/surface` was measured from the variables in the four themes. Code Connect is mapped by path and name (`packages/components/src/atoms/Skeleton/Skeleton.tsx`, `Skeleton`) and reads back on the default variant. Not checked: a dark-theme render. Approved by the maintainer 2026-11-26.
