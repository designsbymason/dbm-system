# 0156 — `ColorPicker` lets the person change the format through an opt-in switch in the panel, with a controllable `format` that re-spells the value, over a fixed format or a display-only switch

**Status:** Accepted · **Date:** 2026-10-31 · Partly supersedes [ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md) on "one format per picker"; the rest of that decision stands.

## Context
[ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md) fixed the value's spelling by a `format` prop the app chooses. People who think in more than one spelling (a theme editor, a design tool) asked to change it from the panel. Changing the format changes the string the app receives, so it has to be something an app chooses to allow.

## Decision
- **`showFormatSwitch` (off by default) draws a row of buttons in the panel** (Hex, RGB, HSL, OKLCH) with `ToggleGroup`, a named `radiogroup` of one tab stop. Choosing one rewrites the field's text and reports the color in the new format through `onValueChange` and `onValueCommit`, and the new format through `onFormatChange`. With no color chosen only the format changes and no value is reported. Choosing the format that is already chosen does nothing.
- **`format` is controllable**: `format` / `onFormatChange` (controlled) and `defaultFormat` (uncontrolled, `"hex"`). A controlled `format` does not change until its owner follows `onFormatChange`.
- **A format change re-spells; it does not change the color.** An uncontrolled value is held as it was last written and spelled in the current format on each render, so a `format` changed from outside re-spells it too. A new value that is what the held hue, saturation and brightness already write to in the current format keeps those exact numbers, so a lossy spelling (HSL rounds to whole degrees and percents) never replaces them and switching back returns the color it started from.

## Alternatives considered
- **Keep one fixed format.** Rejected: it sends an app that wants the choice to build its own switch beside the field and keep it in step with the value.
- **A switch that changes only how the text is shown while the value stays in the first format.** Rejected: the field would show a color the value doesn't spell, so what a person reads and what is submitted disagree; the app that needs a fixed spelling leaves the switch off.
- **Turning the switch on by default.** Rejected: it changes the string an existing app receives.
- **A `Select` in the panel.** Rejected: four short choices in one row read faster than a list, and the row is already one tab stop.

## Consequences
- An app that uses the switch must be ready for the value in any of the four spellings, and can hold the format with `format` and `onFormatChange` to remember it.
- `ToggleGroup` is a dependency of `ColorPicker`'s bundle.
- `ColorPicker`'s `format` is no longer a plain prop with a default: the default moved to `defaultFormat`.

## Related
[ADR-0153](./0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md); `component-reviews/ColorPicker.md`.
