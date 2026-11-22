# Button in Figma

**What is drawn.** 450 variants: five variants with two tones (`destructive` ignores the tone, so nine combinations), five sizes, five states (default, hover, focus, disabled, loading) and `rounded` off or on. Optional leading and trailing icons, and a label. The first component drawn, as the pilot.

## Decisions

- **Every variant is the same height.** The code's `secondary` border added 2 px to its height, so its block padding gives one border width back (`calc()` in the CSS). Figma draws that padding as the number (7, 11, 15), unbound, the only unbound values in the set. The fix was made in code first ([review file](../../component-reviews/Button.md)) and the set follows it.
- **`rounded` is a variant property,** not a boolean: it changes the corner radius, and a boolean property can only show or hide a layer ([ADR-0237](../../adr/0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md), amended).
- **An icon has no swap property.** A swap property has one default for the whole set, so every variant would share one icon colour. The icon is shown by a boolean and swapped in place on the nested instance, and its `tone` is set per variant ([ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)).
- **The focus ring is a layer.** An absolute 2 px frame outside the edge, shown only in the focus variants, so the ring does not change the size.
- **The default is the top-left cell:** `size=md` first, so Figma takes the code's defaults ([plan §6](../01-plan.md)).

## Differences from the code

See `deviations` in the map: `destructive` has no neutral tone, `rounded` is a variant, and `fullWidth` is set by making the instance fill its container.

## Not drawn

`loadingText`, `fullWidth` and `asChild`, and the passthrough props.

## Review

2026-11-22: reviewed; the `size` default (was `xs`, now `md`), a clipped Properties cell, the set's grid layout, a matrix header row and a Type row in Tokens used were fixed. Approval by the maintainer is pending.
