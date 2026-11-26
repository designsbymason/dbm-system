# Link in Figma

**What is drawn.** 16 variants on the Typography page, a new page: four sizes (`base`, `sm`, `md`, `lg`) and four states (`default`, `hover`, `focus`, `disabled`), all with the code's default underline, `always`, as the text's own underline. An `external` boolean shows the trailing arrow icon and a text property `label` holds the text.

## Decisions

- **Only `underline=always` is drawn,** as Figma's own underline text decoration, so the underline follows the text when a link wraps onto a second line. `hover` (the underline only on hover) and `none` are recipes: turn the underline off in the text's type settings (for `hover`, in every state but hover), and a user who does not want an underline removes it under the typography type settings. The first version drew the three modes with the underline as a separate line layer; it did not wrap with the text, so it was replaced (the maintainer's finding, 2026-11-26).
- **Sizes `base`, `sm`, `md` and `lg`.** The code leaves `size` unset so a link takes the size of the text around it, which Figma cannot do, so the set draws four steps of the type scale with `base` (16 px) as the default and the rest (`xs`, `xl` to `6xl`) as recipes. `md` was added to the planned three at the maintainer's request.
- **Four text styles carry the underline.** `Components/Link/sm`, `base`, `md` and `lg` are the Body styles at those sizes with the underline in the style, added to `scripts/figma-sync.mjs`. Text linked to a text property takes one format in every variant, so a decoration set on the text itself, or a relink after setting one, changed the size and the decoration of all of them; formatting that comes from each variant's own style survives the link.
- **All four states at every size.** The focus ring is a layer 4 px outside the link, and disabled is the whole link at the `opacity/40` variable.
- **The icon is `Icon/ArrowSquareOut`** (bold, tone `info`) one em square, its width and height bound to the `font-size/<size>` Viewport variable, so it scales with the type as the code's `1em` does. `icon/info` is the same colour as `text/link` in all four themes, so no new icon tone was needed.

- **A link is not placed on `bg/canvas`.** `text/link` is 4.15:1 (light) and 4.00:1 (dark) there, under 4.5:1, and the token spec already says never to put it on the canvas; links go on `bg/surface` (4.71:1 and 8.20:1). The spec frame says so.

## Differences from the code

See `deviations` in the map: the unset size, the underline modes drawn as recipes, the underline fade, the icon's tone, its gap and nudge, the focus ring's size, and the visited look.

## Not drawn

The underline modes `hover` and `none`, the sizes `xs` and `xl` to `6xl`, a link that inherits its size, the visited look and the underline fade. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings, after the set was reduced to the `always` underline (16 variants). Checked on all 16 variants: the text style of each size (`Components/Link/<size>`) with the underline from the style, the `text/link` fill, the `label` reference, no leftover layer from the line-layer version, the icon (`Icon/ArrowSquareOut`, bold, tone `info`) with its width and height bound to `font-size/<size>` and its `external` reference, the focus ring on exactly the focus variants with `border/focus` and `border-width/2`, the `opacity/40` binding on exactly the disabled variants, the hugging width, the four properties and their defaults against the map, the grid (the default in the top-left cell), the description and documentation link, the section fill, the spec frame (the 20 matrix instances all from the set, the links, `12 of 16 props in code`, the token rows against the bindings and the styles) and the Components row. Code Connect reads back on all 16 variants. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render. Mapped in Code Connect by path and name (`packages/components/src/atoms/Link/Link.tsx`, `Link`). Approved by the maintainer 2026-11-26.
