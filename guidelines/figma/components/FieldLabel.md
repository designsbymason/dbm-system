# FieldLabel in Figma

**What is drawn.** 6 variants: three sizes (`sm`, `md`, `lg`) and two states (`default`, `disabled`). A boolean `required` shows the asterisk, and a text property `label` holds the text. The label hugs its text, in Nunito medium at the normal line height.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, both states at every size, 6 variants. `xs` and `xl` are listed as undrawn in the map with the text style to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)).
- **State has two values.** The stylesheet has only a `disabled` rule: no hover, focus, pressed or error style, so none is drawn.
- **A `Components/FieldLabel/*` text style was added** (five sizes, `xs` to `lg`, medium weight, the normal line height). No existing style fits: `Label/*` is semibold at the snug line height, `Body/*` is regular, and `Control/*` and `Field/*` use the tight one. The styles are named by the font-size token, so the drawn sizes `sm`, `md` and `lg` use `sm`, `base` and `md`, as the code's size scale does.
- **`required` is a boolean** because it only shows or hides a layer.
- **The marker is its own text layer** holding a space and an asterisk, as the code writes `{" "}*`, so it takes the label's style and needs no unbound gap. Gap and padding are bound to `space/0`.
- **The asterisk keeps `text/danger` when the label is disabled.** The code gives the asterisk its own colour, which overrides the dimmed colour the label inherits, so it is drawn the same way.

## Differences from the code

See `deviations` in the map: the marker's colour when disabled, the marker as a second text layer, the hugging width, and no hover or focus style.

## Not drawn

`xs` and `xl`, with a recipe in the map and the spec frame. `htmlFor` and the native label attributes have no look and are not modelled.

## Review

2026-11-25: reviewed with no findings. Checked: all 6 combinations and the axis order, the default `size=md, state=default` as the top-left cell, every text on a `Components/FieldLabel` style and every text fill, gap and padding bound (12 text layers and 30 spacing values, none unbound), the heights (24, 20 and 29 px) against the 150% line height at each font size, the property bindings in all 6 variants, the spec frame (instance of the master, every slot filled, 12 matrix instances of this set, Tokens used equal to what the set binds, "5 of 9 props in code" against the manifest, both links), the set's description and documentation link, the Section fill and the Components row, and the Code Connect mapping read back (path and name). Not checked: a dark theme render. Approved by the maintainer 2026-11-25.
