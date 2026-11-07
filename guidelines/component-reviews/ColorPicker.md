# ColorPicker — review findings

**Status:** Finalized 2026-10-31, declared by the maintainer after the final review round below. Open at finalization: Safari, Firefox, a real touch screen, a screen reader, the real `EyeDropper` API, a second browser tab for `persistKey`, a phone with an on-screen keyboard, the Docs page in all four themes (two were looked at), the transparency checkerboard's contrast and the §5 sweep of every story's Controls (see "Not done").

## What was built

A color field: a swatch button that opens a panel, and a text entry that shows the color and takes a typed or pasted one ([ADR-0153](../adr/0153-colorpicker-is-a-field-and-a-trigger-less-popover-over-a-text-value-in-one-format-with-hand-rolled-color-maths-over-a-native-color-input-a-color-object-or-a-color-library.md)). The panel is a saturation and brightness area over two native range inputs ([ADR-0154](../adr/0154-colorpickers-saturation-and-brightness-area-is-a-pointer-surface-over-two-native-range-inputs-over-a-single-2d-slider-role.md)), a hue slider and an optional opacity slider on the Radix slider primitive ([ADR-0155](../adr/0155-colorpicker-draws-its-hue-and-opacity-sliders-on-the-radix-slider-primitive-in-an-internal-part-over-adding-a-track-slot-to-the-slider-molecule.md)), `swatches` and an opt-in eyedropper. `format` (`hex`, `rgb`, `hsl`, `oklch`), `alpha`, `commitOn`, `clearable`, `inline`, `side`/`align`/`presentation`, `name`/`required`/`form` with a hidden validating input, `labels`/`formatNumber`, `dir`. New tokens: `color-picker.*` (component layer) and `border.black` (semantic, all four themes).

## After the first build

- **A fixed-width text entry cut longer formats off** (`10ch`); sized per format it left spare room after short values. It now hugs its own text (an invisible copy of the text sizes the box) and, while the panel is open, keeps the widest text it has shown so a drag doesn't move its edge.
- **Changing `format` did not re-spell an uncontrolled value**, which had been stored already converted. It is held as written and re-spelled each render.
- **Format switch in the panel** (`showFormatSwitch`, controllable `format`, [ADR-0156](../adr/0156-colorpicker-lets-the-person-change-the-format-through-an-opt-in-switch-in-the-panel-with-a-controllable-format-that-re-spells-the-value-over-a-fixed-format-or-a-display-only-switch.md)). Found while testing it: a lossy spelling (HSL) echoed back by a controlled owner replaced the exact numbers, so hex to HSL and back changed the color by a unit; the hook now keeps the numbers when the new value is what they already write to.

- **Gap list items 2 to 11** ([ADR-0157](../adr/0157-colorpicker-adds-channel-number-fields-css-color-names-a-none-swatch-a-copy-button-a-controller-and-an-alt-arrowdown-shortcut-as-opt-ins-over-leaving-them-to-the-app.md)): channel number fields, CSS color names, a "no color" swatch, a copy button, `controllerRef`, `Alt`+`ArrowDown`, swatch tooltips through `Tooltip`; each checked as below. Found while building: the number fields' spin arrows clipped the longest OKLCH value in the panel's width (removed), and `Input`'s box, not the native input, is the 24px target.
- **Mutation checks** on the real-browser checks (the code or stylesheet each guards was broken once, the check run, and the code put back): the drag, the thumb rings, the Dialog stacking, button targets, the thumb's touch target, right-to-left, the thumb's focus ring, forced colors, the panel's font, `Alt`+`ArrowDown`, the swatch tooltip, the format switch, inserted text, the panel fit with every option on and the real clipboard all fail when broken. Three first "survived" because the mutation was overridden by a later declaration or the test pattern matched nothing, and were redone.
- **Looked at** in Storybook: dark and light, purple and emerald, with every option on, and at 375px with `presentation="full-width"`. The empty state draws the area and thumbs at the default red until a color is chosen; the format switch's chosen button is a soft tint (`ToggleGroup`'s own `subtle` look).

- **Recent colors** (`showRecent`, `recentColors`, `persistKey`, `storage`, `controller.clearRecent()`, [ADR-0158](../adr/0158-colorpicker-keeps-its-recent-colors-in-the-picker-in-the-browser-through-use-recent-commands-or-in-the-app-over-a-fixed-storage-or-recording-every-drag-step.md)): reuses `useRecentCommands`; unit tests cover the cap, repeats, formats, the app's and the browser's lists, `sessionStorage`, clearing, the dev warning and hydration; a real-browser check presses a swatch, reads the real storage and measures the row (and it fails when the storage write is removed). Not done: the other tab's `storage` event with a real second tab, and a look at the row in the four themes.

