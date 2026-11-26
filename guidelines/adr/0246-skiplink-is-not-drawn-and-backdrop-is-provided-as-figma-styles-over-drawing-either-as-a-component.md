# 0246 — SkipLink is not drawn and Backdrop is provided as Figma styles, over drawing either as a component

**Status:** Accepted · **Date:** 2026-11-26 · **Amended 2026-11-26** (twice) — the paint styles bind to four Semantic variables that carry the opacity, because Figma shows a variable-bound paint at full opacity in a style; the decision itself is unchanged

## Context
[02-component-rules.md](../figma/02-component-rules.md) §1 left `Backdrop`, `SkipLink` and `BackToTop` to be drawn "only if they have a visual state worth drawing, decided when their category is reached" ([ADR-0235](./0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md)). Drawing the Data Display atoms brought the decision for two of them. `SkipLink` is hidden until it takes keyboard focus and then shows as a plain link in a pill: its only visual is one look in one state, which a component set with a spec frame would document more heavily than it is used. `Backdrop` is a scrim: `bg.overlay` at an opacity from the `opacity.*` scale, with an optional background blur of `space.1`. A designer needs that fill and blur on a layer behind an overlay, not an instance with properties.

## Decision
- **`SkipLink` is not drawn.** It joins the Components page's table of what is not drawn, as a behaviour, with the reason.
- **`Backdrop` is not drawn as a component and is provided as styles.** It is in the same table, with kind "Figma style". The styles are four paint styles, `Backdrop/20`, `Backdrop/40`, `Backdrop/60` (the component's default) and `Backdrop/80`, each the colour of `bg.overlay` at that opacity, and one effect style, `Backdrop/blur`, a background blur of 8, which is `blur(space.1)` of 4px in Figma's radius, twice the CSS one. The atom also takes 0, 5, 10, 90 and 100, which a designer sets on the fill by hand. The sync script writes the styles (`06-styles.js`), so they are held to the tokens like the text and effect styles. *(Amended 2026-11-26: the paint styles bind to the Semantic variables `bg/overlay-20`, `-40`, `-60` and `-80`, which replace `bg/overlay` in the file. Each aliases the overlay colour's primitive (`color/neutral/black`) with an opacity of 20, 40, 60 or 80, so the opacity travels with the variable; the style's paint carries the same opacity as well, which is what Figma renders. A colour variable with an opacity can be made in Figma's own screen and not through the plugin API, so they are made by hand, like the `text/*-hover` variables; the sync script skips them, fails if they are missing and the check compares them, together with the styles' bindings. They keep the code syntax `var(--dbm-bg-overlay)`, since the component applies the opacity in code. The first version of this amendment held the colour as a literal and the first version bound it to `bg/overlay`, whose opacity the style did not show.)*
- **`BackToTop` stays undecided,** to be settled when the Navigation page is reached. *(Amended 2026-11-26: it is not drawn, [ADR-0247](./0247-backtotop-is-not-drawn-and-is-a-rounded-iconbutton-with-an-up-arrow-over-drawing-it-as-a-component.md).)*

## Alternatives considered
- **Draw both as components.** Rejected: `SkipLink` would be one variant, and a `Backdrop` component would be a rectangle with an opacity property and a blur boolean, which a style gives without an instance to override.
- **A `Backdrop` component with `opacity` and `blur` properties.** Rejected for the reason above, and because a style is applied to any layer, including a frame already in a design.
- **One paint style per value of the `opacity` scale.** Rejected: nine styles, two of them useless (0 and 100); the four that cover the scrims a design uses are enough, and the rest are a recipe.

## Consequences
- The drawable count is 99 of the 120 components (32 atoms, 40 molecules, 27 organisms), and the Components page's atoms table lists 32.
- The Figma file's styles are 53 text, 11 effect, 4 paint and 3 grid.
- A change to the atom's default opacity or blur size means changing the matching style; nothing checks it yet. `bg.overlay` stays one token in code; in Figma it is the four variables, so a change to the token's colour reaches them through their primitive, and a theme-specific value would need a decision.

## Related
[02-component-rules.md](../figma/02-component-rules.md) §1, [01-plan.md](../figma/01-plan.md) §5 and §8, [ADR-0235](./0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md).
