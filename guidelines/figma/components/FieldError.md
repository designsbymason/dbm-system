# FieldError in Figma

**What is drawn.** 2 variants: `state` `default` or `disabled`. A boolean `icon` shows the warning icon, and a text property `text` holds the message. The message is Nunito regular at the small size with the normal line height, in `text/danger`, or `text/disabled` when disabled.

## Decisions

- **No `size` or `tone` axis.** The stylesheet has one size and one colour per state, so the one variant property is `state` and nothing is undrawn ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **The existing `Body/sm` text style is reused,** as on [FieldHelperText](./FieldHelperText.md): the values are the stylesheet's.
- **The icon is a boolean on a nested `Icon/WarningCircle`,** bold (the Icon's code default) at 12 px (`icon-size/xs`), with its width and height bound to the variable. Its tone is `danger`, or `disabled` when disabled, set on each variant's own instance ([ADR-0238](../../adr/0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md)). The code gives the icon the text colour through `currentColor`, so the tone is how Figma gets the same colour. A custom glyph is swapped in place, with no swap property.
- **The icon and the text are centred on one line,** 4 px apart (`space/1`), as the code's inline flex does. The set hugs its content, and the spec frame shows a 280 px instance wrapping onto two lines.
- **The mount animation is not drawn.** A static frame has no motion.

## Differences from the code

See `deviations` in the map: the hugging width, the icon's tone variant standing for `currentColor`, the custom glyph swapped in place, and the animation.

## Not drawn

Nothing from the code's props. `id` and the native paragraph attributes have no look and are not modelled.

## Review

2026-11-25: reviewed with no findings. Checked: both variants and the default as the top-left cell, the text on `Body/sm` and its fill, gap, padding and the icon's width and height bound (none unbound), the 20 px height and the 103 px width against the stylesheet, the nested `Icon/WarningCircle` (bold, 12 px, tone `danger` on the default variant and `disabled` on the disabled one, shown by the `icon` boolean with no swap property), the property bindings in both variants, the spec frame (instance of the master, every slot filled, 5 matrix instances of this set, Tokens used equal to what the set binds, "4 of 7 props in code" against the manifest, both links), the set's description and documentation link, the Section fill and the Components row. Not checked: a dark theme render, and the Code Connect mapping, which waits for the maintainer to map the set. Approved by the maintainer 2026-11-25.
