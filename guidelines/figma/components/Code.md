# Code in Figma

**What is drawn.** 4 variants on the Typography page: a `size` of `base`, `sm`, `md` or `lg` and a text property `text` that holds the snippet. Each is the inline chip: a tinted fill, a thin edge and monospace text.

## Decisions

- **`size` is a Figma-only axis.** The code has no size prop: it inherits the font size of the text around it, which Figma cannot do. The set draws the chip at four steps of the type scale (`base` the default, 16 px) so a designer can place it in text at the right size, and the rest of the scale is a recipe. The map's `size` values have no code props and say so.
- **Roboto Mono stands in for the monospace stack.** The `font-family/mono` token is a system font stack (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`, `Liberation Mono`) that Figma has no font for, so the four `Components/Code` text styles use Roboto Mono Medium and leave the family unbound; `Kbd` and `CodeBlock` will use the same one ([ADR-0249](../../adr/0249-the-figma-library-stands-in-roboto-mono-for-the-monospace-font-stack-and-leaves-the-family-unbound-over-binding-the-font-family-variable-or-installing-a-system-font.md)). Roboto Mono is open source (SIL Open Font License 1.1) and available in the file.
- **The text style carries the browser's own line height** (auto), as the component sets none, so the chip's height is the font's content height plus the padding and the edge, not the Body styles' 150%.
- **The edge counts in the size,** as an inside stroke included in the layout, like the code's box. The padding is `space/1` and `space/2`, the radius `radius/sm`.
- **Four new text styles,** `Components/Code/sm`, `base`, `md` and `lg` (size and weight bound to variables), added to `scripts/figma-sync.mjs`.

## Differences from the code

See `deviations` in the map: the size axis, the stand-in font, and the chip's height.

## Not drawn

The sizes `xs`, `xl` and `2xl` to `6xl`, a snippet inside a sentence, a multi-line code block (the `CodeBlock` molecule) and the system font. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings. Checked on all 4 variants: the `bg/code` fill, the 1 px `border/code` inside stroke counting in the layout, the padding and radius variables, the text style of each size (`Components/Code/<size>`, Roboto Mono Medium, auto line height, size and weight bound, family unbound), the `text/secondary` fill, the `text` property reference, and each size against its text plus padding and edge (within 0.6 px); the two properties and their defaults against the map, the grid (the default in the top-left cell), the description and documentation link, the section fill, the spec frame (the 4 matrix instances from the set, the links, `4 of 5 props in code`, the token rows equal to the 12 variables the set and its styles bind) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, how the stand-in's height compares with a real system monospace font in a browser, and Code Connect, mapped by path and name (`packages/components/src/atoms/Code/Code.tsx`, `Code`) and read back on all 4 variants. Approved by the maintainer 2026-11-26.
