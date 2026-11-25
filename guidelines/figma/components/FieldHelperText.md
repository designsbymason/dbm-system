# FieldHelperText in Figma

**What is drawn.** 2 variants: `state` `default` or `disabled`. A text property `text` holds the helper text. It is Nunito regular at the small size with the normal line height, in `text/tertiary`, or `text/disabled` when disabled.

## Decisions

- **No `size` or `tone` axis.** The stylesheet has one size and one colour per state, so the one variant property is `state` and there is no undrawn value ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **The existing `Body/sm` text style is reused.** It is Nunito regular at the small size with a 150% line height, which is what the stylesheet resolves to (20 px high), so no `Components/FieldHelperText` style was added.
- **The set hugs its text.** The code's paragraph is a block that fills its parent. A FormField instance sets the instance to fill and the text to wrap; the spec frame shows a 280 px instance wrapping onto two lines.
- **Gap and padding are bound to `space/0`,** as in [FieldLabel](./FieldLabel.md).

## Differences from the code

See `deviations` in the map: the hugging width, and no hover, focus or error style.

## Not drawn

Nothing from the code's props. `id` and the native paragraph attributes have no look and are not modelled.

## Review

2026-11-25: reviewed with no findings. Checked: both variants and the default as the top-left cell, the text on `Body/sm` and its fill, gap and padding bound (none unbound), the 20 px height against the 150% line height at the small size, the property binding in both variants, the spec frame (instance of the master, every slot filled, 3 matrix instances of this set, Tokens used equal to what the set binds, "4 of 6 props in code" against the manifest, both links), the set's description and documentation link, the Section fill and the Components row. Not checked: a dark theme render, and the Code Connect mapping, which waits for the maintainer to map the set. Approved by the maintainer 2026-11-25.
