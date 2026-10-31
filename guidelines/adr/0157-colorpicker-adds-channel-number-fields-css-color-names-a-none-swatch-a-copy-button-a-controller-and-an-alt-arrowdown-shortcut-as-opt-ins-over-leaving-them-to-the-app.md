# 0157 — `ColorPicker` adds channel number fields, CSS color names, a "no color" swatch, a copy button, a controller and an `Alt`+`ArrowDown` shortcut, the first four as opt-ins, over leaving them to the app

**Status:** Accepted · **Date:** 2026-10-31

## Context
A feature-completeness pass found small, common gaps in `ColorPicker`: an exact number can only be typed as a whole color string; a typed `rebeccapurple` is refused; empty is only reachable through the field's clear button; a color can't be copied from the panel; the picker has no `controllerRef` although `05-component-api-conventions.md` §3 gives that to a component code must drive; the field has no keyboard way to open its panel, which a combobox and a date field have; and swatches name themselves with the browser's `title`, which shows on no touch screen and no keyboard focus.

## Decision
- **`showChannelInputs` (off by default)** draws a number field for each channel of the format in the panel: red, green and blue for `hex` and `rgb`; hue, saturation and lightness for `hsl`; lightness, chroma and hue for `oklch`; and opacity with `alpha`. A field keeps what is typed until it loses focus and applies a number as soon as it is in range (clamped), committing each time. The fields are drawn with `Input` at `xs`, without the browser's spin arrows (they take a third of a narrow field; the arrow keys do the same), and are **detached from a surrounding form** (`form=""`, an id that matches nothing) so a half-typed number never blocks a submit: the value a form sends is the picker's own. A hue typed into HSL is kept as the picker's hue even on a gray.
- **CSS color names are read**, always: typed text and values may be `rebeccapurple` or `transparent`, in any case, written back in `format`. The 148 names are a table of hex strings in `internal/color/`, read only through `Object.hasOwn` (so `constructor` is not a color), about 1.5KB. Only the sRGB spellings are read: `lab()`, `color()` and `display-p3` are not.
- **`noneSwatch` (off by default)** adds a first swatch that clears the value, pressed while the value is empty, drawn even with no other swatches.
- **`copyButton` (off by default)** copies the color in `format` to the clipboard and says "Color copied" (or that the browser refused) through the status region; it is off while no color is chosen.
- **`controllerRef`** gives code `open()`, `close()`, `focus()` and `isOpen()`, one object for the picker's life whose methods read the latest state and return whether they had anything to do. Only the ref, no hook: nothing of the caller's sits inside the picker (`05` §3).
- **`Alt`+`ArrowDown` in the text entry opens the panel**, as in a combobox and a date field. It is always on and does nothing when the picker is inline, disabled or read only.
- **Swatches name themselves with the `Tooltip` atom** instead of `title`: the name shows on hover and on keyboard focus.

## Alternatives considered
- **Leaving the channel fields to the app.** Rejected: they need the picker's own hue and the format's conversions to stay in step with the area.
- **A whole `labels` and `format` for every channel set.** Not done: the format already says which channels there are.
- **Color names behind an opt-in.** Rejected: a table that is read only on an unreadable string costs the bytes either way, and a field that refuses `red` is the surprise.
- **Keeping the browser's spin arrows.** Rejected: at the panel's width they clipped the longest OKLCH value.
- **A hook beside `controllerRef`.** Rejected by the rule in `05` §3: the picker has no parts of the caller's inside it.

## Consequences
- `ColorPicker`'s JS budget is 15KB (`06-engineering-standards.md` §4); it measured 13.31KB.
- The panel can be taller with every option on; the real-browser check measures that nothing is cut off or wider than the panel.
- A value typed as a name is stored in `format`, never as the name.

## Related
[ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md), [ADR-0156](./0156-colorpicker-lets-the-person-change-the-format-through-an-opt-in-switch-in-the-panel-with-a-controllable-format-that-re-spells-the-value-over-a-fixed-format-or-a-display-only-switch.md), [ADR-0076](./0076-form-rules-may-return-promises-and-the-form-is-reached-from-outside-by-a-controller-and-two-hooks-over-synchronous-rules-or-an-imperative-ref.md); `component-reviews/ColorPicker.md`.
