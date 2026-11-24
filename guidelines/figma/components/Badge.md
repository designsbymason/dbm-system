# Badge in Figma

**What is drawn.** 105 variants: `variant` (solid, subtle, dot), seven tones and five sizes, a `ring` boolean and a `label` text property. It is on the Data Display page.

## Decisions

- **Coverage: all seven tones and all five sizes.** A badge's tone is a status (danger, success, warning, info, highlight, brand, neutral), so every tone is drawn. Its `sm`, `md` and `lg` are only 2 to 3 px apart (27, 29 and 30 px, measured in Storybook), so `xs` (25 px) and `xl` (34 px) are the sizes that differ, and all five are drawn. 105 variants, under the budget ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).

- **`dot` is a value of `variant`.** The code has a `dot` prop beside `variant`, but a dot ignores the solid or subtle choice, so one axis leaves no invalid combination ([plan §6](../01-plan.md)).
- **`ring` shows a layer.** An anchored badge gets a 2 px `bg/surface` ring that cuts into what it overlaps; an absolute ring frame, hidden by default, draws it.
- **Placement is not modelled.** `anchor`, `position` and `overlap` are layout. The spec frame shows the four corners on a rectangular and a circular anchor, with the offsets (`space/1`, `space/2`, about 6 px for a dot on a circle).
- **The size comes from component variables:** `badge/size/*` for the height and minimum width, `badge/padding-inline/*` for the padding, so a one-digit badge is a circle and a longer one widens.
- **No state axis:** a badge has no hover, focus or disabled style.

## Differences from the code

See `deviations` in the map: `dot` in `variant`, placement drawn by hand, and the pop animation (motion) not drawn.

## Not drawn

`max` (the "99+" text) and `hideZero`, which are typed or hidden by hand, and the pop animation.

## Review

2026-11-22 (second, after the coverage rule and all five sizes restored, 105 variants): re-reviewed. One finding, fixed: the grid's top-left cell was an `xl` badge, because the cells were centred in their row and a taller badge sits higher; the cells are now top-aligned, so the default (`md`) is the top-left cell. Everything else passed, including every size against the sizes measured in Storybook (pills 25, 27, 29, 30 and 34 px, dots 4, 8, 12, 16 and 20 px).

2026-11-22: reviewed with no findings; a sentence about the pop animation was added. Approved by the maintainer 2026-11-23.
