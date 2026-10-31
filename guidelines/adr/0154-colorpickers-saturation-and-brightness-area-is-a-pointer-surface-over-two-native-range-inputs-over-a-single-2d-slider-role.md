# 0154 — `ColorPicker`'s saturation and brightness area is a pointer surface over two native range inputs, over a single 2D slider role

**Status:** Accepted · **Date:** 2026-10-31

## Context
The area is a two-axis control: the pointer moves a thumb in two dimensions, and WAI-ARIA has no role for a two-dimensional slider. It had to be reachable by keyboard and by a screen reader, announce both values, and take a value set by assistive technology.

## Decision
The area is a surface the pointer drags across (hand-rolled pointer handling with capture, writing one position, `touch-action: none`), with **two visually hidden native `<input type="range">` under it, named Saturation and Brightness**, each read as a percentage. The thumb is a picture of both. Either input takes all four arrow keys (Left and Right change saturation, Up and Down brightness), `Shift` moves by ten, `Page Up`/`Page Down` change brightness by ten, `Home`/`End` set the focused axis to its least and greatest, and a change that is not a key (assistive technology setting the value) is read from the input's own change. A press on the surface focuses the saturation input and moves the thumb; the thumb shows a keyboard focus ring only for `:focus-visible` on either input. The area never mirrors in a right-to-left page: a color space is not text, so Left and Right always mean less and more saturation.

## Alternatives considered
- **One `role="slider"` with 2D arrow keys and a value text of both.** Rejected: a slider has one value (`aria-valuenow`), so assistive technology can only adjust one axis through its own gestures, and the second would exist only in the value text.
- **Two `role="slider"` spans.** Rejected: the same behaviour as native range inputs with the keys, `aria-valuenow`, increments and assistive-technology adjustment written by hand. The same reasoning as [ADR-0041](./0041-ratinginput-is-a-native-radio-group-with-two-radios-per-icon-at-half-steps-over-a-slider-role.md): a native control gives the behaviour the role promises.
- **A single tab stop through the area.** Not done: two inputs are two tab stops, which is what two values announced separately cost; either one steers both axes, so a keyboard user can stop at the first.

## Consequences
- The area has two tab stops (Saturation, then Brightness), then the hue slider.
- Real-browser checks drive a real mouse drag (the pointer must be sent with its button, or the browser releases capture on the first move) and measure the thumb to the pixel, and a real `Tab` shows the focus ring (a synthetic one leaves the page in pointer modality).

## Related
[ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md), [ADR-0151](./0151-imageviewer-zooms-with-hand-rolled-pointer-and-wheel-gestures-writing-one-transform-from-a-view-held-in-a-ref-over-native-scroll-zoom-a-pan-zoom-dependency-or-state-per-move.md); `component-reviews/ColorPicker.md`.
