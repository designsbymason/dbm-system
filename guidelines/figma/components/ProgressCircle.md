# ProgressCircle in Figma

**What is drawn.** 12 variants on the Feedback page, in the brand tone: `progress` of `indeterminate`, `0`, `50` and `100` at three sizes (`sm`, `md`, `lg`). A `showValueLabel` boolean shows the percentage in the middle of the ring on the determinate ones. It follows [ProgressBar](./ProgressBar.md), whose API it shares, so the properties and the cut of coverage are the same.

## Decisions

- **`progress` is a variant property,** for the reasons given for ProgressBar: the code's `value` is a number, which §2 of the rules does not model, so 0, 50 and 100 are drawn, and an omitted `value` is the indeterminate ring, the code's default and so the default here.
- **The indeterminate ring is a still.** The code spins a quarter-ring arc; the set draws it at the start of the spin, from the top to the right.
- **Coverage: sizes `sm`, `md` and `lg`, and the brand tone only,** as for ProgressBar. `xs` (32 px), `xl` (96 px) and the other four tones are recipes in the spec frame. That makes 4 x 3 = 12 variants, and a map `coverage` entry records the departure.
- **The fill is a stroked open path.** A dash pattern on an ellipse was tried first and restarts on each of the ellipse's four segments, so it drew four dashes; an ellipse arc does not render its angles (the Spinner finding). A path of one Bezier segment (a quarter) or two (a half) from the top, clockwise, with round caps draws the right shape. A full ring is an ellipse stroke. A value other than 0, 50 and 100 is a recipe that edits the path's end point.
- **The ring geometry follows the code:** the centreline is at 45% of the box and the stroke is 10% of it, so the outer edge fills the box and the inner edge sits at 80%. The stroke widths (4, 4.8 and 7.2 px) are derived from the size, so they are numbers, not variables.
- **Sizes.** The `sm` and `md` boxes bind to `icon-size/2xl` (40 px) and `icon-size/3xl` (48 px). The `lg` box is 72 px, which the code derives as 1.5 times `icon-size/3xl`, so it is a number.
- **The value label's text is typed per variant** ("0%", "50%", "100%") and not a text property, because the code derives it from `value` and `max`. A designer edits it on the instance for a custom format.
- **No new text styles.** The label is semibold at 12, 13.33 and 16 px (`font-size/xs`, `sm` and `base`) with the browser's own line height, which equals `Components/ProgressBar/xs`, `Components/Avatar/sm` and `Components/Avatar/base`, so those are reused (the rule is to reuse an equal style before adding one).
- **The label can overflow the ring,** as in the code: at `md` and `lg` a full "100%" sits against the stroke, and at the undrawn `xs` it is wider than the ring. The stylesheet accepts that over clipping the digits, and the spec frame says so.
- **The track's faintness is the code's.** `bg/track` against `bg/surface` is 1.35:1 to 2.05:1 across the four themes, a documented exception; the fill against the track is 3.63:1 to 5.47:1.

## Differences from the code

See `deviations` in the map: the numeric value as an example property, the still of the spin, the numbers for the `lg` frame and the stroke widths, the path for the fill, and the value label's text typed per variant.

## Not drawn

The other tones, `xs` and `xl`, any value but 0, 50 and 100, the spin, and a custom value-label format. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-26: reviewed with no findings. Checked, for all 12 variants: the name and the order (the default `indeterminate`, `md` is the top-left cell), the box sizes (40, 48 and 72 px), the ring geometry (a 0.9 box centreline and a 0.1 box stroke on every track), the stroke colours bound on all 21 ring layers, the fill present on every variant but `0`, the label layer present exactly on the determinate variants, hidden and bound to the boolean, and the three label styles. The only literals are the planned ones: the stroke widths (derived from the size) and the 72 px `lg` frame. Also checked: the set's description and documentation link, the spec frame (instance of the master, every slot filled, Variants shows 15 instances of this set, Tokens used equal to the set's bindings, "10 of 13 props in code", both links), the Section fill (`bg/canvas`, bound), the Components row, and a screenshot of the set and the spec frame. Contrast was measured from the variables in the four themes. Code Connect is mapped by path and name (`packages/components/src/atoms/ProgressCircle/ProgressCircle.tsx`, `ProgressCircle`) and reads back on the default variant. Not checked: a dark-theme render. Approved by the maintainer 2026-11-26.
