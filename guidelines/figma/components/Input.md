# Input in Figma

**What is drawn.** 60 variants: five sizes, six states (default, hover, focus, error, error-focus, disabled), empty or filled. Optional prefix and suffix icons, a clear button and a character count, and text properties for the placeholder, the value and the count.

## Decisions

- **`Components/Field/*` text styles were added.** The field's text is regular weight at the tight line height; `Control/*` is semibold and `Body/*` has a 150% line height, which would make a field taller than a Button. The five styles live under `Components` ([plan §5](../01-plan.md)).
- **Same height as a Button at every size.** The code's `padding-block` is Button's minus the border, a `calc()`, so Figma draws the vertical padding as the number (7, 11, 11, 15, 15), unbound.
- **A fixed height per size.** The code's clear button has a padded hit area that a negative margin hides; Figma cannot do that, so the wrapper has the Button height and the clear icon is centred.
- **`filled` is a variant** because the text colour changes (`text/tertiary` when empty, `text/primary` when filled). It has no code prop of its own.
- **Two text properties, `placeholder` and `value`,** because one text property would force the same text onto empty and filled variants.
- **The focus ring is a layer** drawn on the field's own edge (2 px inside), as the code does, so the box does not change size. The error ring is danger-coloured.
- **The state `error-focus`** exists because the ring stays danger-coloured while the field is invalid.
- **Prefix and suffix are booleans with a nested icon** (tone `secondary`), swapped in place; a text affix is typed over the icon. A slot would carry the per-variant property trap.

## Differences from the code

See `deviations` in the map: `filled`, the fixed 280 px width and height, the clear button drawn as its icon only, and the states not drawn.

## Not drawn

Hover on `error` or `disabled` (no style in the CSS), `disabled` with `error`, `readOnly` (no style), and the clear button's own hover.

## Review

2026-11-22: reviewed; a link text that still said Button and two notes (width, clear button) were fixed. The edge colours are a known accessibility shortfall (`border.default` at rest, about 1.35:1; `border.neutral` on hover, 2.3:1), tracked in [open-items](../../open-items.md). Approval by the maintainer is pending.
