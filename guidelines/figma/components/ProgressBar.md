# ProgressBar in Figma

**What is drawn.** 12 variants on the Feedback page, in the brand tone: `progress` of `indeterminate`, `0`, `50` and `100` at three sizes (`sm`, `md`, `lg`). A `showValueLabel` boolean shows the percentage beside the bar on the determinate ones.

## Decisions

- **`progress` is a variant property.** The code's `value` is a number, which §2 of the rules does not model, so representative values are drawn instead: 0, 50 and 100. The property is named for what it shows, because "indeterminate" is not a value `value` can take: an omitted `value` is the indeterminate bar, which is the code's default and so the default here.
- **The indeterminate bar is a still.** The code slides a fill across the track; the set draws the 50% frame (the fill starts 20% in and is 60% wide), and the spec frame gives the other frames and the recipe for any other value.
- **Coverage: sizes `sm`, `md` and `lg`, and the brand tone only.** The tone is a status of the operation, which would draw all five tones, but the other four fills (`info`, `success`, `warning`, `danger`) are a recipe in the spec frame, as are `xs` and `xl`. That makes 4 x 3 = 12 variants. A map `coverage` entry records the departure.
- **The boolean is not multiplied.** `showValueLabel` shows a text layer that exists only in the determinate variants: the code draws no label on an indeterminate bar.
- **The value label's text is typed per variant** ("0%", "50%", "100%"), not a Figma text property, because the code derives it from `value` and `max`. A designer edits it on the instance for a custom format (the code's `formatValueLabel`).
- **The label has its own text style,** `Components/ProgressBar/xs` (semibold, the browser's own line height, because the component sets none), added to `scripts/figma-sync.mjs`.
- **Sizes.** The track is `space/2` (`md`) and `space/3` (`lg`) tall, bound. The `sm` track is 6 px, drawn as a number, because the code derives it as 1.5 times `space/1` (the rule for a value derived with `calc()`).
- **The fill scales.** The fill's constraints scale it with the track, so its share of the track holds when an instance is resized or when the label narrows the track. It is drawn at shares of the 240 px default width.
- **The track's faintness is the code's.** `bg/track` against `bg/surface` is 1.35:1 to 2.05:1 across the four themes, a documented exception in the component's review; the fill against the track is 3.63:1 to 5.47:1.

## Differences from the code

See `deviations` in the map: the numeric value as an example property, the still of the sliding fill, the unbound 6 px height, the fill shares, and the value label's text typed per variant.

## Not drawn

The other tones, `xs` and `xl`, any value but 0, 50 and 100, the indeterminate animation, and a custom value-label format. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-26: reviewed with no findings. Checked, for all 12 variants: the name and the order (the default `indeterminate`, `md` is the top-left cell), the track and fill colours, every radius and the heights (8, 6 and 12 px, with the `sm` track the one unbound number), the label layer present exactly on the determinate variants and hidden, bound to the boolean, the label's text style, and the fill shares (0, 50 and 100%, and 20% in and 60% wide for the still). Also checked: the set's description and documentation link, the spec frame (instance of the master, every slot filled, Variants shows 15 instances of this set, Tokens used equal to the set's bindings, "10 of 13 props in code", both links), the Section fill (`bg/canvas`, bound) and the Components row. Contrast was measured from the variables in the four themes. Code Connect is mapped by path and name (`packages/components/src/atoms/ProgressBar/ProgressBar.tsx`, `ProgressBar`) and reads back on the default variant. Not checked: a dark-theme render. Approved by the maintainer 2026-11-26.
