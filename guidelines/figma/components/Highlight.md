# Highlight in Figma

**What is drawn.** 20 variants on the Typography page: a `tone` of `warning`, `highlight`, `success`, `info` or `danger` at four sizes (`base`, `sm`, `md`, `lg`) and a text property `text` that holds the words. Each is the inline chip: a subtle tone fill with the tone's text colour.

## Decisions

- **A standalone chip.** Figma has no background for part of a text layer and a component cannot sit inside a sentence and wrap with it, so a highlight is always its own layer. It is still drawn, because it is the only way to get the pairing without rebuilding it by hand, it is used alone (a marker, a matched term in a row) as often as in a sentence, and `Code` has the same limit. The recipe for a highlight inside a sentence is a horizontal auto layout with wrap on, with the text and the chip as separate items, which suits short strings.
- **All five tones.** The code's type has exactly these, and each is a `bg/<tone>-subtle` and `text/<tone>` pair that Badge already uses, so nothing is left undrawn.
- **`size` is a Figma-only axis.** The code has no size prop: it inherits the font size of the text around it. The set draws `base` (the default), `sm`, `md` and `lg`, and the rest of the type scale is a recipe, as for `Code`.
- **The text reuses the `Components/Textarea` styles.** They are Nunito Regular with the browser's own line height, which is what `font: inherit` gives at each size, so no new styles were added; the name is another component's, which the spec frame says.
- **The chip is the font's own content height,** with padding on the inline sides only (`space/1`) and `radius/xs`, as an inline mark is.
- **The weight is regular.** The code inherits the weight of the text around it, which is a recipe.

## Differences from the code

See `deviations` in the map: the size axis, the standalone chip, `query` not modelled, the weight, and the reused text styles.

## Not drawn

The sizes `xs`, `xl` and `2xl` to `6xl`, a highlight inside a sentence, every match of a query and the inherited weight. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings. Checked on all 20 variants: the `bg/<tone>-subtle` fill and `text/<tone>` text of each tone, the `space/1` inline padding and none above or below, the `radius/xs` corners, the text style of each size (`Components/Textarea/<size>`: Nunito Regular, auto line height), the `text` property reference, no stroke, and each chip's size against its text plus padding (within 0.6 px); the three properties and their defaults against the map, the grid (the default in the top-left cell), the description and documentation link, the section fill, the spec frame (the 20 matrix instances from the set, the links, `6 of 8 props in code`, the token rows equal to the 12 variables the set binds) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/Highlight/Highlight.tsx`, `Highlight`) and read back on all 20 variants. Approved by the maintainer 2026-11-26.
