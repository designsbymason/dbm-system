# Blockquote in Figma

**What is drawn.** 2 variants on the Typography page: the `default` quote with a brand bar on the start side, and the `pull-quote`, larger and centred with a decorative quote mark. A `showAttribution` boolean shows the attribution, and the text properties `quote` and `attribution` hold the words.

## Decisions

- **Both variants, one property.** `variant` has two values and both are drawn, so nothing is left undrawn. The footer and the text are properties, so the set is two variants.
- **Widths.** A block takes the width of its parent in the code. The set draws the `default` at 480 px and the `pull-quote` at 640 px with the text wrapping, and an instance is resized.
- **The bar is an inside stroke on the start side,** 4 px in `border/brand` that counts in the layout, with `space/4` of padding after it. The pull quote has neither, as in the stylesheet.
- **The attribution is composed.** A text property replaces a whole text layer, so the dash and the citation are two layers in a row and only the citation is the property. A long citation wraps inside its own box, a small difference from the code.
- **`showAttribution` is off by default,** as the code's `attribution` is unset, and the spec frame shows both.
- **Four new text styles,** added to `scripts/figma-sync.mjs`, which gained an italic option and a numeric line height for this: `Components/Blockquote/md` and `2xl` (Lora Italic at the relaxed line height), `Components/BlockquoteMark/6xl` (Lora Regular, line height 100%) and `Components/BlockquoteFooter/sm`. The family and size are bound; the italic styles leave the weight unbound, because italic is a font style no variable holds.
- **The quote mark overlaps the text by 8 px** through a negative gap, a number, since a negative of a variable cannot be bound.
- **Contrast.** `text/secondary` is 6.88:1 and 10.47:1 on the surface and 6.05:1 and 5.10:1 on the canvas. The decorative quote mark, `text/brand` on the canvas, is 3.16:1 to 6.48:1 and needs none.

## Differences from the code

See `deviations` in the map: the widths, the composed attribution, the unbound italic weight, the mark's overlap and line height, and the decorative mark's contrast.

## Not drawn

The width of a block, the `cite` URL (not visible) and a long citation. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings. Checked on both variants: the text style and `text/secondary` fill of the quote (md italic, left, and 2xl italic, centred), the footer's two layers on `Components/BlockquoteFooter/sm`, the `quote`, `attribution` and `showAttribution` references, the footer hidden by default, the `space/2` gap in the body, the default's 4 px start-side inside stroke in `border/brand` (the other sides 0, counting in the layout) with `space/4` padding, the pull quote's mark (style, `text/brand`, the -8 px gap) and its lack of a stroke and padding, and in the four styles the Lora family, the bound size and family and the unbound weight on the two italic ones; the four properties and their defaults against the map, the grid (the default in the top-left cell), the description and documentation link, the section fill, the spec frame (the 4 matrix instances from the set, the links, `5 of 8 props in code`, the token rows equal to the six variables the set binds and its four styles) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/Blockquote/Blockquote.tsx`, `Blockquote`) and read back on both variants. Approved by the maintainer 2026-11-26.