## Final review round

Eight findings, all fixed or settled:

- **The panel took an enclosing `ButtonGroup`'s settings.** It is portaled and a context crosses a portal; inside a disabled group its copy button came out disabled. The floating and inline panels are wrapped in `ButtonGroupReset` ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)), with a test of a disabled, enlarged group around an open picker (it fails without the wrapper).
- **Development warnings repeated on every render** (the "no accessible name" warning went from one to four while typing three characters). Each is now an effect with its own dependencies and is said once per change, with a test that typing repeats none.
- **Closing a panel opened with `Alt`+`ArrowDown` put focus on the swatch button.** It now returns to where it was opened from: the text entry for the shortcut, the button for the button. The real-browser check asserted the old behavior and was changed.
- **A channel field's visible letter was not a word of its accessible name** ("R" under a field named "Red"; WCAG 2.5.3, [ADR-0112](../adr/0112-an-interactive-controls-accessible-name-holds-its-visible-text-as-whole-words-in-order-over-a-name-that-only-means-the-same.md)). The name is now "R, Red" (a name that already holds the letter, such as "Hex code" under "Hex", is used as it is).
- **A test named for label-in-name only asserted the entry's value.** It now checks that every format button's text and every channel field's letter is a whole word of its name.
- **Dead code:** an unused `brightness` ref is gone, and the unused `formatControlled` snippet has a story ("Format held by the app").
- **This file was out of date**; it is current.
- **Two design questions, settled by documenting them:** with no color chosen the area and sliders rest at a bright red (the field says "No color"); and the area's `touch-action: none`, which a two-dimensional drag needs, means a finger starting on it does not scroll the page, which matters for an inline picker in a long page. Both are on the Docs page.

## Verified

- Unit: 242 tests for the component, its server render and hydration, and the color maths; jest-axe closed, open, inline, at `xs`, in right-to-left and with every option on; the Docs page's token table against the stylesheet; every snippet through the shared guard. The whole unit suite is 12,169 tests.
- Real browser (Chromium, `ColorPicker.checks.stories.tsx`, plus every story's axe run): 47 stories and checks, among them a real mouse drag with the thumb measured to the pixel, the thumb's two rings against black, white, mid-gray and red, text inserted all at once, a real mouse choosing inside a `Dialog`, target sizes, the right-to-left layout, forced colors, the panel's place and font, the format switch, the recent row against the real `sessionStorage`, the copy button's call to the real clipboard API, a phone-pinned and a desktop-pinned presentation, and every option on at once. Every one of these was proved by breaking the code it guards once and watching it fail; three first appeared to survive because the mutation was overridden or the test filter matched nothing, and were redone.
- Live: the Docs page in purple light and emerald dark (all ten sections, 25 canvases, all 27 "Show code" blocks read after settling), and the Playground in all four themes and at 375px with the full-width presentation.
- `pnpm lint` (ESLint and both typechecks), the component bundle-size check (14.14KB JS and 4.27KB CSS against a 15KB JS budget), `check-guidelines` and `check-foundations-token-coverage`.

## Not done

- Safari, Firefox, a real touch screen and a screen-reader pass; the eyedropper was tested with a stub, not the real API.
- A real second tab for `persistKey`'s cross-tab sync.
- The panel on a phone with an on-screen keyboard open, and a real finger dragging the area: the layout was checked at 375px in an emulated viewport only.
- The Docs page in all four themes (two were looked at); the transparency checkerboard's two colors (`bg.track` and `bg.surface`) have not been contrast-checked as a pattern, only seen as a transparency cue.
- The §5 sweep that drives every Controls-panel control of every story through the preview channel (the Playground's were driven).

## Reads the nearest DirectionProvider (2026-11-06)
Additive, at explicit direction ([ADR-0177](../adr/0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0182](../adr/0182-appshell-grows-a-busy-main-a-whole-page-state-and-a-layer-ladder-and-direction-reaches-the-shell-sidebar-and-navbar-through-a-provider.md)): `dir` left out now follows the nearest `DirectionProvider`; with none, nothing changes (the page's direction, or a Radix `DirectionProvider`, still applies as before). The `dir` JSDoc, the Controls description and the Docs text say so; a test covers it. Finalized status is unchanged.
