# Icon in Figma

**What is drawn.** 58 component sets on the Icons page, named `Icon/<Name>`, one per glyph the components use. Each set has `weight` (`bold`, `regular`, `fill`) and `tone` (17 values), 51 variants, so 2,958 in all, drawn at 24 px. The spec frame, `Spec: Icon`, is on the Media page, which this build created, and shows the weights, the tones, the seven sizes and a flipped glyph as instances of those sets. The sets were drawn in Phase 3; this build added the spec frame, the map entry and this file, and changed no set.

## Decisions

- **Icon is drawn as a family, not one set.** An icon is chosen by swapping an instance to another glyph's set, so each glyph is its own set and there is no instance-swap property (a swap property has one default for the whole set; [ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)). The map's `figma.set` is the family name `Icon`, which the checker requires to equal the component's name.
- **`weight` draws three of six.** Code takes the six Phosphor weights; the sets draw `bold` (the default), `regular` and `fill`, and `thin`, `light` and `duotone` are recipes.
- **`tone` draws all 17,** the whole of the code's `IconTone`, so any component can nest an icon without a recipe. `default` is how the file draws an icon with no tone, which in code inherits the surrounding colour.
- **`size` is an instance resize.** Seven sizes (`icon-size/xs` to `3xl`, 12 to 48 px) across 58 sets would be about 20,000 variants. The instance scales and its width and height are bound to the variable, as the spec frame and the Icons page show.
- **`mirrored` is a flip,** done on the instance, and `label` has no visual.
- **A coverage exception records the 2,958 variants,** far over the budget of about 250, as ADR-0238 accepted.
- **The on- tones and `white` are shown on tiles of their fill,** and `white` on `bg/overlay-80`: it has no fixed surface and is for fills that are dark in every theme, such as a scrim. On `bg/brand` it would be 1.66:1 in emerald-dark, where the brand fill is light, which is why that pairing is not used.

## Differences from the code

See `deviations` in the map: the family of sets, `tone=default` for no tone, size and mirroring done on the instance, the swap in place, and only the 58 glyphs the components use.

## Not drawn

The `thin`, `light` and `duotone` weights, a glyph the components do not use, and any size as a property. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-26: reviewed with no findings. Checked: the new `↳ Media` page and its place before the divider page, the Section fill (`bg/canvas`, bound), the spec frame (instance of the master, every slot filled, the matrix's 32 instances all from `Icon/User` and `Icon/ArrowRight`, the seven size instances each bound to its `icon-size` variable at 12, 16, 20, 24, 32, 40 and 48 px, the 17 tone tiles bound to their fills, the flipped arrow, Tokens used equal to the 17 `icon/*` variables the sets bind, "8 of 10 props in code", both links), and the Components row. Contrast was measured from the variables in the four themes: the foreground tones are at least 3.23:1 on `bg/surface` (lowest `highlight`), the on- tones at least 4.67:1 on their fills, `disabled` is deliberately lower, and `white` is shown on `bg/overlay-80`. No set on the Icons page was changed. Code Connect is deliberately not mapped for the 58 sets: a mapping holds only a path and a name, the same `Icon.tsx` and `Icon` for every glyph, and the glyph is chosen in code by importing a Phosphor icon by name, which a mapping cannot express; the set's own name and this file carry that. Not checked: a dark-theme render and whether swapping the nested icon keeps its tone. Approved by the maintainer 2026-11-26.
