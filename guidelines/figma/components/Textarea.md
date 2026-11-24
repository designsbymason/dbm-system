# Textarea in Figma

**What is drawn.** 36 variants: three sizes (`sm`, `md`, `lg`), six states (default, hover, focus, error, error-focus, disabled), empty or filled. Optional clear button and character count, and text properties for the placeholder, the value and the count. The box is three lines tall, the code's default `rows`.

## Decisions

- **Coverage: the defaults.** Sizes `sm`, `md` and `lg`, every state at every size, 36 variants. `xs` and `xl` are listed as undrawn in the map, with the text style, padding and icon size to apply ([ADR-0242](../../adr/0242-a-component-set-draws-a-core-of-values-with-every-state-at-every-drawn-size-and-documents-the-rest-over-drawing-every-combination-of-every-value.md)). Height (`rows`, `minRows`, `maxRows`, `autoResize`) and `resize` are behaviour and are not properties; the spec frame's "In code, not drawn" table gives a recipe for each.
- **`Components/Textarea/*` text styles were added.** A textarea sets no line height, so it falls back to the browser's `normal`, about 1.36 for Nunito, where `Components/Field/*` has the tight 1.15 Input and Button use. Drawing with Field would have made a three-line box about a fifth too short. The five styles have the Field sizes and an Auto line height (`scripts/figma-sync.mjs` writes it, and `90-verify.js` checks it); the heights come out at 64, 84 and 96 px for `sm`, `md` and `lg`, which the code's `rows=3` gives.
- **The edge is part of the layout.** A CSS border adds to the box and a Figma inside stroke does not, so the frame includes its stroke in the layout and the padding is the token itself (`space/1`, `space/2`, `space/3`, `space/4`), with no `calc()` offset as on Input.
- **`filled` is a variant** because the text colour changes (`text/tertiary` empty, `text/primary` filled), as on Input, with the same two text properties `placeholder` and `value`.
- **The focus ring is a layer** drawn on the field's own edge (2 px inside), and the state `error-focus` keeps it danger-coloured, as on Input.
- **The count is inside the box and grows it.** It sits below the text at the end, with a 4 px padding, so a variant with `showCount` on is taller by the count's height, as in the code.
- **The clear button is absolutely placed** in the top end corner, 4 px in, with a 4 px ring around its icon, and carries `Icon/X` with `tone=default` at the size's own step. The code's reserved end padding for the text is not drawn (the demo text is short).
- **Both booleans are booleans.** `clearable` and `showCount` only show or hide a layer, so they are not variants.

## Differences from the code

See `deviations` in the map: `filled`, the fixed 280 px width and three-line height, the Auto line height styles, the clear button's ring and unreserved text padding, the resize handle, and the states not drawn.

## Not drawn

Hover on `error` or `disabled` (no style in the CSS), `disabled` with `error`, `readOnly` (no style), the clear button's hover fill, and the corner resize handle.

## Review

2026-11-23: reviewed; one finding, applied. The `Count` and `Clear` frames carried the default white fill that `createAutoLayout()` gives, unbound, in all 36 variants (it would show as a white patch in a dark theme); both now have no fill, and a binding count over the 228 layers finds none unbound. Checked: all 36 combinations, defaults and the top-left default cell, property bindings in every variant, heights (64, 84, 96) and padding against the CSS, the icon tone, the rings on the 12 focus variants, the spec frame and its tables against the map and the manifest, links, the set's description and documentation link, and the Components row. Not checked: a dark theme render, and the heights against the running component. Approved by the maintainer 2026-11-23.
