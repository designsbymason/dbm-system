# 0248 — Text is not drawn and is a text layer with a text style and a colour variable, over drawing it as a component

**Status:** Accepted · **Date:** 2026-11-26 · **Amended 2026-11-26** — `Heading` is not drawn either, for the same reasons

## Context
`Text` has no frame, fill, spacing or state: it is a `<p>`, `<span>`, `<div>`, `<label>` or `<legend>` with a font size, weight, family, colour, alignment and wrapping. The Figma file already has the text styles (`Display/3xl` to `6xl`, `Heading/sm` to `2xl`, `Body/xs` to `lg`, `Label/xs` to `md`, `Overline`) and all nine text colours as `text/*` variables, and a text layer carries alignment, truncation and wrapping. A component set would be a catalogue of font settings (11 sizes, 4 weights, 9 colours and 2 families, 792 combinations) that restates the styles, and its core would still need new text styles for the weights and the Lora family.

## Decision
`Text` is not drawn. It joins the Components page's table of what is not drawn, with kind "Figma style" and a recipe: a text layer with `Body/<size>` (regular, `xs` to `lg`), `Label/<size>` (semibold) or `Heading/<size>` (bold) for the size and weight; `Heading/xl` or `2xl` with the weight set to regular for `xl` and `2xl`; `Display/<size>` for `3xl` to `6xl`; a fill of `text/<color>`; Lora, through `Display` or the layer's font, for `fontFamily="secondary"`; the layer's alignment, its truncate option with the line count, and auto width for `wrap="nowrap"`. *(Amended 2026-11-26: `Heading` is not drawn either. It is a text layer with the same styles, with kind "Figma style" and its own recipe: the level sets the size, `Display/<size>` for `3xl` to `6xl` and `Heading/<size>` for `2xl` and below, the default family being Lora and the default weight bold, so the layer's font or weight is set on the style that differs; the fill, alignment, truncation and the vertical trim option are the layer's. The drawable count is 96 of 120, with 29 atoms.)*

## Alternatives considered
- **A `Text` set** drawing a core of the props. Rejected: each instance would be a text node with a style, which a text layer already is, and the set would need weight and family styles that duplicate the general ones.
- **Adding `Body/xl` and `Body/2xl` styles** so the recipe needs no override. Not done: it changes the style count and the Foundations page for two sizes that a `Heading` style with the weight set to regular already gives.

## Consequences
- The drawable count is 97 of the 120 components (30 atoms, and 96 with 29 after the `Heading` amendment, 40 molecules, 27 organisms), and the Components page's atoms table lists 30.
- There is no Code Connect mapping for `Text`.
- A Typography page is created when the first Typography component is drawn, not before.

## Related
[02-component-rules.md](../figma/02-component-rules.md) §1, [01-plan.md](../figma/01-plan.md) §5 and §8, [ADR-0246](./0246-skiplink-is-not-drawn-and-backdrop-is-provided-as-figma-styles-over-drawing-either-as-a-component.md), [ADR-0247](./0247-backtotop-is-not-drawn-and-is-a-rounded-iconbutton-with-an-up-arrow-over-drawing-it-as-a-component.md).
