# Radio in Figma

**What is drawn.** 36 variants: three sizes (`sm`, `md`, `lg`), six states (default, hover, focus, error, error-focus, disabled) and two `checked` values (false, true). An optional label (a boolean `showLabel` and a text property `label`). The circle is 16, 20 and 24 px.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, every state at every size and both `checked` values, 36 variants. `xs` and `xl` are listed as undrawn in the map with the circle and dot sizes to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **Built like [Checkbox](./Checkbox.md)** so the two read as a matched pair: the same sizes, the same states, the same label and the same ring, and the spec frame is cloned from Checkbox's.
- **`checked` is a variant** (false, true) because it changes the edge colour and adds the dot, which a boolean cannot. It maps to `checked` and `defaultChecked`. There is no indeterminate value: Radio's `checked` is a boolean.
- **The checked circle is an outline,** not a fill: the fill stays `bg/surface`, the edge is `border/brand` (and stays so on hover), and the dot is `icon/brand`.
- **The dot is half the circle** with scale constraints. The code gives it `50%`, which no token matches (6, 8, 10 px), so it is drawn at that size and left unbound, like the derived padding on Input.
- **`error-focus` is drawn** although the CSS has no rule for it: an invalid, focused circle has a danger edge and the focus ring, which differs from both.
- **The focus ring is fully round and outside the circle,** a layer 12 px larger with a 2 px edge at the code's 4 px gap, bound to `radius/full`, which is exactly what the code's expanded outline comes to. The spec frame's matrix cells do not clip, or the ring would be cut off.
- **`showLabel` is off by default,** as `children` is, so the set shows the bare circle; the spec frame's instances turn it on. The label is `Body/base`, and only the circle fades when disabled, as in the code.

## Differences from the code

See `deviations` in the map: the derived dot size, the ring layer, `showLabel` off by default, the hit area, and the states not drawn.

## Not drawn

Hover on `error` or `disabled`, `disabled` with `error`, the hover edge of a checked invalid circle (the code keeps it brand-coloured), and the invisible 24 px hit area.

## Review

2026-11-23: reviewed with no findings. Checked: all 36 combinations and the axis order, the default `size=md, state=default, checked=false` as the top-left cell, every fill, stroke, padding, radius, gap and the circle's size and the disabled opacity bound (138 layers, none unbound, the dot's derived size aside) and every text on a text style, the circle sizes (16, 20, 24 px) and the dot (half of each, with scale constraints) against the CSS, the ring on exactly the focus and error-focus variants, the property bindings in all 36 variants, the spec frame (instance of the master, every slot filled, all 21 matrix instances of this set, Tokens used equal to what the set binds, the not-modelled names against the manifest), both links, the set's description and documentation link, the Section fill and the Components row. Not checked: a dark theme render. Approval by the maintainer is pending. Found while drawing: unlike Checkbox, the code added no invisible 24 px hit area around the circle, so at `sm` (16 px) and `md` (20 px) the target was under the 24 px minimum (WCAG 2.5.8); fixed in the code the same day ([component review](../../component-reviews/Radio.md)), and the spec frame's accessibility note now says so.
