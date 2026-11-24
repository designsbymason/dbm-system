# Spinner in Figma

**What is drawn.** 48 variants: 16 tones and three sizes (`sm`, `md`, `lg`). A ring of 16, 20 or 24 px, drawn still. There are no states and no booleans. It lives on the Feedback page, which this build created.

## Decisions

- **Coverage: all 16 tones, a widening of the defaults.** A spinner takes its colour from where it sits, not from a status: `Switch` uses `secondary`, a filled `Button` uses `on-brand`, a danger one `on-danger`. The Icon set draws 16 tones ([ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)) and the spinner draws the same 16, so any of them can be nested without a recipe. 48 variants is far under the budget. `on-neutral` is undrawn: it is the same colour as `on-brand` in all four themes. Sizes are the defaults (`sm`, `md`, `lg`, with `xs` and `xl` undrawn) ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **The ring is a stroked path, not an ellipse arc.** The CSS is a 2 px border with the top edge transparent, which is a three-quarter ring with a 90° gap at the top. An ellipse with `arcData` was tried first and rendered only the top quarter whatever the angles were set to, and its inner radius cannot be bound. An open path of three cubic Bézier segments in a square frame, stroked 2 px, draws the right shape and its stroke width binds to `border-width/2`; the stroke colour binds to the tone's `icon/*` variable.
- **The ring is not animated.** The motion is documented in the spec frame (and on the Foundations Motion section); a designer who wants a turning look rotates an instance by hand.
- **The `on-*` tones and `white` are shown on tiles** of their fill in the spec frame's matrix (`bg/brand`, `bg/danger` and so on, with `white` on `bg/brand`), because they are invisible on the white matrix. The set itself is only the ring.
- **`label` is not modelled:** it makes the spinner a status region and has no visual.

## Differences from the code

See `deviations` in the map: the inherited colour drawn as `default`, the still ring, the path and its derived radius, and `label`.

## Not drawn

`size` `xs` and `xl`, `tone` `on-neutral`, and the rotation.

## Review

2026-11-23: reviewed with no findings. Checked: all 48 combinations and the axis order, the default `tone=default, size=md` as the top-left cell, every ring's stroke colour bound to its own tone's `icon/*` variable (48 of 48), the stroke width and frame size bound (144 layers, none unbound), the three sizes (16, 20, 24 px), the spec frame (instance of the master, every slot filled, all 48 matrix instances of this set, Tokens used equal to what the set binds, the not-modelled names against the manifest), both links, the set's description and documentation link, the `bg/canvas` Section on the new `↳ Feedback` page and the Components row. Two defects found and fixed while building, before the review: the ellipse arc (see Decisions) and a stale layout of the note in the not-drawn table. Not checked: a dark theme render. Approval by the maintainer is pending.
