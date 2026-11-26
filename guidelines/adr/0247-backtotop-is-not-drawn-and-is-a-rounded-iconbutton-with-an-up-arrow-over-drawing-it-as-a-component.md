# 0247 — BackToTop is not drawn and is a rounded IconButton with an up arrow, over drawing it as a component

**Status:** Accepted · **Date:** 2026-11-26

## Context
[ADR-0246](./0246-skiplink-is-not-drawn-and-backdrop-is-provided-as-figma-styles-over-drawing-either-as-a-component.md) left `BackToTop` undecided until the Navigation page was reached. In the code it is an `IconButton` with `icon` fixed to the up arrow, `rounded` on, and `size` and `variant` passed straight through; its own style is only the fixed position (`space/6` from the bottom and the inline end) and a fade and slide of `space/2` that shows it once the page is scrolled past `threshold`. A hidden one has nothing to draw, and a visible one is the same as a rounded `IconButton` with the arrow, which the `IconButton` set already draws.

## Decision
`BackToTop` is not drawn. It joins the Components page's table of what is not drawn, as a behaviour, with a recipe: an `IconButton` instance with `rounded` on and the size and variant wanted, its icon swapped to `Icon/ArrowUp`, placed `space/6` from the bottom and end edges of the screen or scroll container and drawn in its visible state. `threshold`, `scrollContainerRef` and `label` are behaviour or an accessible name and are not on screen.

## Alternatives considered
- **A `BackToTop` set** of five variants, three sizes and four states (default, hover, focus, disabled), 60 variants, each a nested rounded `IconButton`. Rejected: every cell would repeat what the `IconButton` set draws, so each change to it would have to be made twice, and the set would add a Navigation page, a spec frame and a map entry for no new look.

## Consequences
- The drawable count is 98 of the 120 components (31 atoms, 40 molecules, 27 organisms), and the Components page's atoms table lists 31.
- There is no Code Connect mapping for `BackToTop`; an agent building it uses the recipe and the `IconButton` mapping.
- The Navigation page is created when the first Navigation component is drawn, not before.

## Related
[02-component-rules.md](../figma/02-component-rules.md) §1, [01-plan.md](../figma/01-plan.md) §8, [ADR-0246](./0246-skiplink-is-not-drawn-and-backdrop-is-provided-as-figma-styles-over-drawing-either-as-a-component.md).
