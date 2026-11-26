# Tooltip in Figma

**What is drawn.** 12 variants on the Overlay page, a new page: the bubble in its open state on each of the four `side`s and each of the three `align`s, with the arrow facing the trigger. A `showArrow` boolean turns the arrow off and a text property `content` holds the text.

## Decisions

- **The open state only.** An overlay is drawn as a static open state ([02-component-rules.md](../02-component-rules.md) §1); the delay, `open` and the animation are behaviour, so there is no `state` property.
- **`side` and `align` are variant properties,** because the arrow's place changes the shape. All four sides and all three alignments are drawn, so nothing is undrawn and the set is 12 variants.
- **The arrow lies outside the bubble.** The code puts the bubble 8 px (`space/2`) from the trigger and the arrow in that gap, so the arrow is an absolutely placed layer that sticks out of the bubble and the instance is the bubble's size. The spec frame says to place the instance 8 px from the trigger.
- **A Figma boolean shows a layer, so `hideArrow` is `showArrow`,** on by default; the map records that on is `hideArrow` off.
- **The arrow under `start` and `end`.** The code keeps the arrow at the trigger's centre, which depends on the trigger's width; the set puts it 16 px in from the edge and the recipe says to move it for a wide trigger.
- **`content` is a text property only.** The code takes any content, so rich content is a recipe.
- **The width.** The bubble hugs its text up to `tooltip/max-width` (320 px, the variable's own binding) and the text wraps there.
- **Text.** The existing `Body/xs` style (regular, 12 px, 150%) is the code's `font-size-xs` at the normal line height, so no style was added.

## Differences from the code

See `deviations` in the map: the open state only, the missing trigger, the arrow outside the bubble, its place under `start` and `end`, its size as numbers, and the boolean's name.

## Not drawn

The trigger, the arrow's place at the trigger's centre, rich content and the closed state. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings. Checked on all 12 variants: the bubble's fill, padding, corner radii and maximum width bound to `bg/neutral`, `space/1` and `space/2`, `radius/sm` and `tooltip/max-width`; the text on `Body/xs` in `text/on-neutral` with its `content` property reference; the arrow's fill, size, side (outside the bubble, facing the trigger), place along the edge for `center`, `start` and `end`, its absolute placement and its `showArrow` reference; the four properties and their defaults against the map; the grid (the default `side=top, align=center` in the top-left cell); the description and documentation link; the section fill; the spec frame (the 14 matrix instances all from the set, the long content wrapping at 320 px, the links, `11 of 15 props in code`, the token rows equal to the six variables the set binds) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/Tooltip/Tooltip.tsx`, `Tooltip`) and read back on all 12 variants. Approved by the maintainer 2026-11-26.
