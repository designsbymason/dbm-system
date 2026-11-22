# Card in Figma

**What is drawn.** 72 variants: four variants, tones `neutral` and `brand`, size `md` and five layouts at the default state (40), plus the hover, pressed, focus and disabled states, stacked (32). The media, header, body and footer are slots, and `divided` shows the lines between them. It is the pilot's test of slots and of nested instances.

## Decisions

- **`layout` is one property** for orientation, media position and whether media is used: `stacked`, `media-start`, `media-end`, `side-start` and `side-end`. A card without media looks the same in both orientations, so a combined axis has no duplicate combinations. It maps to `orientation` and `mediaPosition`, and to whether `Card.Media` is used (see the map).
- **Coverage: narrowed.** Only size `md` and tones `neutral` and `brand` are drawn, because a card's size only changes the section padding and its tone only the edge and the header tint, so each undrawn value (`xs`, `sm`, `lg`, `xl`; `info`, `success`, `warning`, `danger`) has a one-line recipe in the map and in the spec frame's "In code, not drawn" section ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)). The states are drawn at the stacked layout only: layout does not change what a state does. The first build drew all 696 combinations, a set 56,000 px tall, and is why the coverage rule exists.
- **`interactive` is not a property.** Hover, pressed, focus and disabled imply it. A clickable card is a link or button the app supplies with `asChild`, so the map and the spec frame say so.
- **The sections are slots.** They are built inside every variant before the variants are combined, so each slot becomes one property (verified on this set: four slot properties, not one per variant). Their default content is plain text and a grey media placeholder, so 696 variants stay light; the spec frame's composed example nests a Badge in a header and Buttons in a footer.
- **The dividers carry their own padding.** The code gives a section after a divider its top padding back; a boolean cannot change padding, so each divider is a 1 px line plus a spacing block of one padding unit, shown by `divided`. A toned card tints its header, so the divider under it is not drawn.
- **The wrapper and the card are two frames.** The card clips its media to the rounded corners; the focus ring sits outside it, in the wrapper, so it is not clipped. The card fills the wrapper's width, so an instance can be resized.
- **A transparent edge is no stroke and a 1 px padding.** The code's ghost card, and its elevated and filled cards with the neutral tone, have a transparent 1 px border. A stroke with opacity 0 lost its opacity on instances, so those 232 variants have no stroke and a padding bound to `border-width/1`, which keeps every variant the same size.
- **The ring's radius is `radius/xl`,** which is the card's `radius/lg` plus the 4 px offset, so nothing is unbound.

## Differences from the code

See `deviations` in the map: the combined `layout`, states at the stacked layout only, the light elevation styles (effect styles cannot switch with a theme), the fixed widths, a layout per frame instead of a responsive orientation, part props not modelled, and the footer following the body in the side layouts.

## Not drawn

`asChild`, the aria props and the passthrough props; `Card.Footer`'s `align`; a responsive orientation; the dark elevation (applied by hand); sizes `xs`, `sm`, `lg` and `xl` and the status tones (see the map's `undrawn`); states on layouts other than `stacked`.

## Review

2026-11-22 (second, after the coverage rule and the trims to 72 variants): re-reviewed. One finding, fixed: the four slot properties were named `Header`, `Body`, `Footer` and `Media` while the map and the spec frame say `header`, `body`, `footer` and `media`; they are renamed. Everything else passed: every combination present, the defaults, binding with nothing unbound, the slots per layout, the edges (no stroke on the transparent variants), the rings, the padding, the dividers and `divided`, the spec frame and its In code, not drawn section against the map, links and the Components row.

2026-11-22: reviewed. One finding, fixed: the transparent edges drew as a faint visible border on instances (see the decision above). Everything else passed: all 696 variants present with no gaps, every value bound, one set property for each of the four slots and for `divided`, the defaults equal to the code's, padding by size, the colours and shadows of each variant and state against the CSS, the spec frame and its links. Approval by the maintainer is pending. The first build was 4,690 by 56,264 px with about 9,700 layers, which led to the coverage rule; the set is now much smaller.
