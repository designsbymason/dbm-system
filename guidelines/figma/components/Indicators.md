# Indicators in Figma

**What is drawn.** 54 variants on the Media page: a `variant` of `dots`, `outlined` or `bars`, three sizes (`sm`, `md`, `lg`), three states (`default`, `hover`, `focus`) and two orientations. Each is a group of five steps with the first one active. A `showLabel` boolean shows the progress label, and a text property `label` holds its text.

## Decisions

- **Five steps, the first active.** `count` and `activeIndex` are numbers that change the look, so by the rules they are not properties ([02-component-rules.md](../02-component-rules.md) §2). Five is the number the code's examples use, and the first being active shows the elongated or thicker active look next to four inactive steps. Both are recipes in the spec frame.
- **Sizes `sm`, `md` and `lg`, over the default.** `xs` (4 px) and `xl` (12 px) are recipes with the token to use. No exception is recorded: 3 × 3 × 3 × 2 = 54 is inside the budget.
- **`hover` and `focus` are one `state` property,** drawn on the step where each applies. The code styles hover only on an inactive step (`bg/neutral`, and for `outlined` a `border/strong` ring), so the second step is the hovered one. Focus follows the active step through the roving tabindex, so the ring is on the first step (`border/focus`, 2 px, 4 px outside).
- **The orientation is a variant property,** because it changes the shape of the frame, and `showLabel` is a boolean that shows or hides the label (the wrapper's gap, `space/4`, separates it from the steps).
- **Bars.** Every step is three times the dot size long; the active one is the full dot size thick and the inactive ones half of it, as in the stylesheet.
- **Steps are bound where the code binds them:** a step's width or height equal to the dot size is bound to `indicators/size/<size>`; three times that and half of it are numbers, as `calc()` results are elsewhere in the library.
- **The label reuses `Label/xs`** (semibold, 12 px) in `text/primary`; no new text style.

## Differences from the code

See `deviations` in the map. The one that matters: the inactive fill `bg/track-strong` is 1.72:1 on `bg/surface` in the light themes (3.00:1 in the dark ones), below the 3:1 non-text floor. The code uses the same token, and the token spec's `track-strong` row already says so; the component's Docs page and its review file still say it is verified at 3:1, which the numbers do not support (open item).

## Not drawn

The sizes `xs` and `xl`, the step count, the active step, hover on another step and the label's content. Each has a recipe in the spec frame's "In code, not drawn" section.

## Review

2026-11-26: reviewed, no findings. Checked on all 54 variants: the five steps, every step's size against the code (the dot size, three times it, half of it) with the dot-size ones bound to `indicators/size/*`, the radii, the fill or stroke of every step against its variant and state (the hovered second step, the outlined rings), the focus ring only on the focused variants, the spacings, the label's style, colour and its two property references, the six properties and their defaults, the grid (the default in the top-left cell), the description and documentation link, the section fill, the spec frame (the 29 matrix instances all from the set, the links, `9 of 14 props in code`, the token rows equal to the 15 variables the set binds) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/Indicators/Indicators.tsx`, `Indicators`) and read back on all 54 variants. Approved by the maintainer 2026-11-26.
