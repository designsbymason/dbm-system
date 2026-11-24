# Switch in Figma

**What is drawn.** 42 variants: three sizes (`sm`, `md`, `lg`), seven states (default, hover, focus, error, error-focus, disabled, loading) and two `checked` values (false, true). An optional thumb icon (`thumbIcon`), and an optional label (a boolean `showLabel` and a text property `label`). The track is 24, 28 and 32 px tall.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, every state at every size and both `checked` values. `xs` and `xl` are listed as undrawn in the map with the track, thumb and icon sizes to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **Built like [Checkbox](./Checkbox.md) and [Radio](./Radio.md)** so the three read as a family: the same states, the same label and the same focus ring, and the spec frame is cloned from Radio's (with a seventh column for `loading`, so its cells are narrower).
- **`checked` is a variant** (false, true) because it moves the thumb and changes the track colour. It maps to `checked` and `defaultChecked`.
- **The thumb, not the track, shows the state.** The off track is `bg/track`, not a 3:1 edge, because [ADR-0016](../../adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md) puts the contrast on the always-visible thumb; the hover track is `bg/track-strong`.
- **`loading` is a state, drawn as disabled with a Spinner.** The code disables a loading switch and puts a `Spinner` in the thumb (`tone=secondary`, size `xs` at `sm` and `sm` at `md` and `lg`). `Spinner` gained a `size=xs` for this: the `sm` Switch nests a 12 px spinner, which an instance of a larger size cannot be scaled down to ([Spinner](./Spinner.md)). A loading variant has no thumb icon layer, as the code shows the spinner instead of the icon.
- **`thumbIcon` is one boolean for two props.** The thumb shows the unchecked icon when off and the checked icon when on, so one boolean shows whichever fits; it is named for what it shows. The nested icons are the placeholders `Icon/X` (tone `secondary`) and `Icon/Check` (tone `brand`), swapped in place, because the code's own example icons are not among the drawn ones.
- **The sizes are the code's calc() results,** drawn as numbers: the track is 1.8 times its height, the thumb is the height less 4 px and sits 2 px in, and the checked thumb is at the far end. Only the `sm` and `lg` heights equal a token (`space/6`, `space/8`) and are bound.
- **Two rings.** The error ring is the code's `box-shadow` (2 px tight against the track) and the focus ring its outline (2 px at a 4 px gap); `error-focus` draws both, as the code can render both at once.
- **`showLabel` is off by default,** as `children` is, so the set shows the bare track; the spec frame's instances turn it on. The label is `Body/base` and is `text/disabled` when the switch is disabled or loading, as in the code.

## Differences from the code

See `deviations` in the map: the derived sizes, the placeholder icons, the rings, the loading look, `showLabel` off by default, the right-to-left direction, and the states not drawn.

## Not drawn

`size` `xs` and `xl`, the right-to-left direction, hover on `error`, `disabled` and `loading`, and `disabled` or `loading` together with `error`.

## Review

2026-11-23: reviewed with no findings. Checked: all 42 combinations and the axis order, the default `size=md, state=default, checked=false` as the top-left cell, every fill, stroke, padding, radius and gap and the opacity bound (234 layers, none unbound, the calc()-derived sizes aside) and every text on a text style, the track (50.4 x 28, 43.2 x 24, 57.6 x 32 px), the thumb (24, 20, 28 px at 2 px in, and at the far end when on) against the CSS, the 40% opacity on exactly the disabled and loading variants, the error ring on exactly the error variants and the focus ring on exactly the focus ones, the placeholder icons (`Icon/X` tone `secondary`, `Icon/Check` tone `brand`, sized `xs` at `sm` and `sm` at `md` and `lg`) and the nested Spinner in the loading variants (size `xs` at `sm`, `sm` at `md` and `lg`), the property bindings in all 42 variants, the spec frame (instance of the master, every slot filled, all 23 matrix instances of this set, Tokens used against what the set binds, the not-modelled names against the manifest), both links, the set's description and documentation link, the Section fill and the Components row. Not checked: a dark theme render. Approval by the maintainer is pending.
