# IconButton in Figma

**What is drawn.** 210 variants: five variants in the brand tone (`primary`, `secondary`, `tertiary`, `ghost`, `destructive`), three sizes (`sm`, `md`, `lg`), seven states (default, hover, focus, pressed, pressed-hover, disabled, loading) at every size, and `rounded` off or on. An optional label under the icon (a boolean `showLabel` and a text property `label`). The box is 39, 42 and 55 px, matching [Button](./Button.md)'s heights.

## Decisions

- **Coverage: narrowed, like Button.** Only the brand tone and sizes `sm`, `md` and `lg` are drawn, so that every state is drawn at every size with `rounded` off and on and the set stays at 210 ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)). The neutral tone and `xs` and `xl` are undrawn, each with a recipe in the map and the spec frame. Drawing both tones would be 378 variants.
- **`pressed` is two values of `state`** (`pressed`, `pressed-hover`), not a property of its own, which would double the set. The toggle is on: the icon takes the `fill` weight and the colours invert (`primary` and `destructive` go to their quiet tint, the others go to solid brand), as the code's own comment explains. Pressed together with focus, disabled or loading is undrawn, with a recipe.
- **`rounded` is a variant property,** as on Button, because it changes the corner radius.
- **The box is a frame with a minimum size, and the label grows it.** Its minimum width and height are bound to the `icon-button` size variables (30, 39, 42, 55, 61 px, measured to match Button's heights) and it hugs its content, so with no label it is exactly the square and with `showLabel` it grows under the icon, as the code's `height: auto` does. The padding the label brings is the code's per-size padding.
- **Four text styles were added** for the label: `Components/IconButton/xs` and `sm` (medium weight, tight line height) and `Components/IconButtonPressed/xs` and `sm` (bold, for the pressed toggle, which the code draws bold). Their sizes follow the code (`xs` for `sm` and `md`, `sm` for `lg`).
- **Loading uses the Spinner set,** a nested instance at size `sm` (16 px, the code's `1em`) at 80% opacity, in the icon's tone, where the code draws its own ring. Button's loading ring is an older hand-drawn ellipse; moving it to the Spinner set is a possible follow-up.
- **The icon is a placeholder,** `Icon/Plus` in the variant's icon tone, swapped in place, because the code's `icon` prop is required content ([ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)).
- **The focus ring is a layer** 6 px outside the box at `radius/lg` (as Button's), and the focused box's own corner radius drops to `radius/sm` (`full` when rounded), which is what the code does.
- **`showLabel` is off by default,** as `label` is, so the set shows the bare square; the spec frame's instances turn it on. `hideLabelBelow` is not modelled.

## Differences from the code

See `deviations` in the map: `destructive` ignoring the tone, `pressed` as a state value, the minimum-size box, the placeholder icon, the Spinner for loading, the focus radius, `hideLabelBelow`, and the states not drawn.

## Not drawn

The neutral tone, `xs` and `xl`, pressed together with focus, disabled or loading, hover on `disabled` and `loading`, and a labelled pressed destructive toggle under the pointer (the code keeps its fill there).

## Review

2026-11-23: reviewed with no findings. Checked, for all 210 variants against the code's rules: every combination present and in axis order, the default `variant=primary, size=md, state=default, rounded=false` as the top-left cell, the fill variable for each variant and state, the secondary edge on exactly the secondary variants, the box at exactly 39, 42 and 55 px with its minimum bound to the `icon-button` variables, the corner radius for each state and rounded value, the 40% opacity on exactly the disabled and loading variants, the focus ring on exactly the focus variants, the nested icon (`Icon/Plus`, the fill weight and the inverted tone when pressed) or, when loading, the Spinner (tone to match, size `sm`, 80% opacity), the label's text colour and style (medium or bold, `xs` or `sm`) and its property bindings, and no unbound fill, stroke or spacing across 660 layers; the spec frame (instance of the master, every slot filled, all 47 matrix instances of this set, every variable the set binds in Tokens used, the not-modelled names against the manifest), both links, the set's description and documentation link, the Section fill and the Components row. Not checked: a dark theme render. Approval by the maintainer is pending.
