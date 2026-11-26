# Divider in Figma

**What is drawn.** 48 variants on the Layout page, which this build created: `variant` of `solid`, `dashed`, `dotted` and `double`, `emphasis` of `none`, `start` and `end` (on `double` only), `orientation` of `horizontal` and `vertical`, and `label` of `none`, `start`, `center` and `end`, all in the thin weight and the default tone. A text property `labelText` holds the label. Divider is the one Layout component that is drawn: the other Layout atoms are on the Components page's table of what is not drawn.

## Decisions

- **`label` is one variant property.** The code's `label` and `align` are two props, but `align` only matters with a label, and drawing it as its own property would repeat the same line three times with no label. So `label` takes `none`, `start`, `center` and `end`, named for what it shows, and the text is a real text property, `labelText`, which maps to the code's `label`. `start` and `end` put the short 24 px line (`space/6`) on the label's near side, as the stylesheet does.
- **Coverage: the thin weight and the default tone only.** `thickness` would triple the set to 144 and `tone` is a colour, so both are recipes in the spec frame (`border-width/2` and `/4`, and `border/brand`, `info`, `success`, `warning` and `danger`). That makes 48 variants, and a map `coverage` entry records the departure.
- **`emphasis` is drawn on `double` only,** as the code uses it: the start or end bar steps up one weight. At the thin weight that is 1 px to 2 px (`border-width/1` to `/2`), the only case drawn.
- **The dash and dot patterns are measured, not guessed.** Chromium draws a 1 px dashed border as 3 px of line and 2 px of gap and a dotted one as 1 and 1 (measured on a rendered page, and at 2 px and 4 px for the recipe: from 3 px a dashed line is twice the weight on and once off). A dashed or dotted line is a 1 px bar stroked on one edge with that dash pattern, so the numbers are drawn, not bound.
- **A double line is two bars** `space/1` apart in an auto-layout group, filled with `border/default`.
- **Orientation is the two single values.** The code also takes a responsive map; the spec frame says to use the horizontal instance for the narrow range and the vertical one for the wide.
- **The frames are placeholders for a divider that fills its container:** 240 px wide (horizontal) and 160 px tall (vertical). The lines fill, so a resized or stretched instance keeps working.
- **The label reuses `Body/sm`.** The stylesheet sets only the size (`font-size/sm`) and the colour (`text/tertiary`); the weight and line height are inherited, which equals `Body/sm`.
- **The separator is faint by design.** `border/default` against `bg/surface` is 1.35:1 to 1.4:1 across the four themes; it is a separator and not a control, so it has no contrast floor. The label, `text/tertiary` on `bg/surface`, is 4.7:1 to 8.21:1.

## Differences from the code

See `deviations` in the map: the label property that stands for two props, the thin weight and default tone only, the measured dash numbers, the responsive map and forced-colors line that are not drawn, and the placeholder frame sizes.

## Not drawn

The regular and thick weights, the other five tones, the responsive map of `orientation`, and the forced-colors line. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-26: reviewed with no findings. Checked, for all 48 variants: the name and the order (the default `solid`, `none`, `horizontal`, `none` is the top-left cell), the line and bar thickness bound to `border-width/1` or `/2` (252 layers, none unbound apart from the planned frame sizes), the short lines at `space/6`, the dash patterns (3 on and 2 off for dashed, 1 and 1 for dotted) and the stroke weight bound, the double bars at 1 and 2 px for each emphasis, the label layer present exactly on the 36 label variants and bound to `labelText`, and the 240 px and 160 px frames. Also checked: the set's description and documentation link, the spec frame (instance of the master, every slot filled, Variants shows 14 instances of this set, Tokens used equal to the set's bindings, "7 of 12 props in code", both links), the Section fill (`bg/canvas`, bound), the new `↳ Layout` page and its place before the divider page, and the Components row. Contrast was measured from the variables in the four themes. Code Connect is mapped by path and name (`packages/components/src/atoms/Divider/Divider.tsx`, `Divider`) and reads back. Not checked: a dark-theme render. Approved by the maintainer 2026-11-26.
