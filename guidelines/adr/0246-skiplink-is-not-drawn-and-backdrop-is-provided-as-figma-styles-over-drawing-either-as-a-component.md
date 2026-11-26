# 0246 — SkipLink is not drawn and Backdrop is provided as Figma styles, over drawing either as a component

**Status:** Accepted · **Date:** 2026-11-26 · **Amended 2026-11-26** — the paint styles hold the colour as a literal, not a bound variable, because Figma shows a variable-bound paint at full opacity in a style; the decision itself is unchanged

## Context
[02-component-rules.md](../figma/02-component-rules.md) §1 left `Backdrop`, `SkipLink` and `BackToTop` to be drawn "only if they have a visual state worth drawing, decided when their category is reached" ([ADR-0235](./0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md)). Drawing the Data Display atoms brought the decision for two of them. `SkipLink` is hidden until it takes keyboard focus and then shows as a plain link in a pill: its only visual is one look in one state, which a component set with a spec frame would document more heavily than it is used. `Backdrop` is a scrim: `bg.overlay` at an opacity from the `opacity.*` scale, with an optional background blur of `space.1`. A designer needs that fill and blur on a layer behind an overlay, not an instance with properties.

## Decision
- **`SkipLink` is not drawn.** It joins the Components page's table of what is not drawn, as a behaviour, with the reason.
- **`Backdrop` is not drawn as a component and is provided as styles.** It is in the same table, with kind "Figma style". The styles are four paint styles, `Backdrop/20`, `Backdrop/40`, `Backdrop/60` (the component's default) and `Backdrop/80`, each the colour of `bg.overlay` at that opacity, and one effect style, `Backdrop/blur`, a background blur of 8, which is `blur(space.1)` of 4px in Figma's radius, twice the CSS one. The atom also takes 0, 5, 10, 90 and 100, which a designer sets on the fill by hand. The sync script writes the styles (`06-styles.js`), so they are held to the tokens like the text and effect styles. *(Amended 2026-11-26: the colour is a literal, `#0a0912`, read from the token by the script, because a paint bound to a variable did not show its opacity in a style. `bg.overlay` is the same colour in all four themes, so nothing is lost, and the script refuses to write the styles if the themes ever differ; a mode-specific scrim would need styles of its own and a new decision. The first version bound the colour to the variable.)*
- **`BackToTop` stays undecided,** to be settled when the Navigation page is reached.

## Alternatives considered
- **Draw both as components.** Rejected: `SkipLink` would be one variant, and a `Backdrop` component would be a rectangle with an opacity property and a blur boolean, which a style gives without an instance to override.
- **A `Backdrop` component with `opacity` and `blur` properties.** Rejected for the reason above, and because a style is applied to any layer, including a frame already in a design.
- **One paint style per value of the `opacity` scale.** Rejected: nine styles, two of them useless (0 and 100); the four that cover the scrims a design uses are enough, and the rest are a recipe.

## Consequences
- The drawable count is 99 of the 120 components (32 atoms, 40 molecules, 27 organisms), and the Components page's atoms table lists 32.
- The Figma file's styles are 53 text, 11 effect, 4 paint and 3 grid.
- A change to the atom's default opacity or blur size means changing the matching style; nothing checks it yet. A change to `bg.overlay`'s value reaches the styles when the sync script is rerun, and a theme-specific value stops the script.

## Related
[02-component-rules.md](../figma/02-component-rules.md) §1, [01-plan.md](../figma/01-plan.md) §5 and §8, [ADR-0235](./0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md).
