# Button in Figma

**What is drawn.** 200 variants: five variants in the brand tone, four sizes (`sm`, `md`, `lg`, `xl`), five states (default, hover, focus, disabled, loading) at every size, and `rounded` off or on. Optional leading and trailing icons, and a label. The neutral tone and `xs` are in the code and are not drawn. The first component drawn, as the pilot.

## Decisions

- **Coverage: widened and narrowed.** Button is the most used component, so every state is drawn at every drawn size, with `rounded` off and on, and `xl` is kept because it is a real size (a hero call to action). The neutral tone and `xs` are not drawn: the map lists them as undrawn, each with a recipe, and the spec frame's "In code, not drawn" section shows it ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)). 200 variants.

- **Every variant is the same height.** The code's `secondary` border added 2 px to its height, so its block padding gives one border width back (`calc()` in the CSS). Figma draws that padding as the number (7, 11, 15), unbound, the only unbound values in the set. The fix was made in code first ([review file](../../component-reviews/Button.md)) and the set follows it.
- **`rounded` is a variant property,** not a boolean: it changes the corner radius, and a boolean property can only show or hide a layer ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **An icon has no swap property.** A swap property has one default for the whole set, so every variant would share one icon colour. The icon is shown by a boolean and swapped in place on the nested instance, and its `tone` is set per variant ([ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)).
- **The focus ring is a layer.** An absolute 2 px frame outside the edge, shown only in the focus variants, so the ring does not change the size.
- **The default is the top-left cell:** `size=md` first, so Figma takes the code's defaults ([plan §6](../01-plan.md)).

## Differences from the code

See `deviations` in the map: `destructive` ignores the tone and only the brand tone is drawn, `rounded` is a variant, and `fullWidth` is set by making the instance fill its container.

## Not drawn

`loadingText`, `fullWidth` and `asChild`, and the passthrough props.

## Review

2026-11-22: reviewed; the `size` default (was `xs`, now `md`), a clipped Properties cell, the set's grid layout, a matrix header row and a Type row in Tokens used were fixed. Approval by the maintainer is pending.
