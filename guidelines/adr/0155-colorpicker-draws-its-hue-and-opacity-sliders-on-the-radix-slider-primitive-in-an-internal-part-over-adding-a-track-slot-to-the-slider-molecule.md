# 0155 — `ColorPicker` draws its hue and opacity sliders on the Radix slider primitive in an internal part, over adding a track slot to the `Slider` molecule

**Status:** Accepted · **Date:** 2026-10-31

## Context
The inventory described `ColorPicker` as "Popover plus Slider". The `Slider` molecule is Finalized and draws a token-coloured track, a brand-coloured range and a plain white thumb. A hue strip needs a rainbow track with no filled range, and an opacity strip needs a gradient over a checkerboard, each with a thumb filled with the color it points at.

## Decision
The hue and opacity sliders are **the Radix slider primitive** (`@radix-ui/react-slider`, already a dependency) **drawn with the picker's own track and thumb classes in an internal part of `ColorPicker`**, not the `Slider` molecule. The primitive supplies the keys (arrows, `Shift`+arrow and `Page` by ten, `Home`/`End`), pointer and touch handling, `dir` and `aria-valuenow`; the picker supplies the gradients and thumbs, mirrored in a right-to-left page by reversing the gradient where Radix puts the minimum on the other side.

## Alternatives considered
- **Adding a track/thumb slot or a `trackBackground` prop to `Slider`.** Rejected: it reopens a Finalized molecule for a use only one component has (a prop that paints arbitrary colors undermines `Slider`'s "every value traces to a token" and its contrast reasoning), and it ties the picker to the molecule's size scale and tooltip and tick options it doesn't need.
- **A hand-rolled slider.** Rejected: the primitive already does the keys, `dir` and touch; rewriting them has no gain.
- **Reusing `Slider`'s stylesheet** (as `RangeSlider` does). Rejected: the two must not look identical; the picker's tracks are gradients.

## Consequences
- `Slider` and `RangeSlider` are untouched and stay Finalized.
- The picker's sliders have no size scale, value label or tooltip; the value is in the field's text and the thumbs' `aria-valuetext`.
- A third consumer that wants a painted track (a gradient editor) would justify extracting a shared part; until then the code stays in `ColorPicker`.

## Related
[ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md), [ADR-0154](./0154-colorpickers-saturation-and-brightness-area-is-a-pointer-surface-over-two-native-range-inputs-over-a-single-2d-slider-role.md); `component-reviews/Slider.md`, `component-reviews/RangeSlider.md`.
