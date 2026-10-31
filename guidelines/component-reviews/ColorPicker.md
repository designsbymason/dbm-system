# ColorPicker — review findings

**Status:** Built 2026-10-31; the `06-engineering-standards.md` §9 review pass has not been run and the component is not Finalized (only the maintainer declares that).

## What was built

A color field: a swatch button that opens a panel, and a text entry that shows the color and takes a typed or pasted one ([ADR-0153](../adr/0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md)). The panel is a saturation and brightness area over two native range inputs ([ADR-0154](../adr/0154-colorpickers-saturation-and-brightness-area-is-a-pointer-surface-over-two-native-range-inputs-over-a-single-2d-slider-role.md)), a hue slider and an optional opacity slider on the Radix slider primitive ([ADR-0155](../adr/0155-colorpicker-draws-its-hue-and-opacity-sliders-on-the-radix-slider-primitive-in-an-internal-part-over-adding-a-track-slot-to-the-slider-molecule.md)), `swatches` and an opt-in eyedropper. `format` (`hex`, `rgb`, `hsl`, `oklch`), `alpha`, `commitOn`, `clearable`, `inline`, `side`/`align`/`presentation`, `name`/`required`/`form` with a hidden validating input, `labels`/`formatNumber`, `dir`. New tokens: `color-picker.*` (component layer) and `border.black` (semantic, all four themes).

## After the first build

- **A fixed-width text entry cut longer formats off** (`10ch`); sized per format it left spare room after short values. It now hugs its own text (an invisible copy of the text sizes the box) and, while the panel is open, keeps the widest text it has shown so a drag doesn't move its edge.
- **Changing `format` did not re-spell an uncontrolled value**, which had been stored already converted. It is held as written and re-spelled each render.
- **Format switch in the panel** (`showFormatSwitch`, controllable `format`, [ADR-0156](../adr/0156-colorpicker-lets-the-person-change-the-format-through-an-opt-in-switch-in-the-panel-with-a-controllable-format-that-re-spells-the-value-over-a-fixed-format-or-a-display-only-switch.md)). Found while testing it: a lossy spelling (HSL) echoed back by a controlled owner replaced the exact numbers, so hex to HSL and back changed the color by a unit; the hook now keeps the numbers when the new value is what they already write to.

## Verified when it was built

- Unit: 58 tests for the component, 26 for its server render and hydration, and 30 for the color maths (round trips, refusals, hue retention, gamut clipping); jest-axe closed, open, inline, at `xs` and in right-to-left; the Docs page's token table against the stylesheet; every snippet through the shared guard.
- Real browser (Chromium, `ColorPicker.checks.stories.tsx`, plus every story's axe run): a real mouse drag across the area with the thumb measured to the pixel and held at the edge; the thumb's two rings against black, white, mid-gray and red (one is at least 3:1 each time); text inserted all at once; a real mouse choosing a swatch inside a `Dialog` that stays open; button, swatch and thumb targets at 24 × 24px; the field's width unchanged as the text changes; right-to-left (area unmirrored, hue minimum at the right, `ArrowLeft` raises hue); the focus ring on the thumb for a real `Tab` and not for a press; forced colors (system colors on the thumbs and swatches, the area keeps its color); the panel's place and font, with `Escape` returning focus.
- `pnpm lint` (ESLint and both typechecks), the whole unit suite (12,081 tests), the component bundle-size check (8.89KB JS, 3.30KB CSS against the default 10KB), `check-guidelines` and `check-foundations-token-coverage`.

## Not done, to settle in the review pass

- A mutation check on each real-browser check (break the thing once, see it fail); only the pointer-capture finding came from a check failing for the right reason.
- Safari, Firefox, a real touch screen and a screen-reader pass; the eyedropper path was tested with a stub, not the real API.
- A look at the Docs page and every story in all four themes; the transparency checkerboard's two colors (`bg.track` and `bg.surface`) have not been contrast-checked as a pattern, only seen as a transparency cue.
- The panel's behaviour on a phone with an on-screen keyboard (`presentation="full-width"` shares `DatePicker`'s unverified assumption).
- No `Tooltip` on the swatches: they use the native `title`.
