# Checkbox in Figma

**What is drawn.** 54 variants: three sizes (`sm`, `md`, `lg`), six states (default, hover, focus, error, error-focus, disabled) and three `checked` values (false, true, indeterminate). An optional label (a boolean `showLabel` and a text property `label`). The box is 16, 20 and 24 px square.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, every state at every size and every `checked` value, 54 variants. `xs` and `xl` are listed as undrawn in the map with the box and icon sizes to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **`checked` is a variant** (false, true, indeterminate) because it changes the fill, the edge and the icon, which a boolean cannot. It maps to `checked` and `defaultChecked`.
- **The icon is not a boolean.** The check or the minus is chosen by `checked` and an unchecked box has no icon, so a boolean would add combinations the code cannot produce. The nested `Icon/Check` or `Icon/Minus` carries `weight=bold` and `tone=on-brand` and is swapped in place for a custom `icon` or `indeterminateIcon` ([ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)).
- **`error-focus` is drawn** although the CSS has no rule for it: an invalid, focused box has a danger edge and the focus ring, which differs from both.
- **The focus ring is outside the box,** a layer 12 px larger with a 2 px edge, at the code's 4 px gap; its radius is `radius/md`, which is what the code's expanded outline comes to. The matrix cells in the spec frame do not clip, or the ring would be cut off.
- **The edge colours are the code's:** `border/neutral-strong` at rest and `border/strong` on hover, which clear 3:1 on the surface; a checked box takes `bg/brand` (`bg/brand-hover` on hover) for its fill and edge, and an invalid one keeps the brand fill with a danger edge.
- **`showLabel` is off by default,** as `children` is, so the set shows the bare box; the spec frame's instances turn it on. The label is `Body/base`, not faded by the box's opacity (the code fades only the box, and colours the label `text/disabled`).

## Differences from the code

See `deviations` in the map: the icon chosen by `checked`, the ring layer, `showLabel` off by default, the hit area, and the states not drawn.

## Not drawn

Hover on `error` or `disabled`, `disabled` with `error`, the hover edge of a checked invalid box (the code turns it brand-coloured), and the invisible 24 px hit area.

## Review

2026-11-23: reviewed with no findings. Checked: all 54 combinations and the axis order, the default `size=md, state=default, checked=false` as the top-left cell, every fill, stroke, padding, radius, gap, icon size and the disabled opacity bound (216 layers, none unbound) and every text on a text style, the box sizes (16, 20, 24 px) and radius against the CSS, the icon on each variant (`Icon/Check` or `Icon/Minus`, `weight=bold`, `tone=on-brand`, no icon when unchecked), the ring on exactly the focus and error-focus variants, the property bindings in all 54 variants, the spec frame (instance of the master, every slot filled, all 27 matrix instances of this set, Tokens used equal to what the set binds, the not-modelled names against the manifest), both links, the set's description and documentation link, the Section fill and the Components row. One defect found while building and fixed before the review: the spec frame's matrix cells clipped the focus ring. Not checked: a dark theme render. Approved by the maintainer 2026-11-23.
