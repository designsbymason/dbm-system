# Image in Figma

**What is drawn.** 12 variants on the Media page: `content` of `fallback` and `image`, each at the corner radii `none`, `xs`, `sm`, `md`, `lg` and `full`, in a 320 by 180 px frame (16:9).

## Decisions

- **`fallback` is the default content.** The code's default look, with no `src`, is the fallback, so it is the top-left cell. It is `bg/neutral-subtle` with an `Icon/Image` instance (bold, tone `default`) centred at `icon-size/xl` (32 px), as the stylesheet draws it.
- **`image` is a flat placeholder.** No picture ships with the library, so the variant is a rectangle in `bg/neutral` (the maintainer changed it from the planned `bg/track` on 2026-11-26) that a designer replaces by changing its fill, as for Avatar's image.
- **Six of the nine radii are drawn.** `none`, `xs`, `sm`, `md`, `lg` and `full`; `xl`, `2xl` and `3xl` are recipes in the spec frame. A map `coverage` entry records the departure from drawing every look variant.
- **The sizing props are the instance's size.** `width`, `height` and `aspectRatio` are not properties: the frame is a 320 by 180 placeholder, a designer resizes it, and the spec frame shows 16:9, 4:3 and 1:1.
- **`objectFit` and `position` are Figma's fill scale modes.** Fill is cover, Fit is contain and Stretch is fill; the crop handles set the position. There is no picture to show them on, so they are a recipe.
- **A custom fallback is a recipe,** not a slot: replace the nested icon with your own icon, initials or other content, which keeps the set to two properties.
- **The frame clips its content,** with the corner radius bound to the `radius/*` variable of its variant, as the code's wrapper does with `overflow: hidden`.
- **The fallback icon is 6.59:1 to 7.47:1** on `bg/neutral-subtle` across the four themes, measured from the variables.

## Differences from the code

See `deviations` in the map: the flat placeholder for the picture, the fallback as the default content, the recipes for custom fallback content and for the fill modes, and the placeholder frame size.

## Not drawn

The `xl`, `2xl` and `3xl` radii, the picture itself, `objectFit` and `position`, the sizing props, and custom fallback content. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-26: reviewed, no findings. Checked on all 12 variants: the four corner radii bound to the `radius/<value>` variable of each variant, the 320 by 180 size with clipping on, the image layer filled `bg/neutral`, the fallback layer filled `bg/neutral-subtle` with a centred `Icon/Image` instance (bold weight, default tone) at `icon-size/xl`, and no layer of the other content in either. Also the two properties and their defaults against the map, the grid (the default `content=fallback, radius=none` in the top-left cell), the description and documentation link, the section fill (`bg/canvas`), the spec frame (master, slots, matrix of instances from the set, links, "15 of 18 props in code") and the Components page row. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/Image/Image.tsx`, `Image`) and read back on all 12 variants. Approved by the maintainer 2026-11-26.
